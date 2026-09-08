import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { runsQuery, SUITE_LABEL, TASK_LABEL, type EvalRunRow } from "@/lib/eval-queries";

const TITLE = "评测结果库 · AgentBench 智衡";
const DESC =
  "AgentBench 智衡评测结果库：按模型、任务类型与指标筛选每一次编程智能体评测，点开可查看完整评测过程、参数、工具调用日志与评分依据。";
const URL = "https://getagentbench.lovable.app/runs";

export const Route = createFileRoute("/runs/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(runsQuery),
  component: RunsPage,
});

const METRIC_KEYS = ["success", "tool", "progress", "efficiency", "trust", "ssr", "cost", "acc"];

const metricEntries = (r: EvalRunRow) =>
  Object.entries(r.metrics ?? {}).map(([k, v]) => [k, v] as [string, number]);

function RunsPage() {
  const { data: rows } = useSuspenseQuery(runsQuery);
  const [agent, setAgent] = useState("all");
  const [task, setTask] = useState("all");
  const [metric, setMetric] = useState("all");

  const agentNames = useMemo(
    () => [...new Set(rows.map((r) => r.agent_name))].sort((a, b) => a.localeCompare(b, "zh")),
    [rows],
  );
  const taskTypes = useMemo(() => [...new Set(rows.map((r) => r.task_type))], [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (agent === "all" || r.agent_name === agent) &&
          (task === "all" || r.task_type === task) &&
          (metric === "all" || Object.keys(r.metrics ?? {}).includes(metric)),
      ),
    [rows, agent, task, metric],
  );

  const sel = "rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12.5px]";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={[]} cta={{ href: "/board", label: "查看排行榜" }} />
      <main className="ab-container ab-section">
        <div className="ab-chip ab-chip-brand mb-3">Evaluation Runs</div>
        <h1 className="ab-section-title">评测结果库</h1>
        <p className="ab-section-desc mt-2 max-w-3xl">
          每一行都是一次真实评测记录，按模型、任务类型和指标筛选，点开查看完整评测过程、
          参数、工具调用日志与评分依据。榜单页见{" "}
          <a className="text-brand hover:underline" href="/board">
            排行榜
          </a>
          。
        </p>

        <div className="my-5 flex flex-wrap items-center gap-2">
          <label className="text-[12px] text-text-3" htmlFor="f-agent">
            模型
          </label>
          <select id="f-agent" className={sel} value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="all">全部</option>
            {agentNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className="text-[12px] text-text-3" htmlFor="f-task">
            任务
          </label>
          <select id="f-task" className={sel} value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="all">全部</option>
            {taskTypes.map((t) => (
              <option key={t} value={t}>
                {TASK_LABEL[t] ?? t}
              </option>
            ))}
          </select>
          <label className="text-[12px] text-text-3" htmlFor="f-metric">
            指标
          </label>
          <select id="f-metric" className={sel} value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="all">全部</option>
            {METRIC_KEYS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-text-3">共 {filtered.length} 条</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((r) => (
            <a
              key={r.id}
              href={`/runs/${r.id}`}
              className="ab-panel block bg-white p-4 transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-bold">{r.agent_name}</div>
                  <div className="mt-0.5 text-[11.5px] text-text-3">
                    {SUITE_LABEL[r.suite] ?? r.suite} · {TASK_LABEL[r.task_type] ?? r.task_type}
                  </div>
                </div>
                <span className="rounded-lg bg-surface-2 px-2 py-0.5 text-[11px] text-text-2">
                  {r.run_date}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-2">
                {metricEntries(r).map(([k, v]) => (
                  <span key={k} className="metric">
                    {k} <b className="text-foreground">{v}</b>
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11.5px] text-text-3">
                来源：{r.source_label} · 样本 {r.sample_size}
              </div>
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
