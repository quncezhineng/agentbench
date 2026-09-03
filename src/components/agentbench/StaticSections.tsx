import { AUDIT, DEFECTS, DIMS, SCENARIOS } from "@/lib/agentbench-data";

const card = "bg-surface border border-border rounded-xl shadow-card p-5";
const mth =
  "text-left font-semibold text-text-3 text-[11px] px-2 py-2 border-b border-border tracking-wide";
const mtd = "px-2 py-2 border-b border-border align-top last:border-0";

function SecHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3 mb-2">
      <h2 className="text-[19px] font-bold tracking-tight">{title}</h2>
      <span className="text-[13px] text-text-3">{desc}</span>
    </div>
  );
}

export function Methodology() {
  return (
    <section id="method" className="mx-auto max-w-[1180px] px-6 my-10">
      <SecHead title="评测方法" desc="维度定义、权重模型与评分器组合" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h3 className="text-[14.5px] font-bold mb-1">一级维度定义</h3>
          <p className="text-[12px] text-text-3 mb-3.5">
            每个维度独立打分（0–100），再按场景加权合成总分
          </p>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <th className={mth}>维度</th>
                <th className={mth}>定义</th>
                <th className={mth}>评分器</th>
              </tr>
            </thead>
            <tbody>
              {DIMS.map((d) => (
                <tr key={d.key}>
                  <td className={`${mtd} font-semibold whitespace-nowrap`}>
                    {d.name}
                    {d.derived && (
                      <span className="ml-1.5 text-[10.5px] px-1.5 py-0.5 rounded bg-chip text-text-3 font-semibold">
                        推算
                      </span>
                    )}
                  </td>
                  <td className={mtd}>{d.desc}</td>
                  <td className={mtd}>
                    <span
                      className={`text-[10.5px] px-1.5 py-0.5 rounded font-bold ${
                        d.grader === "code" ? "bg-info-soft text-info" : "bg-brand-soft text-brand"
                      }`}
                    >
                      {d.grader === "code" ? "Code" : "Model"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-surface-2 border border-border rounded-lg px-3.5 py-3 font-mono text-[12.5px] text-text-2 mt-3 leading-loose">
            <b className="text-brand">总分</b> = Σ (维度得分 × 场景权重)
            <br />
            <b className="text-brand">passᵏ</b> = pᵏ (k=3，衡量连续 k 次全成功的稳定性)
            <br />
            <b className="text-brand">pass@k</b> = 1 − (1 − p)ᵏ (衡量至少成功一次的上限能力)
          </div>
        </div>

        <div className={card}>
          <h3 className="text-[14.5px] font-bold mb-1">场景差异化权重</h3>
          <p className="text-[12px] text-text-3 mb-3.5">
            同一套维度，不同场景权重不同——这才是"针对性评测"
          </p>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <th className={mth}>维度</th>
                {SCENARIOS.map((s) => (
                  <th key={s.key} className={`${mth} text-right`}>
                    {s.name.replace("智能体", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMS.map((d) => (
                <tr key={d.key}>
                  <td className={`${mtd} font-semibold whitespace-nowrap`}>{d.name}</td>
                  {SCENARIOS.map((s) => (
                    <td key={s.key} className={`${mtd} text-right font-semibold tabular`}>
                      {s.weights[d.key]}%
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className={`${mtd} font-semibold text-brand`}>合计</td>
                {SCENARIOS.map((s) => (
                  <td key={s.key} className={`${mtd} text-right font-bold text-brand tabular`}>
                    {DIMS.reduce((a, d) => a + s.weights[d.key], 0)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="text-[12px] text-text-3 mt-3 leading-relaxed">
            <b className="text-text-2">为什么这么配：</b>编码场景最看重"能不能一次跑通"，所以成功率 +
            工具准确率占 60%；对话场景面向真实用户，
            <b className="text-text-2">稳定性 passᵏ 权重最高（30%）</b>
            ，因为用户期望每次都可靠；研究与操作场景任务链长，
            <b className="text-text-2">进度率提到 20%</b>，用来区分"差一点"和"完全没动"。
          </p>
        </div>
      </div>
    </section>
  );
}

export function Graders() {
  return (
    <section id="graders" className="mx-auto max-w-[1180px] px-6 my-10">
      <SecHead title="三类评分器" desc="Code / Model / Human 的组合与校准策略" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h3 className="text-[14.5px] font-bold mb-1">评分器对照</h3>
          <p className="text-[12px] text-text-3 mb-3.5">没有哪一类能单独胜任，关键是分工</p>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <th className={mth}>类型</th>
                <th className={mth}>适用</th>
                <th className={mth}>优点 / 缺点</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${mtd} font-semibold whitespace-nowrap`}>
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded font-bold bg-info-soft text-info">
                    Code
                  </span>
                  <br />
                  基于代码
                </td>
                <td className={mtd}>任务成功率、工具准确率、效率</td>
                <td className={mtd}>
                  <b>+</b> 快速、低成本、完全客观、可复现
                  <br />
                  <b>−</b> 死板，容易误杀未预料但有效的创新解法
                </td>
              </tr>
              <tr>
                <td className={`${mtd} font-semibold whitespace-nowrap`}>
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded font-bold bg-brand-soft text-brand">
                    Model
                  </span>
                  <br />
                  LLM-as-Judge
                </td>
                <td className={mtd}>进度率、可信安全、沟通质量</td>
                <td className={mtd}>
                  <b>+</b> 依据结构化量规（Rubric）理解语义与推理逻辑
                  <br />
                  <b>−</b> 非确定性、成本高，需持续校准
                </td>
              </tr>
              <tr>
                <td className={`${mtd} font-semibold whitespace-nowrap`}>
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded font-bold bg-ok-soft text-ok">
                    Human
                  </span>
                  <br />
                  专家抽检
                </td>
                <td className={mtd}>黄金标准、漂移校准、争议样本仲裁</td>
                <td className={mtd}>
                  <b>+</b> 唯一可信基线，可发现未预期的失败模式
                  <br />
                  <b>−</b> 慢、贵、不可规模化，只能抽样
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[12px] text-text-3 mt-3 leading-relaxed">
            <b className="text-text-2">组合策略：</b>Code 评客观性指标 → Model 按结构化量规（Rubric）
            评语义质量 → Human 抽样 10–20% 计算与自动评分的一致率。当一致率跌破阈值（如 85%）时，
            说明自动评分器发生漂移，需要用人工结果重新校准 Rubric 与判分逻辑。
          </p>
        </div>

        <div className={card}>
          <h3 className="text-[14.5px] font-bold mb-1">参考基准（本榜数据来源）</h3>
          <p className="text-[12px] text-text-3 mb-3.5">按 Agent 类型选择基准，而非一套基准打天下</p>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <th className={mth}>Agent 类型</th>
                <th className={mth}>参考基准</th>
                <th className={mth}>评估重点</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${mtd} font-semibold whitespace-nowrap`}>编码智能体</td>
                <td className={mtd}>
                  Terminal-Bench 2.0
                  <br />
                  SWE-bench Verified
                  <br />
                  Expert-SWE
                </td>
                <td className={mtd}>测试是否通过、是否破坏现有功能、跨应用工作流</td>
              </tr>
              <tr>
                <td className={`${mtd} font-semibold whitespace-nowrap`}>对话智能体</td>
                <td className={mtd}>τ-bench / τ²-Bench</td>
                <td className={mtd}>多轮意图提取、passᵏ 稳定性、规则合规率、交互轮数</td>
              </tr>
              <tr>
                <td className={`${mtd} font-semibold whitespace-nowrap`}>研究与操作智能体</td>
                <td className={mtd}>
                  GAIA / WebArena
                  <br />
                  OSWorld-Verified
                  <br />
                  GDPval
                </td>
                <td className={mtd}>多步工具链、信息源依据、浏览器与 OS 环境真实状态变更</td>
              </tr>
            </tbody>
          </table>
          <div className="bg-surface-2 border border-border rounded-lg px-3.5 py-3 font-mono text-[12.5px] text-text-2 mt-3 leading-loose">
            <b className="text-brand">AgentBoard</b> 补充维度：进度率 / 探索效率 / 计划一致性
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
    <section id="audit" className="mx-auto max-w-[1180px] px-6 my-10">
      <SecHead
        title="数据版本与效度审计"
        desc="评测集是基础设施，不是一次性资产——清洗是一次性的，退化是持续的"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h3 className="text-[14.5px] font-bold mb-1">基准审计台账</h3>
          <p className="text-[12px] text-text-3 mb-3.5">
            任何一个被用来做上线决策的评测集，都必须定期重新审计
          </p>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <th className={mth}>基准</th>
                <th className={mth}>类型</th>
                <th className={mth}>版本 / 快照</th>
                <th className={mth}>审计状态</th>
                <th className={mth}>已知风险与处置</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT.map((a) => (
                <tr key={a.bench}>
                  <td className={`${mtd} font-semibold whitespace-nowrap`}>{a.bench}</td>
                  <td className={mtd}>{a.type}</td>
                  <td className={mtd}>{a.ver}</td>
                  <td className={mtd}>
                    <span
                      className={`text-[10.5px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                        a.st === "ok"
                          ? "bg-ok-soft text-ok"
                          : a.st === "risk"
                            ? "bg-risk-soft text-risk"
                            : "bg-chip text-text-3"
                      }`}
                    >
                      {a.stText}
                    </span>
                  </td>
                  <td className={mtd}>
                    {a.note}
                    <br />
                    <b className="text-brand">→ {a.action}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[12px] text-text-3 mt-3 leading-relaxed">
            审计结论不利时，要有勇气收回先前的推荐。本表随公开披露更新，新证据出现即改状态。
          </p>
        </div>

        <div className={card}>
          <h3 className="text-[14.5px] font-bold mb-1">基准缺陷：四类构造问题</h3>
          <p className="text-[12px] text-text-3 mb-3.5">
            任务构造缺陷会系统性扭曲分数（「数据污染」是另一个独立问题）
          </p>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <th className={mth}>缺陷类型</th>
                <th className={mth}>表现</th>
                <th className={mth}>影响</th>
              </tr>
            </thead>
            <tbody>
              {DEFECTS.map((d) => (
                <tr key={d.t}>
                  <td className={`${mtd} font-semibold whitespace-nowrap`}>{d.t}</td>
                  <td className={mtd}>{d.d}</td>
                  <td className={mtd}>
                    <span
                      className={`text-[10.5px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
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
          <div className="bg-surface-2 border border-border rounded-lg px-3.5 py-3 font-mono text-[12.5px] text-text-2 mt-3 leading-loose">
            前三类让模型<b className="text-brand">显得比实际差</b>，第四类让模型
            <b className="text-brand">显得比实际好</b>。
            <br />
            成因都在<b className="text-brand">构造期</b>：基准多从开源 issue / PR 历史中挖出，
            而那段历史本就不是为「干净隔离的考题」而写的。
          </div>
        </div>
      </div>
    </section>
  );
}
