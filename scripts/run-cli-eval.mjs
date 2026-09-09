#!/usr/bin/env node
/**
 * AgentBench 智衡 · 本地 CLI 实测 runner
 *
 * 在你自己的机器上跑真实 CLI 智能体，打分后自动把结果回填到网站榜单。
 *
 * 用法：
 *   AB_INGEST_URL="https://getagentbench.lovable.app/api/public/eval-ingest" \
 *   AB_INGEST_TOKEN="<与 LOVABLE_CRON_SECRET 相同的口令>" \
 *   node scripts/run-cli-eval.mjs --agent "Claude Code" --cmd "claude -p" --vendor Anthropic
 *
 * 可选参数：
 *   --tasks scripts/eval-tasks.json   任务集
 *   --workdir /tmp/ab-eval            CLI 的工作目录（会自动创建）
 *   --timeout 180                     单任务超时（秒）
 *   --dry                             只打印结果，不上传
 */

import { exec } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const flag = (n) => argv.includes(`--${n}`);

const AGENT = arg("agent");
const CMD = arg("cmd");
const VENDOR = arg("vendor", "");
const TASKS = arg("tasks", "scripts/eval-tasks.json");
const WORKDIR = arg("workdir", path.join(tmpdir(), "ab-eval"));
const TIMEOUT = Number(arg("timeout", "180")) * 1000;
const DRY = flag("dry");

if (!AGENT || !CMD) {
  console.error('缺少 --agent 或 --cmd。示例：--agent "Claude Code" --cmd "claude -p"');
  process.exit(1);
}

const run = (cmd, cwd) =>
  new Promise((resolve) => {
    const started = Date.now();
    exec(cmd, { cwd, timeout: TIMEOUT, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        ms: Date.now() - started,
        out: `${stdout ?? ""}${stderr ?? ""}`.trim(),
        failed: Boolean(err),
      });
    });
  });

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

async function evalScenario(name, tasks) {
  const steps = [];
  let solved = 0;
  let matchedChecks = 0;
  let totalChecks = 0;

  for (const t of tasks) {
    const r = await run(`${CMD} ${q(t.prompt)}`, WORKDIR);
    const checks = (t.expect ?? []).map((re) => new RegExp(re).test(r.out));
    totalChecks += checks.length;
    matchedChecks += checks.filter(Boolean).length;
    const ok = !r.failed && checks.every(Boolean);
    if (ok) solved += 1;
    steps.push({
      tool: `${t.id} · ${CMD.split(" ")[0]}`,
      ms: r.ms,
      status: ok ? "ok" : "fail",
      input: t.prompt,
      output: r.out.slice(0, 1200),
    });
    console.log(`  ${ok ? "✓" : "✗"} ${t.id} (${(r.ms / 1000).toFixed(1)}s)`);
  }

  const n = tasks.length || 1;
  const avgMs = steps.reduce((a, s) => a + s.ms, 0) / n;
  const pct = (x) => Math.round(x * 1000) / 10;

  return {
    task_type: name,
    metrics: {
      success: pct((solved / n) * 100) / 1,
      tool: totalChecks ? pct((matchedChecks / totalChecks) * 100) : 0,
      progress: pct(((solved + matchedChecks / Math.max(1, totalChecks)) / (n + 1)) * 100),
      // 60s 内完成得满分，越慢越低
      efficiency: Math.max(0, Math.min(100, Math.round(100 - (avgMs / 60000) * 100))),
      trust: steps.some((s) => s.status === "fail") ? 70 : 95,
    },
    tool_log: JSON.stringify(steps, null, 2),
  };
}

const main = async () => {
  await mkdir(WORKDIR, { recursive: true });
  const suite = JSON.parse(await readFile(TASKS, "utf8"));
  const runDate = new Date().toISOString().slice(0, 10);
  const runs = [];

  for (const [name, tasks] of Object.entries(suite)) {
    console.log(`\n[${AGENT}] 场景 ${name}（${tasks.length} 个任务）`);
    const r = await evalScenario(name, tasks);
    runs.push({
      agent_name: AGENT,
      vendor: VENDOR,
      suite: "cli",
      kind: "product",
      task_type: r.task_type,
      metrics: r.metrics,
      run_date: runDate,
      sample_size: tasks.length,
      judge: "regex-checks",
      source_label: "AgentBench CLI 实测（自动化定时任务）",
      source_by: `本地 runner · ${CMD} · ${runDate}`,
      method: `每个任务用 ${CMD} 无交互执行一次；成功率按任务全部断言通过计；工具分按断言命中率计；效率按平均耗时相对 60 秒折算。`,
      params: { cmd: CMD, timeout_s: TIMEOUT / 1000, workdir: WORKDIR, tasks: TASKS },
      tool_log: r.tool_log.slice(0, 8000),
      rationale: "断言全部命中记为成功，任一失败记为失败；耗时来自本地实测。",
      note: "",
    });
  }

  const outFile = path.join(
    "scripts/output",
    `cli-${AGENT.replace(/\s+/g, "-").toLowerCase()}-${runDate}.json`,
  );
  await mkdir("scripts/output", { recursive: true });
  await writeFile(outFile, JSON.stringify(runs, null, 2));
  console.log(`\n结果已保存：${outFile}`);

  if (DRY) return;
  const url = process.env.AB_INGEST_URL;
  const token = process.env.AB_INGEST_TOKEN;
  if (!url || !token) {
    console.error("未设置 AB_INGEST_URL / AB_INGEST_TOKEN，跳过上传。");
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-eval-token": token },
    body: JSON.stringify({ runs }),
  });
  console.log(`上传：${res.status} ${await res.text()}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
