# AgentBench 智衡 · 项目概述

## 项目是什么

AgentBench 智衡是一个 **智能体 LoopArena 评测与排行** 的网站，由「首页（机制介绍）」「排行榜页 `/board`（只对主流编程智能体排序打分）」「LoopArena 机制说明页 `/eval`」三个页面构成。它采用 **LoopArena 评测机制**：把「控制」与「执行」拆成两个 Agent——Controller 只决策、Worker 只动手——从而隔离出被评测模型（Controller）的**纯控制能力**，让访问者可以：

- 查看 5 个已评测 Controller 模型在 Type I / II / III 三级评测下的真实结果与排名；

- 按 Type III 严格成功率（SSR）、Type II SSR、Type I 合同准确率或名称排序对比；

- 进入 `/agents/:name` 查看单个编程智能体的三级结果与数据来源；

- 在 `/eval` 读懂 LoopArena 的机制、三级评测口径、参考策略与复现入口。

## 核心定位

| 概念       | 说明                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| Controller | 被评测模型：只读 Evidence Packet，输出 Loop Contract（advance / verify / stop），不碰代码 |
| Worker     | 固定编码 Agent：唯一能读写代码、跑命令的角色，全榜单统一用 Qwen3.7-Plus                   |
| Reporter   | 复用 Worker 同款模型配置，产出四段式报告，作为下一轮 Evidence Packet 的原料               |
| 三级评测   | Type I 合同选择（零 Worker 执行）→ Type II 任务切片 → Type III 完整任务（最终标准）       |
| 核心指标   | 严格成功率（SSR）、Type I 合同准确率、平均估算推理成本（$/run）                           |
| 数据来源   | LoopArena 论文 Table 2（arXiv 2608.28281）                                                |
| 第三方声明 | 本站为第三方评测榜单，与论文作者及各家模型/产品厂商无隶属关系                             |

## 榜单范围

榜单**只对目前主流的编程智能体排序打分**：被评测对象是作为 Controller 的模型。主榜为论文 Table 2 真实跑过的 5 个模型（GPT-5.5、Claude Opus 4.8、Qwen3.7-Plus、DeepSeek-V4-Flash-0731、GLM 5.2），并额外补充 Claude Code、Codex、Cursor 等主流产品条目作为「待评测」占位。

## 技术栈

React 19 + TanStack Start（文件路由）+ Tailwind CSS v4 + Bun。详情见 `tech-specs.md`。

## 相关文档

- `requirements.md` — 功能需求与页面结构

- `tech-specs.md` — 技术规格与代码组织

- `user-structure.md` — 用户流程与文件结构

- `timeline.md` — 里程碑与变更记录

- `eval/2608.28281v1.pdf` 等 — LoopArena 论文与教学材料（评测机制依据）
