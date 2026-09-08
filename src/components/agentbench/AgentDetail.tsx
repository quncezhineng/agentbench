/**
 * AgentBench 智衡 · 单个智能体详情（/agents/$name）
 *
 * 展示某个 Agent 的完整评测结果：基本信息、三类场景的六维分数与总分、
 * 六维雷达图、数据来源标注（src）。数据来自共享榜单存储（与 /board、/eval 同源），
 * 因此「并入榜单 / 导入 JSON」后这里打开即为最新。
 */

import { useMemo, useState } from "react";
import {
  DIMS,
  SCENARIOS,
  hasScenario,
  normalizeWeights,
  scoresOf,
  totalOf,
  type Agent,
  type DimKey,
  type ScenarioKey,
  type Scores,
} from "@/lib/agentbench-data";
import { useLeaderboardSnapshot } from "@/lib/leaderboard-store";

const RADAR_COLOR = "var(--brand)";

export function AgentDetail({ name }: { name: string }) {
  const { agents } = useLeaderboardSnapshot();
  const agent = useMemo(() => agents.find((a) => a.name === name), [agents, name]);

  // 该 Agent 实际具备评测数据的场景（可局部导入，部分场景可能缺失）
  const available = useMemo(
    () => (agent ? SCENARIOS.filter((s) => hasScenario(agent, s.key)) : []),
    [agent],
  );
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);
  const activeScenario = scenario ?? available[0]?.key ?? null;

  if (!agent) {
    return (
      <section className="ab-container ab-section pt-10">
        <div className="ab-panel bg-white p-8 text-center">
          <h1 className="text-[22px] font-bold">未找到该智能体</h1>
          <p className="mt-2 text-[13px] text-text-3">
            榜单里没有「{name}」。它可能尚未评测，或数据还未并入/导入。
          </p>
          <a href="/board" className="ab-button ab-button-primary mt-5 inline-flex">
            返回排行榜
          </a>
        </div>
      </section>
    );
  }

  const scenarioMeta = SCENARIOS.find((s) => s.key === activeScenario);
  const raw = activeScenario ? agent.s[activeScenario] : undefined;
  const scores: Scores | null = activeScenario ? scoresOf(agent, activeScenario) : null;
  const total = scenarioMeta && scores ? totalOf(scores, normalizeWeights(scenarioMeta.weights)) : 0;

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
              {agent.demo && (
                <span className="rounded-md bg-warn-soft px-2 py-1 text-[11px] font-bold text-warn">
                  占位示例
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-2">
              <span className="ab-chip">{agent.vendor}</span>
              {available.length > 0 && (
                <span className="text-text-3">
                  已评测场景：{available.map((s) => s.name).join(" · ")}
                </span>
              )}
            </div>

            {available.length === 0 && (
              <p className="mt-4 text-[13px] text-text-3">
                该条目暂无任何已评测场景数据（可能为空占位，或导入时未提供场景）。
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================= 场景切换 + 分数 ================= */}
      {activeScenario && scenarioMeta && scores && (
        <section className="ab-container ab-section pt-2">
          <div className="ab-section-head">
            <div>
              <div className="ab-chip ab-chip-brand mb-3">Score Detail</div>
              <h2 className="ab-section-title">评测结果</h2>
              <p className="ab-section-desc mt-2">
                切换场景查看不同权重口径下的六维得分；stability 由成功率按 pass³ 推算。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {available.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s.key)}
                  className={`inline-flex min-h-[34px] items-center rounded-full border px-4 text-[13px] font-semibold transition-all ${
                    s.key === activeScenario
                      ? "border-transparent bg-brand text-primary-foreground"
                      : "border-border bg-white text-text-2 hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* 左：分数表 */}
            <div className="ab-panel overflow-hidden bg-white">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div>
                  <div className="text-[15px] font-bold">{scenarioMeta.name}</div>
                  <div className="mt-0.5 text-[12px] text-text-3">{scenarioMeta.ref}</div>
                </div>
                <div className="text-right">
                  <div className="metric text-[28px] font-bold leading-none text-brand">
                    {total.toFixed(1)}
                  </div>
                  <div className="mt-1 text-[11px] text-text-3">总分（{scenarioMeta.name}口径）</div>
                </div>
              </div>

              <div className="ab-table-scroll">
                <table className="ab-data-table min-w-[560px] text-[13px]">
                  <thead>
                    <tr>
                      <th className="border-b border-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        维度
                      </th>
                      <th className="border-b border-border px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        得分
                      </th>
                      <th className="border-b border-border px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        权重
                      </th>
                      <th className="border-b border-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                        说明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMS.map((d) => {
                      const w = normalizeWeights(scenarioMeta.weights)[d.key];
                      return (
                        <tr key={d.key} className="border-b border-border/70">
                          <td className="px-4 py-3">
                            <span className="font-semibold">{d.name}</span>
                            {d.derived && (
                              <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-text-3">
                                推算
                              </span>
                            )}
                          </td>
                          <td className="metric px-4 py-3 text-right text-[15px] font-bold">
                            {scores[d.key].toFixed(1)}
                          </td>
                          <td className="metric px-4 py-3 text-right text-text-3">{w.toFixed(0)}%</td>
                          <td className="px-4 py-3 text-[12px] leading-5 text-text-3">{d.desc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 右：雷达 + 来源 */}
            <aside className="flex flex-col gap-4">
              <div className="ab-panel bg-white p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
                  六维雷达 · {scenarioMeta.name}
                </div>
                <Radar scores={scores} />
              </div>

              <div className="ab-panel bg-white p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
                  数据来源
                </div>
                {raw?.src ? (
                  <div className="mt-3 space-y-1.5 text-[12.5px] leading-5">
                    <div>
                      <span className="rounded-md bg-info-soft px-1.5 py-0.5 text-[11px] font-bold text-info">
                        有来源
                      </span>{" "}
                      <b className="text-info">{raw.src.label}</b>
                    </div>
                    <div className="text-text-2">
                      口径：<b>{raw.src.val}</b>
                    </div>
                    <div className="text-text-3">{raw.src.by}</div>
                  </div>
                ) : (
                  <div className="mt-3 text-[12.5px] leading-5 text-text-3">
                    {agent.demo
                      ? "该条目为占位示例，使用构造值，接入真实评测后替换。"
                      : "该场景无公开来源，使用构造值（src = null）。"}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      )}
    </>
  );
}

/* ============================================================ */
/* 单 Agent 六维雷达（SVG）                                      */
/* ============================================================ */

function Radar({ scores }: { scores: Scores }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const R = 108;
  const n = DIMS.length;
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, v: number): [number, number] => [
    cx + Math.cos(ang(i)) * R * (v / 100),
    cy + Math.sin(ang(i)) * R * (v / 100),
  ];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" className="mx-auto mt-2 block max-w-[320px]">
      {[25, 50, 75, 100].map((lv) => (
        <polygon
          key={lv}
          points={DIMS.map((_, i) => pt(i, lv).join(",")).join(" ")}
          fill={lv === 100 ? "var(--surface-2)" : "none"}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {DIMS.map((d, i) => {
        const [x, y] = pt(i, 100);
        const [lx, ly] = pt(i, 128);
        const anchor = Math.abs(lx - cx) < 12 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={d.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text
              x={lx}
              y={ly + 4}
              textAnchor={anchor}
              fontSize={12}
              fontWeight={700}
              fill="var(--text-2)"
            >
              {d.short}
            </text>
          </g>
        );
      })}
      <polygon
        points={DIMS.map((d, i) => pt(i, scores[d.key]).join(",")).join(" ")}
        fill={RADAR_COLOR}
        fillOpacity={0.16}
        stroke={RADAR_COLOR}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {DIMS.map((d, i) => {
        const [x, y] = pt(i, scores[d.key]);
        return (
          <circle key={d.key} cx={x} cy={y} r={3.4} fill="var(--surface)" stroke={RADAR_COLOR} strokeWidth={2} />
        );
      })}
    </svg>
  );
}
