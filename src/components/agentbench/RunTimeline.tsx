import { useState } from "react";

export interface TimelineStep {
  index: number;
  title: string;
  detail: string;
  ms: number | null;
  status: "ok" | "fail" | "unknown";
}

const DUR = /(\d+(?:\.\d+)?)\s*(ms|毫秒|s|秒|m|分钟)\b/i;
const FAIL = /(fail|error|失败|错误|timeout|超时|denied|拒绝)/i;
const OK = /(ok\b|success|passed|完成|成功)/i;

const toMs = (n: number, unit: string) => {
  const u = unit.toLowerCase();
  if (u === "ms" || u === "毫秒") return n;
  if (u === "m" || u === "分钟") return n * 60000;
  return n * 1000;
};

/** 把自由格式的工具调用日志解析成可展开的步骤 */
export function parseToolLog(log: string): TimelineStep[] {
  const text = (log ?? "").trim();
  if (!text) return [];

  // 1) 结构化 JSON：[{ tool, input, output, ms, status }]
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j) && j.length) {
      return j.map((raw, i) => {
        const o = (raw ?? {}) as Record<string, unknown>;
        const s = String(o["status"] ?? "");
        return {
          index: i + 1,
          title: String(o["tool"] ?? o["name"] ?? o["step"] ?? `步骤 ${i + 1}`),
          detail: [o["input"], o["args"], o["output"], o["result"], o["note"]]
            .filter((v) => v != null && v !== "")
            .map((v) => (typeof v === "string" ? v : JSON.stringify(v, null, 2)))
            .join("\n"),
          ms:
            typeof o["ms"] === "number"
              ? (o["ms"] as number)
              : typeof o["duration_ms"] === "number"
                ? (o["duration_ms"] as number)
                : typeof o["seconds"] === "number"
                  ? (o["seconds"] as number) * 1000
                  : null,
          status: FAIL.test(s) ? "fail" : OK.test(s) || s === "" ? (s ? "ok" : "unknown") : "unknown",
        } satisfies TimelineStep;
      });
    }
  } catch {
    /* 不是 JSON，走文本解析 */
  }

  // 2) 文本日志：按“新步骤起始行”分块
  const lines = text.split(/\r?\n/);
  const isHead = (l: string) =>
    /^\s*(?:[-*]|\d+[.)]|#{1,3}|\[\d+\]|step\s*\d+|第\s*\d+\s*步)/i.test(l);
  const blocks: string[][] = [];
  for (const l of lines) {
    if (!l.trim()) continue;
    if (isHead(l) || blocks.length === 0) blocks.push([l]);
    else blocks[blocks.length - 1]!.push(l);
  }

  return blocks.map((b, i) => {
    const head = (b[0] ?? "")
      .replace(/^\s*(?:[-*]|\d+[.)]|#{1,3}|\[\d+\]|step\s*\d+[:：]?|第\s*\d+\s*步[:：]?)\s*/i, "")
      .trim();
    const whole = b.join("\n");
    const m = whole.match(DUR);
    return {
      index: i + 1,
      title: (head || `步骤 ${i + 1}`).slice(0, 120),
      detail: b.slice(1).join("\n").trim() || (head.length > 120 ? head : ""),
      ms: m ? toMs(parseFloat(m[1]!), m[2]!) : null,
      status: FAIL.test(whole) ? "fail" : OK.test(whole) ? "ok" : "unknown",
    } satisfies TimelineStep;
  });
}

const fmt = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`);

const DOT: Record<TimelineStep["status"], string> = {
  ok: "bg-brand",
  fail: "bg-red-500",
  unknown: "bg-text-3",
};

export function RunTimeline({ log }: { log: string }) {
  const steps = parseToolLog(log);
  const [open, setOpen] = useState<number[]>([]);
  const allOpen = open.length === steps.length && steps.length > 0;

  if (!steps.length) return null;

  const maxMs = Math.max(1, ...steps.map((s) => s.ms ?? 0));
  const total = steps.reduce((n, s) => n + (s.ms ?? 0), 0);

  return (
    <div className="ab-panel bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] font-bold">评测流程（{steps.length} 步）</div>
        <div className="flex items-center gap-3 text-[11.5px] text-text-3">
          {total > 0 && <span className="metric">总耗时 {fmt(total)}</span>}
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1 text-[11.5px] text-text-2 hover:border-brand hover:text-brand"
            onClick={() => setOpen(allOpen ? [] : steps.map((s) => s.index))}
          >
            {allOpen ? "全部收起" : "全部展开"}
          </button>
        </div>
      </div>

      <ol className="relative space-y-1 border-l border-border pl-4">
        {steps.map((s) => {
          const isOpen = open.includes(s.index);
          return (
            <li key={s.index} className="relative">
              <span
                className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ${DOT[s.status]}`}
                aria-hidden
              />
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((o) => (o.includes(s.index) ? o.filter((x) => x !== s.index) : [...o, s.index]))
                }
                className="w-full rounded-lg px-2 py-2 text-left hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-foreground">
                    {s.index}. {s.title}
                  </span>
                  {s.ms != null && (
                    <span className="metric shrink-0 text-[11.5px] text-text-3">{fmt(s.ms)}</span>
                  )}
                </div>
                {s.ms != null && (
                  <div className="mt-1.5 h-1 w-full rounded bg-surface-2">
                    <div
                      className="h-1 rounded bg-brand"
                      style={{ width: `${Math.max(3, (s.ms / maxMs) * 100)}%` }}
                    />
                  </div>
                )}
              </button>
              {isOpen && s.detail && (
                <pre className="mx-2 mb-2 whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-[12px] leading-5 text-text-2">
                  {s.detail}
                </pre>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
