/**
 * AgentBench 智衡 · 榜单数据本地持久化（跨页共享）
 *
 * 职责：让「自动化评测（/eval）」产出/导入的榜单数据能被「排行榜（/board）」
 * 立刻看到。数据只保存在浏览器 localStorage，不改动任何种子代码。
 *
 * 约定：
 * - 无任何写入时回退到内置种子数据（AGENTS），保证首访与 SSR 一致；
 * - 所有 React 侧读取走 useLeaderboardSnapshot（首帧=种子，挂载后与本地同步，
 *   避免 hydration 不一致）；
 * - 评测结果默认「按 Agent 名称并入/更新」现有榜单（mergeAgents），保留其它条目；
 *   手动「导入 JSON 替换」则是整体替换（saveAgents 直接覆盖）。
 */

import { useEffect, useState } from "react";
import { AGENTS as SEED_AGENTS, type Agent } from "./agentbench-data";

/** localStorage 键：当前生效的榜单快照 */
export const LEADERBOARD_KEY = "ab:leaderboard:v1";

/** 种子数据快照日期（/board 右上角 chip 展示用） */
export const SNAPSHOT_DATE = "2026-04-23";

export interface LeaderboardSnapshot {
  /** 快照日期（ISO YYYY-MM-DD，仅用于展示） */
  updatedAt: string;
  agents: Agent[];
}

const seedSnapshot = (): LeaderboardSnapshot => ({
  updatedAt: SNAPSHOT_DATE,
  agents: SEED_AGENTS,
});

/** 读取 localStorage（仅客户端调用） */
function readStored(): LeaderboardSnapshot | null {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<LeaderboardSnapshot>;
    if (!Array.isArray(p?.agents)) return null;
    return {
      updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : SNAPSHOT_DATE,
      agents: p.agents as Agent[],
    };
  } catch {
    return null;
  }
}

let cache: LeaderboardSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

/** 取当前快照（无本地数据时回退种子） */
export function loadSnapshot(): LeaderboardSnapshot {
  if (cache) return cache;
  cache = readStored() ?? seedSnapshot();
  return cache;
}

/** 整体替换榜单并持久化（手动「导入 JSON 替换」/ 需要覆盖时使用） */
export function saveAgents(agents: Agent[]): LeaderboardSnapshot {
  const snap: LeaderboardSnapshot = {
    updatedAt: new Date().toISOString().slice(0, 10),
    agents,
  };
  cache = snap;
  try {
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(snap));
  } catch {
    // localStorage 不可用（隐私模式等）：仅本次会话内存生效
  }
  emit();
  return snap;
}

/** 合并：把 incoming 按 name 并入 base（同名更新、新名追加），返回新数组（不修改入参） */
export function mergeAgents(base: Agent[], incoming: Agent[]): Agent[] {
  const out = base.slice();
  for (const inc of incoming) {
    const idx = out.findIndex((a) => a.name === inc.name);
    if (idx >= 0) out[idx] = inc;
    else out.push(inc);
  }
  return out;
}

/** 订阅榜单变化（跨组件/跨页通知） */
export function subscribeSnapshot(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * React Hook：读取当前榜单。
 * 首帧渲染使用种子（SSR 与首刷一致），挂载后与本地数据同步并订阅变化。
 */
export function useLeaderboardSnapshot(): LeaderboardSnapshot {
  const [snap, setSnap] = useState<LeaderboardSnapshot>(seedSnapshot);
  useEffect(() => {
    const update = () => setSnap(loadSnapshot());
    update();
    return subscribeSnapshot(update);
  }, []);
  return snap;
}
