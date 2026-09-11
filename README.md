# AgentBench 智衡

> 编程智能体 LoopArena 评测与排行网站 —— 把「控制」和「执行」拆开，Agent 行不行用数据说话。

## 这是什么

AgentBench 智衡是一个 **只对目前主流的编程智能体排序打分** 的评测榜单网站。它采用 **LoopArena 评测机制**：把「控制」与「执行」拆成两个 Agent —— Controller 只决策、Worker 只动手 —— 从而隔离出被评测模型（Controller）的**纯控制能力**，让分数差异只反映「会不会指挥」，而不是「会不会写代码」。

## LoopArena 机制（一句话）

| 角色 | 职责 |
| ---- | ---- |
| **Controller** | 被评测模型：只读 Evidence Packet（结构化摘要），输出 Loop Contract（`advance` / `verify` / `stop`），不碰代码 |
| **Worker** | 固定编码 Agent：唯一能读写代码、跑命令的角色，全榜单统一用 Qwen3.7-Plus |
| **Reporter** | 复用 Worker 同款模型配置，产出四段式报告，作为下一轮 Evidence Packet 的原料 |

三级评测由浅入深：

- **Type I · 合同选择**：Controller 在零 Worker 执行下做决策，测「判断对错」；
- **Type II · 任务切片**：给定中间进度做局部决策，测「过程纠偏」；
- **Type III · 完整任务**：从零开始把完整编码任务「真正做完」，是最终排名标准。

## 核心指标

- **Type I 合同准确率（Contract Accuracy）**：Controller 决策正确率；
- **Type II / III 严格成功率（SSR，Strict Success Rate）**：既通过任务 evaluator、又符合 LoopArena 协议才算成功；
- **平均估算推理成本（$/run）**：无缓存口径，衡量「花多少钱干成一件事」；
- **排名一致性（Spearman ρ）**：验证三级评测口径是否指向同一结论。

## 页面结构

| 路由 | 说明 |
| ---- | ---- |
| `/` | 首页：LoopArena 机制概览、三级评测、指标口径、数据来源 |
| `/board` | 排行榜：主榜（Type I / II / III 可排序）+ CLI 实测榜 + 参考策略 |
| `/agents/:name` | 单智能体详情：三级结果、95% 置信区间、来源拆分、关键发现 |
| `/eval` | LoopArena 机制说明页（角色 / 三级评测 / 参考策略 / 复现入口） |
| `/compare/swe-bench` | 与 SWE-bench 的对比说明 |
| `/runs` | 评测结果库（结果列表 + 单条详情） |
| `/calendar` | 评测日历（排期） |
| `/sources` | 数据来源 |
| `/auth` | 登录 |
| `/api/public/eval-ingest` | 评测数据接入 API |
| `/_authenticated/admin.review` | 管理员审核页（需登录） |

## 数据来源与数据流

榜单数据来自 **Supabase 数据库 `eval_runs` 表**（`status = 'approved'`），按 `suite` 分为两类：

- `suite = 'looparena'`：LoopArena 主榜 —— 论文 Table 2（arXiv 2608.28281）的 5 个 Controller + 2 个参考策略；
- `suite = 'cli'`：CLI 实测榜 —— 内置评测套件 v0（`scripts/run-cli-eval.mjs` 真实跑分，对话 + 研究操作两场景，五维指标）。

数据流：

```
页面（/board、/agents/:name）
  └─ useLeaderboardSnapshot()          src/lib/leaderboard-store.ts
       └─ runsQuery                   src/lib/eval-queries.ts
            └─ listEvalRuns()          src/lib/eval-runs.functions.ts（Server Function）
                 └─ Supabase eval_runs 表
                      └─ deriveAgents() 聚合派生 LoopAgent
```

CLI 实测的五维指标：成功率（Success）、工具调用（Tool）、进度（Progress）、效率（Efficiency）、可信度（Trust）。

## 技术栈

- **框架**：React 19 + TypeScript，TanStack Start（文件路由 + SSR，基于 Nitro）+ TanStack Router + TanStack Query
- **样式**：Tailwind CSS v4 + shadcn/ui（Radix UI）
- **图表**：recharts
- **表单**：react-hook-form + zod
- **后端 / 数据**：Supabase（PostgreSQL + Auth + RLS），`@supabase/supabase-js`
- **构建**：Vite 8
- **包管理 / 运行**：Bun

## 目录结构

```
src/
├── routes/                  # TanStack Start 文件路由（页面与 API）
│   ├── index.tsx            # 首页
│   ├── board.tsx            # 排行榜
│   ├── eval.tsx             # LoopArena 机制
│   ├── agents/$name.tsx     # 详情页
│   ├── runs.tsx / runs.*    # 评测结果库
│   ├── calendar.tsx         # 评测日历
│   ├── sources.tsx          # 数据来源
│   ├── auth.tsx             # 登录
│   ├── api/public/          # 数据接入 API
│   └── _authenticated/      # 管理员审核（受保护）
├── components/
│   ├── agentbench/          # 业务组件（BenchApp / AgentDetail / SiteShell / ...）
│   └── ui/                  # shadcn/ui 基础组件
├── lib/
│   ├── agentbench-data.ts   # 数据模型 + 论文种子数据 + 排序/格式化纯函数
│   ├── eval-queries.ts      # 查询派生（deriveAgents / ciOf / splitOf）
│   ├── eval-runs.functions.ts # Supabase Server Function
│   └── leaderboard-store.ts # useLeaderboardSnapshot 榜单快照
├── integrations/supabase/   # Supabase 客户端 / 鉴权 / 类型
└── styles.css               # 设计 token 与组件样式
supabase/migrations/         # 数据库迁移（eval_runs、eval_schedule 等）
scripts/                     # CLI 实测脚本与评测任务
docs/                        # 项目文档（概述 / 需求 / 技术规格 / 结构 / 时间线）
```

## 本地开发

需要 Node.js（或 Bun）。推荐使用 Bun：

```sh
bun install
bun run dev
```

常用命令：

```sh
bun run dev        # 本地开发服务器
bun run build      # 生产构建
bun run preview    # 预览构建产物
bun run lint       # ESLint
bunx tsc --noEmit  # TypeScript 类型检查
```

本地运行时需要在 `.env` 配置 Supabase 连接（`SUPABASE_URL` 与 `SUPABASE_PUBLISHABLE_KEY`，云环境由 Lovable 注入）。

## 部署

本项目通过 [Lovable](https://lovable.dev) 构建与托管：

- **线上地址**：<https://getagentbench.lovable.app>
- **源码仓库**：<https://github.com/quncezhineng/agentbench>
- **Lovable 编辑器**：<https://lovable.dev/projects/8b28a9a9-859f-4c47-b7a5-bbcc786adeb5>

> 提示：本项目连接 Lovable，请勿改写已推送的 git 历史（force push / rebase / amend / squash），否则会重写 Lovable 侧历史、可能丢失项目历史。

## 相关文档

- `docs/overview.md` — 项目概述
- `docs/requirements.md` — 功能需求与页面结构
- `docs/tech-specs.md` — 技术规格与代码组织
- `docs/user-structure.md` — 用户流程与文件结构
- `docs/timeline.md` — 里程碑与变更记录
- `docs/wiki/LoopArena.pdf` — LoopArena 论文（评测机制依据）

## 数据口径声明

榜单中已标注来源的分数来自 LoopArena 论文（arXiv 2608.28281）Table 2 的公开发布快照，仅代表论文口径与当时复现环境；其余主流编程智能体产品暂为「待评测」占位，尚未在 LoopArena 统一口径下跑分。本站为第三方评测榜单，与论文作者及各家模型/产品厂商无隶属关系。
