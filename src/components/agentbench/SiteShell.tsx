/**
 * 站点外壳：全站共用的顶部导航与页脚。
 *
 * 导航结构（按现有全部公开路由设计）：
 * - 站点主导航：/board 排行榜 · /eval LoopArena 机制 · /compare/swe-bench 对比 SWE-bench
 *   · /runs 评测结果库 · /sources 数据来源 · /calendar 评测日历 —— 按当前路径高亮（含子路径）；
 * - 页内区块导航（props.navs）：当前页面内的锚点，单独一行、可横向滑动，依据 URL hash 高亮；
 * - 移动端：汉堡菜单展开全部站点入口与 CTA；
 * - 右上角：数据快照 chip + 主 CTA（props 参数化）。
 */

import { useEffect, useState } from "react";

export interface NavItem {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  /** 页面内区块锚点导航（#xxx） */
  navs: NavItem[];
  /** 右上角「数据快照」chip 文案 */
  chip?: string;
  /** 右上角主按钮 CTA */
  cta?: NavItem;
  /** 保留参数：旧调用方会传入，新的双行导航不再需要它 */
  siteAfterNav?: boolean;
}

/** 全站统一的站点入口：覆盖所有公开页面路由（详情页 /agents/* 与 /runs/* 从列表进入，不占导航位） */
const SITES: NavItem[] = [
  { href: "/board", label: "排行榜" },
  { href: "/eval", label: "LoopArena 机制" },
  { href: "/compare/swe-bench", label: "对比 SWE-bench" },
  { href: "/runs", label: "评测结果库" },
  { href: "/sources", label: "数据来源" },
  { href: "/calendar", label: "评测日历" },
];

export function SiteHeader({ navs, chip, cta }: SiteHeaderProps) {
  // 同时监听路径（站点高亮）与锚点（区块高亮）
  const [loc, setLoc] = useState({ path: "", hash: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const sync = () => setLoc({ path: window.location.pathname, hash: window.location.hash });
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const isHashActive = (href: string) => href.startsWith("#") && loc.hash === href;
  // 子路径也算命中：/runs/abc 与 /agents/xxx 高亮「评测结果库」/「排行榜」
  const isSiteActive = (href: string) =>
    loc.path === href ||
    (href === "/runs" && loc.path.startsWith("/runs/")) ||
    (href === "/board" && loc.path.startsWith("/agents/"));

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/80 backdrop-blur-xl">
      {/* 第一行：品牌 + 站点主导航 + 操作区 */}
      <div className="ab-container flex min-h-16 items-center gap-4 py-3 lg:gap-6">
        {/* 品牌：点击回首页 */}
        <a href="/" className="group flex shrink-0 items-center gap-3 font-semibold tracking-tight">
          <img
            src="/logo.svg"
            alt=""
            className="block shrink-0 rounded-[10px] shadow-[0_10px_24px_color-mix(in_oklab,var(--brand)_28%,transparent)] transition-transform duration-200 group-hover:scale-[1.04]"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-[-0.01em] text-foreground">
              AgentBench 智衡
            </span>
          </span>
        </a>

        {/* 站点主导航（桌面端）：品牌 | 分隔线 | 全部站点入口 */}
        <span aria-hidden="true" className="hidden h-5 w-px bg-border lg:block" />
        <nav aria-label="站点导航" className="hidden items-center gap-0.5 lg:flex">
          {SITES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              aria-current={isSiteActive(s.href) ? "true" : undefined}
              className={`ab-nav-link ${isSiteActive(s.href) ? "is-active" : ""}`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {chip && (
            <span className="ab-chip ab-chip-ghost hidden sm:inline-flex">
              <span className="ab-dot text-ok" />
              {chip}
            </span>
          )}
          {cta && (
            <a href={cta.href} className="ab-button ab-button-primary hidden sm:inline-flex">
              {cta.label}
            </a>
          )}
          {/* 移动端汉堡按钮 */}
          <button
            type="button"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/70 text-foreground transition-colors hover:bg-surface-2 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 5h12M3 9h12M3 13h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 第二行：页内区块锚点（所有端可见，可横向滑动） */}
      {navs.length > 0 && (
        <div className="border-t border-border/50">
          <nav
            aria-label="页面导航"
            className="ab-container flex items-center gap-1 overflow-x-auto py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <span className="mr-1 shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
              本页
            </span>
            {navs.map((n) => (
              <a
                key={n.href}
                href={n.href}
                aria-current={isHashActive(n.href) ? "true" : undefined}
                className={`ab-nav-link shrink-0 ${isHashActive(n.href) ? "is-active" : ""}`}
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* 移动端展开菜单：全部站点入口 + CTA */}
      {menuOpen && (
        <div className="border-t border-border/50 bg-white/95 lg:hidden">
          <nav aria-label="移动端站点导航" className="ab-container flex flex-col gap-1 py-3">
            {SITES.map((s) => (
              <a
                key={s.href}
                href={s.href}
                aria-current={isSiteActive(s.href) ? "true" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-colors ${
                  isSiteActive(s.href)
                    ? "bg-brand-soft text-brand"
                    : "text-text-2 hover:bg-surface-2"
                }`}
              >
                {s.label}
              </a>
            ))}
            {cta && (
              <a
                href={cta.href}
                onClick={() => setMenuOpen(false)}
                className="ab-button ab-button-primary mt-2 justify-center"
              >
                {cta.label}
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border py-8 text-[12px] text-text-3">
      <div className="ab-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <span className="font-semibold text-text-2">
          AgentBench 智衡 · 智能体 LoopArena 评测与排行
        </span>
        <a
          href="https://huggingface.co/papers/2608.28281"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand hover:underline"
        >
          本项目依托 LoopArena 开展评测工作 ↗
        </a>
        <span>© 2026 AgentBench. All rights reserved.</span>
      </div>
    </footer>
  );
}
