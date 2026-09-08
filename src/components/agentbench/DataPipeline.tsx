/**
 * AgentBench 智衡 · 数据接入（Data Pipeline）—— 迁移自原 /board 底部区块，现归属自动化评测页 /eval。
 *
 * 说明：
 * - 本区块是“榜单数据入库”的唯一入口：自动化评测跑分结果的「并入」按钮在报告区，
 *   而外部评测数据（下载/拷贝得到的 JSON）在这里整体替换；
 * - 数据统一保存在浏览器 localStorage（见 @/lib/leaderboard-store），/board 打开即读最新；
 * - 「导入 JSON 替换」沿用全量替换语义：数组内每条需至少有 name 与一个已评测场景。
 */

import { useRef, useState } from "react";
import {
  DIMS,
  SCENARIOS,
  hasScenario,
  normalizeWeights,
  scoresOf,
  totalOf,
  type Agent,
  type ScenarioKey,
} from "@/lib/agentbench-data";
import { SNAPSHOT_DATE, saveAgents, useLeaderboardSnapshot } from "@/lib/leaderboard-store";

/* ---------- 小工具 ---------- */

const download = (filename: string, text: string, mime: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const SCHEMA = `{
  "name":   "Agent 名称（必填）",
  "vendor": "厂商",
  "demo":   true | false,          // true = 占位示例，标注「构造值」
  "s": {
    "coding" | "conv" | "os": {    // 至少提供 1 个已评测场景，可局部导入
      "success":    0–100,         // 任务成功率
      "tool":       0–100,         // 工具调用准确率
      "progress":   0–100,         // 进度率
      "efficiency": 0–100,         // 效率
      "trust":      0–100,         // 可信与安全
      "src": { "label": "基准名", "val": "分数口径", "by": "发布方" } | null
    }
  }
}`;

/** 校验一条导入记录：name 必填、至少一个已评测场景、数值字段合法 */
function validateRecord(a: Agent, i: number) {
  if (!a.name) throw new Error(`第 ${i + 1} 条缺少 name`);
  if (!a.s || typeof a.s !== "object") throw new Error(`第 ${i + 1} 条缺少 s`);
  const known = new Set<string>(SCENARIOS.map((s) => s.key));
  const NUM_FIELDS = ["success", "tool", "progress", "efficiency", "trust"] as const;
  const keys = (Object.keys(a.s) as ScenarioKey[]).filter((k) => known.has(k) && Boolean(a.s[k]));
  if (keys.length === 0)
    throw new Error(
      `${a.name || `第 ${i + 1} 条`} 没有任何已评测场景（至少需要 coding / conv / os 之一）`,
    );
  keys.forEach((k) => {
    const sc = a.s[k];
    if (!sc) return;
    NUM_FIELDS.forEach((f) => {
      if (typeof sc[f] !== "number") throw new Error(`${a.name}/${k} 的 ${f} 必须是数字`);
    });
  });
}

export function DataPipeline() {
  const { agents, updatedAt } = useLeaderboardSnapshot();
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const covered = SCENARIOS.filter((s) => agents.some((a) => hasScenario(a, s.key)))
    .map((s) => s.name)
    .join(" / ");

  const exportJson = () => {
    download("agentbench-data.json", JSON.stringify(agents, null, 2), "application/json");
    setStatus({ msg: "已导出当前数据 JSON", ok: true });
  };

  /** 全场景 CSV：按 Agent × 已评测场景展开，总分用该场景预设权重 */
  const exportCsv = () => {
    const head = ["Agent", "厂商", "场景", "总分", ...DIMS.map((d) => d.name)];
    const body: (string | number)[][] = [];
    for (const a of agents) {
      for (const s of SCENARIOS) {
        if (!hasScenario(a, s.key)) continue;
        const scores = scoresOf(a, s.key);
        const weights = normalizeWeights(s.weights);
        body.push([
          a.name,
          a.vendor,
          s.name,
          totalOf(scores, weights).toFixed(2),
          ...DIMS.map((d) => scores[d.key].toFixed(2)),
        ]);
      }
    }
    const csv = [head, ...body].map((line) => line.join(",")).join("\n");
    download(`agentbench-data-${updatedAt}.csv`, "\uFEFF" + csv, "text/csv");
    setStatus({ msg: "已导出全场景 CSV", ok: true });
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("根节点必须是数组");
        if (data.length === 0) throw new Error("数组为空，没有可导入的数据");
        data.forEach((a: Agent, i: number) => validateRecord(a, i));
        saveAgents(data as Agent[]);
        setStatus({ msg: `导入成功：${data.length} 条数据已替换榜单（保存在本浏览器）`, ok: true });
      } catch (err) {
        setStatus({ msg: "导入失败：" + (err as Error).message, ok: false });
      }
    };
    reader.readAsText(file);
  };

  return (
    <section id="data" className="ab-container ab-section">
      <div className="ab-section-head">
        <div>
          <div className="ab-chip ab-chip-brand mb-3">Data Pipeline</div>
          <h2 className="ab-section-title">接入真实评测数据</h2>
          <p className="ab-section-desc mt-2">
            在上方跑完自动化评测后点击「并入榜单数据」即入库；也可在此导入符合 schema 的 JSON
            整体替换榜单。数据自动保存在本浏览器，打开排行榜页即为最新。
          </p>
        </div>
      </div>

      <div className="ab-panel bg-white p-5 sm:p-6">
        {/* 当前榜单状态 */}
        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-border bg-surface-2/60 px-4 py-2.5 text-[12px] text-text-3">
          <span>
            当前共 <b className="metric text-text-2">{agents.length}</b> 条 Agent 记录
          </span>
          <span>
            覆盖场景：<b className="text-text-2">{covered || "（暂无）"}</b>
          </span>
          <span>
            快照日期：<b className="metric text-text-2">{updatedAt || SNAPSHOT_DATE}</b>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={exportJson} className="ab-button ab-button-secondary">
            导出当前数据 JSON
          </button>
          <button onClick={exportCsv} className="ab-button ab-button-secondary">
            导出全场景 CSV
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
          <button onClick={() => fileRef.current?.click()} className="ab-button ab-button-primary">
            导入 JSON 替换
          </button>
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ${
                status.ok ? "bg-ok-soft text-ok" : "bg-risk-soft text-risk"
              }`}
            >
              {status.ok && <span className="ab-dot" />}
              {status.msg}
            </span>
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-surface-2/80 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
            JSON schema · 字段说明
          </div>
          <div className="overflow-x-auto bg-surface-2/40 px-4 py-3 font-mono text-[12px] leading-6">
            <pre className="whitespace-pre">{SCHEMA}</pre>
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
  );
}
