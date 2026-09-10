---
title: "AgentBench"
source: "https://agentic-design.ai/patterns/evaluation-monitoring/agentbench##211"
author:
  - "[[Agentic Design Team]]"
published:
created: 2026-09-10
description: "The original AgentBench study evaluated its published model roster across 8 diverse environments and multi-turn, open-ended settings."
tags:
  - "clippings"
---

## Design Patterns & Techniques

## AgentBench

The original AgentBench study evaluated its published model roster across 8 diverse environments and multi-turn, open-ended settings.

Complexity: highEvaluation and Monitoring

## In 30 seconds

What

Runs agents through eight diverse environments (SQL, games, web, OS) with multi-turn interactions to measure real-world capability across domains.

When to use

Comparing agent models or validating whether your agent handles varied, open-ended tasks beyond single-domain benchmarks.

Watch out

High complexity and computational cost; results may not transfer to your specific use cases or custom environments.

### Ask the AI expert about this pattern

Opens the assistant with your question prefilled. You review it before sending.

### 30-Second Overview

**Pattern:** First comprehensive benchmark evaluating LLMs as agents across 8 diverse environments

**Why:** Systematic assessment of reasoning, decision-making, and multi-turn interaction capabilities in realistic settings

**Key Insight:** Reveals significant performance gaps between commercial and open-source models in complex agent tasks

### Quick Implementation

1Install:git clone https://github.com/THUDM/AgentBench

2Setup:Configure API keys and environment dependencies

3Select:Choose evaluation environments (1-8)

4Run:Execute benchmark against your LLM agent

5Analyze:Review performance across environments

Example: python run.py --model \<current-model-id> --environments all --output results.json

### Do's & Don'ts

✅Test across all 8 environments for comprehensive evaluation

✅Allow sufficient time for multi-turn interactions (4k-13k generations)

✅Compare results against the original published baselines (GPT-4, Claude) and a current internal baseline

✅Focus on long-term reasoning and decision-making capabilities

✅Analyze failure modes in complex multi-step tasks

❌Rely on single environment results for overall capability assessment

❌Skip proper environment setup and dependency configuration

❌Ignore instruction following quality in favor of task completion

❌Compare models without controlling for prompt engineering

❌Assume good performance in one domain transfers to others

### When to Use

#### Use When

- • Comprehensive LLM agent capability assessment
- • Research on agent reasoning and decision-making
- • Comparing multiple models across diverse tasks
- • Identifying specific weaknesses in agent performance
- • Academic research and model development

#### Avoid When

- • Quick single-domain performance checks
- • Resource-constrained environments (requires 4k-13k generations)
- • Real-time evaluation needs
- • Domain-specific benchmarking only
- • Models without multi-turn conversation support

### Key Metrics

Overall Success Rate

Aggregate performance across all 8 environments

Per-Environment Score

Domain-specific capability assessment

Multi-turn Coherence

Consistency across conversation turns

Instruction Following

Adherence to task specifications

Long-term Reasoning

Performance on extended reasoning tasks

API vs OSS Gap

Commercial vs open-source model comparison

### Top Use Cases

LLM Agent Research: Comprehensive evaluation of reasoning and decision-making across diverse domains

Model Comparison: Systematic benchmarking of API-based vs open-source models (up to 70B parameters)

Capability Assessment: Identifying specific strengths/weaknesses in SQL, gaming, web, and OS environments

Academic Research: Supporting publications on agent capabilities and multi-turn interaction quality

Agent Development: Guiding improvements in long-term reasoning and instruction following

### Get the Agent Evals field guide

All 25 agent evaluation methods condensed into one guide: which benchmark measures what, when a public score misleads you, and how to build evals out of your own failures. The link arrives with your confirmation, alongside the weekly Agent Architect.

Weekly email, one-click unsubscribe. We only use your address to send the briefing.

## References

The papers, specifications, and repositories this pattern is based on.

- [AgentBench: Evaluating LLMs as Agents (Liu et al., ICLR 2024)](https://arxiv.org/abs/2308.03688) arXiv:2308.03688
- [github.com/THUDM/AgentBench](https://github.com/THUDM/AgentBench)

From the engineer behind this catalog

## Find out what your evals miss

Measuring an agent is harder than shipping one, and most suites stay green while production drifts. Have your evaluation setup reviewed end to end: what you measure today, what you cannot see yet, and the regressions your current suite would let through.

€750 instead of €1,500, one week, written report and walkthrough call, until 30 September

[See the review](https://agentic-design.ai/expert-services)
