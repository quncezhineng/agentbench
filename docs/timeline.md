# AgentBench 智衡 · 项目时间线与进度

## 里程碑

| 阶段                | 状态                       | 说明                                                                                                                                               |
| ------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 初始 MVP         | ✅ 已完成                  | Lovable 生成的首版功能页：排行榜 / 雷达 / 权重 / 数据接入 / 方法说明均已可交互                                                                     |
| M1 设计系统化重构   | ✅ 已完成（2026-09-03）    | 依据 TraeWork 设计系统重构全站视觉与结构（见下方变更记录）                                                                                         |
| M1.1 排行榜独立页面 | ✅ 已完成（2026-09-03）    | 排行榜从单页长滚动拆出为独立路由 `/board`（见下方变更记录）                                                                                        |
| M1.2 顶部导航精修   | ✅ 已完成（2026-09-03）    | 导航字体 / 排版 / 动效精修：胶囊悬停、区块激活指示、品牌区升级（见下方变更记录）                                                                   |
| M2 接入真实评测管线 | ✅ v0 已落地（2026-09-04） | `/eval` 可调真实 LLM 跑分并「并入榜单数据」；数据接入区迁移至评测页底部；当前覆盖对话 / 研究与操作两类（无沙盒），编码类留待后续（见 M2.1 / M2.2） |
| M3 LoopArena 重构   | ✅ 已完成（2026-09-08）    | 按 LoopArena 论文重建全站：榜单改为「只评编程智能体」、`/eval` 改为机制说明页、数据模型改为 Controller/Worker + Type I/II/III（见下方变更记录）    |

## M3 变更记录（2026-09-08）· LoopArena 机制重构

### 背景与目标

依据 LoopArena 论文（`docs/eval/2608.28281v1.pdf`）与两篇教学材料（X 帖子、LoopArena 教學），把站点从「六维 LLM-as-Judge 自动评测」整体重构为「智能体 LoopArena 评测与排行」：

1. **采用 LoopArena 评测机制**：Controller（被评测模型，只决策）与 Worker（固定编码 Agent，只动手）分开测，隔离出控制能力。
2. **排行榜只对主流编程智能体排序打分**：主榜 = 论文 Table 2 真实跑过的 5 个模型，额外补充 Claude Code / Codex / Cursor 等主流产品作为「待评测」占位。
3. **`/eval` 改为 LoopArena 说明页**：保留路由，移除旧 LLM-as-Judge 跑分与数据导入/导出功能，改为介绍机制与复现入口。

### 主要改动

1. **数据模型（`src/lib/agentbench-data.ts` 重写）**
   - `LoopAgent`（`kind: controller | reference | product`）与 `LoopResult`（`type1Acc / type2Ssr / type2Cost / type3Ssr / type3Cost / src`）。
   - 种子 `AGENTS` = 论文 Table 2 的 5 个 Controller（GPT-5.5 / Claude Opus 4.8 / Qwen3.7-Plus / DeepSeek-V4-Flash-0731 / GLM 5.2）+ 2 个参考策略（No control / Fixed control）；`PRODUCTS` = 9 个待评测产品。
   - 导出 `CONTROLLERS` / `REFERENCES` / `rankedAgents()` / `kindLabel` / `fmtPct` / `fmtCost`。
2. **榜单存储（`src/lib/leaderboard-store.ts` 重写）**：移除 localStorage 读写，改为直接返回策展常量 `SNAPSHOT`（`SNAPSHOT_DATE = "2026-08"`，SSR 安全）。
3. **排行榜（`BenchApp.tsx` 重写）**：主榜按 Type III SSR 降序，支持按名称 / Type I / Type II / Type III 排序；参考策略独立表格；待评测产品卡片网格。
4. **详情页（`AgentDetail.tsx` 重写）**：三级结果卡片（Type I 合同准确率 / Type II / Type III SSR + 成本）；参考策略不显示 Type I；待评测产品显示空态。
5. **首页方法区块（`StaticSections.tsx` 重写）**：导出 `Mechanism / Tiers / Pipeline / Metrics / Scope`，覆盖三角色、两对象、三级评测、双层循环、指标与参考策略、评测范围。
6. **`/eval` 说明页（`LoopArenaExplainer.tsx` 新增 + `eval.tsx` 重写）**：角色 / 对象 / 三级评测表（论文真值）/ 参考策略 / 复现入口。
7. **路由与站点外壳（`index.tsx` / `board.tsx` / `agents/$name.tsx` / `SiteShell.tsx`）**：首页首屏与 meta、榜单导航与 CTA、详情页 meta 全部更新为 LoopArena 口径；`/eval` 导航文案改为「LoopArena 机制」。
8. **删除旧 LLM-as-Judge 代码**：`src/lib/agent-eval.ts`、`src/lib/eval-server.ts`、`src/components/agentbench/EvalApp.tsx`、`src/components/agentbench/DataPipeline.tsx`、`scripts/run-agent-eval.ts`。

### 验证结果

- `bunx tsc --noEmit`：0 错误；`bun run build`：通过（nitro 产物含 `board / eval / agents` 页面，route 树自动生成）。

### 反思与改进空间

- **数据口径**：榜单分数来自论文公开发布快照，仅代表论文口径与当时复现环境；后续若需真实复现，需在官方 harness 上跑 Type II / Type III 再更新种子。
- **待评测产品**：目前 9 个主流产品均为占位；接入真实 LoopArena 分数后并入主榜即可。
- **内容维护**：机制文案集中在 `StaticSections.tsx` 与 `LoopArenaExplainer.tsx`，后续如做 i18n 可先抽为文案模块。

## M3.1 变更记录（2026-09-09）· 详情页补齐 LoopArena 扩展元数据

### 背景与目标

M3 后详情页只展示核心分数（Type I 准确率、Type II/III 的 SSR 与成本），缺少官网 `results.json` 里的扩展元数据：Type I 成本、95% 置信区间、BeyondSWE / SCBench 来源拆分，以及全局 findings（Spearman ρ、成本下降幅度等）。本次把这些元数据补齐到详情页，数据口径对齐 `https://amap-ml.github.io/LoopArena/data/results.json`。

### 主要改动

1. **数据模型（`src/lib/agentbench-data.ts`）**
   - `LoopResult` 新增 `type1Cost` / `type2Ci` / `type2Split` / `type3Ci` / `type3Split`；新增 `SourceSplit` / `SourceSplitRow` 类型与 `split()` 构造 helper。
   - 导出全局 `FINDINGS`（`spearmanRho=0.9747`、`type2CostReductionPct=64.4`、`bestType3Ssr=24.69`、`headlinePolicy="Core checks"`、`release/validatedOn`）。
   - `AGENTS` 种子补全全部元数据（供 `/eval` 说明页使用）。
2. **数据库（`eval_runs` 表，19 行 UPDATE）**：为 looparena 行在 `metrics` 追加 `cost`（type1）、`ci_lo/ci_hi/bs_success/sc_success`（type2/type3），数值对齐官网。
3. **派生逻辑（`src/lib/eval-queries.ts`）**：`deriveAgents` 新增 `ciOf()` / `splitOf()` 解析（样本数固定 BeyondSWE 48 / SCBench 33），`ensure()` 补全新字段默认 `null`。
4. **详情页（`src/components/agentbench/AgentDetail.tsx`）**：`TierCard` 增强展示「95% CI」与「来源拆分」，Type I 增「90 题响应成本」；三级结果下方新增「关键发现」卡片（Spearman ρ / 成本下降 / Core checks）。

### 验证结果

- TypeScript 诊断 0 错误；详情页 `HTTP 200`。
- Puppeteer 实测 `/agents/GPT-5.5`：Type I 显示 90 题成本 $9.43；Type II 显示 95% CI 34.57%–70.37% 与 BeyondSWE 18/48、SCBench 24/33；Type III 显示 95% CI 9.88%–40.74% 与 BeyondSWE 14/48、SCBench 6/33；「关键发现」卡片三项齐全，数值与官网一致。

### 反思与改进空间

- **数据双写**：榜单数据同时存在于数据库 `eval_runs` 与静态常量 `AGENTS` 两处；前者服务 `/board`、`/agents/$name`，后者服务 `/eval` 说明页，二者需手工同步。后续建议统一为「数据库为唯一数据源，`/eval` 也从库读」。
- **样本数硬编码**：BeyondSWE 48 / SCBench 33 为 v0.1.0 固定配置，目前硬编码在 `splitOf()`；若未来版本题目数变化需改为随数据存储。

## M1 变更记录（2026-09-03）

### 背景与目标

原页面为纯内容型「说明页」视觉：区块标题字号偏小、四类数据表样式重复、缺少产品化信息层级。本次在不改变任何业务逻辑与数据模型的前提下，参照所选设计系统（TraeWork Light）完成视觉与信息架构重构。

### 主要改动

1. **设计令牌层（`src/styles.css`）**
   - 重构 `:root` 色板为近系统语言的语义体系：品牌紫 `--brand`、中性表面、语义状态色，全部 oklch。
   - 新增布局与质感 token：`--page-shell / --page-gutter / --hero-gradient / --metric-shadow / --grid-line`。
   - 新增组件层：`.ab-container / .ab-panel / .ab-chip(-brand) / .ab-button(primary|secondary|ghost) / .ab-section-* / .ab-data-table / .ab-table-scroll / .ab-grid-bg / .ab-kpi-card / .ab-dot`，并保留 shadcn 兼容变量。
   - 自定义 `metric`（等宽数字）工具类。
   - 设计原则落地：表面中性化、语义色仅用于状态、卡片细边框 + 轻投影。

2. **首页外壳（`index.tsx`）**
   - 顶部导航改为毛玻璃吸顶条 + 工作台双行品牌区 + 数据快照胶囊 + 「接入数据」主 CTA。
   - 首屏升级为双栏工作台面板：左侧定位文案与三个价值点，右侧「总分构成」权重可视化卡 + 「数据可信度」卡；底部保留完整数据口径声明。

3. **核心交互区（`BenchApp.tsx`）**
   - 所有区块统一标题体系（Eyebrow + 大标题 + 说明）。
   - 场景切换改为品牌胶囊按钮组并放到区块头部；权重面板改为可折叠式卡片（品牌色权重徽标 + 滑杆）；表头支持双行（维度名 + 权重/推算说明）。
   - 排行榜表格重做：排名徽标、总分进度条、来源信息行内化、勾选行品牌浅底高亮。
   - 雷达区重构为「图表 + 选中 Agent 摘要卡」双栏；数据接入改为带标题头的 schema 代码块。

4. **静态区块（`StaticSections.tsx`）**
   - 四张方法 / 评分器 / 审计表格统一为 `.ab-data-table` 视觉规范，表头英文语义化。
   - 卡片从纯白改为带细分隔的浅品牌色面板；关键结论（公式、组合策略）放入浅灰代码卡强调。

5. **健壮性修复**
   - `.ab-panel` 增加 `min-width: 0`，修复移动端网格内卡片被内容撑破导致的页面级横向溢出。
   - 移动端表格由 `.ab-table-scroll` 横向滚动兜底。

### 验证结果

- `bun run build`：通过；产物含全部新样式类。
- `bunx tsc --noEmit`：0 错误。
- Playwright 双端视口：1440px 桌面与 390px 移动均无页面级横向溢出；控制台无报错。

### 反思与改进空间

- **接下来可做**：把六维权重配置保存到 `localStorage`，刷新不丢；为榜单增加「只看有来源」筛选。
- **已知边界**：当前图表为手写 SVG，数据量扩大后可平滑替换为 Recharts（依赖已就绪）。
- **长期**：接入真实评测 API 后，建议将「数据快照日期」与审计台账做版本化联动。

## M1.1 变更记录（2026-09-03）

### 背景与目标

原站是单页长滚动 + 锚点导航（`#board` 排行榜 / `#radar` 对比 / `#method` / `#graders` / `#audit`）。为让「排行榜」成为一个可直接访问、独立分享的页面，将其与联动的雷达对比、数据接入一起拆出为独立路由 `/board`。

### 主要改动

1. **新增 `/board` 排行榜工作台页（`src/routes/board.tsx`）**
   - 承载原 `BenchApp`（排行榜 + 权重自定义 + 勾选雷达对比 + 数据接入）整组交互，联动逻辑不丢失。
   - 页内导航锚点：排行榜 `#board` / 对比分析 `#radar` / 数据接入 `#data`；顶部带「数据快照」胶囊与「接入数据」CTA。

2. **首页瘦身（`src/routes/index.tsx`）**
   - 移除 `BenchApp`，首页保留首屏 Hero（数据口径声明）与静态介绍区块（评测方法 / 评分器 / 效度审计）。
   - 顶部导航仅保留首页区块锚点；右侧主 CTA 改为「查看排行榜 → `/board`」。
   - Hero 两个榜单相关按钮改为跳转 `/board` 与 `/board#radar`。

3. **抽取站点外壳（`src/components/agentbench/SiteShell.tsx`）**
   - 顶部导航 / 页脚从首页内联抽出为两页共用组件，导航项、快照 chip、CTA 以 props 参数化。

4. **文档同步**：`overview / requirements / tech-specs / user-structure` 更新为两页信息架构。

### 验证结果

- `bunx tsc --noEmit`：0 错误；路由树自动重新生成（含 `/board`）。
- 浏览器实测（Puppeteer，桌面视口）：首页无排行大表格；「查看排行榜」→ `/board` 渲染场景切换 + 权重滑块 + 8 行排行表；「接入数据」锚点到 `#data` schema 区；品牌 Logo 返回首页；直达 `/board#radar` 渲染雷达对比。全部 PASS，控制台无运行时报错（仅既有 hydration 开发告警）。
- 移动端：榜单/数据区块沿用 `.ab-table-scroll` 兜底，无页面级横向溢出。

### 反思与改进空间

- **语义保留**：`/board` 下的 `#board` 锚点与页面同名，URL 读作 `/board#board` 略显冗余，可接受（保证旧锚点可用）；后续若再做分享功能可考虑去掉首屏区块 id。
- **状态边界**：两页各自独立挂载 `BenchApp`，榜单状态（勾选/权重/导入数据）不跨页共享，符合「首页纯介绍」的分工；若未来希望两页间保持数据一致，需将 `agents` 提升为全局 store 或 `localStorage`。
- **潜在扩展**：`/board` 与首页头部由同一 `SiteHeader` 渲染，新增页面（如单 Agent 详情）时可继续复用。

## M1.2 变更记录（2026-09-03）

### 背景与目标

顶部导航在 M1 重构后样式偏朴素：品牌区层次弱、导航链接为纯文字无反馈、当前所在区块无指示。本次在不改动信息架构与交互逻辑的前提下，对两页共用的 `SiteHeader` 做一轮「字体 + 排版 + 动效」精修。

### 主要改动

1. **导航链接（`src/styles.css` 新增 `.ab-nav-link`，`SiteShell.tsx` 改用）**
   - 常规态为 13.5px / 500 灰色文字，悬停出现淡品牌色胶囊底并加深文字色。
   - 新增「当前区块」状态：点击锚点或带锚点直达时，对应导航项变为品牌色 + 600 字重 + 底部 2px 品牌下划线指示条（`::after` scaleX 过渡）。
   - 状态由 `SiteHeader` 内监听 `hashchange` 驱动，首页与 `/board` 通用。

2. **品牌区精修**
   - Logo 方块改为品牌紫渐变 + 白色内描边 + 微光晕；悬停轻微放大（1.04x）。
   - 主标题 15px / 700 收紧字距；副标题改为 10px 小字 + 0.12em 字距，营造产品化层次。
   - 品牌与导航之间增加 1px 细分隔线，划清「身份区」与「导航区」。

3. **Header 容器微调**：背景透明度 80%、细分隔线透明度 70%，间距按断点 `gap-5 / lg:gap-7` 自适应。

### 验证结果

- `bunx tsc --noEmit` 通过；首页与 `/board` SSR 均 200。
- 浏览器实测：常规态颜色 = `--text-2` 灰；真实 hover 出现淡紫胶囊底 + 文字变深；点击「评测方法」后 URL 带 `#method` 且该项获得 `is-active`（品牌紫 + 2px 下划线）；1440 / 1024（lg 断点）视口下首页与 `/board` 顶栏各子块无相交、无横向溢出；无 JS 运行错误。
- 已知边界：hover 底色为近中性淡紫白，视觉贴合设计 token 即可；移动端（<lg）导航区仍隐藏，汉堡菜单留待后续 UX 迭代。

### 反思与改进空间

- **移动端导航入口缺失**：两页导航在窄屏被隐藏，用户无法跳转区块。建议后续迭代用「抽屉 / 折叠面板」补齐，与本次的 `.ab-nav-link` 视觉共用。
- **激活态刷新体验**：带锚点直达（如 `/board#radar`）时激活态在客户端挂载后补上，属预期行为，无需 SSR 同步。

## M1.3 变更记录（2026-09-04）

### 背景与目标

依据 Wiki 文档《AI Agent 评估机制》（`agentbench-evaluation.md`）与《Agent 评估完全指南》（`agent-evaluation-complete-guide.md`）的口径，将两篇文档的机制、链路、反例与落地路线落到首页静态区块，让「怎么评」被讲透。本次只改首页介绍内容与导航，不触碰 `/board` 数据工作台与数据模型。

### 主要改动

1. **首页区块扩充（`StaticSections.tsx`，380 → 1100+ 行）**
   - `#method 评测方法`：维度表新增「测量来源」列（Outcome / Transcript / 推算）；新增 pass@k vs passᵏ 对照、非确定性（来源 / 差异量级 / 对策）面板，含 p=75% 展开与 82.7% pass³ 示例。
   - `#pipeline 评测链路`（新增区块）：执行层 vs 聚合层两层架构、六道工序 chip 流（Task→Trial×n→Transcript·Outcome→Grader→pass@k/passᵏ→六维加权）、Task/Trial/Transcript/Outcome/Grader/Harness 术语速查、两条「最容易翻车」推论（评估的是系统不只是模型；Transcript 会撒谎、Outcome 才是真相）。
   - `#audit 效度审计`：追加「能力评估 vs 回归评估」与「瑞士奶酪多信号补位」两面板。
   - `#agents Agent 类型`（新增区块）：编码 / 对话 / 研究 / 计算机操作四类差异评估表 + 「别掉进这些坑」。
   - `#roadmap 落地路线`（新增区块）：0→6 起步步骤（每步给结论与反例）、现成框架清单（Harbor / Promptfoo / Braintrust / LangSmith-Langfuse / Arize Phoenix）。
   - 文中明确标注：落地路线为 M2 规划参考，非当前已实现功能。

2. **首页外壳（`index.tsx`）**：顶部导航扩为六锚点（方法 / 链路 / 评分器 / 审计 / Agent 类型 / 路线），`<main>` 按新顺序装配六个区块。

3. **文档同步**：`requirements.md` 信息架构表、`tech-specs.md` / `user-structure.md` 文件职责、`wiki/agentbench-evaluation.md` §10 实现位置均更新。

### 验证结果

- `npm run build`：通过（`✓ built in 115ms`，nitro preview 正常）。
- TypeScript diagnostics：改动文件均无错误。
- Puppeteer（dev :8081，1440px）：六个区块全部渲染（标题 / 面板 / 文本齐全）；NAV 六锚点 + `/board` 可达，#roadmap 点击后平滑滚动到位；页面无横向溢出（overflow=0），各区块高度正常。

### 反思与改进空间

- **口径边界**：首页现以「方法讲透」为主，若未来接入真实评测管线（M2），可在 `#roadmap` 前把「演示数据 → 真实数据」的状态切换做成可视化，避免方法论与演示数据混淆。
- **内容维护**：六区块大量中文文案集中在 `StaticSections.tsx`，后续若需 i18n 或内容中台，应先抽出为文案模块再改造。

## M2.1 变更记录（2026-09-04）· 自动化 AI Agent 评测

> 注：本节描述的「一键导入到 /board（localStorage 收件箱）」结果流转已由同日 M2.2 改为「共享榜单存储」（见下），当前实现以 M2.2 为准。

### 背景与目标

依据 Wiki《AI Agent 评估机制》（`agentbench-evaluation.md` §8/§9）落地「真实跑分 v0」：从「纯前端看榜」跨到「自己造真分」。新增独立页面 `/eval`，真正调用大模型 API 完成「选模型 → 配套件 → 多次试跑 → 六维判分 → 产出 JSON」，并与 `/board` 现有导入能力闭环。本次范围不含编码沙盒类任务。

### 主要改动

1. **评测纯函数层（新增 `src/lib/agent-eval.ts`）**
   - 四通道厂商预设（OpenAI / Anthropic / Google Gemini / OpenRouter，含模型列表与 key 提示）；`EvalTask` / `EvalSuite` 模型。
   - 内置 6 个任务：对话套件（订阅退款政策判断 / 混合订单分项处理 / 账户安全身份核验）+ 研究与操作套件（市场规模信源引用 / 并购尽调风险清单 / 长文研究结构化简报）；每题带 prompt、工具说明、checkpoints、裁判提示与 token 预算。
   - 样本聚合（pass 率与均值）、`scenarioScoreOf`、Agent JSON 构建、`EvalInboxPayload` 类型。
2. **评测服务端层（新增 `src/lib/eval-server.ts`，server functions）**
   - `getEvalServerInfo`：只回传哪些通道已在服务端配置 Key（布尔）。
   - `runEvalSample`：单样本两段调用（被测 Agent 作答 → LLM-as-Judge 结构化 Rubric）；success/progress/tool/trust 走 Judge JSON，efficiency 走代码级 token 预算；OpenAI 兼容 / Anthropic / Gemini 三种 HTTP 适配，150s 超时；任何异常折叠为带 `error` 的作废样本返回，不触发整页 500。
   - 环境变量：`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` / `OPEN_ROUTER_API_KEY`，临时 Key 优先于环境变量。
3. **评测工作台组件（新增 `src/components/agentbench/EvalApp.tsx`）**
   - 配置面板（通道 / 模型 / Agent 名称·厂商 / 临时 Key / 套件勾选 / 试跑次数）→ 运行进度（逐样本状态）→ 报告区（分场景六维聚合 + 逐样本明细表 + 产物 JSON 预览）。
   - 结束动作：下载 JSON / 复制 JSON / 「一键导入到 /board」（写 localStorage 收件箱后跳转）。
4. **评测路由与站点外壳**
   - 新增 `src/routes/eval.tsx`（SEO head + 区块锚点导航 `#config/#report`）；sitemap 加入 `/eval`。
   - `SiteShell.tsx` 重构为「全局站点导航（排行榜 / 自动化评测，按 pathname 高亮）+ 页面区块锚点导航（按 hash 高亮）」双轨结构；首页与 `/board` 导航同步微调。
5. **榜单侧配套（`BenchApp.tsx` / `agentbench-data.ts`）**
   - `Agent.s` 放宽为部分场景结构；JSON 导入校验改为「至少一个已评测场景、仅校验存在的场景字段」，支持只测了 conv/os 的评测结果直接上榜。
   - 数据接入区新增收件箱「一键导入榜单」横幅与丢弃操作；空场景榜单渲染空态与跳转提示。
6. **健壮性修复**：本轮把 `tsc` 35 个错误全部清零（严格模式下的索引访问、可选属性、`src` 字段补齐、页面判断等），并对涉及文件统一 `prettier`。

### 验证结果

- `bunx tsc --noEmit`：0 错误；`bun run build`：通过（nitro 产物含 `eval` 页面与 `eval-server` chunk，route 树自动生成）。
- `bunx eslint` / `prettier --write`：涉及文件 0 error。
- 浏览器实测（dev :8082，桌面视口）：首页 / `/board` / `/eval` 三页均正常渲染、无业务报错；三页顶部全局导航均有「排行榜 · 自动化评测」且可互跳；`/eval` 配置面板（四通道 + 模型预设 + 临时 Key + 套件勾选）与无 Key 引导正常；`/board#data` 数据接入区与收件箱横幅落点存在。
- 未能本机真实验证真实跑分：当前服务端未配置任何 Key（四通道均探测为未配置），真实调用需在部署环境配置 Key 后由真人触发（预计一次全量 = 6 任务 × 次数 × 2 次模型调用）。

### 反思与改进空间

- **v0 口径取舍**：Judge 与被测模型同源同模型（非独立裁判），对能力接近的模型存在自评偏差风险；后续可支持「裁判模型独立选择」。
- **无沙盒**：v0 任务均为「作答 / 决策文本」形态（客服政策、信源研究），无真实 GUI / 代码执行环境；编码与计算机操作类（需 Outcome 真实终态核验）留待沙盒接入。
- **任务规模**：每套件 3 题，稳定性估计仍需更多试跑（trials ↑）与题目扩充（题库化）。
- **可复现性**：样本明细仅在页内展示，未持久化 Transcript；后续可将每样本答案落库或随 JSON 附注，支撑审计回溯。
- **成本提醒**：全量 6 任务 × 2 次 × 2 段调用 = 24 次模型调用，长模型单次评测成本可观；报告区已给出预计调用次数，建议先用小模型跑通流程。

## M2.2 变更记录（2026-09-04）· 数据接入区迁移至评测页 + 共享榜单存储

### 背景与目标

原「数据接入」区块位于 `/board` 底部，评测结果需经「localStorage 收件箱 → 跳转 `/board#data` → 一键导入」两步闭环，跨页数据不同步、流程割裂。按用户「把数据接入 section 移到自动化评测页」的诉求，将数据接入整体迁移到 `/eval` 底部，并把评测结果改为直接写入**跨页共享的榜单存储**，`/board` 打开即最新。

### 主要改动

1. **新增共享榜单存储（`src/lib/leaderboard-store.ts`）**
   - `localStorage[ab:leaderboard:v1]` 存 `{ updatedAt, agents }`；无写入时回退内置种子，首访 / SSR 一致。
   - `saveAgents`（整体替换 + 持久化 + 广播）、`mergeAgents`（按名称同名更新 / 新名追加）、`subscribeSnapshot` + `useLeaderboardSnapshot` Hook（首帧种子 → 挂载后同步本地并订阅变更）。
2. **评测页入库（`EvalApp.tsx`）**
   - 删除收件箱写入 / `goBoard` 跳转；报告区主按钮改为「并入榜单数据」＝ `saveAgents(mergeAgents(storeAgents, 本次结果))`，成功提示快照日期已更新并引导打开排行榜。
   - 页面底部常驻渲染迁移后的数据接入区块 `<DataPipeline />`；报告区保留「下载 / 复制 JSON」。
3. **数据接入组件（新增 `src/components/agentbench/DataPipeline.tsx`）**
   - 迁移自原 `/board` 数据接入：榜单状态总览（记录数 / 覆盖场景 / 快照日期）、导入 JSON 整体替换（校验逻辑不变）、导出当前 JSON / 全场景 CSV、schema 说明。
   - 原收件箱横幅与“一键导入”交互删除（评测结果已无需二次导入）。
4. **榜单页瘦身（`BenchApp.tsx` / `board.tsx`）**
   - `BenchApp` 改为读取共享榜单存储（`useLeaderboardSnapshot`），删除数据接入区块与全部导入 / 导出 / 收件箱逻辑，仅保留排行榜 + 多维对比；空态文案改为引导到自动化评测页。
   - `/board` 导航移除 `#data` 锚点；右上角「数据快照」chip 读取存储里的 `updatedAt` 实时展示；主 CTA 改为「去自动化评测」。
5. **评测路由与首页文案同步（`eval.tsx` / `index.tsx` / `StaticSections.tsx` / `SiteShell`）**
   - `/eval` 区块锚点加入 `#data`（评测配置 / 评测报告 / 数据接入）；SEO 描述更新。
   - 首页「数据下载」结构化数据 contentUrl 与收尾 CTA 由 `/board#data` 改为 `/eval#data`；正文「一键导入」措辞更新。
6. **契约清理（`src/lib/agent-eval.ts`）**：删除已无引用的 `EVAL_INBOX_KEY` / `EvalInboxPayload` 与孤立 `round1` 导出；相关注释改为「共享榜单 schema」。

### 验证结果

- `bunx tsc --noEmit`：0 错误；`bunx eslint --fix` 涉及文件 0 error；`bun run build`：通过。
- 浏览器实测（dev :8082，桌面视口，Puppeteer）：
  - `/board`：仅剩 `#board` / `#radar` 两个区块，`#data` 已不存在；导航无「数据接入」锚点；chip 显示 `数据快照 2026-04-23`（种子）。
  - `/eval`：底部渲染 `#data`「接入真实评测数据」区块（导入 / 导出按钮齐全），顶部导航含「数据接入」锚点。
  - 存储回流：向 `localStorage[ab:leaderboard:v1]` 写入含新 Agent 的快照（`updatedAt: 2026-09-04`）后重开 `/board`，chip 变为 `数据快照 2026-09-04`，切到「对话智能体」场景可见新 Agent 上榜；清空存储后回落种子（5 条 / 原快照日期）。
- 真实跑分仍待部署环境配置 Key 后人工触发（同 M2.1 边界）。

### 反思与改进空间

- **数据仅存本机**：榜单数据存浏览器 `localStorage`，换设备 / 清缓存即回退种子；若要做“多人共享榜单”，后续可接服务端存储 / 导出上传。
- **只覆盖已评测场景**：导入 / 并入的条目若只含单场景，其他场景榜单自然缺位并有空态引导，符合“只测了部分也可见”的产品语义。
- **合并是整条替换**：`mergeAgents` 对同名 Agent 用新数据整体覆盖其 `s`，若只重测了部分场景会丢掉旧场景数据；如需要“按场景合并”，可扩展为 `s` 层合并。

## M2.3 变更记录（2026-09-04）· 市面智能体 CLI 真实评测 + 智能体详情页

### 背景与目标

用户希望对市面上真实存在的智能体产品（Codex、Claude Code、Hermes、OpenCode、Trae 等）做评测，在排行榜按分数排名，并为每个智能体提供独立详情页查看评测结果。在既有 `/eval`（LLM API 跑分）之外，新增「CLI 智能体」这一真实被测形态：直接无交互调用本机已安装的智能体 CLI 作答内置套件，再用 Claude 当裁判打分。

### 主要改动

1. **新增真实 CLI 评测 runner（`scripts/run-agent-eval.ts`，Bun 运行）**
   - 定义 5 个被测 CLI（claude / codex / opencode / hermes / trae）的无交互命令模板，与裁判（固定 Claude）。
   - 复用 `src/lib/agent-eval.ts` 的 `SUITES` 与 `aggregateSamples`：对每个「任务 × trial」先让被测 CLI 作答，再让裁判按六维 Rubric 输出 JSON（success / progress / tool / trust），efficiency 走 token 预算代码级口径。
   - 逐样本容错（超时 / 无输出 / 裁判不可解析都折叠为带 error 的作废样本），最终产出符合共享榜单 schema 的 `scripts/output/agentbench-cli-eval-<日期>.json`，可在 `/eval#data` 直接导入。
   - 支持 `--only / --trials / --tasks / --dry-run` 参数。
2. **新增智能体详情页（`src/routes/agents/$name.tsx` + `src/components/agentbench/AgentDetail.tsx`）**
   - 展示单 Agent 基本信息、场景切换、六维分数表（含权重与维度说明）、六维雷达图、总分与数据来源（src）标注；无匹配条目时渲染 404 空态。
3. **排行榜联动（`BenchApp.tsx`）**：Agent 名称改为指向 `/agents/<name>` 的可点击链接。
4. **种子数据（`src/lib/agentbench-data.ts`）**
   - 并入本轮**真实跑出**的 `Claude Code`（Anthropic，demo=false）：对话 66.7 / 研究与操作 100，来源标注「内置评测套件 v0（CLI 真实跑分）」。
   - 新增 `Codex / OpenCode / Hermes / Trae` 四条目为 demo=true 占位（分数 0、src=null，标注「占位示例 / 构造值，接入真实评测后替换」），待本机（非沙箱）跑脚本生成真实分数后覆盖。

### 验证结果

- `bunx tsc --noEmit`：0 错误；`bun run build`：通过（route 树自动生成 `/agents/$name`，产物含 `_name-*.mjs` chunk）。
- 真实跑分链路实测：`bun scripts/run-agent-eval.ts --only "Claude Code" --trials 1` 真实调用 `claude -p` 跑完 6 个任务并产出 JSON（对话 success 66.7%、研究与操作 success 100%）。
- 环境边界：当前受限沙箱内仅 `claude` 可无交互跑通；`codex`（state 文件被沙箱拦截）、`hermes`（日志文件被拦）、`opencode`（provider 未配置 + 锁文件被拦）、`trae`（GUI）均需在非沙箱本机终端运行脚本。

### 反思与改进空间

- **裁判同源自评**：裁判固定为 Claude，与「Claude Code」被测对象同源，存在自评偏差；后续可让裁判模型独立于被测对象（如指定其它 CLI 或独立 API）。
- **efficiency 口径偏粗糙**：以「字符数」近似 token 并与单题预算比较，导致输出较长的 CLI 得分被压低（Claude Code 对话 efficiency=0）；后续应改为按真实 token 计数或放宽预算。
- **zcode / deepseek harness 未接入**：`zcode` 本机未安装、`deepseek harness` 无可识别的对应 CLI，本轮跳过；确认真实工具后补充到 `CLIS` 列表即可复用同一脚本。
