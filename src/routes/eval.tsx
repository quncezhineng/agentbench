import { createFileRoute } from "@tanstack/react-router";
import { EvalApp } from "@/components/agentbench/EvalApp";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "AgentBench 智衡 · 自动化 AI Agent 评测";
const DESC =
  "用真实大模型自动评测 AI Agent：选择模型通道与评测套件（对话 / 研究与操作），自动执行多次试验并按成功率 / 稳定性 passᵏ / 工具 / 进度率 / 效率 / 可信六维口径打分；结果一键并入共享榜单，或在页底数据接入区导入 / 导出 JSON。";
const BASE_URL = "https://getagentbench.lovable.app";

// 自动化评测页面导航（页内锚点；排行榜 / 自动化评测 全局入口由 SiteShell 提供）
const NAV = [
  { href: "#config", label: "评测配置" },
  { href: "#report", label: "评测报告" },
  { href: "#data", label: "数据接入" },
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
      <SiteHeader navs={NAV} cta={{ href: "#config", label: "开始评测" }} />

      {/* ---------- 自动化评测工作台 ---------- */}
      <main>
        <EvalApp />
      </main>

      {/* ---------- 页脚 ---------- */}
      <SiteFooter />
    </div>
  );
}
