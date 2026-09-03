import { useMemo, useRef, useState } from "react";
import {
  AGENTS as SEED_AGENTS,
  DIMS,
  SCENARIOS,
  normalizeWeights,
  scoresOf,
  totalOf,
  type Agent,
  type DimKey,
  type ScenarioKey,
  type Weights,
} from "@/lib/agentbench-data";

const RADAR_COLORS = ["var(--brand)", "var(--ok)", "var(--info)", "var(--warn)"];

const thBase =
  "border-b border-border px-3 py-3 text-right whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3 select-none";
const tdBase = "border-b border-border/80 px-3 py-3 align-middle whitespace-nowrap";

const sortMark = (active: boolean, asc: boolean) => (active ? (asc ? " ↑" : " ↓") : " ↕");

export function BenchApp() {
  const [agents, setAgents] = useState<Agent[]>(SEED_AGENTS);
  const [scenario, setScenario] = useState<ScenarioKey>("coding");
  const [sortKey, setSortKey] = useState<string>("total");
  const [sortAsc, setSortAsc] = useState(false);
  const [picked, setPicked] = useState<string[]>(["GPT-5.5", "Claude Opus 4.7"]);
  const [custom, setCustom] = useState<Weights | null>(null);
  const [ioStatus, setIoStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = SCENARIOS.find((s) => s.key === scenario)!;
  const rawWeights = custom ?? current.weights;
  const weights = useMemo(() => normalizeWeights(rawWeights), [rawWeights]);

  const rows = useMemo(() => {
    const list = agents.map((a) => {
      const sc = scoresOf(a, scenario);
      return { agent: a, scores: sc, total: totalOf(sc, weights) };
    });
    const dir = sortAsc ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "name") return a.agent.name.localeCompare(b.agent.name, "zh") * dir;
      if (sortKey === "rank" || sortKey === "total") return (a.total - b.total) * dir;
      if (sortKey === "pick") return 0;
      return (a.scores[sortKey as DimKey] - b.scores[sortKey as DimKey]) * dir;
    });
    return list;
  }, [agents, scenario, weights, sortKey, sortAsc]);

  const sortBy = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const togglePick = (name: string) => {
    setPicked((p) => {
      if (p.includes(name)) return p.filter((x) => x !== name);
      if (p.length >= 3) return p;
      return [...p, name];
    });
  };

  const rawSum = DIMS.reduce((a, d) => a + (rawWeights[d.key] || 0), 0);

  /* ---------- import / export ---------- */
  const download = (filename: string, text: string, mime: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    download("agentbench-data.json", JSON.stringify(agents, null, 2), "application/json");
    setIoStatus({ msg: "已导出 JSON", ok: true });
  };

  const exportCsv = () => {
    const head = ["排名", "Agent", "厂商", "总分", ...DIMS.map((d) => d.name)];
    const body = rows.map((r, i) => [
      i + 1,
      r.agent.name,
      r.agent.vendor,
      r.total.toFixed(2),
      ...DIMS.map((d) => r.scores[d.key].toFixed(2)),
    ]);
    const csv = [head, ...body].map((line) => line.join(",")).join("\n");
    download(`agentbench-${scenario}.csv`, "\uFEFF" + csv, "text/csv");
    setIoStatus({ msg: "已导出 CSV", ok: true });
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("根节点必须是数组");
        const need: ScenarioKey[] = ["coding", "conv", "os"];
        data.forEach((a: Agent, i: number) => {
          if (!a.name) throw new Error(`第 ${i + 1} 条缺少 name`);
          if (!a.s) throw new Error(`第 ${i + 1} 条缺少 s`);
          need.forEach((k) => {
            const sc = a.s[k];
            if (!sc) throw new Error(`${a.name} 缺少场景 ${k}`);
            (["success", "tool", "progress", "efficiency", "trust"] as const).forEach((f) => {
              if (typeof sc[f] !== "number") throw new Error(`${a.name}/${k} 的 ${f} 必须是数字`);
            });
          });
        });
        setAgents(data);
        setPicked((p) => p.filter((n) => data.some((a: Agent) => a.name === n)));
        setIoStatus({ msg: `导入成功：${data.length} 条数据已替换榜单`, ok: true });
      } catch (err) {
        setIoStatus({ msg: "导入失败：" + (err as Error).message, ok: false });
      }
    };
    reader.readAsText(file);
  };

  const pickedRows = rows.filter((r) => picked.includes(r.agent.name));

  return (
    <>
      {/* ================= 排行榜 ================= */}
      <section id="board" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Leaderboard</div>
            <h2 className="ab-section-title">排行榜</h2>
            <p className="ab-section-desc mt-2">
              切换场景即切换权重，总分与排序实时重算；点击任意表头可排序，勾选右侧复选框加入雷达对比（最多
              3 个）。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setScenario(s.key);
                  setCustom(null);
                }}
                className={`inline-flex min-h-[34px] items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all ${
                  s.key === scenario
                    ? "border-transparent bg-brand text-primary-foreground shadow-[0_8px_20px_color-mix(in_oklab,var(--brand)_24%,transparent)]"
                    : "border-border bg-white text-text-2 hover:border-brand/40 hover:text-brand"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-text-3">
          <span>{current.ref}</span>
          {picked.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ok-soft px-2 py-0.5 font-semibold text-ok">
              <span className="ab-dot" />
              已选 {picked.length} 个用于对比
            </span>
          )}
        </div>

        {/* 权重自定义面板 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[15px] font-semibold tracking-tight">权重自定义</h3>
            <span
              className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${
                custom ? "bg-warn-soft text-warn" : "bg-surface-2 text-text-3"
              }`}
            >
              {custom ? "自定义模式" : `预设：${current.name}`}
            </span>
            <span className="text-[12px] text-text-3">
              拖动任意滑块即进入自定义模式，权重按占比自动归一化，不必凑满 100
            </span>
            <button
              onClick={() => setCustom(null)}
              disabled={!custom}
              className="ml-auto inline-flex min-h-[32px] items-center rounded-lg border border-border px-3 text-[12px] font-semibold text-text-2 transition-colors hover:border-brand/50 hover:text-brand disabled:pointer-events-none disabled:opacity-40"
            >
              恢复预设
            </button>
          </div>

          <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIMS.map((d) => (
              <div key={d.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">{d.name}</span>
                  <span className="metric rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                    {weights[d.key].toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={rawWeights[d.key]}
                  onChange={(e) =>
                    setCustom({ ...(custom ?? current.weights), [d.key]: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer accent-[var(--brand)]"
                  aria-label={`${d.name} 权重`}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-dashed border-border pt-4">
            <span className="metric text-[12px] font-bold text-text-2">
              原始合计 {rawSum}% → 归一化后计入总分
            </span>
            <span className="text-[12px] text-text-3">
              滑动即进入自定义模式；权重按占比自动归一化，不必凑满 100。
            </span>
          </div>
        </div>

        {/* 排行表格 */}
        <div className="ab-panel mt-4 overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[1060px] text-[13px]">
              <thead>
                <tr>
                  <th
                    className={`${thBase} w-12 cursor-pointer text-left hover:text-brand`}
                    onClick={() => sortBy("rank")}
                  >
                    排名{sortMark(sortKey === "rank", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} cursor-pointer text-left hover:text-brand`}
                    onClick={() => sortBy("name")}
                  >
                    Agent{sortMark(sortKey === "name", sortAsc)}
                  </th>
                  <th
                    className={`${thBase} w-32 cursor-pointer hover:text-brand ${
                      sortKey === "total" ? "text-brand" : ""
                    }`}
                    onClick={() => sortBy("total")}
                  >
                    总分{sortMark(sortKey === "total", sortAsc)}
                  </th>
                  {DIMS.map((d) => (
                    <th
                      key={d.key}
                      className={`${thBase} cursor-pointer hover:text-brand ${
                        sortKey === d.key ? "text-brand" : ""
                      }`}
                      onClick={() => sortBy(d.key)}
                    >
                      <span className="flex flex-col items-end">
                        <span>
                          {d.short}
                          {sortMark(sortKey === d.key, sortAsc)}
                        </span>
                        <span className="text-[10px] font-medium normal-case tracking-normal text-text-3 opacity-90">
                          {d.key === "stability" ? "p³ 推算" : `权重 ${weights[d.key].toFixed(0)}%`}
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className={`${thBase} w-16 cursor-default`}>对比</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const checked = picked.includes(r.agent.name);
                  const src = r.agent.s[scenario].src;
                  return (
                    <tr
                      key={r.agent.name}
                      className={`transition-colors ${
                        checked ? "bg-brand-soft/70" : "hover:bg-surface-2/70"
                      }`}
                    >
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
                          {r.agent.name}
                          {r.agent.demo && (
                            <span className="ml-2 rounded-md bg-warn-soft px-1.5 py-0.5 text-[10px] font-bold text-warn align-middle">
                              占位示例
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-text-3">{r.agent.vendor}</div>
                        <div className="mt-1.5 text-[11px] leading-4">
                          {src ? (
                            <span className="inline-flex flex-wrap items-center gap-x-1.5">
                              <span className="rounded-md bg-info-soft px-1.5 py-0.5 font-bold text-info">
                                有来源
                              </span>
                              <b className="text-info">
                                {src.label} {src.val}
                              </b>
                              <span className="text-text-3">· {src.by}</span>
                            </span>
                          ) : (
                            <span className="text-text-3">
                              {r.agent.demo
                                ? "构造值，接入真实评测后替换"
                                : "该场景无公开来源，使用构造值"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tdBase}>
                        <div className="flex items-center justify-end gap-3">
                          <span className="metric text-[18px] font-bold tracking-tight">
                            {r.total.toFixed(1)}
                          </span>
                          <span className="h-[5px] w-16 overflow-hidden rounded-full bg-surface-2">
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-brand-2 to-brand"
                              style={{ width: `${Math.max(2, r.total)}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      {DIMS.map((d) => (
                        <td key={d.key} className={`${tdBase} metric text-right text-[12.5px]`}>
                          {r.scores[d.key].toFixed(1)}
                        </td>
                      ))}
                      <td className={tdBase}>
                        <input
                          type="checkbox"
                          aria-label={`对比 ${r.agent.name}`}
                          className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
                          checked={checked}
                          onChange={() => togglePick(r.agent.name)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= 多维对比 ================= */}
      <section id="radar" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Radar Compare</div>
            <h2 className="ab-section-title">多维对比</h2>
            <p className="ab-section-desc mt-2">
              勾选最多 3 个 Agent 进行雷达图对比。形状越“圆”越均衡，某个方向凹进去就是该 Agent
              的能力瓶颈。
            </p>
          </div>
        </div>

        <div className="ab-panel grid gap-6 bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Radar rows={pickedRows} weights={weights} />
          <aside className="flex flex-col gap-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
              当前场景：{current.name}
            </div>

            {pickedRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-2/60 px-4 py-5 text-[12.5px] leading-6 text-text-3">
                在排行榜中勾选 1–3 个 Agent，即可在此对比六个维度的能力形状。
                <br />
                <br />
                <b className="text-text-2">怎么看：</b>
                形状越“圆”越均衡；某个方向凹进去，就是该 Agent 的能力瓶颈所在。
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {pickedRows.map((r, idx) => (
                    <div
                      key={r.agent.name}
                      className="rounded-xl border border-border bg-white px-4 py-3 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[13px] font-semibold">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: RADAR_COLORS[idx % RADAR_COLORS.length] }}
                          />
                          {r.agent.name}
                        </span>
                        <b className="metric text-[15px]">{r.total.toFixed(1)}</b>
                      </div>
                      <p className="mt-2 text-[11.5px] leading-5 text-text-3">
                        {DIMS.map((d) => `${d.short} ${r.scores[d.key].toFixed(1)}`).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-auto rounded-xl border border-border bg-surface-2/70 px-4 py-3 text-[12px] leading-6 text-text-3">
                  <b className="text-foreground">pass³ 说明：</b>
                  稳定性由成功率按 p³ 推算。成功率 82.7% → pass³ 仅
                  56.6%，这就是“能跑通一次”与“每次都可靠”之间的差距。
                </p>
              </>
            )}
          </aside>
        </div>
      </section>

      {/* ================= 数据接入 ================= */}
      <section id="data" className="ab-container ab-section">
        <div className="ab-section-head">
          <div>
            <div className="ab-chip ab-chip-brand mb-3">Data Pipeline</div>
            <h2 className="ab-section-title">接入真实评测数据</h2>
            <p className="ab-section-desc mt-2">
              榜单当前含占位构造值。导入符合 schema 的 JSON 即可全量替换，无需改动页面代码。
            </p>
          </div>
        </div>

        <div className="ab-panel bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportJson} className="ab-button ab-button-secondary">
              导出当前数据 JSON
            </button>
            <button onClick={exportCsv} className="ab-button ab-button-secondary">
              导出当前榜单 CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="ab-button ab-button-primary"
            >
              导入 JSON 替换
            </button>
            {ioStatus && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ${
                  ioStatus.ok ? "bg-ok-soft text-ok" : "bg-risk-soft text-risk"
                }`}
              >
                {ioStatus.ok && <span className="ab-dot" />}
                {ioStatus.msg}
              </span>
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-surface-2/80 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
              JSON schema · 字段说明
            </div>
            <div className="overflow-x-auto bg-surface-2/40 px-4 py-3 font-mono text-[12px] leading-6">
              <pre className="whitespace-pre">
                {`{
  "name":   "Agent 名称（必填）",
  "vendor": "厂商",
  "demo":   true | false,          // true = 占位示例，标注「构造值」
  "s": {
    "coding" | "conv" | "os": {    // 三类场景需齐全
      "success":    0–100,         // 任务成功率
      "tool":       0–100,         // 工具调用准确率
      "progress":   0–100,         // 进度率
      "efficiency": 0–100,         // 效率
      "trust":      0–100,         // 可信与安全
      "src": { "label": "基准名", "val": "分数口径", "by": "发布方" } | null
    }
  }
}`}
              </pre>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-3">
            <span>
              <b className="text-text-2">stability 无需提供</b>
              ——由 success 按 passᵏ = pᵏ (k=3) 自动推算。
            </span>
            <span>
              <b className="text-text-2">src 为 null</b>
              时，该条目自动标注为「无公开来源 · 构造值」。
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function Radar({
  rows,
  weights,
}: {
  rows: { agent: Agent; scores: Record<DimKey, number>; total: number }[];
  weights: Weights;
}) {
  const size = 460;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const R = 148;
  const n = DIMS.length;
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, v: number): [number, number] => [
    cx + Math.cos(ang(i)) * R * (v / 100),
    cy + Math.sin(ang(i)) * R * (v / 100),
  ];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" className="mx-auto block max-w-[480px]">
      {[20, 40, 60, 80, 100].map((lv) => (
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
        const [lx, ly] = pt(i, 130);
        const anchor = Math.abs(lx - cx) < 12 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={d.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text
              x={lx}
              y={ly + 4}
              textAnchor={anchor}
              fontSize={12.5}
              fontWeight={700}
              fill="var(--text-2)"
            >
              {d.short}
            </text>
            <text x={lx} y={ly + 19} textAnchor={anchor} fontSize={10.5} fill="var(--text-3)">
              权重 {weights[d.key].toFixed(0)}%
            </text>
          </g>
        );
      })}
      {rows.map((r, idx) => {
        const color = RADAR_COLORS[idx % RADAR_COLORS.length];
        return (
          <g key={r.agent.name}>
            <polygon
              points={DIMS.map((d, i) => pt(i, r.scores[d.key]).join(",")).join(" ")}
              fill={color}
              fillOpacity={0.14}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {DIMS.map((d, i) => {
              const [x, y] = pt(i, r.scores[d.key]);
              return (
                <circle
                  key={d.key}
                  cx={x}
                  cy={y}
                  r={3.4}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth={2}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
