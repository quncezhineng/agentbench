/**
 * AgentBench 智衡 · 榜单数据查询与派生
 *
 * 数据库里的每一行 = 一次评测（某个智能体在某个任务类型上的一组指标）。
 * 这里把这些行聚合成榜单需要的智能体条目（LoopArena 三级 + CLI 五维）。
 */

import { queryOptions } from "@tanstack/react-query";
import { listEvalRuns, listEvalSchedule } from "./eval-runs.functions";
import type { CliDims, LoopAgent, SourceSplit } from "./agentbench-data";

export interface EvalRunRow {
  id: string;
  suite: "cli" | "looparena" | string;
  agent_name: string;
  vendor: string;
  kind: string;
  task_type: string;
  metrics: Record<string, number> | null;
  source_label: string;
  source_url: string | null;
  source_by: string;
  method: string;
  run_date: string;
  sample_size: number;
  judge: string;
  params: Record<string, unknown> | null;
  tool_log: string;
  rationale: string;
  note: string;
  created_at: string;
}

export interface ScheduleRow {
  id: string;
  agent_name: string;
  suite: string;
  planned_date: string;
  cadence: string;
  status: string;
  note: string;
}

export const runsQuery = queryOptions({
  queryKey: ["eval-runs"],
  queryFn: async () => {
    const res = await listEvalRuns();
    return (res.rows ?? []) as unknown as EvalRunRow[];
  },
});

export const scheduleQuery = queryOptions({
  queryKey: ["eval-schedule"],
  queryFn: async () => {
    const res = await listEvalSchedule();
    return (res.rows ?? []) as unknown as ScheduleRow[];
  },
});

const dims = (m: Record<string, number> | null): CliDims => ({
  success: m?.["success"] ?? 0,
  tool: m?.["tool"] ?? 0,
  progress: m?.["progress"] ?? 0,
  efficiency: m?.["efficiency"] ?? 0,
  trust: m?.["trust"] ?? 0,
});

/** 从 metrics 提取 95% 置信区间（ci_lo / ci_hi），缺失则返回 null */
const ciOf = (m: Record<string, number> | null): [number, number] | null => {
  const lo = m?.["ci_lo"];
  const hi = m?.["ci_hi"];
  return lo != null && hi != null ? [lo, hi] : null;
};

/** 从 metrics 提取来源拆分（BeyondSWE / SCBench 成功次数；样本数固定 48 / 33） */
const splitOf = (m: Record<string, number> | null): SourceSplit | null => {
  const bs = m?.["bs_success"];
  const sc = m?.["sc_success"];
  if (bs == null || sc == null) return null;
  return {
    beyondswe: { runs: 48, successes: bs },
    scbench: { runs: 33, successes: sc },
  };
};

/** 把评测记录聚合成榜单条目 */
export function deriveAgents(rows: EvalRunRow[]): LoopAgent[] {
  const map = new Map<string, LoopAgent>();

  const ensure = (r: EvalRunRow): LoopAgent => {
    const key = r.agent_name;
    let a = map.get(key);
    if (!a) {
      a = {
        name: r.agent_name,
        vendor: r.vendor,
        kind: (r.kind as LoopAgent["kind"]) ?? "product",
        demo: false,
        ...(r.note ? { note: r.note } : {}),
        r: {
          type1Acc: null,
          type1Cost: null,
          type2Ssr: null,
          type2Cost: null,
          type2Ci: null,
          type2Split: null,
          type3Ssr: null,
          type3Cost: null,
          type3Ci: null,
          type3Split: null,
          src: null,
        },
      };
      map.set(key, a);
    }
    if (r.note && !a.note) a.note = r.note;
    return a;
  };

  // 从旧到新遍历：同一智能体 + 同一任务的新评测覆盖旧评测
  const ordered = [...rows].sort((x, y) => {
    const d = x.run_date.localeCompare(y.run_date);
    return d !== 0 ? d : x.created_at.localeCompare(y.created_at);
  });

  for (const r of ordered) {
    const a = ensure(r);
    const src = { label: r.source_label, val: r.method, by: r.source_by };
    if (r.suite === "looparena") {
      if (r.task_type === "type1") {
        a.r.type1Acc = r.metrics?.["acc"] ?? null;
        a.r.type1Cost = r.metrics?.["cost"] ?? null;
      }
      if (r.task_type === "type2") {
        a.r.type2Ssr = r.metrics?.["ssr"] ?? null;
        a.r.type2Cost = r.metrics?.["cost"] ?? null;
        a.r.type2Ci = ciOf(r.metrics);
        a.r.type2Split = splitOf(r.metrics);
      }
      if (r.task_type === "type3") {
        a.r.type3Ssr = r.metrics?.["ssr"] ?? null;
        a.r.type3Cost = r.metrics?.["cost"] ?? null;
        a.r.type3Ci = ciOf(r.metrics);
        a.r.type3Split = splitOf(r.metrics);
      }
      a.r.src = src;
    } else if (r.suite === "cli") {
      const d = dims(r.metrics);
      const zero: CliDims = { success: 0, tool: 0, progress: 0, efficiency: 0, trust: 0 };
      const cur = a.cli ?? { conv: zero, os: zero, src };
      if (r.task_type === "os") cur.os = d;
      else cur.conv = d;
      cur.src = src;
      a.cli = cur;
    }
  }

  return [...map.values()];
}

/** 主榜条目（被评测 Controller 模型） */
export const controllersOf = (a: LoopAgent[]) => a.filter((x) => x.kind === "controller");
export const referencesOf = (a: LoopAgent[]) => a.filter((x) => x.kind === "reference");
export const cliAgentsOf = (a: LoopAgent[]) => a.filter((x) => x.cli);

export const TASK_LABEL: Record<string, string> = {
  conv: "多轮对话任务",
  os: "研究与操作任务",
  type1: "Type I · 合同选择",
  type2: "Type II · 任务切片",
  type3: "Type III · 完整任务",
};

export const SUITE_LABEL: Record<string, string> = {
  cli: "CLI 实测套件 v0",
  looparena: "LoopArena",
};
