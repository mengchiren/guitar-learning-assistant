#!/usr/bin/env bash
# ============================================================
# 练琴搭子 · 新电脑环境自检脚本
# 用法（仓库根目录，Git Bash）：bash env-check.sh
# 只读检查，不改任何东西。所有 ❌ 项的修复步骤见《转接手册.md》第 4 节。
# ============================================================
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PASS=0; FAIL=0; WARN=0
ok()   { echo "  [OK]   $1"; PASS=$((PASS+1)); }
bad()  { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN+1)); }

echo "=============================================="
echo " 练琴搭子 · 环境自检  $(date '+%Y-%m-%d %H:%M')"
echo " 仓库: $ROOT"
echo "=============================================="

# ---------- 1. Git ----------
echo ""
echo "[1/6] Git 与仓库状态"
if command -v git >/dev/null 2>&1; then
  ok "git $(git --version | awk '{print $3}')"
  echo "      最近提交: $(git log -1 --pretty=format:'%h %s' 2>/dev/null | cut -c 1-100)"
  if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
    ok "工作区干净（无未提交改动）"
  else
    warn "工作区有未提交改动（git status 查看）"
  fi
  REMOTE=$(git remote get-url origin 2>/dev/null)
  echo "      远程: ${REMOTE:-<无 origin，可能是手动拷贝的目录>}"
else
  bad "git 未找到（安装 https://git-scm.com/download/win，安装时勾选 Git Bash）"
fi

# ---------- 2. Node / npm ----------
echo ""
echo "[2/6] Node.js / npm（Vite 8 要求 Node ≥ 20.19；CI 用 22）"
if command -v node >/dev/null 2>&1; then
  NVER=$(node -v | sed 's/^v//')
  if node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a>20||(a===20&&b>=19))?0:1)" 2>/dev/null; then
    ok "node v${NVER}（满足 ≥20.19）"
  else
    bad "node v${NVER} 过旧，需要 ≥20.19（建议装 22 LTS）"
  fi
else
  bad "node 未找到"
fi
if command -v npm >/dev/null 2>&1; then
  ok "npm v$(npm --version)"
else
  bad "npm 未找到（node 自带）"
fi

# ---------- 3. Python ----------
echo ""
echo "[3/6] Python（用于重建 spike 虚拟环境，需要 3.13.x）"
if command -v python >/dev/null 2>&1; then
  PVER=$(python --version 2>&1 | awk '{print $2}')
  case "$PVER" in
    3.13*) ok "系统 python ${PVER}" ;;
    *)     warn "系统 python ${PVER}，锁文件在 3.13.x 上生成验证；若 venv 检查通过也可用" ;;
  esac
else
  bad "python 未找到（https://www.python.org/downloads/ 装 3.13.x，安装时勾选 Add to PATH）"
fi

# ---------- 4. spike 虚拟环境 ----------
echo ""
echo "[4/6] spike 虚拟环境（Python 3.13 + librosa + imageio-ffmpeg 等）"
PY="spike/.venv/Scripts/python.exe"
if [ ! -x "$PY" ]; then
  bad "spike/.venv 不存在 —— 需重建，命令见《转接手册.md》第 4.4 节"
else
  "$PY" --version >/dev/null 2>&1 && ok "venv 存在（$("$PY" --version 2>&1)）"
  if "$PY" -c "import librosa, numpy, pymupdf, PIL, soundfile, imageio_ffmpeg" >/dev/null 2>&1; then
    ok "核心依赖齐全（librosa/numpy/pymupdf/PIL/soundfile/imageio-ffmpeg）"
  else
    bad "venv 依赖缺失 —— 执行: $PY -m pip install -r spike/requirements.txt"
  fi
  if "$PY" -c "import imageio_ffmpeg, os, sys; p=imageio_ffmpeg.get_ffmpeg_exe(); sys.exit(0 if os.path.isfile(p) else 1)" >/dev/null 2>&1; then
    FF=$("$PY" -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null)
    ok "ffmpeg 就绪（venv 自带，无需系统安装）: $FF"
  else
    bad "ffmpeg 二进制不可用（imageio_ffmpeg 未装好，重装: $PY -m pip install -r spike/requirements.txt）"
  fi
fi
if command -v ffmpeg >/dev/null 2>&1; then
  warn "系统 PATH 也有 ffmpeg（无需，venv 自带即可）"
fi

# ---------- 5. app 前端依赖 ----------
echo ""
echo "[5/6] app 前端依赖（node_modules）"
ND="app/node_modules"
NEED="vue vite pinia vue-router vite-plugin-pwa pdfjs-dist fake-indexeddb @vue/server-renderer @vue/compiler-sfc"
MISSING=""
for m in $NEED; do
  [ -d "$ND/$m" ] || MISSING="$MISSING $m"
done
if [ -z "$MISSING" ]; then
  ok "依赖齐全（$ND）"
else
  bad "缺少:$MISSING —— 执行: cd app && npm ci（镜像源已配在 app/.npmrc）"
fi

# ---------- 6. 快速冒烟（纯 JS 测试，无需外部文件） ----------
echo ""
echo "[6/6] 快速冒烟测试（仓库根目录直接跑）"
if node spike/test_plan_engine.mjs >/dev/null 2>&1; then
  ok "test_plan_engine.mjs（规则引擎 25 项）"
else
  bad "test_plan_engine.mjs 失败 —— 先看上一节依赖是否装全"
fi
if node spike/test_ear_training.mjs >/dev/null 2>&1; then
  ok "test_ear_training.mjs（听力训练 9 项）"
else
  bad "test_ear_training.mjs 失败"
fi

# ---------- 汇总 ----------
echo ""
echo "=============================================="
echo " 结果: $PASS 通过 / $FAIL 失败 / $WARN 提醒"
echo "=============================================="
if [ "$FAIL" -eq 0 ]; then
  echo " ✅ 环境就绪。下一步：cd app && npm run dev（默认 http://localhost:4173）"
  echo "    完整测试与部署配置见《转接手册.md》，项目背景先读 README.md 与 HANDOFF.md。"
  exit 0
else
  echo " ❌ 有 $FAIL 项未通过，按《转接手册.md》第 4 节修复后重跑本脚本。"
  exit 1
fi
