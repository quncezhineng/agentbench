---
title: "Agent 评估 - 如何评估 LLM Agent（指标、策略与示例） - Langfuse 平台"
source: "https://langfuse.com.cn/guides/cookbook/example_pydantic_ai_mcp_agent_evaluation"
author:
published:
created: 2026-09-03
description:
tags:
  - "clippings"
---

指南指南手册 (Cookbook) [Agent 评估 - 如何评估 LLM Agent](https://langfuse.com.cn/guides/cookbook/example_pydantic_ai_mcp_agent_evaluation)

## Agent 评估：如何评估 LLM Agent

评估 AI Agent 不同于评估简单的 LLM 调用。Agent 会做出自主的、多步骤的决策——调用工具、搜索数据库并链接推理——这意味着仅凭最终输出的单一准确性得分是不够的。你需要评估 **Agent 做了什么** （其轨迹）、 **它是如何做的** （每个单独的步骤）以及 **结果是否正确** （最终响应）。

本指南展示了 Langfuse 如何进行 Agent 评估。在深入代码之前，我们先为所构建和测试的内容建立一个清晰的思维模型。

## 什么是 LLM Agent？

LLM Agent 不仅仅是对语言模型的一次调用。它是一个自主系统，在推理和行动的连续循环中运行。当 LLM 接收到输入（无论是来自用户还是作为前一步的反馈）时，循环开始。基于此输入，LLM 决定执行一项 **行动** ，这通常涉及调用外部工具，如搜索 API、数据库查询或代码解释器。此行动与 **环境** 交互，然后环境产生 **反馈** （如搜索结果或数据），该反馈再反馈给 LLM。

这种推理、行动、环境交互和反馈的循环持续进行，直到 Agent 决定停止并生成最终答案。整个事件序列我们称之为 **“追踪”** 或 **“轨迹”** ——这使得 Agent 评估与评估单一 LLM 调用相比，具有独特的挑战性。

![LLM Agent](https://langfuse.com.cn/_next/image?url=%2Fimages%2Fcookbook%2Fexample_pydantic_ai_mcp_agent_evaluation%2Fagent-overview.png&w=3840&q=75)

## 为什么 Agent 评估很重要

评估这些复杂的、多步骤的轨迹很重要，因为它们可能以多种方式失败。我们可能没有给 Agent 足够清晰的指令，或者 LLM 本身可能无法将其推理泛化到新的或意想不到的用户问题上。

有关评估基础知识的更多信息，请参阅 [评估概念](https://langfuse.com.cn/docs/evaluation/core-concepts) 。

## 常见的 Agent 评估挑战

在使用 Agent 时，三个问题反复出现：\*\*理解、规范\*\*和\*\*泛化\*\*。你常常不清楚 Agent 在实际流量中做了什么、调用了哪些工具以及在哪里卡住，因为你没有系统地检查追踪或将其与用户反馈关联起来。

任务经常不明确：提示和示例没有清楚地编码“良好”行为是什么，因此 Agent 会以不可预测的方式即兴发挥。即使你已经收紧了规范，Agent 仍可能难以泛化，在少数精心挑选的示例上表现良好，但在略有不同的真实世界查询上却失败，除非你添加系统的、基于数据集的评估来检查其大规模的鲁棒性。

![LLM Agent](https://langfuse.com.cn/_next/image?url=%2Fimages%2Fcookbook%2Fexample_pydantic_ai_mcp_agent_evaluation%2Fevaluations.png&w=3840&q=75)

## Agent 评估的 3 个阶段

Agent 评估不是一次性活动——它会随着 Agent 的成熟而演变。该过程有三个不同阶段

**阶段 1：早期开发（手动追踪）**  
当你首次构建 Agent 时，最有价值的事情是检查其 [追踪](https://langfuse.com.cn/docs/observability/overview) 。手动追踪可以让你立即了解 Agent 的推理、工具调用和失败点。使用 Langfuse 的追踪查看器逐步查看 Agent 执行的每个操作。

**阶段 2：首批用户（在线评估）**  
当真实用户与你的 Agent 交互时，实施反馈机制（例如点赞/点踩按钮）来标记有问题的追踪以供审查。你还可以设置自动化的 [在线评估器](https://langfuse.com.cn/docs/evaluation/core-concepts#online-evaluation) ，实时对生产追踪进行评分。

**阶段 3：规模化（离线评估）**  
最后一个阶段，也是本指南的重点，是创建自动化的离线评估管道。随着规模的扩大，你无法手动审查每个追踪。你需要一个“黄金标准”的输入及其预期输出或轨迹的 [数据集](https://langfuse.com.cn/docs/evaluation/experiments/datasets) 。这个基准允许你 [运行实验](https://langfuse.com.cn/docs/evaluation/experiments/experiments-via-sdk) 、防止回归，并自信地迭代提示、模型和工具配置。

![LLM Agent](https://langfuse.com.cn/_next/image?url=%2Fimages%2Fcookbook%2Fexample_pydantic_ai_mcp_agent_evaluation%2Fissues.png&w=3840&q=75)

## 三种 Agent 评估策略

本指南涵盖了三种实用的、自动化的评估策略。每种策略在不同的粒度级别上运行，并回答关于 Agent 行为的不同问题。

**1) 最终响应评估（黑盒）**  
此方法仅评估用户的输入和 Agent 的最终答案，完全忽略内部步骤。它设置最简单，适用于任何 Agent 框架，但它无法告诉你\*为什么\*失败发生。

**2) 轨迹评估（玻璃盒）**  
此方法检查 Agent 是否采取了“正确路径”。它将 Agent 实际的工具调用序列与基准数据集中的预期序列进行比较。当最终答案错误时，轨迹评估可以精确指出推理过程中发生故障的位置。

**3) 单步评估（白盒）**  
这是最细粒度的评估策略，作用类似于 Agent 推理的单元测试。它不是运行整个 Agent，而是单独测试每个决策步骤，以查看它是否产生预期的下一个行动。这对于验证搜索查询、API 参数或工具选择是否正确特别有用。

## 实现：逐步评估 Agent

下面，我们将定义一个示例 Agent，创建一个基准数据集，并在 Langfuse 中设置自动化的 [LLM-即-法官](https://langfuse.com.cn/docs/evaluation/evaluation-methods/llm-as-a-judge) 评估。虽然代码使用 Pydantic AI，但评估模式适用于任何 Agent 框架。

> **想了解其他框架的 Agent 评估吗？** 请查阅 [LangGraph Agent 评估](https://langfuse.com.cn/guides/cookbook/example_langgraph_agents) 指南，了解 LangGraph 的具体操作。

### 步骤 0：安装软件包

```
%pip install -q --upgrade "pydantic-ai[mcp]" langfuse openai nest_asyncio aiohttp
```

### 步骤 1：设置环境变量

从 [项目设置](https://cloud.langfuse.com/) 中获取你的 Langfuse API 密钥。

```
import os

os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-..."
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-..."
os.environ["LANGFUSE_HOST"] = "https://cloud.langfuse.com"  # EU region
# os.environ["LANGFUSE_HOST"] = "https://us.cloud.langfuse.com"  # US region

os.environ["OPENAI_API_KEY"] = "sk-proj-..."
```

### 步骤 2：启用 Langfuse 追踪

为 Pydantic AI Agent 启用自动追踪。

```
from langfuse import get_client
from pydantic_ai.agent import Agent

langfuse = get_client()
assert langfuse.auth_check(), "Langfuse auth failed - check your keys"

Agent.instrument_all()
print("✅ Pydantic AI instrumentation enabled")
```

### 步骤 3：创建 Agent

构建一个使用 [Langfuse Docs MCP 服务器](https://langfuse.com.cn/docs/docs-mcp) 搜索 Langfuse 文档的 Agent。

```
from typing import Any
from pydantic_ai import Agent, RunContext
from pydantic_ai.mcp import MCPServerStreamableHTTP, CallToolFunc, ToolResult

LANGFUSE_MCP_URL = "https://langfuse.com.cn/api/mcp"

async def run_agent(item, system_prompt="You are an expert on Langfuse. ", model="openai:gpt-4o-mini"):
    langfuse.update_current_observation(input=item.input)

    tool_call_history = []

    async def process_tool_call(
        ctx: RunContext[Any],
        call_tool: CallToolFunc,
        tool_name: str,
        args: dict[str, Any],
    ) -> ToolResult:
        tool_call_history.append({"tool_name": tool_name, "args": args})
        return await call_tool(tool_name, args)

    langfuse_docs_server = MCPServerStreamableHTTP(
        url=LANGFUSE_MCP_URL,
        process_tool_call=process_tool_call,
    )

    agent = Agent(
        model=model,
        system_prompt=system_prompt,
        toolsets=[langfuse_docs_server],
    )

    async with agent:
        result = await agent.run(item.input["question"])

        langfuse.update_current_observation(
            output=result.output,
            metadata={"tool_call_history": tool_call_history},
        )

        return result.output, tool_call_history
```

### 步骤 4：创建评估数据集

构建一个包含测试用例的基准数据集。每个用例包括

- `input` ：用户问题
- `expected_output.response_facts` ：响应必须包含的关键事实
- `expected_output.trajectory` ：预期的工具调用序列
- `expected_output.search_term` ：预期的搜索查询（如适用）

```
test_cases = [
    {
        "input": {"question": "What is Langfuse?"},
        "expected_output": {
            "response_facts": [
                "Open Source LLM Engineering Platform",
                "Product modules: Tracing, Evaluation and Prompt Management"
            ],
            "trajectory": ["getLangfuseOverview"],
        }
    },
    {
        "input": {"question": "How to trace a python application with Langfuse?"},
        "expected_output": {
            "response_facts": [
                "Python SDK, you can use the observe() decorator",
                "Lots of integrations, LangChain, LlamaIndex, Pydantic AI, and many more."
            ],
            "trajectory": ["getLangfuseOverview", "searchLangfuseDocs"],
            "search_term": "Python Tracing"
        }
    },
    {
        "input": {"question": "How to connect to the Langfuse Docs MCP server?"},
        "expected_output": {
            "response_facts": [
                "Connect via the MCP server endpoint: https://langfuse.com.cn/api/mcp",
                "Transport protocol: \`streamableHttp\`"
            ],
            "trajectory": ["getLangfuseOverview"]
        }
    },
    {
        "input": {"question": "How long are traces retained in langfuse?"},
        "expected_output": {
            "response_facts": [
                "By default, traces are retained indefinitely",
                "You can set custom data retention policy in the project settings"
            ],
            "trajectory": ["getLangfuseOverview", "searchLangfuseDocs"],
            "search_term": "Data retention"
        }
    }
]

DATASET_NAME = "pydantic-ai-mcp-agent-evaluation"

dataset = langfuse.create_dataset(name=DATASET_NAME)
for case in test_cases:
    langfuse.create_dataset_item(
        dataset_name=DATASET_NAME,
        input=case["input"],
        expected_output=case["expected_output"]
    )
```

### 步骤 5：设置评估器

在 Langfuse UI 中创建三个评估器。每个评估器测试 Agent 行为的不同方面。你可以在 [此处](https://langfuse.com.cn/docs/evaluation/evaluation-methods/llm-as-a-judge) 找到设置它们的文档。

#### 1\. 最终响应评估（黑盒）

测试输出质量。无论内部实现如何都有效。

![Final Response Evaluation](https://langfuse.com.cn/_next/image?url=%2Fimages%2Fcookbook%2Fexample_pydantic_ai_mcp_agent_evaluation%2Feval-final-response.png&w=3840&q=75)

**提示模板**

```
You are a teacher grading a student based on the factual correctness of their statements.

### Examples

#### Example 1:
- Response: "The sun is shining brightly."
- Facts to verify: ["The sun is up.", "It is a beautiful day."]
- Reasoning: The response includes both facts.
- Score: 1

#### Example 2:
- Response: "When I was in the kitchen, the dog was there"
- Facts to verify: ["The cat is on the table.", "The dog is in the kitchen."]
- Reasoning: The response mentions the dog but not the cat.
- Score: 0

### New Student Response

- Response: {{response}}
- Facts to verify: {{facts_to_verify}}
```

#### 2\. 轨迹评估（玻璃盒）

验证 Agent 使用了正确的工具序列。

![Trajectory Evaluation](https://langfuse.com.cn/_next/image?url=%2Fimages%2Fcookbook%2Fexample_pydantic_ai_mcp_agent_evaluation%2Feval-trajectory.png&w=3840&q=75)

**提示模板**

```
You are comparing two lists of strings. Check whether the lists contain exactly the same items. Order does not matter.

## Examples

Expected: ["searchWeb", "visitWebsite"]
Output: ["searchWeb"]
Reasoning: Output missing "visitWebsite".
Score: 0

Expected: ["drawImage", "visitWebsite", "speak"]
Output: ["visitWebsite", "speak", "drawImage"]
Reasoning: Output matches expected items.
Score: 1

Expected: ["getNews"]
Output: ["getNews", "watchTv"]
Reasoning: Output contains unexpected "watchTv".
Score: 0

## This Exercise

Expected: {{expected}}
Output: {{output}}
```

#### 3\. 搜索质量评估

当 Agent 搜索文档时，验证搜索查询的质量。

![Trajectory Evaluation](https://langfuse.com.cn/_next/image?url=%2Fimages%2Fcookbook%2Fexample_pydantic_ai_mcp_agent_evaluation%2Feval-single-step.png&w=3840&q=75)

**提示模板**

```
You are grading whether a student searched for the right information. The search term should correspond vaguely with the expected term.

### Examples

Response: "How can I contact support?"
Expected search topics: Support
Reasoning: Response searches for support.
Score: 1

Response: "Deployment"
Expected search topics: Tracing
Reasoning: Response doesn't match expected topic.
Score: 0

Response: (empty)
Expected search topics: (empty)
Reasoning: No search expected, no search done.
Score: 1

### New Student Response

Response: {{search}}
Expected search topics: {{expected_search_topic}}
```

在 Langfuse UI 中，于 **提示** → **创建评估器** 下创建这些评估器。

### 步骤 6：运行实验

在你的数据集上运行 Agent。比较不同的模型和提示以找到最佳配置。

```
dataset = langfuse.get_dataset(DATASET_NAME)

result = dataset.run_experiment(
    name="Production Model Test",
    description="Monthly evaluation of our production model",
    task=run_agent
)

print(result.format())
```

### 步骤 7：比较多种配置

测试不同的提示和模型以找到最佳配置。

```
from functools import partial

system_prompts = {
    "simple": (
        "You are an expert on Langfuse. "
        "Answer user questions accurately and concisely using the available MCP tools. "
        "Cite sources when appropriate."
    ),
    "nudge_search": (
        "You are an expert on Langfuse. "
        "Answer user questions accurately and concisely using the available MCP tools. "
        "Always cite sources when appropriate. "
        "When unsure, use getLangfuseOverview then search the docs. You can use these tools multiple times."
    )
}

models = ["openai:gpt-5-mini", "openai:gpt-5-nano"]

dataset = langfuse.get_dataset(DATASET_NAME)

for prompt_name, prompt_content in system_prompts.items():
    for test_model in models:
        task = partial(
            run_agent,
            system_prompt=prompt_content,
            model=test_model,
        )

        result = dataset.run_experiment(
            name=f"Test: {prompt_name} {test_model}",
            description="Comparing prompts and models",
            task=task
        )

        print(result.format())
```

## Agent 评估最佳实践

根据我们帮助团队评估生产环境中 Agent 的经验，以下是关键的最佳实践

1. **从追踪开始，而不是评分。** 在构建自动化评估之前，花时间手动审查 Agent 追踪。你观察到的模式将告知哪些指标对你的用例最重要。使用 [Langfuse 追踪](https://langfuse.com.cn/docs/observability/overview) 来检查每个工具调用、推理步骤和中间输出。
2. **在编写评估器之前定义成功标准。** 对于每个测试用例，明确定义在每个级别上“正确”是什么样子——预期的最终答案、预期的工具序列和预期的搜索查询。模糊的标准会导致不可靠的评估。
3. **同时使用所有三个评估级别。** 最终响应评估告诉你\*哪里\*出错了。轨迹评估告诉你\*在何处\*出错了。单步评估告诉你\*为什么\*出错了。它们共同为你提供了一个完整的画面。
4. **从实际失败中构建你的数据集。** 最有价值的测试用例来自 Agent 失败的生产追踪。使用 [标注队列](https://langfuse.com.cn/docs/evaluation/evaluation-methods/annotation-queues) 系统地审查和标记有问题的追踪，然后将它们添加到你的评估数据集中。
5. **在 CI/CD 中运行评估。** 使用 [通过 SDK 运行实验](https://langfuse.com.cn/docs/evaluation/experiments/experiments-via-sdk) 将 Agent 评估集成到你的部署管道中。阻止导致基准数据集上分数回归的部署。
6. **系统地比较配置。** 在更改提示、模型或工具时，对所有配置运行相同的评估数据集，以做出数据驱动的决策。Langfuse 中的实验比较视图使这变得简单明了。

## 后续步骤

现在你已经有了一个可用的 Agent 评估管道，以下是扩展它的方法

- 通过 [合成数据生成](https://langfuse.com.cn/guides/cookbook/example_synthetic_datasets) **扩展你的数据集** 以覆盖更多边缘情况
- **添加在线评估** ，使用 [LLM-即-法官](https://langfuse.com.cn/docs/evaluation/evaluation-methods/llm-as-a-judge) 实时对生产追踪进行评分
- 如果你的 Agent 处理 [多轮对话](https://langfuse.com.cn/guides/cookbook/example_evaluating_multi_turn_conversations) ，请 **评估多轮对话**
- 使用 [自定义仪表板](https://langfuse.com.cn/docs/metrics/features/custom-dashboards) 和 [分数分析](https://langfuse.com.cn/docs/evaluation/evaluation-methods/score-analytics) **监控 Agent 性能**
- 在我们的 [综合评估指南](https://langfuse.com.cn/blog/2025-11-12-evals) 中 **探索完整的评估路线图**

## 常见问题

### 什么是 Agent 评估？

Agent 评估是系统地测试和衡量 AI Agent 性能的过程——AI Agent 是使用 LLM 做出决策、调用工具并完成多步骤任务的自主系统。与评估单一 LLM 调用不同，Agent 评估必须评估整个行动轨迹，而不仅仅是最终输出。

### Agent 评估与 LLM 评估有何不同？

标准 LLM 评估检查模型是否对给定提示产生正确或高质量的响应。Agent 评估更为复杂，因为 Agent 按顺序做出多个决策——选择调用哪些工具、传递什么参数以及何时停止。你需要评估的不仅是最终答案，还有推理路径（轨迹）和每个单独的决策（单步）。

### Agent 评估的主要类型有哪些？

主要有三种类型： **最终响应（黑盒）** 评估只检查最终结果； **轨迹（玻璃盒）** 评估检查 Agent 是否采取了正确的行动序列；以及 **单步（白盒）** 评估单独测试每个决策。大多数生产系统都结合使用这三种类型。

### 如何构建 Agent 评估数据集？

首先定义代表你最常见和最关键用户交互的测试用例。每个测试用例应包括用户输入、响应中的预期事实、预期的工具调用序列（轨迹）以及关键工具调用的预期参数。通过添加来自实际生产失败的案例，随着时间的推移不断扩充你的数据集。

### 我可以使用 LLM-即-法官 进行 Agent 评估吗？

是的。LLM-即-法官 是 Agent 评估最有效的方法之一，因为 Agent 的输出通常过于复杂，无法通过简单的基于规则的检查。你可以为每个评估级别使用不同的法官提示——一个用于最终响应质量，一个用于轨迹正确性，一个用于单个步骤质量。有关设置说明，请参阅 LLM-即-法官 文档 。

### 我应该多久运行一次 Agent 评估？

在每次更改提示、模型或工具配置的部署之前，运行离线评估（实验）。在生产追踪上持续运行在线评估，以捕获实际流量中的问题。要了解全面的方法，请参阅 [评估概述](https://langfuse.com.cn/docs/evaluation/overview) 。

---[多模态追踪示例](https://langfuse.com.cn/guides/cookbook/example_multi_modal_traces)

[

Langfuse Python SDK 中如何使用多模态和附件的示例。

](https://langfuse.com.cn/guides/cookbook/example_multi_modal_traces)[

通过 SDK 查询 Langfuse 数据

Langfuse 中的所有数据均可通过 API 获取。此 Python Notebook 包含使用 Langfuse SDK 查询数据的多个示例。

](https://langfuse.com.cn/guides/cookbook/example_query_data_via_sdk)
