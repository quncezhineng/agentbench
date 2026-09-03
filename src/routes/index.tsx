import { createFileRoute } from "@tanstack/react-router";
import { BenchApp } from "@/components/agentbench/BenchApp";
import { Audit, Graders, Methodology } from "@/components/agentbench/StaticSections";

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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="mx-auto max-w-[1180px] px-6 flex items-center gap-7 h-15 py-3">
          <div className="flex items-center gap-2.5 font-bold text-[16px] tracking-tight">
            <span className="w-7 h-7 rounded-lg shrink-0 bg-gradient-to-br from-brand to-brand-2 text-primary-foreground flex items-center justify-center text-[13px] font-extrabold font-serif">
              AB
            </span>
            <span>
              AgentBench{" "}
              <span className="text-[12px] text-text-3 font-medium tracking-wide">智衡 · 评测榜</span>
            </span>
          </div>
          <nav className="hidden sm:flex gap-5 ml-auto text-[13px] text-text-2">
            <a href="#board" className="hover:text-brand">
              排行榜
            </a>
            <a href="#radar" className="hover:text-brand">
              多维对比
            </a>
            <a href="#method" className="hover:text-brand">
              评测方法
            </a>
            <a href="#graders" className="hover:text-brand">
              评分器
            </a>
            <a href="#audit" className="hover:text-brand">
              审计
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 pt-11 pb-7">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand bg-brand-soft px-3 py-1.5 rounded-full mb-3.5">
          ◆ AI Agent 评测 · 结果导向 × 过程追踪
        </div>
        <h1 className="text-[26px] sm:text-[32px] leading-tight font-bold tracking-tight">
          AI Agent 多维评测与排行
        </h1>
        <p className="text-text-2 text-[15px] mt-2.5 max-w-[760px]">
          不只看单次输出是否准确，而是评估 Agent 在多步交互与工具调用下的
          <b className="text-foreground">任务达成度、稳定性与效率</b>
          。6 个维度独立打分，按场景差异化加权，全维度可排序、可对比。
        </p>

        <div className="mt-5 bg-warn-soft border border-warn/30 border-l-[3px] border-l-warn rounded-lg px-4 py-3.5 text-[12.5px] text-warn">
          <b>数据口径声明（务必先读）</b>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>
              <b>已标注来源</b>的分数来自公开发布快照（OpenAI 2026-04-23
              发布表等），仅代表发布方口径、当时的 harness 与复现环境。
            </li>
            <li>
              不同基准、不同日期、不同 harness 的结果<b>不可直接混用</b>
              ；本榜将它们放在同一张表里，是为了演示评分与排序方法，不是严格的能力横评。
            </li>
            <li>
              <b>占位示例</b>条目用于填充榜单结构，数字为构造值，接入真实评测管线后自动替换。
            </li>
            <li>
              稳定性 passᵏ 按 <b>passᵏ = pᵏ（k=3）</b> 由成功率推算，非独立实测。
            </li>
            <li>
              <b>名称声明</b>：本站为第三方评测榜单，与清华大学 THUDM/AgentBench 基准项目
              <b>无隶属关系</b>；站内「参考基准」一栏中的 AgentBench 特指该学术基准本身。
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          {[
            { v: "8", l: "参评 Agent" },
            { v: "6", l: "评测维度" },
            { v: "3", l: "场景权重组" },
            { v: "2026-04-23", l: "公开数据快照" },
          ].map((k) => (
            <div
              key={k.l}
              className="bg-surface border border-border rounded-xl px-4 py-4 shadow-card"
            >
              <div className="text-[24px] font-bold tracking-tight">{k.v}</div>
              <div className="text-[12px] text-text-3 mt-0.5">{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <BenchApp />
      <Methodology />
      <Graders />
      <Audit />

      <footer className="border-t border-border mt-12 py-7 text-[12px] text-text-3">
        <div className="mx-auto max-w-[1180px] px-6 flex flex-wrap gap-5">
          <span>AgentBench 智衡 · AI Agent 评测榜</span>
          <span>与清华大学 THUDM/AgentBench 基准项目无隶属关系</span>
          <span>
            评分与排序方法参考：Anthropic 评估体系 · 美团 Agent 评测漫谈 · AgentBoard · τ-bench ·
            OSWorld
          </span>
          <span className="sm:ml-auto">数据快照 2026-04-23</span>
        </div>
      </footer>
    </div>
  );
}
