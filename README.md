# 练琴搭子 · PickBuddy

> 陪你练琴的个人助手：歌曲分析、音色设置、练琴打卡。为一位电吉他零基础学习者（本人）量身打造。

## 这是什么

「练琴搭子」是一个**纯前端的个人电吉他学习助手**（响应式 PWA）：电脑浏览器和安卓手机都能用，可安装到手机桌面。核心思路是「AI 参考 + 种子曲库校准 + 人工纠错」——自动分析给出参考结果和置信度，人工数据（种子曲库、手动纠错）始终优先。

**目标设备**：Ibanez GRX40-LGY 电吉他 + JOYO Jam Buddy 2 音箱。所有音色建议都按这套设备标注。

**目标曲风**：日系动漫乐队（轻音、孤独摇滚、MyGO!!!!!、Ave Mujica、哭泣少女乐队）+ Beyond 经典。

## 功能

- 🎵 **歌曲分析**（纯前端，音频不出设备）：上传 mp3/flac/wav/m4a，本地分析出 BPM、调性 Top3、粗略和弦、音色套路归类，每项带置信度徽章；酷狗 kgg 等加密格式会引导换源或手动录入。
- 🎸 **设备设置建议**：把套路模板映射到具体设备参数；两种显示模式——「新手模式」是大白话分步操作流程（参数速览 + 照做步骤 + 可先不动的旋钮），「完整模式」是全部参数表。
- 📚 **歌曲库**：种子曲库（人工校准的权威数据）+ 你自己的歌单；搜索、详情、人工纠错（纠错值优先展示）。
- ⏱ **练琴打卡**：计时切页不断、补卡、连续天数、最近 7 天统计；练琴时切去别的页面有「练习中」胶囊一键回来。
- 🥁 **节拍器**：前瞻调度的 Web Audio 节拍器（切页声音不断）、打拍定速；歌曲详情一键「用此 BPM 开节拍器」。
- 🎚 **调音器**：麦克风收音 + 参考音（EADGBE）。
- ⏰ **练琴提醒**：应用内定时提醒。
- 🎨 **视觉**：简约瑞士军刀风——米白底、细线卡片、瑞士红点缀、线性图标；桌面端为 B 站式顶栏 + 仪表盘多栏，手机端为底部导航单栏。

## 技术栈

- Vue 3 + Vite + Pinia + Vue Router + vite-plugin-pwa
- **自研纯前端音频分析引擎**（`app/src/utils/analyze.js`）：手写 FFT/onset 包络/自相关/K-S 调性模板，无任何 ML/音频库依赖，Node 与浏览器通用
- 本地存储（localStorage 抽象层，为将来云同步预留）

## 目录结构

```
├── app/                  # 应用主体（Vue 3 + Vite + PWA）
│   └── src/
│       ├── components/   # Icon、ToneAdvice（设备建议卡）等
│       ├── composables/  # useMediaQuery、useTuner
│       ├── data/         # devices.js（设备参数）、templates.js（5 套音色套路）、seedSongs.json（种子曲库）
│       ├── stores/       # Pinia：practice/timer/metronome/songs/settings
│       ├── utils/        # analyze.js（分析引擎）、toneGuide.js（新手文案）、storage.js
│       └── views/        # 页面
├── spike/                # M0 可行性验证（Python librosa 版）+ 前端引擎对拍单测
├── 需求文档.md           # 需求规格（唯一权威来源，含修订记录）
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

对拍单测（改引擎算法后必须重跑）：

```bash
# ffmpeg 路径（来自 spike 虚拟环境）
FFMPEG=$(spike/.venv/Scripts/python.exe -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
node spike/test_frontend_analyze.mjs "$FFMPEG"
```

## 部署

Cloudflare Pages + GitHub 自动部署（push 即发）：

- 站点：<https://guitar-learning-assistant.pages.dev>
- 构建配置：根目录 `app`、构建命令 `npm run build`、输出目录 `dist`、环境变量 `NODE_VERSION=22`
- SPA 深链接回退：`app/public/_redirects`

## 隐私

所有数据（打卡记录、歌单、设置）只存在本机浏览器；上传的音频**不会离开设备**，仅在浏览器本地解码分析。无账号、无追踪、无后端。

## 路线图

- ✅ M0 可行性验证（BPM/调性/套路识别）
- ✅ M1 基础功能（设备档案、套路库、节拍器、调音器、打卡、提醒）
- ✅ M2 歌曲分析（搜索、上传分析、详情、纠错）
- 🔜 M3 学习计划（规则引擎 + 课程进度 + 统计报表）
- 🔜 M4 AI 答疑、安卓壳 + 桌面小组件、微信推送、录音回听

*个人项目，未开源。*
