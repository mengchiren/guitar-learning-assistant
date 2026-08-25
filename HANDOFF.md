# HANDOFF 交接文档

> 给一个完全没有上下文的新对话看。工作目录：`F:\电吉他学习`（Windows 10，Git Bash）。项目名：**练琴搭子 · PickBuddy**。当前版本 **v0.10.2**。

## 1. 我们在做什么任务

给一位**电吉他零基础初学者**（用户本人）做个人学习助手 PWA「练琴搭子」（Vue 3 + Vite + vite-plugin-pwa）：

- **产品形态**：响应式网页 PWA，电脑浏览器 + 安卓手机都能用，可安装到手机桌面。**已部署上线**（Cloudflare Pages + GitHub 自动部署）。
- **核心功能**：①上传想练的歌 → 纯前端本地分析（BPM/调性/套路，**Web Worker 后台跑不卡 UI**）→ 给出**他这套设备**（依班娜 GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱）的设置建议，新手模式是大白话分步操作流程；②练琴打卡计时、连续天数、提醒；③**M3 学习计划**：规则引擎生成弹性练习包（10/30/60 分钟三档）、基本功清单与达标标记、歌曲「练习中/已掌握」状态与同套路推荐、统计报表（周报/热力图）、成田课程进度跟踪（194 课）；④练习项详情页（基本功任务分解 + 图示）与**和弦谱**（种子曲谱 19 首 + 用户自录曲谱 + 和弦图库 82 个）；⑤**录音回听**：练习页/工具页双入口录音（麦克风、存本机 IndexedDB），录完自动复用分析引擎测 BPM（置信度 + 手动改），回听页播放/删除，分类与打卡一致；⑥**AI 答疑**：聊天页 `/ask`（多模型切换，DeepSeek 已配 Key 可用）+ 歌曲/练习详情页「问 AI」上下文入口，走 Cloudflare Pages Functions 代理（Key 只存 CF 环境变量，永不进前端；**v0.5.0 起需访问令牌 ASK_TOKEN 防刷**）；⑦**数据备份**：「我的」页导出/恢复全部结构化数据（v0.5.0 新增，录音不含）。
- **产品策略（三层）**：种子库人工数据优先 → AI 分析作参考并标置信度 → 人工纠错兜底。**别把 AI 结果当精确数据呈现。**
- **目标歌曲**：日系动漫乐队歌（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队）+ Beyond 经典。

**需求的唯一权威来源是 `需求文档.md`（当前 v0.6.4，含完整修订记录）**，任何功能争议以它为准，改需求必须先改它。

## 2. 关键文件地图

| 路径 | 作用 |
|---|---|
| `需求文档.md` | 需求规格 v0.6.0：功能需求、设备参数、成本评估、路线图（M0~M4）、修订记录 |
| `HANDOFF.md` | 本交接文档 |
| `验收指南.md` | 手把手手机验收清单（L 录音 / M AI 答疑含 Key 与 **ASK_TOKEN 令牌**配置步骤 / N 数据备份）+ 反馈模板 + 常见问题 |
| `README.md` | GitHub 项目主页（功能/目录/测试/CI/部署/隐私/路线图，已同步到 v0.6.0） |
| `.github/workflows/ci.yml` | **CI**：push/PR 自动跑合成音频引擎测试 + 规则引擎 25 项 + 数据 767 项 + **Store 冒烟 20 项** + **设备建议回归 14 项** + 生产构建；真实歌曲对拍因版权音频不入库，只在本地跑 |
| `spike/` | 验证与测试：Python librosa 版 `analyze.py`、`make_synthetic.py`、**前端引擎对拍 `test_frontend_analyze.mjs`**（本地跑）、**合成音频引擎测试 `test_frontend_synthetic.mjs`（CI 跑）**、**Store 冒烟测试 `test_stores_smoke.mjs`（20 项，CI 跑）**、**套路规则+设备建议回归 `test_tone_guide.mjs`（14 项，CI 跑）**、**规则引擎对拍 `test_plan_engine.mjs`（25 项）**、**数据校验 `test_sheets.mjs`（767 项）**、`gen_course_catalog.py`、单文件分析 `analyze_one.mjs`、**批量分析 `batch_analyze_songs.mjs`（结果 `batch_analyze_result.json`）**、**曲谱生成 `write_sheets.py`** |
| `spike/.venv/` | Python 3.13 虚拟环境（librosa + imageio-ffmpeg），git 忽略 |
| `spike/songs/`、`歌曲文件/`、`视频教程/` | 用户音频/视频，**git 忽略**，勿提交（版权内容）。`歌曲文件/` 已重命名为「歌手 - 歌名」 |
| `app/` | 应用主体（Vue 3 + Vite + PWA） |
| `app/functions/api/ask.js` | **AI 答疑代理（CF Pages Functions，POST /api/ask）**：三平台 OpenAI 兼容表（deepseek/ark/qwen），Key 只读 CF 环境变量，Origin 白名单 + **访问令牌（`ASK_TOKEN` 环境变量 + 请求头 `X-Ask-Token`，必配）**，25s 超时 |
| `app/src/data/` | **`nav.js`（路由/tab/工具页统一清单）**、`devices.js`（**含 params 能力描述 + panel 面板布局坐标/量程/说明**）、`templates.js`（**6 套套路**）、**`classifyRules.js`（套路归类规则表）**、**`seedSongs.json`（29 首种子歌）**、`fundamentals.js`（5 项基本功）、**`chords.js`（82 个和弦指法图 + 分组，`findChord`/`CHORD_GROUPS`）**、**`songSheets.js`（19 首种子曲谱，由 `write_sheets.py` 生成）**、`courseCatalog.js`（194 课，脚本生成勿手改）、**`themes.js`（v0.7.0 外观主题清单：id/名称/色板/素材）** |
| `app/src/stores/` | Pinia（**全部用 persist 插件自动落盘，store 里不再有 save 调用**）：`practice.js`（打卡 + **v0.8.0 打卡草稿 draft**）、`settings.js`（提醒/设备/新手模式）、`timer.js`（**v0.8.0 起会话落盘 `timer-session`：running/startedAt/accumulated + 跨天脏会话作废 + 启动 init() 恢复 tick**）、`metronome.js`（节拍器全局，含 currentBeat）、`songs.js`（用户歌单，**getter 叫 allSongs、字段叫 title、bpm/key/template 已归一化有效值**）、`plan.js`（达标/歌曲状态）、`course.js`、`sheets.js`（用户自录曲谱）、`recordings.js`（录音元数据，`RECORD_CATEGORIES`）、`chat.js`（AI 聊天，`AI_PROVIDERS`、`token`/`setToken`、`stashAskContext`/`takeAskContext`） |
| `app/src/composables/` | `useMediaQuery.js`（768px 断点）、`useTuner.js`（麦克风 ACF 调音） |
| `app/src/utils/` | `analyze.js`（**自研音频分析引擎，改后必须重跑对拍**；v0.8.0 帧内缓冲复用 + TEMPLATE_IDS 补 heavy；套路归类走 data/classifyRules.js）、`analyzeWorker.js`（Worker 封装）、`audio.js`（统一解码管线 `decodeToMono`）、`date.js`（本地时区日期，全工程唯一实现）、`music.js`（音名/调性/徽章常量）、`backup.js`（**v0.8.0 恢复 = 先清空全部 gla:v1: key 再写入，真「覆盖」语义**）、`id.js`（UUID 生成）、`toneGuide.js`（**按设备 params 渲染新手建议**）、`storage.js`（**schema 版本 + 迁移注册表 + 变更订阅 + v0.8.0 存储失败通知 `onStorageError`**，key 前缀 `gla:v1:`）、`planEngine.js`（**规则引擎纯函数，改后必须重跑对拍**）、`recordingsDb.js`（**IndexedDB：meta/blob 分 store，v0.8.0 增删改单事务原子化**）、`recordAnalyze.js`（录音→BPM，只分析前 3 分钟，走 Worker） |
| `app/src/plugins/` | `persist.js`（**Pinia 自动持久化插件，防抖 150ms，v0.8.0 落盘失败 catch + 通知全局横幅**） |
| `app/src/workers/` | `analyze.worker.js`（分析引擎后台线程，纯函数无 DOM 依赖） |
| `app/src/components/` | `Icon.vue`（线性 SVG 图标集，含 amp）、`ToneAdvice.vue`（**新手模式集成面板图**）、`AmpPanel.vue`（**音箱面板 SVG：数值旋钮指针角度/循环旋钮高亮+值标签/脚钉 LED，interactive 点按**）、`GuitarPanel.vue`（**吉他示意 SVG：档位单点/区间高亮**）、`ChordChart.vue`（自绘 SVG 指法图）、`FretboardMap.vue`（竖版指板图）、`RecordPanel.vue`（录音面板，双入口复用）、**`Mascot.vue`（v0.7.0 主题看板娘：右下角常驻，点她说话，仅主题配置了 mascot 素材时显示）** |
| `app/src/views/` | Home/Tools（**卡片由 nav.js 驱动**）/Songs/SongDetail/SongAnalyze/Practice/Metronome/Tuner/Templates/Devices/Reminders/Profile/Plan/Stats/Course/PlanItem/ChordLibrary/Recordings/Chat（**ChatView 顶部有 ASK_TOKEN 令牌输入卡**；**ProfileView 有数据备份卡**；**AmpGuideView「音箱入门」v0.6.2：面板点按图解 + 套路对照表**） |
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
- **首页空白 bug 修复（v0.5.1，用户电脑端验收发现）**：根因是 v0.5.0 重构 `stores/practice.js` 删了本地 `todayStr` 但 getter 调用点没改（`ReferenceError`，首页三处 getter 全炸；**Vite 构建不查未定义引用，测试也没覆盖 store**）。修复 + **新增 `spike/test_stores_smoke.mjs`（16 项，实例化全部 store 访问全部 getter/action，纯 Node + localStorage 内存 shim，已入 CI）**；顺手把全工程 63 处不带 `.js` 的相对导入统一补齐（`./router`→`./router/index.js`、`seedSongs.json` 加 `with { type: 'json' }`，Node 可直接测 store）。本地回归全过：对拍 5/5、合成 3/3、规则 25/25、数据 767/767、冒烟 16/16、构建通过。
- **工程评审修复第二批（v0.6.0，用户验收第 1 步后确认开工，方案已确认，详见需求文档修订记录）**：①**数据层重构**——`storage.js` v2（schema 版本 + 按 key 迁移注册表 + save 变更订阅，云同步接入点）、Pinia 自动持久化插件 `plugins/persist.js`（store 声明 persist 配置自动落盘，防抖 150ms，与旧版同 key 同格式零迁移，7 个 store 接入，**store 里不再有 save 调用**）、ID 改 UUID（`utils/id.js`）；②**歌曲模型统一**——`allSongs` 归一化单一实体（bpm/key/template 直接有效值），`effectiveSong` 收进 store，4 个消费方改造；③**导航配置化**——`data/nav.js` 驱动路由/tab/工具页（加页面只加一条）；④**套路规则数据化**——`data/classifyRules.js`（条件 DSL + 置信度分母表，`classify` 已导出），新增套路不改引擎；⑤**设备能力声明式化**——devices.js 的 params/keyParams（含 on/off 文案），toneGuide 按设备渲染、缺参数自动跳过；⑥**JSDoc 契约**——AnalysisResult/Confidence/Song/PlanItem/PlanOutput/StorageMeta。新增 `spike/test_tone_guide.mjs`（14 项：classify 边界点 + 设备建议输出与 v0.5.x 基准逐字符一致 + 缺参数降级），冒烟升级 20 项（含自动落盘断言），均入 CI。**用户可见变化：无**（纯工程改进）。本地回归全过：对拍 5/5、合成 3/3、规则 25/25、数据 767/767、冒烟 20/20、toneGuide 14/14、构建通过。
- **音色套路库扩充（v0.6.1，用户要求：按现有歌曲扩充）**：种子库 29 首盘点——「失真节奏 Riff」占 86%（25 首），混着重型金属与常规日摇两类音色；**新增第 6 套「金属 Riff」**（Rhythm 通道 + Metal 箱模 + Gain 7 + 低音 6/高音 5 + 混响最轻；针对 GRX40 + Jam Buddy 2），4 首重型歌改标（KiLLKiSS/Ave Mujica/黒のバースデイ/ギターと孤独と蒼い惑星）；classifyRules 置顶新增金属规则（bpm≥195 且 rmsDb>-14），对拍期望同步（KiLLKiSS→金属 Riff），toneGuide 回归 14→18 项。全量回归通过：对拍 5/5、合成 3/3、规则 25/25、数据 767/767、冒烟 20/20、toneGuide 18/18、构建通过。
- **图形化设备配置说明（v0.6.2，用户反馈文字版仍难用 + 讨论确认方案 A/双模块/音箱+吉他）**：①devices.js 加 panel 面板布局数据（JAM BUDDY 2 十旋钮三脚钉含多功能按压说明、GRX40 琴身+档位+旋钮）；②`AmpPanel.vue`/`GuitarPanel.vue` SVG 组件（数值旋钮指针 7:30→4:30、高亮红圈+值标签、interactive 点按）；③ToneAdvice 新手模式集成面板图（歌曲详情/套路库共用）；④**「音箱入门」页 `/amp-guide`**（工具页入口，点旋钮看说明 + 6 套套路对照表 + 教学视频提示）；⑤`amp` 图标 + nav 卡片；⑥回归：toneGuide 41 项（+面板数据↔套路模板一致性校验）、新增 `test_panels_render.mjs`（11 项，**Vue SSR 编译 SFC 渲染 SVG 断言高亮/指针/值标签**——inlineTemplate 编译 + import→require 转换的沙箱技巧），均入 CI。全量回归通过：对拍 5/5、合成 3/3、规则 25/25、数据 767/767、冒烟 20/20、toneGuide 41/41、面板渲染 11/11、构建通过。
- **设备建议修正（v0.6.3，用户实物反馈两个真错误）**：①**通道双脚钉**——CHANNEL（CLEAN/DRIVE）+ DRIVE MODE（RHYTHM/LEAD）两步讲全，`channelMap` 数据驱动：步骤拆两步、速览芯片显示「DRIVE → RHYTHM」/「CLEAN」、面板两个脚钉联动高亮；②**箱模名按实物 14 种更正**（65 Black/J800/DualRect/5153 系列，OD=过载推子版）+ `modelNotes` 中文对照 + 入门页 14 种对照表；模板映射：清音→65 Black Nor、轻过载→65 Black Nor OD、失真节奏→J800 Lo、金属→DualRect Red、主音→J800 Hi OD。回归：toneGuide 41→46 项（+channelMap/14 种名单/虚构名禁止校验）、面板渲染 11→12 项，均过；构建通过。
- **设备建议补全（v0.6.4，用户反馈）**：①**琴音量旋钮（VOLUME）补全**——之前只建议了音色旋钮（TONE）；GRX40 两个旋钮现在都给建议：音量进 keyParams（速览第 2 芯片、步骤第 2 步「琴：音量旋钮拧到…」、面板图上音量旋钮红圈高亮），音色留在「可先不动」；6 套套路音量参考：清音 7~8 / 轻过载 8~9 / 失真节奏 8~9 / 金属 9~10 / 主音 8~9；②**箱模名大小写规范化**——用户输入用小写是打字方便，实物为标准大小写（65 Black Nor、J800 Lo、DualRect Red、5153 EL34/6L6、OD 大写），全部按标准写法。回归：toneGuide 46 项（基准重写含音量）、面板渲染 12→13 项（+音量旋钮高亮断言），全过；构建通过。**用户确认本轮结束，等验收。**
- **外观主题系统（v0.7.0，用户要求"外观有更多样式"：参考 DSH 社区鲸鱼娘主题，指定平泽唯「呆唯风」）**：①`data/themes.js` 主题清单（id/名称/desc/色板 swatch/背景图/看板娘），settings 加 `themeId`（persist key `theme`），App.vue watch 写 `html[data-theme]`；②style.css 增加语义变量（--accent-soft/--accent-soft-2/--ok-soft/--ok-card/--warn-soft/--warn-border/--warn-text/--bar/--heat-1/--heat-2），20+ 视图硬编码色全部收敛，ChordChart/FretboardMap 红点改 CSS class；③首套主题「呆唯 · 轻音海洋」（`[data-theme='yui']`）：奶油暖粉+珊瑚粉+圆角 10px，body 背景图 `--bg-image`（遮罩 `body::before`，浓度变量 `--bg-veil` 默认 0.86），看板娘 `Mascot.vue` 右下角常驻（点她说话）；④「我的」页「外观主题」卡（THEMES 驱动，色板圆点+即时切换）；⑤素材在 `app/public/theme/`（**素材为网上收集的平泽唯形象图 + AI 生成 Q 版角色，个人学习用途、不公开传播；若未来公开分发需换授权素材**）；⑥顺手修 ProfileView「5 套→6 套」、DevicesView「od→OD」。回归 6 组全过 + 构建通过。
- **主题迭代（v0.7.1，用户反馈三连）**：①**看板娘更萌**——yui 主题看板娘换成 **AI 生成 Q 版 chibi 平泽唯**（`spike/cutout.py` 抠白底→透明+羽化，WebP 压缩 49KB）；②**透明毛玻璃模式**——settings 加 `glass`（persist key `glass`），App.vue 切 `html.glass` class，style.css 里 `html.glass` 覆盖 --bg-card/--bg-input/--border + `.card/.topbar/.subhead/.tabbar/input/select/textarea/.msg-bubble` backdrop blur(14px)，body::before opacity 0.66；「我的 → 外观主题」卡内开关；**html.glass 选择器优先级（0,1,1）高于 [data-theme]（0,1,0），放 CSS 后面即覆盖**；③**第三主题「鲸鱼女仆 · 深海茶会」（`[data-theme='maid']`）**——DSH 社区 dsh-maid-whale-webUI 设计语言：柔雾蓝 #4a86e8、水彩鲸鱼云团背景（素材取自该仓库 BSD-3-Clause）、圆角 12px、AI 生成 Q 版蓝发女仆抱小鲸鱼看板娘（WebP 83KB）；--bg-veil 0.9。回归 6 组全过 + 构建通过。
- **看板娘迭代（v0.7.2，用户反馈：加启用开关 / 鲸鱼女仆用现成 / 唯的风格不行）**：①settings 加 `mascotEnabled`（persist key `mascot`，默认开）+「我的 → 外观主题」加「显示看板娘」开关，Mascot.vue 的 visible 判断；②**maid 看板娘换现成**——deep-whale-day-night-theme 仓库自带 Q 版透明 companion（day-companion-v1.webp 420×434 RGBA 62KB），与 maid 主题同源风格统一；③**yui 看板娘重制**——AI 生成 2 候选（官方动画风/Q 版厚涂贴纸风），视觉模型评分先选 Q 版厚涂（9.8 分），**用户验收后改选官方动画画风版（v0.7.3，京都动画 K-ON! 式半身像，抠图转 WebP 31KB）**；Q 版厚涂候选留 `gui-test-screenshots/review-20260819/yui-candidates/` 备选（想换随时换）。回归 6 组全过 + 构建通过。**等用户验收。**
- **代码审查修复（v0.8.0，用户用 GLM 5.3 做了全量代码审查，逐条核实后按 A+B+C 三组全部实施）**：**A 组数据可靠性主线**——①**计时落盘 + 打卡草稿闭环**：timer store 加 persist（`timer-session`，running/startedAt/accumulated，now 不入库），启动 `init()` 恢复 tick；**恢复防护**：running 会话跨天或超 12 小时（如昨晚忘关）自动作废防误记；PracticeView 的 finished/tags/note 移入 practice store 的 `draft`（persist `practice-draft`）——进程被杀/误关后重开，计时和「已结束待保存」草稿都在；②**录音保存错误处理 + 原子化**：RecordPanel.saveRec 包 try/catch（失败提示 + 不重置表单 + 不再假「已保存」，<1 秒提示太短不保存）；recordingsDb 新增 `addRecording`/`deleteRecording` 单事务双 store（原来 blob/meta 两个独立事务，配额满会留孤儿 blob）；③**落盘失败全局告警**：storage.js 新增 `onStorageError` 通知（save 失败抛错同时通知），persist 插件 catch 落盘失败，App.vue 挂「存储空间不足」横幅（可关闭，兑现 storage.js「宁可暴露问题」的注释）；④**备份恢复修复**：restoreBackup 先等 250ms 冲刷挂起 persist 写入 → **清空全部 gla:v1: key 再写备份**（真「覆盖」语义，不再混合新旧状态）→ ProfileView 立即 reload（去掉 1.2s 窗口期，期间 store 变更会覆盖回旧内存态）；confirm 文案改「清除当前全部数据并恢复备份」。**B 组契约/视觉**——⑤**TEMPLATE_IDS 补 heavy + 护栏**：补「金属 Riff」→heavy；**护栏测试立刻抓到 GLM 也没发现的隐藏 bug**：classifyRules 输出「清音+合唱氛围」（无空格）与 templates.js name「清音 + 合唱氛围」（带空格）不一致 → 用户上传归为此套路的歌 findToneTemplate 匹配不到、详情页设备建议缺失（种子库 29 首恰好无此套路所以一直没暴露）——统一为 templates.js 权威名（classifyRules + TEMPLATE_IDS + 测试期望 3 处同步）；⑥**硬编码色收敛**：style.css 5 处（subhead/tabbar/topbar/timer-chip/btn:active）+ 3 个视图弹层（zoom-card/del-card/set-cur-btn）+ ChatView 气泡（含 `--line` 旧变量名）全部改语义变量，glass 覆盖列表补 timer-chip/zoom-card/del-card；⑦**调音器**：useTuner 自相关按有效窗长归一化（原来除以全长能量，lag 越大分数越低→强二次谐波吉他音色偏高八度误判），TunerView 指针 `50+cents/2`（±50 音分满程，原来 /0.5 是 ±25 打满，与文字 ±50 对不上）；⑧**PWA**：globPatterns 加 webp/jpg/png（11 个主题素材全部进 precache，断网可换肤），manifest 补 192/512 PNG 图标（`spike/make_icons.py` Pillow 重绘 icon.svg 图形生成，像素校验过）。**C 组小修**——系统通知落地（HomeView 到点且已授权时 new Notification，每天一条防重复，RemindersView 文案同步）、metronome `await ctx.resume()`、analyze.js 死分支清理 + 帧内缓冲复用、ToneAdvice 设备改 computed、package.json version 0.5.0→0.7.3、ChatView 消息 key 改 role+at。**踩到并修复一个自引 bug**：mag 缓冲复用后 `prevMag = mag` 变成自引用（同数组），谱通量恒 0，真实对拍 4/5 抓出（雑踏 184.6 vs 171 超 3% 阈值），基线对比确认后改 `prevMag.set(mag)`，对拍恢复 5/5——**教训：帧内缓冲复用必须检查跨帧引用的数组（见坑 39）**。回归全过：对拍 5/5、合成 3/3、规则 25/25、数据 767/767、冒烟 24/24（+timer 落盘/draft 落盘/失败通知/备份覆盖 4 项）、toneGuide 53/53（+套路名映射护栏 7 项）、面板 13/13、构建通过（precache 82 项 1215KB）。**待用户验收。**
- **v0.9.0（性能优化 A 方案，用户提「切换界面卡」后按流程先分析再实施）**：①**tab 页面 KeepAlive 保活**（App.vue `KeepAlive :include` + 5 个 view `defineOptions({name})`，切回零重建；HomeView 定时器改 onActivated/onDeactivated）；②**tab 互切不强制回顶**（router scrollBehavior：to/from 都 meta.tab 时返回 undefined，保留各自滚动位置）；③**tab chunk 空闲预加载**（App.vue onMounted requestIdleCallback 预热 5 个 tab 路由）；④**移动端低分辨率背景图**（`spike/make_theme_mobile.py`：yui 257KB jpg→1170 宽 webp 109KB、maid 64KB→780 宽 32KB，style.css 媒体查询 <768px 切换）；⑤**毛玻璃移动降级**（<768px blur 14px→6px saturate 1.1，backdrop-filter 低端安卓 GPU 最贵）。回归 6 组全过 + 构建过；**KeepAlive 生效已用 DOM 同节点证明**（切走切回同一元素；注意 MutationObserver 对 Vue 整页切换只记 1 条（fragment 一次插入），毫秒测量不可信，见坑 44）。
- **v0.10.2（图表悬停气泡，用户要求"像 DeepSeek 开放平台那样鼠标放柱状图上显示详细时长"，需求明确直接实施）**：①首页「最近 7 天」、统计页「近 4 周趋势」、月度热力图 hover 显示 `日期 · X 分钟 / X 小时 X 分（周内加天数）/ 未练琴`；②手机 tap 同柱/格切换显示（再点隐藏）；③全局 `.chart-tip` 样式（style.css，CSS 变量随深浅主题/毛玻璃）；④原热力图原生 `title` 移除；⑤顺手修桌面热力图格子过大（`.heat-grid { max-width: 500px }`，手机不变）。事件模型：`@mouseenter/@mouseleave`（桌面）+ `@click` toggle（移动 tap），`tipKey` ref 按天/周/日 key。验证：`gui-test-screenshots/hover-shot.mjs`（**headless CDP mouseMoved 不派生 mouseenter，脚本改为直接派发 mouseenter 事件**）。回归 6 组全过 + 构建过。**待用户验收。**
- **v0.10.1（桌面布局自适应，用户反馈「页间位置不一致 + 导航栏两边空」，讨论后确认 A1 方案）**：①**顶栏全宽**——App.vue 模板把 `.topbar` 从 `.shell` 移出（App 根级 fragment 元素），内部新增 `.topbar-inner`（max-width 1280 居中 + padding 0 32px 与 `.page` 内容对齐），背景横贯全屏、导航项与内容区左右对齐；②**shell 1120→1280**；③**卡片自动列数**：工具页 `repeat(auto-fill, minmax(250px,1fr))`（1280 下 4 列，7 卡 4+3）、歌曲页 `minmax(320px)`（1280 下 3 列）、和弦库桌面 `minmax(120px)`（**手机保持 4 列，只改桌面**——注意 ChordLibraryView 底部 92 行曾有一处重复的 `repeat(6,1fr)` 老规则会覆盖新规则，已删）；④**首页 hero 卡三区统一**（今日分钟 + 连续打卡 + 开始练习按钮同一张卡；桌面侧栏独立连击大卡移除，`streak-big` 死样式删除）。手机端零变化（390 视口逐页核对）。回归 6 组全过 + 构建过。**待用户验收。**
- **v0.10.0（界面风格落地：新默认主题「DeepSeek 极简」，用户从 3 款风格稿+临时预览页中选型，拍板参考 DeepSeek Harness）**：①`data/themes.js` 新增 dsh 主题并排第一（DEFAULT）——近白 #fbfbfd 大留白、白卡细边框大圆角 16px、克制深蓝 #3d6ff2、页顶淡蓝光晕（`--bg-image` 用径向渐变，无图片素材、不进 precache）、标题色块改蓝色小圆点（`[data-theme='dsh'] h1.page-title::before`）；②**深色模式**：settings 新增 `darkMode`（persist key `dark-mode`，system/light/dark 三档，我的→外观主题卡内选择，默认 system），App.vue 按 matchMedia + 设置同步 `html.dark`；深色变量块 `html.dark[data-theme='dsh']`（**仅 dsh 提供深色**，其他主题忽略该设置）；深色下毛玻璃变量用 `html.dark[data-theme='dsh'].glass` 覆盖（html.glass 的浅色半透明会穿帮）；③**默认值迁移**：settings 的 `loadThemeId()`——旧默认 classic 自动迁到 dsh（用户仍可手动切回）；④删除临时风格预览页（StylePreviewView.vue + /style-preview 路由，截图留档 `gui-test-screenshots/style-preview/`）。回归 6 组全过 + 构建过（precache 84 项 1362KB）。**待用户验收。**
- 全程约 53 个提交，git 历史即详细变更记录；需求文档修订记录完整到 v0.8.0；README/验收指南/交接文档全同步。

## 4. 当前卡在哪

**v0.10.2（图表悬停气泡：7 天/4 周/热力图 hover + tap）已提交**，等用户验收。验收重点：

1. **悬停气泡**（重点）：鼠标放首页「最近 7 天」柱上弹 `08/22 · 30 分钟`（没练显示未练琴）；统计页 4 周柱弹 `08/24 周 · 1 小时 5 分（4 天）`；热力图格弹 `08/24 · 30 分钟`；深色/毛玻璃下气泡跟随主题。
2. **手机 tap**：点柱/格子显示，再点同位置隐藏；不影响滚动。
3. **热力图桌面尺寸**：限制在 500px 内（原来格子巨大），手机不变。
4. **桌面布局回归**（v0.10.1）：顶栏全宽、工具 4 列/歌曲 3 列、首页 hero 三区。
5. **主题/深色/性能回归**（v0.10.0/v0.9.0）：四套主题切换、深色三档、tab 切换与滚动保持。
6. **v0.8.0 遗留验收**（计时落盘/录音保存提示/存储满横幅/备份覆盖/主题色收敛/调音器/PWA/系统通知 8 项）未验完的可顺带。
7. **v0.4.2/v0.6.x 遗留的待用户反馈**（功能层面，与本次无关）：
1. **曲谱准确性（重点）**：19 首曲谱中多数标注了来源与置信度；单源/自动检测的（影色舞等）标注「请对照原曲校准」。用户弹到不对的，按他听出来的改数据（人工纠错永远优先）。
2. **新歌 BPM/调性待校准**：22 首新歌的 BPM/调性多为引擎分析值（`dataFrom` 标「待人工校准」）；用户弹到速度不对的报过来改。已知悬案：天使にふれたよ!（社区谱 100~117 疑似半速）、青春コンプレックス（社区谱 155 vs 分析 185）、ソラノムジカ（分析 129 vs 半速记谱 98）。
3. 计划页练习包建议、达标标准难度是否合适；和弦图库 82 个指法是否有标错的。
4. 录音自动对拍准不准（清音录音测不准是预期的）；AI 答疑回答质量与模型切换习惯。
5. 用户手机验收新版（刷新两三次避开 SW 旧缓存）。

**不要在他反馈前自作主张改设计**，等他给意见再动手。用户的工作方式（已确认）：**大功能先问清需求**——他会要求先指出「架构问题、扩展性问题、安全问题和维护成本」再一起重新设计方案，然后才让动手。v0.7.0 主题系统即按此流程：先调研（DSH 社区鲸鱼娘主题 + 多邻国设计）+ 四维方案讨论 → 用户拍板方案 A（主题切换系统）+ 指定平泽唯「呆唯风」→ 实施。

## 5. 下一步计划（按路线图）

1. **等用户验收 v0.10.2（图表悬停气泡 + v0.10.x 布局/主题/性能系列）** → 按反馈微调；v0.8.0 遗留验收顺带。
2. **曲谱继续扩充**：用户练到哪首需要谱 → 按「宁缺毋滥、人工整理、标注来源与校准状态」补 `songSheets.js`（改后重跑 `spike/write_sheets.py` 或手改，然后 `node spike/test_sheets.mjs` 校验）；谱里出现新和弦同步补 `chords.js`（校验硬约束：谱中和弦必须在图库有定义）。
3. **M4-3 剩余**（用户已按「架构/安全/成本」分析法选定前两项为录音、AI 答疑）：**微信推送（推送加）**——个人 token 不能存前端，需 CF Functions 代理 + 环境变量，免费版每日有限额；**Capacitor 安卓壳 + 桌面小组件**——签名/商店上架/双端构建，维护成本最高，等核心稳定再上。
4. 云同步（Supabase）**已确认暂缓**，等手机/电脑双端都用起来再说；`storage.js` 的变更订阅 + 版本迁移 + persist 插件已把同步接入点铺好。
5. pages.dev 免费域名国内访问不稳定，后续可选自定义域名（换域名记得更新 ask.js 的 Origin 白名单 + 可补按 IP 限流）。
6. P2 成就徽章/等级（统计页做了一部分，徽章未做）。

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
13. **设备参数来自实物核对（v0.6.3/v0.6.4 起）**：GRX40/Jam Buddy 2 参数在 `devices.js`；**14 种箱头模拟名单已按用户实物确认**（65 Black Nor/OD、65 Black Vib/OD、J800 Lo/OD、J800 Hi/OD、DualRect Red/OD、5153 EL34/OD、5153 6L6/OD，OD=过载推子版；**名字用标准大小写——用户打小写是偷懒，实物为准，别照抄小写**），模板不再用虚构名（Rock/Metal/Blues 之类，校验测试禁止）；**通道是双脚钉**：CHANNEL（CLEAN/DRIVE）+ DRIVE MODE（RHYTHM/LEAD），映射在 `channelMap`；**吉他两个旋钮 VOLUME/TONE 都要给建议**（音量旋钮在 keyParams/步骤/速览/面板高亮里，音色旋钮在「可先不动」里）。
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
35. **重构删函数定义必须同步所有调用点**（v0.5.1 血泪教训）：`stores/practice.js` 删了本地 `todayStr` 改用 `utils/date.js` 的 `localDateStr`，但 getter 里的 `todayStr()` 调用点没改 → 首页三处 getter 运行时 `ReferenceError` → **首页空白**。Vite 构建只查语法不查未定义引用，普通测试也不覆盖 store。对策：①改动 store 后必跑 `node spike/test_stores_smoke.mjs`；②**全工程相对导入已统一带 `.js` 扩展名**（`./router` 目录导入是例外，要写 `./router/index.js`；JSON 导入带 `with { type: 'json' }`）——Node 现在可以直接 import store 模块，别回退到不带扩展名的写法。
36. **Pinia 插件在 `pinia.install(app)` 前只排队不生效**（v0.6.0 踩过）：`createPinia().use(plugin)` 若 pinia 还没装进 Vue app，插件进 `toBeInstalled` 队列，**已创建的 store 拿不到插件**——真实应用里 `app.use(pinia)` 在挂载时触发安装所以正常，但纯 Node 测试（冒烟测试）里只 `setActivePinia(createPinia().use(x))` 不会触发——测试里要 `createApp({}).use(pinia)` 先装一下。冒烟测试已这么写，别删。另：persist 插件是防抖 150ms 落盘，冒烟测试断言落盘前要等 ~350ms。
37. **Pinia 4 的 `$subscribe`**：`store.$subscribe(cb, { detached: true, deep: true })` 深度监听整个 state——即使只改一个字段也会触发所有 persist 配置的定时器（插件按 key 分别防抖，无碍）；状态初始化（`load()`）不算 mutation 不会触发；**没改过的 store 不会落盘**（如 settings 只读不写就没有对应 localStorage key，不是 bug）。
38. **主题换肤相关（v0.7.0）**：①**localStorage 值是 JSON 序列化后的**——persist 插件存 `JSON.stringify(value)`，外部注入/手工设置时记得存 `"yui"` 而不是 `yui`（`JSON.parse` 会抛错回退默认值，曾导致换肤截图验证失败）；②**CSS 变量换肤链路**：settings.themeId → App.vue watch（immediate）→ `document.documentElement.dataset.theme` → style.css `[data-theme='yui']` 变量块；body 背景图用 `--bg-image` + `body::before` 固定 86% 遮罩（z-index:-1）保证可读性，**别删 body::before**；③**SVG 属性不支持 CSS 变量**——`fill="#e30613"` 这类 presentation attribute 不能写 `fill="var(--accent)"`，要改 CSS class（如 `.dot { fill: var(--accent) }`），ChordChart/FretboardMap 已改；④**新主题三处**：`data/themes.js` 加一条（id/名称/desc/swatch/素材）+ style.css 加 `[data-theme='xxx']` 变量块 +（可选）`public/theme/` 放素材；⑤**素材版权**：平泽唯形象图为个人学习用途收集（用户已确认不传播、不注重版权）；若站点要公开分发，需换授权素材或 AI 原创；⑥主题素材会进 SW precache（precache 体积会涨，注意图片压缩，建议 <300KB/张）；⑦换肤即时生效无需刷新，但线上更新后仍需刷新两三次避开旧 SW。
39. **帧内缓冲复用的自引用坑（v0.8.0 血泪教训）**：把 `const mag = new Float32Array(...)` 从帧循环提到循环外复用时，**必须检查跨帧引用的数组**——原代码循环末尾 `prevMag = mag`（每帧新建时没问题，引用赋值指向新数组），复用后变成 prevMag 与 mag 同数组：下一帧先覆写 mag 再算 `flux += max(0, m - prevMag[k])` → 恒 0 → **谱通量全灭、BPM 测速漂移**（真实对拍 4/5 抓出：雑踏 184.6 vs 171 误差 8%）。修复：`prevMag.set(mag)`（拷贝）。**教训：改引擎缓冲复用后必须重跑真实对拍 5 首**——合成测试只靠 envRms 分量仍能过（3/3），抓不到谱通量丢失。
40. **套路名空格统一（v0.8.0）**：`classifyRules.js` 的 template、`analyze.js` 的 TEMPLATE_IDS key、`templates.js` 的 name 必须完全一致（含空格）——曾因「清音 + 合唱氛围」在 classifyRules 少空格，归类命中的歌 `findToneTemplate` 匹配不到模板，**详情页设备建议缺失**（种子库 29 首恰好无此套路所以没暴露）。`test_tone_guide.mjs` 第 6 节已有「TEMPLATE_IDS 覆盖全部套路名且 id 一致」护栏，新增套路/改名后必须过它。
41. **KeepAlive 保活相关（v0.9.0）**：①**include 匹配组件名**——`<script setup>` SFC 编译器不自动设 name 选项，必须显式 `defineOptions({ name: 'XView' })`，否则 include 静默不匹配、保活不生效；②**页面级定时器生命周期**——保活后组件不卸载，`onUnmounted` 不再触发（HomeView 的 30s clockTimer 改 `onDeactivated` 停 / `onActivated` 启）；③**滚动**——保活后 DOM 留在原位，router scrollBehavior 里 tab↔tab 互切要返回 `undefined`（不滚动），否则 `{top:0}` 会把滚到一半的页面踢回顶部；④**录音等含卸载清理的组件别放进保活名单**（RecordPanel「切走即停录音」靠 onUnmounted，仅挂在 PracticeView/RecordingsView 这两个非 tab 页，安全）；⑤Chunk 预热只对未访问过的路由有意义（SW precache 其实已含全部产物）。**测量陷阱**：Vue 3 路由切换时 DOM 是**整个 fragment 一次插入**，MutationObserver **只记 1 条**——用 mutation 计数/稳定时间测切换耗时不可信（prof-nav.mjs 第一版数据作废），可信的验证是「切走切回根元素同一」（DOM 复用证明，见 `gui-test-screenshots/diag-keepalive2.mjs`）或 rAF 双帧计时（awaitPromise:true）。
42. **主题/深色模式相关（v0.10.0）**：①`--bg-image` 不只收 url，**radial-gradient 字符串也行**（dsh 光晕就这么干的，零素材）；但 `--bg-veil` 默认 0.86 的 body::before 白罩会盖掉渐变——**纯渐变背景的主题必须 `--bg-veil: 0`**；②**深色只有 dsh**：`html.dark[data-theme='dsh']` 变量块，App.vue 按 `settings.darkMode`（system/light/dark）+ matchMedia 切 `html.dark` class；其他主题无深色块自动忽略（设置页文案已注明）；③**html.glass 的优先级低于 `html.dark[data-theme='dsh']`**（0,1,1 < 0,2,1），所以 dsh 深色下毛玻璃靠 `html.dark[data-theme='dsh'].glass`（0,3,1）覆盖半透明变量，**别删**；④v0.10.0 起默认主题是 dsh，settings 的 `loadThemeId()` 里 classic→dsh 迁移（localStorage 里存的是 JSON 字符串，写值用 `save()` 别裸写）；⑤**本地 preview + SW 干扰截图**：vite preview 会注册 SW，同一 Chrome profile 二次访问会用旧 SW 缓存（旧 index.html 旧 JS）——验证新构建的截图必须**新 user-data-dir 新 Chrome**；dev(4175) 无此问题因为是 dev 模式。
43. **顶栏全宽（v0.10.1）**：`.topbar` 已是 App 模板**根级 fragment 元素**（与 `.shell` 平级），shell 的 max-width 影响不到它——以后调整宽度要**同时改** `.topbar-inner` 的 max-width（与 `.shell` 一致）和 `.page` 的 padding（左右对齐），否则导航项与内容错位；桌面端 `.desktop-only` 隐藏逻辑不受影响（topbar 移出后移动端依然 display:none）；**自动列数**（auto-fill minmax）需要各 grid 都检查一遍，防止历史遗留的同规则媒体查询覆盖（和弦库曾有两处桌面规则，后者会覆盖前者）。

## 7. 与用户协作的注意事项

- 用户中文交流、非开发者、零吉他基础，解释方案用「呈现形式/优缺点」的通俗方式。
- **用户的工作方式（已确认）**：①大功能先问清需求再动手，他会要求先指出「架构问题、扩展性问题、安全问题和维护成本」再一起重新设计方案——照做，别直接写代码；②GitHub 提交不用勤，「大版本一次提交」——但验收中发现的 bug 修复需及时推送让他手机生效；③验收能交给代理做（浏览器模拟手机/桌面视口），他说「你帮我验收」就全流程走一遍出报告。
- **v0.5.0/v0.6.0 流程记录**：用户发起四维评审 → 我把问题清单 + 方案草案给他 → 他要求每个决策点列优缺点 → 他全选推荐项（防刷先做 / 只导结构化数据 / 云同步暂缓 / JSDoc 渐进式）→ 确认分步实施先第 1 步 → 第 1 步验收通过（含抓出首页空白 bug）→ 确认开工第 2 步 → 第 2 步（v0.6.0）完成推送，等验收。
- 已确认的决定不要重复征求：PWA 形态、推送加、Capacitor（M4）、种子库自建、录音本地优先、瑞士军刀风、纯前端分析、新手模式默认开、项目名、谱子人工整理+仅本地、和弦谱形式、图库页样式、录音双入口/自动对拍/四分类、AI 多平台可切换（先 DeepSeek）/聊天页+页面内入口、**云同步暂缓、备份不含录音、JSDoc 渐进式类型、AI 防刷令牌方案**。
- 用户时间不固定，学习计划是弹性「练习包」不是固定日历；练习包每项要带「为什么这么建议」（规则透明是验收标准）。
- 用户会自己上传歌曲到 `歌曲文件/`（酷狗 M800 命名、flac/mp3 混着来）——用 ffmpeg 读 ID3 元数据识别歌名重命名；kgg 按坑 2 处理；慢歌测速不准的（如春日影）靠种子库权威值兜底。
- 每改完一轮 git commit；需求变更同步进 `需求文档.md` 修订记录（现在到 v0.6.0）；推送失败用坑 28 的重试循环。
- 开发服务器 `http://localhost:4174`（`cd F:/电吉他学习/app && npm run dev -- --port 4174`），会话结束后可能被系统回收。
