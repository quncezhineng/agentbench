/**
 * AgentBench 智衡 · 榜单数据共享
 *
 * 数据源已迁移到数据库（eval_runs 表）：/board 与 /agents/$name 都读同一份
 * 「已审核」的评测记录，页面无需再改数据文件。
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { deriveAgents, runsQuery } from "./eval-queries";
import type { LoopAgent } from "./agentbench-data";
import { PRODUCTS } from "./agentbench-data";

export interface LeaderboardSnapshot {
  /** 最近一次评测日期 */
  updatedAt: string;
  agents: LoopAgent[];
}

/** React Hook：读取当前榜单快照（来自数据库，实时刷新） */
export function useLeaderboardSnapshot(): LeaderboardSnapshot {
  const { data: rows } = useSuspenseQuery(runsQuery);
  const agents = deriveAgents(rows);
  const known = new Set(agents.map((a) => a.name));
  const pending = PRODUCTS.filter((p) => !known.has(p.name));
  const updatedAt = rows[0]?.run_date ?? "—";
  return { updatedAt, agents: agents.concat(pending) };
}
