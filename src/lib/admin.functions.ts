/**
 * AgentBench 智衡 · 审核后台服务端函数
 *
 * - checkAdmin：当前登录用户是否为管理员
 * - listPendingRuns：待审核提交列表
 * - setRunStatus：通过 / 拒绝一条提交
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PENDING_COLUMNS =
  "id, suite, agent_name, vendor, kind, task_type, metrics, source_label, source_url, source_by, method, run_date, sample_size, judge, params, tool_log, rationale, note, status, submitted_by, created_at";

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) return { isAdmin: false, error: error.message };
    return { isAdmin: Boolean(data), error: null as string | null };
  });

export const listPendingRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("eval_runs")
      .select(PENDING_COLUMNS)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { rows: [], error: error.message };
    return { rows: data ?? [], error: null as string | null };
  });

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export const setRunStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof statusInput>) => statusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("eval_runs")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });
