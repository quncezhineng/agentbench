/**
 * AgentBench 智衡 · 评测记录服务端读写
 *
 * - listEvalRuns / getEvalRun：公开读取「已审核」评测记录（匿名可读策略 + 服务端可发布密钥）
 * - listEvalSchedule：公开读取评测排期
 * - submitEvalRun：任何访客都可提交，强制写入 status = 'pending'，需后台审核后才上榜
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const RUN_COLUMNS =
  "id, suite, agent_name, vendor, kind, task_type, metrics, source_label, source_url, source_by, method, run_date, sample_size, judge, params, tool_log, rationale, note, created_at";

function publicClient(): SupabaseClient<Database> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** 已审核评测记录（榜单 / 结果页 / 来源页共用） */
export const listEvalRuns = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("eval_runs")
    .select(RUN_COLUMNS)
    .eq("status", "approved")
    .order("run_date", { ascending: false })
    .limit(1000);
  if (error) return { rows: [], error: error.message };
  return { rows: data ?? [], error: null as string | null };
});

/** 单条评测记录详情 */
export const getEvalRun = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("eval_runs")
      .select(RUN_COLUMNS)
      .eq("status", "approved")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { row: null, error: error.message };
    return { row: row ?? null, error: null as string | null };
  });

/** 评测排期 */
export const listEvalSchedule = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("eval_schedule")
    .select("id, agent_name, suite, planned_date, cadence, status, note")
    .order("planned_date", { ascending: true })
    .limit(200);
  if (error) return { rows: [], error: error.message };
  return { rows: data ?? [], error: null as string | null };
});

const num = z.number().min(0).max(100);

export const submitSchema = z.object({
  agent_name: z.string().trim().min(1).max(80),
  vendor: z.string().trim().max(80).default(""),
  suite: z.enum(["cli", "looparena"]),
  task_type: z.string().trim().min(1).max(40),
  success: num,
  tool: num,
  progress: num,
  efficiency: num,
  trust: num,
  run_date: z.string().trim().min(4).max(20),
  sample_size: z.number().int().min(1).max(10000),
  judge: z.string().trim().max(80).default(""),
  source_label: z.string().trim().min(1).max(160),
  source_url: z.string().trim().url().max(500).or(z.literal("")).default(""),
  method: z.string().trim().max(2000).default(""),
  params: z.string().trim().max(2000).default(""),
  tool_log: z.string().trim().max(8000).default(""),
  rationale: z.string().trim().max(4000).default(""),
  submitted_by: z.string().trim().max(120).default(""),
});

export type SubmitInput = z.input<typeof submitSchema>;

/** 提交评测结果：一律写入待审核队列 */
export const submitEvalRun = createServerFn({ method: "POST" })
  .inputValidator((d: SubmitInput) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { error } = await publicClient()
      .from("eval_runs")
      .insert({
        suite: data.suite,
        agent_name: data.agent_name,
        vendor: data.vendor,
        kind: "product",
        task_type: data.task_type,
        metrics: {
          success: data.success,
          tool: data.tool,
          progress: data.progress,
          efficiency: data.efficiency,
          trust: data.trust,
        },
        source_label: data.source_label,
        source_url: data.source_url || null,
        source_by: data.submitted_by || "访客提交",
        method: data.method,
        run_date: data.run_date,
        sample_size: data.sample_size,
        judge: data.judge,
        params: data.params ? { raw: data.params } : {},
        tool_log: data.tool_log,
        rationale: data.rationale,
        note: "",
        status: "pending",
        submitted_by: data.submitted_by,
      });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });
