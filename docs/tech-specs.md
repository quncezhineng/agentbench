# AgentBench 智衡 · 技术规格

## 技术栈

- **框架**：React 19 + TypeScript，TanStack Start（文件路由，路由文件 `src/routes/*.tsx`）
- **样式**：Tailwind CSS v4（`@theme inline` + CSS 变量），自定义 `@utility` 与 `@layer components`
- **包管理 / 运行**：Bun（`bun install` / `bun run dev` / `bun run build`）
- **图表**：无重依赖；进度条与排名徽标为手写内联 SVG/HTML

## 设计体系约束（依据 TraeWork 设计系统）

本次重构以 TraeWork 设计系统（Light）为约束源，落地到本项目的自有用例语义变量：

### 色板（`:root`，oklch）

| 语义                              | 用途                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `--brand`                         | 品牌紫，主按钮 / 激活态 / 高亮数值（对应系统 `bg-brand`） |
| `--background`                    | 页面底色（接近纯白 + 顶部品牌泛光）                       |
| `--surface` / `--surface-2`       | 卡片白 / 次级灰底                                         |
| `--text-2` / `--text-3`           | 次级 / 弱化文字                                           |
| `--ok` `--warn` `--info` `--risk` | 状态色，用于来源、待评测、审计标签等语义场景              |

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

| 文件                                               | 职责                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles.css`                                   | 全局设计 token、自定义工具类、组件类                                                                                                  |
| `src/routes/index.tsx`                             | 首页：品牌导航 + LoopArena 首屏 Hero，装配机制 / 三级评测 / 链路 / 指标 / 范围区块与页脚                                              |
| `src/routes/board.tsx`                             | 排行榜页 `/board`：顶部导航（区块锚点 `#board/#references/#pending`，右上角展示数据快照日期）+ `BenchApp` + 页脚                      |
| `src/routes/eval.tsx`                              | LoopArena 机制说明页 `/eval`：SEO head + `SiteHeader`（区块锚点 `#roles/#tiers/#references/#reproduce`）+ `LoopArenaExplainer` + 页脚 |
| `src/routes/agents/$name.tsx`                      | 智能体详情页 `/agents/:name`：SEO head + `AgentDetail` + 页脚                                                                         |
| `src/components/agentbench/SiteShell.tsx`          | 三页共用的站点外壳：全局站点导航（排行榜 / LoopArena 机制）+ 页面区块锚点导航（按 pathname / hash 分别高亮）+ 页脚                    |
| `src/components/agentbench/BenchApp.tsx`           | 排行榜：主榜（Type I/II/III 可排序评分表）+ 参考策略表 + 待评测产品卡片                                                               |
| `src/components/agentbench/AgentDetail.tsx`        | 单智能体详情：概览 + Type I / II / III 三级结果 + 数据来源                                                                            |
| `src/components/agentbench/StaticSections.tsx`     | 首页静态区块：机制（Controller/Worker/Reporter）/ 三级评测 / 链路 / 指标 / 范围                                                       |
| `src/components/agentbench/LoopArenaExplainer.tsx` | `/eval` 说明页主体：角色 / 对象 / 三级评测表 / 参考策略 / 复现入口                                                                    |
| `src/lib/agentbench-data.ts`                       | LoopArena 数据模型、论文种子数据、参考策略、排序与格式化纯函数                                                                        |
| `src/lib/leaderboard-store.ts`                     | 榜单快照：直接返回策展常量 `SNAPSHOT`（SSR 安全，不再读写 localStorage）                                                              |

### 数据层说明（LoopArena 口径）

- `src/lib/agentbench-data.ts` 只含类型、常量与纯函数，不做网络调用：
  - `LoopAgent`（`kind: controller | reference | product`）与 `LoopResult`（`type1Acc / type2Ssr / type2Cost / type3Ssr / type3Cost / src`）。
  - 种子数据 `AGENTS` = 论文 Table 2 的 5 个 Controller + 2 个参考策略；`PRODUCTS` = 额外补充的主流编程智能体（`demo: true`，无分数）。
  - 导出 `CONTROLLERS` / `REFERENCES` / `rankedAgents()` / `kindLabel` / `fmtPct` / `fmtCost`。
- `src/lib/leaderboard-store.ts` 的 `useLeaderboardSnapshot()` 直接返回常量快照（`SNAPSHOT_DATE = "2026-08"`），首页 / `/board` / `/agents/:name` 共用同一份策展数据，`/board` 右上角「数据快照」chip 展示该日期。

## 质量约定

- 纯展示数据与交互逻辑分离：改文案不碰逻辑，改逻辑不碰文案。
- 移动端：表格滚动容器兜底，禁止页面级横向溢出。
- 可访问性：交互控件带 `aria-label`；排序表头为可点击按钮。
- 命令：`bun run dev` 本地预览；`bun run build` 产物验证；`bunx tsc --noEmit` 类型检查；`bunx eslint <file>` 与 `bunx prettier --write <file>` 维护格式。
- TS 严格约束：`exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`；可选属性不得直接赋 `undefined`（用条件展开）。
