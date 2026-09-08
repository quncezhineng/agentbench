import { Fragment } from "react";

/* ================================================================
 * 首页方法论区块：LoopArena 评测机制
 * 覆盖：机制（Controller/Worker/Reporter）→ 三级评测 → 评测链路 → 指标 → 范围
 * ================================================================ */

function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="ab-section-head">
      <div className="max-w-[820px]">
        <div className="ab-chip ab-chip-brand mb-3">{eyebrow}</div>
        <h2 className="ab-section-title">{title}</h2>
        <p className="ab-section-desc mt-2">{desc}</p>
      </div>
    </div>
  );
}

function SubTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-[12.5px] leading-6 text-text-2">{desc}</p>
    </div>
  );
}

/* ================================================================
 * 机制：三个角色 + 两个核心对象
 * ================================================================ */

const ROLES = [
  {
    key: "Controller",
    tone: "bg-brand-soft text-brand",
    who: "被评测模型",
    d: "只读 Evidence Packet，输出 Loop Contract（advance / verify / stop）。不持有任何编码工具，唯一职责是「决定下一步干什么」——这正是被排序、被打分的对象。",
  },
  {
    key: "Worker",
    tone: "bg-info-soft text-info",
    who: "固定编码 Agent",
    d: "唯一能读写代码、运行命令的角色。全榜单统一用 Qwen3.7-Plus，从而把「执行能力」固定住，隔离出 Controller 的纯控制能力差异。",
  },
  {
    key: "Reporter",
    tone: "bg-ok-soft text-ok",
    who: "临时报告者",
    d: "复用 Worker 同款模型配置，从 Worker 对话副本 + 只读工作区生成四段式报告（任务上下文 / 已完成工作 / 验证证据 / 遗留问题），作为下一轮 Evidence Packet 的原料。",
  },
];

const OBJECTS = [
  {
    en: "Evidence Packet",
    zh: "证据包",
    d: "Controller 收到的结构化只读摘要。它不读原始长对话，只看 Reporter 提炼的浓缩证据——控制模型不背「读长上下文」的锅。",
  },
  {
    en: "Loop Contract",
    zh: "循环契约",
    d: "Controller 的输出契约，三种动作：advance（继续，附下一条 assignment）、verify（要求验证）、stop（判断已达成/已放弃）。advance 会被渲染成 Worker 的下一条指令。",
  },
];

export function Mechanism() {
  return (
    <section id="mechanism" className="ab-container ab-section">
      <SectionHead
        eyebrow="Mechanism"
        title="Controller 与 Worker 分开测"
        desc="LoopArena 把「控制」和「执行」拆成两个 Agent：Controller 只决策、Worker 只动手。被评的是 Controller，不是整个系统。"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.key} className="ab-panel bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold ${r.tone}`}>
                {r.key}
              </span>
              <span className="text-[11.5px] font-semibold text-text-3">{r.who}</span>
            </div>
            <p className="mt-3 text-[12.5px] leading-6 text-text-2">{r.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {OBJECTS.map((o) => (
          <div key={o.en} className="ab-panel bg-white p-5 sm:p-6">
            <SubTitle title={`${o.en} · ${o.zh}`} desc={o.d} />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface-2 px-5 py-4 text-[12.5px] leading-6 text-text-2">
        <b className="text-foreground">一句话理解：</b>传统基准把「模型 + 工具 + 提示」捆成一个
        黑盒一起打分；LoopArena 把<b className="text-brand"> Controller（决策）</b>
        单独拎出来测，Worker 固定，于是分数差只反映「控制能力」的差。
      </div>
    </section>
  );
}

/* ================================================================
 * 三级评测：Type I / II / III
 * ================================================================ */

const TIER_ROWS = [
  {
    key: "Type I",
    name: "合同选择",
    desc: "四选一：给定同一 Evidence Packet，Controller 从四个候选 Loop Contract 里挑最正确的一个。候选答案在构建时已真实执行验证，评测时零 Worker 运行，成本最低、最快。",
    metric: "Contract Accuracy（合同准确率）",
    cost: "0（无 Worker 执行）",
    tone: "bg-info-soft text-info",
  },
  {
    key: "Type II",
    name: "任务切片",
    desc: "从准备好的中间工作区起步，跑真实 Controller–Worker 闭环，但执行范围更短。它是「低成本、仍保留闭环」的替代档位，用于快速比较。",
    metric: "SSR（严格成功率）+ 估算成本",
    cost: "约比 Type III 低 64.4%",
    tone: "bg-brand-soft text-brand",
  },
  {
    key: "Type III",
    name: "完整任务",
    desc: "从原始状态开始跑完整编码任务，是最终标准。Controller 必须全程在实现、验证、恢复、停止之间自适应切换，难度最高。",
    metric: "SSR（严格成功率）+ 估算成本",
    cost: "最贵 · 主排序档位",
    tone: "bg-ok-soft text-ok",
  },
];

export function Tiers() {
  return (
    <section id="tiers" className="ab-container ab-section">
      <SectionHead
        eyebrow="Three Tiers"
        title="三级评测：从「单决策」到「完整任务」"
        desc="同一批 Controller 在三个档位上各测一次，用成本递减的方式逼近同一结论。"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {TIER_ROWS.map((t) => (
          <div key={t.key} className="ab-panel bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className={`rounded-lg px-2 py-0.5 font-mono text-[12px] font-bold ${t.tone}`}>
                {t.key}
              </span>
              <span className="text-[12px] font-semibold text-text-3">{t.name}</span>
            </div>
            <p className="mt-3 text-[12.5px] leading-6 text-text-2">{t.desc}</p>
            <div className="mt-4 space-y-2 border-t border-dashed border-border pt-3">
              <div className="flex justify-between gap-3 text-[12px]">
                <span className="text-text-3">指标</span>
                <span className="text-right font-semibold text-text-2">{t.metric}</span>
              </div>
              <div className="flex justify-between gap-3 text-[12px]">
                <span className="text-text-3">成本</span>
                <span className="text-right font-semibold text-text-2">{t.cost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white px-5 py-4 text-[12.5px] leading-6 text-text-2">
        <b className="text-foreground">关键结论：</b>Type II 与 Type III 的 Controller 排名高度一致
        （Spearman&apos;s ρ = <b className="text-brand">0.9747</b>），说明任务切片能大幅省成本、
        又不失真地复现完整任务结论；但 Type III 仍是最终标准。
      </div>
    </section>
  );
}

/* ================================================================
 * 评测链路：内循环 vs 外循环
 * ================================================================ */

const FLOW_STEPS = [
  { t: "Evidence Packet", d: "结构化摘要" },
  { t: "Controller", d: "输出 Loop Contract" },
  { t: "Worker", d: "执行 assignment" },
  { t: "Reporter", d: "四段式报告" },
  { t: "下一轮", d: "循环或 stop" },
];

const LOOPS = [
  {
    t: "内循环 · Worker ReAct",
    d: "Worker 自己思考—行动—观察，反复迭代直到完成当前 assignment 或无法继续。这一步被固定住，所有 Controller 共享同一个 Worker。",
  },
  {
    t: "外循环 · Controller 控制",
    d: "Controller 每轮收到最新 Evidence Packet，决定 advance / verify / stop。它决定整个任务何时继续、何时验收、何时收手——这才是被评测的能力。",
  },
];

export function Pipeline() {
  return (
    <section id="pipeline" className="ab-container ab-section">
      <SectionHead
        eyebrow="Pipeline"
        title="双层循环：内层执行，外层控制"
        desc="一个分数的诞生，是「Controller 决策 → Worker 执行 → Reporter 汇报」反复闭环的结果。"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="控制闭环" desc="每一轮都经过五个环节，直到 Controller 输出 stop" />
          <div className="mt-4 flex flex-wrap items-center gap-y-2">
            {FLOW_STEPS.map((s, i) => (
              <Fragment key={s.t}>
                <span className="rounded-lg border border-border bg-white px-2.5 py-1.5">
                  <span className="block text-[11px] font-bold leading-none text-foreground">
                    {s.t}
                  </span>
                  <span className="mt-1 block text-[9.5px] leading-none text-text-3">{s.d}</span>
                </span>
                {i < FLOW_STEPS.length - 1 && (
                  <span className="mx-1 text-[11px] text-text-3">→</span>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="内循环 vs 外循环" desc="二者分工，隔离出「控制能力」这个被评对象" />
          <div className="mt-3 space-y-2">
            {LOOPS.map((l) => (
              <div
                key={l.t}
                className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5"
              >
                <div className="text-[12.5px] font-semibold text-foreground">{l.t}</div>
                <p className="mt-1 text-[12px] leading-5 text-text-2">{l.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
 * 指标与参考策略
 * ================================================================ */

const METRIC_ROWS = [
  {
    k: "SSR · Strict Success Rate",
    d: "既通过任务 evaluator、又符合 LoopArena 协议（Controller 恰当时机 stop、Worker 未越界）才算成功。比传统「通过测试」更严。",
  },
  {
    k: "估算推理成本",
    d: "$/run，无缓存口径，把 Worker、Reporter、Controller 三者的推理成本都算进去。强度相近时，便宜者胜。",
  },
  {
    k: "Spearman ρ",
    d: "Type II 与 Type III 排名相关性，论文实测 0.9747——用于证明低成本档位不失真。",
  },
];

const REF_POLICIES = [
  {
    name: "No control",
    d: "没有 Controller，Worker 直接自主执行。用于回答「闭环控制到底有没有用」。",
  },
  {
    name: "Fixed control",
    d: "不读 Evidence Packet、不调模型，只机械重申任务目标。用于区分「真控制」与「假装控制」。",
  },
];

export function Metrics() {
  return (
    <section id="metrics" className="ab-container ab-section">
      <SectionHead
        eyebrow="Metrics"
        title="指标口径与参考策略"
        desc="SSR 判「强不强」，成本判「省不省」，参考策略判「控制到底有没有用」。"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="三个核心指标" desc="每个分数都有明确定义与口径" />
          <div className="mt-3">
            {METRIC_ROWS.map((m, i) => (
              <div
                key={m.k}
                className={`flex gap-3 py-3 ${i > 0 ? "border-t border-border/80" : "pt-1"}`}
              >
                <span className="mt-0.5 h-3.5 w-1 shrink-0 rounded-full bg-brand" />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold tracking-tight">{m.k}</div>
                  <p className="mt-0.5 text-[12.5px] leading-[1.65] text-text-2">{m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="参考策略（不参与排名）"
            desc="两条基线共用同一个 Worker，用于定位「Controller 的价值」"
          />
          <div className="mt-3 space-y-2">
            {REF_POLICIES.map((r) => (
              <div key={r.name} className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
                <div className="font-mono text-[12.5px] font-bold text-brand">{r.name}</div>
                <p className="mt-1 text-[12px] leading-5 text-text-2">{r.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-5 text-text-3">
            论文观察：Fixed control 在 Type II 上把 No control 的 39.51% 拉到 46.91%，但 Type III
            两者都只有 18.52%——<b className="text-text-2">机械重申目标只能帮有限切片，完整任务需要能自适应切换的控制。</b>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
 * 范围：为什么只评编程智能体
 * ================================================================ */

export function Scope() {
  return (
    <section id="scope" className="ab-container ab-section">
      <SectionHead
        eyebrow="Scope"
        title="为什么榜单只评编程智能体"
        desc="LoopArena 是一个面向「编程任务」的基准——它的 Worker 动作空间是编码与运行命令。把范围收窄到编程智能体，才能保证口径一致、可比。"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ab-panel bg-white p-5">
          <div className="text-[13px] font-semibold">动作空间匹配</div>
          <p className="mt-2 text-[12.5px] leading-6 text-text-2">
            拿编码基准去评客服/研究 Agent 没有意义。LoopArena 的 Worker 只会「写代码 + 跑命令」，只有编程智能体落在这个动作空间里。
          </p>
        </div>
        <div className="ab-panel bg-white p-5">
          <div className="text-[13px] font-semibold">隔离控制能力</div>
          <p className="mt-2 text-[12.5px] leading-6 text-text-2">
            固定 Worker 后，分数差只来自 Controller 的控制能力。跨场景会引入完全不同的动作空间，破坏这一隔离。
          </p>
        </div>
        <div className="ab-panel bg-white p-5">
          <div className="text-[13px] font-semibold">主流产品聚焦</div>
          <p className="mt-2 text-[12.5px] leading-6 text-text-2">
            Claude Code、Codex、Cursor 等当前主流智能体都以「编程」为核心场景，聚焦这里对用户最有参考价值。
          </p>
        </div>
      </div>
    </section>
  );
}
