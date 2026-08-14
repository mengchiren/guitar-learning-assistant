# -*- coding: utf-8 -*-
"""
M0 spike：音频 → 调性/BPM/和弦 → 音色套路 → 设备参数建议
用法: python analyze.py <音频文件>
输出: JSON（调性/BPM/粗略和弦/套路归类/设备参数建议）
"""
import sys, json, os
import numpy as np
import librosa

PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Krumhansl-Schmuckler 调性模板（大调/小调）
MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

# 音色套路模板库（通用参数，示例按 JOYO Jam Buddy 2 标注）
TEMPLATES = {
    "清音伴奏":      {"通道": "Clean", "箱模": "Clean", "Gain": 3, "EQ": "平", "MOD": "关", "Delay": "关", "Reverb": "Hall 轻", "吉他档位": "1~3（琴颈/中间）"},
    "清音+合唱氛围": {"通道": "Clean", "箱模": "Clean", "Gain": 3, "EQ": "平", "MOD": "Chorus 轻", "Delay": "关", "Reverb": "Hall 中", "吉他档位": "1 或 2"},
    "轻过载节奏":    {"通道": "Rhythm", "箱模": "Blues", "Gain": 5, "EQ": "B+1 M0 T0", "MOD": "关", "Delay": "关", "Reverb": "Hall 轻", "吉他档位": "4~5"},
    "失真节奏 Riff": {"通道": "Rhythm", "箱模": "Rock", "Gain": 6, "EQ": "B0 M0 T+1", "MOD": "关", "Delay": "关", "Reverb": "Hall 轻", "吉他档位": "5（琴桥双线圈）"},
    "失真主音 Solo": {"通道": "Lead", "箱模": "Rock", "Gain": 7, "EQ": "B0 M+1 T+1", "MOD": "关", "Delay": "Analog 轻", "Reverb": "Hall 中", "吉他档位": "5"},
}


def estimate_key(chroma):
    scores = []
    for i in range(12):
        scores.append((np.corrcoef(chroma, np.roll(MAJ, i))[0, 1], PITCH[i] + " 大调"))
        scores.append((np.corrcoef(chroma, np.roll(MIN, i))[0, 1], PITCH[i] + " 小调"))
    scores.sort(key=lambda x: -x[0])
    return [{"key": k, "corr": round(float(c), 3)} for c, k in scores[:3]]


def rough_chords(chroma, n_windows=48):
    """粗略和弦估计：对每帧 chroma 做大小三和弦模板匹配，合并相邻相同结果"""
    tmpl = {}
    for i, p in enumerate(PITCH):
        t = np.zeros(12); t[i] = 1; t[(i + 4) % 12] = 0.6; t[(i + 7) % 12] = 0.6; tmpl[p] = t
        t = np.zeros(12); t[i] = 1; t[(i + 3) % 12] = 0.6; t[(i + 7) % 12] = 0.6; tmpl[p + "m"] = t
    idxs = np.linspace(0, chroma.shape[1] - 1, n_windows).astype(int)
    seq = []
    for i in idxs:
        col = librosa.util.normalize(chroma[:, i])
        best, bs = None, -1
        for n, t in tmpl.items():
            s = float(col @ t)
            if s > bs:
                bs, best = s, n
        if not seq or seq[-1][0] != best:
            seq.append([best, 1])
        else:
            seq[-1][1] += 1
    return [f"{c}{'x'+str(n) if n > 1 else ''}" for c, n in seq if n >= 2][:20]


def classify(r):
    """原型版套路归类规则（启发式，后续用真实歌曲数据调优）"""
    bpm, en, cen = r.get("tempo_use_bpm", r["tempo_bpm"]), r["rms_db"], r["centroid_hz"]
    if bpm >= 140 and en > -14: return "失真节奏 Riff"
    if cen > 2600 and en > -16: return "失真主音 Solo"
    if en > -16: return "轻过载节奏"
    if bpm >= 110 and cen > 1500: return "清音+合唱氛围"
    return "清音伴奏"


def main(path):
    y, sr = librosa.load(path, sr=22050, mono=True)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    tempo = float(np.atleast_1d(tempo)[0])
    # 速度修正：beat_track 对快速歌曲常输出“半速”（<100），直接加倍即为真实速度。
    # 实测 5 首真实歌曲（真实 123~200 BPM）：修正后误差 ≤1.5%
    # （局限：真实速度 <100 的慢歌会被误判，后续可用节拍强度比较法区分）
    tempo_use = tempo * 2 if tempo < 100 else tempo
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = librosa.util.normalize(chroma.mean(axis=1))
    rms = float(np.sqrt(np.mean(librosa.feature.rms(y=y)[0] ** 2)))
    cent = float(librosa.feature.spectral_centroid(y=y, sr=sr)[0].mean())
    r = {
        "file": os.path.basename(path),
        "duration_sec": round(float(len(y) / sr), 1),
        "tempo_bpm": round(tempo, 1),
        "tempo_use_bpm": round(tempo_use, 1),
        "beats": len(beats),
        "key_top3": estimate_key(chroma_mean),
        "chords_rough": rough_chords(chroma),
        "rms_db": round(float(20 * np.log10(rms + 1e-9)), 1),
        "centroid_hz": round(cent),
    }
    r["tone_template"] = classify(r)
    r["device_suggestion"] = TEMPLATES[r["tone_template"]]
    print(json.dumps(r, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
