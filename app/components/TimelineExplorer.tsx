"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Fact, TimelineEvent, TimelinePageData } from "../types";

const pageOrder = ["history", "trends", "future"] as const;
const pageMeta = {
  history: { label: "历史", href: "/history", index: "01" },
  trends: { label: "趋势", href: "/trends", index: "02" },
  future: { label: "未来", href: "/future", index: "03" },
};

function toPercent(date: string, startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = new Date(date).getTime();
  return Math.max(1.5, Math.min(98.5, ((current - start) / (end - start)) * 100));
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

function EvidencePanel({
  event,
  onClose,
}: {
  event: TimelineEvent;
  onClose: () => void;
}) {
  const knownFacts = event.facts.filter((fact) => fact.status !== "未知").length;
  const completeness = Math.round((knownFacts / event.facts.length) * 100);

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
          <small>未知字段被保留，不用推测值填充。</small>
        </div>

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
              <span>判断修订记录</span>
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

export function TimelineExplorer({ data }: { data: TimelinePageData }) {
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [query, setQuery] = useState("");
  const [confidence, setConfidence] = useState<"全部" | "高" | "中" | "低">("全部");
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentIndex = pageOrder.indexOf(data.page);
  const previous = currentIndex > 0 ? pageMeta[pageOrder[currentIndex - 1]] : null;
  const next = currentIndex < pageOrder.length - 1 ? pageMeta[pageOrder[currentIndex + 1]] : null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const visibleLanes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.lanes.map((lane) => ({
      ...lane,
      events: lane.events.filter((event) => {
        const matchesConfidence = confidence === "全部" || event.confidence === confidence;
        const haystack = [event.title, event.organization, event.summary, ...event.tags]
          .join(" ")
          .toLowerCase();
        return matchesConfidence && (!normalized || haystack.includes(normalized));
      }),
    }));
  }, [confidence, data.lanes, query]);

  const eventCount = data.lanes.reduce((sum, lane) => sum + lane.events.length, 0);
  const sourceCount = data.lanes.reduce(
    (sum, lane) => sum + lane.events.reduce((subtotal, event) => subtotal + event.sources.length, 0),
    0,
  );

  return (
    <main className={`atlas page-${data.page}`}>
      <header className="site-header">
        <div className="page-switch page-switch-left">
          {previous ? (
            <Link href={previous.href} aria-label={`前往${previous.label}页面`}>
              <span>←</span>
              <small>{previous.index}</small>
              <b>{previous.label}</b>
            </Link>
          ) : (
            <span className="switch-edge">AI / ATLAS</span>
          )}
        </div>

        <nav aria-label="主页面">
          {pageOrder.map((page) => (
            <Link
              key={page}
              href={pageMeta[page].href}
              className={data.page === page ? "active" : ""}
            >
              <small>{pageMeta[page].index}</small>
              {pageMeta[page].label}
            </Link>
          ))}
        </nav>

        <div className="page-switch page-switch-right">
          {next ? (
            <Link href={next.href} aria-label={`前往${next.label}页面`}>
              <b>{next.label}</b>
              <small>{next.index}</small>
              <span>→</span>
            </Link>
          ) : (
            <span className="switch-edge">10Y / HORIZON</span>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">
            <span>{data.kicker}</span>
            {data.windowLabel}
          </p>
          <h1>{data.title}</h1>
          <p className="hero-intro">{data.intro}</p>
        </div>
        <div className="hero-stats" aria-label="数据统计">
          <div>
            <strong>{String(eventCount).padStart(2, "0")}</strong>
            <span>时间节点</span>
          </div>
          <div>
            <strong>{String(data.lanes.length).padStart(2, "0")}</strong>
            <span>技术轨道</span>
          </div>
          <div>
            <strong>{String(sourceCount).padStart(2, "0")}</strong>
            <span>引用来源</span>
          </div>
        </div>
      </section>

      <section className="control-bar" aria-label="时间图谱控制">
        <label className="search-box">
          <span>检索节点</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="模型、机构或技术…"
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className="confidence-filter" aria-label="置信度筛选">
          <span>置信度</span>
          {(["全部", "高", "中", "低"] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={confidence === item ? "active" : ""}
              onClick={() => setConfidence(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="scroll-hint"
          type="button"
          onClick={() => timelineRef.current?.scrollBy({ left: 520, behavior: "smooth" })}
        >
          横向探索 <span>→</span>
        </button>
      </section>

      <section className="timeline-shell">
        <div className="lane-labels" aria-hidden="true">
          <div className="axis-label">
            <span>分类 / 时间</span>
            <small>点击节点查看证据</small>
          </div>
          {visibleLanes.map((lane) => (
            <div className={`lane-label color-${lane.color}`} key={lane.id}>
              <p>{lane.group}</p>
              <h2>{lane.title}</h2>
              <span>{lane.description}</span>
              <small>{lane.events.length} 个节点</small>
            </div>
          ))}
        </div>

        <div className="timeline-scroll" ref={timelineRef}>
          <div className="timeline-canvas">
            <div className="time-axis">
              {data.tickDates.map((tick) => (
                <div
                  key={tick}
                  className="tick"
                  style={{ left: `${toPercent(tick, data.startDate, data.endDate)}%` }}
                >
                  <span>{tick.slice(0, 4)}</span>
                  <i />
                </div>
              ))}
            </div>
            <div className="vertical-grid" aria-hidden="true">
              {data.tickDates.map((tick) => (
                <i
                  key={tick}
                  style={{ left: `${toPercent(tick, data.startDate, data.endDate)}%` }}
                />
              ))}
            </div>
            {visibleLanes.map((lane) => (
              <div className={`timeline-lane color-${lane.color}`} key={lane.id}>
                <div className="lane-baseline" />
                {lane.events.map((event, eventIndex) => (
                  <button
                    type="button"
                    className={`event-marker ${selected?.id === event.id ? "selected" : ""}`}
                    key={event.id}
                    style={{
                      left: `${toPercent(event.date, data.startDate, data.endDate)}%`,
                      top: `${24 + (eventIndex % 2) * 58}px`,
                    }}
                    onClick={() => setSelected(event)}
                    aria-label={`查看 ${event.title} 的详细证据`}
                  >
                    <i />
                    <span className="event-date">{event.date.slice(0, 7)}</span>
                    <strong>{event.title}</strong>
                    {event.score ? <em>{event.score}</em> : null}
                  </button>
                ))}
                {!lane.events.length ? (
                  <div className="empty-lane">当前筛选下没有节点</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <p>
          <span className="status-dot" /> 数据快照：2026-07-18 · 推测内容均标注置信度与推导链
        </p>
        <p>UNKNOWN ≠ EMPTY · 未披露信息被主动保留</p>
      </footer>

      {selected ? (
        <>
          <button className="panel-scrim" type="button" onClick={() => setSelected(null)} aria-label="关闭" />
          <EvidencePanel event={selected} onClose={() => setSelected(null)} />
        </>
      ) : null}
    </main>
  );
}
