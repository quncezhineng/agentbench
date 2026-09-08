/**
 * AgentBench 智衡 · 自动化 AI Agent 评测（/eval）工作台
 *
 * 流程：选择被测对象与模型通道 → 勾选评测套件（对话 / 研究与操作，无沙箱 v0 口径）
 * → 设置每个任务的试跑次数 → 依次执行「被测 Agent 作答 + LLM-as-Judge 结构化评分」
 * → 六维口径聚合 → 生成符合共享榜单 schema 的 Agent JSON。
 *
 * 结果去向：
 * - 「并入榜单数据」：把本次评测结果按 Agent 名称并入共享榜单（保存于本浏览器），排行榜页打开即最新；
 * - 下载 / 复制 JSON：存档或离线带走（可在页面底部「接入真实评测数据」整体导入）。
 *
 * 安全边界：API Key 只允许两种来源——服务端环境变量，或本页临时输入（仅内存、
 * 单次请求使用、不落盘不回显）；绝不写入 localStorage / URL / cookie。
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  EVAL_SCENARIOS,
  EVAL_VERSION,
  PROVIDERS,
  agentEntriesOf,
  aggregateSamples,
  providerMeta,
  suiteOf,
  type EvalTask,
  type EvalRunMeta,
  type ProviderKey,
  type SampleResult,
} from "@/lib/agent-eval";
import { getEvalServerInfo, runEvalSample } from "@/lib/eval-server";
import { mergeAgents, saveAgents, useLeaderboardSnapshot } from "@/lib/leaderboard-store";
import { DataPipeline } from "./DataPipeline";

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

type RunPhase = "idle" | "running" | "done" | "error";
type Scenario = (typeof EVAL_SCENARIOS)[number]["key"];

interface RunRow {
  label: string;
  value: string;
}

/* ============================================================ */
/* 状态辅助                                                      */
/* ============================================================ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 逐样本跑分的最小推进间隔（ms）：让进度条不至于闪一下就结束 */
const MIN_STEP_MS = 60;

/** 数字格式：1 位小数（聚合值展示用） */
const f1 = (x: number | null | undefined, suffix = "") =>
  x == null ? "—" : `${Math.round(x * 10) / 10}${suffix}`;

export function EvalApp() {
  /* ---------- 模型通道与密钥（只在服务端被使用） ---------- */
  const [provider, setProvider] = useState<ProviderKey>("openai");
  const [serverReady, setServerReady] = useState(false);
  const [configured, setConfigured] = useState<Record<ProviderKey, boolean> | null>(null);
  const [model, setModel] = useState(() => providerMeta("openai").defaultModel);
  const [apiKey, setApiKey] = useState("");

  /* ---------- 被测对象元信息 ---------- */
  const [agentName, setAgentName] = useState("");
  const [vendor, setVendor] = useState("");

  /* ---------- 评测配置 ---------- */
  const [active, setActive] = useState<Scenario[]>(["conv", "os"]);
  const [trials, setTrials] = useState(2);

  /* ---------- 运行状态 ---------- */
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [samples, setSamples] = useState<SampleResult[]>([]);
  const [currentLabel, setCurrentLabel] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [fatal, setFatal] = useState("");
  const [copied, setCopied] = useState(false);

  /* ---------- 运行结果（仅 done 后可用） ---------- */
  const [meta, setMeta] = useState<EvalRunMeta | null>(null);
  /** 共享榜单（用于并入本次结果），与 /board、底部数据接入保持同一份数据 */
  const { agents: storeAgents } = useLeaderboardSnapshot();
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState("");

  // 读取服务端「哪些 provider 已配置 key」（只回传布尔）
  useEffect(() => {
    let alive = true;
    getEvalServerInfo()
      .then((info) => {
        if (!alive) return;
        setConfigured(info.providers);
      })
      .catch(() => {
        if (!alive) return;
        setConfigured(null);
      })
      .finally(() => alive && setServerReady(true));
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- 派生数据 ---------- */
  const pm = providerMeta(provider);
  const selectedSuites = useMemo(
    () => EVAL_SCENARIOS.filter((s) => active.includes(s.key)).map((s) => suiteOf(s.key)),
    [active],
  );

  const taskCount = useMemo(
    () => selectedSuites.reduce((acc, s) => acc + s.tasks.length, 0),
    [selectedSuites],
  );
  const callCount = taskCount * trials * 2; // 每次任务 = 作答 + 裁判
  const effectiveAgentName = agentName.trim() || `${pm.label} ${model.trim() || "自评测"}`;
  const effectiveVendor = vendor.trim() || pm.label;

  const canRun =
    phase !== "running" &&
    selectedSuites.length > 0 &&
    trials >= 1 &&
    model.trim() !== "" &&
    Boolean(configured?.[provider] || apiKey.trim());

  const keyMissing = serverReady && !(configured?.[provider] ?? false) && apiKey.trim() === "";

  /* ============================================================ */
  /* 运行：按场景 → 任务 → trial 顺序串行调用真实模型             */
  /* ============================================================ */
  const runAll = async () => {
    setFatal("");
    setPhase("running");
    setSamples([]);
    setMeta(null);
    setApplied(false);
    setApplyError("");
    setCopied(false);

    // 先铺平全部组合：每个任务 × 每次试跑 = 一个待执行样本
    const plan: { task: EvalTask; trial: number }[] = [];
    for (const suite of selectedSuites) {
      for (const task of suite.tasks) {
        for (let t = 1; t <= trials; t += 1) {
          plan.push({ task, trial: t });
        }
      }
    }
    setTotalCount(plan.length);

    const collected: SampleResult[] = [];
    const startedAt = new Date();
    let failureCount = 0;
    let lastErr = "";

    for (const { task, trial } of plan) {
      const label = `${task.scenario === "conv" ? "对话" : "研究"} · ${task.name} · 第 ${trial}/${trials} 次`;
      setCurrentLabel(label);

      let sample: SampleResult;
      try {
        const trimmedKey = apiKey.trim();
        const res = await runEvalSample({
          data: {
            provider,
            model: model.trim(),
            ...(trimmedKey ? { apiKey: trimmedKey } : {}),
            task,
            trial,
          },
        });
        sample = res as SampleResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failureCount += 1;
        lastErr = msg;
        sample = {
          scenario: task.scenario,
          taskId: task.id,
          taskName: task.name,
          trial,
          pass: false,
          progress: 0,
          tool: null,
          trust: 0,
          efficiency: 0,
          tokens: 0,
          ms: 0,
          note: "",
          error: `request_failed: ${msg.slice(0, 140)}`,
        };
      }

      collected.push(sample);
      setSamples([...collected]);
      setDoneCount(collected.length);
      // 让进度条可视化不至于瞬间跑完（每个样本至少停留一小段时间）
      await sleep(MIN_STEP_MS);
    }

    // 组装运行元信息（含失败样本；聚合时会过滤 error 样本）
    const finishedAt = new Date();
    const runMeta: EvalRunMeta = {
      agentName: effectiveAgentName,
      vendor: effectiveVendor,
      provider,
      model: model.trim(),
      trials,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      samples: collected,
      warnings: [],
    };

    if (collected.some((s) => s.error)) {
      runMeta.warnings.push(
        `${collected.filter((s) => s.error).length} 个样本执行失败，已从聚合中剔除`,
      );
    }
    if (failureCount > 0)
      runMeta.warnings.push(`发生 ${failureCount} 次网络/模型错误：${lastErr.slice(0, 120)}`);
    setMeta(runMeta);

    // 至少要有 1 个有效样本，否则整体视为失败
    if (collected.every((s) => s.error)) {
      setPhase("error");
      const reasons = Array.from(
        new Set(collected.map((s) => s.error ?? "").filter(Boolean)),
      ).slice(0, 3);
      setFatal(
        "本次运行的所有样本都失败了，没有任何有效数据可聚合。可能原因：\n" +
          "· " +
          (reasons.join("\n· ") || "未知错误") +
          "\n请检查 API Key / 模型名是否有效，或换一个提供方后重试。",
      );
      return;
    }

    setPhase("done");
  };

  /* ---------- 结果处理 ---------- */
  const agentsOf = (m: EvalRunMeta) => {
    const list = agentEntriesOf(m);
    return list[0] && Object.keys(list[0].s).length > 0 ? list : [];
  };

  /** 把本次评测结果按 Agent 名称并入共享榜单（同名更新 / 新名追加），保存于本浏览器 */
  const applyRun = () => {
    if (!meta) return;
    const incoming = agentsOf(meta);
    if (incoming.length === 0) {
      setApplyError("本次运行没有任何有效样本，无法并入榜单。");
      return;
    }
    try {
      saveAgents(mergeAgents(storeAgents, incoming));
      setApplied(true);
      setApplyError("");
    } catch {
      setApplyError("写入本地数据失败（浏览器存储不可用），可改用下方「下载 JSON」手动导入。");
    }
  };

  const downloadJson = (m: EvalRunMeta) => {
    const agents = agentsOf(m);
    const blob = new Blob([JSON.stringify(agents, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentbench-eval-${m.agentName.replace(/[^\w\u4e00-\u9fa5-]+/g, "-")}-${m.finishedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async (m: EvalRunMeta) => {
    const agents = agentsOf(m);
    if (agents.length === 0) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(agents, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  /* ============================================================ */
  /* 渲染                                                        */
  /* ============================================================ */

  return (
    <>
      {/* ================= 顶部引导 ================= */}
      <section className="ab-container ab-section pt-8 sm:pt-10">
        <div className="overflow-hidden rounded-[20px] border border-border ab-grid-bg">
          <div className="px-5 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ab-chip ab-chip-brand">Automated Eval · v{EVAL_VERSION}</span>
              <span className="ab-chip">真实模型跑分</span>
              <span className="ab-chip">LLM-as-Judge</span>
            </div>

            <h1 className="mt-4 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[36px]">
              自动化 AI Agent 评测
            </h1>
            <p className="mt-3 max-w-[760px] text-[14px] leading-7 text-text-2 sm:text-[15px]">
              选中一个真实大模型，用内置评测套件（对话 / 研究与操作）自动执行多次试验： 被测 Agent
              依据给定政策 / 资料包作答，裁判模型按
              <b className="text-foreground">
                {" "}
                成功率 · 稳定性 pass³ · 工具 · 进度率 · 效率 · 可信{" "}
              </b>
              六维口径结构化打分。 跑完点击「并入榜单数据」即可入库，或在页面底部
              <a
                href="#data"
                className="mx-1 rounded-md bg-brand-soft px-1 font-semibold text-brand"
              >
                接入真实评测数据
              </a>
              处导入外部 JSON 整体替换榜单。
            </p>

            <div className="mt-5 grid gap-2 text-[12.5px] text-text-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-white/70 px-3.5 py-2.5">
                编码类任务需要沙箱执行，本版以「对话 / 研究与操作」纯文本口径先行
              </div>
              <div className="rounded-xl border border-border/70 bg-white/70 px-3.5 py-2.5">
                单次运行 = 任务数 × 试跑次数 × 2 次模型调用（作答 + 裁判）
              </div>
              <div className="rounded-xl border border-border/70 bg-white/70 px-3.5 py-2.5">
                API Key 只用于本次请求（服务端环境变量或本页临时输入），不会保存
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 配置面板 ================= */}
      <section id="config" className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Step 1 · Configure</div>
            <h2 className="ab-section-title">配置一次评测运行</h2>
            <p className="ab-section-desc mt-2">
              被测对象信息只用于结果标注；模型通道决定用哪家的大模型既当“考生”又当“裁判”。
            </p>
          </div>
        </div>

        <div className="ab-panel bg-white p-5 sm:p-7">
          <div className="grid gap-x-10 gap-y-7 lg:grid-cols-2">
            {/* 左列：被测对象 + 模型通道 */}
            <div className="flex flex-col gap-7">
              {/* 被测对象 */}
              <fieldset>
                <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                  被测对象
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="结果中的 Agent 名称"
                    placeholder={pm.label}
                    value={agentName}
                    onChange={setAgentName}
                  />
                  <LabeledInput
                    label="厂商 / 团队（留空取提供方）"
                    placeholder={pm.label}
                    value={vendor}
                    onChange={setVendor}
                  />
                </div>
              </fieldset>

              {/* 模型通道 */}
              <fieldset>
                <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                  模型通道（被评测 & 裁判使用同一模型）
                </legend>

                <div className="flex flex-wrap gap-2">
                  {PROVIDERS.map((p) => {
                    const isOn = provider === p.key;
                    const hasEnv = Boolean(configured?.[p.key]);
                    return (
                      <button
                        key={p.key}
                        onClick={() => {
                          setProvider(p.key);
                          setModel(p.defaultModel);
                        }}
                        className={`relative inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold transition-all ${
                          isOn
                            ? "border-transparent bg-brand text-primary-foreground shadow-[0_10px_22px_color-mix(in_oklab,var(--brand)_24%,transparent)]"
                            : "border-border bg-white text-text-2 hover:border-brand/40 hover:text-brand"
                        }`}
                      >
                        {p.label}
                        {hasEnv && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              isOn ? "bg-white/25 text-white" : "bg-ok-soft text-ok"
                            }`}
                          >
                            已配置
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-text-2">
                      模型名
                    </label>
                    <input
                      list="eval-model-suggestions"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={pm.defaultModel}
                      className="h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px] outline-none transition-colors focus:border-brand/60"
                    />
                    <datalist id="eval-model-suggestions">
                      {pm.suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-text-2">
                      API Key（临时）
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        configured?.[provider]
                          ? `已读取服务端 ${pm.envVar}，可不填`
                          : `粘贴 ${pm.envVar}`
                      }
                      autoComplete="off"
                      className="h-10 w-full rounded-xl border border-border bg-white px-3 font-mono text-[12.5px] outline-none transition-colors focus:border-brand/60"
                    />
                  </div>
                </div>

                <p className="mt-2 text-[12px] leading-5 text-text-3">
                  Key 来源优先级：上方临时输入 ＞ 服务端环境变量
                  <code className="mx-1 rounded bg-surface-2 px-1 font-mono text-[11px]">
                    {pm.envVar}
                  </code>
                  。提示：{pm.keyTip}。
                  {keyMissing && (
                    <b className="text-warn"> 当前提供方尚未配置 Key，不填将无法运行。</b>
                  )}
                </p>
              </fieldset>
            </div>

            {/* 右列：套件 + 试跑次数 */}
            <div className="flex flex-col gap-7">
              <fieldset>
                <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                  评测套件（多选）
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {EVAL_SCENARIOS.map((s) => {
                    const suite = suiteOf(s.key);
                    const isOn = active.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        onClick={() =>
                          setActive((prev) =>
                            isOn ? prev.filter((k) => k !== s.key) : [...prev, s.key],
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isOn
                            ? "border-brand/50 bg-brand-soft/70 shadow-[0_8px_20px_color-mix(in_oklab,var(--brand)_12%,transparent)]"
                            : "border-border bg-white hover:border-brand/30"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-bold">{s.label}</span>
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold ${
                              isOn
                                ? "border-brand bg-brand text-primary-foreground"
                                : "border-border text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </span>
                        <span className="mt-1 block text-[12px] font-medium text-text-2">
                          {suite.name}
                        </span>
                        <span className="mt-1.5 block text-[11.5px] leading-5 text-text-3">
                          {suite.desc} · 共 {suite.tasks.length} 个任务
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                  每个任务试跑次数（trial）
                </legend>
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface-2/50 px-4 py-3.5">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={trials}
                    onChange={(e) => setTrials(Number(e.target.value))}
                    className="w-full min-w-[160px] max-w-[260px] cursor-pointer accent-[var(--brand)]"
                    aria-label="试跑次数"
                  />
                  <span className="metric rounded-lg bg-brand-soft px-2.5 py-1 text-[14px] font-bold text-brand">
                    {trials} 次
                  </span>
                  <span className="text-[12px] text-text-3">
                    每次独立作答，成功率将按全部样本统计（稳定性 pass³ 由榜单页按 p³ 推算）
                  </span>
                </div>
              </fieldset>

              {/* 运行摘要与按钮 */}
              <div className="mt-auto rounded-2xl border border-border bg-white p-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3">
                  <RunStat label="被测对象" value={effectiveAgentName || "待填"} />
                  <RunStat label="模型通道" value={`${pm.label} · ${model.trim() || "待填"}`} />
                  <RunStat label="评测任务" value={`${taskCount} 个 × ${trials} 次`} />
                  <RunStat label="预计调用次数" value={`${callCount} 次`} />
                  <RunStat
                    label="覆盖场景"
                    value={
                      active.length
                        ? active
                            .map((k) => EVAL_SCENARIOS.find((s) => s.key === k)?.label ?? k)
                            .join("、")
                        : "未选"
                    }
                  />
                  <RunStat label="产物" value="Agent JSON（可并入榜单）" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    disabled={!canRun}
                    onClick={runAll}
                    className="ab-button ab-button-primary disabled:pointer-events-none disabled:opacity-45"
                  >
                    {phase === "running" ? "评测进行中…" : "开始自动评测"}
                  </button>

                  {keyMissing && (
                    <span className="rounded-lg bg-warn-soft px-2.5 py-1.5 text-[12px] font-semibold leading-5 text-warn">
                      请在下方填入临时 Key，或先把 {pm.envVar} 配进服务端环境变量（IDE 集成设置 →
                      环境变量）。
                    </span>
                  )}
                </div>

                {configured &&
                  Object.keys(configured).length > 0 &&
                  !PROVIDERS.some((p) => configured[p.key]) && (
                    <p className="mt-2 text-[12px] text-text-3">
                      已检查：openai / anthropic / gemini / openrouter 均未在服务端配置 Key；
                      也支持在下方临时输入 Key 完成本次运行。
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 运行进度 ================= */}
      {(phase === "running" || phase === "error" || (phase === "done" && samples.length > 0)) && (
        <section id="progress" className="ab-container ab-section pt-2">
          <div className="ab-section-head">
            <div>
              <div className="ab-chip ab-chip-brand mb-3">
                {phase === "running" ? "Running · Live" : "Result"}
              </div>
              <h2 className="ab-section-title">
                {phase === "running" ? "评测执行中" : phase === "done" ? "评测完成" : "评测失败"}
              </h2>
            </div>
            {phase === "running" && (
              <span className="metric text-[13px] font-bold text-brand">
                {doneCount} / {totalCount}
              </span>
            )}
          </div>

          {phase === "error" && (
            <div className="mb-4 rounded-2xl border border-risk/30 bg-risk-soft/70 px-4 py-4 text-[13px] leading-6 text-risk">
              <b>运行失败：</b>
              <span className="whitespace-pre-line">{fatal}</span>
            </div>
          )}

          {/* 进度条 */}
          {totalCount > 0 && (
            <div className="mb-4 overflow-hidden rounded-xl border border-border bg-white">
              <div className="h-2.5 w-full bg-surface-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-2 to-brand transition-all duration-300"
                  style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <div className="px-4 py-2.5 text-[12.5px] text-text-3">
                {phase === "running" ? (
                  <>
                    <b className="text-foreground">{currentLabel || "准备中…"}</b>
                    <span className="ml-3">
                      每行一个样本：作答 + 裁判约需 10–60 秒，请保持页面打开。
                    </span>
                  </>
                ) : (
                  <span>
                    共 {samples.length} 个样本 · 有效 {samples.filter((s) => !s.error).length} 个 ·
                    失败 {samples.filter((s) => s.error).length} 个
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 最近样本流 */}
          {phase === "running" && samples.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {samples.slice(-8).map((s, i) => (
                <SampleChip
                  key={`${s.taskId}-${s.trial}-${i}`}
                  s={s}
                  index={samples.length - 8 + i}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= 评测报告 ================= */}
      {phase === "done" && meta && (
        <section id="report" className="ab-container ab-section pt-2">
          <div className="ab-section-head">
            <div>
              <div className="ab-chip ab-chip-brand mb-3">Report · 六维聚合</div>
              <h2 className="ab-section-title">评测报告</h2>
              <p className="ab-section-desc mt-2">
                按场景聚合的有效样本已生成。点击「并入榜单数据」把本次结果写进共享榜单（同名 Agent
                更新、新名追加，保存在本浏览器），打开排行榜即为最新；也可下载 / 复制 JSON
                自行保管。
              </p>
            </div>
          </div>

          {/* 动作区 */}
          <div className="ab-panel mb-4 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={applyRun}
                disabled={applied || !meta}
                className="ab-button ab-button-primary disabled:pointer-events-none disabled:opacity-50"
              >
                {applied ? "已并入榜单数据 ✓" : "并入榜单数据"}
              </button>
              <button
                onClick={() => meta && downloadJson(meta)}
                className="ab-button ab-button-secondary"
              >
                下载评测结果 JSON
              </button>
              <button onClick={() => meta && copyJson(meta)} className="ab-button ab-button-ghost">
                {copied ? "已复制到剪贴板 ✓" : "复制 JSON"}
              </button>
            </div>

            {applyError && (
              <div className="mt-3 text-[12.5px] font-semibold text-risk">{applyError}</div>
            )}
            {applied && meta && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-ok/25 bg-ok-soft/60 px-3.5 py-2.5 text-[12.5px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-ok">
                  <span className="ab-dot" />
                  已把「{meta.agentName}」并入共享榜单，快照日期已更新
                </span>
                <a href="/board" className="font-semibold text-brand hover:underline">
                  打开排行榜查看 →
                </a>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-3">
              <span>
                被测对象：<b className="text-text-2">{meta.agentName}</b>（{meta.vendor}）
              </span>
              <span>
                通道：
                <b className="text-text-2">
                  {meta.provider}/{meta.model}
                </b>
              </span>
              <span>
                试跑：<b className="text-text-2">{meta.trials} 次</b>
              </span>
              <span>
                结束时间：
                <b className="text-text-2">
                  {new Date(meta.finishedAt).toLocaleString("zh-CN", { hour12: false })}
                </b>
              </span>
            </div>
            {meta.warnings.map((w, i) => (
              <div key={i} className="mt-2 text-[12px] text-warn">
                ⚠ {w}
              </div>
            ))}
          </div>

          {/* 分场景聚合 */}
          <div className="grid gap-4 xl:grid-cols-2">
            {EVAL_SCENARIOS.map((s) => {
              const agg = aggregateSamples(meta.samples.filter((x) => x.scenario === s.key));
              if (!agg) return null;
              const suite = suiteOf(s.key);
              return (
                <div key={s.key} className="ab-panel overflow-hidden bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-5 py-4">
                    <div>
                      <div className="text-[15px] font-bold">{s.label}</div>
                      <div className="mt-0.5 text-[12px] text-text-3">
                        {suite.name} · 有效样本 {agg.samples} 个
                      </div>
                    </div>
                    <span className="ab-chip ab-chip-brand">success {agg.success}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-3">
                    <ScoreTile
                      label="成功率"
                      value={agg.success}
                      suffix="%"
                      hint={`pass³ ≈ ${Math.round((agg.success / 100) ** 3 * 1000) / 10}%`}
                    />
                    <ScoreTile
                      label="进度率"
                      value={agg.progress}
                      suffix=""
                      hint="已完成子目标占比"
                    />
                    <ScoreTile
                      label="工具/信源"
                      value={agg.tool}
                      suffix=""
                      hint={
                        agg.toolSamples > 0
                          ? `${agg.toolSamples}/${agg.samples} 样本含工具`
                          : "无工具样本"
                      }
                    />
                    <ScoreTile label="效率" value={agg.efficiency} suffix="" hint="按 token 预算" />
                    <ScoreTile
                      label="可信与安全"
                      value={agg.trust}
                      suffix=""
                      hint="幻觉/合规反向分"
                    />
                    <div className="flex flex-col justify-center rounded-xl bg-surface-2/70 px-3 py-2.5 text-[11px] leading-4 text-text-3">
                      <span>样本明细</span>
                      <b className="metric mt-0.5 text-[15px] text-text-2">
                        {meta.samples.filter((x) => x.scenario === s.key && x.pass).length}/
                        {meta.samples.filter((x) => x.scenario === s.key).length} 次成功
                      </b>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 样本明细表 */}
          <div className="ab-panel mt-4 overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-[13px] font-bold">逐样本明细</span>
              <span className="text-[11.5px] text-text-3">
                仅聚合有效样本；error 样本展示失败原因
              </span>
            </div>
            <div className="ab-table-scroll">
              <table className="ab-data-table min-w-[880px] text-[12.5px]">
                <thead>
                  <tr>
                    <Th>场景</Th>
                    <Th>任务</Th>
                    <Th className="text-right">Trial</Th>
                    <Th className="text-right">通过</Th>
                    <Th className="text-right">进度</Th>
                    <Th className="text-right">工具</Th>
                    <Th className="text-right">可信</Th>
                    <Th className="text-right">效率</Th>
                    <Th className="text-right">tokens</Th>
                    <Th className="text-right">耗时</Th>
                    <Th>裁判点评 / 错误</Th>
                  </tr>
                </thead>
                <tbody>
                  {meta.samples.map((s, i) => (
                    <tr
                      key={`${s.taskId}-${s.trial}-${i}`}
                      className={
                        s.error ? "bg-risk-soft/30" : s.pass ? "bg-ok-soft/30" : "bg-surface-2/30"
                      }
                    >
                      <Td>{s.scenario === "conv" ? "对话" : "研究"}</Td>
                      <Td>
                        <span className="font-semibold">{s.taskName}</span>
                        <span className="block text-[10.5px] text-text-3">{s.taskId}</span>
                      </Td>
                      <Td className="metric text-right">T{s.trial}</Td>
                      <Td className="text-right">
                        {s.error ? (
                          <span className="text-risk">—</span>
                        ) : (
                          <span className={`font-bold ${s.pass ? "text-ok" : "text-risk"}`}>
                            {s.pass ? "PASS" : "FAIL"}
                          </span>
                        )}
                      </Td>
                      <Td className="metric text-right">{s.error ? "—" : f1(s.progress)}</Td>
                      <Td className="metric text-right">{s.error ? "—" : f1(s.tool)}</Td>
                      <Td className="metric text-right">{s.error ? "—" : f1(s.trust)}</Td>
                      <Td className="metric text-right">{s.error ? "—" : f1(s.efficiency)}</Td>
                      <Td className="metric text-right">{s.tokens}</Td>
                      <Td className="metric text-right">{s.ms}ms</Td>
                      <Td className="max-w-[220px] whitespace-normal text-text-3">
                        {s.error ? (
                          <span className="text-risk">{s.error}</span>
                        ) : (
                          s.note || "（无点评）"
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 可导入 JSON 预览 */}
          <div className="ab-panel mt-4 overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-[13px] font-bold">符合榜单 schema 的 Agent JSON</span>
              <button
                onClick={() => meta && copyJson(meta)}
                className="ab-button ab-button-ghost !min-h-[30px] !px-3 !text-[12px]"
              >
                {copied ? "已复制 ✓" : "复制"}
              </button>
            </div>
            <div className="overflow-x-auto bg-surface-2/40 px-5 py-4">
              <pre className="font-mono text-[12px] leading-6 text-text-2">
                {JSON.stringify(agentsOf(meta), null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* ================= 数据接入（本页入库：导入 / 导出） ================= */}
      <DataPipeline />
    </>
  );
}

/* ============================================================ */
/* 小组件                                                        */
/* ============================================================ */

function LabeledInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px] outline-none transition-colors focus:border-brand/60"
      />
    </div>
  );
}

function RunStat({ label, value }: RunRow) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[12.5px] font-semibold text-text-2" title={value}>
        {value}
      </div>
    </div>
  );
}

function ScoreTile({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5">
      <div className="text-[11px] font-semibold text-text-3">{label}</div>
      <div className="metric mt-0.5 text-[20px] font-bold leading-none text-foreground">
        {f1(value)}
        {suffix && <span className="text-[12px] font-semibold text-text-3">{suffix}</span>}
      </div>
      {hint && <div className="mt-1 text-[10.5px] leading-4 text-text-3">{hint}</div>}
    </div>
  );
}

function SampleChip({ s, index }: { s: SampleResult; index: number }) {
  const state = s.error ? "risk" : s.pass ? "ok" : "warn";
  const color = {
    ok: "text-ok bg-ok-soft/60",
    risk: "text-risk bg-risk-soft/60",
    warn: "text-warn bg-warn-soft/60",
  }[state];
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px]">
      <span className="metric text-[10.5px] text-text-3">{index + 1}</span>
      <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${color}`}>
        {s.error ? "ERR" : s.pass ? "PASS" : "FAIL"}
      </span>
      <span className="truncate font-medium text-text-2">
        {s.scenario === "conv" ? "对话" : "研究"} · {s.taskName}
      </span>
      <span className="ml-auto shrink-0 text-[11px] text-text-3">
        {s.error ? s.error.slice(0, 40) : `进度 ${f1(s.progress)} · ${s.ms}ms`}
      </span>
    </div>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-border px-3 py-2.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-border/70 px-3 py-2.5 align-middle ${className ?? ""}`}>
      {children}
    </td>
  );
}
