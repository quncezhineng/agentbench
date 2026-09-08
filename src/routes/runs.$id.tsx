import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { getEvalRun } from "@/lib/eval-runs.functions";
import { SUITE_LABEL, TASK_LABEL, type EvalRunRow } from "@/lib/eval-queries";

const runQuery = (id: string) =>
  queryOptions({
    queryKey: ["eval-run", id],
    queryFn: async () => {
      const res = await getEvalRun({ data: { id } });
      return (res.row ?? null) as unknown as EvalRunRow | null;
    },
  });

export const Route = createFileRoute("/runs/$id")({
  head: ({ params }) => {
    const title = `评测记录 ${params.id.slice(0, 8)} · AgentBench 智衡`;
    const desc =
      "查看这次编程智能体评测的完整过程：任务类型、各项指标分数、运行参数、工具调用日志、评分依据与数据来源。";
    const url = `https://getagentbench.lovable.app/runs/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ context, params }) => context.queryClient.ensureQueryData(runQuery(params.id)),
  component: RunPage,
});

const Block = ({ title, body }: { title: string; body: string }) =>
  body ? (
    <div className="ab-panel bg-white p-4">
      <div className="mb-2 text-[13px] font-bold">{title}</div>
      <pre className="whitespace-pre-wrap break-words text-[12.5px] leading-5 text-text-2">
        {body}
      </pre>
    </div>
  ) : null;

function RunPage() {
  const { id } = Route.useParams();
  const { data: run } = useSuspenseQuery(runQuery(id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={[]} cta={{ href: "/board", label: "查看排行榜" }} />
      <main className="ab-container ab-section">
        {!run ? (
          <p className="text-[14px] text-text-2">找不到这条评测记录，或它尚未通过审核。</p>
        ) : (
          <>
            <div className="ab-chip ab-chip-brand mb-3">
              {SUITE_LABEL[run.suite] ?? run.suite} · {TASK_LABEL[run.task_type] ?? run.task_type}
            </div>
            <h1 className="ab-section-title">{run.agent_name} 评测详情</h1>
            <p className="ab-section-desc mt-2">
              {run.vendor} · 评测日期 {run.run_date} · 样本量 {run.sample_size}
              {run.judge ? ` · 裁判 ${run.judge}` : ""}
            </p>

            <div className="my-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(run.metrics ?? {}).map(([k, v]) => (
                <div key={k} className="ab-panel bg-white p-4">
                  <div className="text-[11.5px] text-text-3">{k}</div>
                  <div className="metric mt-1 text-[22px] font-bold text-brand">{v}</div>
                </div>
              ))}
            </div>

            {run.tool_log && (
              <div className="mb-3">
                <RunTimeline log={run.tool_log} />
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <Block title="方法论 / 口径" body={run.method} />
              <Block title="运行参数" body={JSON.stringify(run.params ?? {}, null, 2)} />
              <Block title="原始工具调用日志" body={run.tool_log} />
              <Block title="评分依据" body={run.rationale} />
            </div>


            <div className="ab-panel mt-3 bg-white p-4 text-[12.5px] text-text-2">
              <div className="mb-1 font-bold text-foreground">数据来源</div>
              <div>{run.source_label}</div>
              <div className="mt-1 text-text-3">{run.source_by}</div>
              {run.source_url && (
                <a className="mt-1 inline-block text-brand hover:underline" href={run.source_url}>
                  {run.source_url}
                </a>
              )}
            </div>

            <div className="mt-5 flex gap-4 text-[13px]">
              <a className="text-brand hover:underline" href="/board">
                返回排行榜
              </a>
              <a
                className="text-brand hover:underline"
                href={`/agents/${encodeURIComponent(run.agent_name)}`}
              >
                {run.agent_name} 汇总页
              </a>
              <a className="text-brand hover:underline" href="/runs">
                全部评测结果
              </a>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
