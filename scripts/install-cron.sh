#!/usr/bin/env bash
# AgentBench 智衡 · 安装定时实测任务（每周一 03:00 本地时间）
#
# 用法：
#   AB_INGEST_TOKEN=<口令> ./scripts/install-cron.sh "Claude Code" "claude -p" Anthropic
set -euo pipefail

AGENT="${1:?用法: install-cron.sh <模型名> <CLI命令> [厂商]}"
CMD="${2:?缺少 CLI 命令，例如 'claude -p'}"
VENDOR="${3:-}"
TOKEN="${AB_INGEST_TOKEN:?请先设置 AB_INGEST_TOKEN（与网站的 LOVABLE_CRON_SECRET 相同）}"
URL="${AB_INGEST_URL:-https://getagentbench.lovable.app/api/public/eval-ingest}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

LINE="0 3 * * 1 cd $DIR && AB_INGEST_URL=$URL AB_INGEST_TOKEN=$TOKEN node scripts/run-cli-eval.mjs --agent \"$AGENT\" --cmd \"$CMD\" --vendor \"$VENDOR\" >> /tmp/agentbench-cron.log 2>&1"

( crontab -l 2>/dev/null | grep -v "run-cli-eval.mjs --agent \"$AGENT\"" ; echo "$LINE" ) | crontab -
echo "已安装定时任务：每周一 03:00 评测 $AGENT，结果自动写入榜单。"
echo "查看：crontab -l   日志：/tmp/agentbench-cron.log"
