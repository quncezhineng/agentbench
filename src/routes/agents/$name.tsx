import { createFileRoute } from "@tanstack/react-router";
import { AgentDetail } from "@/components/agentbench/AgentDetail";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "智能体详情 · AgentBench 智衡";

export const Route = createFileRoute("/agents/$name")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: "查看单个 AI 智能体的六维评测结果、分数构成、雷达图与数据来源。" },
      { property: "og:type", content: "website" },
    ],
  }),

  component: AgentPage,
});

function AgentPage() {
  const { name } = Route.useParams();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航 ---------- */}
      <SiteHeader navs={[]} cta={{ href: "/board", label: "查看排行榜" }} />

      {/* ---------- 智能体详情 ---------- */}
      <main>
        <AgentDetail name={name} />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
