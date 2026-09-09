/**
 * AgentBench 智衡 · 自动回填接口
 *
 * 本地 CLI 实测脚本跑完后，把结果 POST 到这里，直接以「已审核」状态入库，
 * 榜单 / 雷达图 / 维度表下次读取即可看到新数据。
 *
 * 认证：请求头 x-eval-token 必须等于 LOVABLE_CRON_SECRET。
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const metric = z.number().min(0).max(100);

const itemSchema = z.object({
  agent_name: z.string().trim().min(1).max(80),
  vendor: z.string().trim().max(80).default(""),
  suite: z.enum(["cli", "looparena"]).default("cli"),
  kind: z.string().trim().max(40).default("product"),
  task_type: z.string().trim().min(1).max(40),
  metrics: z.record(z.string(), metric),
  run_date: z.string().trim().min(4).max(20),
  sample_size: z.number().int().min(1).max(10000).default(1),
  judge: z.string().trim().max(80).default(""),
  source_label: z.string().trim().max(160).default("自动化 CLI 实测"),
  source_url: z.string().trim().url().max(500).or(z.literal("")).default(""),
  source_by: z.string().trim().max(120).default("自动回填"),
  method: z.string().trim().max(2000).default(""),
  params: z.record(z.string(), z.unknown()).default({}),
  tool_log: z.string().trim().max(8000).default(""),
  rationale: z.string().trim().max(4000).default(""),
  note: z.string().trim().max(200).default(""),
});

const bodySchema = z.object({ runs: z.array(itemSchema).min(1).max(50) });

function nextDate(date: string, cadence: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (cadence === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3);
  else if (cadence === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else return date;
  return d.toISOString().slice(0, 10);
}

export const Route = createFileRoute("/api/public/eval-ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["LOVABLE_CRON_SECRET"];
        const token = request.headers.get("x-eval-token") ?? "";
        if (!expected || token !== expected) {
          return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const rows = parsed.runs.map((r) => ({
          suite: r.suite,
          agent_name: r.agent_name,
          vendor: r.vendor,
          kind: r.kind,
          task_type: r.task_type,
          metrics: r.metrics,
          source_label: r.source_label,
          source_url: r.source_url || null,
          source_by: r.source_by,
          method: r.method,
          run_date: r.run_date,
          sample_size: r.sample_size,
          judge: r.judge,
          params: r.params as Json,
          tool_log: r.tool_log,
          rationale: r.rationale,
          note: r.note,
          status: "approved",
          submitted_by: r.source_by,
        }));

        const { data, error } = await supabaseAdmin
          .from("eval_runs")
          .insert(rows)
          .select("id, agent_name");
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        // 排期滚动：本次跑过的模型，把到期排期标记完成并顺延到下个周期
        for (const r of parsed.runs) {
          const { data: sched } = await supabaseAdmin
            .from("eval_schedule")
            .select("id, cadence, planned_date")
            .eq("agent_name", r.agent_name)
            .eq("suite", r.suite)
            .neq("status", "done")
            .order("planned_date", { ascending: true })
            .limit(1);
          const s = sched?.[0];
          if (!s) continue;
          const next = nextDate(r.run_date, s.cadence);
          await supabaseAdmin
            .from("eval_schedule")
            .update(
              s.cadence === "once" ? { status: "done" } : { status: "planned", planned_date: next },
            )
            .eq("id", s.id);
        }

        return new Response(JSON.stringify({ ok: true, inserted: data?.length ?? 0 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
