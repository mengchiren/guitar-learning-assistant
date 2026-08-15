# HANDOFF 交接文档

> 给一个完全没有上下文的新对话看。工作目录：`F:\电吉他学习`（Windows 10，Git Bash）。项目名：**练琴搭子 · PickBuddy**。

## 1. 我们在做什么任务

给一位**电吉他零基础初学者**（用户本人）做个人学习助手 PWA「练琴搭子」（Vue 3 + Vite + vite-plugin-pwa）：

- **产品形态**：响应式网页 PWA，电脑浏览器 + 安卓手机都能用，可安装到手机桌面。**已部署上线**（Cloudflare Pages + GitHub 自动部署）。
- **核心功能**：①上传想练的歌 → 纯前端本地分析（BPM/调性/套路）→ 给出**他这套设备**（依班娜 GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱）该怎么设置（琴的拾音器档位、音箱通道/箱模/旋钮参数），新手模式是大白话分步操作流程；②练琴打卡计时、连续天数、提醒；③歌曲库（种子曲库 + 用户歌单 + 人工纠错）。
- **产品策略（三层）**：种子库人工数据优先 → AI 分析作参考并标置信度 → 人工纠错兜底。**别把 AI 结果当精确数据呈现。**
- **目标歌曲**：日系动漫乐队歌（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队）+ Beyond 经典。

**需求的唯一权威来源是 `需求文档.md`（当前 v0.3.4，含完整修订记录）**，任何功能争议以它为准，改需求必须先改它。

## 2. 关键文件地图

| 路径 | 作用 |
|---|---|
| `需求文档.md` | 需求规格 v0.3.4：功能需求、设备参数、成本评估、路线图（M0~M4）、修订记录 |
| `README.md` | GitHub 项目主页（项目简介/功能/技术栈/对拍结果/部署/隐私/路线图） |
| `spike/` | M0 可行性验证（Python librosa 版 `analyze.py`、`key_check.py`、`make_synthetic.py`、`README.md` 对拍表）+ **前端引擎对拍单测 `test_frontend_analyze.mjs`**、单文件分析工具 `analyze_one.mjs` |
| `spike/.venv/` | Python 3.13 虚拟环境（librosa 1.0.0 + imageio-ffmpeg 提供 ffmpeg），git 忽略 |
| `spike/songs/` | 用户的歌曲音频（mp3/flac/kgg），**git 忽略**，测试素材（含春日影） |
| `app/` | 应用主体（Vue 3 + Vite + PWA） |
| `app/src/data/` | `devices.js`（设备参数）、`templates.js`（5 套音色套路 + `findToneTemplate`）、`seedSongs.json`（7 首种子歌，含春日影 97 BPM） |
| `app/src/stores/` | Pinia：`practice.js`（打卡记录）、`settings.js`（提醒/当前设备/`displayMode` 新手模式）、`timer.js`（计时全局）、`metronome.js`（节拍器全局）、`songs.js`（用户歌单） |
| `app/src/composables/` | `useMediaQuery.js`（768px 断点）、`useTuner.js`（麦克风 ACF 调音） |
| `app/src/utils/` | `analyze.js`（**自研音频分析引擎**）、`toneGuide.js`（新手大白话文案）、`storage.js`（localStorage 抽象，key 前缀 `gla:v1:`） |
| `app/src/components/` | `Icon.vue`（线性 SVG 图标集）、`ToneAdvice.vue`（设备建议卡，新手/完整双模式） |
| `app/src/views/` | Home/Tools/Songs/SongDetail/SongAnalyze/Practice/Metronome/Tuner/Templates/Devices/Reminders/Profile |
| `app/public/_redirects` | SPA 深链接回退（CF Pages 需要，别删） |
| `歌曲文件/`、`视频教程/` | 用户的歌曲与成田课程视频，**git 忽略**，勿提交 |

**Git 与部署**：远程 `origin` = `github.com/mengchiren/guitar-learning-assistant`（**私有**）。**push 后 Cloudflare Pages 自动部署**到 `https://guitar-learning-assistant.pages.dev`。构建配置：根目录 `app`、`npm run build`、输出 `dist`、环境变量 `NODE_VERSION=22`。注意：本机到 GitHub 的推送会**间歇性失败**（国内网络抖动），推送失败就重试几次，提交在本地不会丢。

## 3. 已经完成了什么

- **M0 可行性验证**（Python spike）：5 首真实歌曲对拍——BPM「半速加倍」误差 ≤1.5%；调性 4/5；套路归类 4/5；和弦识别薄弱。
- **M1 基础功能**：设备档案、音色套路库（5 套）、节拍器、调音器、练琴打卡/补卡/提醒、种子歌曲库。瑞士军刀风视觉（米白底 `#f4f3ef`、细线卡片、瑞士红 `#e30613` 只做强调、线性 SVG 图标、二级页返回键）。
- **桌面/移动分离布局**（断点 768px）：≥768px 桌面端为 B 站式顶栏 + 首页仪表盘多栏 + 多栏列表；<768px 保持手机布局（底部导航 + 单栏）。
- **跨页协作体验**：计时与节拍器提升为全局 store——切页不停表/不停声；外壳「练习中 mm:ss」胶囊（桌面顶栏内、手机底部悬浮）一键回练习页。
- **M2 歌曲分析**（纯前端，音频不出设备）：自研引擎 `analyze.js`（手写 FFT/onset 包络/自相关/K-S 调性模板，无 ML 依赖），**5 首真实歌曲对拍 5/5 全项通过**（BPM 误差 ≤3%、调性 Top3 内 5/5、套路 5/5）；歌曲库搜索、详情页（设备建议 + 「用此 BPM 开节拍器」联动 + 人工纠错）、添加歌曲（上传分析 + 手动录入兜底，kgg 拒绝）。上传上限 100MB，解码用 OfflineAudioContext 直出 22050 单声道 + PCM 内存护栏。
- **新手模式显示偏好**（「我的」页开关，默认开）：设备建议显示为「参数速览 4 芯片 + 大白话分步操作 + 可先不动清单」。
- **慢歌测速修复**：半速加倍改为**节拍强度比较法**；春日影入种子库（权威 97 BPM / B 大调 / 清音伴奏）。
- **部署上线**：Cloudflare Pages + GitHub 自动部署，站点已上线并验证（首页/深链接/SW/manifest/JS）。
- **定名**：「练琴搭子 · PickBuddy」，品牌名已同步到应用（顶栏/标题/PWA manifest/关于页）、仓库描述、README。
- 全程约 20 个提交，git 历史即详细变更记录。

## 4. 当前卡在哪

**没有技术阻塞。** 在等用户**手机验收线上版**（安装 PWA、调音器麦克风权限、上传分析）。注意两件事：

1. **GitHub 推送间歇性失败**：本机到 github.com 的网络会抖动（连接重置/超时），本地若有未推送提交，重试推送即可；推送成功后 CF 自动部署。
2. 开发服务器在 `http://localhost:4174`（vite dev），会话结束后可能被系统回收——用户说打不开就 `cd F:/电吉他学习/app && npm run dev -- --port 4174`。

**不要在他反馈前自作主张改设计**，等他给意见再动手。

## 5. 下一步计划（按路线图）

1. **等用户手机验收线上版** → 按意见微调。
2. **M3 学习计划**：规则引擎（弹性练习包，用户时间不固定）+ 成田课程进度跟踪 + 统计报表。
3. **M4**：AI 答疑、Capacitor 安卓壳 + 桌面小组件、微信推送（推送加）、录音回听。
4. 云同步（Supabase）按需接入，`storage.js` 抽象层已留好口。
5. pages.dev 免费域名国内访问不稳定，后续可选自定义域名。

## 6. 踩过的坑（绝对不要踩）

1. **包管理镜像**：pip 必须加 `-i https://mirrors.aliyun.com/pypi/simple/`；`app/.npmrc` 配的 npmmirror **别删**。
2. **酷狗音频**：mp3 若读不动用 ffmpeg 转 wav（ffmpeg 在 imageio-ffmpeg 包里，路径用 `spike/.venv/Scripts/python.exe -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"` 取）。**kgg 是加密格式，解不开，不要碰解密**（法律灰色），引导用户换源或歌名检索。
3. **日期必须用本地时区**：`toISOString()` 是 UTC，中国时区凌晨差一天。新代码用 PracticeView 里的 `localDateStr()` 模式。
4. **Vue computed 依赖**：非响应式源（`Date.now()`）必须显式读每秒 tick 的 ref 才触发更新。
5. **PWA Service Worker 缓存**：同 origin 旧 SW 会缓存旧版本，开发换端口（4173 已被污染，现用 4174）。
6. **测试音频来源**：archive.org、incompetech、GitHub raw 本机都连不上；需要样本可解包 pygame-ce wheel 拿 `pygame/examples/data/`，或用 `spike/songs/` 里的真实歌曲。
7. **librosa 1.0 API 变了**：`tempo_frequencies` 已移除等，参考现有 spike 代码。
8. **BPM 半速用节拍强度比较法**（v0.3.2 起）：测值 <100 时比较 lag 与 lag/2 的自相关强度，lag/2 ÷ lag ≥0.98 才加倍（快歌半速测值两者相当 0.995~1.000；真实慢歌 <0.973）。**别再退回一律 ×2**（会把 96 BPM 的春日影翻成 191，连 librosa 都栽）。**已知硬伤**：春日影类「1.5 倍谐波」慢歌无法自动纠正（试过 tempo 先验，会误伤快歌），靠种子库 + 人工纠错兜底。
9. **调性/和弦识别不是权威**：强力弦摇滚缺三音有固有歧义。产品必须种子库优先 → AI 标置信度 → 人工纠错。
10. **音频/视频不进 git**：`.gitignore` 已排除 `歌曲文件/`、`视频教程/`、`spike/songs/`、`node_modules`、`spike/.venv`、`app/public/test-audio.mp3`。用户歌曲是版权内容。
11. **Windows 端口残留**：任务被 kill 后 node 可能占端口：`netstat -ano | grep :端口 | grep -i listen` 拿 PID → `taskkill //F //PID <PID>`。
12. **手机调音器需要 HTTPS**：getUserMedia 要求安全上下文。线上已部署 HTTPS；局域网 IP 的 http 不行。
13. **设备参数来自网络检索**：GRX40/Jam Buddy 2 参数在 `devices.js`，音箱 14 种箱头模拟名单未核实全，做音色映射前让用户对照实物/说明书确认。
14. **浏览器测试方法**：browser-use 技能（`mcp__node_repl__js` 工具）开真浏览器；`playwright.evaluate` 会被安全策略拒绝，用 `domSnapshot()` 读页面、`getByRole/getByText` 操作；aria-hidden 的 SVG 图标不在快照里；截图本会话无法预览，视觉验收交用户；**IAB 不支持文件选择器**——上传分析联调用添加歌曲页 dev-only 的「加载开发测试音频」按钮（fetch `app/public/test-audio.mp3`，用完删）。
15. **AGENTS.md 规矩**：编辑任何已有文本文件前用 chardet 检测编码（本工程都是 UTF-8）；新文件直接 UTF-8。
16. **计时器/节拍器是全局 store**：切页不停表/不停声靠 `stores/timer.js`、`stores/metronome.js` 共享实例。不要写回页面级 composable。**练习页不要放节拍器控件**（用户明确拒绝过）。
17. **分析引擎对拍**：改 `analyze.js` 任何算法/阈值后必须重跑 `node spike/test_frontend_analyze.mjs <ffmpeg路径>`，5 首全项通过才算数；单文件看 lag 谱用 `analyze_one.mjs`。
18. **调性 chroma 是 STFT 近似非 CQT**：逐八度归一化 + 小数 midi 插值两个技巧缺一不可（去掉任一个对拍掉到 2/5）；K-S 模板滚动方向用 `(j - i + 12) % 12`（与 np.roll 同向），写反会全歌误判 D# 调。
19. **部署配置**：CF Pages 构建必须设**根目录 `app`**（漏了报 `Could not read package.json`）、`NODE_VERSION=22`（Vite 8 需要 Node ≥20.19）、输出 `dist`；SPA 回退靠 `app/public/_redirects`。push 即自动部署；本机推送失败是网络抖动，重试即可。
20. **项目名**：「练琴搭子 · PickBuddy」（v0.3.4 定名），品牌名出现在 App.vue 顶栏、index.html 标题、vite.config.js manifest、ProfileView 关于文案、README、仓库描述——改名要全同步。

## 7. 与用户协作的注意事项

- 用户中文交流、非开发者、零吉他基础，解释方案用「呈现形式/优缺点」的通俗方式。
- 已确认的决定不要重复征求：PWA 形态、推送加、Capacitor（M4）、种子库自建、录音本地优先、瑞士军刀风、纯前端分析、新手模式默认开、项目名。
- 用户时间不固定，学习计划要做成弹性「练习包」而不是固定日历（M3）。
- 用户会自己上传歌曲到 `spike/songs/`，flac/mp3/kgg 混着来，kgg 按坑 2 处理；慢歌测速不准的（如春日影）加种子库权威条目。
- 每改完一轮 git commit；需求变更同步进 `需求文档.md` 修订记录；推送失败要重试，别把「没推上去」当「没提交」。
