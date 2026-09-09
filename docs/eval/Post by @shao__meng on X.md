---
title: "Post by @shao__meng on X"
source: "https://x.com/shao__meng/status/2094590893319995541"
author:
  - "[[@shao__meng]]"
published: 2026-09-01
created: 2026-09-08
description: 'LoopArena：把"模型当管理者"变成可测量的基准 https://huggingface.co/papers/2608.28281… 论文解决什么问题？ "Loop Engineering" 正在成为使用 Coding Agents 的新范式：开发者不再逐条手写 prom'
tags:
  - "clippings"
---

LoopArena：把"模型当管理者"变成可测量的基准

https://huggingface.co/papers/2608.28281…

论文解决什么问题？

"Loop Engineering" 正在成为使用 Coding Agents 的新范式：开发者不再逐条手写 prompt，而是设计一个外层循环来监控进度、分配工作、运行检查、决定下一步。但这里有一个根本性的评测盲区——一次端到端任务的成功或失败，无法区分是"循环指挥得好"还是"干活的智能体本身能力强"。

现有编码基准（SWE-bench 系列、SCBench 等）评的都是"完整的编码系统"；LoopArena 换了一个评测对象：固定住干活的 Worker 和全部执行环境，只比较坐在"指挥位"上的模型（Controller）。这本质上是把"模型当经理"的能力从系统能力中剥离出来单独测量。

核心机制：Controller–Reporter–Worker 三角

· Worker（内层循环）：唯一拥有编码工具的角色，按 ReAct 方式执行具体任务，全程固定为同一模型（Qwen3.7-Plus）。

· Reporter：每轮 Worker 交还控制权后，由 harness 临时创建的只读"汇报员"，从 Worker 对话副本中提炼四部分报告（任务上下文、已完成工作、验证证据、遗留问题），且引用具体 Worker 轮次，不污染 Worker 的持久对话。

· Controller（被评模型，外层循环）：只能读结构化的 Evidence Packet，无任何工具，输出一份 Loop Contract——决定推进（advance）、验证（verify）还是停止（stop），并给出有边界的下一段任务指令。

这个设计的巧妙之处在于信息隔离：Controller 的所有影响力只能通过"给 Worker 下指令"这一通道产生，因此测到的就是纯粹的运行时决策能力。

三级评测设置

Type I - 单次控制决策：给一个 Evidence Packet，从 4 个候选 Contract 中选一个（90 题）

Type II - 任务切片：从准备好的中间工作区完成一个连贯阶段（27 个切片）

Type III - 完整长程任务：从原始状态跑到停止决策（27 个任务，来自 SCBench 和 BeyondSWE）

实验对比范围

评测了 5 个 Controller：Qwen3.7-Plus、DeepSeek-V4-Flash、GLM 5.2、GPT-5.5、Claude Opus 4.8，另设两个参照策略（无控制、固定控制——即每轮机械重申原始目标，类似 Codex 的 /goal）。

主要实验结果

1\. 长程循环控制仍然很难。 Type III 严格成功率最高仅 24.69%（GPT-5.5），区间 16.05%–24.69%。即便是当前最强模型，指挥一个 Coding Agent 跑完长任务的可靠度也很低。

2\. "坚持目标"不等于"会控制"。 固定控制策略在 Type II 上把成功率从 39.51% 提到 46.91%，但在 Type III 上与无控制持平（均 18.52%）。结论很清晰：在有边界的任务切片上，反复重申目标有用；但完整任务需要在实现、验证、恢复、停止之间随证据动态切换，机械坚持无效。

3\. Type II 是可靠的低成本代理。 平均节省 64.4% 推理成本，同时与 Type III 的模型排名高度一致（Spearman ρ = 0.9747，九对严格序无反转）。这为后续研究提供了实用的廉价迭代通道。

4\. Type I 区分度真实存在。 准确率 72.22%–87.78%（GPT-5.5 最高），而所有确定性捷径（位置多数、动作先验、长度、词汇重叠）最高只有 31.11%，说明题目确实需要理解证据而非利用表面模式。

5\. 两个诚实的负面发现。 GLM 5.2 作为 Controller 时 75.93% 的 Type III 评测出现输出触顶（20,480 token 上限），协议失败直接计为任务失败——冗长决策本身就是控制缺陷；排名一致性对评分标准敏感（SCBench 换用"全部检查"标准时 ρ 跌至 0.148），说明 Core 检查集的选择承载了实质影响。

> **AK @\_akhaliq** · 2026-08-31
>
> LoopArena
>
> Benchmarking Models as Runtime Controllers for Loop Engineering
>
> paper: https://huggingface.co/papers/2608.28281…
>
> ![图像](https://pbs.twimg.com/media/HRF7TYLaAAAvC5q?format=jpg&name=large)

---

## Comments

> **曾波 @zengbozb** · [2026-09-01](https://x.com/zengbozb/status/2094592524505784444)
>
> 固定控制在 Type II 有效、Type III 无效，和我带 agent 干长任务的体感一致：有边界的切片里重申目标就够了，完整任务难在凭证据在推进/验证/停止间切换。Reporter 的“验证证据”字段才是承重墙——只看进度汇报不看证据，worker 一句“测试通过了”就能把 controller 骗到底。

> **Crio Songo @shuizhuyu** · [2026-09-01](https://x.com/shuizhuyu/status/2094666308352639292)
>
> 这个拆分思路很实用，终于能把指挥模型的调度能力单独拉出来评测，之前一直都是混在一起测不准。

> **xiangxiang chu @cxx1353574** · [2026-09-02](https://x.com/cxx1353574/status/2095075999562306019)
>
> thanks for sharing our work
