/**
 * AgentBench 智衡 · 单个编程智能体详情（/agents/$name，LoopArena 口径）
 *
 * 展示某个编程智能体的 LoopArena 三级结果：Type I 合同准确率、Type II / Type III
 * 严格成功率（SSR）与估算推理成本。参考策略只有 Type II / III；待评测产品无分数。
 */

import { useMemo } from "react";
import { RadarChart, RadarLegend, RADAR_COLORS } from "./RadarChart";
import {
  CLI_DIMS,
  cliOverall,
  cliScenarioScore,
  fmtCost,
  fmtPct,
  kindLabel,
  type LoopAgent,
} from "@/lib/agentbench-data";
import { useLeaderboardSnapshot } from "@/lib/leaderboard-store";

const SsrBar = ({ value }: { value: number | null }) => (
  <span className="h-[6px] w-28 overflow-hidden rounded-full bg-surface-2">
    <span
      className="block h-full rounded-full bg-gradient-to-r from-brand-2 to-brand"
      style={{ width: `${Math.max(2, value ?? 0)}%` }}
    />
  </span>
);

function TierCard({
  label,
  subtitle,
  ssr,
  cost,
  acc,
}: {
  label: string;
  subtitle: string;
  ssr: number | null;
  cost: number | null;
  acc?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] font-bold tracking-tight">{label}</div>
          <div className="mt-0.5 text-[11.5px] text-text-3">{subtitle}</div>
        </div>
        {acc != null && (
          <span className="rounded-lg bg-info-soft px-2 py-0.5 text-[11px] font-bold text-info">
            合同准确率 {fmtPct(acc)}
          </span>
        )}
      </div>

      {ssr != null ? (
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
              SSR（严格成功率）
            </div>
            <div className="metric mt-1 text-[32px] font-bold leading-none text-brand">
              {fmtPct(ssr)}
            </div>
          </div>
          <SsrBar value={ssr} />
        </div>
      ) : (
        <div className="mt-4 text-[13px] text-text-3">该档位无分数（不适用）。</div>
      )}

      {cost != null && (
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="text-[12px] text-text-3">平均估算推理成本</span>
          <span className="metric text-[15px] font-bold text-text-2">{fmtCost(cost)}</span>
        </div>
      )}
    </div>
  );
}

export function AgentDetail({ name }: { name: string }) {
  const { agents } = useLeaderboardSnapshot();
  const agent = useMemo(() => agents.find((a) => a.name === name), [agents, name]);

  if (!agent) {
    return (
      <section className="ab-container ab-section pt-10">
        <div className="ab-panel bg-white p-8 text-center">
          <h1 className="text-[22px] font-bold">未找到该智能体</h1>
          <p className="mt-2 text-[13px] text-text-3">榜单里没有「{name}」。</p>
          <a href="/board" className="ab-button ab-button-primary mt-5 inline-flex">
            返回排行榜
          </a>
        </div>
      </section>
    );
  }

  const isProduct = agent.kind === "product";
  const isReference = agent.kind === "reference";

  return (
    <>
      {/* ================= 概览 ================= */}
      <section className="ab-container ab-section pt-8 sm:pt-10">
        <div className="ab-panel ab-grid-bg overflow-hidden">
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <a href="/board" className="text-[12.5px] font-semibold text-brand hover:underline">
              ← 返回排行榜
            </a>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[36px]">
                {agent.name}
              </h1>
              {agent.demo ? (
                <span className="rounded-md bg-warn-soft px-2 py-1 text-[11px] font-bold text-warn">
                  待评测
                </span>
              ) : (
                <span className="rounded-md bg-ok-soft px-2 py-1 text-[11px] font-bold text-ok">
                  已评测
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-2">
              <span className="ab-chip">{agent.vendor}</span>
              <span className="text-text-3">{kindLabel[agent.kind]}</span>
            </div>
            {agent.note && <p className="mt-3 text-[12.5px] text-text-3">{agent.note}</p>}

            {(agent.r.src ?? agent.cli?.src) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                <span className="rounded-md bg-info-soft px-1.5 py-0.5 text-[11px] font-bold text-info">
                  数据来源
                </span>
                <b className="text-info">{(agent.r.src ?? agent.cli!.src).label}</b>
                <span className="text-text-3">
                  {(agent.r.src ?? agent.cli!.src).val} · {(agent.r.src ?? agent.cli!.src).by}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= 三级结果 ================= */}
      <section className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">LoopArena Results</div>
            <h2 className="ab-section-title">三级评测结果</h2>
            <p className="ab-section-desc mt-2">
              Type I 测「单个控制决策」，Type II 测「任务切片上的闭环控制」，Type III
              测「完整任务上的最终能力」。SSR 越高越强，成本越低越省。
            </p>
          </div>
        </div>

        {agent.cli ? (
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="ab-panel bg-white p-4">
              <div className="mb-1 text-[13px] font-bold tracking-tight">五维能力雷达图</div>
              <div className="mb-2 text-[11.5px] text-text-3">两类场景对比（0–100）</div>
              <RadarChart
                axes={CLI_DIMS.map((d) => d.label)}
                series={[
                  {
                    name: "多轮对话",
                    values: CLI_DIMS.map((d) => agent.cli!.conv[d.key]),
                    color: RADAR_COLORS[0]!,
                  },
                  {
                    name: "研究与操作",
                    values: CLI_DIMS.map((d) => agent.cli!.os[d.key]),
                    color: RADAR_COLORS[2]!,
                  },
                ]}
              />
              <RadarLegend
                series={[
                  { name: "多轮对话", values: [], color: RADAR_COLORS[0]! },
                  { name: "研究与操作", values: [], color: RADAR_COLORS[2]! },
                ]}
              />
            </div>

            <div className="ab-panel overflow-hidden bg-white">
              <div className="ab-table-scroll">
                <table className="ab-data-table min-w-[420px] text-[13px]">
                  <thead>
                    <tr>
                      <th className="border-b border-border px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        维度
                      </th>
                      <th className="border-b border-border px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        多轮对话
                      </th>
                      <th className="border-b border-border px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        研究与操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CLI_DIMS.map((d) => (
                      <tr key={d.key} className="hover:bg-surface-2/70">
                        <td className="border-b border-border/80 px-3 py-3">
                          {d.label}
                          <span className="ml-2 text-[11px] text-text-3">
                            权重 {Math.round(d.weight * 100)}%
                          </span>
                        </td>
                        <td className="metric border-b border-border/80 px-3 py-3 text-right font-bold">
                          {agent.cli!.conv[d.key].toFixed(1)}
                        </td>
                        <td className="metric border-b border-border/80 px-3 py-3 text-right font-bold">
                          {agent.cli!.os[d.key].toFixed(1)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-surface-2/50">
                      <td className="px-3 py-3 font-bold">加权综合分</td>
                      <td className="metric px-3 py-3 text-right font-bold text-brand">
                        {cliScenarioScore(agent.cli.conv).toFixed(1)}
                      </td>
                      <td className="metric px-3 py-3 text-right font-bold text-brand">
                        {cliScenarioScore(agent.cli.os).toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border px-4 py-3 text-[12px] text-text-3">
                总体综合分 <b className="metric text-brand">{cliOverall(agent).toFixed(1)}</b> ·{" "}
                {agent.cli.src.by}
              </div>
            </div>
          </div>
        ) : isProduct ? (
          <div className="ab-panel bg-white p-8 text-center">
            <div className="text-[15px] font-semibold text-text-2">
              该编程智能体尚未接入 LoopArena 评测
            </div>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-text-3">
              目前榜单只对论文中跑过 LoopArena 的 5 个 Controller 模型打分；其余主流产品（如本条目）
              会在跑通 Type II / Type III 后并入主榜。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {!isReference && (
              <TierCard
                label="Type I · 合同选择"
                subtitle="四选一 · 构建时已执行验证 · 零 Worker 运行"
                ssr={null}
                cost={null}
                acc={agent.r.type1Acc}
              />
            )}
            <TierCard
              label="Type II · 任务切片"
              subtitle="从准备好的中间工作区开始"
              ssr={agent.r.type2Ssr}
              cost={agent.r.type2Cost}
            />
            <TierCard
              label="Type III · 完整任务"
              subtitle="从原始状态开始 · 最终标准"
              ssr={agent.r.type3Ssr}
              cost={agent.r.type3Cost}
            />
          </div>
        )}
      </section>
    </>
  );
}
