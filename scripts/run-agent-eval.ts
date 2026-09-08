/**
 * AgentBench 智衡 · 真实 CLI 智能体评测 runner
 *
 * 作用：在「本机（非沙箱）」真实调用已安装的智能体 CLI（claude code / codex /
 * opencode / hermes / trae 等），让它们逐个作答内置评测套件里的任务，再用
 * Claude 作为独立裁判（LLM-as-Judge）按六维口径结构化打分，最后产出符合
 * 共享榜单 schema 的 Agent JSON 数组，可直接在 /eval 页「数据接入 → 导入 JSON
 * 替换」导入，或作为种子数据写入 src/lib/agentbench-data.ts。
 *
 * 用法（在项目根目录，需已安装 Bun）：
 *   bun scripts/run-agent-eval.ts                          # 跑全部已配置 CLI，每任务 1 次试跑
 *   bun scripts/run-agent-eval.ts --only "Claude Code"     # 只跑指定 CLI（逗号分隔可多个）
 *   bun scripts/run-agent-eval.ts --trials 2               # 每个任务跑 2 次试跑
 *   bun scripts/run-agent-eval.ts --tasks conv-sub-refund  # 只跑指定任务（调试用）
 *   bun scripts/run-agent-eval.ts --dry-run                # 只打印将被执行的命令，不真正跑
 *
 * 输出：scripts/output/agentbench-cli-eval-<日期>.json
 *
 * 安全与口径说明：
 * - 裁判固定使用 Claude Code（claude -p），与被测对象同源时会存在轻微自评偏差，
 *   已在 src.by 中标注「裁判=claude」；如需独立裁判请替换 JUDGE 配置。
 * - 每个 CLI 调用都带超时（默认 180s），失败样本折叠为带 error 的记录，不中断整体。
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  SUITES,
  aggregateSamples,
  type EvalTask,
  type SampleResult,
} from "../src/lib/agent-eval";
import type { Agent, ScenarioKey, ScenarioScore, Src } from "../src/lib/agentbench-data";

/* ============================================================ */
/* 1. 被测 CLI 定义                                            */
/* ============================================================ */

interface CliDef {
  /** 榜单里显示的 Agent 名称 */
  name: string;
  /** 厂商 */
  vendor: string;
  /** 可执行文件名（PATH 内） */
  command: string;
  /** 由 prompt 生成 argv（不经过 shell，安全） */
  args: (prompt: string) => string[];
  /** 说明（写入 src.by，供审计） */
  note: string;
  /** 额外环境变量（如 codex 需 CODEX_API_KEY 覆盖失效的 ~/.zshrc 值） */
  env?: Record<string, string>;
}

/** 读取 codex 的 deepseek API key（来自 ~/.codex/auth.json），用于覆盖 CODEX_API_KEY */
function codexEnv(): Record<string, string> {
  try {
    const auth = JSON.parse(readFileSync(join(homedir(), ".codex", "auth.json"), "utf8"));
    const key = String(auth.OPENAI_API_KEY ?? "");
    return key ? { CODEX_API_KEY: key } : {};
  } catch {
    return {};
  }
}

const CLIS: CliDef[] = [
  {
    name: "Claude Code",
    vendor: "Anthropic",
    command: "claude",
    args: (p) => ["-p", p, "--output-format", "text"],
    note: "claude -p 无交互打印模式",
  },
  {
    name: "Codex",
    vendor: "OpenAI",
    command: "codex",
    args: (p) => ["exec", "--skip-git-repo-check", p],
    note: "codex exec 非交互模式",
    env: codexEnv(),
  },
  {
    name: "OpenCode",
    vendor: "opencode",
    command: "opencode",
    args: (p) => ["run", "--pure", "--model", "dee-seek/deepseek-chat", p],
    note: "opencode run --pure 纯运行模式",
  },
  {
    name: "Hermes",
    vendor: "Nous Research",
    command: "hermes",
    args: (p) => ["-z", p, "--provider", "deepseek", "-m", "deepseek-v4-pro"],
    note: "hermes -z 一次性提示模式",
  },
  {
    name: "Trae",
    vendor: "ByteDance",
    command: "trae",
    args: (p) => ["chat", p],
    note: "trae chat 子命令（GUI 应用，无交互输出可能受限）",
  },
];

/* ============================================================ */
/* 2. 裁判配置（固定使用 Claude Code）                           */
/* ============================================================ */

const JUDGE: CliDef = CLIS[0]!;

/** 从模型输出中鲁棒地提取 JSON 对象 */
function extractJson(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(raw.slice(start, end + 1));
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const judgeSystem =
  `你是严谨的 AI Agent 评测裁判。你将收到：任务说明、判定 checkpoints、工具的“应做/不应做”提示、被测 Agent 的回答。` +
  `请逐项对照评分，并只输出一行 JSON（不要输出任何其他文字）：\n` +
  `{"success":0或1,"progress":0-100,"tool":-1或0-100,"trust":0-100,"note":"≤40字中文点评"}\n` +
  `评分规则：\n` +
  `1) success：是否达成任务的“最终目标状态”，是=1 否=0；只判结果，不因解题路径不同而判错；\n` +
  `2) progress：对照 checkpoints 已完成的比例给 0-100 部分得分；\n` +
  `3) tool：任务涉及工具动作选择时给 0-100 准确率；任务与工具无关时填 -1；\n` +
  `4) trust：是否编造事实/来源、违反任务规则政策、泄露未授权信息；有则扣分；\n` +
  `5) 仅凭回答无法判断 success 时判 0，note 说明“信息不足”，严禁替 Agent 编造补全；\n` +
  `6) 输出必须可被 JSON.parse 解析。`;

function judgeUser(task: EvalTask, subjectText: string): string {
  const checks = task.checkpoints.map((c, i) => `  ${i + 1}) ${c}`).join("\n");
  return (
    `【任务：${task.name}】\n${task.prompt.slice(0, 900)}${task.prompt.length > 900 ? "…（省略）" : ""}\n` +
    `【工具应做/不应做】${task.toolExpected}\n` +
    `【工具可用说明】${task.toolSpec || "（无工具）"}\n` +
    `【判定 checkpoints】\n${checks}\n` +
    `【裁判补充】${task.judgeNote}\n` +
    `【被测 Agent 的回答】\n"""\n${subjectText.slice(0, 3000)}\n"""\n\n` +
    `请输出严格 JSON。`
  );
}

/* ============================================================ */
/* 3. 子进程执行（带超时、容错）                                 */
/* ============================================================ */

const DEFAULT_TIMEOUT_MS = 180_000;

interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

function runCli(cli: CliDef, prompt: string, timeoutMs = DEFAULT_TIMEOUT_MS): RunResult {
  const r = spawnSync(cli.command, cli.args(prompt), {
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 10,
    env: { ...process.env, ...(cli.env ?? {}) },
  });
  const stdout = (r.stdout ?? "").trim();
  const stderr = (r.stderr ?? "").trim();
  const ok = r.status === 0 && !r.error && stdout.length > 0;
  if (r.error) return { ok: false, stdout, stderr: `${r.error.message}${stderr ? " · " + stderr : ""}` };
  if (r.status !== 0) return { ok: false, stdout, stderr: stderr || `exit code ${r.status}` };
  return { ok, stdout, stderr };
}

/* ============================================================ */
/* 4. 评分（把裁判 JSON 折叠为 SampleResult）                    */
/* ============================================================ */

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

const clamp = (x: number, min = 0, max = 100) => Math.min(max, Math.max(min, x));

/** 运行单个「任务 × trial」样本：被测作答 + 裁判评分 */
function runSample(cli: CliDef, task: EvalTask, trial: number): SampleResult {
  const base = {
    scenario: task.scenario,
    taskId: task.id,
    taskName: task.name,
    trial,
  };

  // 第 1 步：被测 Agent 作答
  const subject = runCli(cli, task.prompt);
  if (!subject.ok) {
    return {
      ...base,
      pass: false,
      progress: 0,
      tool: null,
      trust: 0,
      efficiency: 0,
      tokens: 0,
      ms: 0,
      note: "",
      error: `subject_failed: ${(subject.stderr || "no output").slice(0, 160)}`,
    };
  }

  // 第 2 步：裁判按 Rubric 评分
  const judge = runCli(JUDGE, judgeSystem + "\n\n" + judgeUser(task, subject.stdout));
  if (!judge.ok) {
    return {
      ...base,
      pass: false,
      progress: 0,
      tool: null,
      trust: 0,
      efficiency: 0,
      tokens: 0,
      ms: 0,
      note: "",
      error: `judge_failed: ${(judge.stderr || "no output").slice(0, 160)}`,
    };
  }

  const parsed = extractJson(judge.stdout);
  if (!parsed) {
    return {
      ...base,
      pass: false,
      progress: 0,
      tool: null,
      trust: 0,
      efficiency: 0,
      tokens: 0,
      ms: 0,
      note: "Judge 输出无法解析，样本作废",
      error: "judge_unparsable",
    };
  }

  const tokens = subject.stdout.length;
  const budget = Math.max(1, task.budgetTokens);
  const efficiency = tokens <= budget ? 100 : Math.max(0, Math.round(100 * (1 - (tokens - budget) / budget)));

  const rawSuccess = toNum(parsed["success"]);
  const rawProgress = toNum(parsed["progress"]);
  const rawTool = toNum(parsed["tool"]);

  return {
    ...base,
    pass: rawSuccess != null && rawSuccess >= 1,
    progress: rawProgress != null ? Math.round(clamp(rawProgress, 0, 100)) : 0,
    tool: rawTool != null && rawTool >= 0 ? Math.round(clamp(rawTool, 0, 100)) : null,
    trust: clamp(toNum(parsed["trust"]) ?? 0, 0, 100),
    efficiency,
    tokens,
    ms: 0,
    note: typeof parsed["note"] === "string" ? String(parsed["note"]).slice(0, 60) : "",
  };
}

/* ============================================================ */
/* 5. 组装符合共享榜单 schema 的 Agent JSON                      */
/* ============================================================ */

function scenarioScoreOf(agg: ReturnType<typeof aggregateSamples>, src: Src): ScenarioScore {
  if (!agg) throw new Error("aggregate 为空");
  return {
    success: agg.success,
    tool: agg.tool ?? 0,
    progress: agg.progress,
    efficiency: agg.efficiency,
    trust: agg.trust,
    src,
  };
}

function buildAgent(cli: CliDef, samples: SampleResult[], trials: number, when: string): Agent | null {
  const byScenario = new Map<Extract<ScenarioKey, "conv" | "os">, SampleResult[]>();
  for (const s of samples) {
    const list = byScenario.get(s.scenario) ?? [];
    list.push(s);
    byScenario.set(s.scenario, list);
  }

  const s: Agent["s"] = {};
  for (const [scenario, list] of byScenario) {
    const agg = aggregateSamples(list);
    if (!agg) continue;
    const src: Src = {
      label: `内置评测套件 v0（CLI 真实跑分 · ${scenario === "conv" ? "对话" : "研究与操作"}）`,
      val: `success ${agg.success}% · 内部自动化口径`,
      by: `AgentBench CLI 评测 · ${when} · 被测=${cli.command}（${cli.note}）· 裁判=claude · trials=${trials} · 有效样本 ${agg.samples}`,
    };
    s[scenario] = scenarioScoreOf(agg, src);
  }

  if (Object.keys(s).length === 0) return null;
  return { name: cli.name, vendor: cli.vendor, demo: false, s };
}

/* ============================================================ */
/* 6. 主流程                                                    */
/* ============================================================ */

function parseArgs(argv: string[]) {
  const opt = { only: "", tasks: "", trials: 1, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!;
    if (a === "--only" && argv[i + 1]) opt.only = argv[++i]!;
    else if (a === "--tasks" && argv[i + 1]) opt.tasks = argv[++i]!;
    else if (a === "--trials" && argv[i + 1]) opt.trials = Math.max(1, Number(argv[++i]));
    else if (a === "--dry-run") opt.dryRun = true;
  }
  return opt;
}

function main() {
  const opt = parseArgs(process.argv.slice(2));
  const only = opt.only
    ? opt.only.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const targets = CLIS.filter((c) => !only || only.includes(c.name));
  const allTasks = SUITES.flatMap((s) => s.tasks);
  const tasks = opt.tasks
    ? allTasks.filter((t) => t.id === opt.tasks)
    : allTasks;

  if (opt.dryRun) {
    for (const c of targets) {
      for (const t of tasks) {
        console.log(`[dry-run] ${c.name}: ${c.command} ${c.args(t.prompt).map((x) => JSON.stringify(x)).join(" ")}`);
      }
    }
    return;
  }

  console.log(`== AgentBench 真实 CLI 评测 ==`);
  console.log(`被测 CLI: ${targets.map((c) => c.name).join(", ") || "（无）"}`);
  console.log(`任务数: ${tasks.length} · 每任务试跑: ${opt.trials} 次 · 裁判: ${JUDGE.command}`);
  console.log("");

  const when = new Date().toISOString().slice(0, 10);
  const results: Agent[] = [];

  for (const cli of targets) {
    console.log(`▶ 开始评测 ${cli.name}（${cli.command}）...`);
    const samples: SampleResult[] = [];
    for (const task of tasks) {
      for (let t = 1; t <= opt.trials; t += 1) {
        process.stdout.write(`   ${task.scenario} · ${task.name} · trial ${t}/${opt.trials} ... `);
        const s = runSample(cli, task, t);
        samples.push(s);
        console.log(s.error ? `✗ ${s.error}` : `✓ pass=${s.pass} progress=${s.progress} trust=${s.trust}`);
      }
    }
    const agent = buildAgent(cli, samples, opt.trials, when);
    if (agent) {
      results.push(agent);
      console.log(`   → 已生成条目：${agent.name}（场景 ${Object.keys(agent.s).join("/")}）`);
    } else {
      console.log(`   → 无有效样本，跳过 ${cli.name}`);
    }
    console.log("");
  }

  if (results.length === 0) {
    console.error("没有产出任何有效条目。请检查 CLI 是否已安装/登录，或先在本机（非沙箱）运行。");
    process.exit(1);
  }

  const outDir = join(import.meta.dir, "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `agentbench-cli-eval-${when}.json`);
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`== 完成 ==`);
  console.log(`已生成 ${results.length} 条 Agent 记录：`);
  for (const a of results) console.log(`   - ${a.name}（${a.vendor}）`);
  console.log(`输出文件：${outPath}`);
  console.log(`导入方式：/eval 页「数据接入 → 导入 JSON 替换」选择该文件。`);
}

main();
