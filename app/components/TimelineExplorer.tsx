"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Fact, TimelineEvent, TimelineLane, TimelinePageData } from "../types";

const SNAPSHOT_DATE = "2026-07-18";
const pageOrder = ["history", "trends", "future", "compare"] as const;
const pageMeta = {
  history: { label: "历史", href: "/history", index: "01" },
  trends: { label: "趋势", href: "/trends", index: "02" },
  future: { label: "未来", href: "/future", index: "03" },
  compare: { label: "模型对比", href: "/compare", index: "04" },
};

function toPercent(date: string, startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = new Date(date).getTime();
  return Math.max(2, Math.min(98, ((current - start) / (end - start)) * 100));
}

function completenessOf(event: TimelineEvent) {
  const known = event.facts.filter((fact) => fact.status !== "未知").length;
  return Math.round((known / Math.max(event.facts.length, 1)) * 100);
}

function factValue(event: TimelineEvent, labels: RegExp) {
  return event.facts.find((fact) => labels.test(fact.label))?.value ?? "未知";
}

function tierLabel(event: TimelineEvent) {
  if (event.tier === "watch") return "待权重落地";
  if (event.tier === "frontier") return "当前前沿";
  return "历史基线";
}

function FactRow({ fact, event }: { fact: Fact; event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false);
  const sources = event.sources.filter((source) => fact.sourceIds.includes(source.id));
  const hasTrace = sources.length > 0 || Boolean(fact.method);

  return (
    <div className={`fact-row status-${fact.status}`}>
      <button
        className="fact-summary"
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        disabled={!hasTrace}
      >
        <span className="fact-label">{fact.label}</span>
        <span className="fact-value">{fact.value}</span>
        <span className="fact-status">{fact.status}</span>
        <span className="fact-chevron" aria-hidden="true">
          {hasTrace ? (expanded ? "−" : "+") : ""}
        </span>
      </button>
      {expanded && hasTrace ? (
        <div className="fact-trace">
          {fact.method ? (
            <p>
              <span>计算 / 判断流程</span>
              {fact.method}
            </p>
          ) : null}
          {sources.length ? (
            <div className="trace-links">
              <span>直接证据</span>
              {sources.map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  {source.title} ↗
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EvidencePanel({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  const completeness = completenessOf(event);

  return (
    <aside className="evidence-panel" aria-label={`${event.title} 证据面板`}>
      <div className="panel-topline">
        <span>证据档案 · {event.id}</span>
        <button type="button" onClick={onClose} aria-label="关闭证据面板">
          关闭 ×
        </button>
      </div>
      <div className="panel-scroll">
        <header className="panel-header">
          <p>{event.eyebrow}</p>
          <h2>{event.title}</h2>
          <div className="panel-meta">
            <span>{event.date}</span>
            <span>{event.organization}</span>
            <span>置信度 {event.confidence}</span>
            {event.tier ? <span>{tierLabel(event)}</span> : null}
          </div>
          <p className="panel-summary">{event.summary}</p>
        </header>

        <div className="completeness">
          <div>
            <span>资料完整度</span>
            <strong>{completeness}%</strong>
          </div>
          <div className="completeness-track">
            <span style={{ width: `${completeness}%` }} />
          </div>
          <small>未知字段保留；不使用推测值填充。</small>
        </div>

        {event.breakthroughs?.length ? (
          <section className="panel-section breakthrough-section">
            <div className="section-heading">
              <span>开创 / 关键方案</span>
              <b>{event.breakthroughs.length} 项</b>
            </div>
            <ol>
              {event.breakthroughs.map((item, index) => (
                <li key={item}><i>{String(index + 1).padStart(2, "0")}</i><span>{item}</span></li>
              ))}
            </ol>
          </section>
        ) : null}

        {event.basisIds?.length ? (
          <section className="panel-section lineage-section">
            <div className="section-heading">
              <span>推导链</span>
              <b>{event.basisIds.length} 个历史依据</b>
            </div>
            <div className="basis-list">
              {event.basisIds.map((id, index) => (
                <span key={id}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  {id}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="panel-section">
          <div className="section-heading">
            <span>结构化字段</span>
            <b>{event.facts.length} 项</b>
          </div>
          <div className="facts-list">
            {event.facts.map((fact) => (
              <FactRow key={fact.label} fact={fact} event={event} />
            ))}
          </div>
        </section>

        {event.revisionNotes?.length ? (
          <section className="panel-section">
            <div className="section-heading">
              <span>修订记录</span>
              <b>可追溯</b>
            </div>
            <ol className="revision-list">
              {event.revisionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="panel-section sources-section">
          <div className="section-heading">
            <span>来源</span>
            <b>{event.sources.length} 条</b>
          </div>
          {event.sources.length ? (
            event.sources.map((source, index) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span>
                  <strong>{source.title}</strong>
                  <small>
                    {source.publisher} · {source.type} · 访问于 {source.accessedAt}
                  </small>
                </span>
                <b>↗</b>
              </a>
            ))
          ) : (
            <p className="unknown-callout">未知：尚未找到可核验的一手来源。</p>
          )}
        </section>
      </div>
    </aside>
  );
}

function ComparisonTable({
  lanes,
  onSelect,
  showTier,
}: {
  lanes: TimelineLane[];
  onSelect: (event: TimelineEvent) => void;
  showTier: boolean;
}) {
  const rows = lanes
    .flatMap((lane) => lane.events.map((event) => ({ lane, event })))
    .sort((a, b) => b.event.date.localeCompare(a.event.date));

  return (
    <div className="comparison-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>状态</th>
            <th>日期</th>
            <th>模型 / 技术</th>
            <th>分类</th>
            <th>参数 / 硬件</th>
            <th>独立指标</th>
            <th>完整度</th>
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ lane, event }) => (
            <tr key={event.id}>
              <td>
                {showTier ? (
                  <span className={`table-tier tier-${event.tier ?? "baseline"}`}>{tierLabel(event)}</span>
                ) : (
                  <span className="table-tier">置信 {event.confidence}</span>
                )}
              </td>
              <td className="mono">{event.date}</td>
              <td>
                <strong>{event.title}</strong>
                <small>{event.organization}</small>
              </td>
              <td>{lane.title}</td>
              <td>{factValue(event, /总参数规模|参数规模|硬件/)}</td>
              <td>{event.score ?? factValue(event, /Artificial Analysis|加速效果|输出速度|速度 SLA/)}</td>
              <td className="mono">{completenessOf(event)}%</td>
              <td><button type="button" onClick={() => onSelect(event)}>证据 →</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <p className="table-empty">当前筛选下没有节点。</p> : null}
    </div>
  );
}

export function TimelineExplorer({ data }: { data: TimelinePageData }) {
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [query, setQuery] = useState("");
  const [confidence, setConfidence] = useState<"全部" | "高" | "中" | "低">("全部");
  const [scope, setScope] = useState<"frontier" | "all">(data.page === "history" ? "frontier" : "all");
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const timelineRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const currentIndex = pageOrder.indexOf(data.page);
  const previous = currentIndex > 0 ? pageMeta[pageOrder[currentIndex - 1]] : null;
  const next = currentIndex < pageOrder.length - 1 ? pageMeta[pageOrder[currentIndex + 1]] : null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const visibleLanes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.lanes.map((lane) => ({
      ...lane,
      events: lane.events.filter((event) => {
        const inScope = data.page !== "history" || scope === "all" || event.date >= "2026-01-01" || event.tier === "frontier" || event.tier === "watch";
        const matchesConfidence = confidence === "全部" || event.confidence === confidence;
        const haystack = [event.title, event.organization, event.summary, ...event.tags].join(" ").toLowerCase();
        return inScope && matchesConfidence && (!normalized || haystack.includes(normalized));
      }),
    }));
  }, [confidence, data.lanes, data.page, query, scope]);

  const isFrontierScope = data.page === "history" && scope === "frontier";
  const activeStart = isFrontierScope ? "2026-01-01" : data.startDate;
  const activeEnd = isFrontierScope ? "2026-12-31" : data.endDate;
  const activeTicks = isFrontierScope
    ? ["2026-01-01", "2026-04-01", "2026-07-01", "2026-10-01", "2026-12-31"]
    : data.tickDates;
  const visibleEvents = visibleLanes.flatMap((lane) => lane.events);
  const sourceCount = visibleEvents.reduce((sum, event) => sum + event.sources.length, 0);
  const newestEvent = [...visibleEvents].sort((a, b) => b.date.localeCompare(a.date))[0];
  const laneLevels = (lane: TimelineLane) => data.page === "history" && (lane.id === "llm-training" || lane.id === "multimodal-training") ? 4 : 2;

  return (
    <main className={`atlas page-${data.page}`}>
      <header className="site-header">
        <div className="page-switch page-switch-left">
          {previous ? <Link href={previous.href}>← {previous.label}</Link> : <span className="switch-edge">AI TECH ATLAS</span>}
        </div>
        <nav aria-label="主页面">
          {pageOrder.map((page) => (
            <Link key={page} href={pageMeta[page].href} className={data.page === page ? "active" : ""}>
              <small>{pageMeta[page].index}</small>{pageMeta[page].label}
            </Link>
          ))}
        </nav>
        <div className="page-switch page-switch-right">
          {next ? <Link href={next.href}>{next.label} →</Link> : <span className="switch-edge">更新 {SNAPSHOT_DATE}</span>}
        </div>
      </header>

      <section className="page-summary">
        <div>
          <p className="kicker"><span>{data.kicker}</span>{data.windowLabel}</p>
          <h1>{data.title}</h1>
          <p>{data.intro}</p>
        </div>
        <dl>
          <div><dt>当前节点</dt><dd>{visibleEvents.length}</dd></div>
          <div><dt>直接来源</dt><dd>{sourceCount}</dd></div>
          <div><dt>最新事件</dt><dd>{newestEvent?.date ?? "—"}</dd></div>
        </dl>
      </section>

      <section className="control-bar" aria-label="时间图谱控制">
        <label className="search-box">
          <span>检索</span>
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="模型、机构、技术或硬件" />
          <kbd>Ctrl K</kbd>
        </label>
        {data.page === "history" ? (
          <div className="scope-toggle" aria-label="时间范围">
            <button type="button" className={scope === "frontier" ? "active" : ""} onClick={() => setScope("frontier")}>当前前沿</button>
            <button type="button" className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>完整历史</button>
          </div>
        ) : null}
        <div className="confidence-filter" aria-label="置信度筛选">
          {(["全部", "高", "中", "低"] as const).map((item) => (
            <button type="button" key={item} className={confidence === item ? "active" : ""} onClick={() => setConfidence(item)}>{item}</button>
          ))}
        </div>
        <div className="view-toggle" aria-label="显示方式">
          <button type="button" className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>时间线</button>
          <button type="button" className={view === "table" ? "active" : ""} onClick={() => setView("table")}>对比表</button>
        </div>
      </section>

      {data.page === "history" && scope === "frontier" ? (
        <div className="frontier-note">
          <span><i className="legend-frontier" /> 当前可用前沿</span>
          <span><i className="legend-watch" /> 已发布但权重待落地</span>
          <b>默认只看 2026；切换“完整历史”查看架构源流</b>
        </div>
      ) : null}

      {view === "timeline" ? (
        <section className={`timeline-shell ${isFrontierScope ? "scope-frontier" : ""}`}>
          <div className="lane-labels" aria-hidden="true">
            <div className="axis-label"><span>分类 / 时间</span><small>点击节点查看证据</small></div>
            {visibleLanes.map((lane) => (
              <div className={`lane-label color-${lane.color}`} key={lane.id} style={{ height: `${14 + laneLevels(lane) * 88}px` }}>
                <p>{lane.group}</p><h2>{lane.title}</h2><span>{lane.description}</span><small>{lane.events.length} 个节点</small>
              </div>
            ))}
          </div>
          <div className="timeline-scroll" ref={timelineRef}>
            <div className="timeline-canvas">
              <div className="time-axis">
                {activeTicks.map((tick) => (
                  <div key={tick} className="tick" style={{ left: `${toPercent(tick, activeStart, activeEnd)}%` }}><span>{tick.slice(0, 7)}</span><i /></div>
                ))}
              </div>
              <div className="vertical-grid" aria-hidden="true">
                {activeTicks.map((tick) => <i key={tick} style={{ left: `${toPercent(tick, activeStart, activeEnd)}%` }} />)}
              </div>
              {visibleLanes.map((lane) => (
                <div className={`timeline-lane color-${lane.color}`} key={lane.id} style={{ height: `${14 + laneLevels(lane) * 88}px` }}>
                  <div className="lane-baseline" style={{ top: `${7 + laneLevels(lane) * 44}px` }} />
                  {lane.events.map((event, eventIndex) => (
                    <button
                      type="button"
                      className={`event-marker tier-${event.tier ?? "baseline"} ${selected?.id === event.id ? "selected" : ""}`}
                      key={event.id}
                      style={{ left: `${toPercent(event.date, activeStart, activeEnd)}%`, top: `${12 + (eventIndex % laneLevels(lane)) * 88}px` }}
                      onClick={() => setSelected(event)}
                      aria-label={`查看 ${event.title} 的详细证据`}
                    >
                      <i /><span className="event-date">{event.date.slice(0, 10)}</span><strong>{event.title}</strong>
                      {event.score ? <em>{event.score}</em> : null}
                      {event.tier === "watch" ? <small>权重待发布</small> : null}
                    </button>
                  ))}
                  {!lane.events.length ? <div className="empty-lane">当前筛选下没有节点</div> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : <ComparisonTable lanes={visibleLanes} onSelect={setSelected} showTier={data.page === "history"} />}

      <footer className="site-footer">
        <p><span className="status-dot" /> 数据快照：{SNAPSHOT_DATE} · 动态榜单分数均带观察日期</p>
        <p>UNKNOWN ≠ EMPTY · 未披露信息主动保留</p>
      </footer>

      {selected ? <><button className="panel-scrim" type="button" onClick={() => setSelected(null)} aria-label="关闭" /><EvidencePanel event={selected} onClose={() => setSelected(null)} /></> : null}
    </main>
  );
}
