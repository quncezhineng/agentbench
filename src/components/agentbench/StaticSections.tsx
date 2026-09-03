import { AUDIT, DEFECTS, DIMS, SCENARIOS } from "@/lib/agentbench-data";

function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
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
          <SubTitle
            title="一级维度定义"
            desc="每个维度独立打分（0–100），再按场景加权合成总分"
          />
          <div className="ab-table-scroll mt-4">
            <table className="ab-data-table min-w-[560px] text-[13px]">
              <thead>
                <tr>
                  <th className={headCell}>维度</th>
                  <th className={headCell}>定义</th>
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
            <b className="text-brand">passᵏ</b> = pᵏ (k=3) ·{" "}
            <b className="text-brand">pass@k</b> = 1 − (1 − p)ᵏ
          </div>
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
            编码场景最看重“能不能一次跑通”，成功率 + 工具准确率占 60%；对话场景面向真实用户，
            稳定性 passᵏ 权重最高（30%）；研究与操作场景任务链长，进度率提到 20%，用来区分“差一点”和“完全没动”。
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
            <b className="text-brand">组合策略</b>：Code 评客观指标 → Model 按 Rubric
            评语义质量 → Human 抽样 10–20% 计算一致率；一致率跌破阈值（如 85%）即判定自动评分器漂移，需重新校准。
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
                  <td className={`${cell} font-semibold whitespace-nowrap`}>
                    研究与操作智能体
                  </td>
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
                    a.st === "ok"
                      ? "bg-ok"
                      : a.st === "risk"
                        ? "bg-risk"
                        : "bg-border-strong"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  {/* 首行：基准名 + 类型 + 版本 | 审计状态徽章 */}
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13.5px] font-semibold tracking-tight">
                        {a.bench}
                      </span>
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
                          d.tone === "risk"
                            ? "bg-risk-soft text-risk"
                            : "bg-warn-soft text-warn"
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
    </section>
  );
}
