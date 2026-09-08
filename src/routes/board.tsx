import { createFileRoute } from "@tanstack/react-router";
import { BenchApp } from "@/components/agentbench/BenchApp";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { useLeaderboardSnapshot } from "@/lib/leaderboard-store";

const TITLE = "AgentBench 智衡 · AI Agent 排行榜";
const DESC =
  "AI Agent 排行榜工作台：编码 / 对话 / 研究与操作三类场景差异化加权，六维独立打分；支持权重自定义、表头排序与勾选雷达对比。数据来自「自动化评测」页的评测结果或导入的 JSON。";

// 排行榜工作台页面导航（页内锚点，指向 BenchApp 渲染的两个区块；
// 「排行榜」站点级入口由 SiteShell 全局导航提供）
const NAV = [
  { href: "#board", label: "榜单" },
  { href: "#radar", label: "多维对比" },
];

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getagentbench.lovable.app/board" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://getagentbench.lovable.app/board" }],
  }),

  component: Board,
});

function Board() {
  // 右上角「数据快照」chip 展示当前生效数据的快照日期（本地入库后实时更新）
  const { updatedAt } = useLeaderboardSnapshot();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航：区块锚点均在当前榜单页内 ---------- */}
      <SiteHeader
        navs={NAV}
        chip={`数据快照 ${updatedAt}`}
        cta={{ href: "/eval", label: "去自动化评测" }}
      />

      {/* ---------- 榜单工作台：排行榜 / 多维对比（数据接入已移入自动化评测页） ---------- */}
      <main>
        <BenchApp />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
