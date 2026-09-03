---
title: "AI Agent Benchmark & Evaluation（2025"
source: "https://zhuanlan.zhihu.com/p/1979654099348779893"
author:
  - "[[momo]]"
published:
created: 2026-09-03
description: "鉴于最近老刷知乎，要找点事在知乎上做。刚好，需要看一批论文，特地在此创建一个文章，后面还会更新。 核心 Agent Benchmark 列表Benchmark 名称 链接 简介 PaperBench https://openai.com/index/paperbench/Open…"
tags:
  - "clippings"
---

176 人赞同了该文章

鉴于最近老刷知乎，要找点事在知乎上做。刚好，需要看一批论文，特地在此创建一个文章，后面还会更新。

## 📋 核心 Agent Benchmark 列表

| Benchmark 名称                                                                                                                          | 链接                                                                           | 简介                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PaperBench                                                                                                                              | [openai.com/index/paperb](https://openai.com/index/paperbench/)                | OpenAI 科研 Agent 基准，评估模型自主完成论文理解、代码实现与实验复现的能力。                                                                                                                                                          |
| [GDPval](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=GDPval&zhida_source=entity)           | [openai.com/index/gdpval](https://openai.com/index/gdpval/)                    | OpenAI 知识工作 benchmark，涵盖 44 种真实职业任务，评估 agent 在产生经济价值场景中的表现。                                                                                                                                            |
| AgentBench                                                                                                                              | [github.com/THUDM/AgentB](https://github.com/THUDM/AgentBench)                 | 通用 Agent benchmark，覆盖 Web、OS、检索、推理、游戏多环境交互与长程规划。                                                                                                                                                            |
| [WebArena](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=WebArena&zhida_source=entity)       | [github.com/web-arena-x/](https://github.com/web-arena-x/webarena)             | 真实网站交互评测（Amazon、Wikipedia、GitHub 等），测试 navigation、search 与信息整合能力。                                                                                                                                            |
| [MiniWoB++](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=MiniWoB%2B%2B&zhida_source=entity) | [github.com/google-resea](https://github.com/google-research/miniwob-plusplus) | HTML UI 操作 benchmark，聚焦 agent 的 [grounding](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=grounding&zhida_source=entity) 与鼠标、键盘精细控制能力。                                  |
| [OSWorld](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=OSWorld&zhida_source=entity)         | [github.com/os-world/osw](https://github.com/os-world/osworld)                 | 桌面自动化 agent benchmark，在真实 Linux / Windows 桌面中完成系统任务。                                                                                                                                                               |
| OSBench                                                                                                                                 | [github.com/ComputerAgen](https://github.com/ComputerAgent/OSBench)            | 跨平台桌面任务评测，测试软件管理、配置和多步系统操作。                                                                                                                                                                                |
| SWE-Bench                                                                                                                               | [swebench.com/](https://www.swebench.com/)                                     | 真实 GitHub issue 自动修复 benchmark，通过 CI 验证 patch 正确性，是 coding agent 权威标准。                                                                                                                                           |
| [DevEval](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=DevEval&zhida_source=entity)         | [arxiv.org/abs/2401.0640](https://arxiv.org/abs/2401.06401)                    | 多文件真实工程项目评测，关注依赖管理与复杂工程级修复。                                                                                                                                                                                |
| EvoCodeBench                                                                                                                            | [arxiv.org/abs/2404.0059](https://arxiv.org/abs/2404.00599)                    | 演化代码库场景评测，探究 [legacy code](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=legacy+code&zhida_source=entity) 与依赖复杂环境下的持续维护能力。                                     |
| [VERINA](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=VERINA&zhida_source=entity)           | [arxiv.org/abs/2505.2313](https://arxiv.org/abs/2505.23135)                    | [形式化验证](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=%E5%BD%A2%E5%BC%8F%E5%8C%96%E9%AA%8C%E8%AF%81&zhida_source=entity) agent benchmark，评测 Spec → Code → Proof 生成与可机检证明。 |
| [ALFWorld](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=ALFWorld&zhida_source=entity)       | [github.com/alfworld/alf](https://github.com/alfworld/alfworld)                | 文本具身家庭环境，测试长程规划、物体操作与子目标分解能力。                                                                                                                                                                            |
| [BabyAI](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=BabyAI&zhida_source=entity)           | [github.com/mila-iqia/ba](https://github.com/mila-iqia/babyai)                 | 网格世界 instruction-following benchmark，研究 compositional reasoning。                                                                                                                                                              |
| [Crafter](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=Crafter&zhida_source=entity)         | [github.com/danijar/craf](https://github.com/danijar/crafter)                  | 程序生成世界中的生存与制作任务，专测超长时序规划能力。                                                                                                                                                                                |
| [GAIA](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=GAIA&zhida_source=entity)               | [github.com/facebookrese](https://github.com/facebookresearch/gaia)            | 工具直连 agent benchmark，集成搜索、表格处理和文档编辑等多工具操作流程。                                                                                                                                                              |

## 🧠 智能体能力专项基准（DeepSeek & 社区常用侧重）

### 1\. 代码智能体（Code Agent）

| Benchmark                                                                                                                                         | 链接                                                                  | 简介                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Terminal Bench 2.0                                                                                                                                | [github.com/microsoft/te](https://github.com/microsoft/terminalbench) | 在真实终端环境下操作系统、运行脚本和完成 coding 工作流的评测。                |
| [SWE-Verified](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=SWE-Verified&zhida_source=entity)         | [openai.com/research/swe](https://openai.com/research/swe-bench)      | OpenAI 发布的经过人工核验的软件工程基准，属于 SWE-Bench 的高质量子集。        |
| [SWE-Multilingual](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=SWE-Multilingual&zhida_source=entity) | [github.com/multilingual](https://github.com/multilingual-swe-bench)  | 多语言版本的软件工程修复 benchmark，涵盖 Python 以外语言（如 Java、C++ 等）。 |

### 2\. 搜索智能体（Search Agent）

| Benchmark    | 链接                                                               | 简介                                                                |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| BrowseComp   | [github.com/openai/brows](https://github.com/openai/browsecomp)    | 网页浏览与信息检索 benchmark，评估 agent 自主搜索、筛选与整合能力。 |
| BrowseCompZh | [github.com/openai/brows](https://github.com/openai/browsecomp-zh) | BrowseComp 中文版，专测中文互联网页面浏览与信息获取能力。           |

### 3\. 工具使用 & 通用 Agent（Tool Use & Generalist）

| Benchmark                                                                                                                         | 链接                                                                            | 简介                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| τ²-bench (Tau2-Bench)                                                                                                             | [github.com/Stanford-CRF](https://github.com/Stanford-CRFM/tau-bench)           | [双重控制](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=%E5%8F%8C%E9%87%8D%E6%8E%A7%E5%88%B6&zhida_source=entity) 环境下的对话式 agent 评测，强调长对话、外部行动和安全对齐。              |
| [MCP](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=MCP&zhida_source=entity) -Universe | [github.com/modelcontext](https://github.com/modelcontextprotocol/mcp-universe) | 基于 MCP ([Model Context Protocol](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=Model+Context+Protocol&zhida_source=entity)) 的真实世界任务 benchmark，衡量 agent 跨工具与上下文执行能力。 |
| [MCP-Mark](https://zhida.zhihu.com/search?content_id=267176638&content_type=Article&match_order=1&q=MCP-Mark&zhida_source=entity) | [github.com/modelcontext](https://github.com/modelcontextprotocol/mcp-mark)     | MCP 生态下的评测集合，用于自动测试 agent 对 MCP 服务与 API 协议的适配效果。                                                                                                                                                            |
| Tool-Decathlon                                                                                                                    | [github.com/tool-decathl](https://github.com/tool-decathlon/tool-decathlon)     | 长流程真实任务 benchmark，要求 agent 协同使用多工具完成复合目标，被认为是当前 tool-use agent 的高难基准。                                                                                                                              |

## 🧠 Agent 能力覆盖矩阵

| 能力维度                | 代表 Benchmark                                     |
| ----------------------- | -------------------------------------------------- |
| 多步规划 / 长程推理     | PaperBench, AgentBench, Crafter, τ²-bench          |
| 真实 Web 交互           | WebArena, BrowseComp, BrowseCompZh                 |
| 桌面自动化              | OSWorld, OSBench, TerminalBench                    |
| 软件工程修复            | SWE-Bench, SWE-Verified, DevEval, SWE-Multilingual |
| 科研自治                | PaperBench                                         |
| 真实职业任务 / 经济价值 | GDPval                                             |
| 通用工具调用            | GAIA, Tool-Decathlon, MCP-Universe, MCP-Mark       |
| 具身推理                | ALFWorld, BabyAI                                   |
| 高可靠性 / 可验证性     | VERINA                                             |

## ✅ 推荐阅读与研究顺序

### Step 1 — Agent 基础能力体系

- AgentBench
- WebArena
- BrowseComp

### Step 2 — 工程 & 真实环境

- SWE-Bench + SWE-Verified
- OSWorld + TerminalBench
- DevEval / SWE-Multilingual

### Step 3 — Frontier / High-end

- PaperBench
- GDPval
- Tool-Decathlon
- MCP-Universe
- VERINA

编辑于 2025-12-03 23:06・广东

赞同 176
