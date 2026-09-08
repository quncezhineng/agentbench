import { createFileRoute } from "@tanstack/react-router";
import { AgentDetail } from "@/components/agentbench/AgentDetail";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "编程智能体详情 · AgentBench 智衡";
const DESC =
  "查看单个编程智能体的 LoopArena 三级评测结果：Type I 合同准确率、Type II / Type III 严格成功率（SSR）与估算推理成本，以及数据来源。";

export const Route = createFileRoute("/agents/$name")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
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
