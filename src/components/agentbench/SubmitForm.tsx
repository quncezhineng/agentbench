/**
 * AgentBench 智衡 · 评测结果提交表单
 *
 * 任何人都可以提交；提交后进入「待审核」队列，审核通过后自动出现在榜单、雷达图与维度表里。
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitEvalRun, submitSchema } from "@/lib/eval-runs.functions";
import { runsQuery, TASK_LABEL } from "@/lib/eval-queries";

const field =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-brand";
const label = "mb-1 block text-[11.5px] font-semibold text-text-2";

const EMPTY = {
  agent_name: "",
  vendor: "",
  suite: "cli" as "cli" | "looparena",
  task_type: "conv",
  success: "",
  tool: "",
  progress: "",
  efficiency: "",
  trust: "",
  run_date: new Date().toISOString().slice(0, 10),
  sample_size: "3",
  judge: "",
  source_label: "",
  source_url: "",
  method: "",
  params: "",
  tool_log: "",
  rationale: "",
  submitted_by: "",
};

export function SubmitForm() {
  const [f, setF] = useState({ ...EMPTY });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = useServerFn(submitEvalRun);
  const qc = useQueryClient();

  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const payload = {
      ...f,
      success: Number(f.success),
      tool: Number(f.tool),
      progress: Number(f.progress),
      efficiency: Number(f.efficiency),
      trust: Number(f.trust),
      sample_size: Number(f.sample_size),
    };
    const parsed = submitSchema.safeParse(payload);
    if (!parsed.success) {
      setMsg({
        ok: false,
        text: `请检查填写内容：${parsed.error.issues[0]?.message ?? "格式不正确"}`,
      });
      return;
    }
    setBusy(true);
    try {
      const res = await submit({ data: payload });
      if (res.ok) {
        setMsg({ ok: true, text: "已提交，进入待审核队列；审核通过后会自动出现在榜单上。" });
        setF({ ...EMPTY });
        await qc.invalidateQueries({ queryKey: runsQuery.queryKey });
      } else {
        setMsg({ ok: false, text: `提交失败：${res.error ?? "未知错误"}` });
      }
    } catch {
      setMsg({ ok: false, text: "提交失败，请稍后重试。" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="ab-panel bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={label} htmlFor="sf-name">
            智能体名称
          </label>
          <input
            id="sf-name"
            className={field}
            value={f.agent_name}
            maxLength={80}
            onChange={(e) => set("agent_name", e.target.value)}
            placeholder="例如 Cursor"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-vendor">
            厂商
          </label>
          <input
            id="sf-vendor"
            className={field}
            value={f.vendor}
            maxLength={80}
            onChange={(e) => set("vendor", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-suite">
            评测套件
          </label>
          <select
            id="sf-suite"
            className={field}
            value={f.suite}
            onChange={(e) => set("suite", e.target.value)}
          >
            <option value="cli">CLI 实测套件 v0</option>
            <option value="looparena">LoopArena</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="sf-task">
            任务类型
          </label>
          <select
            id="sf-task"
            className={field}
            value={f.task_type}
            onChange={(e) => set("task_type", e.target.value)}
          >
            {["conv", "os"].map((t) => (
              <option key={t} value={t}>
                {TASK_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        {(
          [
            ["success", "任务成功率"],
            ["tool", "工具调用准确率"],
            ["progress", "进度率"],
            ["efficiency", "效率"],
            ["trust", "可信与安全"],
          ] as const
        ).map(([k, l]) => (
          <div key={k}>
            <label className={label} htmlFor={`sf-${k}`}>
              {l}（0–100）
            </label>
            <input
              id={`sf-${k}`}
              className={field}
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={f[k]}
              onChange={(e) => set(k, e.target.value)}
              required
            />
          </div>
        ))}

        <div>
          <label className={label} htmlFor="sf-date">
            评测日期
          </label>
          <input
            id="sf-date"
            className={field}
            type="date"
            value={f.run_date}
            onChange={(e) => set("run_date", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-samples">
            样本量
          </label>
          <input
            id="sf-samples"
            className={field}
            type="number"
            min={1}
            value={f.sample_size}
            onChange={(e) => set("sample_size", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-judge">
            裁判 / 评分方式
          </label>
          <input
            id="sf-judge"
            className={field}
            value={f.judge}
            maxLength={80}
            onChange={(e) => set("judge", e.target.value)}
            placeholder="例如 claude"
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-src">
            数据来源说明
          </label>
          <input
            id="sf-src"
            className={field}
            value={f.source_label}
            maxLength={160}
            onChange={(e) => set("source_label", e.target.value)}
            placeholder="例如 自建 CLI 跑分 / 官方公开结果"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="sf-url">
            来源链接（可选）
          </label>
          <input
            id="sf-url"
            className={field}
            type="url"
            value={f.source_url}
            maxLength={500}
            onChange={(e) => set("source_url", e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="sf-by">
            提交人 / 联系方式（可选）
          </label>
          <input
            id="sf-by"
            className={field}
            value={f.submitted_by}
            maxLength={120}
            onChange={(e) => set("submitted_by", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <label className={label} htmlFor="sf-method">
            方法论 / 口径
          </label>
          <textarea
            id="sf-method"
            className={`${field} h-24`}
            value={f.method}
            maxLength={2000}
            onChange={(e) => set("method", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-params">
            运行参数
          </label>
          <textarea
            id="sf-params"
            className={`${field} h-24`}
            value={f.params}
            maxLength={2000}
            onChange={(e) => set("params", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-log">
            工具调用日志（可选）
          </label>
          <textarea
            id="sf-log"
            className={`${field} h-24`}
            value={f.tool_log}
            maxLength={8000}
            onChange={(e) => set("tool_log", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="sf-why">
            评分依据（可选）
          </label>
          <textarea
            id="sf-why"
            className={`${field} h-24`}
            value={f.rationale}
            maxLength={4000}
            onChange={(e) => set("rationale", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {busy ? "提交中…" : "提交评测结果"}
        </button>
        <span className="text-[12px] text-text-3">提交后进入待审核队列，通过后自动上榜。</span>
      </div>

      {msg && (
        <p className={`mt-3 text-[12.5px] ${msg.ok ? "text-brand" : "text-danger"}`} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}
