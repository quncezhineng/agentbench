/**
 * AgentBench 智衡 · 榜单数据共享（LoopArena 口径）
 *
 * 职责：为 /board 排行榜与 /agents/$name 详情页提供同一份「编程智能体」榜单快照。
 * 本次重构后榜单改为「论文 Table 2 真实结果 + 额外补充的待评测产品」的策展数据，
 * 不再有本地跑分入库 / JSON 导入，因此这里不再读写 localStorage，直接返回种子快照。
 */

import { AGENTS as SEED_AGENTS, type LoopAgent } from "./agentbench-data";

/** 榜单快照日期（/board 右上角 chip 展示用） */
export const SNAPSHOT_DATE = "2026-08";

export interface LeaderboardSnapshot {
  /** 快照日期（仅用于展示） */
  updatedAt: string;
  agents: LoopAgent[];
}

const SNAPSHOT: LeaderboardSnapshot = {
  updatedAt: SNAPSHOT_DATE,
  agents: SEED_AGENTS,
};

/** React Hook：读取当前榜单快照（策展数据，直接返回常量即可，SSR 安全） */
export function useLeaderboardSnapshot(): LeaderboardSnapshot {
  return SNAPSHOT;
}
