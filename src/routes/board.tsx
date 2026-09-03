import { createFileRoute } from "@tanstack/react-router";
import { BenchApp } from "@/components/agentbench/BenchApp";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "AgentBench 智衡 · AI Agent 排行榜";
const DESC =
  "AI Agent 排行榜工作台：编码 / 对话 / 研究与操作三类场景差异化加权，六维独立打分；支持权重自定义、表头排序、勾选雷达对比与 JSON 数据导入导出。";

// 排行榜工作台页面导航（页内锚点，指向 BenchApp 渲染的三个区块）
const NAV = [
  { href: "#board", label: "排行榜" },
  { href: "#radar", label: "对比分析" },
  { href: "#data", label: "数据接入" },
];

export const Route = createFileRoute("/board")({
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
  component: Board,
});

function Board() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航：区块锚点均在当前榜单页内 ---------- */}
      <SiteHeader
        navs={NAV}
        chip="数据快照 2026-04-23"
        cta={{ href: "#data", label: "接入数据" }}
      />

      {/* ---------- 榜单工作台：排行榜 / 多维对比 / 数据接入 ---------- */}
      <main>
        <BenchApp />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
