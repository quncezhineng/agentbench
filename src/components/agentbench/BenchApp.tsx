/**
 * AgentBench 智衡 · 编程智能体排行榜
 *
 * 数据来自数据库（eval_runs 表中已审核的评测记录），页面实时刷新，无需修改数据文件。
 * 结构：主榜（LoopArena 三级）→ CLI 实测榜（五维 + 雷达图）→ 参考策略 → 待评测 → 提交表单。
 */

import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RadarChart, RadarLegend, RADAR_COLORS, type RadarSeries } from "./RadarChart";
import { SubmitForm } from "./SubmitForm";
import {
  CLI_DIMS,
  cliScenarioScore,
  fmtCost,
  fmtPct,
  type CliDims,
  type LoopAgent,
} from "@/lib/agentbench-data";
import {
  cliAgentsOf,
  controllersOf,
  deriveAgents,
  referencesOf,
  runsQuery,
  scheduleQuery,
} from "@/lib/eval-queries";

type SortKey = "type3" | "type2" | "type1" | "cost3" | "cost2" | "name";
type Scenario = "avg" | "conv" | "os";
type CliSort = "overall" | keyof CliDims;

const thBase =
  "border-b border-border px-3 py-3 text-right whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3 select-none";
const tdBase = "border-b border-border/80 px-3 py-3 align-middle whitespace-nowrap";

const sortMark = (active: boolean, asc: boolean) => (active ? (asc ? " ↑" : " ↓") : " ↕");

const valOf = (a: LoopAgent, key: SortKey): number => {
  if (key === "type1") return a.r.type1Acc ?? -1;
  if (key === "type2") return a.r.type2Ssr ?? -1;
  if (key === "type3") return a.r.type3Ssr ?? -1;
  if (key === "cost2") return a.r.type2Cost ?? Number.MAX_SAFE_INTEGER;
  if (key === "cost3") return a.r.type3Cost ?? Number.MAX_SAFE_INTEGER;
  return 0;
};

/** 按场景取维度值 */
const dimVal = (a: LoopAgent, key: keyof CliDims, sc: Scenario): number => {
  if (!a.cli) return 0;
  if (sc === "conv") return a.cli.conv[key];
  if (sc === "os") return a.cli.os[key];
  return (a.cli.conv[key] + a.cli.os[key]) / 2;
};

/** 按场景取综合分（可传入自定义归一化权重） */
const overallOf = (a: LoopAgent, sc: Scenario, weights?: number[]): number => {
  if (!a.cli) return -1;
  const score = (d: CliDims) =>
    weights
      ? CLI_DIMS.reduce((sum, dim, i) => sum + d[dim.key] * (weights[i] ?? 0), 0)
      : cliScenarioScore(d);
  if (sc === "conv") return score(a.cli.conv);
  if (sc === "os") return score(a.cli.os);
  return (score(a.cli.conv) + score(a.cli.os)) / 2;
};


const SCENARIOS: { key: Scenario; label: string }[] = [
  { key: "avg", label: "两类场景平均" },
  { key: "conv", label: "多轮对话任务" },
  { key: "os", label: "研究与操作任务" },
];

export function BenchApp() {
  const { data: runRows } = useSuspenseQuery(runsQuery);
  const { data: scheduleRows } = useSuspenseQuery(scheduleQuery);

  const agents = useMemo(() => deriveAgents(runRows), [runRows]);
  const controllers = useMemo(() => controllersOf(agents), [agents]);
  const references = useMemo(() => referencesOf(agents), [agents]);
  const cliAgents = useMemo(() => cliAgentsOf(agents), [agents]);

  const [sortKey, setSortKey] = useState<SortKey>("type3");
  const [sortAsc, setSortAsc] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("avg");
  const [cliSort, setCliSort] = useState<CliSort>("overall");
  const [rawWeights, setRawWeights] = useState<number[]>(() => CLI_DIMS.map((d) => d.weight));

  /** 归一化权重：合计恒为 1，供排序与综合分使用 */
  const weights = useMemo(() => {
    const total = rawWeights.reduce((s, w) => s + Math.max(0, w), 0) || 1;
    return rawWeights.map((w) => Math.max(0, w) / total);
  }, [rawWeights]);

  const weightsTouched = useMemo(
    () => weights.some((w, i) => Math.abs(w - (CLI_DIMS[i]?.weight ?? 0)) > 0.005),
    [weights],
  );

  const rows = useMemo(() => {
    const list = controllers.slice();
    const dir = sortAsc ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "zh") * dir;
      if (sortKey === "cost2" || sortKey === "cost3")
        return (valOf(a, sortKey) - valOf(b, sortKey)) * (sortAsc ? 1 : -1);
      return (valOf(a, sortKey) - valOf(b, sortKey)) * dir;
    });
    return list;
  }, [controllers, sortKey, sortAsc]);

  const cliRows = useMemo(() => {
    const list = cliAgents.slice();
    list.sort((a, b) =>
      cliSort === "overall"
        ? overallOf(b, scenario, weights) - overallOf(a, scenario, weights)
        : dimVal(b, cliSort, scenario) - dimVal(a, cliSort, scenario),
    );
    return list;
  }, [cliAgents, cliSort, scenario, weights]);


  const radarSeries: RadarSeries[] = useMemo(
    () =>
      cliRows.map((a, i) => ({
        name: a.name,
        values: CLI_DIMS.map((d) => dimVal(a, d.key, scenario)),
        color: RADAR_COLORS[i % RADAR_COLORS.length]!,
      })),
    [cliRows, scenario],
  );

  const sortBy = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const latest = runRows[0]?.run_date ?? "—";

  return (
    <>
      {/* ================= 主榜 ================= */}
      <section id="board" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">LoopArena Leaderboard</div>
            <h1 className="ab-section-title">编程智能体排行榜</h1>
            <p className="ab-section-desc mt-2">
              只对目前主流的编程智能体排序打分。主榜按{" "}
              <b className="text-foreground">Type III 严格成功率（SSR）</b>
              排名，也可以按 Type I / Type II 或成本排序；数据全部来自数据库中的评测记录，
              新结果审核通过后榜单会自动刷新。
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-text-3">
          <span>
            最近评测日期：<b className="text-text-2">{latest}</b>
          </span>
          <a className="text-brand hover:underline" href="/sources">
            实测数据来源
          </a>
          <a className="text-brand hover:underline" href="/runs">
            全部评测结果
          </a>
          <a className="text-brand hover:underline" href="/calendar">
            评测日历
          </a>
        </div>

        <div className="ab-panel overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[980px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${thBase} w-12 text-left`}>排名</th>
                  <th
                    className={`${thBase} cursor-pointer text-left hover:text-brand`}
                    onClick={() => sortBy("name")}
                  >
                    编程智能体{sortMark(sortKey === "name", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${sortKey === "type1" ? "text-brand" : ""}`}
                    onClick={() => sortBy("type1")}
                  >
                    Type I · 合同准确率{sortMark(sortKey === "type1", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${sortKey === "type2" ? "text-brand" : ""}`}
                    onClick={() => sortBy("type2")}
                  >
                    Type II · SSR{sortMark(sortKey === "type2", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${sortKey === "cost2" ? "text-brand" : ""}`}
                    onClick={() => sortBy("cost2")}
                  >
                    Type II · 成本{sortMark(sortKey === "cost2", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${sortKey === "type3" ? "text-brand" : ""}`}
                    onClick={() => sortBy("type3")}
                  >
                    Type III · SSR{sortMark(sortKey === "type3", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${sortKey === "cost3" ? "text-brand" : ""}`}
                    onClick={() => sortBy("cost3")}
                  >
                    Type III · 成本{sortMark(sortKey === "cost3", sortAsc)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr key={a.name} className="transition-colors hover:bg-surface-2/70">
                    <td className={tdBase}>
                      <span
                        className={`metric inline-flex h-6 w-7 items-center justify-center rounded-lg text-[12.5px] font-bold ${
                          i === 0 ? "bg-brand-soft text-brand" : "text-text-3"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className={tdBase}>
                      <div className="font-semibold">
                        <a
                          href={`/agents/${encodeURIComponent(a.name)}`}
                          className="text-brand hover:underline"
                        >
                          {a.name}
                        </a>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-text-3">{a.vendor}</div>
                      {a.note && (
                        <div className="mt-1 text-[11px] leading-4 text-text-3">{a.note}</div>
                      )}
                    </td>
                    <td className={`${tdBase} metric text-right text-[15px] font-bold`}>
                      {fmtPct(a.r.type1Acc)}
                    </td>
                    <td className={`${tdBase} metric text-right text-[15px] font-bold`}>
                      {fmtPct(a.r.type2Ssr)}
                    </td>
                    <td className={`${tdBase} metric text-right text-[12.5px] text-text-2`}>
                      {fmtCost(a.r.type2Cost)}
                    </td>
                    <td className={tdBase}>
                      <div className="flex items-center justify-end gap-3">
                        <span className="metric text-[18px] font-bold tracking-tight text-brand">
                          {fmtPct(a.r.type3Ssr)}
                        </span>
                        <span className="h-[5px] w-16 overflow-hidden rounded-full bg-surface-2">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-brand-2 to-brand"
                            style={{ width: `${Math.max(2, a.r.type3Ssr ?? 0)}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className={`${tdBase} metric text-right text-[12.5px] text-text-2`}>
                      {fmtCost(a.r.type3Cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-5 text-text-3">
          SSR = Strict Success Rate：既通过任务 evaluator，又符合 LoopArena
          协议才算成功。成本为无缓存口径的平均估算推理成本。
        </p>
      </section>

      {/* ================= CLI 实测榜 ================= */}
      <section id="cli" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">CLI 实测</div>
            <h2 className="ab-section-title">编程智能体 CLI 实测榜</h2>
            <p className="ab-section-desc mt-2">
              切换任务类型与指标，表格与雷达图会同步显示该口径下的真实分布。
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setScenario(s.key)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${
                scenario === s.key
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border bg-white text-text-2 hover:border-brand"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-2 text-[12px] text-text-3">排序指标</span>
          <select
            aria-label="排序指标"
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12.5px]"
            value={cliSort}
            onChange={(e) => setCliSort(e.target.value as CliSort)}
          >
            <option value="overall">综合分</option>
            {CLI_DIMS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="ab-panel overflow-hidden bg-white">
            <div className="ab-table-scroll">
              <table className="ab-data-table min-w-[760px] text-[13px]">
                <thead>
                  <tr>
                    <th className={`${thBase} w-12 text-left`}>排名</th>
                    <th className={`${thBase} text-left`}>编程智能体</th>
                    <th
                      className={`${thBase} cursor-pointer hover:text-brand ${cliSort === "overall" ? "text-brand" : ""}`}
                      onClick={() => setCliSort("overall")}
                    >
                      综合分
                    </th>
                    {CLI_DIMS.map((d) => (
                      <th
                        key={d.key}
                        className={`${thBase} cursor-pointer hover:text-brand ${cliSort === d.key ? "text-brand" : ""}`}
                        onClick={() => setCliSort(d.key)}
                      >
                        <span className="flex flex-col items-end">
                          <span>{d.label}</span>
                          <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                            权重 {Math.round(d.weight * 100)}%
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cliRows.map((a, i) => (
                    <tr key={a.name} className="transition-colors hover:bg-surface-2/70">
                      <td className={tdBase}>
                        <span
                          className={`metric inline-flex h-6 w-7 items-center justify-center rounded-lg text-[12.5px] font-bold ${
                            i === 0 ? "bg-brand-soft text-brand" : "text-text-3"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className={tdBase}>
                        <div className="font-semibold">
                          <a
                            href={`/agents/${encodeURIComponent(a.name)}`}
                            className="text-brand hover:underline"
                          >
                            {a.name}
                          </a>
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-text-3">{a.vendor}</div>
                      </td>
                      <td
                        className={`${tdBase} metric text-right text-[17px] font-bold text-brand`}
                      >
                        {overallOf(a, scenario, weights).toFixed(1)}
                      </td>
                      {CLI_DIMS.map((d) => (
                        <td
                          key={d.key}
                          className={`${tdBase} metric text-right text-[13px] ${
                            cliSort === d.key ? "font-bold text-foreground" : "text-text-2"
                          }`}
                        >
                          {dimVal(a, d.key, scenario).toFixed(1)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ab-panel bg-white p-4">
            <div className="mb-1 text-[13px] font-bold tracking-tight">五维能力雷达图</div>
            <div className="mb-2 text-[11.5px] text-text-3">
              {SCENARIOS.find((s) => s.key === scenario)?.label}（0–100）· 拖动轴上的蓝色圆点即可调整该维度权重
            </div>
            <RadarChart
              axes={CLI_DIMS.map((d) => d.label)}
              series={radarSeries}
              weights={weights}
              onWeightsChange={setRawWeights}
            />
            <RadarLegend series={radarSeries} />
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-[11.5px] text-text-3">
              <span>{weightsTouched ? "已使用自定义权重，综合分与排名已同步刷新" : "当前为默认权重"}</span>
              <button
                type="button"
                onClick={() => setRawWeights(CLI_DIMS.map((d) => d.weight))}
                className="rounded-full border border-border px-3 py-1 text-[11.5px] font-semibold text-text-2 hover:border-brand hover:text-brand"
              >
                恢复默认
              </button>
            </div>
          </div>

        </div>

        <p className="mt-3 text-[12px] leading-5 text-text-3">
          每条数据的来源、时间、方法与原始记录见{" "}
          <a className="text-brand hover:underline" href="/sources">
            实测数据来源页
          </a>
          。
        </p>
      </section>

      {/* ================= 参考策略 ================= */}
      <section id="references" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Reference Policies</div>
            <h2 className="ab-section-title">参考策略（不参与排名）</h2>
            <p className="ab-section-desc mt-2">
              两条基线用同一个 Worker 与执行环境，用来回答「到底还需不需要 Controller」。
            </p>
          </div>
        </div>

        <div className="ab-panel overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[720px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${thBase} text-left`}>策略</th>
                  <th className={thBase}>Type II · SSR</th>
                  <th className={thBase}>Type II · 成本</th>
                  <th className={thBase}>Type III · SSR</th>
                  <th className={thBase}>Type III · 成本</th>
                </tr>
              </thead>
              <tbody>
                {references.map((a) => (
                  <tr key={a.name} className="hover:bg-surface-2/70">
                    <td className={`${tdBase} font-semibold`}>
                      <a
                        href={`/agents/${encodeURIComponent(a.name)}`}
                        className="text-text-2 hover:text-brand hover:underline"
                      >
                        {a.name}
                      </a>
                      {a.note && (
                        <div className="mt-0.5 text-[11px] font-normal text-text-3">{a.note}</div>
                      )}
                    </td>
                    <td className={`${tdBase} metric text-right`}>{fmtPct(a.r.type2Ssr)}</td>
                    <td className={`${tdBase} metric text-right text-text-2`}>
                      {fmtCost(a.r.type2Cost)}
                    </td>
                    <td className={`${tdBase} metric text-right`}>{fmtPct(a.r.type3Ssr)}</td>
                    <td className={`${tdBase} metric text-right text-text-2`}>
                      {fmtCost(a.r.type3Cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= 待评测 / 排期 ================= */}
      <section id="pending" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Pending</div>
            <h2 className="ab-section-title">待评测队列</h2>
            <p className="ab-section-desc mt-2">
              下列产品已排期但尚未跑分，完整排期见{" "}
              <a className="text-brand hover:underline" href="/calendar">
                评测日历
              </a>
              。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {scheduleRows
            .filter((s) => s.status !== "done")
            .map((s) => (
              <span
                key={s.id}
                className="rounded-xl border border-border bg-white px-3 py-2 text-[12.5px]"
              >
                <b>{s.agent_name}</b>
                <span className="ml-2 text-text-3">计划 {s.planned_date}</span>
              </span>
            ))}
        </div>
      </section>

      {/* ================= 提交评测结果 ================= */}
      <section id="submit" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Submit</div>
            <h2 className="ab-section-title">提交评测结果</h2>
            <p className="ab-section-desc mt-2">
              填写一次评测的分数、来源与方法，提交后进入待审核队列；审核通过后排行榜、
              雷达图与维度表都会自动更新，不需要改任何数据文件。
            </p>
          </div>
        </div>
        <SubmitForm />
      </section>
    </>
  );
}
