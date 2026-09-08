import { createFileRoute } from "@tanstack/react-router";
import { LoopArenaExplainer } from "@/components/agentbench/LoopArenaExplainer";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "AgentBench 智衡 · LoopArena 评测机制";
const DESC =
  "LoopArena 评测机制说明：Controller 与 Worker 分开测，用 Evidence Packet + Loop Contract 隔离控制能力；Type I / II / III 三级评测（合同选择 / 任务切片 / 完整任务）与严格成功率（SSR）口径。";
const BASE_URL = "https://getagentbench.lovable.app";

// LoopArena 机制说明页导航（页内锚点）
const NAV = [
  { href: "#roles", label: "三个角色" },
  { href: "#tiers", label: "三级评测" },
  { href: "#references", label: "参考策略" },
  { href: "#reproduce", label: "复现" },
];

export const Route = createFileRoute("/eval")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/eval` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/eval` }],
  }),

  component: Eval,
});

function Eval() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航 ---------- */}
      <SiteHeader navs={NAV} cta={{ href: "/board", label: "查看排行榜" }} />

      {/* ---------- LoopArena 机制说明 ---------- */}
      <main>
        <LoopArenaExplainer />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
