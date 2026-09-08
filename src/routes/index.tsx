import { createFileRoute } from "@tanstack/react-router";
import {
  Mechanism,
  Metrics,
  Pipeline,
  Scope,
  Tiers,
} from "@/components/agentbench/StaticSections";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "AgentBench 智衡 · 编程智能体 LoopArena 评测与排行";
const DESC =
  "编程智能体 LoopArena 评测与排行：Controller 与 Worker 分开测，用 Evidence Packet + Loop Contract 隔离控制能力；Type I / II / III 三级评测（合同选择 / 任务切片 / 完整任务）+ 严格成功率（SSR）+ 估算成本，只对目前主流的编程智能体排序打分。";
const BASE_URL = "https://getagentbench.lovable.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "AgentBench 智衡 · 编程智能体 LoopArena 评测数据集",
          description: DESC,
          url: `${BASE_URL}/board`,
          license: `${BASE_URL}/`,
          creator: { "@type": "Organization", name: "AgentBench 智衡" },
          variableMeasured: [
            "Type I 合同准确率",
            "Type II 严格成功率（SSR）",
            "Type III 严格成功率（SSR）",
            "平均估算推理成本（$/run）",
          ],
        }),
      },
    ],
  }),

  component: Index,
});

// 首页导航：页内区块锚点
const NAV = [
  { href: "#mechanism", label: "评测机制" },
  { href: "#tiers", label: "三级评测" },
  { href: "#pipeline", label: "评测链路" },
  { href: "#metrics", label: "指标口径" },
  { href: "#scope", label: "评测范围" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航：区块锚点在前，站点入口居后 ---------- */}
      <SiteHeader navs={NAV} cta={{ href: "/board", label: "查看排行榜" }} siteAfterNav />

      {/* ---------- 首屏：LoopArena 机制概览 ---------- */}
      <section className="ab-container ab-section pt-8 sm:pt-10">
        <div className="ab-panel ab-grid-bg overflow-hidden">
          <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1.15fr)_400px] lg:items-start">
            {/* 左：定位说明 */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="ab-chip ab-chip-brand">编程智能体评测与排行</span>
                <span className="ab-chip">Controller / Worker 分开测</span>
              </div>

              <h1 className="text-[32px] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[44px] lg:text-[50px]">
                把「控制」和「执行」拆开，
                <br />
                <span className="text-brand">Agent 行不行用数据说话</span>
              </h1>

              <p className="mt-4 max-w-[640px] text-[15px] leading-7 text-text-2 sm:text-[16px]">
                LoopArena 机制：<b className="text-foreground">Controller 只决策、Worker 只动手</b>
                ，固定 Worker 后分数差只反映控制能力。用
                <b className="text-foreground">
                  严格成功率（SSR）+ 估算推理成本 + Type I / II / III 三级评测
                </b>
                ，只对目前主流的编程智能体排序打分。
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/board" className="ab-button ab-button-primary">
                  查看排行榜
                </a>
                <a href="/eval" className="ab-button ab-button-secondary">
                  LoopArena 机制
                </a>
                <a href="#mechanism" className="ab-button ab-button-ghost">
                  评测方法论
                </a>
              </div>

              {/* 底部三个价值点 */}
              <div className="mt-8 grid gap-3 border-t border-border/80 pt-6 sm:grid-cols-3">
                {[
                  { k: "3", t: "评测档位", d: "Type I / II / III，成本递减逼近同一结论" },
                  { k: "5", t: "已评测模型", d: "论文 Table 2 真实结果，参与排名" },
                  { k: "9", t: "待评测产品", d: "Claude Code / Codex / Cursor 等，待接入" },
                ].map((it) => (
                  <div
                    key={it.t}
                    className="rounded-2xl border border-border bg-white/70 px-4 py-3.5"
                  >
                    <div className="metric text-[20px] font-bold text-brand">{it.k}</div>
                    <div className="mt-0.5 text-[12.5px] font-semibold">{it.t}</div>
                    <p className="mt-1 text-[11.5px] leading-5 text-text-3">{it.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 右：主排序指标与数据来源 */}
            <aside className="flex flex-col gap-4">
              <div
                className="rounded-[20px] border border-border p-5"
                style={{ background: "var(--hero-gradient)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                    主排序指标
                  </div>
                  <span className="ab-chip ab-chip-brand">Type III</span>
                </div>

                <div className="mt-5">
                  <div className="text-[13px] font-semibold">完整任务 · 严格成功率（SSR）</div>
                  <div className="metric mt-1 text-[13px] font-bold text-brand">
                    从零开始，把完整编码任务「真正做完」
                  </div>
                </div>

                {/* 主榜 Top 3 概览 */}
                <div className="mt-4 space-y-2.5">
                  {[
                    ["GPT-5.5", "24.69%"],
                    ["Qwen3.7-Plus", "23.46%"],
                    ["Claude Opus 4.8", "20.99%"],
                  ].map(([label, v], i) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[12.5px]">
                        <span
                          className={`metric inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${
                            i === 0 ? "bg-brand-soft text-brand" : "bg-white/70 text-text-3"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-medium text-text-2">{label}</span>
                      </span>
                      <span className="metric text-[13px] font-bold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-border bg-white/85 p-5 shadow-[var(--metric-shadow)]">
                <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                  数据来源
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">LoopArena 论文</span>
                  <span className="metric rounded-lg bg-ok-soft px-2 py-0.5 text-[12px] font-bold text-ok">
                    Table 2
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/90 px-3.5 py-2.5">
                    <span className="text-[12.5px] text-text-2">被评测对象</span>
                    <span className="rounded-md bg-info-soft px-2 py-0.5 text-[11px] font-bold text-info">
                      Controller
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/90 px-3.5 py-2.5">
                    <span className="text-[12.5px] text-text-2">Worker 固定</span>
                    <span className="rounded-md bg-chip px-2 py-0.5 text-[11px] font-bold text-text-3">
                      Qwen3.7-Plus
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/90 px-3.5 py-2.5">
                    <span className="text-[12.5px] text-text-2">排名一致性</span>
                    <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                      Spearman ρ 0.9747
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* 数据口径声明 */}
        <div className="mt-4 flex gap-3 rounded-2xl border border-warn/25 bg-warn-soft/80 px-4 py-3.5 text-[12.5px] leading-6 text-warn">
          <span className="mt-0.5 select-none text-[15px] font-bold leading-none">!</span>
          <div>
            <b>数据口径声明</b>：榜单中已标注来源的分数来自 LoopArena 论文（arXiv 2608.28281）
            Table 2 的公开发布快照，仅代表论文口径与当时复现环境；其余主流编程智能体产品暂为
            「待评测」占位，尚未在 LoopArena 统一口径下跑分。本站为第三方评测榜单，与论文作者
            及各家模型/产品厂商无隶属关系。
          </div>
        </div>
      </section>

      {/* ---------- 主体：机制 / 三级评测 / 链路 / 指标 / 范围 ---------- */}
      <main>
        <Mechanism />
        <Tiers />
        <Pipeline />
        <Metrics />
        <Scope />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
