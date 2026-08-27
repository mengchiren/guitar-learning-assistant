# -*- coding: utf-8 -*-
"""成田课件 PDF 文本层抽取器（v0.15.x GP5 管线的前身——PDF 与 GP 二进制走不同管线，
这份针对「打谱软件导出的矢量文本 PDF」，目标是把逐拍和弦注记 / 技巧标签 /
轨名分段完整抽出来，供人工复核扩充谱面或交叉校验已有手工录入。

用法：spike/.venv/Scripts/python.exe spike/pdf_sheet_extract.py [pdf路径] [输出json路径]
默认：GP文件/梦的出口（中级课毕业曲）.pdf -> spike/pdf_chords_mengde.json
"""
import sys, os, re, json
from collections import defaultdict

sys.stdout.reconfigure(encoding="utf-8")
try:
    import pymupdf as fitz
except ImportError:
    import fitz  # 旧名兜底

CHORD_RE = re.compile(
    r"^[A-G](?:[#b])?(?:maj7|maj9|maj|min7|min|dim|aug|sus2|sus4|add9|add11|M7|m7|m6|6|7|9|11|13)?$"
)
MARKER_RE = re.compile(r"^(Clean|Dist\.|Distort(?:ion)?|Overdriv\w*|Acoustic|Lead|Rhythm|Solo)\S*( ?[A-Za-z.]+)*$")
TECH_WORDS = {"let ring", "P.M."}
RADICAL_FIXES = {"出又": "出口"}


def norm(t):
    t = ud_norm(t)
    for k, v in RADICAL_FIXES.items():
        t = t.replace(k, v)
    return t.strip()


def ud_norm(t):
    import unicodedata
    return unicodedata.normalize("NFKC", t)


def main():
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "GP文件/梦的出口（中级课毕业曲）.pdf"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "spike/pdf_chords_mengde.json"
    doc = fitz.open(pdf_path)

    # 行带模型：同一页内 y 相差 <6pt 的词合并为一「行」，行内按 x 排序拼词（保留原始词表）
    bands = []  # [{page,y0,words:[{x,t}],line}]
    by_key = {}
    order = []
    for pi, page in enumerate(doc):
        for w in page.get_text("words"):
            x0, y0, _x1, _y1, txt = w[:5]
            key = (pi, round(y0 / 6))
            b = by_key.get(key)
            if b is None:
                b = {"page": pi, "y": y0, "words": [], "line": ""}
                by_key[key] = b
                order.append(b)
            b["words"].append((x0, norm(txt)))
    for b in order:
        b["words"].sort(key=lambda w: w[0])
        b["line"] = " ".join(t for _, t in b["words"])
        # 行级修正：字体替换造成的标题错字
        for k, v in RADICAL_FIXES.items():
            b["line"] = b["line"].replace(k, v)
    bands = order

    raw_title = fixed_title = ""
    meta = {"bpm": None, "tuning": None, "timeSig": None}
    for i, b in enumerate(bands):
        L = b["line"]
        m = re.search(r"(梦的出\S*)", L)
        if m and not raw_title:
            raw_title = m.group(1)
            fixed_title = raw_title.replace("又", "口") if "出又" in raw_title else raw_title
        if "Standard tuning" in L:
            meta["tuning"] = "Standard"
        mm = re.search(r"=\s*(\d{2,3})\b", L)
        if mm and meta["bpm"] is None:
            meta["bpm"] = int(mm.group(1))
        ms = re.match(r"^(\d/\d)$", L.strip())
        if ms:
            meta["timeSig"] = ms.group(1)

    # 正文锚点：包含 '= NN' 的那一行之后才计入流；其前的和弦行是谱头指法摘要
    body_start_index = next((i for i, b in enumerate(bands) if re.search(r"=\s*\d{2,3}\b", b["line"])), -1)

    head_chords = []
    body_chords = []
    tech_stream = []
    fx_freq = {}
    markers_seq = []
    for idx, b in enumerate(bands):
        in_body = idx > body_start_index
        # 多词技巧（let ring）只能按行匹配；P.M. 单词即可
        lr = b["line"].lower()
        if "let ring" in lr:
            cnt = lr.count("let ring")
            if in_body:
                tech_stream.append({"p": b["page"], "y": round(b["y"], 1), "t": "let ring"})
            fx_freq["let ring"] = fx_freq.get("let ring", 0) + cnt
        for (_x, t) in b["words"]:
            if not t or t.startswith("="):
                continue
            if CHORD_RE.match(t):
                (body_chords if in_body else head_chords).append({"p": b["page"], "y": round(b["y"], 1), "t": t})
            elif t == "P.M.":
                if in_body:
                    tech_stream.append({"p": b["page"], "y": round(b["y"], 1), "t": "P.M."})
                fx_freq["P.M."] = fx_freq.get("P.M.", 0) + 1
            elif MARKER_RE.match(t):
                markers_seq.append({"p": b["page"], "y": round(b["y"], 1), "text": t})

    def collapse(seq):
        out = []
        for item in seq:
            tok = item.get("t", item.get("text"))
            prev = out[-1] if out else None
            if prev and prev.get("t", prev.get("text")) == tok:
                continue
            out.append(item)
        return out

    payload = {
        "sourcePdf": os.path.basename(pdf_path),
        "pages": doc.page_count,
        "title": {"raw": raw_title, "fixed": fixed_title},
        "meta": meta,
        "headChordRow": [c["t"] for c in head_chords],
        "chordStreamRaw": [{"p": c["p"], "t": c["t"]} for c in body_chords],
        "chordStream": collapse(body_chords),
        "techStream": collapse(tech_stream),
        "fxTokenFreq": fx_freq,
        "markerSequenceCollapsed": [m["text"] for m in collapse(markers_seq)],
        "markerOccurrences": [m["text"] for m in markers_seq],
    }
    json.dump(payload, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    per_page_chords = defaultdict(int)
    for c in body_chords:
        per_page_chords[c["p"]] += 1
    print("抽取完成 ->", out_path)
    print("标题:", raw_title, "=>", fixed_title)
    print("meta:", meta)
    print("谱头摘要行:", head_chords and " ".join(c["t"] for c in head_chords))
    print("正文和弦总数:", len(body_chords), " 各页分布:", dict(per_page_chords))
    print("折叠后:", " ".join(c["t"] for c in payload["chordStream"]))
    print("技巧流折叠后:", " ".join(c["t"] for c in payload["techStream"]))
    print("轨名出现序列:", payload["markerOccurrences"], "-> 折叠:", payload["markerSequenceCollapsed"])
    print("fx 频次:", fx_freq)


if __name__ == "__main__":
    main()
