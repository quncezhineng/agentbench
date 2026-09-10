import { createFileRoute } from "@tanstack/react-router";
import { AgentDetail } from "@/components/agentbench/AgentDetail";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { runsQuery } from "@/lib/eval-queries";

export const Route = createFileRoute("/agents/$name")({
  head: ({ params }) => {
    const name = params.name;
    const title = `${name} 评测详情 · AgentBench 智衡`;
    const desc = `查看 ${name} 的 LoopArena 三级评测结果：Type I 合同准确率、Type II / Type III 严格成功率（SSR）与估算推理成本，以及数据来源。`;
    const url = `https://getagentbench.lovable.app/agents/${name}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },

  loader: ({ context }) => context.queryClient.ensureQueryData(runsQuery),
  component: AgentPage,
});

function AgentPage() {
  const { name } = Route.useParams();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航 ---------- */}
      {/* <SiteHeader navs={[]} cta={{ href: "/board", label: "查看排行榜" }} /> */}
      <SiteHeader navs={[]} />

      {/* ---------- 智能体详情 ---------- */}
      <main>
        <AgentDetail name={name} />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
