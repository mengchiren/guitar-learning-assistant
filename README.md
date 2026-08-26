# 练琴搭子 · PickBuddy

> 陪你练琴的个人助手：歌曲分析、音色设置、练琴打卡、学习计划、曲谱、录音回听、AI 答疑。为一位电吉他零基础学习者（本人）量身打造。

## 这是什么

「练琴搭子」是一个**以纯前端为主的个人电吉他学习助手**（响应式 PWA）：电脑浏览器和安卓手机都能用，可安装到手机桌面。核心思路是「AI 参考 + 种子曲库校准 + 人工纠错」——自动分析给出参考结果和置信度，人工数据（种子曲库、手动纠错）始终优先。

**目标设备**：Ibanez GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱。所有音色建议都按这套设备标注。

**目标曲风**：日系动漫乐队（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队）+ Beyond 经典。

## 功能

- 🎵 **歌曲分析**（纯前端，音频不出设备）：上传 mp3/flac/wav/m4a，本地分析出 BPM、调性 Top3、粗略和弦、音色套路归类，每项带置信度徽章；酷狗 kgg 等加密格式会引导换源或手动录入。
- 🎸 **设备设置建议**：把套路模板（**6 套**：清音伴奏/清音+合唱氛围/轻过载节奏/失真节奏 Riff/**金属 Riff**/失真主音 Solo）映射到具体设备参数；两种显示模式——「新手模式」是大白话分步操作流程（**面板示意图：要动的旋钮红圈高亮 + 指针指向目标值** + 参数速览 + 照做步骤 + 可先不动的旋钮），「完整模式」是全部参数表。
- 📖 **音箱入门**（v0.6.2）：工具页入口，JAM BUDDY 2 面板全景点按图解——每个旋钮/脚钉点一下看说明（含 Bass/Save 这类多功能按压提示）+ 6 套音色套路对照表。
- 📚 **歌曲库**：种子曲库 **30 首**（人工校准数据 + 引擎分析标注「待人工校准」）+ 你自己的歌单；搜索、详情、人工纠错（纠错值优先展示）。
- 📖 **曲谱（和弦谱/课件式谱面）**：**20 首种子曲谱**（分段和弦进行 + 节奏提示 + 来源与校准状态标注，宁缺毋滥）+ 用户自录曲谱（存本机）；v0.12.0 起支持**课件式谱面**——谱头卡（速度/拍号/调弦/调性 + 和弦指法图一排）、按小节网格对齐的和弦与节奏符号（↓↑×〜）、段落音色标签（清音/失真）、技巧徽章（P.M.、let ring、滑音、击勾弦、推弦）；**原谱 PDF** 关联后在页面内查看（pdfjs 逐页渲染、缩放翻页，文件只存本机 IndexedDB，不进部署包，换设备需重新上传）；谱中和弦自动配指法图。
- 🎼 **和弦图库**：**82 个常用和弦**指法图（6 组展示，点开放大，横按/转位标注）。
- 📅 **学习计划（M3）**：规则引擎生成弹性练习包（10/30/60 分钟三档，每项带「为什么」解释）；基本功清单与达标标记；歌曲「练习中/已掌握」与同套路推荐；统计报表（周报/热力图）；成田课程进度跟踪（194 课）。
- ⏱ **练琴打卡**：计时切页不断、补卡、连续天数、最近 7 天统计；练琴时切去别的页面有「练习中」胶囊一键回来。
- 🎙 **录音回听**：练习页/工具页录音（存本机 IndexedDB，不出设备），录完自动测 BPM 对拍（置信度 + 手动改），回听播放/删除，分类与打卡一致。
- 🤖 **AI 答疑**：练琴问题随时问（DeepSeek/豆包/通义千问可切换），歌曲/练习详情页「问 AI」自动带上当前上下文；经 Cloudflare Pages Functions 代理，API Key 只存环境变量、不进前端；**访问令牌防刷**（ASK_TOKEN 环境变量，应用内配置一次）。
- 🥁 **节拍器**：前瞻调度的 Web Audio 节拍器（切页声音不断）、打拍定速；歌曲详情一键「用此 BPM 开节拍器」。已知限制：切到后台标签页/锁屏时浏览器会节流定时器导致断拍，练琴时请保持页面在前台。
- 🎚 **调音器**：麦克风收音 + 参考音（EADGBE）。
- ⏰ **练琴提醒**：应用内定时提醒；到点且今天未练时，已授权系统通知的话会弹系统通知（每天一条）。
- 🎨 **外观主题**（v0.10.0）：主题切换系统——**「DeepSeek 极简」默认款**（近白大留白 + 深蓝强调 + 大圆角轻边卡片，参考 DeepSeek Harness）+ 「经典瑞士军刀」+ 「呆唯 · 轻音海洋」（奶油暖粉 + 珊瑚粉 + Q 版平泽唯看板娘）+ 「鲸鱼女仆 · 深海茶会」（柔雾蓝 + 水彩鲸鱼云团 + 女仆看板娘）；**深色模式**（跟随系统/浅色/深色三档，DeepSeek 极简主题支持）；可选的**透明毛玻璃模式**（卡片半透明 + 背景模糊，背景插画更透）；「我的」页一键切换，全站 CSS 变量换肤，新增主题只加数据。
- 🖼 **背景壁纸**（v0.13.0，v0.13.1 支持壁纸包直接导入）：用自定义图片/视频做整站背景，可导入 **Wallpaper Engine** 的壁纸文件，**更可**直接上传 **`.mpkg`/`.pkg` 壁纸包**（自动从包里提取视频/图片当背景，用包内预览图做缩略图；拆包全在本机浏览器完成）；融合进「外观主题」——当前壁纸预览、上传图片（≤5MB）/视频（≤100MB）、恢复主题默认、**模糊/亮度/遮罩**三滑条实时生效，移动端视频自动压低模糊降级；**壁纸只存本机浏览器**（IndexedDB），换设备需重新上传，不随云同步。
- 💾 **数据同步（云，v0.11.0）**：「我的」页一键上传/下载，把打卡、歌单与分析结果、计划/课程进度、自录曲谱、聊天记录、设置偏好在两台设备间保持一致（Cloudflare KV + Functions 代理 + 令牌防刷；打开应用自动检查云端更新并提示；录音与音频永不上云）。
- 💾 **数据备份**：「我的」页一键导出/恢复全部数据（JSON 文件，录音除外）。
- 🎨 **视觉**：简约瑞士军刀风——米白底、细线卡片、瑞士红点缀、线性图标；桌面端为 B 站式顶栏 + 仪表盘多栏，手机端为底部导航单栏。

## 技术栈

- Vue 3 + Vite + Pinia + Vue Router + vite-plugin-pwa
- **自研纯前端音频分析引擎**（`app/src/utils/analyze.js`）：手写 FFT/onset 包络/自相关/K-S 调性模板，无任何 ML/音频库依赖，Node 与浏览器通用；**分析在 Web Worker 后台线程跑**（`app/src/workers/analyze.worker.js`），大文件不卡界面；**套路归类规则是数据**（`app/src/data/classifyRules.js`），新增套路不改引擎
- 本地存储：localStorage 抽象层（**schema 版本 + 迁移 + 变更订阅**，云同步接入点）+ IndexedDB（录音）；**Pinia 自动持久化插件**（store 声明 persist 配置即自动落盘，消灭手动 save 漏调）
- 导航配置化：`app/src/data/nav.js` 一份清单驱动路由 / 底部 tab / 工具页
- 设备能力声明式化：`app/src/data/devices.js` 的 params/keyParams 描述设备旋钮，设备建议按当前设备渲染，新增设备只加数据
- Cloudflare Pages Functions：AI 答疑代理（`app/functions/api/ask.js`，Key 存环境变量，访问令牌防刷）+ 云同步代理（`app/functions/api/sync.js`，KV 快照 + SYNC_TOKEN 防刷）
- CI：GitHub Actions（合成音频引擎测试 + 规则引擎对拍 + 数据校验 + store 冒烟 + 设备建议回归 + 云同步校验 + 构建）

## 目录结构

```
├── app/                  # 应用主体（Vue 3 + Vite + PWA）
│   ├── functions/        # CF Pages Functions：api/ask.js（AI 答疑代理，访问令牌防刷）
│   └── src/
│       ├── components/   # Icon、ToneAdvice、ChordChart、FretboardMap、RecordPanel、
│       │                 # AmpPanel（音箱面板 SVG）、GuitarPanel（吉他示意 SVG）、
│       │                 # SheetScore（课件式谱面）、SheetPdfViewer（原谱 PDF 查看）、
│       │                 # WallpaperPanel（背景壁纸设置）
│       ├── composables/  # useMediaQuery、useTuner、useWallpaperBg（壁纸 blob → object URL）
│       ├── data/         # nav（路由/tab/工具入口清单）、devices（含能力描述与面板布局）、templates、
│       │                 # classifyRules（套路归类规则）、seedSongs（30 首）、chords（82 个）、
│       │                 # songSheets（20 首曲谱）、fundamentals、courseCatalog
│       ├── plugins/      # persist.js（Pinia 自动持久化插件）
│       ├── stores/       # Pinia：practice/timer/metronome/songs/settings/plan/course/sheets/recordings/chat
│       ├── utils/        # analyze.js（分析引擎）、planEngine.js（规则引擎）、
│       │                 # recordingsDb.js（IndexedDB 录音）、sheetPdfDb.js（IndexedDB 原谱 PDF）、
│       │                 # wallpaperDb.js（IndexedDB 壁纸）、wallpaper.js（壁纸纯逻辑）、mpkgCarve.js（壁纸包提取）、
│       │                 # recordAnalyze.js、toneGuide.js、storage.js、
│       │                 # analyzeWorker.js（Worker 封装）、audio.js（解码）、date.js、music.js、backup.js、id.js
│       ├── workers/      # analyze.worker.js（分析引擎后台线程）
│       └── views/        # 页面
├── .github/workflows/    # CI：合成音频引擎 + 规则 25 项 + 数据 836 项 + 冒烟 25 项 + 设备建议 53 项 + 面板 13 项 + 谱面渲染 19 项 + 壁纸 26 项 + 构建
├── spike/                # M0 可行性验证（Python librosa 版）+ 各引擎对拍单测
├── 需求文档.md           # 需求规格（唯一权威来源，含修订记录）
├── 验收指南.md           # 手机验收清单 + 常见问题
└── HANDOFF.md            # 开发交接文档
```

## 本地开发

要求 Node ≥ 20.19（Vite 8）。

```bash
cd app
npm install        # .npmrc 已配置 npmmirror 镜像，勿删
npm run dev        # 默认端口 4173，可用 -- --port 4174
```

## 音频分析引擎与对拍

引擎移植自 `spike/analyze.py`（librosa 版）的算法与阈值，用 5 首真实歌曲对拍校准：

| 指标 | 结果 |
|---|---|
| BPM | 5/5 误差 ≤3%（节拍强度比较法处理半速） |
| 调性 | 5/5 在 Top3 候选内命中 |
| 套路归类 | 5/5 |
| 和弦 | 粗略（模板匹配，仅作参考） |

已知局限：强力弦摇滚缺三音，调性存在固有歧义；慢歌（尤其「1.5 倍谐波」型）测速可能偏差——因此产品策略是**种子库优先 → AI 参考 + 置信度 → 人工纠错**。

测试（改引擎/规则/数据后必须重跑）：

```bash
# ffmpeg 路径（来自 spike 虚拟环境；PowerShell 里先设 [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 防中文路径乱码）
FFMPEG=$(spike/.venv/Scripts/python.exe -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
node spike/test_frontend_analyze.mjs "$FFMPEG"   # 分析引擎 5 首对拍（需本地版权音频，CI 不跑）
node spike/test_frontend_synthetic.mjs           # 分析引擎合成音频测试（CI 跑：快/中/慢三档 + 慢歌不加倍）
node spike/test_plan_engine.mjs                  # 规则引擎 25 项
node spike/test_sheets.mjs                       # 曲谱/和弦数据 836 项（含课件式谱面格式与词表校验）
node spike/test_stores_smoke.mjs                 # Store 冒烟测试 25 项（CI 跑，防运行时引用错误/漏持久化）
node spike/test_tone_guide.mjs                   # 套路归类规则 + 设备建议回归 53 项（CI 跑）
node spike/test_sheet_view.mjs                   # 课件式谱面 SSR 渲染 19 项（CI 跑）
node spike/test_wallpapers.mjs                   # 壁纸模块：纯逻辑/存储层/壁纸包提取 26 项（CI 跑）
```

**CI**（`.github/workflows/ci.yml`）：push/PR 自动跑合成音频引擎测试 + 规则引擎对拍 + 数据校验 + store 冒烟测试 + 设备建议回归 + 面板/谱面渲染 + 壁纸模块测试 + 云同步校验 + 生产构建，全过才允许合并；真实歌曲对拍因版权音频不入库，只在本地跑。

## 部署

Cloudflare Pages + GitHub 自动部署（push 即发）：

- 站点：<https://guitar-learning-assistant.pages.dev>
- 构建配置：根目录 `app`、构建命令 `npm run build`、输出目录 `dist`、环境变量 `NODE_VERSION=22`
- SPA 深链接回退：`app/public/_redirects`
- AI 答疑环境变量：`AI_KEY_DEEPSEEK`（必配）、`AI_KEY_ARK`+`AI_MODEL_ARK`、`AI_KEY_QWEN`（按需）、**`ASK_TOKEN`（必配，防盗刷令牌，应用内 AI 答疑页首次使用时填入）**；改动后需 Retry deployment

## 隐私

- 打卡记录、歌单、录音、设置、聊天记录**默认只存在本机浏览器**；上传的音频**不会离开设备**，仅在浏览器本地解码分析。
- 上行数据（可选）：①AI 答疑时，提问文字经 Cloudflare Pages Functions 代理转发给大模型（无账号、无追踪；API Key 只存在 Cloudflare 环境变量）；②**开启云同步后**，结构化数据快照（打卡/歌单与分析结果/计划课程进度/自录曲谱/聊天记录/设置偏好，**不含录音与音频**）经令牌鉴权存储在 Cloudflare KV（私有、HTTPS，仅你自己的令牌可读）。
- **数据备份**：「我的」页可一键导出/恢复全部数据（JSON 文件，录音除外），建议定期备份。

## 路线图

- ✅ M0 可行性验证（BPM/调性/套路识别）
- ✅ M1 基础功能（设备档案、套路库、节拍器、调音器、打卡、提醒）
- ✅ M2 歌曲分析（搜索、上传分析、详情、纠错）
- ✅ M3 学习计划（规则引擎 + 课程进度 + 统计报表 + 曲谱与和弦图库）
- ✅ M4-1 录音回听 + 自动对拍
- ✅ M4-2 AI 答疑（多模型切换 + 上下文入口）
- 🔜 M4-3 微信推送（推送加）/ Capacitor 安卓壳 + 桌面小组件（待排期）
- 🔜 云同步（Supabase，按需）、成就徽章

*个人项目，未开源。*
