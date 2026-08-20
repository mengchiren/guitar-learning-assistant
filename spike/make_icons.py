# 生成 PWA 图标 PNG（v0.8.0）：从 app/public/icon.svg 的图形重绘为 192/512 PNG。
# icon.svg 内容：红圆角矩形底 + 白色圆 + evenodd 挖空的红十字（拨片/音符形）。
# 用 Pillow 直接绘制（不依赖 cairo/SVG 渲染器），输出 app/public/icon-{size}.png。
# 用法：spike/.venv/Scripts/python.exe spike/make_icons.py
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public')
RED = '#e30613'

# 与 icon.svg 的 path 一致（512 坐标系）
CROSS_PTS = [
    (226, 208), (286, 208), (286, 244), (322, 244), (322, 284), (286, 284),
    (286, 332), (226, 332), (226, 284), (190, 284), (190, 244), (226, 244),
]


def render(size):
    r = size / 512.0
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=56 * r, fill=RED)
    d.ellipse([148 * r, 92 * r, 364 * r, 420 * r], fill='white')
    d.polygon([(x * r, y * r) for x, y in CROSS_PTS], fill=RED)
    return img


for size in (192, 512):
    out = os.path.join(ROOT, f'icon-{size}.png')
    render(size).save(out)
    print('written', out, os.path.getsize(out), 'bytes')
