import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin, listPendingRuns, setRunStatus } from "@/lib/admin.functions";
import { runsQuery, TASK_LABEL, SUITE_LABEL } from "@/lib/eval-queries";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/review")({
  head: () => ({
    meta: [
      { title: "评测审核 · AgentBench 智衡" },
      { name: "description", content: "管理员审核访客提交的评测结果，通过后自动上榜。" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

interface PendingRow {
  id: string;
  suite: string;
  agent_name: string;
  vendor: string;
  task_type: string;
  metrics: Record<string, number> | null;
  source_label: string;
  source_url: string | null;
  method: string;
  run_date: string;
  sample_size: number;
  judge: string;
  tool_log: string;
  rationale: string;
  submitted_by: string;
  created_at: string;
}

const METRICS: [string, string][] = [
  ["success", "任务成功率"],
  ["tool", "工具调用准确率"],
  ["progress", "进度率"],
  ["efficiency", "效率"],
  ["trust", "可信与安全"],
];

function ReviewPage() {
  const qc = useQueryClient();
  const isAdminFn = useServerFn(checkAdmin);
  const listFn = useServerFn(listPendingRuns);
  const statusFn = useServerFn(setRunStatus);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn({}) });
  const pending = useQuery({
    queryKey: ["pending-runs"],
    queryFn: () => listFn({}),
    enabled: admin.data?.isAdmin === true,
  });

  const act = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await statusFn({ data: { id, status } });
      await qc.invalidateQueries({ queryKey: ["pending-runs"] });
      await qc.invalidateQueries({ queryKey: runsQuery.queryKey });
    } finally {
      setBusy(null);
    }
  };

  const rows = (pending.data?.rows ?? []) as unknown as PendingRow[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={[]} />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold">评测审核</h1>
            <p className="text-[13px] text-text-3">
              通过后的提交会立刻出现在排行榜、雷达图、维度表和结果库里。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/board" className="text-[12.5px] text-brand underline">
              查看榜单
            </Link>
            <button
              type="button"
              className="text-[12.5px] text-text-3 underline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              退出登录
            </button>
          </div>
        </div>

        {admin.isLoading && <p className="text-[13px] text-text-3">正在检查权限…</p>}

        {admin.data && !admin.data.isAdmin && (
          <div className="ab-panel bg-white p-5 text-[13px]">
            当前账号不是管理员，无法查看待审核的提交。请让站点负责人把这个账号加入管理员名单。
          </div>
        )}

        {admin.data?.isAdmin && (
          <>
            {pending.isLoading && <p className="text-[13px] text-text-3">正在加载待审核提交…</p>}
            {pending.data && rows.length === 0 && (
              <div className="ab-panel bg-white p-5 text-[13px] text-text-3">
                目前没有待审核的提交。
              </div>
            )}
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="ab-panel bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold">
                        {r.agent_name}
                        {r.vendor ? <span className="text-text-3"> · {r.vendor}</span> : null}
                      </p>
                      <p className="text-[12px] text-text-3">
                        {SUITE_LABEL[r.suite] ?? r.suite} · {TASK_LABEL[r.task_type] ?? r.task_type}{" "}
                        · {r.run_date} · 样本 {r.sample_size}
                        {r.judge ? ` · 裁判 ${r.judge}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "approved")}
                        className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "rejected")}
                        className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-2 disabled:opacity-60"
                      >
                        拒绝
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpen(open === r.id ? null : r.id)}
                        className="text-[12.5px] text-brand underline"
                      >
                        {open === r.id ? "收起" : "展开"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-[12.5px]">
                    {METRICS.map(([k, l]) => (
                      <span key={k}>
                        <span className="text-text-3">{l}：</span>
                        {r.metrics?.[k] ?? "—"}
                      </span>
                    ))}
                  </div>

                  {open === r.id && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3 text-[12.5px]">
                      <p>
                        <span className="text-text-3">来源：</span>
                        {r.source_label}
                        {r.source_url ? (
                          <a
                            className="ml-2 text-brand underline"
                            href={r.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            链接
                          </a>
                        ) : null}
                      </p>
                      <p>
                        <span className="text-text-3">提交人：</span>
                        {r.submitted_by || "匿名"} · {new Date(r.created_at).toLocaleString()}
                      </p>
                      {r.method && (
                        <div>
                          <p className="text-text-3">方法论 / 口径</p>
                          <pre className="whitespace-pre-wrap break-words">{r.method}</pre>
                        </div>
                      )}
                      {r.tool_log && (
                        <div>
                          <p className="text-text-3">工具调用日志</p>
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words">
                            {r.tool_log}
                          </pre>
                        </div>
                      )}
                      {r.rationale && (
                        <div>
                          <p className="text-text-3">评分依据</p>
                          <pre className="whitespace-pre-wrap break-words">{r.rationale}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
