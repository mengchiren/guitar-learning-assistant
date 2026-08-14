# -*- coding: utf-8 -*-
"""生成合成测试音频：已知和弦进行（C-G-Am-F，120BPM，八分音符扫弦），用于校验分析工具链"""
import numpy as np
import soundfile as sf

sr = 22050
dur = 16
t = np.linspace(0, dur, int(sr * dur), endpoint=False)
chords = {
    'C':  [261.63, 329.63, 392.00],
    'G':  [196.00, 246.94, 392.00],
    'Am': [220.00, 261.63, 329.63],
    'F':  [174.61, 220.00, 349.23],
}
prog = ['C', 'G', 'Am', 'F'] * 2
y = np.zeros_like(t)
beat = 60 / 120 / 2  # 八分音符
for k, chord in enumerate(prog):
    t0 = k * 2
    n = 0
    while t0 + n * beat < t0 + 2:
        idx = int((t0 + n * beat) * sr)
        seg_len = int(sr * 0.18)
        tt2 = np.arange(seg_len) / sr
        seg = np.zeros(seg_len)
        for f in chords[chord]:
            seg += (1.5 * np.sin(2 * np.pi * f * tt2) + 0.6 * np.sin(2 * np.pi * f * 2 * tt2) + 0.3 * np.sin(2 * np.pi * f * 3 * tt2)) * np.exp(-6 * tt2)
        if idx + seg_len < len(y):
            y[idx:idx + seg_len] += seg / 3
        n += 1
y = y / np.max(np.abs(y)) * 0.9
sf.write('synthetic_chords.wav', y, sr)
print('written synthetic_chords.wav, ground truth: C G Am F x2 @ 120BPM')
