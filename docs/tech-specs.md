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
| `src/routes/board.tsx`                         | 排行榜工作台页 `/board`：顶部导航 + `BenchApp` + 页脚                    |
| `src/components/agentbench/SiteShell.tsx`      | 两页共用的顶部导航（参数化导航项 / 数据快照 chip / CTA）与页脚           |
| `src/components/agentbench/BenchApp.tsx`       | 排行榜 + 权重 + 雷达对比 + 数据接入（全部交互逻辑，整组挂载于 `/board`） |
| `src/components/agentbench/StaticSections.tsx` | 首页静态区块：评测方法（含测量来源）/ 链路术语 / 评分器 / 审计扩充 / 四类 Agent / 落地路线；每区块 1 个核心面板全宽展开 + 二级内容用 `Fold`（原生 `<details>`）收纳 |
| `src/lib/agentbench-data.ts`                   | 数据模型、种子数据、评分函数（纯函数，可单测）                           |

## 质量约定

- 纯展示数据与交互逻辑分离：改文案不碰逻辑，改逻辑不碰文案。
- 移动端：表格滚动容器兜底，禁止页面级横向溢出（以 Playwright 双端视口校验为准）。
- 可访问性：交互控件带 `aria-label`，对比复选框有明确语义标签。
- 命令：`bun run dev` 本地预览；`bun run build` 产物验证；`bunx tsc --noEmit` 类型检查。
