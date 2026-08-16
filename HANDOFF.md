# HANDOFF 交接文档

> 给一个完全没有上下文的新对话看。工作目录：`F:\电吉他学习`（Windows 10，Git Bash）。项目名：**练琴搭子 · PickBuddy**。

## 1. 我们在做什么任务

给一位**电吉他零基础初学者**（用户本人）做个人学习助手 PWA「练琴搭子」（Vue 3 + Vite + vite-plugin-pwa）：

- **产品形态**：响应式网页 PWA，电脑浏览器 + 安卓手机都能用，可安装到手机桌面。**已部署上线**（Cloudflare Pages + GitHub 自动部署）。
- **核心功能**：①上传想练的歌 → 纯前端本地分析（BPM/调性/套路）→ 给出**他这套设备**（依班娜 GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱）的设置建议，新手模式是大白话分步操作流程；②练琴打卡计时、连续天数、提醒；③**M3 学习计划**：规则引擎生成弹性练习包（10/30/60 分钟三档）、基本功清单与达标标记、歌曲「练习中/已掌握」状态与同套路推荐、统计报表（周报/热力图）、成田课程进度跟踪；④练习项详情页（基本功任务分解 + 图示）与**和弦谱**（种子曲谱 + 用户自录曲谱 + 和弦图库）；⑤**录音回听（v0.4.0）**：练习页/工具页双入口录音（麦克风、存本机 IndexedDB），录完自动复用分析引擎测 BPM（置信度 + 手动改），回听页播放/删除，分类与打卡一致；⑥**AI 答疑（v0.4.1）**：聊天页 `/ask`（多模型切换，先接 DeepSeek）+ 歌曲/练习详情页「问 AI」上下文入口，走 Cloudflare Pages Functions 代理（Key 只存 CF 环境变量，永不进前端）。
- **产品策略（三层）**：种子库人工数据优先 → AI 分析作参考并标置信度 → 人工纠错兜底。**别把 AI 结果当精确数据呈现。**
- **目标歌曲**：日系动漫乐队歌（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队）+ Beyond 经典。

**需求的唯一权威来源是 `需求文档.md`（当前 v0.3.8，含完整修订记录）**，任何功能争议以它为准，改需求必须先改它。

## 2. 关键文件地图

| 路径 | 作用 |
|---|---|
| `需求文档.md` | 需求规格 v0.3.8：功能需求、设备参数、成本评估、路线图（M0~M4）、修订记录 |
| `HANDOFF.md` | 本交接文档 |
| `验收指南.md` | 手把手手机验收清单 + 反馈模板 + 常见问题（给用户看的） |
| `README.md` | GitHub 项目主页 |
| `spike/` | 验证与测试：Python librosa 版 `analyze.py`、`make_synthetic.py`、**前端引擎对拍 `test_frontend_analyze.mjs`**、**规则引擎对拍 `test_plan_engine.mjs`**、**数据校验 `test_sheets.mjs`**、**课程目录生成 `gen_course_catalog.py`**、单文件分析工具 `analyze_one.mjs` |
| `spike/.venv/` | Python 3.13 虚拟环境（librosa + imageio-ffmpeg），git 忽略 |
| `spike/songs/`、`歌曲文件/`、`视频教程/` | 用户音频/视频，**git 忽略**，勿提交（版权内容） |
| `app/` | 应用主体（Vue 3 + Vite + PWA） |
| `app/src/data/` | `devices.js`（设备参数）、`templates.js`（5 套音色套路）、`seedSongs.json`（7 首种子歌）、**`fundamentals.js`（5 项基本功：任务分解/图示/bpm）**、**`chords.js`（49 个和弦指法图数据 + 分组，`findChord`/`CHORD_GROUPS`）**、**`songSheets.js`（种子曲谱，首批 2 首）**、**`courseCatalog.js`（194 课成田课程目录，由脚本生成勿手改）** |
| `app/src/stores/` | Pinia：`practice.js`（打卡）、`settings.js`（提醒/设备/新手模式）、`timer.js`（计时全局）、`metronome.js`（节拍器全局，含 currentBeat）、`songs.js`（用户歌单，getter 叫 **allSongs**、歌名字段叫 **title**）、**`plan.js`（基本功达标/歌曲状态 + plan getter）**、**`course.js`（课程进度）**、**`sheets.js`（用户自录曲谱）**、**`recordings.js`（录音元数据列表，分类常量 `RECORD_CATEGORIES`）**、**`chat.js`（AI 聊天历史/模型选择，`AI_PROVIDERS`、`stashAskContext`/`takeAskContext` 跨路由传上下文）** |
| `app/src/composables/` | `useMediaQuery.js`（768px 断点）、`useTuner.js`（麦克风 ACF 调音） |
| `app/src/utils/` | `analyze.js`（**自研音频分析引擎**）、`toneGuide.js`（新手大白话文案）、`storage.js`（localStorage 抽象，key 前缀 `gla:v1:`）、**`planEngine.js`（规则引擎纯函数，改后必须重跑对拍）**、**`recordingsDb.js`（IndexedDB 封装：meta 与 blob 分 store）**、**`recordAnalyze.js`（录音→BPM，复用 analyze.js，只分析前 3 分钟）** |
| `app/functions/api/ask.js` | **AI 答疑代理（CF Pages Functions，POST /api/ask）**：三平台 OpenAI 兼容表（deepseek/ark/qwen），Key 只读 CF 环境变量 `AI_KEY_DEEPSEEK`/`AI_KEY_ARK`/`AI_KEY_QWEN`（方舟 model 用 `AI_MODEL_ARK`=ep-xxx），输入护栏 + max_tokens 1500，CORS 全开（本地 dev 跨域调线上） |
| `app/src/components/` | `Icon.vue`（线性 SVG 图标集，含 calendar/chart/book/chord/check-circle/mic 等）、`ToneAdvice.vue`（设备建议卡双模式）、**`ChordChart.vue`（自绘 SVG 和弦指法图，支持 size/baseFret/无图占位）**、**`FretboardMap.vue`（竖版指板图：1 品在上往下递推）**、**`RecordPanel.vue`（录音面板：状态机 idle/recording/saving，练习页与回听页复用）** |
| `app/src/views/` | Home/Tools/Songs/SongDetail/SongAnalyze/Practice/Metronome/Tuner/Templates/Devices/Reminders/Profile + **Plan（计划页）/Stats（统计）/Course（课程）/PlanItem（基本功详情）/ChordLibrary（和弦图库）/Recordings（录音回听）/Chat（AI 答疑）** |
| `app/public/_redirects` | SPA 深链接回退（CF Pages 需要，别删） |

**路由全景**：`/`(tab) `/plan`(tab) `/practice` `/tools`(tab) `/metronome` `/tuner` `/chords` `/recordings` `/ask` `/songs`(tab) `/songs/new` `/songs/:id` `/profile`(tab) `/stats` `/course` `/devices` `/reminders` `/templates` `/plan-item/basic/:id`。`meta.tab` = 显示底部导航（手机 5 标签：首页/计划/工具/歌曲/我的）。

**Git 与部署**：远程 `origin` = `github.com/mengchiren/guitar-learning-assistant`（**私有**）。**push 后 Cloudflare Pages 自动部署**到 `https://guitar-learning-assistant.pages.dev`。构建配置：根目录 `app`、`npm run build`、输出 `dist`、环境变量 `NODE_VERSION=22`。本机到 GitHub 的推送会**间歇性失败**（国内网络抖动：Recv failure: Connection was reset / 443 超时），**重试 3~4 次通常能成**（间隔 30~120 秒），提交在本地不会丢。

## 3. 已经完成了什么

- **M0 可行性验证**（Python spike）：5 首真实歌曲对拍——BPM「半速加倍」误差 ≤1.5%；调性 4/5；套路归类 4/5；和弦识别薄弱（结论：免费工具链承担 BPM/调性参考/套路归类）。
- **M1 基础功能**：设备档案、音色套路库（5 套）、节拍器、调音器、练琴打卡/补卡/提醒、种子歌曲库。瑞士军刀风视觉（米白底 `#f4f3ef`、细线卡片、瑞士红 `#e30613` 只做强调、线性 SVG 图标、二级页返回键）。
- **桌面/移动分离布局**（断点 768px）：≥768px 桌面端顶栏 + 多栏布局；<768px 手机布局（底部导航 + 单栏）。
- **跨页协作**：计时与节拍器为全局 store——切页不停表/不停声；「练习中 mm:ss」胶囊（桌面顶栏内、手机底部悬浮）一键回练习页。
- **M2 歌曲分析**（纯前端，音频不出设备）：自研引擎 `analyze.js`（手写 FFT/onset 包络/自相关/K-S 调性模板），**5 首真实歌曲对拍 5/5 全项通过**；歌曲库搜索、详情页（设备建议 + 节拍器联动 + 人工纠错）、添加歌曲（上传分析 + 手动录入兜底，kgg 拒绝）。上传上限 100MB，OfflineAudioContext 直出 22050 单声道 + PCM 内存护栏。
- **新手模式显示偏好**（默认开）：参数速览 4 芯片 + 大白话分步操作 + 可先不动清单。
- **慢歌测速修复**：半速加倍改为**节拍强度比较法**；春日影入种子库（权威 97 BPM / B 大调 / 清音伴奏）。
- **部署上线**（CF Pages）+ **定名**「练琴搭子 · PickBuddy」（品牌名同步到顶栏/标题/manifest/关于页/README/仓库描述）。
- **v0.3.5 验收反馈修复**（用户手机验收提的 3 个问题）：路由滚动位置重置（scrollBehavior：前进回顶、后退恢复）；节拍器圆点按拍跳动（store 加 currentBeat，声音排拍同一时刻驱动视觉）；提醒时间改「时/分」双下拉（time input 部分浏览器弹不出选择器）。另修：保存纠错后「已保存」提示被 watch 深层依赖连带清掉（改监听歌曲 id）。**全程浏览器模拟手机/桌面双视口验收通过**（browser-use IAB，视口 390×844 与 1280×800）。
- **M3 学习计划（v0.3.6）**：底部导航加「计划」（5 标签）；规则引擎 `planEngine.js`（纯函数，25 项对拍）：三档练习包、每项含练法/达标标准/「为什么」解释、动态调整（上周 ≤2 天减半、连续 3 周达标 +10%、上周练得少默认 10 分钟档）；基本功清单 5 项 + 达标标记；歌曲「练习中/已掌握」+ 同套路推荐；统计报表页（周概览/4 周趋势/月度热力图/清单状态/歌曲掌握）；成田课程进度页（194 课目录由 `gen_course_catalog.py` 扫描视频文件名生成，逐课勾选/学到第几课/进度百分比）；首页练习包读引擎真实输出。
- **计划项详情页 + 曲谱（v0.3.7）**：基本功详情页 `/plan-item/basic/:id`（任务分解 4 步 + 图示 + 目标速度节拍器联动 + 达标切换）；自绘 SVG 和弦图组件 + 19 个和弦图库；歌曲详情页「曲谱（和弦谱）」区（分段和弦谱，谱中和弦自动配指法图）；种子曲谱 2 首（NO, Thank You! 完整分段、空の箱标注校准）；用户自录曲谱（分段表单，localStorage，优先显示）；数据校验 `test_sheets.mjs`。
- **爬格子竖版 + 和弦图库（v0.3.8）**：FretboardMap 改竖版（1 品在上往下递推）；和弦图库扩到 **49 个**（6 组：开放/七和弦/挂留延伸/横按/强力和弦/转位低音，全部标准按法）；「和弦图库」页 `/chords`（工具页第 4 张卡片进入，点任意和弦放大查看）；校验升级 212 项断言。
- **录音回听 + 自动对拍（v0.4.0，M4-1）**：录音面板 `RecordPanel.vue`（练习页 + 工具页「录音回听」双入口）；MediaRecorder 兼容选 mimeType（webm/opus 优先、mp4 兜底，覆盖安卓 Chrome 与 iPhone Safari）；单次最长 10 分钟；录完自动复用 `analyze.js` 测 BPM（只分析前 3 分钟，秒级出结果），标置信度可手动改；本地存 IndexedDB（`recordingsDb.js`，meta 与 blob 分 store，列表页不载入音频）；回听页 `/recordings`（列表/行内播放/两段式删除）；分类与打卡一致（歌曲/基本功/课程/自由练习），选「歌曲」可关联歌（store getter 是 `allSongs`、字段是 `title`）；工具页第 5 张卡片 + mic 图标。**验收中抓到并修了一个真 bug**：关联歌曲下拉最初写成 `songs.songs`/`s.name`（应为 `allSongs`/`title`），下拉只有「不关联」——浏览器实测发现后修正。
- **AI 答疑（v0.4.1，M4-2）**：`functions/api/ask.js` CF Pages Functions 代理（**Key 只存 CF 环境变量，不进 git 不下发浏览器**）；三平台 OpenAI 兼容一张表（deepseek/ark/qwen）；聊天页 `/ask`（气泡对话、模型切换 chips、历史 localStorage `gla:v1:ai-history` 20 条滚动窗口、清空、Enter 发送）；歌曲详情页「问 AI 这首歌怎么练」+ 基本功详情页「问 AI 这个练习怎么练」入口（上下文经 sessionStorage `gla:v1:ask-context` 跨路由传递，随 system 一起发）；工具页第 6 张卡片 + sparkle 图标。**注意：Functions 需要用户在 CF 控制台配 Key 才真正可用**（`AI_KEY_DEEPSEEK` 等，配法见验收指南），未配时前端显示明确提示。本地 dev 请求线上 Functions（`import.meta.env.DEV` 分支），所以**本地联调必须先部署 Functions**。
- 全程约 30 个提交，git 历史即详细变更记录；需求文档修订记录完整到 v0.4.1。

## 4. 当前卡在哪

**没有技术阻塞。** 最新版 v0.4.1（AI 答疑）已推送上线。**唯一待办：用户在 Cloudflare 控制台配置 API Key**（至少 `AI_KEY_DEEPSEEK`，配法见下），配完 AI 答疑即真正可用。等用户**使用反馈**：

1. 计划页的练习包建议、基本功达标标准难度是否合适（用户实际练几天才知道）
2. 曲谱准确性：《空の箱》标注了「请对照原曲校准」，其余 5 首种子歌暂无曲谱（宁缺毋滥原则），用户练到哪首需要谱再补
3. 和弦图库 49 个指法是否有标错的（用户对照实物弹发现不对就改数据）
4. **录音回听：手机真实录音效果、自动对拍准不准（练琴录音是清音，节拍检测有效性待实测）、录音格式在安卓/iPhone 上是否都能录能放**
5. **AI 答疑：回答质量、上下文带得准不准、模型切换是否符合「多 AI 换着用」习惯**
6. 用户手机验收新版（刷新两三次避开 SW 旧缓存）

**不要在他反馈前自作主张改设计**，等他给意见再动手。用户的工作方式（本会话确认）：**大功能先问清需求**——他会要求先指出「架构问题、扩展性问题、安全问题和维护成本」再一起重新设计方案，然后才让动手。

## 5. 下一步计划（按路线图）

1. **用户配 Key（AI 答疑生效前提）**：Cloudflare 控制台 → 项目 guitar-learning-assistant → Settings → Environment variables，加 `AI_KEY_DEEPSEEK`（DeepSeek 平台 platform.deepseek.com 注册充值后生成 sk- 开头 Key）；可选 `AI_KEY_ARK`+`AI_MODEL_ARK`（方舟 ep-xxx）、`AI_KEY_QWEN`。**Key 永不进 git/前端**。配完等用户使用反馈 → 按意见微调（练习包规则/达标标准/曲谱内容/和弦图数据/录音体验/AI 答疑）。
2. **曲谱扩充**：用户练到哪首歌需要谱 → 按「宁缺毋滥、人工整理、标注来源与校准状态」原则补 `songSheets.js`；谱里出现新和弦时同步补 `chords.js` 图库（`test_sheets.mjs` 会强制校验：谱中和弦必须在图库有定义）。用户也可自己在应用里录谱（存本地）。
3. **录音功能扩展**（按反馈）：录音关联统计（这首歌录了几遍、BPM 趋势）、录音导出、云同步（Supabase 按需，`recordingsDb.js` 是 IDB 实现可整体替换）。
4. **M4 剩余**（用户已按「架构/安全/成本」分析法选定录音回听、AI 答疑为前两项）：微信推送（推送加，token 需代理）、Capacitor 安卓壳 + 桌面小组件（维护成本最高，等核心稳定）。
5. pages.dev 免费域名国内访问不稳定，后续可选自定义域名。
6. P2 成就徽章/等级（统计页做了一部分，徽章未做）。

## 6. 踩过的坑（绝对不要踩）

1. **包管理镜像**：pip 必须加 `-i https://mirrors.aliyun.com/pypi/simple/`；`app/.npmrc` 配的 npmmirror **别删**。
2. **酷狗音频**：mp3 读不动用 ffmpeg 转 wav（ffmpeg 路径：`spike/.venv/Scripts/python.exe -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`）。**kgg 是加密格式，解不开，不要碰解密**（法律灰色），引导用户换源或歌名检索。
3. **日期必须用本地时区**：`toISOString()` 是 UTC，中国时区凌晨差一天。新代码用 PracticeView 的 `localDateStr()` / planEngine 的 `fmt()` 模式。
4. **Vue computed 依赖**：非响应式源（`Date.now()`）必须显式读每秒 tick 的 ref 才触发更新。
5. **PWA Service Worker 缓存**：同 origin 旧 SW 会缓存旧版本，开发换端口（4173 已被污染，现用 4174）；线上更新后用户需刷新两三次或清缓存。
6. **测试音频来源**：archive.org、incompetech、GitHub raw 本机连不上；需要样本用 `spike/make_synthetic.py` 生成（C-G-Am-F 120BPM），或用 `spike/songs/` 真实歌曲。
7. **librosa 1.0 API 变了**：`tempo_frequencies` 已移除等，参考现有 spike 代码。
8. **BPM 半速用节拍强度比较法**（v0.3.2 起）：测值 <100 时比较 lag 与 lag/2 自相关强度，lag/2 ÷ lag ≥0.98 才加倍。**别再退回一律 ×2**（会把 96 BPM 的春日影翻成 191）。**已知硬伤**：春日影类「1.5 倍谐波」慢歌无法自动纠正，靠种子库 + 人工纠错兜底。
9. **调性/和弦识别不是权威**：强力弦摇滚缺三音有固有歧义。产品必须种子库优先 → AI 标置信度 → 人工纠错。
10. **音频/视频不进 git**：`.gitignore` 已排除 `歌曲文件/`、`视频教程/`、`spike/songs/`、`node_modules`、`spike/.venv`、`app/public/test-audio.mp3`。用户歌曲是版权内容。
11. **Windows 端口残留**：任务被 kill 后 node 可能占端口：`netstat -ano | grep :端口 | grep -i listen` 拿 PID → `taskkill //F //PID <PID>`。
12. **手机调音器需要 HTTPS**：getUserMedia 要求安全上下文。线上已 HTTPS；局域网 IP 的 http 不行。
13. **设备参数来自网络检索**：GRX40/Jam Buddy 2 参数在 `devices.js`，音箱 14 种箱头模拟名单未核实全。
14. **浏览器测试方法**（browser-use 技能，`mcp__node_repl__js` 工具）：开 IAB 浏览器，`setViewportSize` 模拟手机（390×844）与桌面（1280×800）；`playwright.evaluate` 会被安全策略拒绝（读 `window.scrollY` 可行，读 localStorage 被拒，删 localStorage 更不可能）；用 `domSnapshot()` 读页面、`getByRole/getByText/locator` 操作；**aria-hidden 的 SVG 内容不在快照里**（验证 SVG 用 locator 计数/getAttribute）；`fill('')` 对 search 输入框不生效（用 click + Control+A + Backspace 清空）；**HMR 会重置组件局部状态**（如 PlanView 的档位 ref 会弹回默认值，验收时注意）；**IAB 不支持文件选择器**——上传分析联调用添加歌曲页 dev-only 的「加载开发测试音频」按钮（fetch `app/public/test-audio.mp3`，用完删）；截图用 `nodeRepl.emitImage(await tab.screenshot())` 才能给用户看。
15. **AGENTS.md 规矩**：编辑任何已有文本文件前用 chardet 检测编码（本工程都是 UTF-8）；新文件直接 UTF-8。
16. **计时器/节拍器是全局 store**：切页不停表/不停声靠 `stores/timer.js`、`stores/metronome.js` 共享实例。不要写回页面级 composable。**练习页不要放节拍器控件**（用户明确拒绝过）。
17. **分析引擎对拍**：改 `analyze.js` 任何算法/阈值后必须重跑 `node spike/test_frontend_analyze.mjs <ffmpeg路径>`，5 首全项通过才算数。
18. **调性 chroma 是 STFT 近似非 CQT**：逐八度归一化 + 小数 midi 插值两个技巧缺一不可（去掉任一个对拍掉到 2/5）；K-S 模板滚动方向用 `(j - i + 12) % 12`（与 np.roll 同向），写反会全歌误判 D# 调。
19. **规则引擎与数据对拍（v0.3.6~v0.3.8 新增）**：改 `planEngine.js` 任何规则/阈值后必须重跑 `node spike/test_plan_engine.mjs`（25 项断言）；改 `chords.js`/`songSheets.js`/`fundamentals.js` 数据后必须重跑 `node spike/test_sheets.mjs`（212 项断言：图库数量 ≥40、分组合法、**谱中出现的每个和弦必须在图库有定义**——这是硬约束，加谱不补图会挂）。两个测试都是纯 node ESM，**import 必须带 `.js` 扩展名**（Vite 可省略但 node 不行）。
20. **Vue watch 深层依赖陷阱（本会话实战教训）**：`watch(computedSong)` 回调里若读了 song 的深层响应式字段（如 `effectiveSong(s)`），保存修改后 watch 会连带触发——曾导致纠错「已保存」提示永远不显示。**watch 源要选浅层稳定的值（如 `() => song.value?.id`）**。
21. **曲谱合规红线**：不从第三方曲谱网站抓谱/嵌图（版权风险）；谱子 = 人工整理的学习笔记（标注来源与校准状态），**仅存本地浏览器、无分享/导出/公开功能**（用户已确认）。宁缺毋滥，没把握的歌不录谱。
22. **课程目录是生成数据**：`app/src/data/courseCatalog.js` 由 `spike/gen_course_catalog.py` 扫描 `视频教程/` 文件名生成（解析规则见脚本注释），**勿手改**；课程文件增删后重跑脚本。网页无法读用户本地文件路径，课程页只是课名清单对照勾选。
23. **部署配置**：CF Pages 构建必须设**根目录 `app`**、`NODE_VERSION=22`、输出 `dist`；SPA 回退靠 `app/public/_redirects`。push 即自动部署；推送失败是网络抖动，**重试 3~4 次**（间隔 30~120 秒），别把「没推上去」当「没提交」。
24. **项目名**：「练琴搭子 · PickBuddy」（v0.3.4 定名），品牌名出现在 App.vue 顶栏、index.html 标题、vite.config.js manifest、ProfileView 关于文案、README、仓库描述——改名要全同步。
25. **录音功能（v0.4.0 新增）**：①录音存 IndexedDB（`recordingsDb.js`），meta 与 blob 分两个 object store，列表页只读 meta——不要把音频全量塞 localStorage（5MB 上限）也不要让 getAll 拖回全部 blob；②MediaRecorder 的 mimeType 要先 `isTypeSupported` 探测（webm/opus → webm → mp4 依次降级），iPhone Safari 只支持 mp4/aac；③分析录音用 `decodeAudioData` 后混单声道再喂 `analyzeAudio`（引擎内部会重采样，不用自己 resample）；只分析前 3 分钟保证秒出；④**songs store 的 getter 叫 `allSongs`、歌名字段叫 `title`**（不是 songs/name），本会话在这里踩过真 bug（关联歌曲下拉空）；⑤麦克风需要安全上下文（HTTPS），与调音器同坑；⑥IAB 浏览器验收时「录音中」每秒 UI 更新会让 Playwright 点击永远等不到元素稳定（超时），改用新 tab + dom_cua/cua 坐标点击；IAB 里 getUserMedia 可能直接放行（能真录环境噪音，测出低置信度 BPM 是正常的，不是 bug）。
26. **AI 答疑（v0.4.1 新增）**：①**API Key 绝不进前端/git**——只存 CF 控制台环境变量（`AI_KEY_DEEPSEEK`/`AI_KEY_ARK`/`AI_KEY_QWEN`，方舟 model 是 `AI_MODEL_ARK`=ep-xxx），代理在 `app/functions/api/ask.js`；②三平台都是 OpenAI 兼容 chat/completions，一张表切；③**本地 dev 不跑 Functions**——`chat.js` 的 `apiBase()` 在 DEV 时指向线上 pages.dev，所以本地联调必须先部署 Functions（部署后未配 Key 会返回 NO_KEY 错误提示，正好验证错误链路）；④CF Pages 构建根目录是 app，Functions 必须放 `app/functions/`；⑤上下文传递：入口页 `stashAskContext` 写 sessionStorage → ChatView onMounted `takeAskContext` 取走（用完即清），提问时随 system 发；⑥CF 环境变量改动后需重新部署（Redeploy）才生效。

## 7. 与用户协作的注意事项

- 用户中文交流、非开发者、零吉他基础，解释方案用「呈现形式/优缺点」的通俗方式。
- **用户的工作方式（本会话明确）**：①大功能先问清需求再动手，他会要求先指出「架构问题、扩展性问题、安全问题和维护成本」再一起重新设计——照做，别直接写代码；②GitHub 提交不用勤，「大版本一次提交」——但验收中发现的 bug 修复需及时推送让他手机生效（他会理解）；③验收能交给代理做（浏览器模拟手机/桌面视口），他说「你帮我验收」就全流程走一遍出报告。
- 已确认的决定不要重复征求：PWA 形态、推送加、Capacitor（M4）、种子库自建、录音本地优先、瑞士军刀风、纯前端分析、新手模式默认开、项目名、谱子人工整理+仅本地、和弦谱形式、图库页样式。
- 用户时间不固定，学习计划是弹性「练习包」不是固定日历；练习包每项要带「为什么这么建议」（规则透明是验收标准）。
- 用户会自己上传歌曲到 `spike/songs/`，flac/mp3/kgg 混着来，kgg 按坑 2 处理；慢歌测速不准的（如春日影）加种子库权威条目。
- 每改完一轮 git commit；需求变更同步进 `需求文档.md` 修订记录（现在到 v0.3.8）；推送失败要重试。
- 开发服务器 `http://localhost:4174`（`cd F:/电吉他学习/app && npm run dev -- --port 4174`），会话结束后可能被系统回收。
