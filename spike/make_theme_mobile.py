# 生成主题背景图移动端压缩版（KeepAlive/性能优化配套，v0.9.0）。
# 手机 dpr3 视口 390 CSS px ≈ 1170 物理像素；移动端背景图明显小于桌面版。
# 用法：spike/.venv/Scripts/python.exe spike/make_theme_mobile.py
from PIL import Image
import os

THEME = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'theme')

def to_webp(src, dst, width, quality=80):
    im = Image.open(os.path.join(THEME, src)).convert('RGB')
    w, h = im.size
    if w > width:
        im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    out = os.path.join(THEME, dst)
    im.save(out, 'WEBP', quality=quality, method=6)
    print(dst, Image.open(out).size, round(os.path.getsize(out) / 1024, 1), 'KB')

to_webp('yui-bg-desktop.jpg', 'yui-bg-mobile.webp', 1170, 82)   # 原 257KB jpg → 移动 webp
to_webp('maid-bg.webp', 'maid-bg-mobile.webp', 780, 80)         # 原 1280x720 64KB → 移动版
