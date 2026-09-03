/**
 * 站点外壳：首页（/）与排行榜页（/board）共用的顶部导航与页脚。
 * 通过 props 参数化导航项 / 数据快照 chip / 右侧 CTA，
 * 避免在两个路由页面里复制粘贴同一段 header / footer。
 */

import { useEffect, useState } from "react";

export interface NavItem {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  /** 中部导航项（页内锚点或绝对路径均可） */
  navs: NavItem[];
  /** 右上角「数据快照」chip 文案，例如 “数据快照 2026-04-23” */
  chip?: string;
  /** 右上角主按钮 CTA */
  cta?: NavItem;
}

export function SiteHeader({ navs, chip, cta }: SiteHeaderProps) {
  // 监听 URL 锚点，为「当前所在区块」的导航项加高亮
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const isActive = (href: string) => href.startsWith("#") && hash === href;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/80 backdrop-blur-xl">
      <div className="ab-container flex min-h-16 items-center gap-5 py-3 lg:gap-7">
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
            {/* <span className="mt-1 text-[10px] font-medium tracking-[0.12em] text-text-3">
              AI Agent 评测工作台
            </span> */}
          </span>
        </a>

        {/* 品牌与导航间的细分隔线（桌面端显示） */}
        <span aria-hidden="true" className="hidden h-5 w-px bg-border lg:block" />

        {/* 页面中部导航：当前区块自动高亮 */}
        <nav aria-label="页面导航" className="hidden items-center lg:flex">
          {navs.map((n) => (
            <a
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "true" : undefined}
              className={`ab-nav-link ${isActive(n.href) ? "is-active" : ""}`}
            >
              {n.label}
            </a>
          ))}
        </nav>

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
        <span className="font-semibold text-text-2">AgentBench 智衡 · AI Agent 评测工作台</span>
        <span className="sm:ml-auto">© 2026 AgentBench. All rights reserved.</span>
      </div>
    </footer>
  );
}
