# -*- coding: utf-8 -*-
"""调性估计改进实验：K-S vs Temperley 模板 × 帧均值 vs 节拍同步聚合
用法: python key_check.py <音频文件>   （已知标准答案：no_thank_you.wav 实际为 A 小调）
"""
import sys
import numpy as np
import librosa

PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
PROFILES = {
    'KS_maj': np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]),
    'KS_min': np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]),
    'TP_maj': np.array([5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0]),
    'TP_min': np.array([5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0]),
}


def top(chroma):
    out = []
    for pname, prof in PROFILES.items():
        for i in range(12):
            out.append((float(np.corrcoef(chroma, np.roll(prof, i))[0, 1]), f"{PITCH[i]}{'小调' if pname.endswith('min') else '大调'}[{pname}]"))
    out.sort(key=lambda x: -x[0])
    return out[:4]


def main(path):
    y, sr = librosa.load(path, sr=22050, mono=True)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    variants = {"frame_mean": librosa.util.normalize(chroma.mean(axis=1))}
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    try:
        bs = librosa.util.sync(chroma, beats, aggregate=np.mean)
        variants["beat_sync"] = librosa.util.normalize(bs.mean(axis=1))
    except Exception as e:
        print("beat-sync 失败:", e)
    for vname, c in variants.items():
        print(f"[{vname}] Top4:", [(k, round(v, 3)) for v, k in top(c)])
    print("标准答案：A 小调（Am）")


if __name__ == "__main__":
    main(sys.argv[1])
