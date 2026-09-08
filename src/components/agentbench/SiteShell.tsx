/**
 * 站点外壳：首页（/）、排行榜页（/board）与 LoopArena 机制说明页（/eval）共用的顶部导航与页脚。
 *
 * 导航结构：
 * - 站点主导航：排行榜 /board · LoopArena 机制 /eval —— 依据当前路径高亮；
 * - 区块导航（props.navs）：当前页面内的内容区块锚点 —— 依据 URL hash 高亮；
 * - 次序：默认站点入口在前（/board、/eval）；首页传入 siteAfterNav，改为区块锚点在前、站点入口居后；
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
  /** 右上角「数据快照」chip 文案，例如 “数据快照 2026-04-23” */
  chip?: string;
  /** 右上角主按钮 CTA */
  cta?: NavItem;
  /**
   * 导航次序：默认「站点入口在前、页内区块锚点在后」（/board、/eval）；
   * 设为 true 时改为「区块锚点在前、站点入口在后」（首页区块多，让内容锚点紧贴品牌）。
   */
  siteAfterNav?: boolean;
}

/** 全站统一的工作台入口：不同页面间切换 */
const SITES: NavItem[] = [
  { href: "/board", label: "排行榜" },
  { href: "/eval", label: "LoopArena 机制" },
];

export function SiteHeader({ navs, chip, cta, siteAfterNav = false }: SiteHeaderProps) {
  // 同时监听路径（站点高亮）与锚点（区块高亮）
  const [loc, setLoc] = useState({ path: "", hash: "" });
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
  const isSiteActive = (href: string) => !href.startsWith("#") && loc.path === href;

  // 分隔线与两组导航的渲染变量（避免两种次序下重复拼 JSX）
  const divider = <span aria-hidden="true" className="hidden h-5 w-px bg-border lg:block" />;
  const siteNav = (
    <nav aria-label="站点导航" className="hidden items-center lg:flex">
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
  );
  const blockNav = navs.length > 0 && (
    <nav aria-label="页面导航" className="hidden items-center lg:flex">
      {navs.map((n) => (
        <a
          key={n.href}
          href={n.href}
          aria-current={isHashActive(n.href) ? "true" : undefined}
          className={`ab-nav-link ${isHashActive(n.href) ? "is-active" : ""}`}
        >
          {n.label}
        </a>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/80 backdrop-blur-xl">
      <div className="ab-container flex min-h-16 items-center gap-4 py-3 lg:gap-5">
        {/* 品牌：点击回首页 */}
        <a href="/" className="group flex shrink-0 items-center gap-3 font-semibold tracking-tight">
          {/* 品牌 Logo 图形（logo.svg 自带品牌紫圆角底 + 白色六维雷达） */}
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

        {siteAfterNav ? (
          /* 次序 B（首页）：品牌 | 页内区块锚点 | 分隔线 | 站点入口（排行榜 / 自动化评测） */
          <>
            {blockNav}
            {divider}
            {siteNav}
          </>
        ) : (
          /* 次序 A（/board、/eval）：品牌 | 分隔线 | 站点入口 | 分隔线 | 页内区块锚点 */
          <>
            {divider}
            {siteNav}
            {blockNav && (
              <>
                {divider}
                {blockNav}
              </>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          {chip && (
            <span className="ab-chip ab-chip-ghost">
              <span className="ab-dot text-ok" />
              {chip}
            </span>
          )}
          {cta && (
            <a href={cta.href} className="ab-button ab-button-primary">
              {cta.label}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border py-8 text-[12px] text-text-3">
      <div className="ab-container flex flex-wrap gap-x-6 gap-y-2">
        <span className="font-semibold text-text-2">
          AgentBench 智衡 · 编程智能体 LoopArena 评测与排行
        </span>
        <span className="sm:ml-auto">© 2026 AgentBench. All rights reserved.</span>
      </div>
    </footer>
  );
}
