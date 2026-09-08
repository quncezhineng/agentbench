/**
 * AgentBench 智衡 · 编程智能体榜单数据模型（LoopArena 口径）
 *
 * 说明：
 * - 本模块只定义「LoopArena 三级评测」的数据结构、论文种子数据与排序/展示辅助函数；
 * - 榜单只面向「编程智能体」：被评测对象是作为 Controller 的模型，Worker 固定为
 *   Qwen3.7-Plus（论文口径），Reporter 复用 Worker 同款模型配置；
 * - 三个评测档位：Type I（合同选择，无 Worker 执行）/ Type II（任务切片）/ Type III（完整任务）；
 * - 种子数据来自论文 Table 2（arXiv 2608.28281），并额外补充若干主流编程智能体产品
 *   作为「待评测」占位条目（demo = true，无 LoopArena 分数）。
 */

/* ============================================================ */
/* 类型与常量                                                    */
/* ============================================================ */

/** 来源标注：某个分数的出处与口径 */
export interface Src {
  label: string;
  val: string;
  by: string;
}

/**
 * LoopArena 三级结果。
 * - type1Acc：Type I 合同准确率（Contract Accuracy，0–100）
 * - type2Ssr / type3Ssr：Type II / Type III 严格成功率（Strict Success Rate，0–100）
 * - type2Cost / type3Cost：Type II / Type III 平均估算推理成本（$/run，无缓存口径）
 * 参考策略（No control / Fixed control）没有 Type I 分数，对应字段为 null。
 */
export interface LoopResult {
  type1Acc: number | null;
  type2Ssr: number | null;
  type2Cost: number | null;
  type3Ssr: number | null;
  type3Cost: number | null;
  src: Src | null;
}

/** 条目类别：被评测模型 / 参考策略（不参与排名）/ 编程智能体产品（待评测） */
export type LoopAgentKind = "controller" | "reference" | "product";

export interface LoopAgent {
  name: string;
  vendor: string;
  kind: LoopAgentKind;
  /** true = 占位 / 待评测（无真实 LoopArena 分数） */
  demo: boolean;
  /** 补充说明（可选，展示在详情或榜单行内） */
  note?: string;
  r: LoopResult;
}

/** 论文数据快照日期（榜单右上角 chip 展示用） */
export const PAPER_SRC: Src = {
  label: "LoopArena",
  val: "Table 2 · Type I / II / III",
  by: "arXiv 2608.28281 · 2026-08",
};

/** 参考策略来源（不参与 Controller 排名） */
export const REF_SRC: Src = {
  label: "LoopArena 参考策略",
  val: "Table 2 · No control / Fixed control",
  by: "arXiv 2608.28281 · 2026-08",
};

const empty = (): LoopResult => ({
  type1Acc: null,
  type2Ssr: null,
  type2Cost: null,
  type3Ssr: null,
  type3Cost: null,
  src: null,
});

/* ============================================================ */
/* 种子数据：论文 Table 2 的 5 个 Controller + 2 个参考策略        */
/* ============================================================ */

export const AGENTS: LoopAgent[] = [
  {
    name: "GPT-5.5",
    vendor: "OpenAI",
    kind: "controller",
    demo: false,
    note: "gpt-5.5-0424-global · 厂商默认思考",
    r: {
      type1Acc: 87.78,
      type2Ssr: 51.85,
      type2Cost: 5.0,
      type3Ssr: 24.69,
      type3Cost: 18.84,
      src: PAPER_SRC,
    },
  },
  {
    name: "Claude Opus 4.8",
    vendor: "Anthropic",
    kind: "controller",
    demo: false,
    note: "claude-opus-4-8 · 厂商默认思考",
    r: {
      type1Acc: 76.67,
      type2Ssr: 48.15,
      type2Cost: 5.87,
      type3Ssr: 20.99,
      type3Cost: 16.82,
      src: PAPER_SRC,
    },
  },
  {
    name: "Qwen3.7-Plus",
    vendor: "阿里云",
    kind: "controller",
    demo: false,
    note: "temperature 0 · 20,480 输出 token",
    r: {
      type1Acc: 72.22,
      type2Ssr: 48.15,
      type2Cost: 4.3,
      type3Ssr: 23.46,
      type3Cost: 6.89,
      src: PAPER_SRC,
    },
  },
  {
    name: "DeepSeek-V4-Flash-0731",
    vendor: "深度求索",
    kind: "controller",
    demo: false,
    note: "temperature 0 · 20,480 输出 token",
    r: {
      type1Acc: 77.78,
      type2Ssr: 45.68,
      type2Cost: 2.1,
      type3Ssr: 19.75,
      type3Cost: 10.24,
      src: PAPER_SRC,
    },
  },
  {
    name: "GLM 5.2",
    vendor: "智谱",
    kind: "controller",
    demo: false,
    note: "temperature 0 · 20,480 输出 token",
    r: {
      type1Acc: 74.44,
      type2Ssr: 37.04,
      type2Cost: 1.63,
      type3Ssr: 16.05,
      type3Cost: 4.86,
      src: PAPER_SRC,
    },
  },
  {
    name: "Fixed control",
    vendor: "基准策略",
    kind: "reference",
    demo: false,
    note: "不读取 Evidence Packet，重复重申任务目标",
    r: {
      type1Acc: null,
      type2Ssr: 46.91,
      type2Cost: 1.08,
      type3Ssr: 18.52,
      type3Cost: 5.58,
      src: REF_SRC,
    },
  },
  {
    name: "No control",
    vendor: "基准策略",
    kind: "reference",
    demo: false,
    note: "无 Controller，Worker 直接自主执行",
    r: {
      type1Acc: null,
      type2Ssr: 39.51,
      type2Cost: 1.04,
      type3Ssr: 18.52,
      type3Cost: 2.01,
      src: REF_SRC,
    },
  },
];

/* ============================================================ */
/* 额外补充：主流编程智能体产品（占位 / 待评测）                    */
/* ============================================================ */

const product = (name: string, vendor: string, note?: string): LoopAgent => ({
  name,
  vendor,
  kind: "product",
  demo: true,
  ...(note !== undefined ? { note } : {}),
  r: empty(),
});

export const PRODUCTS: LoopAgent[] = [
  product("Claude Code", "Anthropic", "CLI 编码代理"),
  product("Codex", "OpenAI", "CLI / IDE 编码代理"),
  product("Cursor", "Anysphere", "AI 编程 IDE"),
  product("Gemini CLI", "Google", "CLI 编码代理"),
  product("Devin", "Cognition", "自主编码代理"),
  product("Windsurf", "Codeium", "AI 编程 IDE"),
  product("Aider", "开源", "终端结对编程工具"),
  product("OpenCode", "opencode", "开源 CLI 编码代理"),
  product("Trae", "ByteDance", "AI 编程 IDE"),
];

/* ============================================================ */
/* 派生与排序 / 展示辅助                                          */
/* ============================================================ */

/** 被评测的 Controller 模型（参与排名） */
export const CONTROLLERS: LoopAgent[] = AGENTS.filter((a) => a.kind === "controller");

/** 参考策略（不参与 Controller 排名，仅作对照） */
export const REFERENCES: LoopAgent[] = AGENTS.filter((a) => a.kind === "reference");

/** 完整榜单顺序：Controller（按 Type III SSR 降序）→ 参考策略 → 待评测产品 */
export function rankedAgents(): LoopAgent[] {
  const byType3 = (a: LoopAgent, b: LoopAgent) =>
    (b.r.type3Ssr ?? -1) - (a.r.type3Ssr ?? -1);
  return [...CONTROLLERS].sort(byType3).concat(REFERENCES, PRODUCTS);
}

export const kindLabel: Record<LoopAgentKind, string> = {
  controller: "被评测模型",
  reference: "参考策略",
  product: "待评测产品",
};

/** 数值格式化：0–100 百分比（null → 占位符） */
export const fmtPct = (x: number | null, digits = 2) =>
  x == null ? "—" : `${x.toFixed(digits)}%`;

/** 成本格式化：$/run（null → 占位符） */
export const fmtCost = (x: number | null) => (x == null ? "—" : `$${x.toFixed(2)}`);
