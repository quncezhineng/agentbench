# Agent Benchmarks

AI Agent 的评分与评估（Evaluation）是一个将“结果导向”与“过程追踪”相结合的复杂系统，核心不再仅看单次输出是否准确，而是评估其在多步交互和工具调用下的任务达成度、稳定性与效率。 [1, 2] 
## 1. 核心评估指标

* 成功率（Success Rate）：任务最终达成目标的比例（0 或 1），是衡量终态的基础指标。
* 进度率（Progress Rate）：衡量多步骤任务中的中间进展（0~1 分布），能更精细地区分不同系统的执行能力。
* 工具调用准确率（Tool/Grounding Accuracy）：评估智能体调用 API、选择参数以及避免冗余或错误调用的比例。
* 可靠性指标（$\text{pass}^k$ 与 $\text{pass}@k$）：$\text{pass}@k$ 衡量多次尝试中至少一次成功的概率，而 $\text{pass}^k$ 衡量连续 k 次尝试全部成功的稳定性，面向用户的 Agent 尤其看重后者。 [3, 4] 

## 2. 三类主流评分器（Grader）

* 基于代码的评分器（Code-based Grader）：通过单元测试、字符串匹配或检查环境/数据库状态变化来评分。优点是快速、低成本且完全客观；缺点是较死板，容易卡死在未预料但有效的创新解法上。 [5, 6] 
* 基于模型的评分器（Model-based Grader）：采用大模型即裁判（LLM-as-Judge），依据结构化评分量规（Rubrics）对推理逻辑、幻觉及语义质量打分。优点是理解语义能力强；缺点是存在非确定性且成本较高。 [5, 6, 7] 
* 人工评分器（Human Evaluation）：由领域专家（SME）进行抽样审查，作为黄金标准来校准模型与代码评分器的偏离和漂移。 [5, 6] 

## 3. 不同类型 Agent 的评测侧重点

* 编码智能体（Coding Agents）：看代码能否通过测试、是否破坏现有功能（如 [SWE-bench Verified](https://www.swebench.com/SWE-bench/) 基准）。 [5] 
* 对话智能体（Conversational Agents）：通过模拟用户（如 τ-Bench）测试多轮对话中的意图提取、交互轮数和解决率。 [3, 5, 6] 
* 研究与操作智能体（Research/OS Agents）：评估信息源头依据、全流程浏览器或操作系统环境的实际状态变更（如 WebArena、OSWorld）。 [4, 5, 6] 

如果你想为特定的业务搭建 Agent 评分，请告诉我：

* 你的 Agent 应用场景是什么（如客服、代码辅助、自动化办公等）？
* 目前最头疼的 Bad Case（失败表现）是什么？

我能为你量身设计一套 评估指标和评分组合策略。

[1] [https://tech.meituan.com](https://tech.meituan.com/2026/08/07/Agent-Evaluation.html)
[2] [https://ac.fzhiy.net](https://ac.fzhiy.net/agent-post-training-playbook/cheatsheet-agent-evaluation.html)
[3] [https://aws.amazon.com](https://aws.amazon.com/cn/blogs/china/agent-quality-evaluation/)
[4] [https://zhuanlan.zhihu.com](https://zhuanlan.zhihu.com/p/1994349942207161524)
[5] [https://github.com](https://github.com/adongwanai/AgentGuide/blob/main/docs/02-tech-stack/agent-evaluation-complete-guide.md)
[6] [https://yeasy.gitbook.io](https://yeasy.gitbook.io/agentic_ai_guide/di-er-bu-fen-qun-ti-zhi-neng-yu-jin-hua/07_evolution/7.2_evaluation)
[7] [https://learn.microsoft.com](https://learn.microsoft.com/zh-cn/azure/foundry/observability/how-to/evaluate-agent)


根据所选文件夹里的内容和上文，我想做 Agent 评测网站，可以对各种 ai Agent 进行评分，然后列出各项评测标准的评分，进行排序，以及请根据上传的资料，帮我构建 AgentBench 评测网站，网站采用蓝白色主题

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://getagentbench.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8b28a9a9-859f-4c47-b7a5-bbcc786adeb5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
