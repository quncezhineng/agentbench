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

const RADAR_COLORS = ["var(--brand)", "var(--ok)", "var(--warn)"];

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

  const th =
    "bg-surface-2 text-left font-semibold text-[11.5px] text-text-3 tracking-wide px-3 py-3 border-b border-border whitespace-nowrap cursor-pointer select-none hover:text-brand";

  return (
    <>
      {/* ---------------- leaderboard ---------------- */}
      <section id="board" className="mx-auto max-w-[1180px] px-6 my-10">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-[19px] font-bold tracking-tight">排行榜</h2>
          <span className="text-[13px] text-text-3">切换场景即切换权重，总分与排序实时重算</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setScenario(s.key);
                setCustom(null);
              }}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                s.key === scenario
                  ? "bg-brand border-brand text-primary-foreground"
                  : "bg-surface border-border-strong text-text-2 hover:border-brand-2 hover:text-brand"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="text-[12.5px] text-text-3 mt-2 mb-4">
          {current.ref} · 点击任意表头可排序，勾选右侧复选框加入雷达对比（最多 3 个）
        </p>

        {/* weight panel */}
        <div className="bg-surface border border-border rounded-xl shadow-card p-4 mb-4">
          <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
            <span className="text-[13px] font-bold">权重自定义</span>
            <span
              className={`text-[11.5px] px-2.5 py-0.5 rounded-full ${
                custom ? "bg-warn-soft text-warn font-semibold" : "bg-chip text-text-3"
              }`}
            >
              {custom ? "自定义模式" : `预设：${current.name}`}
            </span>
            <button
              onClick={() => setCustom(null)}
              className="ml-auto text-[12px] font-semibold border border-border-strong bg-surface text-text-2 px-3 py-1.5 rounded-md hover:border-brand hover:text-brand"
            >
              恢复预设
            </button>
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {DIMS.map((d) => (
              <div key={d.key} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold">{d.name}</span>
                  <span className="text-brand font-bold tabular">{weights[d.key].toFixed(1)}%</span>
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
                  className="w-full h-1 cursor-pointer accent-[var(--brand)]"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-baseline gap-3.5 mt-3.5 pt-3 border-t border-dashed border-border">
            <span className="text-[12px] font-bold text-text-2 tabular">
              原始合计 {rawSum}% → 归一化后计入总分
            </span>
            <span className="text-[12px] text-text-3">
              拖动任意滑块即进入<b className="text-text-2">自定义模式</b>；权重按占比自动归一化，不必凑满 100。
            </span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={th} onClick={() => sortBy("rank")} />
                  <th className={th} onClick={() => sortBy("name")}>
                    Agent
                  </th>
                  <th
                    className={`${th} text-right ${sortKey === "total" ? "text-brand" : ""}`}
                    onClick={() => sortBy("total")}
                  >
                    总分 {sortKey === "total" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  {DIMS.map((d) => (
                    <th
                      key={d.key}
                      className={`${th} text-right ${sortKey === d.key ? "text-brand" : ""}`}
                      onClick={() => sortBy(d.key)}
                    >
                      {d.short} {sortKey === d.key ? (sortAsc ? "▲" : "▼") : ""}
                      <span className="block text-[10px] text-text-3 font-medium opacity-80">
                        {d.key === "stability" ? "p³ 推算" : `${weights[d.key].toFixed(0)}%`}
                      </span>
                    </th>
                  ))}
                  <th className={`${th} cursor-default`}>对比</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const src = r.agent.s[scenario].src;
                  return (
                    <tr
                      key={r.agent.name}
                      className={`border-b border-border last:border-0 ${
                        picked.includes(r.agent.name) ? "bg-brand-soft" : "hover:bg-surface-2"
                      }`}
                    >
                      <td
                        className={`px-3 py-3 w-11 font-bold tabular ${i === 0 ? "text-brand" : "text-text-3"}`}
                      >
                        {i + 1}
                      </td>
                      <td className="px-3 py-3 min-w-[210px]">
                        <div className="font-semibold">
                          {r.agent.name}
                          {r.agent.demo && (
                            <span className="ml-1.5 text-[10.5px] px-1.5 py-0.5 rounded bg-warn-soft text-warn font-semibold align-middle">
                              占位
                            </span>
                          )}
                        </div>
                        <div className="text-[11.5px] text-text-3">{r.agent.vendor}</div>
                        <div className="text-[11px] text-text-3 mt-0.5">
                          {src ? (
                            <>
                              <span className="mr-1.5 px-1.5 py-0.5 rounded bg-info-soft text-info font-semibold">
                                有来源
                              </span>
                              <b className="text-info">
                                {src.label} {src.val}
                              </b>{" "}
                              · {src.by}
                            </>
                          ) : r.agent.demo ? (
                            "构造值，接入真实评测后替换"
                          ) : (
                            "该场景无公开来源，使用构造值"
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="text-[17px] font-bold tracking-tight tabular">
                          {r.total.toFixed(1)}
                        </div>
                        <div className="h-[5px] w-24 ml-auto rounded-full bg-chip overflow-hidden mt-1">
                          <i
                            className="block h-full rounded-full bg-gradient-to-r from-brand-2 to-brand"
                            style={{ width: `${r.total}%` }}
                          />
                        </div>
                      </td>
                      {DIMS.map((d) => (
                        <td key={d.key} className="px-3 py-3 text-right tabular">
                          {r.scores[d.key].toFixed(1)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`对比 ${r.agent.name}`}
                          className="w-3.5 h-3.5 cursor-pointer accent-[var(--brand)]"
                          checked={picked.includes(r.agent.name)}
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

      {/* ---------------- radar ---------------- */}
      <section id="radar" className="mx-auto max-w-[1180px] px-6 my-10">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-[19px] font-bold tracking-tight">多维对比</h2>
          <span className="text-[13px] text-text-3">勾选最多 3 个 Agent 进行雷达图对比</span>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-card grid gap-6 p-5 lg:grid-cols-[1fr_300px]">
          <Radar rows={rows.filter((r) => picked.includes(r.agent.name))} weights={weights} />
          <div className="flex flex-col gap-3.5">
            {picked.length === 0 ? (
              <>
                <div className="text-[12px] font-bold text-text-3 tracking-wide">未选择</div>
                <p className="text-[12px] text-text-3 leading-relaxed">
                  在排行榜中勾选 1–3 个 Agent，即可在此对比六个维度的能力形状。
                  <br />
                  <br />
                  <b>怎么看：</b>形状越"圆"越均衡；某个方向凹进去，就是该 Agent 的能力瓶颈所在。
                </p>
              </>
            ) : (
              <>
                <div className="text-[12px] font-bold text-text-3 tracking-wide">
                  当前场景：{current.name}
                </div>
                {rows
                  .filter((r) => picked.includes(r.agent.name))
                  .map((r, idx) => (
                    <div key={r.agent.name}>
                      <div className="flex justify-between text-[13px] pb-2 border-b border-dashed border-border">
                        <span>
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                            style={{ background: RADAR_COLORS[idx % 3] }}
                          />
                          <b>{r.agent.name}</b>
                        </span>
                        <b className="tabular">{r.total.toFixed(1)}</b>
                      </div>
                      <p className="text-[12px] text-text-3 mt-1.5 leading-relaxed">
                        {DIMS.map((d) => `${d.short} ${r.scores[d.key].toFixed(1)}`).join(" · ")}
                      </p>
                    </div>
                  ))}
                <p className="text-[12px] text-text-3 leading-relaxed border-t border-dashed border-border pt-3">
                  <b>pass³ 说明：</b>稳定性由成功率按 p³ 推算。成功率 82.7% → pass³ 仅 56.6%，
                  这就是"能跑通一次"与"每次都可靠"之间的差距。
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- import / export ---------------- */}
      <section id="data" className="mx-auto max-w-[1180px] px-6 my-10">
        <div className="bg-surface border border-border rounded-xl shadow-card p-5">
          <h3 className="text-[14.5px] font-bold mb-1">接入真实评测数据</h3>
          <p className="text-[12px] text-text-3">
            榜单当前含占位构造值。导入符合 schema 的 JSON 即可全量替换，无需改动页面代码。
          </p>
          <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
            <button
              onClick={exportJson}
              className="text-[12px] font-semibold border border-border-strong bg-surface text-text-2 px-3 py-1.5 rounded-md hover:border-brand hover:text-brand"
            >
              导出当前数据 JSON
            </button>
            <button
              onClick={exportCsv}
              className="text-[12px] font-semibold border border-border-strong bg-surface text-text-2 px-3 py-1.5 rounded-md hover:border-brand hover:text-brand"
            >
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
              className="text-[12px] font-semibold bg-brand border border-brand text-primary-foreground px-3 py-1.5 rounded-md"
            >
              导入 JSON 替换
            </button>
            {ioStatus && (
              <span className={`text-[12px] ${ioStatus.ok ? "text-ok" : "text-warn"}`}>
                {ioStatus.msg}
              </span>
            )}
          </div>
          <div className="bg-surface-2 border border-border rounded-lg px-3.5 py-3 font-mono text-[12.5px] text-text-2 mt-3 leading-loose">
            <b className="text-brand">JSON schema</b>：{"{"} name, vendor, demo, s: {"{"}{" "}
            coding|conv|os: {"{"} success, tool, progress, efficiency, trust, src:
            {"{"}label,val,by{"}"}|null {"}"} {"}"} {"}"}
            <br />
            <b className="text-brand">说明</b>：stability 无需提供（由 success 按 passᵏ=pᵏ
            推算）；src 为 null 时该条标注为「构造值」。
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
  const size = 420;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const R = 138;
  const n = DIMS.length;
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, v: number): [number, number] => [
    cx + Math.cos(ang(i)) * R * (v / 100),
    cy + Math.sin(ang(i)) * R * (v / 100),
  ];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" className="max-w-[420px] block mx-auto">
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
        const [lx, ly] = pt(i, 124);
        const anchor = Math.abs(lx - cx) < 12 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={d.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text
              x={lx}
              y={ly + 4}
              textAnchor={anchor}
              fontSize={12}
              fontWeight={600}
              fill="var(--text-2)"
            >
              {d.short}
            </text>
            <text x={lx} y={ly + 18} textAnchor={anchor} fontSize={10} fill="var(--text-3)">
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
              fillOpacity={0.12}
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
                  r={3.2}
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
