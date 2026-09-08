# AgentBench 智衡 · 用户流程与项目结构

## 用户旅程

1. **进入首页**：首屏即讲清 LoopArena 定位（Controller 只决策、Worker 只动手），展示主排序指标（Type III SSR Top 3）与数据来源卡。
2. **查榜**：点击「查看排行榜」进入 `/board` → 默认按 Type III SSR 降序看主榜 → 点表头按名称 / Type I / Type II / Type III 排序。
3. **看参考策略**：在榜单页下滑查看 No control / Fixed control 两条基线（不参与排名）。
4. **看待评测产品**：榜单页底部查看 Claude Code / Codex / Cursor 等主流编程智能体占位卡片。
5. **看机制**：进入 `/eval` 读懂 Controller / Worker / Reporter 三角色、Evidence Packet / Loop Contract 两对象、Type I / II / III 三级评测、参考策略与复现入口；或返回首页浏览机制 / 三级评测 / 链路 / 指标 / 范围区块。
6. **看详情**：在排行榜点击任一智能体名称 → 进入 `/agents/:name` 详情页，查看三级结果与数据来源。

## 视觉动线设计

- **三页分工**：首页做「机制介绍」，榜单页做「排序打分」，机制页做「方法参考」；三页共享全局站点导航（排行榜 / LoopArena 机制）。
- **信息密度**：首页首屏两栏，左叙事右「主排序指标 + 数据来源」卡片，把「怎么排序 + 数据从哪来」放在阅读起点。
- **区块节奏**：每个功能区块统一「胶囊 Eyebrow + 大标题 + 说明文字」，锚点导航在本页内跳转。
- **数据可信表达**：来源信息以蓝色信息标签内联展示；待评测产品以黄色标签标注——颜色永远有语义，不装饰化。
- **数字即主角**：SSR、成本、排名使用等宽数字，表格列右对齐，扫读时一眼找到关键数字。

## 项目文件结构

```
agentbench/
├── docs/                          # 项目文档（本说明书）
│   ├── overview.md                # 项目概述
│   ├── requirements.md            # 需求与功能
│   ├── tech-specs.md              # 技术规格
│   ├── user-structure.md          # 用户流程与项目结构（本文档）
│   ├── timeline.md                # 里程碑与变更记录
│   ├── eval/                      # 评测机制依据材料（LoopArena 论文与教学文章）
│   └── wiki/                      # Wiki 文档
├── src/
│   ├── routes/index.tsx           # 首页：导航 / 首屏 Hero / 机制等介绍区块
│   ├── routes/board.tsx           # 排行榜页 /board：导航 / 榜单 / 页脚
│   ├── routes/eval.tsx            # LoopArena 机制说明页 /eval：导航 / LoopArenaExplainer / 页脚
│   ├── routes/agents/$name.tsx    # 智能体详情页 /agents/:name：导航 / AgentDetail / 页脚
│   ├── components/agentbench/
│   │   ├── SiteShell.tsx          # 三页共用站点外壳（全局导航 + 区块锚点 + 页脚）
│   │   ├── BenchApp.tsx           # 榜单：主榜 / 参考策略 / 待评测产品
│   │   ├── AgentDetail.tsx        # 单智能体详情：概览 + 三级结果（/agents/:name 渲染）
│   │   ├── StaticSections.tsx     # 首页静态区块：机制 / 三级评测 / 链路 / 指标 / 范围
│   │   └── LoopArenaExplainer.tsx # /eval 说明页主体：角色 / 对象 / 三级评测表 / 参考策略 / 复现
│   ├── lib/agentbench-data.ts     # LoopArena 数据模型、论文种子数据与纯函数
│   ├── lib/leaderboard-store.ts   # 榜单快照（策展常量，SSR 安全）
│   ├── styles.css                 # 设计 token 与组件类
│   └── ...（TanStack 工程骨架）
└── package.json / bun.lock ...
```

## 使用说明（给不写代码的维护者）

- **改文案**：直接搜中文文本（区块内容在 `BenchApp.tsx`、`AgentDetail.tsx`、`StaticSections.tsx`、`LoopArenaExplainer.tsx`、`index.tsx`）。
- **改种子数据 / 新增条目**：编辑 `src/lib/agentbench-data.ts` 顶部的 `AGENTS`（论文种子）与 `PRODUCTS`（待评测产品）数组即可，页面自动适配。
- **改排序默认值 / 表格列**：编辑 `src/components/agentbench/BenchApp.tsx` 的 `SortKey` 与表头。
- **改机制说明**：编辑 `src/components/agentbench/LoopArenaExplainer.tsx` 与 `src/components/agentbench/StaticSections.tsx`。
- **改主题色**：只改 `src/styles.css` 顶部 `:root` 中的 oklch 色值，全站联动。
