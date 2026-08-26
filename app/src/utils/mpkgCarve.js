// Wallpaper Engine 壁纸包（.mpkg / .pkg）媒体提取（v0.13.1）。
// 背景：WE 的包是自有容器（PKGM 头 + 文件名表 + 逐文件拼接的数据），动态壁纸的核心是
// wallpaper.mp4（完整 mp4：ftyp→…→moov，盒子遍历可得精确边界），静态壁纸是嵌入式图片。
// 本模块只做「从包里削出媒体字节」：不解析 scene 引擎、不依赖 WE 运行时，纯字节操作、
// 无浏览器 API，可在纯 Node 里单测（spike/test_wallpapers.mjs）。
// 已知边界：网页/场景互动壁纸拆不出单一媒体（其动画依赖 WE 专有 JS）→ 回退 preview.jpg
// 静态图或明确报错；视频编码若浏览器不支持（如部分 h265）播放会失败，属预期局限。
// 红线：拆包全部在浏览器内存里完成，媒体只存本机 IndexedDB，不进 git/部署包/云同步。

/** 常见 mp4 顶层盒子（足够覆盖 WE 视频壁纸；遇到未知盒子提前结束即可，宁短勿错） */
const MP4_BOXES = new Set([
  'ftyp', 'styp', 'free', 'skip', 'wide', 'mdat', 'moov', 'moof', 'mfra',
  'sidx', 'pdin', 'emsg', 'meta', 'uuid', 'prft', 'ssix', 'meco',
])

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47]
const PNG_IEND = [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]

function readU32BE(b, i) {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
}

function readU64BE(b, i) {
  const hi = readU32BE(b, i)
  const lo = readU32BE(b, i + 4)
  return hi * 4294967296 + lo
}

function typeAt(b, i) {
  if (i + 4 > b.length) return ''
  return String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3])
}

/** 文件名是否 WE 壁纸包（.mpkg/.pkg） */
export function isWePackageFile(name) {
  return /\.(mpkg|pkg)$/i.test(name || '')
}

/** 第一个合法 ftyp 盒子起点：'ftyp' 前 4 字节是合理 size（≥8） */
export function findMp4Start(bytes) {
  const n = bytes.length
  for (let i = 4; i + 4 <= n; i++) {
    if (bytes[i] === 0x66 && bytes[i + 1] === 0x74 && bytes[i + 2] === 0x79 && bytes[i + 3] === 0x70) {
      const start = i - 4
      const size = readU32BE(bytes, start)
      if (size >= 8 && start + size <= n) return start
    }
  }
  return -1
}

/** 从 ftyp 起点遍历顶层盒子，返回 mp4 结束位置（最后一个合法盒子之后） */
export function walkMp4End(bytes, start) {
  const n = bytes.length
  let pos = start
  while (pos + 8 <= n) {
    const size = readU32BE(bytes, pos)
    const type = typeAt(bytes, pos + 4)
    let boxSize = size
    if (size === 1) {
      if (pos + 16 > n) break
      boxSize = readU64BE(bytes, pos + 8)
    } else if (size === 0) {
      boxSize = n - pos
    }
    if (!MP4_BOXES.has(type) || boxSize <= 0 || pos + boxSize > n) break
    pos += boxSize
  }
  return pos
}

/** 从 offset 起找第一个 JPEG（FFD8…FFD9），返回 { start, end } 或 null */
export function findJpeg(bytes, from = 0) {
  const n = bytes.length
  let start = -1
  for (let i = from; i < n - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8) {
      start = i
      break
    }
  }
  if (start < 0) return null
  // JPEG 熵数据按 FF00 字节填充，掃描数据里不会出现真正的 FFD9 之外的假结束；首个 FFD9 即 EOI
  for (let i = start + 2; i < n - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) return { start, end: i + 2 }
  }
  return null
}

/** 找 PNG（签名 + IEND 之后 4 字节 CRC），返回 { start, end } 或 null */
export function findPng(bytes, from = 0) {
  const n = bytes.length
  let start = -1
  for (let i = from; i < n - 4; i++) {
    let ok = true
    for (let j = 0; j < 4; j++) {
      if (bytes[i + j] !== PNG_SIG[j]) {
        ok = false
        break
      }
    }
    if (ok) {
      start = i
      break
    }
  }
  if (start < 0) return null
  for (let i = start; i <= n - 8; i++) {
    let ok = true
    for (let j = 0; j < 8; j++) {
      if (bytes[i + j] !== PNG_IEND[j]) {
        ok = false
        break
      }
    }
    if (ok) return { start, end: i + 8 } // IEND 块（含 CRC）
  }
  return null
}

/** 收集全文件可识别的图片（按大小排序），用于静态壁纸包与缩略图 */
function collectImages(bytes) {
  const out = []
  let from = 0
  while (from < bytes.length - 2) {
    const j = findJpeg(bytes, from)
    if (j) {
      out.push({ start: j.start, end: j.end, mime: 'image/jpeg' })
      from = j.end
      continue
    }
    break
  }
  from = 0
  while (from < bytes.length - 4) {
    const p = findPng(bytes, from)
    if (p) {
      out.push({ start: p.start, end: p.end, mime: 'image/png' })
      from = p.end
      continue
    }
    break
  }
  return out.sort((a, b) => b.end - b.start - (a.end - a.start))
}

/**
 * 从 WE 壁纸包字节中提取可用媒体。
 * @param {ArrayBuffer | Uint8Array} input 壁纸包内容
 * @returns {{ ok: true, kind: 'video'|'image', media: Uint8Array, mediaMime: string,
 *             preview: Uint8Array | null, mediaName: string }
 *         | { ok: false, error: string }}
 */
export function analyzeWePackage(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input)
  if (!b.length) return { ok: false, error: '壁纸包为空或已损坏' }

  // 1) 视频壁纸：找 wallpaper.mp4（完整 mp4 盒子链）
  const mp4Start = findMp4Start(b)
  if (mp4Start >= 0) {
    const mp4End = walkMp4End(b, mp4Start)
    if (mp4End > mp4Start + 8) {
      const media = b.slice(mp4Start, mp4End)
      // 预览图：优先取 mp4 之外的 jpg（WE 的 preview.jpg，可能放在视频前后）
      let preview = null
      const beforeJp = findJpeg(b, 0)
      if (beforeJp && beforeJp.end <= mp4Start) {
        preview = b.slice(beforeJp.start, beforeJp.end)
      } else {
        const afterJp = findJpeg(b, mp4End)
        if (afterJp) preview = b.slice(afterJp.start, afterJp.end)
      }
      return {
        ok: true,
        kind: 'video',
        media,
        mediaMime: 'video/mp4',
        preview,
        mediaName: 'wallpaper.mp4',
      }
    }
  }

  // 2) 静态壁纸：取全文件最大的嵌入图片（背景通常比预览大）
  const imgs = collectImages(b)
  if (imgs.length) {
    const media = b.slice(imgs[0].start, imgs[0].end)
    // 预览：若存在更小的 jpg 用之（preview.jpg），否则用媒体本身
    let preview = null
    const smaller = imgs.find((x) => x.mime === 'image/jpeg' && x.end - x.start < media.length)
    if (smaller) preview = b.slice(smaller.start, smaller.end)
    return {
      ok: true,
      kind: 'image',
      media,
      mediaMime: imgs[0].mime,
      preview,
      mediaName: imgs[0].mime === 'image/png' ? 'background.png' : 'background.jpg',
    }
  }

  return { ok: false, error: '没能从这个壁纸包里提取出可用的图片或视频（可能是网页/场景互动壁纸）' }
}
