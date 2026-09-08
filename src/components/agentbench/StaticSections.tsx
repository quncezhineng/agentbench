import { Fragment } from "react";
import { AUDIT, DEFECTS, DIMS, SCENARIOS, type DimKey } from "@/lib/agentbench-data";

// 各维度的测量来源：评分器「依据什么证据」打分
// Outcome=环境的真实终态；Transcript=一次运行的过程轨迹（含中间状态）
const EVIDENCE: Record<DimKey, string> = {
  success: "Outcome 真实终态",
  stability: "由 success 推算",
  tool: "Transcript",
  progress: "Transcript + Outcome",
  efficiency: "Transcript",
  trust: "Transcript + 状态核验",
};

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

const cell =
  "border-b border-border/80 px-3.5 py-3 align-top text-[12.5px] leading-5 last:border-0";
const headCell =
  "border-b border-border px-3.5 py-2.5 text-left align-top text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3";

export function Methodology() {
  return (
    <section id="method" className="ab-container ab-section">
      <SectionHead
        eyebrow="Methodology"
        title="评测方法"
        desc="维度定义、权重模型与评分器组合——分数从哪来、怎么算、怎么解释，全部摊开在明面上。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 一级维度定义 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="一级维度定义" desc="每个维度独立打分（0–100），再按场景加权合成总分" />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[680px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>维度</th>
                  <th className={headCell}>定义</th>
                  <th className={headCell}>测量来源</th>
                  <th className={`${headCell} w-24`}>评分器</th>
                </tr>
              </thead>
              <tbody>
                {DIMS.map((d) => (
                  <tr key={d.key}>
                    <td className={`${cell} font-semibold whitespace-nowrap`}>
                      {d.name}
                      {d.derived && (
                        <span className="ml-1.5 rounded-md bg-chip px-1.5 py-0.5 text-[10px] font-bold text-text-3">
                          推算
                        </span>
                      )}
                    </td>
                    <td className={cell}>{d.desc}</td>
                    <td className={`${cell} whitespace-nowrap text-[12px] text-text-2`}>
                      {EVIDENCE[d.key]}
                    </td>
                    <td className={cell}>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          d.grader === "code"
                            ? "bg-info-soft text-info"
                            : "bg-brand-soft text-brand"
                        }`}
                      >
                        {d.grader === "code" ? "Code" : "Model"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            <b className="text-brand">总分</b> = Σ (维度得分 × 场景权重) ·{" "}
            <b className="text-brand">passᵏ</b> = pᵏ (k=3) · <b className="text-brand">pass@k</b> =
            1 − (1 − p)ᵏ
          </div>
          <p className="mt-3 text-[12px] leading-5 text-text-3">
            测量来源提示：成功率看环境的<b className="text-text-2">真实终态（Outcome）</b>
            ，而工具准确率、效率这类过程属性必须依赖
            <b className="text-text-2">Transcript（轨迹）</b>
            ——外部基准不发布 trace 时，这些维度往往只能标注「无公开来源」，而不是凭印象补值。
          </p>
        </div>

        {/* 场景差异化权重 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="场景差异化权重"
            desc="同一套维度，不同场景权重不同——这才是“针对性评测”"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[480px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>维度</th>
                  {SCENARIOS.map((s) => (
                    <th key={s.key} className={`${headCell} text-right`}>
                      {s.name.replace("智能体", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMS.map((d) => (
                  <tr key={d.key}>
                    <td className={`${cell} font-semibold whitespace-nowrap`}>{d.name}</td>
                    {SCENARIOS.map((s) => (
                      <td key={s.key} className={`${cell} text-right font-semibold tabular`}>
                        {s.weights[d.key]}%
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className={`${cell} font-bold text-brand`}>合计</td>
                  {SCENARIOS.map((s) => (
                    <td key={s.key} className={`${cell} text-right font-bold text-brand tabular`}>
                      {DIMS.reduce((a, d) => a + s.weights[d.key], 0)}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] leading-6 text-text-2">
            <b className="text-foreground">为什么这么配：</b>
            编码场景最看重“能不能一次跑通”，成功率 + 工具准确率占 60%；对话场景面向真实用户， 稳定性
            passᵏ 权重最高（30%）；研究与操作场景任务链长，进度率提到
            20%，用来区分“差一点”和“完全没动”。
          </p>
        </div>
      </div>

      {/* 指标口径与可靠性：pass@k vs passᵏ、非确定性为何必须多次运行 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* pass@k 与 passᵏ 对照 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="pass@k 与 passᵏ：两种口径，两种产品含义"
            desc="同一个「单次成功率 p」，换一种口径，结论完全相反（示例 p = 75%）"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[420px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>尝试 k</th>
                  <th className={headCell}>pass@k · 至少 1 次成功</th>
                  <th className={headCell}>passᵏ · 每次都成功</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>k = 1</td>
                  <td className={`${cell} tabular`}>75.0%</td>
                  <td className={`${cell} tabular`}>75.0%</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>k = 3</td>
                  <td className={`${cell} tabular`}>98.4%</td>
                  <td className={`${cell} tabular`}>42.2%</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>k = 10</td>
                  <td className={`${cell} tabular`}>≈ 100%</td>
                  <td className={`${cell} tabular`}>5.6%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12.5px] leading-5 text-text-2">
            k 越大，pass@k 越接近 100%（“只要能成功一次”）；passᵏ 反而随 k
            指数衰减（“每次都要成功”）。 同样是 75% 的单次成功率，k = 10 时两个口径相差约 94
            个百分点。
          </p>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            <b className="text-brand">怎么选</b>：有人把关可试错（代码补全 / 创意生成 / 研究辅助）→
            用 pass@k 衡量峰值能力；无人把关须零失误（自动客服 / 金融交易 / 内容审核）→ 用 passᵏ
            衡量稳定性。本站 <b className="text-brand">stability</b> 采用
            passᵏ（k=3），是解释性推算， 不等于独立实测。
          </div>
        </div>

        {/* 非确定性：为何必须多次运行 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="非确定性：同一个 Agent，两次跑分为什么不一样"
            desc="稳定成功的概率远低于单次成功——这是稳定性必须单独呈现的原因"
          />
          <div className="mt-3 space-y-2">
            <div className="flex gap-3 rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11px] font-bold text-brand">
                1
              </span>
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">采样随机性</b>
                ：带温度采样，同一条 prompt 两次生成就可能不同。
              </p>
            </div>
            <div className="flex gap-3 rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11px] font-bold text-brand">
                2
              </span>
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">措辞敏感</b>
                ：任务文本的细微差别，就可能改变 Agent 的整体行为。
              </p>
            </div>
            <div className="flex gap-3 rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11px] font-bold text-brand">
                3
              </span>
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">多轮蝴蝶效应</b>
                ：多轮任务里，早期一个微小偏差会沿轨迹放大，后续计划整体分叉。
              </p>
            </div>
            <div className="flex gap-3 rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11px] font-bold text-brand">
                4
              </span>
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">环境与时序</b>
                ：工具返回顺序、并发与中间状态，都会影响 Agent 的下一步决策。
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            成功率 82.7% 时：<b className="text-brand">pass³ ≈ 56.6%</b>
            （连续 3 次全成功）· <b className="text-brand">pass@3 ≈ 99.5%</b>
            （3 次里成功 1 次）——成功率高，不等于稳定可用。
          </div>
          <p className="mt-3 text-[12px] leading-5 text-text-3">
            应对：固定评测快照与 harness；同一任务多次运行再聚合（快速验证 3 次 / 正式评估 10 次 /
            关键任务 100 次）；按多次聚合与区间报告，而不是单点数字。
          </p>
        </div>
      </div>
    </section>
  );
}

export function Graders() {
  return (
    <section id="graders" className="ab-container ab-section">
      <SectionHead
        eyebrow="Graders"
        title="三类评分器"
        desc="Code / Model / Human 的组合与校准策略——没有哪一类能单独胜任，关键是分工。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 评分器对照 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="评分器对照" desc="分工明确，再以人工为基线持续校准" />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[560px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>类型</th>
                  <th className={headCell}>适用</th>
                  <th className={headCell}>优点 / 缺点</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>
                    <span className="mr-1.5 rounded-lg bg-info-soft px-2 py-0.5 text-[11px] font-bold text-info">
                      Code
                    </span>
                    基于代码
                  </td>
                  <td className={cell}>任务成功率、工具准确率、效率</td>
                  <td className={cell}>
                    <b className="text-ok">+</b> 快速、低成本、完全客观、可复现
                    <br />
                    <b className="text-risk">−</b> 死板，容易误杀未预料但有效的创新解法
                  </td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>
                    <span className="mr-1.5 rounded-lg bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                      Model
                    </span>
                    LLM-as-Judge
                  </td>
                  <td className={cell}>进度率、可信安全、沟通质量</td>
                  <td className={cell}>
                    <b className="text-ok">+</b> 依据结构化量规（Rubric）理解语义与推理逻辑
                    <br />
                    <b className="text-risk">−</b> 非确定性、成本高，需持续校准
                  </td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>
                    <span className="mr-1.5 rounded-lg bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">
                      Human
                    </span>
                    专家抽检
                  </td>
                  <td className={cell}>黄金标准、漂移校准、争议样本仲裁</td>
                  <td className={cell}>
                    <b className="text-ok">+</b> 唯一可信基线，可发现未预期的失败模式
                    <br />
                    <b className="text-risk">−</b> 慢、贵、不可规模化，只能抽样
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            <b className="text-brand">组合策略</b>：Code 评客观指标 → Model 按 Rubric 评语义质量 →
            Human 抽样 10–20% 计算一致率；一致率跌破阈值（如 85%）即判定自动评分器漂移，需重新校准。
          </div>
        </div>

        {/* 参考基准 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="参考基准（本榜数据来源）"
            desc="按 Agent 类型选择基准，而非一套基准打天下"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[560px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>Agent 类型</th>
                  <th className={headCell}>参考基准</th>
                  <th className={headCell}>评估重点</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>编码智能体</td>
                  <td className={cell}>
                    Terminal-Bench 2.0
                    <br />
                    SWE-bench Verified
                    <br />
                    Expert-SWE
                  </td>
                  <td className={cell}>测试是否通过、是否破坏现有功能、跨应用工作流</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>对话智能体</td>
                  <td className={cell}>τ-bench / τ²-Bench</td>
                  <td className={cell}>多轮意图提取、passᵏ 稳定性、规则合规率、交互轮数</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>研究与操作智能体</td>
                  <td className={cell}>
                    GAIA / WebArena
                    <br />
                    OSWorld-Verified
                    <br />
                    GDPval
                  </td>
                  <td className={cell}>多步工具链、信息源依据、浏览器与 OS 环境真实状态变更</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            <b className="text-brand">AgentBoard</b> 补充：进度率 / 探索效率 / 计划一致性
            <br />
            <b className="text-brand">六维能力拆解</b>：Memory · Planning · World Modeling ·
            Retrospection · Grounding · Spatial Navigation
          </div>
        </div>
      </div>
    </section>
  );
}

export function Audit() {
  return (
    <section id="audit" className="ab-container ab-section">
      <SectionHead
        eyebrow="Audit"
        title="数据版本与效度审计"
        desc="评测集是基础设施，不是一次性资产——清洗是一次性的，退化是持续的。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 基准审计台账 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="基准审计台账"
            desc="任何一个被用来做上线决策的评测集，都必须定期重新审计"
          />
          <div className="mt-2">
            {AUDIT.map((a, i) => (
              <div
                key={a.bench}
                className={`flex gap-3 py-3.5 ${i > 0 ? "border-t border-border/80" : ""}`}
              >
                {/* 状态色条：ok 绿 / risk 红 / 其余中性 */}
                <span
                  aria-hidden
                  className={`mt-1.5 h-3.5 w-1 shrink-0 rounded-full ${
                    a.st === "ok" ? "bg-ok" : a.st === "risk" ? "bg-risk" : "bg-border-strong"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  {/* 首行：基准名 + 类型 + 版本 | 审计状态徽章 */}
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13.5px] font-semibold tracking-tight">{a.bench}</span>
                      <span className="rounded-md bg-chip px-1.5 py-[1px] text-[10.5px] font-semibold text-text-3">
                        {a.type}
                      </span>
                      <span className="whitespace-normal text-[11.5px] leading-5 text-text-3">
                        {a.ver}
                      </span>
                    </div>
                    <span
                      className={`inline-flex shrink-0 whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                        a.st === "ok"
                          ? "bg-ok-soft text-ok"
                          : a.st === "risk"
                            ? "bg-risk-soft text-risk"
                            : "bg-chip text-text-3"
                      }`}
                    >
                      {a.stText}
                    </span>
                  </div>
                  {/* 已知风险说明 */}
                  <p className="mt-1.5 text-[12.5px] leading-[1.65] text-text-2">{a.note}</p>
                  {/* 处置建议（品牌色高亮） */}
                  <p className="mt-1.5 text-[12px] font-semibold leading-5 text-brand">
                    处置：{a.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] leading-6 text-text-2">
            审计结论不利时，要有勇气收回先前的推荐。本表随公开披露更新，新证据出现即改状态。
          </p>
        </div>

        {/* 基准缺陷 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="基准缺陷：四类构造问题"
            desc="任务构造缺陷会系统性扭曲分数（“数据污染”是另一个独立问题）"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[520px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>缺陷类型</th>
                  <th className={headCell}>表现</th>
                  <th className={headCell}>影响</th>
                </tr>
              </thead>
              <tbody>
                {DEFECTS.map((d) => (
                  <tr key={d.t}>
                    <td className={`${cell} font-semibold whitespace-nowrap`}>{d.t}</td>
                    <td className={cell}>{d.d}</td>
                    <td className={cell}>
                      <span
                        className={`inline-flex whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          d.tone === "risk" ? "bg-risk-soft text-risk" : "bg-warn-soft text-warn"
                        }`}
                      >
                        {d.e}能力
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            前三类让模型<b className="text-brand">显得比实际差</b>，第四类让模型
            <b className="text-brand">显得比实际好</b>。
            <br />
            成因都在<b className="text-brand">构造期</b>：基准多从开源 issue / PR
            历史中挖出，而那段历史本就不是为「干净隔离的考题」而写的。
          </div>
        </div>
      </div>

      {/* 解读口径 + 多信号补位：能力/回归评估 与 瑞士奶酪 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* 能力评估 vs 回归评估 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="能力评估 vs 回归评估：两套目的，都要存在"
            desc="一个回答“擅长做什么”，一个回答“还能做好以前能做的吗”"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[520px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>类型</th>
                  <th className={headCell}>问的问题</th>
                  <th className={headCell}>通过率预期</th>
                  <th className={headCell}>典型用途</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>能力评估</td>
                  <td className={cell}>这个 Agent 擅长做什么？</td>
                  <td className={cell}>从低开始爬</td>
                  <td className={cell}>榜单排行、能力天花板（本榜聚合的多为能力口径）</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>回归评估</td>
                  <td className={cell}>它还能做好以前能做的事吗？</td>
                  <td className={cell}>接近 100%</td>
                  <td className={cell}>上线门禁、每次改动的防回退验证</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            成熟后，通过率高的能力任务可以<b className="text-brand">“毕业”进回归套件</b>
            ——原来测“能不能做到”，之后测“是否还能稳定做到”。
          </div>
          <p className="mt-3 text-[12px] leading-5 text-text-3">
            饱和提示：当某个基准分数逼近 80–85% 且长期增速放缓，说明它对前沿改进的区分度在下降（如
            SWE-bench Verified 一年内从约 40% 涨到
            80%+）。此时该分数只适合回归监控，不宜再作为上线决策的
            唯一依据——审计台账会标注这类状态。
          </p>
        </div>

        {/* 瑞士奶酪：多信号补位 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="自动化不是全部：多信号补位（瑞士奶酪）"
            desc="任何单层都有“洞”（盲区），多层叠加才能互相补位"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[560px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>方法</th>
                  <th className={headCell}>能抓住的问题</th>
                  <th className={headCell}>盲区</th>
                  <th className={headCell}>适用阶段</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>自动化评估</td>
                  <td className={cell}>已知场景回归、每次改动即验证</td>
                  <td className={cell}>未知边界、与真实分布不符</td>
                  <td className={cell}>上线前 / CI</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>生产监控</td>
                  <td className={cell}>真实用户遇到的失败与分布漂移</td>
                  <td className={cell}>上线前看不到</td>
                  <td className={cell}>上线后</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>A/B 测试</td>
                  <td className={cell}>真实用户结果的整体差异</td>
                  <td className={cell}>说不清底层“为什么”</td>
                  <td className={cell}>有流量后</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>用户反馈</td>
                  <td className={cell}>未预料的严重问题</td>
                  <td className={cell}>稀疏、自选择、缺解释</td>
                  <td className={cell}>持续</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>轨迹人工审查</td>
                  <td className={cell}>质量细节、评分器是否判对</td>
                  <td className={cell}>无法规模化</td>
                  <td className={cell}>每周抽样</td>
                </tr>
                <tr>
                  <td className={`${cell} font-semibold whitespace-nowrap`}>系统性人工研究</td>
                  <td className={cell}>校准 LLM 评分器、评主观输出</td>
                  <td className={cell}>慢且贵、需专家</td>
                  <td className={cell}>定期</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] leading-6 text-text-2">
            <b className="text-foreground">对本工作台的含义：</b>
            榜单上的自动化数字只是“信号之一”。Agent
            上线后若出现生产监控漂移或用户反馈集中回归，应回到
            对应基准重跑回归评估并更新审计台账，而不是只盯着聚合页上的数字。
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
 * 评测链路：#pipeline
 * 解释「一个分数是怎么诞生的」——执行层与聚合层分离、核心术语、
 * 以及两个最容易翻车的推论（评系统不评模型 / 评 Outcome 不评 Transcript）。
 * ================================================================ */

const FLOW_STEPS = [
  { t: "Task", d: "一道考题" },
  { t: "Trial × n", d: "多次运行" },
  { t: "Transcript · Outcome", d: "过程 + 终态" },
  { t: "Grader", d: "判分" },
  { t: "pass@k / passᵏ", d: "口径" },
  { t: "六维加权", d: "榜单分" },
];

const GLOSSARY = [
  { en: "Task", zh: "考题", d: "有明确输入与成功标准的单个测试用例，即外部基准的“题目”单元。" },
  {
    en: "Trial",
    zh: "尝试",
    d: "对同一 Task 的一次运行。模型输出有随机性，需多次 Trial 才能得到稳定估计。",
  },
  { en: "Transcript", zh: "转录", d: "一次运行的完整轨迹：推理、工具调用、中间结果、消息序列。" },
  {
    en: "Outcome",
    zh: "终态",
    d: "试验结束时环境的真实状态：数据库记录、文件系统、UI / 页面状态。",
  },
  {
    en: "Grader",
    zh: "评分器",
    d: "对某方面表现打分的逻辑；一个 Task 可挂多个 Grader，分 Code / Model / Human。",
  },
  {
    en: "Harness",
    zh: "执行框架",
    d: "让模型能作为 Agent 运行的系统（工具编排 + 环境）；评估的是“模型 + Harness”。",
  },
];

export function EvalPipeline() {
  return (
    <section id="pipeline" className="ab-container ab-section">
      <SectionHead
        eyebrow="Pipeline"
        title="评测链路：一个分数是怎么诞生的"
        desc="从任务的执行到榜单上的分数，中间隔着两层——运行 Agent 的执行层，与沉淀结果的聚合层。本站属于结果聚合层。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 两层架构 + 一个分数的诞生 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="任务执行层 × 结果聚合层"
            desc="运行与沉淀分离：先对同一任务跑出多次试验，再把结果聚合成可比的分数"
          />

          {/* 执行层 */}
          <div className="mt-4 rounded-xl border border-border bg-surface-2/70 px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold tracking-tight">① 任务执行层</span>
              <span className="rounded-md bg-chip px-1.5 py-0.5 text-[10.5px] font-semibold text-text-3">
                上游 · 公开基准 / M2 自建
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.7] text-text-2">
              Harness 把模型变成能动手的 Agent（工具编排 + 环境），对 Task 跑出
              <b className="text-foreground"> Trial</b>，留下
              <b className="text-foreground"> Transcript</b>（过程轨迹）与
              <b className="text-foreground"> Outcome</b>（环境真实终态）。
            </p>
          </div>

          {/* 聚合层 */}
          <div className="mt-3 rounded-xl border border-brand/25 bg-brand-soft/70 px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold tracking-tight">② 结果聚合层</span>
              <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10.5px] font-bold text-brand">
                本项目所在层
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.7] text-text-2">
              不亲自跑 Trial：把公开结果做口径映射，换成统一的六维 0–100 分，推算
              <b className="text-foreground"> passᵏ</b>
              ，按场景加权得总分，再排序对比、标注来源并定期审计。
            </p>
          </div>

          {/* 一个分数的诞生 */}
          <div className="mt-4 rounded-xl border border-border px-4 py-3.5">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3">
              一个分数的诞生
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-y-2">
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
        </div>

        {/* 术语速查 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="术语速查" desc="先对齐语言，再谈分数——这些词在 Agent 评测里有专属含义" />
          <div className="mt-3">
            {GLOSSARY.map((g, i) => (
              <div
                key={g.en}
                className={`flex gap-3 py-3 ${i > 0 ? "border-t border-border/80" : "pt-1"}`}
              >
                <span className="w-[92px] shrink-0">
                  <span className="block font-mono text-[12px] font-bold leading-5 text-brand">
                    {g.en}
                  </span>
                  <span className="block text-[11px] leading-5 text-text-3">{g.zh}</span>
                </span>
                <p className="min-w-0 flex-1 text-[12.5px] leading-[1.7] text-text-2">{g.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            完整边界与推导细节见项目 Wiki「agentbench-evaluation.md」；Grader 属于执行层或 M2
            自建管线， 聚合层不重新打分，只做口径映射。
          </div>
        </div>
      </div>

      {/* 两个最容易翻车的推论 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="ab-panel bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-info-soft px-2 py-0.5 text-[11px] font-bold text-info">
              推论 ①
            </span>
            <h4 className="text-[13.5px] font-bold tracking-tight">评估的是系统，不只是模型</h4>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-[1.7] text-text-2">
            同一个模型挂在不同 Harness 上，成功率可以从约 30% 拉到 80%。所以“某模型在某基准得 X
            分”这句话不完整——必须连同 harness / 复现说明一起引用，这正是审计台账要求标注 harness
            版本的原因。
          </p>
        </div>
        <div className="ab-panel bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-warn-soft px-2 py-0.5 text-[11px] font-bold text-warn">
              推论 ②
            </span>
            <h4 className="text-[13.5px] font-bold tracking-tight">
              Transcript 会撒谎，Outcome 才是真相
            </h4>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-[1.7] text-text-2">
            订票 Agent 在 Transcript 里说“预订成功，订单号
            CA1234”，数据库却空空如也——判分应验证环境的 真实终态，而不是 Agent
            的自述。反向也一样：Opus 4.5 在 τ²-Bench 订票任务中利用政策漏洞帮用户
            省了钱，只因没走“标准流程”就被误判失败。
          </p>
          <p className="mt-2 text-[12px] font-semibold leading-5 text-brand">评结果，不评路径。</p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
 * Agent 类型：#agents
 * 四类 Agent 的差异化评估重点，以及它们如何归并到本站的三类场景。
 * ================================================================ */

type SceneKey = "coding" | "conv" | "os";

const AGENT_ROWS: { type: string; method: string; trap: string; scene: SceneKey }[] = [
  {
    type: "编码 Agent",
    method: "单元测试判正确性（fail-to-pass + pass-to-pass）；代码质量、工具使用再看 Transcript",
    trap: "别只测“能不能跑通”，还要查是否破坏既有功能",
    scene: "coding",
  },
  {
    type: "对话 Agent",
    method: "常用第二个 LLM 模拟用户；用 state check 验证“工单已解决 / 退款已处理”等真实终态",
    trap: "交互质量本身就是评估对象——“说得好”不等于“办成了”",
    scene: "conv",
  },
  {
    type: "研究 Agent",
    method: "无标准答案：声明有出处、关键事实覆盖率、信源质量，LLM rubric 看连贯与深度",
    trap: "“好”是主观的（调研 / 尽调 / 报告标准不同），rubric 需高频与人类专家校准",
    scene: "os",
  },
  {
    type: "计算机操作 Agent",
    method: "在真实或沙盒 GUI 环境运行：检查文件系统 / 数据库 / UI 状态是否真的改变",
    trap: "DOM 交互与截图交互存在 token-速度权衡，工具选择需要单独评估",
    scene: "os",
  },
];

const SCENE_META: Record<SceneKey, { name: string; tone: string }> = {
  coding: { name: "编码", tone: "bg-info-soft text-info" },
  conv: { name: "对话", tone: "bg-brand-soft text-brand" },
  os: { name: "研究与操作", tone: "bg-ok-soft text-ok" },
};

export function AgentTypes() {
  return (
    <section id="agents" className="ab-container ab-section">
      <SectionHead
        eyebrow="Agent Types"
        title="四类 Agent：评估重点各不相同"
        desc="按任务形态，业界常分四类：编码、对话、研究、计算机操作。本站归并为三场景，但各自的关键点要记清。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 四类对照表 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="四类 Agent 的差异评估"
            desc="评估手段要匹配任务形态，不能一套基准打天下"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[620px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>类型</th>
                  <th className={headCell}>典型评测手段</th>
                  <th className={headCell}>容易踩的坑</th>
                  <th className={`${headCell} w-20`}>归并场景</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_ROWS.map((r) => (
                  <tr key={r.type}>
                    <td className={`${cell} font-semibold whitespace-nowrap`}>{r.type}</td>
                    <td className={cell}>{r.method}</td>
                    <td className={cell}>{r.trap}</td>
                    <td className={`${cell} whitespace-nowrap`}>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          SCENE_META[r.scene].tone
                        }`}
                      >
                        {SCENE_META[r.scene].name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            <b className="text-brand">归并逻辑</b>
            ：研究与计算机操作合并为「研究与操作」——二者都要检查环境的
            真实终态，评估手段相近；但解释分数时仍应区分桌面操作与长程研究任务，以条目内
            <b className="text-brand"> src 标注的基准</b>为准，勿跨基准混比。
          </div>
        </div>

        {/* 要点速记 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="速记：别掉进这些坑" desc="四条来自真实踩坑的提醒，对照上面的表更有效" />
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">用单轮分数冒充多轮能力：</b>
                单轮测“知识”，多轮才测“能力”——规划、执行、纠错，而且错误会沿轨迹传播。
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">研究类只评“流畅”不看信源：</b>
                LLM rubric 好看 ≠ 结论可靠；信源质量与关键事实覆盖率比文笔更重要，且需人工抽样校准。
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">操作类只信 Agent 自述：</b>
                状态没改变就不算完成——回到推论 ②：Outcome 才是真相。
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/70 px-3.5 py-2.5">
              <p className="text-[12.5px] leading-5 text-text-2">
                <b className="font-semibold text-foreground">一套基准打天下：</b>
                选基准要匹配“动作空间与任务分布”——拿编码基准去评客服 Agent，得到的分数没有意义。
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            一句话选型：先定任务形态 → 再选动作空间匹配的基准 → 最后按场景权重加权看排名。
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
 * 落地路线：#roadmap
 * 从 0 到 1 搭一套自己的评测（M2 规划参考，非当前已实现功能）。
 * ================================================================ */

const ROADMAP_STEPS = [
  {
    n: 0,
    t: "尽早开始，不要等完美",
    d: "20–50 个来自真实失败的任务即可起步（80/20 法则）。",
  },
  {
    n: 1,
    t: "先把“手动测的”自动化",
    d: "发版清单、线上 bug、客服工单按用户影响排序转成用例；不要先造完美框架。",
  },
  {
    n: 2,
    t: "写无歧义任务 + 参考解",
    d: "两个领域专家应得出相同判定；grader 要检查的一切，都应在任务描述里说清。",
  },
  {
    n: 3,
    t: "构建平衡的问题集",
    d: "“该触发的 / 不该触发的”各约 50%；用 precision / recall / F1 防偏。",
  },
  {
    n: 4,
    t: "稳定隔离的环境",
    d: "每次 Trial 从干净环境起跑，隔离残留文件、缓存、git 历史与共享资源。",
  },
  {
    n: 5,
    t: "设计评分器",
    d: "有客观答案优先 Code，开放任务用 Model + 人工校准；评结果，不评路径。",
  },
  {
    n: 6,
    t: "长期维护",
    d: "定期读 Transcript、监控能力饱和（通过率超过 85% 时应补难题）、评估驱动开发。",
  },
];

const FRAMEWORKS = [
  { name: "Harbor", d: "容器化大规模跑试验，Terminal-Bench 2.0 等经其发布" },
  { name: "Promptfoo", d: "轻量、YAML 配置，快速上手" },
  { name: "Braintrust", d: "离线评估 + 生产可观测" },
  { name: "LangSmith / Langfuse", d: "LangChain 生态 / 自托管链路" },
  { name: "Arize Phoenix", d: "开源 tracing + 离线 / 在线评估" },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="ab-container ab-section">
      <SectionHead
        eyebrow="Roadmap"
        title="从 0 到 1：落地一套自己的评测"
        desc="先跑起来，再谈完美。评测管线是长期资产，而不是一次性的建分活动。本节是 M2 规划的参考路线，不是当前已实现功能。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 起步步骤 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle title="起步步骤（0 → 6）" desc="每一步都给出关键结论与常见反例" />
          <div className="mt-2">
            {ROADMAP_STEPS.map((s) => (
              <div key={s.n} className="flex gap-3 border-b border-border/70 py-3 last:border-0">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-soft font-mono text-[11px] font-bold text-brand">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold tracking-tight">{s.t}</div>
                  <p className="mt-0.5 text-[12px] leading-[1.7] text-text-2">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 现成框架 + 提醒 */}
        <div className="ab-panel bg-white p-5 sm:p-6">
          <SubTitle
            title="现成框架（不想从零搭建时）"
            desc="工具只在加速，效果最终取决于任务质量"
          />
          <div className="mt-3">
            {FRAMEWORKS.map((f, i) => (
              <div
                key={f.name}
                className={`flex items-baseline gap-3 py-2.5 ${
                  i > 0 ? "border-t border-border/70" : ""
                }`}
              >
                <span className="w-[150px] shrink-0 font-mono text-[12.5px] font-bold text-brand">
                  {f.name}
                </span>
                <p className="min-w-0 flex-1 text-[12.5px] leading-[1.7] text-text-2">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-[12px] leading-6 text-text-2">
            框架只是加速。另外注意：工具定义（ACI）会直接影响 <b className="text-brand">tool</b>
            维度得分——工具文档与入参格式应像写代码一样被评审和测试。
            <br />
            成熟后记住<b className="text-brand">评估驱动开发</b>：先写评测定义能力，再迭代 Agent
            达标； 100% 的评估只能追回归，给不了改进信号。
          </div>
        </div>
      </div>

      {/* 收尾 CTA */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-surface-2/70 px-5 py-4">
        <p className="text-[13px] leading-6 text-text-2">
          已经有评测结果？到「自动化评测」页把数据接进共享榜单，用六维加权和场景权重跑一遍排名，再回头搭自己的管线。
        </p>
        <a href="/eval#data" className="ab-button ab-button-primary">
          打开自动化评测 · 接入数据
        </a>
      </div>
    </section>
  );
}
