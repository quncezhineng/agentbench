# AgentBench 智衡 · 需求与功能

## 页面信息架构（三页结构）

| 页面                   | 区块            | 锚点          | 内容                                                                    | 交互                    |
| ---------------------- | --------------- | ------------- | ----------------------------------------------------------------------- | ----------------------- |
| 首页 `/`               | 顶部导航        | —             | 品牌、首页区块锚点、CTA                                                 | 跳转 `/board`、`/eval`  |
| 首页                   | 首屏 Hero       | —             | LoopArena 定位 + 主排序指标（Type III SSR Top 3）+ 数据来源卡           | CTA 跳转榜单页 / 机制页 |
| 首页                   | 评测机制        | `#mechanism`  | Controller / Worker / Reporter 三角色 + Evidence Packet / Loop Contract | 静态展示                |
| 首页                   | 三级评测        | `#tiers`      | Type I / II / III 三档说明与口径                                        | 静态展示                |
| 首页                   | 评测链路        | `#pipeline`   | 内循环（Worker ReAct）vs 外循环（Controller 控制）双层闭环              | 静态展示                |
| 首页                   | 指标口径        | `#metrics`    | SSR / 估算成本 / Spearman ρ + 参考策略（No control / Fixed control）    | 静态展示                |
| 首页                   | 评测范围        | `#scope`      | 为什么榜单只评编程智能体                                                | 静态展示                |
| 榜单页 `/board`        | 主榜            | `#board`      | 5 个 Controller 按 Type III SSR 降序，可排序评分表                      | 表头排序                |
| 榜单页                 | 参考策略        | `#references` | No control / Fixed control（不参与排名）                                | 静态展示                |
| 榜单页                 | 待评测产品      | `#pending`    | Claude Code / Codex / Cursor 等主流产品占位卡片                         | 点击进详情              |
| 机制页 `/eval`         | 三个角色        | `#roles`      | Controller / Worker / Reporter                                          | 静态展示                |
| 机制页                 | 两个核心对象    | `#objects`    | Evidence Packet / Loop Contract                                         | 静态展示                |
| 机制页                 | 三级评测        | `#tiers`      | 论文 Table 2 真实结果表 + 三档说明                                      | 静态展示                |
| 机制页                 | 参考策略与口径  | `#references` | 参考策略 + 指标口径                                                     | 静态展示                |
| 机制页                 | 复现入口        | `#reproduce`  | 官方 CLI 复现命令                                                       | 静态展示                |
| 详情页 `/agents/:name` | 概览 + 三级结果 | —             | 单智能体 Type I / II / III 结果与数据来源                               | 返回榜单                |
| 三页共用               | 顶部站点导航    | —             | 「排行榜」「LoopArena 机制」两站入口                                    | 按路径高亮              |
| 三页共用               | 页脚            | —             | 版权、定位文案                                                          | —                       |

> 站点导航分两层：全局站点入口（排行榜 `/board` · LoopArena 机制 `/eval`，按路径高亮）与页面区块锚点（`#xxx`，按 hash 高亮）。

## 核心交互清单

1. **排序**：主榜表头支持按「名称 / Type I 合同准确率 / Type II SSR / Type III SSR」排序，再次点击切换升降序；默认按 Type III SSR 降序。
2. **查看详情**：点击主榜或待评测产品中的智能体名称，进入 `/agents/:name` 详情页查看三级结果与来源。
3. **机制参考**：首页与 `/eval` 页以静态区块讲清 LoopArena 的角色、对象、三级评测、指标与复现方式。

## 数据模型（与 `src/lib/agentbench-data.ts` 一致）

```
LoopAgent {
  name:    string           // 名称
  vendor:  string           // 厂商
  kind:    "controller" | "reference" | "product"  // 被评测模型 / 参考策略 / 待评测产品
  demo:    boolean          // true = 待评测占位（无真实 LoopArena 分数）
  note?:   string           // 补充说明（模型口径 / 行为描述）
  r: LoopResult
}

LoopResult {
  type1Acc:  number | null  // Type I 合同准确率（0–100）
  type2Ssr:  number | null  // Type II 严格成功率（0–100）
  type2Cost: number | null  // Type II 平均估算推理成本（$/run）
  type3Ssr:  number | null  // Type III 严格成功率（0–100）
  type3Cost: number | null  // Type III 平均估算推理成本（$/run）
  src: Src | null           // 数据来源
}
```

- 参考策略（No control / Fixed control）没有 Type I 分数，`type1Acc = null`。
- 待评测产品（`kind = "product"`）所有分数为 `null`，页面以「待评测」占位展示。
- `src` 标注分数出处：主榜模型为 LoopArena 论文 Table 2，参考策略为 LoopArena 参考策略口径。

## 榜单种子数据（论文 Table 2）

| 名称                   | 厂商      | Type I Acc | Type II SSR | Type II 成本 | Type III SSR | Type III 成本 |
| ---------------------- | --------- | ---------- | ----------- | ------------ | ------------ | ------------- |
| GPT-5.5                | OpenAI    | 87.78%     | 51.85%      | $5.00        | 24.69%       | $18.84        |
| Claude Opus 4.8        | Anthropic | 76.67%     | 48.15%      | $5.87        | 20.99%       | $16.82        |
| Qwen3.7-Plus           | 阿里云    | 72.22%     | 48.15%      | $4.30        | 23.46%       | $6.89         |
| DeepSeek-V4-Flash-0731 | 深度求索  | 77.78%     | 45.68%      | $2.10        | 19.75%       | $10.24        |
| GLM 5.2                | 智谱      | 74.44%     | 37.04%      | $1.63        | 16.05%       | $4.86         |

参考策略（不参与排名）：Fixed control（Type II 46.91% / Type III 18.52%）、No control（Type II 39.51% / Type III 18.52%）。

## 业务规则与边界情况

- **只评编程智能体**：LoopArena 的 Worker 动作空间是「写代码 + 跑命令」，只有编程智能体落在该口径内。
- **参考策略不参与排名**：No control / Fixed control 仅作对照，不进入主榜排序。
- **待评测产品明确标注**：所有 `demo = true` 的条目以醒目标签标注，避免与真实分数混淆。
- **排名一致性**：Type II 与 Type III 的 Controller 排名 Spearman's ρ = 0.9747，Type III 为最终主排序档位。
- **数据口径声明**：已标注来源的分数来自论文公开发布快照，仅代表论文口径与当时复现环境；不同基准、日期、harness 的结果不能直接横向混用。
