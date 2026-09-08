/**
 * AgentBench 智衡 · 编程智能体排行榜（LoopArena 口径）
 *
 * 结构：
 * - 主榜：论文 Table 2 的 5 个 Controller 模型，按 Type III 严格成功率（SSR）降序排名；
 * - 参考策略：No control / Fixed control（不参与排名，仅作对照）；
 * - 待评测产品：额外补充的主流编程智能体（Claude Code / Codex / Cursor 等，暂占位）。
 */

import { useMemo, useState } from "react";
import { RadarChart, RadarLegend, RADAR_COLORS, type RadarSeries } from "./RadarChart";
import {
  CLI_AGENTS,
  CLI_DIMS,
  cliDimAvg,
  cliOverall,
  CONTROLLERS,
  PRODUCTS,
  REFERENCES,
  fmtCost,
  fmtPct,
  type LoopAgent,
} from "@/lib/agentbench-data";

type SortKey = "type3" | "type2" | "type1" | "name";

const thBase =
  "border-b border-border px-3 py-3 text-right whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3 select-none";
const tdBase = "border-b border-border/80 px-3 py-3 align-middle whitespace-nowrap";

const sortMark = (active: boolean, asc: boolean) => (active ? (asc ? " ↑" : " ↓") : " ↕");

const valOf = (a: LoopAgent, key: SortKey): number => {
  if (key === "type1") return a.r.type1Acc ?? -1;
  if (key === "type2") return a.r.type2Ssr ?? -1;
  if (key === "type3") return a.r.type3Ssr ?? -1;
  return 0;
};

export function BenchApp() {
  const [sortKey, setSortKey] = useState<SortKey>("type3");
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    const list = CONTROLLERS.slice();
    const dir = sortAsc ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "zh") * dir;
      return (valOf(a, sortKey) - valOf(b, sortKey)) * dir;
    });
    return list;
  }, [sortKey, sortAsc]);

  const cliRows = useMemo(
    () => CLI_AGENTS.slice().sort((a, b) => cliOverall(b) - cliOverall(a)),
    [],
  );

  const radarSeries: RadarSeries[] = useMemo(
    () =>
      cliRows.map((a, i) => ({
        name: a.name,
        values: CLI_DIMS.map((d) => cliDimAvg(a, d.key)),
        color: RADAR_COLORS[i % RADAR_COLORS.length]!,
      })),
    [cliRows],
  );

  const sortBy = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

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
              排名——它衡量 Controller 从零开始把完整编码任务「真正做完」的能力；Type I / Type II
              为辅助档位，成本为无缓存口径的估算推理成本。
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-text-3">
          <span>
            参考基准：<b className="text-text-2">LoopArena（arXiv 2608.28281）</b> · Worker =
            Qwen3.7-Plus
          </span>
        </div>

        <div className="ab-panel overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[980px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${thBase} w-12 cursor-pointer text-left hover:text-brand`}>
                    排名
                  </th>
                  <th
                    className={`${thBase} cursor-pointer text-left hover:text-brand`}
                    onClick={() => sortBy("name")}
                  >
                    编程智能体{sortMark(sortKey === "name", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${
                      sortKey === "type1" ? "text-brand" : ""
                    }`}
                    onClick={() => sortBy("type1")}
                  >
                    <span className="flex flex-col items-end">
                      <span>Type I · 合同准确率{sortMark(sortKey === "type1", sortAsc)}</span>
                      <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                        四选一 · 零 Worker 执行
                      </span>
                    </span>
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${
                      sortKey === "type2" ? "text-brand" : ""
                    }`}
                    onClick={() => sortBy("type2")}
                  >
                    <span className="flex flex-col items-end">
                      <span>Type II · SSR{sortMark(sortKey === "type2", sortAsc)}</span>
                      <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                        任务切片
                      </span>
                    </span>
                  </th>
                  <th className={`${thBase} cursor-default`}>
                    <span className="flex flex-col items-end">
                      <span>Type II · 成本</span>
                      <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                        $/run ↓
                      </span>
                    </span>
                  </th>
                  <th
                    className={`${thBase} cursor-pointer hover:text-brand ${
                      sortKey === "type3" ? "text-brand" : ""
                    }`}
                    onClick={() => sortBy("type3")}
                  >
                    <span className="flex flex-col items-end">
                      <span>Type III · SSR{sortMark(sortKey === "type3", sortAsc)}</span>
                      <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                        完整任务 · 主排序
                      </span>
                    </span>
                  </th>
                  <th className={`${thBase} cursor-default`}>
                    <span className="flex flex-col items-end">
                      <span>Type III · 成本</span>
                      <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                        $/run ↓
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr key={a.name} className="transition-colors hover:bg-surface-2/70">
                    <td className={tdBase}>
                      <span
                        className={`metric inline-flex h-6 w-7 items-center justify-center rounded-lg text-[12.5px] font-bold ${
                          i === 0
                            ? "bg-brand-soft text-brand"
                            : i === 1
                              ? "bg-surface-2 text-text-2"
                              : "text-text-3"
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

        {/* 口径说明 */}
        <p className="mt-3 text-[12px] leading-5 text-text-3">
          SSR = Strict Success Rate：既通过任务 evaluator，又符合 LoopArena
          协议（Controller 只在恰当时机 stop、Worker 未越界）才算成功。成本为无缓存口径的
          平均估算推理成本（含 Worker / Reporter / Controller）。
        </p>
      </section>

      {/* ================= 参考策略 ================= */}
      <section id="references" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Reference Policies</div>
            <h2 className="ab-section-title">参考策略（不参与排名）</h2>
            <p className="ab-section-desc mt-2">
              两条基线用同一个 Worker 与执行环境，用来回答一个问题：「到底还需不需要
              Controller？」它们不读 Evidence Packet、不出 Loop Contract。
            </p>
          </div>
        </div>

        <div className="ab-panel overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[720px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${thBase} text-left`}>策略</th>
                  <th className={`${thBase} text-left`}>行为</th>
                  <th className={thBase}>Type II · SSR</th>
                  <th className={thBase}>Type II · 成本</th>
                  <th className={thBase}>Type III · SSR</th>
                  <th className={thBase}>Type III · 成本</th>
                </tr>
              </thead>
              <tbody>
                {REFERENCES.map((a) => (
                  <tr key={a.name} className="hover:bg-surface-2/70">
                    <td className={`${tdBase} font-semibold`}>
                      <a
                        href={`/agents/${encodeURIComponent(a.name)}`}
                        className="text-text-2 hover:text-brand hover:underline"
                      >
                        {a.name}
                      </a>
                    </td>
                    <td className={`${tdBase} text-[12px] text-text-3`}>{a.note}</td>
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

      {/* ================= CLI 实测榜 ================= */}
      <section id="cli" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">CLI 实测 · 2026-09-04</div>
            <h2 className="ab-section-title">编程智能体 CLI 实测榜</h2>
            <p className="ab-section-desc mt-2">
              用内置评测套件 v0 在本机真实跑分：每个智能体以非交互模式执行「多轮对话」与
              「研究与操作」两类任务，按任务成功率、工具调用准确率、进度率、效率、可信与安全
              五个维度打分，综合分为两类场景的加权平均。
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="ab-panel overflow-hidden bg-white">
            <div className="ab-table-scroll">
              <table className="ab-data-table min-w-[760px] text-[13px]">
                <thead>
                  <tr>
                    <th className={`${thBase} w-12 text-left`}>排名</th>
                    <th className={`${thBase} text-left`}>编程智能体</th>
                    <th className={thBase}>综合分</th>
                    {CLI_DIMS.map((d) => (
                      <th key={d.key} className={thBase}>
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
                      <td className={`${tdBase} metric text-right text-[17px] font-bold text-brand`}>
                        {cliOverall(a).toFixed(1)}
                      </td>
                      {CLI_DIMS.map((d) => (
                        <td
                          key={d.key}
                          className={`${tdBase} metric text-right text-[13px] text-text-2`}
                        >
                          {cliDimAvg(a, d.key).toFixed(1)}
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
            <div className="mb-2 text-[11.5px] text-text-3">两类场景平均分（0–100）</div>
            <RadarChart axes={CLI_DIMS.map((d) => d.label)} series={radarSeries} />
            <RadarLegend series={radarSeries} />
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-5 text-text-3">
          口径：{CLI_AGENTS[0]?.cli?.src.by ?? ""}。样本量较小（每场景 3 个任务、单次运行），
          维度分由同一裁判模型评定，效率为相对耗时归一化后的分数，结果仅供横向参考。
        </p>
      </section>

      {/* ================= 待评测产品 ================= */}
      <section id="pending" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Pending · 待评测</div>
            <h2 className="ab-section-title">其他主流编程智能体（待接入）</h2>
            <p className="ab-section-desc mt-2">
              以下产品尚未跑分，待跑通实测套件或 LoopArena Type II / Type III 后并入榜单。
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-white px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`/agents/${encodeURIComponent(p.name)}`}
                    className="truncate text-[13.5px] font-semibold text-text-2 hover:text-brand hover:underline"
                  >
                    {p.name}
                  </a>
                  <span className="shrink-0 rounded-md bg-warn-soft px-1.5 py-0.5 text-[10px] font-bold text-warn">
                    待评测
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-text-3">
                  {p.vendor}
                  {p.note ? ` · ${p.note}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
