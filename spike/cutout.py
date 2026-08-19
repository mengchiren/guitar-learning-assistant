# 白底 Q 版看板娘抠图：从四角 flood-fill 去除连通白色背景，保留内部白色，边缘羽化。
# 用法: python cutout.py <src.png> <dst.png> <max_size>
import sys
from PIL import Image, ImageDraw, ImageFilter

src, dst, max_size = sys.argv[1], sys.argv[2], int(sys.argv[3])

img = Image.open(src).convert('RGBA')
w, h = img.size

# 从四角 seed flood-fill 背景为透明（thresh 容差，只删与边缘连通的亮色）
thresh = 48
for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    ImageDraw.floodfill(img, corner, (0, 0, 0, 0), thresh=thresh)

# 边缘羽化：alpha 轻微模糊去锯齿
alpha = img.split()[3]
alpha = alpha.filter(ImageFilter.GaussianBlur(1.0))
img.putalpha(alpha)

# 缩小（保持比例，方形画布居中裁切）
ratio = max_size / max(w, h)
nw, nh = max(1, int(w * ratio)), max(1, int(h * ratio))
img = img.resize((nw, nh), Image.LANCZOS)

# 居中到方形画布（看板娘组件是方形缩放）
canvas = Image.new('RGBA', (max_size, max_size), (0, 0, 0, 0))
canvas.paste(img, ((max_size - nw) // 2, (max_size - nh) // 2), img)
canvas.save(dst, 'PNG')
print('saved', dst, canvas.size)
