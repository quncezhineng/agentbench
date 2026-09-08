# AgentBench 智衡 · 技术规格

## 技术栈

- **框架**：React 19 + TypeScript，TanStack Start（文件路由，路由文件 `src/routes/*.tsx`）
- **样式**：Tailwind CSS v4（`@theme inline` + CSS 变量），自定义 `@utility` 与 `@layer components`
- **包管理 / 运行**：Bun（`bun install` / `bun run dev` / `bun run build`）
- **图表**：雷达图为手写 SVG（`BenchApp.tsx` 内 `Radar` 组件），无重依赖

## 设计体系约束（依据 TraeWork 设计系统）

本次重构以 TraeWork 设计系统（Light）为约束源，落地到本项目的自有用例语义变量：

### 色板（`:root`，oklch）

| 语义                              | 用途                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `--brand`                         | 品牌紫，主按钮 / 激活态 / 高亮数值（对应系统 `bg-brand`） |
| `--background`                    | 页面底色（接近纯白 + 顶部品牌泛光）                       |
| `--surface` / `--surface-2`       | 卡片白 / 次级灰底                                         |
| `--text-2` / `--text-3`           | 次级 / 弱化文字                                           |
| `--ok` `--warn` `--info` `--risk` | 状态色，用于来源、构造值、审计标签等语义场景              |

设计原则：**表面保持中性白，语义色只用于内联状态与关键数值**，品牌色不做大面积铺底。

### 排版

- 无衬线系统字体栈（`-apple-system` / PingFang SC 优先）
- 大标题 `tracking-[-0.04em]` 收紧字距，`text-brand` 做局部强调
- 数字统一 `.metric`（等宽 + tabular-nums）保证列对齐

### 组件化样式（`src/styles.css` `@layer components`）

| 类                                                            | 用途                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.ab-container`                                               | 1280px 居中容器，响应式留白 `clamp(20px,3vw,40px)`                          |
| `.ab-panel`                                                   | 卡片面板：浅品牌色混白底 + 细边框 + 柔和投影；内含 `min-width:0` 防网格撑破 |
| `.ab-grid-bg`                                                 | 首屏面板的细网格装饰（`::before`，不遮挡内容）                              |
| `.ab-chip` / `.ab-chip-brand`                                 | 胶囊标签 / 品牌强调标签                                                     |
| `.ab-button`（primary / secondary / ghost）                   | 统一按钮：40px 高、12px 圆角、hover 上浮                                    |
| `.ab-kpi-card`                                                | 指标卡（白底圆角阴影）                                                      |
| `.ab-data-table`                                              | 数据表统一栅格：行分隔线、语义化表头、末行去线                              |
| `.ab-table-scroll`                                            | 表格横向滚动容器（移动端不撑破页面）                                        |
| `.ab-section-head` / `.ab-section-title` / `.ab-section-desc` | 区块标题体系                                                                |

## 代码组织

| 文件                                           | 职责                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `src/styles.css`                               | 全局设计 token、自定义工具类、组件类                                     |
| `src/routes/index.tsx`                         | 首页：品牌导航 + 首屏 Hero，装配评测方法 / 链路 / 评分器 / 审计 / Agent 类型 / 落地路线区块与页脚 |
| `src/routes/board.tsx`                         | 排行榜工作台页 `/board`：顶部导航（区块锚点 `#board/#radar`，右上角展示数据快照日期）+ `BenchApp` + 页脚 |
| `src/routes/eval.tsx`                          | 自动化评测页 `/eval`：SEO head + `SiteHeader`（区块锚点 `#config/#report/#data`）+ `EvalApp` + 页脚 |
| `src/components/agentbench/SiteShell.tsx`      | 三页共用的站点外壳：全局站点导航（排行榜 / 自动化评测）+ 页面区块锚点导航（按 pathname / hash 分别高亮）+ 页脚 |
| `src/components/agentbench/BenchApp.tsx`       | 排行榜 + 权重自定义 + 雷达对比（数据统一来自共享榜单存储，见下方说明）   |
| `src/components/agentbench/EvalApp.tsx`        | 评测工作台：配置面板 / 运行进度 / 分场景报告 /「并入榜单数据」/ JSON 下载·复制 / 底部渲染 `DataPipeline` |
| `src/components/agentbench/DataPipeline.tsx`   | 数据接入区块（渲染在 `/eval` 底部 `#data`）：榜单状态总览、导入 JSON 整体替换、导出 JSON/CSV、schema 说明 |
| `src/components/agentbench/StaticSections.tsx` | 首页静态区块：评测方法（含测量来源）/ 链路术语 / 评分器 / 审计扩充 / 四类 Agent / 落地路线 |
| `src/lib/agentbench-data.ts`                   | 榜单数据模型、种子数据、评分函数（纯函数，可单测）                       |
| `src/lib/leaderboard-store.ts`                 | 共享榜单存储：`localStorage`（`ab:leaderboard:v1`）读写 + 内存缓存 + 变更订阅 + `useLeaderboardSnapshot` Hook + `mergeAgents` / `saveAgents`（/eval 并入与 /board 展示共用） |
| `src/lib/agent-eval.ts`                        | 评测纯函数层：厂商预设、`EvalTask`/`EvalSuite` 模型与 6 个内置任务（conv 3 + os 3）、样本聚合、Agent JSON 构建（浏览器与服务端共用） |
| `src/lib/eval-server.ts`                       | 评测服务端层（TanStack Start server functions）：`getEvalServerInfo`（哪些通道已配 Key）、`runEvalSample`（真实 LLM 调用 + LLM-as-Judge 评分） |

### 自动化评测：服务端函数与环境变量

- `runEvalSample` 为 `createServerFn({ method: "POST" })`，**只跑在服务端**（`process.env` 只在这里读取），客户端仅传配置数据。
- API Key 优先级：本次运行临时 Key > 服务端环境变量。环境变量映射：

| 通道       | 环境变量            |
| ---------- | ------------------- |
| OpenAI     | `OPENAI_API_KEY`    |
| Anthropic  | `ANTHROPIC_API_KEY` |
| Google Gemini | `GOOGLE_API_KEY`    |
| OpenRouter | `OPEN_ROUTER_API_KEY` |

- 各厂商 HTTP 适配：OpenAI 兼容 / Anthropic Messages / Gemini `generateContent`，统一返回 `{ text, promptTokens, completionTokens }`；单请求 150s 超时（AbortController）。
- 评分流程（每样本两段调用）：① 被测 Agent 依据任务 policy/资料作答（`subject`）→ ② Judge 按结构化 Rubric 输出严格 JSON `{"success","progress","tool","trust","note"}`；`efficiency` 由代码按 `budgetTokens` 计算；解析失败或网络异常均折叠为带 `error` 的作废样本返回（不触发整页 500 的应用错误中间件）。
- 共享榜单存储（跨页数据源，替代原“收件箱 + 跳转 /board#data 一键导入”流转）：
  - 数据统一放 `localStorage[ab:leaderboard:v1]`，结构 `{ updatedAt: "YYYY-MM-DD", agents: Agent[] }`；无写入时回退内置种子数据，保证首访 / SSR 与刷新一致。
  - `/eval` 评测结束「并入榜单数据」＝ `saveAgents(mergeAgents(当前榜单, 本次结果))`，按 Agent 名称同名更新、新名追加；数据接入区「导入 JSON 替换」＝ `saveAgents(整批新数据)` 整体覆盖。
  - `useLeaderboardSnapshot` Hook 首帧渲染种子（hydration 一致），挂载后读取本地并订阅变更；`saveAgents` 写内存缓存 + `localStorage` 并向所有订阅者广播，因此 `/board` 打开即最新，无需再次手动导入。
  - `/board` 右上角「数据快照」chip 展示存储里的 `updatedAt`，本地入库后日期实时更新。

## 质量约定

- 纯展示数据与交互逻辑分离：改文案不碰逻辑，改逻辑不碰文案。
- 移动端：表格滚动容器兜底，禁止页面级横向溢出（以 Playwright 双端视口校验为准）。
- 可访问性：交互控件带 `aria-label`，对比复选框有明确语义标签。
- 命令：`bun run dev` 本地预览；`bun run build` 产物验证；`bunx tsc --noEmit` 类型检查；`bunx eslint <file>` 与 `bunx prettier --write <file>` 维护格式。
- TS 严格约束：`exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`；服务端响应对象必须声明显式接口并用 `?.` 访问，避免“索引签名对象可能为 undefined”一类错误。
