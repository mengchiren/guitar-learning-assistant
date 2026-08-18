# HANDOFF 交接文档

> 给一个完全没有上下文的新对话看。工作目录：`F:\电吉他学习`（Windows 10，Git Bash）。项目名：**练琴搭子 · PickBuddy**。当前版本 **v0.5.0**。

## 1. 我们在做什么任务

给一位**电吉他零基础初学者**（用户本人）做个人学习助手 PWA「练琴搭子」（Vue 3 + Vite + vite-plugin-pwa）：

- **产品形态**：响应式网页 PWA，电脑浏览器 + 安卓手机都能用，可安装到手机桌面。**已部署上线**（Cloudflare Pages + GitHub 自动部署）。
- **核心功能**：①上传想练的歌 → 纯前端本地分析（BPM/调性/套路，**Web Worker 后台跑不卡 UI**）→ 给出**他这套设备**（依班娜 GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱）的设置建议，新手模式是大白话分步操作流程；②练琴打卡计时、连续天数、提醒；③**M3 学习计划**：规则引擎生成弹性练习包（10/30/60 分钟三档）、基本功清单与达标标记、歌曲「练习中/已掌握」状态与同套路推荐、统计报表（周报/热力图）、成田课程进度跟踪（194 课）；④练习项详情页（基本功任务分解 + 图示）与**和弦谱**（种子曲谱 19 首 + 用户自录曲谱 + 和弦图库 82 个）；⑤**录音回听**：练习页/工具页双入口录音（麦克风、存本机 IndexedDB），录完自动复用分析引擎测 BPM（置信度 + 手动改），回听页播放/删除，分类与打卡一致；⑥**AI 答疑**：聊天页 `/ask`（多模型切换，DeepSeek 已配 Key 可用）+ 歌曲/练习详情页「问 AI」上下文入口，走 Cloudflare Pages Functions 代理（Key 只存 CF 环境变量，永不进前端；**v0.5.0 起需访问令牌 ASK_TOKEN 防刷**）；⑦**数据备份**：「我的」页导出/恢复全部结构化数据（v0.5.0 新增，录音不含）。
- **产品策略（三层）**：种子库人工数据优先 → AI 分析作参考并标置信度 → 人工纠错兜底。**别把 AI 结果当精确数据呈现。**
- **目标歌曲**：日系动漫乐队歌（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队）+ Beyond 经典。

**需求的唯一权威来源是 `需求文档.md`（当前 v0.5.0，含完整修订记录）**，任何功能争议以它为准，改需求必须先改它。

## 2. 关键文件地图

| 路径 | 作用 |
|---|---|
| `需求文档.md` | 需求规格 v0.5.0：功能需求、设备参数、成本评估、路线图（M0~M4）、修订记录 |
| `HANDOFF.md` | 本交接文档 |
| `验收指南.md` | 手把手手机验收清单（L 录音 / M AI 答疑含 Key 与 **ASK_TOKEN 令牌**配置步骤 / N 数据备份）+ 反馈模板 + 常见问题 |
| `README.md` | GitHub 项目主页（功能/目录/测试/CI/部署/隐私/路线图，已同步到 v0.5.0） |
| `.github/workflows/ci.yml` | **CI（v0.5.0 新增）**：push/PR 自动跑合成音频引擎测试 + 规则引擎 25 项 + 数据 767 项 + 生产构建；真实歌曲对拍因版权音频不入库，只在本地跑 |
| `spike/` | 验证与测试：Python librosa 版 `analyze.py`、`make_synthetic.py`、**前端引擎对拍 `test_frontend_analyze.mjs`**（本地跑）、**合成音频引擎测试 `test_frontend_synthetic.mjs`（v0.5.0 新增，CI 跑）**、**规则引擎对拍 `test_plan_engine.mjs`（25 项）**、**数据校验 `test_sheets.mjs`（767 项）**、`gen_course_catalog.py`、单文件分析 `analyze_one.mjs`、**批量分析 `batch_analyze_songs.mjs`（结果 `batch_analyze_result.json`）**、**曲谱生成 `write_sheets.py`** |
| `spike/.venv/` | Python 3.13 虚拟环境（librosa + imageio-ffmpeg），git 忽略 |
| `spike/songs/`、`歌曲文件/`、`视频教程/` | 用户音频/视频，**git 忽略**，勿提交（版权内容）。`歌曲文件/` 已重命名为「歌手 - 歌名」 |
| `app/` | 应用主体（Vue 3 + Vite + PWA） |
| `app/functions/api/ask.js` | **AI 答疑代理（CF Pages Functions，POST /api/ask）**：三平台 OpenAI 兼容表（deepseek/ark/qwen），Key 只读 CF 环境变量，Origin 白名单 + **访问令牌（`ASK_TOKEN` 环境变量 + 请求头 `X-Ask-Token`，v0.5.0 起必配）**，25s 超时 |
| `app/src/data/` | `devices.js`、`templates.js`（5 套套路）、**`seedSongs.json`（29 首种子歌）**、`fundamentals.js`（5 项基本功）、**`chords.js`（82 个和弦指法图 + 分组，`findChord`/`CHORD_GROUPS`）**、**`songSheets.js`（19 首种子曲谱，由 `write_sheets.py` 生成）**、`courseCatalog.js`（194 课，脚本生成勿手改） |
| `app/src/stores/` | Pinia：`practice.js`（打卡）、`settings.js`（提醒/设备/新手模式）、`timer.js`（计时全局）、`metronome.js`（节拍器全局，含 currentBeat）、`songs.js`（用户歌单，getter 叫 **allSongs**、歌名字段叫 **title**）、`plan.js`（达标/歌曲状态）、`course.js`、`sheets.js`（用户自录曲谱）、`recordings.js`（录音元数据，`RECORD_CATEGORIES`）、`chat.js`（AI 聊天，`AI_PROVIDERS`、**`token`/`setToken`（ASK_TOKEN，v0.5.0）**、`stashAskContext`/`takeAskContext`） |
| `app/src/composables/` | `useMediaQuery.js`（768px 断点）、`useTuner.js`（麦克风 ACF 调音） |
| `app/src/utils/` | `analyze.js`（**自研音频分析引擎，改后必须重跑对拍**）、`analyzeWorker.js`（**Worker 封装，v0.5.0：优先后台线程，不可用回退主线程**）、`audio.js`（**统一解码管线 `decodeToMono`，v0.5.0：歌曲分析与录音对拍共用**）、`date.js`（**本地时区日期 `localDateStr`/`shiftDate`，v0.5.0：全工程唯一实现**）、`music.js`（**音名/调性/置信度徽章常量，v0.5.0**）、`backup.js`（**数据备份/恢复，v0.5.0**）、`toneGuide.js`、`storage.js`（localStorage 抽象，key 前缀 `gla:v1:`）、`planEngine.js`（**规则引擎纯函数，改后必须重跑对拍**）、`recordingsDb.js`（IndexedDB：meta/blob 分 store）、`recordAnalyze.js`（录音→BPM，只分析前 3 分钟，**走 Worker**） |
| `app/src/workers/` | `analyze.worker.js`（**分析引擎后台线程，v0.5.0**，纯函数无 DOM 依赖） |
| `app/src/components/` | `Icon.vue`（线性 SVG 图标集）、`ToneAdvice.vue`、`ChordChart.vue`（自绘 SVG 指法图）、`FretboardMap.vue`（竖版指板图）、`RecordPanel.vue`（录音面板，双入口复用） |
| `app/src/views/` | Home/Tools/Songs/SongDetail/SongAnalyze/Practice/Metronome/Tuner/Templates/Devices/Reminders/Profile/Plan/Stats/Course/PlanItem/ChordLibrary/Recordings/Chat（**ChatView 顶部有 ASK_TOKEN 令牌输入卡**；**ProfileView 有数据备份卡**） |
| `app/public/_redirects` | SPA 深链接回退（CF Pages 需要，别删） |

**路由全景**：`/`(tab) `/plan`(tab) `/practice` `/tools`(tab) `/metronome` `/tuner` `/chords` `/recordings` `/ask` `/songs`(tab) `/songs/new` `/songs/:id` `/profile`(tab) `/stats` `/course` `/devices` `/reminders` `/templates` `/plan-item/basic/:id`。`meta.tab` = 显示底部导航（手机 5 标签：首页/计划/工具/歌曲/我的）。

**Git 与部署**：远程 `origin` = `github.com/mengchiren/guitar-learning-assistant`（**私有**）。**push 后 Cloudflare Pages 自动部署**到 `https://guitar-learning-assistant.pages.dev`。构建配置：根目录 `app`、`npm run build`、输出 `dist`、`NODE_VERSION=22`。本机到 GitHub 推送**间歇性失败**（国内网络抖动），**用后台重试循环推送**（见坑 28）。CF 环境变量：`AI_KEY_DEEPSEEK`（已配）、`AI_KEY_ARK`+`AI_MODEL_ARK`、`AI_KEY_QWEN`（按需）；改动后需 Retry deployment。

## 3. 已经完成了什么

- **M0 可行性验证**（Python spike）：5 首真实歌曲对拍——BPM「半速加倍」误差 ≤1.5%；调性 4/5；套路归类 4/5；和弦识别薄弱（结论：免费工具链承担 BPM/调性参考/套路归类）。
- **M1 基础功能**：设备档案、音色套路库（5 套）、节拍器、调音器、练琴打卡/补卡/提醒、种子歌曲库。瑞士军刀风视觉（米白底 `#f4f3ef`、细线卡片、瑞士红 `#e30613` 只做强调、线性 SVG 图标、二级页返回键）。
- **桌面/移动分离布局**（断点 768px）；**跨页协作**：计时与节拍器全局 store，切页不停表/不停声，「练习中 mm:ss」胶囊一键回练习页。
- **M2 歌曲分析**（纯前端，音频不出设备）：自研引擎 `analyze.js`，5 首真实歌曲对拍 5/5；歌曲库搜索、详情页（设备建议 + 节拍器联动 + 人工纠错）、添加歌曲（上传分析 + 手动录入兜底，kgg 拒绝）。上传上限 100MB。
- **新手模式显示偏好**（默认开）；**慢歌测速修复**（节拍强度比较法，春日影入种子库 97 BPM）。
- **部署上线**（CF Pages）+ **定名**「练琴搭子 · PickBuddy」。
- **v0.3.5 验收反馈修复**：路由滚动位置重置；节拍器圆点按拍跳动；提醒时间双下拉；纠错「已保存」提示 watch 坑。
- **M3 学习计划（v0.3.6）**：规则引擎 `planEngine.js`（25 项对拍）：三档练习包、动态调整（上周 ≤2 天减半、连续 3 周达标 +10%）；基本功清单 5 项 + 达标标记；歌曲「练习中/已掌握」+ 同套路推荐；统计报表页；成田课程进度页（194 课）。
- **计划项详情页 + 曲谱（v0.3.7）**：基本功详情页（任务分解 + 图示 + 节拍器联动 + 达标切换）；自绘 SVG 和弦图组件；歌曲详情「曲谱（和弦谱）」区；种子曲谱 2 首；用户自录曲谱（localStorage）。
- **爬格子竖版 + 和弦图库（v0.3.8）**：FretboardMap 竖版；图库扩到 49 个；`/chords` 页 + 放大弹层；校验 212 项。
- **录音回听 + 自动对拍（v0.4.0，M4-1）**：`RecordPanel.vue` 双入口录音；MediaRecorder mime 探测（webm/opus → webm → mp4）；单次最长 10 分钟；录完自动测 BPM（标置信度可手改）；IndexedDB 存本地（meta/blob 分 store）；回听页播放/删除；分类与打卡一致。**验收抓到真 bug**：关联歌曲下拉空（`songs.songs`/`s.name` 写错，应为 `allSongs`/`title`）。
- **AI 答疑（v0.4.1，M4-2）**：CF Pages Functions 代理（Key 只存环境变量）；三平台切换（先接 DeepSeek）；聊天页（气泡/模型 chips/历史 50 条滚动/清空）；歌曲详情「问 AI 这首歌怎么练」+ 基本功详情「问 AI 这个练习怎么练」（上下文经 sessionStorage 传递，实测 AI 能准确引用歌名/BPM/调性）；工具页第 6 张卡片 + sparkle 图标。
- **代码审查修复（v0.4.1 后）**：①AI 代理 CORS 全开 → **Origin 白名单**（线上实测 403/403/200）；②上游 25s 超时；③聊天历史保留 50 条。
- **进度条 bug 修复（用户反馈）**：MediaRecorder 录的 webm 文件头无时长 → `audio.duration=Infinity`、进度条拖不动——保存前用 `fix-webm-duration` 补写 Duration（毫秒单位）。
- **删除 bug 修复（用户反馈「确认删除没反应」）**：根因是 **v-for 里的模板 ref 被 Vue 收集成数组**，`audioEl.value.pause()` 抛 TypeError 中断删除/停止流程（且 `play()` 一直静默失败，自动播放从未生效）——改**函数式 ref** + 删除确认改**独立弹层** + 错误信息展示。实测：自动播放/停止/播放中删除/取消全部正常。
- **曲谱大扩充 + 新歌入库（v0.4.2）**：用户提供 23 首歌曲文件——按 ID3 元数据重命名「歌手 - 歌名」+ 批量分析 BPM/调性/套路；**种子库 7→29 首**（分析值入库标「待人工校准」）；**曲谱 2→19 首**（5 个搜索代理并行检索交叉验证，来源与校准状态全标注；10 首无可靠谱不录，宁缺毋滥）；**和弦图库 49→82 个**（升/降号调标准按法）；校验升级 **767 项断言**全过。
- **工程评审修复第一批（v0.5.0，用户发起四维评审后确认方案，详见需求文档修订记录）**：①**AI 代理防刷**——新增访问令牌 `ASK_TOKEN`（CF 环境变量 + 请求头 `X-Ask-Token` 校验；Origin 白名单挡不住脚本直连，令牌层补上；**未配令牌时接口拒绝服务**，应用内 AI 答疑页顶部有令牌输入卡）；②**数据备份/恢复**——`utils/backup.js` + 「我的」页导出/恢复（结构化数据 JSON，录音不含，遍历 `gla:v1:` 前缀自动覆盖未来新 store）；③**CI**——`.github/workflows/ci.yml`（合成音频引擎测试 + 规则 25 项 + 数据 767 项 + build）；④**重复代码收敛**——`utils/date.js`（消灭 5 份 `localDateStr` 重复）、`utils/music.js`（PITCH/KEYS/CONF_LABELS）、`utils/audio.js`（`decodeToMono` 统一歌曲分析与录音解码管线）；⑤**分析引擎进 Web Worker**——`workers/analyze.worker.js` + `utils/analyzeWorker.js`（Float32Array 转移所有权零拷贝，Worker 不可用回退主线程）；⑥package.json 版本统一 0.5.0。**本地验证全过**：真实歌曲对拍 5/5、合成 3/3、规则 25/25、数据 767/767、生产构建通过。**待用户操作**：CF 后台配 `ASK_TOKEN` 环境变量 + 重新部署，手机验收（验收指南 M 第一步半 / N 节新增）。
- 全程约 40 个提交，git 历史即详细变更记录；需求文档修订记录完整到 v0.5.0；README/验收指南/交接文档全同步。

## 4. 当前卡在哪

**等待用户做两件事（v0.5.0 发布后）：**

1. **配 ASK_TOKEN 访问令牌（必须，否则 AI 答疑不可用）**：CF 后台环境变量加 `ASK_TOKEN`（值 = 我生成的一长串随机字符，会话里发给他；他自己换任意随机字符串也行）→ Retry deployment → 应用内 AI 答疑页顶部输入框填入保存。步骤在验收指南 M 第一步半。
2. **手机/电脑验收 v0.5.0**（验收指南 N 节新增数据备份；M 节新增令牌验收项；顺带确认之前 v0.4.2 的遗留问题）：

**v0.4.2 遗留的待用户反馈**：
1. **曲谱准确性（重点）**：19 首曲谱中多数标注了来源与置信度；单源/自动检测的（影色舞等）标注「请对照原曲校准」。用户弹到不对的，按他听出来的改数据（人工纠错永远优先）。
2. **新歌 BPM/调性待校准**：22 首新歌的 BPM/调性多为引擎分析值（`dataFrom` 标「待人工校准」）；用户弹到速度不对的报过来改。已知悬案：天使にふれたよ!（社区谱 100~117 疑似半速）、青春コンプレックス（社区谱 155 vs 分析 185）、ソラノムジカ（分析 129 vs 半速记谱 98）。
3. 计划页练习包建议、达标标准难度是否合适；和弦图库 82 个指法是否有标错的。
4. 录音自动对拍准不准（清音录音测不准是预期的）；AI 答疑回答质量与模型切换习惯。
5. 用户手机验收新版（刷新两三次避开 SW 旧缓存）。

**不要在他反馈前自作主张改设计**，等他给意见再动手。用户的工作方式（已确认）：**大功能先问清需求**——他会要求先指出「架构问题、扩展性问题、安全问题和维护成本」再一起重新设计方案，然后才让动手。**v0.5.0 的评审-方案-确认-实施流程已完成第 1 步，等验收后再做第 2 步（数据层重构/导航配置化/套路设备声明式化/JSDoc 类型）。**

## 5. 下一步计划（按路线图）

1. **等用户配 ASK_TOKEN + 验收 v0.5.0** → 按意见微调（令牌流程、备份体验、曲谱数据校准、BPM 修正、练习包规则、录音/AI 体验）。
2. **工程改进第 2 步（方案已确认，等第 1 步验收后开工）**：数据层重构（统一 schema + 版本号 + 迁移函数 + Pinia 自动持久化插件 + ID 改 UUID，storage.js 升级带变更订阅为云同步留口）、歌曲模型统一（种子/用户歌收敛单一实体）、导航配置化（nav.js 驱动路由/tab/工具页/首页卡片）、套路与设备声明式化（规则/设备能力进数据文件）、JSDoc 渐进式类型（引擎契约/存储 schema/跨 store 传参）。
3. **曲谱继续扩充**：用户练到哪首需要谱 → 按「宁缺毋滥、人工整理、标注来源与校准状态」补 `songSheets.js`（改后重跑 `spike/write_sheets.py` 或手改，然后 `node spike/test_sheets.mjs` 校验）；谱里出现新和弦同步补 `chords.js`（校验硬约束：谱中和弦必须在图库有定义）。
4. **M4-3 剩余**（用户已按「架构/安全/成本」分析法选定前两项为录音、AI 答疑）：**微信推送（推送加）**——个人 token 不能存前端，需 CF Functions 代理 + 环境变量，免费版每日有限额；**Capacitor 安卓壳 + 桌面小组件**——签名/商店上架/双端构建，维护成本最高，等核心稳定再上。
5. 云同步（Supabase）**已确认暂缓**，等手机/电脑双端都用起来再说；`storage.js`/`recordingsDb.js` 抽象层已留好口，第 2 步升级后同步接入更顺。
6. pages.dev 免费域名国内访问不稳定，后续可选自定义域名（换域名记得更新 ask.js 的 Origin 白名单 + 可补按 IP 限流）。
7. P2 成就徽章/等级（统计页做了一部分，徽章未做）。

## 6. 踩过的坑（绝对不要踩）

1. **包管理镜像**：pip 必须加 `-i https://mirrors.aliyun.com/pypi/simple/`；`app/.npmrc` 配的 npmmirror **别删**。
2. **酷狗音频**：mp3 读不动用 ffmpeg 转 wav（ffmpeg 路径：`spike/.venv/Scripts/python.exe -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`）。**kgg 是加密格式，解不开，不要碰解密**（法律灰色），引导用户换源或歌名检索。
3. **日期必须用本地时区**：`toISOString()` 是 UTC，中国时区凌晨差一天。新代码用 PracticeView 的 `localDateStr()` / planEngine 的 `fmt()` 模式。
4. **Vue computed 依赖**：非响应式源（`Date.now()`）必须显式读每秒 tick 的 ref 才触发更新。
5. **PWA Service Worker 缓存**：同 origin 旧 SW 会缓存旧版本，开发换端口（4173 已被污染，现用 4174）；线上更新后用户需刷新两三次或清缓存。
6. **测试音频来源**：archive.org、incompetech、GitHub raw 本机连不上；需要样本用 `spike/make_synthetic.py` 生成，或用 `spike/songs/`、`歌曲文件/` 真实歌曲。
7. **librosa 1.0 API 变了**：`tempo_frequencies` 已移除等，参考现有 spike 代码。
8. **BPM 半速用节拍强度比较法**（v0.3.2 起）：测值 <100 时比较 lag 与 lag/2 自相关强度，lag/2 ÷ lag ≥0.98 才加倍。**别再退回一律 ×2**（会把 96 BPM 的春日影翻成 191）。**已知硬伤**：春日影类「1.5 倍谐波」慢歌无法自动纠正，靠种子库 + 人工纠错兜底。
9. **调性/和弦识别不是权威**：强力弦摇滚缺三音有固有歧义。产品必须种子库优先 → AI 标置信度 → 人工纠错。
10. **音频/视频不进 git**：`.gitignore` 已排除 `歌曲文件/`、`视频教程/`、`spike/songs/`、`node_modules`、`spike/.venv`、`app/public/test-audio.mp3`、`gui-test-screenshots/`。用户歌曲是版权内容。
11. **Windows 端口残留**：任务被 kill 后 node 可能占端口：`netstat -ano | grep :端口 | grep -i listen` 拿 PID → `taskkill //F //PID <PID>`。
12. **手机调音器/录音需要 HTTPS**：getUserMedia 要求安全上下文。线上已 HTTPS；局域网 IP 的 http 不行。
13. **设备参数来自网络检索**：GRX40/Jam Buddy 2 参数在 `devices.js`，音箱 14 种箱头模拟名单未核实全。
14. **浏览器测试方法**（browser-use 技能，`mcp__node_repl__js` 工具）：开 IAB 浏览器，`setViewportSize` 模拟手机（390×844）与桌面（1280×800）；**本会话模型看不了图片**——截图证据用 Python PIL 做像素校验（尺寸/颜色分布/区域 diff），截图存 `gui-test-screenshots/`（不进 git）；`playwright.evaluate` 会被安全策略拒绝（简单只读如 `window.scrollY` 可行，读 localStorage 被拒）；**读非有限数值（NaN/Infinity）用 `String(el.duration)` 包装**（安全层把非有限值序列化成 undefined）；aria-hidden 的 SVG 内容不在快照里（验证 SVG 用 locator 计数）；`fill('')` 对 search 输入框不生效（用 click + Control+A + Backspace）；HMR 会重置组件局部状态；**IAB 不支持文件选择器**——上传联调用添加歌曲页 dev-only 的「加载开发测试音频」按钮；**IAB 点击通道会间歇性失效**（一个 tab 用久了 playwright 点击超时、cua 坐标/dom_cua 都无效）——**换新 tab 通常恢复**；**页面持续更新（计时 tick、录音中、节拍器跑）会让 playwright 点击永远等不到元素稳定**——用 `dom_cua.get_visible_dom()` 拿 node ref 再 `dom_cua.click({node_id})`，或读按钮 boundingBox 用 `cua.click({x,y})` 坐标点；截图偶发「activity capture failed」重试一次即可；IAB 里 getUserMedia 可能直接放行（能真录环境噪音，测出低置信度 BPM 是正常现象不是 bug）。
15. **AGENTS.md 规矩**：编辑任何已有文本文件前用 chardet 检测编码（本工程都是 UTF-8）；新文件直接 UTF-8。
16. **计时器/节拍器是全局 store**：切页不停表/不停声靠 `stores/timer.js`、`stores/metronome.js` 共享实例。不要写回页面级 composable。**练习页不要放节拍器控件**（用户明确拒绝过）。
17. **分析引擎对拍**：改 `analyze.js` 任何算法/阈值后必须重跑 `node spike/test_frontend_analyze.mjs <ffmpeg路径>`，5 首全项通过才算数。
18. **调性 chroma 是 STFT 近似非 CQT**：逐八度归一化 + 小数 midi 插值两个技巧缺一不可（去掉任一个对拍掉到 2/5）；K-S 模板滚动方向用 `(j - i + 12) % 12`（与 np.roll 同向），写反会全歌误判 D# 调。
19. **规则引擎与数据对拍**：改 `planEngine.js` 后重跑 `node spike/test_plan_engine.mjs`（25 项）；改 `chords.js`/`songSheets.js`/`fundamentals.js` 后重跑 `node spike/test_sheets.mjs`（767 项：图库无重名、分组合法、**谱中每个和弦必须在图库有定义**——硬约束，加谱不补图会挂）。测试都是纯 node ESM，**import 必须带 `.js` 扩展名**。
20. **Vue watch 深层依赖陷阱**：`watch(computedSong)` 回调里若读 song 的深层响应式字段，保存修改后 watch 会连带触发——曾导致纠错「已保存」提示永远不显示。**watch 源要选浅层稳定的值（如 `() => song.value?.id`）**。
21. **曲谱合规红线**：不从第三方曲谱网站抓谱/嵌图（版权风险）；谱子 = 人工整理的学习笔记（**标注来源与校准状态**），**仅存本地浏览器、无分享/导出/公开功能**（用户已确认）。宁缺毋滥，没把握的歌不录谱；搜不到可靠和弦进行的就留「暂无曲谱」。
22. **课程目录是生成数据**：`courseCatalog.js` 由 `spike/gen_course_catalog.py` 扫描 `视频教程/` 文件名生成，**勿手改**。
23. **部署配置**：CF Pages 构建必须设**根目录 `app`**、`NODE_VERSION=22`、输出 `dist`；SPA 回退靠 `app/public/_redirects`。push 即自动部署。
24. **项目名**：「练琴搭子 · PickBuddy」，品牌名出现在 App.vue 顶栏、index.html 标题、vite.config.js manifest、ProfileView 关于文案、README、仓库描述——改名要全同步。
25. **录音功能**：①录音存 IndexedDB（`recordingsDb.js`），meta 与 blob 分两个 object store，列表页只读 meta——别塞 localStorage（5MB 上限）；②MediaRecorder mimeType 要先 `isTypeSupported` 探测（webm/opus → webm → mp4 降级），iPhone Safari 只支持 mp4/aac；③分析录音用 `decodeAudioData` 混单声道再喂 `analyzeAudio`（引擎内部会重采样）；只分析前 3 分钟；④**songs store 的 getter 叫 `allSongs`、歌名字段叫 `title`**（不是 songs/name），踩过真 bug；⑤**webm 录音没有时长字段**（进度条 bug 根源）——保存前用 `fix-webm-duration` 补写 Duration（毫秒单位）；**该包是纯 CJS，动态 import 不会自动进 Vite 预构建，dev 下静默失败**——`vite.config.js` 的 `optimizeDeps.include` 已列入，**别删**；⑥**v-for 里的模板 ref 会被 Vue 收集成数组**（不是元素）——回听页 audio 曾因此 `pause()` 抛错导致「确认删除没反应」，**v-for 内要拿元素必须用函数式 ref**（`:ref="setEl"` + `let el = null`）；⑦**两段式按钮（点一次变确认文案）会因列表重渲染出现点击竞态**，删除已改独立弹层确认。
26. **AI 答疑**：①**API Key 绝不进前端/git**——只存 CF 环境变量（`AI_KEY_DEEPSEEK`/`AI_KEY_ARK`/`AI_KEY_QWEN`，方舟 model 是 `AI_MODEL_ARK`=ep-xxx），代理在 `app/functions/api/ask.js`；②三平台都是 OpenAI 兼容 chat/completions；③**本地 dev 不跑 Functions**——`chat.js` 的 `apiBase()` 在 DEV 时指向线上 pages.dev，本地联调必须先部署 Functions；④CF Pages 构建根目录是 app，Functions 必须放 `app/functions/`；⑤上下文传递：入口页 `stashAskContext` 写 sessionStorage → ChatView `takeAskContext` 取走（用完即清）；⑥**防盗刷两层（v0.5.0 起）**：Origin 白名单（`ALLOWED_ORIGINS`，防浏览器跨站）+ **访问令牌 `ASK_TOKEN`（防脚本直连，必配，见坑 31）**，换自定义域名时白名单要加、且可补按 IP 限流；⑦CF 环境变量改动后需 Redeploy（Deployments → ⋯ → Retry deployment）才生效。
27. **git add -A 会误提交验收截图**：`gui-test-screenshots/` 已加 .gitignore，但别删这行；提交前看 `git status --short` 确认文件清单。
28. **推送网络抖动**：本机到 GitHub 间歇性失败（Recv failure/443 超时/挂起）。**用后台重试循环推送**：`for i in 1 2 3 4 5 6; do if git push origin main; then exit 0; fi; sleep 90; done`（run_in_background 跑），**别把「没推上去」当「没提交」**；成功判定看输出里的 `..<hash>` 箭头——注意本环境 grep `->` 会被当选项解析（ugrep），别用 `grep -q "->"` 判断。
29. **批量数据脚本**：生成 seedSongs/songSheets 这类数据优先写 Python 脚本文件再执行（`spike/write_sheets.py` 模式），**Git Bash 里 heredoc 内嵌长 Python 有转义/闭合坑**；JS 对象 key 含连字符（如 'no-thank-you'）必须加引号；数组条目行尾逗号别漏。
30. **AskUserQuestion 用户未回答时**：按最佳判断收尾（不把无回答当拒绝、不臆造偏好），把选项留在最终消息里供他回来再选。
31. **AI 访问令牌（v0.5.0）**：①`ASK_TOKEN` 是 CF 环境变量，**值绝不进 git/代码**——生成方式：`[guid]::NewGuid().ToString('N')` 拼两个（64 位 hex）或任意 20+ 位随机字符串，由用户在 CF 后台配置并在应用内填入；②**服务端未配 ASK_TOKEN 时 `/api/ask` 直接 503 拒绝**（fail-closed，宁可暂时用不了也不敞开额度）；③令牌存 localStorage `gla:v1:ask-token`，随备份导出（本机文件，可接受）；④换自定义域名时 Origin 白名单要加，同时可补 Cloudflare 按 IP 限流规则（pages.dev 免费域名配不了）。
32. **Web Worker 与 Vite**：`new Worker(new URL('../workers/x.worker.js', import.meta.url), { type: 'module' })` 是 Vite 原生支持的写法（dev 与 build 都自动打包，build 产物里能看到独立 worker chunk）；**postMessage 传 Float32Array 时用转移列表 `[samples.buffer]`**（零拷贝，但转移后主线程的 samples 不能再读）；Worker 里 import 的模块必须是纯函数（analyze.js 无 DOM 依赖才敢放 Worker）；`analyzeWorker.js` 已有 Worker 崩溃/不可用回退主线程逻辑，别删。
33. **PowerShell 跑 ffmpeg 对拍的中文路径坑**：工作目录含中文（`F:\电吉他学习`），PowerShell 下 Python 输出的 ffmpeg 路径会乱码（GBK 控制台）导致 spawn 失败——先 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` 再取路径；Git Bash 无此问题（HANDOFF 里的 `FFMPEG=$(...)` 用法在 Git Bash 下照旧）。
34. **合成音频测试的校准陷阱**（`test_frontend_synthetic.mjs`）：完全均匀的冲击串在引擎的自相关上所有周期整数倍 lag 打平，会随机测出 1/2 速甚至 1/3 速——**每拍振幅必须加「缓慢起伏的正弦调制 + 小扰动」**（模拟真实演奏的渐强渐弱，让真周期独占鳌头）；固定种子（42）保证 CI 可复现；「半速加倍」分支在合成音上无法稳定触发（阈值按真实音乐校准），由本地真实歌曲对拍覆盖，别硬凑。

## 7. 与用户协作的注意事项

- 用户中文交流、非开发者、零吉他基础，解释方案用「呈现形式/优缺点」的通俗方式。
- **用户的工作方式（已确认）**：①大功能先问清需求再动手，他会要求先指出「架构问题、扩展性问题、安全问题和维护成本」再一起重新设计方案——照做，别直接写代码；②GitHub 提交不用勤，「大版本一次提交」——但验收中发现的 bug 修复需及时推送让他手机生效；③验收能交给代理做（浏览器模拟手机/桌面视口），他说「你帮我验收」就全流程走一遍出报告。
- **v0.5.0 流程记录**：用户发起四维评审 → 我把问题清单 + 方案草案给他 → 他要求每个决策点列优缺点 → 他全选推荐项（防刷先做 / 只导结构化数据 / 云同步暂缓 / JSDoc 渐进式）→ 确认分步实施先第 1 步 → 第 1 步完成推送。**第 2 步方案已在他确认的清单里，等第 1 步验收后再动。**
- 已确认的决定不要重复征求：PWA 形态、推送加、Capacitor（M4）、种子库自建、录音本地优先、瑞士军刀风、纯前端分析、新手模式默认开、项目名、谱子人工整理+仅本地、和弦谱形式、图库页样式、录音双入口/自动对拍/四分类、AI 多平台可切换（先 DeepSeek）/聊天页+页面内入口、**云同步暂缓、备份不含录音、JSDoc 渐进式类型、AI 防刷令牌方案**。
- 用户时间不固定，学习计划是弹性「练习包」不是固定日历；练习包每项要带「为什么这么建议」（规则透明是验收标准）。
- 用户会自己上传歌曲到 `歌曲文件/`（酷狗 M800 命名、flac/mp3 混着来）——用 ffmpeg 读 ID3 元数据识别歌名重命名；kgg 按坑 2 处理；慢歌测速不准的（如春日影）靠种子库权威值兜底。
- 每改完一轮 git commit；需求变更同步进 `需求文档.md` 修订记录（现在到 v0.5.0）；推送失败用坑 28 的重试循环。
- 开发服务器 `http://localhost:4174`（`cd F:/电吉他学习/app && npm run dev -- --port 4174`），会话结束后可能被系统回收。
