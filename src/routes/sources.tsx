import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { runsQuery, SUITE_LABEL, TASK_LABEL } from "@/lib/eval-queries";

const TITLE = "实测数据来源 · AgentBench 智衡";
const DESC =
  "AgentBench 智衡数据来源页：逐条列出榜单上每个 CLI 与 LoopArena 条目的评测来源、评测时间、样本量、裁判、方法论与原始分数，做到可追溯、可复核。";
const URL = "https://getagentbench.lovable.app/sources";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(runsQuery),
  component: SourcesPage,
});

const th =
  "border-b border-border px-3 py-3 text-left whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3";
const td = "border-b border-border/80 px-3 py-3 align-top text-[12.5px]";

function SourcesPage() {
  const { data: rows } = useSuspenseQuery(runsQuery);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={[]} cta={{ href: "/board", label: "查看排行榜" }} />
      <main className="ab-container ab-section">
        <div className="ab-chip ab-chip-brand mb-3">Data Sources</div>
        <h1 className="ab-section-title">实测数据来源</h1>
        <p className="ab-section-desc mt-2 max-w-3xl">
          榜单上的每一个分数都对应一条评测记录。下表列出它的来源、评测时间、样本量、裁判、
          方法与原始数据，点「详情」可以看到完整过程与日志。
        </p>

        <div className="ab-panel mt-5 overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[1000px]">
              <thead>
                <tr>
                  <th className={th}>智能体</th>
                  <th className={th}>套件 / 任务</th>
                  <th className={th}>评测时间</th>
                  <th className={th}>样本 / 裁判</th>
                  <th className={th}>原始数据</th>
                  <th className={th}>方法论</th>
                  <th className={th}>来源</th>
                  <th className={th}>详情</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2/70">
                    <td className={`${td} font-semibold`}>
                      {r.agent_name}
                      <div className="mt-0.5 text-[11px] font-normal text-text-3">{r.vendor}</div>
                    </td>
                    <td className={td}>
                      {SUITE_LABEL[r.suite] ?? r.suite}
                      <div className="mt-0.5 text-[11px] text-text-3">
                        {TASK_LABEL[r.task_type] ?? r.task_type}
                      </div>
                    </td>
                    <td className={`${td} metric`}>{r.run_date}</td>
                    <td className={td}>
                      {r.sample_size}
                      {r.judge ? ` · ${r.judge}` : ""}
                    </td>
                    <td className={`${td} metric text-text-2`}>
                      {Object.entries(r.metrics ?? {})
                        .map(([k, v]) => `${k}=${v}`)
                        .join(" · ")}
                    </td>
                    <td className={`${td} max-w-[280px] whitespace-normal text-text-2`}>
                      {r.method || "—"}
                    </td>
                    <td className={`${td} max-w-[220px] whitespace-normal`}>
                      {r.source_label}
                      <div className="mt-0.5 text-[11px] text-text-3">{r.source_by}</div>
                      {r.source_url && (
                        <a className="text-brand hover:underline" href={r.source_url}>
                          链接
                        </a>
                      )}
                    </td>
                    <td className={td}>
                      <a className="text-brand hover:underline" href={`/runs/${r.id}`}>
                        详情
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
