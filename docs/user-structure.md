# AgentBench 智衡 · 用户流程与项目结构

## 用户旅程

1. **进入首页**：首屏即讲清定位（六维数据、场景加权、可对比、可审计），给出三个动作入口。
2. **查榜**：点击「查看实时排行榜」进入独立榜单页 `/board` → 默认看编码场景榜 → 点表头排序 → 切换场景观察排名变化。
3. **自定义权重**：在榜单页拖滑块（进入自定义模式）→ 看总分与雷达实时变化 → 一键恢复预设。
4. **对比**：勾选 1–3 个 Agent → 在下方「多维对比」看到雷达对比与逐项分数。
5. **看方法**：返回首页浏览维度定义、权重依据、评分器分工、审计台账，理解「分数怎么来、可信不可信」。
6. **跑真实评测**：进入 `/eval` 选通道与模型（首次需配一个 API Key）→ 勾选对话 / 研究与操作套件与试跑次数 → 开始自动评测 → 查看分场景聚合与逐样本结果。
7. **并入榜单数据**：评测报告区点击「并入榜单数据」→ 本次结果按 Agent 名称并入浏览器共享榜单（同名更新 / 新名追加），打开排行榜即为最新；也可下载 / 复制 JSON 存档，或到评测页底部「数据接入」区整体导入 / 导出。
8. **查看智能体详情**：在排行榜点击任一 Agent 名称 → 进入 `/agents/:name` 详情页，切换场景查看六维分数、总分、六维雷达图与数据来源（src）标注。

## 视觉动线设计

- **三页分工**：首页做「介绍 + 方法」，榜单页做「数据工作台」，评测页做「跑分」，各自顶部导航吸顶直达本页关键区块；三页共享的全局站点导航（排行榜 / 自动化评测）负责跨页切换。
- **信息密度**：首页首屏两栏，左叙事右「总分构成 + 数据可信度」卡片，把「怎么算 + 可不可信」放在阅读起点。
- **区块节奏**：每个功能区块统一「胶囊 Eyebrow + 大标题 + 说明文字」，锚点导航在本页内跳转。
- **数据可信表达**：来源信息以蓝色信息标签 + 基准名内联展示；构造值黄标；审计状态三色标签——颜色永远有语义，不装饰化。
- **数字即主角**：总分、权重、排名使用等宽数字，表格列右对齐，扫读时一眼找到关键数字。
- **评测即证据**：评测页把「哪次试验、答了什么、怎么判分」逐样本摊开，报告区默认只展示结论，明细可下钻，产出的 JSON 符合共享榜单导入 schema。

## 项目文件结构

```
agentbench/
├── docs/                          # 项目文档（本说明书）
│   ├── overview.md                # 项目概述
│   ├── requirements.md            # 需求与功能
│   ├── tech-specs.md              # 技术规格
│   ├── user-structure.md          # 用户流程与项目结构（本文档）
│   ├── timeline.md                # 里程碑与变更记录
│   └── wiki/                      # Wiki 文档
│       └── agentbench-evaluation.md # AI Agent 评估机制
├── src/
│   ├── routes/index.tsx           # 首页：导航 / 首屏 Hero / 评测方法等介绍区块
│   ├── routes/board.tsx           # 排行榜工作台页 /board：导航 / 榜单 / 页脚
│   ├── routes/eval.tsx            # 自动化评测页 /eval：导航 / EvalApp / 页脚
│   ├── routes/agents/$name.tsx    # 智能体详情页 /agents/:name：导航 / AgentDetail / 页脚
│   ├── components/agentbench/
│   │   ├── SiteShell.tsx          # 三页共用站点外壳（全局导航 + 区块锚点 + 页脚）
│   │   ├── BenchApp.tsx           # 榜单工作台：榜 / 权重 / 雷达（数据来自共享榜单存储）
│   │   ├── EvalApp.tsx            # 评测工作台：配置 / 进度 / 报告 / 并入榜单 / JSON
│   │   ├── DataPipeline.tsx       # 数据接入区（渲染在 /eval 底部）：导入替换 / 导出 / schema
│   │   ├── AgentDetail.tsx        # 单智能体详情：六维分数 / 雷达 / 来源（/agents/:name 渲染）
│   │   └── StaticSections.tsx     # 静态区块：方法 / 链路 / 评分器 / 审计 / Agent 类型 / 路线
│   ├── lib/agentbench-data.ts     # 榜单数据模型、种子数据与纯函数
│   ├── lib/leaderboard-store.ts   # 共享榜单存储（localStorage + 订阅 + 合并），跨 /board 与 /eval
│   ├── lib/agent-eval.ts          # 评测任务/套件模型、聚合与 Agent JSON 构建（纯函数）
│   ├── lib/eval-server.ts         # 评测服务端函数：真实 LLM 调用 + Judge 评分
│   ├── styles.css                 # 设计 token 与组件类
│   └── ...（TanStack 工程骨架）
├── scripts/
│   └── run-agent-eval.ts          # 真实 CLI 智能体评测 runner（Bun 运行，产出榜单 JSON）
└── package.json / bun.lock ...
```

## 使用说明（给不写代码的维护者）

- **改文案**：直接搜中文文本（区块内容在 `BenchApp.tsx`、`EvalApp.tsx`、`DataPipeline.tsx`、`StaticSections.tsx`、`index.tsx`）。
- **改种子数据 / 维度 / 权重**：编辑 `src/lib/agentbench-data.ts` 顶部的常量数组即可，页面自动适配。
- **改评测任务 / 新增题目**：编辑 `src/lib/agent-eval.ts` 里 `CONV_TASKS` / `OS_TASKS` 数组（含任务描述、checkpoints、工具预期、token 预算）。
- **换真数据**：跑完评测点「并入榜单数据」自动入库；或到 `/eval` 底部「数据接入 → 导入 JSON」整体替换（导出 JSON/CSV 也在那里）。榜单数据存于浏览器，打开 `/board` 即为最新；schema 已写在数据接入区页面上。
- **配置真实跑分**：在部署环境（如 Render）给评测服务配置 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` / `OPEN_ROUTER_API_KEY` 之一即可；临时在评测页填 Key 只对当次运行生效。
- **真实评测 CLI 智能体**：在本机（非沙箱终端）运行 `bun scripts/run-agent-eval.ts`，会真实调用已安装的智能体 CLI（claude / codex / opencode / hermes / trae）作答内置套件并由 Claude 裁判打分，产出 `scripts/output/agentbench-cli-eval-<日期>.json`，再到 `/eval#data`「导入 JSON 替换」即可上榜。可用 `--only "Claude Code"` 只测单个、`--trials 2` 增加试跑、`--dry-run` 只预览命令。
- **改主题色**：只改 `src/styles.css` 顶部 `:root` 中的 oklch 色值，全站联动。
