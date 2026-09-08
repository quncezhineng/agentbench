import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";
import { runsQuery, scheduleQuery, SUITE_LABEL } from "@/lib/eval-queries";

const TITLE = "评测日历 · AgentBench 智衡";
const DESC =
  "AgentBench 智衡评测日历：查看每个编程智能体的 CLI 实测排期、周期与状态，跑完的结果登记入库后排行榜自动刷新。";
const URL = "https://getagentbench.lovable.app/calendar";

export const Route = createFileRoute("/calendar")({
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
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(scheduleQuery),
      context.queryClient.ensureQueryData(runsQuery),
    ]),
  component: CalendarPage,
});

const CADENCE: Record<string, string> = {
  monthly: "每月",
  quarterly: "每季度",
  once: "一次性",
};

const STATUS: Record<string, string> = {
  planned: "已排期",
  running: "评测中",
  done: "已完成",
  skipped: "已跳过",
};

function CalendarPage() {
  const { data: schedule } = useSuspenseQuery(scheduleQuery);
  const { data: runs } = useSuspenseQuery(runsQuery);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={[]} cta={{ href: "/board", label: "查看排行榜" }} />
      <main className="ab-container ab-section">
        <div className="ab-chip ab-chip-brand mb-3">Evaluation Calendar</div>
        <h1 className="ab-section-title">评测日历</h1>
        <p className="ab-section-desc mt-2 max-w-3xl">
          按排期定期跑新模型的 CLI 实测。到期项目在这里提醒，跑完后通过{" "}
          <a className="text-brand hover:underline" href="/board#submit">
            提交表单
          </a>{" "}
          登记结果，审核通过后排行榜、雷达图与维度表自动刷新，不需要改数据文件。
        </p>

        <div className="ab-panel mt-4 bg-white p-4">
          <div className="text-[13px] font-bold">定时自动跑测（一次配置，后续全自动）</div>
          <p className="mt-1 text-[12.5px] text-text-2">
            CLI 模型只能在你自己的机器上运行，所以定时任务装在你这边，结果由网站自动接收。
            在项目目录执行下面一行，就会每周一凌晨 3 点自动评测一次，跑完把成绩、
            每步耗时和工具调用日志直接写入排行榜、雷达图、维度表与结果库，对应排期自动标记完成并顺延。
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-3 text-[12px] leading-5 text-text-2">
{`AB_INGEST_TOKEN=<你的口令> ./scripts/install-cron.sh "Claude Code" "claude -p" Anthropic`}
          </pre>
          <p className="mt-2 text-[12.5px] text-text-2">
            想先看一次结果而不上传，可以跑{" "}
            <code className="metric rounded bg-surface-2 px-1">
              node scripts/run-cli-eval.mjs --agent "Claude Code" --cmd "claude -p" --dry
            </code>
            。任务集在 <code className="metric rounded bg-surface-2 px-1">scripts/eval-tasks.json</code>，
            可自行增删题目。手动结果仍可用{" "}
            <a className="text-brand hover:underline" href="/board#submit">
              提交表单
            </a>{" "}
            登记。
          </p>
        </div>



        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {schedule.map((s) => {
            const due = s.planned_date <= today && s.status === "planned";
            return (
              <div
                key={s.id}
                className={`ab-panel bg-white p-4 ${due ? "border-brand" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[14px] font-bold">{s.agent_name}</div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                      due ? "bg-brand-soft text-brand" : "bg-surface-2 text-text-2"
                    }`}
                  >
                    {due ? "待跑分" : (STATUS[s.status] ?? s.status)}
                  </span>
                </div>
                <div className="mt-2 text-[12.5px] text-text-2">
                  计划日期 <b className="metric">{s.planned_date}</b> ·{" "}
                  {CADENCE[s.cadence] ?? s.cadence}
                </div>
                <div className="mt-1 text-[11.5px] text-text-3">
                  {SUITE_LABEL[s.suite] ?? s.suite}
                  {s.note ? ` · ${s.note}` : ""}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="ab-section-title mt-10 text-[20px]">最近已完成的评测</h2>
        <ul className="mt-3 space-y-2 text-[13px]">
          {runs.slice(0, 12).map((r) => (
            <li key={r.id} className="text-text-2">
              <span className="metric text-text-3">{r.run_date}</span> ·{" "}
              <a className="text-brand hover:underline" href={`/runs/${r.id}`}>
                {r.agent_name} · {SUITE_LABEL[r.suite] ?? r.suite}
              </a>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
