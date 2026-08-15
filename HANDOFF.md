# HANDOFF 交接文档

> 给一个完全没有上下文的新对话看。工作目录：`F:\电吉他学习`（Windows 10，Git Bash）。

## 1. 我们在做什么

给一位**电吉他零基础初学者**（用户本人）做个人学习助手「电吉他学习助手」：

- **产品形态**：响应式网页 PWA（Vue 3 + Vite），电脑浏览器 + 安卓手机都能用，可安装到手机桌面。云同步/小组件等后续里程碑再加。
- **核心功能**：①上传想练的歌 → 分析歌曲（BPM/调性/和弦/套路）→ 给出**他这套设备**（依班娜 GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱）该怎么设置（琴的拾音器档位、音箱的通道/箱模/旋钮参数）；②练琴打卡计时、连续天数、提醒；③学习计划（弹性，基于他时间不固定）。
- **目标歌曲**：日系动漫乐队歌（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队 GBC）+ Beyond 经典（光辉岁月、海阔天空）。

**需求的唯一权威来源是 `需求文档.md`（当前 v0.2.5，含完整修订记录）**，任何功能争议以它为准，改需求必须先改它。

## 2. 关键文件地图

| 路径 | 作用 |
|---|---|
| `需求文档.md` | 需求规格 v0.2.5：功能需求、设备参数、成本评估、路线图（M0~M4）、待确认项 |
| `spike/` | M0 可行性验证（Python）：`analyze.py` 音频分析脚本（BPM/调性/和弦/套路归类）、`key_check.py`、`make_synthetic.py`、`README.md`（含 5 首真实歌曲对拍表） |
| `spike/.venv/` | Python 3.13 虚拟环境（librosa 1.0.0 + imageio-ffmpeg），已被 git 忽略 |
| `spike/songs/` | 用户的歌曲音频（mp3/flac/kgg），**已 git 忽略**，测试素材 |
| `app/` | M1 应用（Vue 3 + Vite + vite-plugin-pwa），本工程主体 |
| `app/src/data/` | 核心数据：`devices.js`（两套设备参数）、`templates.js`（5 套音色套路模板）、`seedSongs.json`（6 首种子歌曲，M0 校准过的数据） |
| `app/src/utils/storage.js` | 本地存储抽象层（localStorage，key 前缀 `gla:v1:`），为将来换 Supabase 云同步预留 |
| `app/src/stores/` | Pinia：`practice.js`（打卡记录/连续天数）、`settings.js`（提醒/当前设备）、`timer.js`（练习计时，**全局，切页不停表**）、`metronome.js`（节拍器，**全局，切页不停声**） |
| `app/src/composables/` | `useTuner.js`（麦克风 + ACF 基频检测）、`useMediaQuery.js`（桌面/移动断点 768px 响应式状态）。计时与节拍器已迁到 stores/ |
| `app/src/components/Icon.vue` | 线性 SVG 图标组件（瑞士风图标集，别再用 emoji） |
| `歌曲文件/`、`视频教程/` | 用户的歌曲与成田电吉他课程视频，**已 git 忽略**，勿提交 |

Git 历史（4 个提交）：`dbd6c39` 初始（文档+spike）→ `c862756` M1 实现 → `07c9e76` 瑞士军刀风改版 → `faba473` 桌面/移动分离布局。

## 3. 已完成的工作

**需求阶段**：3 轮访谈完成；所有关键决策用户已确认——PWA 形态、Android、套路模板库方案（不做逐歌 AI 生成音色参数）、「AI 分析为主 + 种子曲库校准」数据策略、Capacitor 打包安卓壳（M4）、微信推送用「推送加」、种子曲库自建、录音本地优先。

**M0 可行性验证（完成）**：用 5 首真实歌曲对拍（社区权威数据）得出结论——
- **BPM 可用**：「半速加倍」规则（`tempo*2 if tempo<100`）后误差 ≤1.5%；
- **调性 4/5 命中**（唯一失误《NO, Thank You!》：实际 A 小调被判 E 小调，聚合 chroma 在强力弦摇滚上的固有歧义，无解，产品靠置信度+种子库纠错）；
- **套路归类 4/5 合理**；**和弦识别薄弱**（每首只输出 3~9 段、漏一半），必须靠种子库人工数据或以后付费 API。

**M1 应用（完成，已浏览器实测）**：设备档案（GRX40 五档拾音器用法 + Jam Buddy 2 全部旋钮清单）、音色套路库（5 套：清音/清音+合唱/轻过载/失真节奏/失真主音，参数按用户设备标注）、节拍器（打拍定速）、调音器（收音+参考音）、练琴计时打卡（标签+备注+补卡）、提醒设置（应用内）、歌曲库（6 首种子歌）、PWA 配置。浏览器实测走过完整打卡流程。

**视觉**：用户明确要「简约瑞士军刀风」——米白底 `#f4f3ef`、白卡片细线边框、瑞士红 `#e30613` 只做强调、线性 SVG 图标、二级页面有返回键（底部导航只在 4 个主页显示）。改版已完成并提交。

**桌面/移动分离布局（完成，已浏览器双视口实测）**：用户反馈电脑端像「手机页面硬贴大屏」，参考 B 站桌面版做了响应式拆分——断点 768px（`style.css` 媒体查询 + `useMediaQuery` composable）。**≥768px 桌面端**：顶部导航栏（品牌 + 四大导航 + 节拍器/调音器快捷钮 + 二级页返回键，`App.vue` 的 `.topbar`）、首页仪表盘多栏（主区今日时长/开始练习/7 天图，右栏连续天数/练习包/提醒）、工具页 3 列、歌曲库 2 列、设备 2 列、套路库 2 列、我的页 3 列、表单/工具类页面 `.narrow` 限宽 680px。**<768px 手机端**：与之前完全一致（底部导航 + 单栏 + 二级页返回栏），零改动。注意 CSS 层叠顺序：`.desktop-only { display:none }` 基础规则必须写在 `.topbar` 定义之后，否则同优先级下顶栏在手机上会漏出来。

**跨页协作体验（完成，已浏览器实测）**：用户反馈「开始练习后就用不了其他功能」。计时与节拍器已提升为全局 store（`timer.js`/`metronome.js`，跨页面共享同一实例）：练习计时切页不断、回来续走；节拍器切页声音不断。外壳新增「练习中 mm:ss」胶囊（桌面在顶栏内、手机底部悬浮，`App.vue` 的 `timer-chip`），点击一键回练习页、练习页上自动隐藏；练习页内嵌迷你节拍器卡（与节拍器页同一实例，不会双响）。原 `usePracticeTimer.js`/`useMetronome.js` 已删除。

## 4. 当前卡在哪

**没有技术阻塞，在等用户验收两轮改动。** ①桌面/移动分离布局（B 站式顶栏 + 仪表盘首页）；②跨页协作体验（计时/节拍器全局化 + 「练习中」胶囊 + 练习页迷你节拍器）。均已浏览器实测通过，等待用户看效果。**不要在他反馈前自作主张改设计**，等他给意见再动手。

开发服务器在 `http://localhost:4174` 后台跑着（vite dev）。本会话结束后该进程可能被系统回收——如果用户说打不开，先跑 `cd F:/电吉他学习/app && npm run dev -- --port 4174` 再排查。

## 5. 下一步计划（按路线图）

1. **等用户反馈** → 按意见微调桌面端 CSS/交互（都是小改动）。
2. **M2 歌曲分析**：把 spike 的音频分析能力接进网页——歌名搜种子库 + 上传音频（前端 Web Audio 或后端跑 analyze.py 的逻辑）→ 输出 BPM/调性/套路归类 → 套路模板映射出设备设置建议 + 置信度标注。注意上传的酷狗 mp3 要先转码（见坑 2）。
3. **部署上线**（用户想在手机上用）：Cloudflare Pages / Vercel 免费档。部署后手机才有麦克风权限（HTTPS），PWA 才能安装。部署前用户要能验收。
4. **M3**：学习计划规则引擎 + 成田课程进度跟踪 + 统计报表。
5. **M4**：AI 答疑、Capacitor 安卓壳 + 桌面小组件、微信推送（推送加）、录音回听。
6. 云同步（Supabase）在部署后按需接入，`storage.js` 抽象层已留好口。

## 6. 踩过的坑（绝对不要踩）

1. **包管理镜像**：pypi.org 直连超时，pip 必须加 `-i https://mirrors.aliyun.com/pypi/simple/`；npm 已在 `app/.npmrc` 配好 `registry.npmmirror.com`，**别删这个文件**。
2. **酷狗音频**：用户下载的 mp3 里 libsndfile 读不动的要先用 ffmpeg 转 wav（ffmpeg 在 `spike/.venv` 的 imageio-ffmpeg 包里，`python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"` 取路径）。**kgg 是酷狗加密格式，解不开，不要碰解密**（法律灰色），让用户换源或走歌名检索。
3. **日期必须用本地时区**：`new Date().toISOString()` 是 UTC，中国时区凌晨差一天（打卡记录会记错日期）。PracticeView 里有现成的 `localDateStr()` 辅助函数，新代码一律用它。
4. **Vue computed 依赖**：computed 里用 `Date.now()` 这类非响应式源时，必须显式读一个每秒 tick 的 ref 才触发更新——`usePracticeTimer.js` 的 `elapsedSec` 已修复（`now.value` 那行别删），否则时钟不走、按钮永远禁用。
5. **PWA Service Worker 缓存**：同一 origin 上 preview/旧构建的 SW 会缓存旧版本，刷新也不更新。开发调试要么换端口，要么用 dev server 全新源（4173 已被旧 SW 污染，现用 4174）。
6. **测试音频来源**：archive.org、incompetech、GitHub raw 在本机网络全部连不上。需要样本音频时可用 Aliyun 镜像下 pygame-ce 的 wheel，解压后 `pygame/examples/data/` 里有 ogg/wav。
7. **librosa 1.0 API 变了**：`librosa.feature.tempo_frequencies` 已移除，tempogram 速度轴要手算 `60*sr/(512*lag)`。
8. **BPM「半速」修正用最简规则**：beat_track 对快歌常返回半速，直接 `tempo*2 if tempo<100`（5 首歌实测 ±1.5%）。**别用 tempogram 峰值法**——上一轮试过，它会把本来测准的值改坏。
9. **调性/和弦识别不是权威**：强力弦摇滚缺三音，聚合 chroma 有固有歧义（连 ChordU 都标错）。产品必须：种子库人工数据优先 → AI 结果标置信度 → 人工纠错入口。别把 AI 结果当精确数据呈现给用户。
10. **音频/视频不进 git**：`.gitignore` 已排除 `歌曲文件/`、`视频教程/`、`spike/songs/`、`node_modules`、`spike/.venv`。用户歌曲和课程是版权内容，提交了就麻烦了。
11. **Windows 端口残留**：后台任务被 kill 后 node 进程可能残留占端口（本会话就发生过，4173 被旧预览进程占着）。清理：`netstat -ano | grep :端口 | grep -i listen` 拿 PID → `taskkill //F //PID <PID>`。
12. **手机调音器需要 HTTPS**：getUserMedia 要求安全上下文。localhost（电脑）可以，局域网 IP 的 http 不行——手机端验证调音器必须等部署到 HTTPS 托管。
13. **设备参数来自网络检索**：GRX40/Jam Buddy 2 参数已写进 `devices.js`，但音箱 14 种箱头模拟的具体名单没核实全，做音色映射前要让用户对照实物面板/说明书确认。
14. **浏览器测试的方法**：本机有 browser-use 技能（Node REPL 的 `mcp__node_repl__js` 工具），能开真浏览器验证。`playwright.evaluate` 会被安全策略拒绝（读脚本报错是正常的），用 `domSnapshot()` 读页面、用 `getByRole/getByText` 操作；aria-hidden 的 SVG 图标不会出现在快照里，别当成图标没渲染。截图存盘但本会话无法预览图片，视觉验收交给用户本人。
15. **AGENTS.md 规矩**：编辑任何已有文本文件前用 chardet 检测编码（本工程文件都是 UTF-8）；新文件直接 UTF-8。
16. **计时器/节拍器是全局 store**：`stores/timer.js`、`stores/metronome.js` 跨页面共享同一实例（切页不停表/不停声），外壳胶囊与练习页迷你节拍器都绑定它们。不要重新引入页面级 usePracticeTimer/useMetronome 这类写法——页面组件销毁会停表停声，之前的问题就是这么来的。

## 7. 与用户协作的注意事项

- 用户中文交流、非开发者、零吉他基础，解释技术方案时用「呈现形式/优缺点」的通俗方式。
- 用户已明确同意的决定不要重复征求意见：PWA、推送加、Capacitor（M4）、种子库自建、录音本地存储、瑞士军刀风。
- 用户时间不固定，产品里的学习计划要做成弹性「练习包」而不是固定日历。
- 用户会自己上传歌曲文件到 `spike/songs/` 或 `歌曲文件/`，flac/mp3/kgg 混着来，kgg 按坑 2 处理。
- 每改完一轮记得 git commit（用户要求过 git 管理），需求变更要同步进 `需求文档.md` 的修订记录。
