import Link from "next/link";

const primaryPages = [
  { id: "history", label: "历史", href: "/history", index: "01" },
  { id: "trends", label: "趋势", href: "/trends", index: "02" },
  { id: "future", label: "未来", href: "/future", index: "03" },
] as const;

export function SiteHeader({
  activePage,
  comparisonActive = false,
  left,
  right,
}: {
  activePage: (typeof primaryPages)[number]["id"];
  comparisonActive?: boolean;
  left?: { href: string; label: string };
  right?: { href?: string; label: string };
}) {
  return (
    <header className="site-header">
      <div className="page-switch page-switch-left">
        {left ? <Link href={left.href}>{left.label}</Link> : <span className="switch-edge">AI TECH ATLAS</span>}
      </div>
      <nav aria-label="主页面">
        <div className="primary-nav-item history-nav">
          <Link
            href="/history"
            className={`primary-nav-link ${activePage === "history" ? "active" : ""}`}
            aria-haspopup="true"
          >
            <small>01</small>历史<span className="nav-caret" aria-hidden="true">⌄</span>
          </Link>
          <div className="history-subnav" aria-label="历史二级页面">
            <Link href="/history" className={!comparisonActive && activePage === "history" ? "active" : ""}>
              <small>01.1</small><span><strong>历史图谱</strong><em>技术与模型时间线</em></span>
            </Link>
            <Link href="/history/compare" className={comparisonActive ? "active" : ""}>
              <small>01.2</small><span><strong>技术 / 模型比较</strong><em>来源一致的横向矩阵</em></span>
            </Link>
          </div>
        </div>
        {primaryPages.slice(1).map((page) => (
          <Link key={page.id} href={page.href} className={`primary-nav-link ${activePage === page.id ? "active" : ""}`}>
            <small>{page.index}</small>{page.label}
          </Link>
        ))}
      </nav>
      <div className="page-switch page-switch-right">
        {right?.href ? <Link href={right.href}>{right.label}</Link> : <span className="switch-edge">{right?.label ?? "更新 2026-07-19"}</span>}
      </div>
    </header>
  );
}
