import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "AgentBench 智衡 · LoopArena 对比 SWE-bench";
const DESC =
  "LoopArena 与 SWE-bench 对比：SWE-bench 用 2,294 个真实 GitHub issue 端到端测「整体能不能修好」；LoopArena 用 Controller / Worker 分离 + Evidence Packet + Loop Contract，把「控制能力」单独拆出来，配 Type I / II / III 三级评测、严格成功率（SSR）与估算成本。";
const BASE_URL = "https://getagentbench.lovable.app";

export const Route = createFileRoute("/compare/swe-bench")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${BASE_URL}/compare/swe-bench` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/compare/swe-bench` }],
  }),

  component: CompareSweBench,
});

const NAV = [
  { href: "#tldr", label: "一句话结论" },
  { href: "#table", label: "逐项对比" },
  { href: "#isolate", label: "能力隔离" },
  { href: "#choose", label: "怎么选" },
  { href: "#sources", label: "参考来源" },
];

// 逐项对比表：左列维度，中列 SWE-bench（公开论文口径），右列 LoopArena（本站口径）
const ROWS: Array<[string, string, string]> = [
  [
    "提出方 / 时间",
    "普林斯顿大学团队，2023 年 10 月（arXiv 2310.06770）",
    "LoopArena 论文（arXiv 2608.28281）",
  ],
  [
    "任务来源",
    "12 个流行 Python 开源仓库的 2,294 个真实 GitHub issue；Verified 版为 OpenAI 人工筛选的 500 条子集（2024 年 8 月）",
    "编程任务经任务切片器拆解，以 Loop Contract 分片下发给 Worker 执行",
  ],
  [
    "被评测对象",
    "Agent 系统整体（模型 + scaffold 混合，不区分谁在做决策、谁在执行）",
    "Controller 只决策、Worker 只动手；固定 Worker（Qwen3.7-Plus）后分数差只反映控制能力",
  ],
  [
    "任务接口",
    "issue 描述 + 代码仓库快照，Agent 自由探索并产出补丁",
    "Evidence Packet（证据包）+ Loop Contract（循环合同）：Controller 必须显式选择合同并给出验收条件",
  ],
  [
    "评测方式",
    "应用补丁后运行仓库测试（FAIL_TO_PASS + PASS_TO_PASS），二值判定",
    "Type I 合同选择 / Type II 任务切片 / Type III 完整任务三级评测，成本递减逼近同一结论",
  ],
  [
    "核心指标",
    "% Resolved（解决率）",
    "严格成功率（SSR）+ 估算推理成本（$/run），排名一致性 Spearman ρ 0.9747",
  ],
  [
    "对 scaffold 的敏感度",
    "高：同一模型换 scaffold（Agent 框架）后排名可能明显变化，难以归因",
    "低：Worker 与执行环境统一固定，差异可归因到 Controller 的决策能力",
  ],
  [
    "回答的问题",
    "这套 Agent 系统整体能不能把真实 issue 修好？",
    "Agent 的「控制能力」（拆解、选合同、验收、纠偏）本身有多强？",
  ],
];

// 三级档位卡片
const TIERS = [
  {
    k: "Type I",
    t: "合同选择",
    d: "给 Evidence Packet，Controller 从候选 Loop Contract 中选正确的一份。秒级出分，成本最低。",
  },
  {
    k: "Type II",
    t: "任务切片",
    d: "Controller 按选定的 Loop Contract 指挥固定 Worker 完成单个任务切片，测单步控制质量。",
  },
  {
    k: "Type III",
    t: "完整任务",
    d: "从零跑完整个编码任务，按严格成功率（SSR）计分——本站主榜即按 Type III SSR 排名。",
  },
];

function CompareSweBench() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={NAV} cta={{ href: "/board", label: "查看排行榜" }} />

      <main>
        {/* ---------- 首屏：定位 ---------- */}
        <section className="ab-container ab-section pt-8 sm:pt-10" id="tldr">
          <div className="ab-panel ab-grid-bg px-5 py-7 sm:px-8 sm:py-9">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="ab-chip ab-chip-brand">基准对比</span>
              <span className="ab-chip">LoopArena × SWE-bench</span>
            </div>
            <h1 className="text-[30px] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[40px]">
              SWE-bench 测「整体行不行」，
              <br />
              <span className="text-brand">LoopArena 把「控制能力」单独拆出来测</span>
            </h1>
            <p className="mt-4 max-w-[720px] text-[15px] leading-7 text-text-2 sm:text-[16px]">
              SWE-bench 是编程智能体领域使用最广的基准：给 Agent 一个真实 GitHub issue 和仓库快照，
              让它产出补丁，然后跑仓库测试看问题是否被解决。它回答的是「整套系统端到端行不行」，
              但<b className="text-foreground">无法区分功劳属于模型、还是属于外围 scaffold</b>。
              LoopArena 的核心差异在于<b className="text-foreground">把 Controller（决策）与 Worker（执行）分开</b>：
              固定同一个 Worker 后，不同 Controller 之间的分数差只反映控制能力的差异。
              两个基准并不矛盾——SWE-bench 适合验收系统整体，LoopArena 适合定位「控制」这一层的强弱。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/board" className="ab-button ab-button-primary">
                查看 LoopArena 排行榜
              </a>
              <a href="/eval" className="ab-button ab-button-secondary">
                LoopArena 机制详解
              </a>
              <a href="#table" className="ab-button ab-button-ghost">
                看逐项对比
              </a>
            </div>
          </div>
        </section>

        {/* ---------- 逐项对比表 ---------- */}
        <section className="ab-container ab-section" id="table">
          <div className="mb-5">
            <span className="ab-chip ab-chip-brand">逐项对比</span>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] sm:text-[28px]">
              两个基准，两种测量目标
            </h2>
            <p className="mt-2 max-w-[680px] text-[14px] leading-6 text-text-2">
              下表按双方公开论文的口径整理：左列为对比维度，中列为 SWE-bench（含 Verified 子集），右列为 LoopArena。
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-white/85 shadow-[var(--metric-shadow)]">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-2/90">
                  <th className="px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">
                    维度
                  </th>
                  <th className="px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">
                    SWE-bench
                  </th>
                  <th className="px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.06em] text-brand">
                    LoopArena
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([dim, swe, loop]) => (
                  <tr key={dim} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3.5 align-top font-semibold">{dim}</td>
                    <td className="px-4 py-3.5 align-top leading-6 text-text-2">{swe}</td>
                    <td className="px-4 py-3.5 align-top leading-6 text-text-2">{loop}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- 能力隔离：LoopArena 的独特卖点 ---------- */}
        <section className="ab-container ab-section" id="isolate">
          <div className="ab-panel px-5 py-7 sm:px-8 sm:py-9">
            <span className="ab-chip ab-chip-brand">能力隔离</span>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] sm:text-[28px]">
              为什么「拆开测」重要
            </h2>
            <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-text-2">
              在端到端基准里，一次失败可能是模型判断力不行，也可能只是工具封装或提示词脚手架的问题——
              分数本身不会告诉你。LoopArena 用
              <b className="text-foreground"> Evidence Packet（证据包）</b>统一信息输入、用
              <b className="text-foreground"> Loop Contract（循环合同）</b>统一任务下发与验收，
              再把 Worker 固定为同一模型，让「控制」成为唯一变量。
              三级评测让预算不同的团队都能参与：从秒级的合同选择，到完整任务的严格成功率。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {TIERS.map((t) => (
                <div key={t.k} className="rounded-2xl border border-border bg-white/70 px-4 py-3.5">
                  <div className="metric text-[18px] font-bold text-brand">{t.k}</div>
                  <div className="mt-0.5 text-[13px] font-semibold">{t.t}</div>
                  <p className="mt-1 text-[12px] leading-5 text-text-3">{t.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 怎么选 ---------- */}
        <section className="ab-container ab-section" id="choose">
          <div className="mb-5">
            <span className="ab-chip ab-chip-brand">怎么选</span>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] sm:text-[28px]">
              两个基准各自的适用场景
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] border border-border bg-white/85 p-5 shadow-[var(--metric-shadow)]">
              <div className="text-[15px] font-bold">选 SWE-bench，当你要——</div>
              <ul className="mt-3 space-y-2.5 text-[13.5px] leading-6 text-text-2">
                <li>· 验收一套<b className="text-foreground">完整 Agent 系统</b>（模型 + scaffold + 工具链）在真实 issue 上的端到端表现；</li>
                <li>· 与社区已有的大量公开结果横向对照（SWE-bench 已积累多个公开榜单与复现数据）；</li>
                <li>· 在 12 个流行 Python 仓库的真实维护场景中做发布前回归。</li>
              </ul>
            </div>
            <div className="rounded-[20px] border border-border bg-white/85 p-5 shadow-[var(--metric-shadow)]">
              <div className="text-[15px] font-bold">选 LoopArena，当你要——</div>
              <ul className="mt-3 space-y-2.5 text-[13.5px] leading-6 text-text-2">
                <li>· 单独比较不同模型的<b className="text-foreground">控制与决策能力</b>，排除 scaffold 差异的干扰；</li>
                <li>· 用 Type I / II 低成本档位快速初筛，再用 Type III 严格成功率定榜；</li>
                <li>· 同时关注「做不做得完」和「<b className="text-foreground">花多少钱做完</b>」（估算推理成本 $/run）。</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-warn/25 bg-warn-soft/80 px-4 py-3.5 text-[12.5px] leading-6 text-warn">
            <span className="mt-0.5 select-none text-[15px] font-bold leading-none">!</span>
            <div>
              <b>口径提醒</b>：SWE-bench 的 % Resolved 与 LoopArena 的 SSR 测量目标不同，分数不可直接互换或合并排名；
              同一模型在两个基准上的名次差异，往往反映的是评测口径而非能力矛盾。
            </div>
          </div>
        </section>

        {/* ---------- 参考来源 ---------- */}
        <section className="ab-container ab-section" id="sources">
          <div className="mb-4">
            <span className="ab-chip">参考来源</span>
          </div>
          <ul className="space-y-2 text-[13px] leading-6 text-text-2">
            <li>
              · SWE-bench 论文：
              <a
                href="https://arxiv.org/abs/2310.06770"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline underline-offset-2"
              >
                SWE-bench: Can Language Models Resolve Real-World GitHub Issues?（arXiv 2310.06770）
              </a>
            </li>
            <li>
              · SWE-bench Verified（OpenAI，500 条人工验证子集）：
              <a
                href="https://openai.com/index/introducing-swe-bench-verified/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline underline-offset-2"
              >
                Introducing SWE-bench Verified
              </a>
            </li>
            <li>
              · LoopArena 论文：
              <a
                href="https://arxiv.org/abs/2608.28281"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline underline-offset-2"
              >
                LoopArena（arXiv 2608.28281）
              </a>
              ，本站榜单数据来自其 Table 2 公开快照。
            </li>
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
