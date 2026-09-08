/**
 * AgentBench 智衡 · LoopArena 评测机制说明页（/eval）
 *
 * 本页是 LoopArena 机制的「方法参考」：解释 Controller/Worker/Reporter 三个角色、
 * Evidence Packet 与 Loop Contract 两个核心对象、Type I/II/III 三级评测、参考策略
 * 与指标口径，并给出论文数据来源与复现入口。不再包含旧的 LLM-as-Judge 跑分功能。
 */

import { CONTROLLERS, REFERENCES, fmtCost, fmtPct } from "@/lib/agentbench-data";

/* ---------- 小组件 ---------- */

function Eyebrow({ children }: { children: string }) {
  return <div className="ab-chip ab-chip-brand mb-3">{children}</div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ab-panel bg-white p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      <div className="mt-3 text-[12.5px] leading-6 text-text-2">{children}</div>
    </div>
  );
}

/* ---------- 三级评测表（论文 Table 2 真值） ---------- */

const TIER_TABLE = [
  { key: "Type I", head: "合同准确率", get: (a: (typeof CONTROLLERS)[number]) => fmtPct(a.r.type1Acc) },
  { key: "Type II", head: "SSR", get: (a: (typeof CONTROLLERS)[number]) => fmtPct(a.r.type2Ssr) },
  { key: "Type II", head: "成本", get: (a: (typeof CONTROLLERS)[number]) => fmtCost(a.r.type2Cost) },
  { key: "Type III", head: "SSR", get: (a: (typeof CONTROLLERS)[number]) => fmtPct(a.r.type3Ssr) },
  { key: "Type III", head: "成本", get: (a: (typeof CONTROLLERS)[number]) => fmtCost(a.r.type3Cost) },
];

export function LoopArenaExplainer() {
  return (
    <>
      {/* ================= 顶部引导 ================= */}
      <section className="ab-container ab-section pt-8 sm:pt-10">
        <div className="overflow-hidden rounded-[20px] border border-border ab-grid-bg">
          <div className="px-5 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ab-chip ab-chip-brand">LoopArena</span>
              <span className="ab-chip">Controller / Worker 分开测</span>
              <span className="ab-chip">Type I / II / III</span>
            </div>

            <h1 className="mt-4 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[36px]">
              LoopArena 评测机制
            </h1>
            <p className="mt-3 max-w-[760px] text-[14px] leading-7 text-text-2 sm:text-[15px]">
              LoopArena 把「编程智能体」拆成两个 Agent：<b className="text-foreground">Controller</b>
              只做决策、<b className="text-foreground">Worker</b> 只动手。被评测、被排序的是
              Controller——它读结构化证据，输出「下一步该干嘛」的 Loop Contract，全程不碰代码。
            </p>

            <div className="mt-5 grid gap-2 text-[12.5px] text-text-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-white/70 px-3.5 py-2.5">
                Worker 固定为 Qwen3.7-Plus，隔离出 Controller 的纯控制能力
              </div>
              <div className="rounded-xl border border-border/70 bg-white/70 px-3.5 py-2.5">
                三级评测用成本递减的方式逼近完整任务结论
              </div>
              <div className="rounded-xl border border-border/70 bg-white/70 px-3.5 py-2.5">
                严格成功率（SSR）= 通过测试 + 遵守协议
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 三个角色 ================= */}
      <section id="roles" className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <Eyebrow>Roles</Eyebrow>
            <h2 className="ab-section-title">三个角色：谁决策，谁动手</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Block title="Controller · 被评测模型">
            <p>
              只读 <b className="text-foreground">Evidence Packet</b>（结构化摘要），输出{" "}
              <b className="text-foreground">Loop Contract</b>，不持有任何编码工具。它的唯一职责是
              「决定下一步」——这正是被排序、被打分的对象。
            </p>
          </Block>
          <Block title="Worker · 固定编码 Agent">
            <p>
              唯一能读写代码、运行命令的角色。全榜单统一用 <b className="text-foreground">Qwen3.7-Plus</b>
              ，把「执行能力」固定住，让分数差只反映控制能力。
            </p>
          </Block>
          <Block title="Reporter · 临时报告者">
            <p>
              复用 Worker 同款模型配置，从 Worker 对话副本 + 只读工作区生成四段式报告（任务上下文 /
              已完成工作 / 验证证据 / 遗留问题），作为下一轮 Evidence Packet 的原料。
            </p>
          </Block>
        </div>
      </section>

      {/* ================= 两个核心对象 ================= */}
      <section id="objects" className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <Eyebrow>Core Objects</Eyebrow>
            <h2 className="ab-section-title">两个核心对象</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Block title="Evidence Packet · 证据包">
            <p>
              Controller 收到的结构化只读摘要。它不读原始长对话，只看 Reporter 提炼的浓缩证据——
              控制模型不背「读长上下文」的锅。
            </p>
          </Block>
          <Block title="Loop Contract · 循环契约">
            <p>
              Controller 的输出契约，三种动作：
              <b className="text-brand"> advance</b>（继续，附下一条 assignment）、
              <b className="text-brand"> verify</b>（要求验证）、
              <b className="text-brand"> stop</b>（判断已达成/已放弃）。advance 会被渲染成 Worker
              的下一条指令。
            </p>
          </Block>
        </div>
      </section>

      {/* ================= 三级评测 ================= */}
      <section id="tiers" className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <Eyebrow>Three Tiers</Eyebrow>
            <h2 className="ab-section-title">三级评测：Type I / II / III</h2>
            <p className="ab-section-desc mt-2">
              论文 Table 2 的真实结果。Type II 与 Type III 的排名高度一致（Spearman&apos;s ρ =
              0.9747）。
            </p>
          </div>
        </div>

        <div className="ab-panel overflow-hidden bg-white">
          <div className="ab-table-scroll">
            <table className="ab-data-table min-w-[760px] text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                    Controller
                  </th>
                  {TIER_TABLE.map((c, i) => (
                    <th
                      key={`${c.key}-${c.head}-${i}`}
                      className="border-b border-border px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3"
                    >
                      {c.key} · {c.head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTROLLERS.map((a) => (
                  <tr key={a.name} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{a.name}</span>
                      <span className="block text-[11px] text-text-3">{a.vendor}</span>
                    </td>
                    {TIER_TABLE.map((c, i) => (
                      <td
                        key={`${c.key}-${c.head}-${i}`}
                        className="metric px-4 py-3 text-right font-semibold"
                      >
                        {c.get(a)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 grid gap-3 text-[12.5px] leading-6 text-text-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <b className="text-foreground">Type I 合同选择：</b>四选一，候选答案在构建时已真实执行
            验证，评测时零 Worker 运行——只测「单个控制决策」。
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <b className="text-foreground">Type II 任务切片：</b>从准备好的中间工作区开始，跑真实
            闭环但范围更短，成本约比 Type III 低 64.4%。
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <b className="text-foreground">Type III 完整任务：</b>从原始状态开始，是最终标准；最强
            Controller 也只有 24.69% SSR。
          </div>
        </div>
      </section>

      {/* ================= 参考策略 ================= */}
      <section id="references" className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <Eyebrow>Reference Policies</Eyebrow>
            <h2 className="ab-section-title">参考策略与指标口径</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ab-panel bg-white p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold tracking-tight">参考策略（不参与排名）</h3>
            <div className="mt-3 space-y-2">
              {REFERENCES.map((r) => (
                <div key={r.name} className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12.5px] font-bold text-brand">{r.name}</span>
                    <span className="text-[11px] text-text-3">
                      Type II {fmtPct(r.r.type2Ssr)} · Type III {fmtPct(r.r.type3Ssr)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-text-2">{r.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="ab-panel bg-white p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold tracking-tight">指标口径</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-6 text-text-2">
              <li>
                <b className="text-foreground">SSR（Strict Success Rate）</b>：既通过任务 evaluator、
                又遵守 LoopArena 协议才算成功。
              </li>
              <li>
                <b className="text-foreground">估算推理成本</b>：$/run，无缓存口径，含 Worker /
                Reporter / Controller。
              </li>
              <li>
                <b className="text-foreground">Spearman ρ</b>：Type II 与 Type III 排名相关性 =
                0.9747。
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= 复现 ================= */}
      <section id="reproduce" className="ab-container ab-section pt-2">
        <div className="ab-section-head">
          <div>
            <Eyebrow>Reproduce</Eyebrow>
            <h2 className="ab-section-title">复现入口</h2>
          </div>
        </div>
        <div className="ab-panel bg-white p-5 sm:p-6">
          <p className="text-[12.5px] leading-6 text-text-2">
            官方仓库提供 Type I / Type III 的运行命令，支持 <code className="rounded bg-surface-2 px-1 font-mono text-[11.5px]">--preflight-only</code>
             、<code className="rounded bg-surface-2 px-1 font-mono text-[11.5px]">no-control</code>、
            <code className="rounded bg-surface-2 px-1 font-mono text-[11.5px]"> fixed-control</code> 等参数。
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl bg-surface-2/60 px-4 py-3">
            <pre className="font-mono text-[12px] leading-6 text-text-2">
{`looparena-type1-run   # Type I 合同选择（零 Worker 执行）
looparena-type3-run   # Type III 完整任务（最终标准）
# 支持 --preflight-only 预检、no-control / fixed-control 参考策略`}
            </pre>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/board" className="ab-button ab-button-primary">
              查看排行榜
            </a>
            <a href="/" className="ab-button ab-button-ghost">
              回到机制概览
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
