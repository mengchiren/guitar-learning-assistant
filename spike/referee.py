# -*- coding: utf-8 -*-
"""独立第二裁判（v0.15.1 工具）：用 librosa 原生算法路径给所有本地音频做一次
「 BPM（两种聚合）+ CQT chroma K-S 调性」估计，与前端自研引擎对拍。

为什么它有资格当裁判：与 app/src/utils/analyze.js 完全不同的实现——
 onset 包络用 librosa 原生、tempo 用其 tempogram 多候选聚合中位数 +
 beat_track 双口径、chroma 用真 CQT（引擎内是 STFT 近似）。两路独立，
分歧即疑点信号；但它同样不是权威——最终裁决仍按「人工听感优先」的产品策略。
只在本地跑（spike/.venv），不进 CI、不进部署包、无新依赖。

用法：
  spike/.venv/Scripts/python.exe spike/referee.py                 # 全量（可断点续跑）
  spike/.venv/Scripts/python.exe spike/referee.py --limit 5      # 只补 5 首
输出：spike/referee_result.json（数组，逐文件追加）
"""
import sys, os, json, glob, argparse

sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import librosa

PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
AUDIO_EXTS = ('*.mp3', '*.flac', '*.wav', '*.m4a')


def corr(a, b):
    d = np.std(a) * np.std(b)
    return 0.0 if d == 0 else float(np.corrcoef(a, b)[0, 1])


def top_keys(chroma_mean):
    v = chroma_mean / max(1e-9, np.std(chroma_mean))
    s = []
    for i in range(12):
        s.append((f"{PITCH[i]} 大调", corr(v, np.roll(MAJ, i))))
        s.append((f"{PITCH[i]} 小调", corr(v, np.roll(MIN, i))))
    s.sort(key=lambda x: -x[1])
    margin = round(s[0][1] - s[1][1], 3)
    keys = [{"key": k, "corr": round(c, 3)} for k, c in s[:3]]
    conf = "高" if margin >= 0.2 else ("中" if margin >= 0.05 else "低")
    return keys, conf


def _load(path):
    try:
        return librosa.load(path, mono=True, sr=22050)
    except Exception:
        # 个别 mp3 编码 libsndfile 解不动（本次实测 2 首）——ffmpeg 统一转临时 wav 再载
        import subprocess, tempfile
        tmp = os.path.join(tempfile.gettempdir(), "referee_tmp.wav")
        ff = glob.glob(os.path.join(os.path.dirname(__file__), ".venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-*.exe"))
        exe = ff[0] if ff else "ffmpeg"
        subprocess.run([exe, "-y", "-i", path, "-ac", "1", "-ar", "22050", tmp],
                       capture_output=True, check=True)
        y, sr = librosa.load(tmp, mono=True, sr=22050)
        os.remove(tmp)
        return y, sr


def analyze_file(path):
    y, sr = _load(path)
    dur = round(len(y) / sr, 1)
    onset = librosa.onset.onset_strength(y=y, sr=sr)

    # 双口径 tempo：多候选聚合中位数 + beat_track 主值。
    # librosa 1.0 移除了公开 tempo()（坑 7），聚合口径走私有的 _tempo；不可用就只留主值
    def _median_tempo(**kw):
        fn = getattr(librosa.beat, "_tempo", None)
        if fn is None:
            return None
        t = fn(**kw)
        return round(float(np.atleast_1d(t)[0]), 1)

    tempo_median = _median_tempo(onset_envelope=onset, sr=sr, aggregate=np.median)
    bt_tempo, _beats = librosa.beat.beat_track(onset_envelope=onset, sr=sr)
    bt_tempo = round(float(np.atleast_1d(bt_tempo)[0]), 1)

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    keys, key_conf = top_keys(chroma.mean(axis=1))

    return {
        "file": os.path.basename(path),
        "durationSec": dur,
        "tempoMedian": tempo_median,
        "tempoBeatTrack": bt_tempo,
        "keyTop3": keys,
        "keyConf": key_conf,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dirs", nargs="+", default=["歌曲文件"])
    ap.add_argument("--out", default="spike/referee_result.json")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    done = {}
    if os.path.exists(args.out):
        try:
            for row in json.load(open(args.out, encoding="utf-8")):
                done[row["file"]] = row
        except Exception:
            pass

    files = []
    for d in args.dirs:
        for ext in AUDIO_EXTS:
            files.extend(glob.glob(os.path.join(d, ext)))
    todo = [f for f in sorted(files) if os.path.basename(f) not in done]
    if args.limit:
        todo = todo[: args.limit]

    print(f"共 {len(files)} 个音频文件，已完成 {len(done)}，本次处理 {len(todo)}")
    for i, f in enumerate(todo, 1):
        base = os.path.basename(f)
        try:
            row = analyze_file(f)
            done[base] = row
            print(f"[{i}/{len(todo)}] ✓ {base}  tempo={row['tempoMedian']}/{row['tempoBeatTrack']}  key={row['keyTop3'][0]['key']}")
        except Exception as e:
            print(f"[{i}/{len(todo)}] ✗ {base}: {type(e).__name__} {e}")
            done[base] = {"file": base, "error": f"{type(e).__name__}: {e}"}
        # 逐个落盘：中途中断不丢已完成进度
        json.dump(list(done.values()), open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n完成，结果写入 {args.out}（{len(done)} 条）")


if __name__ == "__main__":
    main()
