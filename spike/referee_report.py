# -*- coding: utf-8 -*-
"""裁判对比报告：把三份数据摆到一张桌子上——
①spike/batch_analyze_result.json（前端自研引擎批量结果）
②spike/referee_result.json（librosa 第二裁判）
③app/src/data/seedSongs.json（当前种子库权威值，含人工/外部来源标注）

八度折叠后给「建议对齐比」：两路引擎天生会互相报半速/倍速，先折叠再比对，
剩下的非整数比差异才是真疑点。悬案歌与种子值一并打印供人工裁决。
用法：spike/.venv/Scripts/python.exe spike/referee_report.py
"""
import sys, json, os

sys.stdout.reconfigure(encoding="utf-8")

RATIOS = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 3, 4]
DISPUTES = ["天使にふれたよ!", "青春コンプレックス", "ソラノムジカ"]


def fold_ratio(front, ref):
    """返回 (bestFactor, label, devPct)：把前端值折到裁判的八度上最近的和谐比。"""
    if not ref:
        return None, "?", 999
    best_f, best_dev = None, 999
    for r in RATIOS:
        # 检验 front 是否 = ref * r（±容差内），即考虑全部八度/三连关系后找最贴合的
        dev = abs(front / ref - r)
        if dev < best_dev:
            best_f, best_dev = r, dev
    return best_f, fmt_ratio(best_f), best_dev * 100


def fmt_ratio(r):
    names = {0.25: "1/4", 1 / 3: "1/3", 0.5: "1/2", 2 / 3: "2/3", 0.75: "3/4",
             1: "1×", 1.5: "3/2", 2: "2×", 3: "3×", 4: "4×"}
    return names.get(round(r, 4), str(r))


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    batch = {r["file"]: r for r in json.load(open(os.path.join(root, "spike/batch_analyze_result.json"), encoding="utf-8"))}
    referee = {}
    p = os.path.join(root, "spike/referee_result.json")
    if os.path.exists(p):
        referee = {r["file"]: r for r in json.load(open(p, encoding="utf-8"))}
    seeds = json.load(open(os.path.join(root, "app/src/data/seedSongs.json"), encoding="utf-8"))
    seed_map = {}  # file -> seed：只拿「歌手 - 歌名」右侧的歌名部分做包含匹配，
    # 避免歌名叫专辑名的（如《Ave Mujica》）把同艺术家全部文件都误挂上同一个种子值
    for s in seeds:
        t = s.get("title", "")
        if len(t) < 3:
            continue
        for f in batch:
            name_part = f.split(" - ", 1)[-1] if " - " in f else f
            if t in name_part:
                seed_map[f] = s

    rows, agree = [], 0
    for f in sorted(batch):
        b = batch[f]
        rf = referee.get(f)
        if not rf or rf.get("error"):
            rows.append((f, batch.get("file") and b["bpm"], None, None, "⚠ 裁判缺/失败"))
            continue
        front = b["bpm"]
        ref_med = rf.get("tempoMedian")
        factor, label, devpct = fold_ratio(front, ref_med)
        status = ("✓ 一致" if abs(devpct) < 6 else
                  ("× 八度折叠差异" if abs(devpct) < 12 else "⚠ 非整倍数差异")) if factor else "—"
        if abs(devpct) < 6:
            agree += 1
        mark = ""
        seed_bpm = ""
        s = seed_map.get(f)
        if s:
            seed_bpm = f" 种子:{s['bpm']}({s.get('dataFrom','')[:14]}…)"
            if any(d in s.get("title", "") for d in DISPUTES):
                mark = " 🔎"
        elif any(d in f for d in DISPUTES):
            mark = " 🔎(无种子匹配)"
        rows.append((f + mark, front, f"{ref_med}/{rf.get('tempoBeatTrack')}", f"{label}{'' if factor is None else f'({devpct:.1f}%)'}{seed_bpm}", status))

    print(f"两路引擎共分析 {len(batch)} 首；八度折叠后完全一致（<6%）{agree} 首\n")
    print("| 文件 | 前端BPM | 裁判 中位/拍点 | 折叠比(残差)·种子值 | 状态 |")
    print("|---|---|---|---|---|")
    for r in rows:
        f_, fr, rm, ratio, st = r
        print(f"| {f_} | {fr if fr is not None else '—'} | {rm if rm else '—'} | {ratio if ratio else '—'} | {st} |")


if __name__ == "__main__":
    main()
