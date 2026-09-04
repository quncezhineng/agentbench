import { createFileRoute } from "@tanstack/react-router";
import {
  AgentTypes,
  Audit,
  EvalPipeline,
  Graders,
  Methodology,
  Roadmap,
} from "@/components/agentbench/StaticSections";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "AgentBench 智衡 · AI Agent 多维评测与排行";
const DESC =
  "AI Agent 多维评测与排行：6 个维度独立打分（成功率 / 稳定性 passᵏ / 工具调用准确率 / 进度率 / 效率 / 可信与安全），按编码、对话、研究操作三类场景差异化加权，全维度可排序可对比。";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getagentbench.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://getagentbench.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "AgentBench 智衡 · AI Agent 多维评测数据集",
          description: DESC,
          url: "https://getagentbench.lovable.app/board",
          license: "https://getagentbench.lovable.app/",
          creator: { "@type": "Organization", name: "AgentBench 智衡" },
          variableMeasured: [
            "任务成功率",
            "稳定性 passᵏ",
            "工具调用准确率",
            "进度率",
            "效率",
            "可信与安全",
          ],
          distribution: [
            {
              "@type": "DataDownload",
              encodingFormat: "application/json",
              contentUrl: "https://getagentbench.lovable.app/board#data",
            },
            {
              "@type": "DataDownload",
              encodingFormat: "text/csv",
              contentUrl: "https://getagentbench.lovable.app/board#data",
            },
          ],
        }),
      },
    ],
  }),

  component: Index,
});

// 排行榜已独立为 /board 页面，首页导航保留首页各内容区块锚点
const NAV = [
  { href: "#method", label: "评测方法" },
  { href: "#pipeline", label: "评测链路" },
  { href: "#graders", label: "评分器" },
  { href: "#audit", label: "效度审计" },
  { href: "#agents", label: "Agent 类型" },
  { href: "#roadmap", label: "落地路线" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航：点击「查看排行榜」进入独立榜单页 ---------- */}
      <SiteHeader navs={NAV} cta={{ href: "/board", label: "查看排行榜" }} />

      {/* ---------- 首屏：工作台概览 ---------- */}
      <section className="ab-container ab-section pt-8 sm:pt-10">
        <div className="ab-panel ab-grid-bg overflow-hidden">
          <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1.15fr)_400px] lg:items-start">
            {/* 左：定位说明 */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="ab-chip ab-chip-brand">AI Agent 多维评测与排行</span>
                <span className="ab-chip">结果导向 × 过程追踪</span>
              </div>

              <h1 className="text-[32px] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[44px] lg:text-[50px]">
                Agent 到底行不行，
                <br />
                <span className="text-brand">用数据说话</span>
              </h1>

              <p className="mt-4 max-w-[640px] text-[15px] leading-7 text-text-2 sm:text-[16px]">
                6 个维度独立打分，按编码、对话、研究操作三类场景差异化加权。
                <b className="text-foreground">
                  成功率、稳定性 passᵏ、工具准确率、进度率、效率、可信与安全
                </b>
                ——全维度可排序、可对比、可审计。
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/board" className="ab-button ab-button-primary">
                  查看实时排行榜
                </a>
                <a href="/board#radar" className="ab-button ab-button-secondary">
                  多维对比雷达
                </a>
                <a href="#method" className="ab-button ab-button-ghost">
                  评测方法论
                </a>
              </div>

              {/* 底部三个价值点 */}
              <div className="mt-8 grid gap-3 border-t border-border/80 pt-6 sm:grid-cols-3">
                {[
                  { k: "6", t: "核心维度", d: "独立打分，不靠单指标定胜负" },
                  { k: "3", t: "场景权重组", d: "编码 / 对话 / 研究与操作" },
                  { k: "JSON", t: "真实数据可接入", d: "导入即替换，无需改代码" },
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

            {/* 右：评测构成卡片 */}
            <aside className="flex flex-col gap-4">
              <div
                className="rounded-[20px] border border-border p-5"
                style={{ background: "var(--hero-gradient)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                    总分构成
                  </div>
                  <span className="ab-chip ab-chip-brand">按场景加权</span>
                </div>

                {/* 模拟总分拆解 */}
                <div className="mt-5 flex items-end gap-2">
                  <div className="flex-1">
                    <div className="flex items-end justify-between">
                      <span className="text-[13px] font-semibold">编码智能体 · 当前场景</span>
                    </div>
                    <div className="metric mt-1 text-[13px] font-bold text-brand">
                      成功率 35% · 工具 25% · pass³ 20%
                    </div>
                  </div>
                </div>

                {/* 维度权重可视化 */}
                <div className="mt-4 space-y-2.5">
                  {[
                    ["任务成功率", 35, "var(--brand)"],
                    ["工具调用准确率", 25, "var(--info)"],
                    ["稳定性 passᵏ", 20, "var(--brand-2)"],
                    ["进度率 / 效率 / 可信", 20, "var(--ok)"],
                  ].map(([label, w, color]) => (
                    <div key={label as string}>
                      <div className="mb-1 flex items-center justify-between text-[11.5px]">
                        <span className="font-medium text-text-2">{label}</span>
                        <span className="metric font-bold text-text-3">{w}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${w}%`, background: color as string }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-border bg-white/85 p-5 shadow-[var(--metric-shadow)]">
                <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">
                  数据可信度
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">公开来源覆盖</span>
                  <span className="metric rounded-lg bg-ok-soft px-2 py-0.5 text-[12px] font-bold text-ok">
                    5 / 8 有标注来源
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/90 px-3.5 py-2.5">
                    <span className="text-[12.5px] text-text-2">来源声明</span>
                    <span className="rounded-md bg-info-soft px-2 py-0.5 text-[11px] font-bold text-info">
                      已强化
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/90 px-3.5 py-2.5">
                    <span className="text-[12.5px] text-text-2">占位值标注</span>
                    <span className="rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-bold text-warn">
                      构造值标黄
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/90 px-3.5 py-2.5">
                    <span className="text-[12.5px] text-text-2">passᵏ 口径</span>
                    <span className="rounded-md bg-chip px-2 py-0.5 text-[11px] font-bold text-text-3">
                      pᵏ 推算，注明
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
            <b>数据口径声明</b>：已标注来源的分数来自公开发布快照，仅代表发布方口径与当时复现环境；
            不同基准、不同日期和不同 harness 结果不能直接横向混用；稳定性
            <code className="mx-1 rounded bg-white/70 px-1 font-semibold">passᵏ</code>
            为由成功率推算的解释性指标，不等于独立实测。本站为第三方评测榜单，与清华大学
            THUDM/AgentBench 基准项目无隶属关系。
          </div>
        </div>
      </section>

      {/* ---------- 主体功能：方法 / 链路 / 评分器 / 审计 / 类型 / 路线 ---------- */}
      <main>
        <Methodology />
        <EvalPipeline />
        <Graders />
        <Audit />
        <AgentTypes />
        <Roadmap />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
