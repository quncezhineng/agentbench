import { createFileRoute } from "@tanstack/react-router";
import { BenchApp } from "@/components/agentbench/BenchApp";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { runsQuery, scheduleQuery } from "@/lib/eval-queries";

const TITLE = "AgentBench 智衡 · 编程智能体排行榜";
const DESC =
  "编程智能体 LoopArena 排行榜：只对目前主流的编程智能体排序打分。主榜按 Type III 严格成功率（SSR）排名，辅以 Type I 合同准确率、Type II 任务切片 SSR 与估算推理成本（$/run）；数据来自 LoopArena 论文 Table 2。";
const BASE_URL = "https://getagentbench.lovable.app";

// 排行榜页面导航（页内锚点，指向 BenchApp 渲染的三个区块）
const NAV = [
  { href: "#board", label: "主榜" },
  { href: "#references", label: "参考策略" },
  { href: "#cli", label: "CLI 实测榜" },
  { href: "#pending", label: "待评测" },
  { href: "#submit", label: "提交结果" },
];

export const Route = createFileRoute("/board")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(runsQuery),
      context.queryClient.ensureQueryData(scheduleQuery),
    ]),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/board` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/board` }],
  }),

  component: Board,
});

function Board() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- 顶部导航：区块锚点均在当前榜单页内 ---------- */}
      {/* <SiteHeader navs={NAV} cta={{ href: "/eval", label: "LoopArena 机制" }} /> */}
      <SiteHeader navs={NAV} />

      {/* ---------- 榜单工作台：主榜 / 参考策略 / 待评测产品 ---------- */}
      <main>
        <BenchApp />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
