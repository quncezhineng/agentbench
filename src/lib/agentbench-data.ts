export type DimKey = "success" | "stability" | "tool" | "progress" | "efficiency" | "trust";

export type ScenarioKey = "coding" | "conv" | "os";

export interface Dim {
  key: DimKey;
  name: string;
  short: string;
  grader: "code" | "model";
  derived?: boolean;
  desc: string;
}

export const DIMS: Dim[] = [
  {
    key: "success",
    name: "任务成功率",
    short: "成功率",
    grader: "code",
    desc: 'pass@1：单次运行即达成终态目标的比例，衡量"能不能跑通"。',
  },
  {
    key: "stability",
    name: "稳定性 passᵏ",
    short: "pass³",
    grader: "code",
    derived: true,
    desc: "k=3 时连续三次全部成功的概率（passᵏ=pᵏ）。面向用户的 Agent 尤其看重这一项。",
  },
  {
    key: "tool",
    name: "工具调用准确率",
    short: "工具",
    grader: "code",
    desc: "Tool / Grounding Accuracy：API 选择、参数提取、冗余与错误调用控制的综合正确率。",
  },
  {
    key: "progress",
    name: "进度率",
    short: "进度率",
    grader: "model",
    desc: '多步任务中已完成子目标占比，用于区分"差一点"与"完全没动"。',
  },
  {
    key: "efficiency",
    name: "效率",
    short: "效率",
    grader: "code",
    desc: "交互轮数、Token 消耗与端到端延迟的归一化得分。",
  },
  {
    key: "trust",
    name: "可信与安全",
    short: "可信",
    grader: "model",
    desc: "幻觉率、领域规则合规率、偏见率的反向综合。",
  },
];

export type Weights = Record<DimKey, number>;

export interface Scenario {
  key: ScenarioKey;
  name: string;
  ref: string;
  weights: Weights;
}

export const SCENARIOS: Scenario[] = [
  {
    key: "coding",
    name: "编码智能体",
    ref: "参考基准：Terminal-Bench 2.0 / SWE-bench Verified / Expert-SWE",
    weights: { success: 35, stability: 20, tool: 25, progress: 10, efficiency: 5, trust: 5 },
  },
  {
    key: "conv",
    name: "对话智能体",
    ref: "参考基准：τ-bench / τ²-Bench · 模拟用户多轮交互",
    weights: { success: 25, stability: 30, tool: 15, progress: 10, efficiency: 15, trust: 5 },
  },
  {
    key: "os",
    name: "研究与操作智能体",
    ref: "参考基准：GAIA / WebArena / OSWorld-Verified / GDPval",
    weights: { success: 25, stability: 20, tool: 25, progress: 20, efficiency: 5, trust: 5 },
  },
];

export interface Src {
  label: string;
  val: string;
  by: string;
}

export interface ScenarioScore {
  success: number;
  tool: number;
  progress: number;
  efficiency: number;
  trust: number;
  src: Src | null;
}

export interface Agent {
  name: string;
  vendor: string;
  demo: boolean;
  s: Record<ScenarioKey, ScenarioScore>;
}

export const AGENTS: Agent[] = [
  {
    name: "GPT-5.5",
    vendor: "OpenAI",
    demo: false,
    s: {
      coding: {
        success: 82.7,
        tool: 91,
        progress: 85,
        efficiency: 76,
        trust: 88,
        src: { label: "Terminal-Bench 2.0", val: "82.7%", by: "OpenAI 2026-04-23 发布表" },
      },
      conv: {
        success: 84.9,
        tool: 87,
        progress: 82,
        efficiency: 79,
        trust: 86,
        src: { label: "GDPval", val: "84.9%", by: "OpenAI 2026-04-23 发布表" },
      },
      os: {
        success: 78.7,
        tool: 89,
        progress: 83,
        efficiency: 74,
        trust: 85,
        src: { label: "OSWorld-Verified", val: "78.7%", by: "OpenAI 2026-04-23 发布表" },
      },
    },
  },
  {
    name: "Claude Opus 4.7",
    vendor: "Anthropic",
    demo: false,
    s: {
      coding: {
        success: 69.4,
        tool: 86,
        progress: 78,
        efficiency: 72,
        trust: 90,
        src: { label: "Terminal-Bench 2.0", val: "69.4%", by: "OpenAI 2026-04-23 发布表" },
      },
      conv: {
        success: 80.3,
        tool: 85,
        progress: 80,
        efficiency: 81,
        trust: 91,
        src: { label: "GDPval", val: "80.3%", by: "OpenAI 2026-04-23 发布表" },
      },
      os: {
        success: 78.0,
        tool: 88,
        progress: 82,
        efficiency: 77,
        trust: 89,
        src: { label: "OSWorld-Verified", val: "78.0%", by: "OpenAI 2026-04-23 发布表" },
      },
    },
  },
  {
    name: "Gemini 3.1 Pro",
    vendor: "Google",
    demo: false,
    s: {
      coding: {
        success: 68.5,
        tool: 84,
        progress: 76,
        efficiency: 80,
        trust: 84,
        src: { label: "Terminal-Bench 2.0", val: "68.5%", by: "OpenAI 2026-04-23 发布表" },
      },
      conv: { success: 76.0, tool: 82, progress: 75, efficiency: 83, trust: 83, src: null },
      os: { success: 72.0, tool: 83, progress: 77, efficiency: 81, trust: 82, src: null },
    },
  },
  {
    name: "GPT-5.4",
    vendor: "OpenAI",
    demo: false,
    s: {
      coding: {
        success: 68.5,
        tool: 83,
        progress: 74,
        efficiency: 71,
        trust: 85,
        src: { label: "Expert-SWE", val: "68.5%", by: "不同基准，口径与 Terminal-Bench 不同" },
      },
      conv: { success: 75.0, tool: 81, progress: 74, efficiency: 73, trust: 84, src: null },
      os: { success: 70.0, tool: 82, progress: 73, efficiency: 70, trust: 83, src: null },
    },
  },
  {
    name: "Deep Agents CLI",
    vendor: "LangChain",
    demo: false,
    s: {
      coding: {
        success: 66.5,
        tool: 88,
        progress: 80,
        efficiency: 85,
        trust: 82,
        src: {
          label: "Terminal-Bench 2.0",
          val: "66.5%",
          by: "Harness 级编排优化：52.8 → 66.5（未换模型）",
        },
      },
      conv: { success: 70.0, tool: 80, progress: 72, efficiency: 86, trust: 80, src: null },
      os: { success: 64.0, tool: 79, progress: 71, efficiency: 84, trust: 79, src: null },
    },
  },
];

export const K = 3;
export const passK = (p: number) => Math.pow(p / 100, K) * 100;

export type Scores = Record<DimKey, number>;

export function scoresOf(agent: Agent, scenarioKey: ScenarioKey): Scores {
  const raw = agent.s[scenarioKey];
  return {
    success: raw.success,
    stability: passK(raw.success),
    tool: raw.tool,
    progress: raw.progress,
    efficiency: raw.efficiency,
    trust: raw.trust,
  };
}

export function totalOf(scores: Scores, weights: Weights) {
  return DIMS.reduce((sum, d) => sum + (scores[d.key] * weights[d.key]) / 100, 0);
}

export function normalizeWeights(w: Weights): Weights {
  const sum = DIMS.reduce((a, d) => a + (w[d.key] || 0), 0);
  const out = {} as Weights;
  DIMS.forEach((d) => {
    out[d.key] = sum ? ((w[d.key] || 0) * 100) / sum : 100 / DIMS.length;
  });
  return out;
}

export const AUDIT = [
  {
    bench: "SWE-bench Verified",
    type: "编码",
    ver: "Verified（人工清洗版）",
    st: "risk",
    stText: "已退化",
    note: "OpenAI 2026-02-23 专文指出其不再能衡量前沿编码能力。人工清洗是一次性的，饱和与污染是持续的。",
    action: "不再作为上线决策的唯一依据",
  },
  {
    bench: "Terminal-Bench 2.0",
    type: "编码",
    ver: "2.0 · 快照 2026-04-23",
    st: "none",
    stText: "未见公开审计",
    note: "发布方口径的 dated snapshot，harness 影响显著——LangChain 仅靠 Harness 级优化就从 52.8 提到 66.5（未换模型）。",
    action: "引用时标注 harness 版本",
  },
  {
    bench: "Expert-SWE",
    type: "编码",
    ver: "快照 2026-04-23",
    st: "none",
    stText: "未见公开审计",
    note: "长程软件工程，中位人类完成时间约 20 小时。口径与 Terminal-Bench 不同。",
    action: "勿与 Terminal-Bench 分数并列横评",
  },
  {
    bench: "OSWorld-Verified",
    type: "操作",
    ver: "Verified · 快照 2026-04-23",
    st: "none",
    stText: "未见公开审计",
    note: "真实桌面 OS 环境，跨应用工作流，分数受环境配置影响大。",
    action: "固定环境镜像后复现",
  },
  {
    bench: "GDPval",
    type: "知识工作",
    ver: "快照 2026-04-23",
    st: "none",
    stText: "未见公开审计",
    note: "跨 44 个职业领域，任务偏主观，评分为模型评审口径。",
    action: "需人工抽样校准后再用",
  },
  {
    bench: "τ-bench / τ²-Bench",
    type: "对话",
    ver: "2024 / τ² 2025（arXiv 2506.07982）",
    st: "ok",
    stText: "方法学公开",
    note: "τ² 引入双控制（Dec-POMDP），失败可归因为推理错误 / 沟通协调错误两类。",
    action: "对话类主基准",
  },
] as const;

export const DEFECTS = [
  {
    t: "判分过严",
    d: "隐藏测试要求的实现方式过于具体，功能正确的提交被判失败",
    e: "低估",
    tone: "warn",
  },
  { t: "提示词欠定义", d: "任务描述没说清隐藏测试实际强制的要求", e: "低估", tone: "warn" },
  { t: "提示词误导", d: "任务描述把解题方向指偏了", e: "低估", tone: "warn" },
  { t: "测试覆盖不足", d: "测试没有真正检查所要求的功能", e: "高估", tone: "risk" },
] as const;
