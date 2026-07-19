"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Fact, TimelineEvent, TimelineLane, TimelinePageData } from "../types";
import { SiteHeader } from "./SiteHeader";

const SNAPSHOT_DATE = "2026-07-19";
type HistoryCategory = "technology" | "hardware" | "models" | "inference";
type HistoryTimeWindow = "quarter" | "half-year" | "year" | "three-years" | "all";

const HISTORY_CATEGORIES: Array<{ id: HistoryCategory; label: string }> = [
  { id: "technology", label: "训练技术" },
  { id: "hardware", label: "训练硬件" },
  { id: "models", label: "模型" },
  { id: "inference", label: "推理" },
];

const HISTORY_TIME_WINDOWS: Array<{ id: HistoryTimeWindow; label: string; months?: number }> = [
  { id: "quarter", label: "最近一季度", months: 3 },
  { id: "half-year", label: "最近半年", months: 6 },
  { id: "year", label: "最近一年", months: 12 },
  { id: "three-years", label: "最近三年", months: 36 },
  { id: "all", label: "全部" },
];
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
  return Math.max(2, Math.min(98, ((current - start) / (end - start)) * 100));
}

function monthsBefore(date: string, months: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() - months);
  return value.toISOString().slice(0, 10);
}

function evenlySpacedTicks(startDate: string, endDate: string, intervals = 5) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Array.from({ length: intervals + 1 }, (_, index) => new Date(start + ((end - start) * index) / intervals).toISOString().slice(0, 10));
}

const COMPACT_LANE_HEIGHT = 212;
const COMPACT_AXIS_Y = 106;
const COMPACT_CARD_WIDTH = 128;
const MAX_CARD_OVERLAP_RATIO = 0.3;
const MIN_CARD_GAP_PERCENT_AT_100 = (COMPACT_CARD_WIDTH * (1 - MAX_CARD_OVERLAP_RATIO) / 1180) * 100;

interface EventCardLayout {
  event: TimelineEvent;
  eventIndex: number;
  anchorPercent: number;
  cardPercent: number;
  placement: "above" | "below";
  cardTop: number;
  connectorY: number;
}

function resolveCardPositions(items: EventCardLayout[], zoom: number) {
  if (!items.length) return;
  const edge = 5.6 / zoom;
  const min = edge;
  const max = 100 - edge;
  const gap = MIN_CARD_GAP_PERCENT_AT_100 / zoom;

  items.forEach((item, index) => {
    const preferred = Math.max(min, Math.min(max, item.anchorPercent));
    item.cardPercent = index === 0 ? preferred : Math.max(preferred, items[index - 1].cardPercent + gap);
  });

  if (items.at(-1)!.cardPercent > max) {
    items.at(-1)!.cardPercent = max;
    for (let index = items.length - 2; index >= 0; index -= 1) {
      items[index].cardPercent = Math.min(items[index].cardPercent, items[index + 1].cardPercent - gap);
    }
  }

  if (items[0].cardPercent < min) {
    items[0].cardPercent = min;
    for (let index = 1; index < items.length; index += 1) {
      items[index].cardPercent = Math.max(items[index].cardPercent, items[index - 1].cardPercent + gap);
    }
  }
}

function compactEventLayout(lane: TimelineLane, startDate: string, endDate: string, zoom: number): EventCardLayout[] {
  const layouts = lane.events
    .map<EventCardLayout>((event, eventIndex) => ({
      event,
      eventIndex,
      anchorPercent: toPercent(event.date, startDate, endDate),
      cardPercent: toPercent(event.date, startDate, endDate),
      placement: "above",
      cardTop: 10,
      connectorY: 82,
    }))
    .sort((a, b) => a.anchorPercent - b.anchorPercent || a.event.date.localeCompare(b.event.date));

  layouts.forEach((layout, index) => {
    if (index % 2) {
      layout.placement = "below";
      layout.cardTop = 130;
      layout.connectorY = 130;
    }
  });
  resolveCardPositions(layouts.filter((layout) => layout.placement === "above"), zoom);
  resolveCardPositions(layouts.filter((layout) => layout.placement === "below"), zoom);
  return layouts;
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

function EvidencePanel({ event, onClose, eventById }: { event: TimelineEvent; onClose: () => void; eventById: Map<string, TimelineEvent> }) {
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

        {event.primaryContributor ? (
          <section className="panel-section contributor-section">
            <div className="section-heading"><span>{event.primaryContributor.role === "first-author" ? "第一作者" : "主责团队"}</span><b>ATTRIBUTION</b></div>
            <div className="contributor-card">
              <div><strong>{event.primaryContributor.name}</strong><span>{event.primaryContributor.organization}</span>{event.primaryContributor.note ? <small>{event.primaryContributor.note}</small> : null}</div>
              <span className="contributor-links">
                {event.primaryContributor.profileUrl ? <a href={event.primaryContributor.profileUrl} target="_blank" rel="noreferrer">{event.primaryContributor.profileLabel ?? "作者页"} ↗</a> : null}
                <a href={event.primaryContributor.sourceUrl} target="_blank" rel="noreferrer">归属实证 ↗</a>
              </span>
            </div>
          </section>
        ) : null}

        {event.modelLinks?.length ? (
          <section className="panel-section model-link-section">
            <div className="section-heading"><span>关联模型</span><b>{event.modelLinks.length} 条关系</b></div>
            <div className="model-link-list">
              {event.modelLinks.map((link) => <span key={`${link.modelId}-${link.relation}`}><i>{link.relation}</i><strong>{eventById.get(link.modelId)?.title ?? link.modelId}</strong>{link.note ? <small>{link.note}</small> : null}</span>)}
            </div>
          </section>
        ) : null}

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

        {event.star ? (
          <section className="panel-section star-section" aria-label="STAR 技术说明">
            <div className="section-heading">
              <span>STAR 技术档案</span>
              <b>动机 → 结果</b>
            </div>
            <div className="star-grid">
              {([
                ["S", "Situation / 动机", event.star.situation],
                ["T", "Target / 目标", event.star.target],
                ["A", "Action / 实验流程", event.star.action],
                ["R", "Result / 结果", event.star.result],
              ] as const).map(([letter, label, value]) => (
                <article key={letter} className={`star-card star-${letter.toLowerCase()}`}>
                  <i>{letter}</i><div><strong>{label}</strong><p>{value}</p></div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

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
  const [historyCategory, setHistoryCategory] = useState<HistoryCategory>("technology");
  const [historyTimeWindow, setHistoryTimeWindow] = useState<HistoryTimeWindow>("all");
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const [sparseLayout, setSparseLayout] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const [connections, setConnections] = useState<Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const panRef = useRef<{ pointerId: number; x: number; scrollLeft: number } | null>(null);
  const zoomAnchorRef = useRef<{ timeRatio: number; viewportOffset: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const eventById = useMemo(() => new Map(data.lanes.flatMap((lane) => lane.events).map((event) => [event.id, event])), [data.lanes]);
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
    const modelLaneIds = new Set(["llm-training", "t2i-training", "t2v-training", "omni-training", "generation-methods"]);
    const showRelatedModels = historyCategory === "technology" && Boolean(selected?.modelLinks?.length);
    const selectedWindow = HISTORY_TIME_WINDOWS.find((item) => item.id === historyTimeWindow);
    const windowStart = selectedWindow?.months ? monthsBefore(SNAPSHOT_DATE, selectedWindow.months) : null;
    const scopedLanes = data.page !== "history" ? data.lanes : data.lanes.filter((lane) => {
      if (historyCategory === "technology") return lane.id.startsWith("training-tech-") || (showRelatedModels && modelLaneIds.has(lane.id));
      if (historyCategory === "hardware") return lane.id.startsWith("hardware-");
      if (historyCategory === "models") return modelLaneIds.has(lane.id);
      return lane.id === "extreme-inference" || lane.id === "inference-papers";
    });
    return scopedLanes.map((lane) => ({
      ...lane,
      events: lane.events.filter((event) => {
        const inTimeWindow = data.page !== "history" || !windowStart || (event.date >= windowStart && event.date <= SNAPSHOT_DATE);
        const matchesConfidence = confidence === "全部" || event.confidence === confidence;
        const haystack = [event.title, event.organization, event.summary, ...event.tags].join(" ").toLowerCase();
        return inTimeWindow && matchesConfidence && (!normalized || haystack.includes(normalized));
      }),
    }));
  }, [confidence, data.lanes, data.page, historyCategory, historyTimeWindow, query, selected]);

  const isTrainingScope = data.page === "history" && historyCategory === "technology";
  const isHardwareScope = data.page === "history" && historyCategory === "hardware";
  const selectedTimeWindow = HISTORY_TIME_WINDOWS.find((item) => item.id === historyTimeWindow);
  const timeWindowStart = data.page === "history" && selectedTimeWindow?.months ? monthsBefore(SNAPSHOT_DATE, selectedTimeWindow.months) : null;
  const activeStart = timeWindowStart ?? data.startDate;
  const activeEnd = timeWindowStart ? SNAPSHOT_DATE : data.endDate;
  const activeTicks = timeWindowStart ? evenlySpacedTicks(activeStart, activeEnd) : data.tickDates;
  const visibleEvents = visibleLanes.flatMap((lane) => lane.events);
  const relatedModelIds = useMemo(() => new Set(selected?.modelLinks?.map((link) => link.modelId) ?? []), [selected]);
  const sourceCount = visibleEvents.reduce((sum, event) => sum + event.sources.length, 0);
  const newestEvent = [...visibleEvents].sort((a, b) => b.date.localeCompare(a.date))[0];
  const laneLevels = (lane: TimelineLane) => {
    if (!sparseLayout) return 1;
    if (data.page !== "history") return 2;
    if (lane.id.startsWith("training-tech-")) return Math.max(3, Math.ceil(lane.events.length / 2));
    if (lane.id === "t2v-training") return 7;
    if (lane.id === "t2i-training") return 6;
    if (lane.id === "llm-training" || lane.id === "generation-methods") return 4;
    if (lane.id === "omni-training") return 3;
    return 2;
  };
  const laneHeight = (lane: TimelineLane) => sparseLayout ? 14 + laneLevels(lane) * 88 : COMPACT_LANE_HEIGHT;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const origin = selected ? markerRefs.current.get(selected.id) : null;
    if (!canvas || !origin || !selected?.modelLinks?.length) {
      setConnections([]);
      return;
    }
    const updateConnections = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const originRect = origin.getBoundingClientRect();
      const x1 = originRect.left - canvasRect.left + originRect.width / 2;
      const y1 = originRect.top - canvasRect.top + originRect.height / 2;
      setConnections(selected.modelLinks!.flatMap((link) => {
        const target = markerRefs.current.get(link.modelId);
        if (!target) return [];
        const targetRect = target.getBoundingClientRect();
        return [{ id: `${selected.id}-${link.modelId}`, x1, y1, x2: targetRect.left - canvasRect.left + targetRect.width / 2, y2: targetRect.top - canvasRect.top + targetRect.height / 2 }];
      }));
    };
    updateConnections();
    const observer = new ResizeObserver(updateConnections);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [selected, visibleLanes, sparseLayout, zoom]);

  const changeZoom = useCallback((nextZoom: number, anchorClientX?: number) => {
    const scroll = timelineRef.current;
    const canvas = canvasRef.current;
    const clamped = Math.max(1, Math.min(4, Number(nextZoom.toFixed(2))));
    if (!scroll || !canvas || clamped === zoom) return;
    const scrollRect = scroll.getBoundingClientRect();
    const canvasWidth = canvas.getBoundingClientRect().width;
    const viewportOffset = anchorClientX === undefined ? scroll.clientWidth / 2 : anchorClientX - scrollRect.left;
    const canvasPoint = scroll.scrollLeft + viewportOffset - canvas.offsetLeft;
    zoomAnchorRef.current = {
      timeRatio: Math.max(0, Math.min(1, canvasPoint / Math.max(canvasWidth, 1))),
      viewportOffset,
    };
    setZoom(clamped);
  }, [zoom]);

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    const scroll = timelineRef.current;
    const canvas = canvasRef.current;
    if (!anchor || !scroll || !canvas) return;
    const canvasWidth = canvas.getBoundingClientRect().width;
    scroll.scrollLeft = canvas.offsetLeft + anchor.timeRatio * canvasWidth - anchor.viewportOffset;
    zoomAnchorRef.current = null;
  }, [zoom]);

  useEffect(() => {
    const scroll = timelineRef.current;
    if (!scroll || view !== "timeline") return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      changeZoom(zoom * (event.deltaY < 0 ? 1.12 : 0.89), event.clientX);
    };
    scroll.addEventListener("wheel", handleWheel, { passive: false });
    return () => scroll.removeEventListener("wheel", handleWheel);
  }, [changeZoom, view, zoom]);

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, select")) return;
    panRef.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanning(true);
  }

  function movePan(event: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
  }

  function endPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPanning(false);
  }

  return (
    <main className={`atlas page-${data.page}`}>
      <SiteHeader
        activePage={data.page}
        left={previous ? { href: previous.href, label: `← ${previous.label}` } : undefined}
        right={next ? { href: next.href, label: `${next.label} →` } : { label: `更新 ${SNAPSHOT_DATE}` }}
      />

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
        <div className="confidence-filter" aria-label="置信度筛选">
          {(["全部", "高", "中", "低"] as const).map((item) => (
            <button type="button" key={item} className={confidence === item ? "active" : ""} onClick={() => setConfidence(item)}>{item}</button>
          ))}
        </div>
        <div className="view-toggle" aria-label="显示方式">
          <button type="button" className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>时间线</button>
          <button type="button" className={view === "table" ? "active" : ""} onClick={() => setView("table")}>对比表</button>
        </div>
        {view === "timeline" ? <div className="timeline-display-controls">
          <label className="layout-switch"><input type="checkbox" checked={sparseLayout} onChange={(event) => setSparseLayout(event.target.checked)} /><span>稀疏布局</span><small>{sparseLayout ? "开" : "关"}</small></label>
          <div className="zoom-controls" aria-label="时间线缩放"><button type="button" disabled={zoom <= 1} onClick={() => changeZoom(zoom / 1.2)} aria-label="缩小">−</button><button type="button" onClick={() => changeZoom(1)} title="恢复 100%">{Math.round(zoom * 100)}%</button><button type="button" onClick={() => changeZoom(zoom * 1.2)} aria-label="放大">+</button></div>
        </div> : null}
      </section>

      {data.page === "history" ? <section className="history-filter-bar" aria-label="历史图谱分类与时间筛选">
        <div className="history-filter-group" role="group" aria-label="内容类别">
          <span>内容类别</span>
          {HISTORY_CATEGORIES.map((item) => <button type="button" key={item.id} className={historyCategory === item.id ? "active" : ""} onClick={() => setHistoryCategory(item.id)}>{item.label}</button>)}
        </div>
        <div className="history-filter-group history-time-filter" role="group" aria-label="时间范围">
          <span>时间范围</span>
          {HISTORY_TIME_WINDOWS.map((item) => <button type="button" key={item.id} className={historyTimeWindow === item.id ? "active" : ""} onClick={() => setHistoryTimeWindow(item.id)}>{item.label}</button>)}
        </div>
      </section> : null}

      {isTrainingScope ? (
        <div className="frontier-note training-tech-note">
          <span><i className="legend-training" /> 结构 / 算法 / 算子 / 并行</span>
          <span>所有节点均有论文、官方博客或代码仓</span>
          <b>点击技术：关联模型会高亮并显示虚线；拖动平移，Ctrl + 滚轮缩放</b>
        </div>
      ) : null}

      {isHardwareScope ? <div className="frontier-note hardware-note"><span>NVIDIA · Huawei Ascend · 其他厂商</span><span>精度 / 内存 / 带宽 / 互联 / 功耗 / 单价</span><b>规格未公开时保持“未知”；比较入口位于历史二级页</b></div> : null}

      {view === "timeline" ? (
        <section className={`timeline-shell ${sparseLayout ? "layout-sparse" : "layout-compact"}`}>
          <div className="lane-labels" aria-hidden="true">
            <div className="axis-label"><span>分类 / 时间</span><small>拖动平移 · Ctrl + 滚轮缩放</small></div>
            {visibleLanes.map((lane) => (
              <div className={`lane-label color-${lane.color}`} key={lane.id} style={{ height: `${laneHeight(lane)}px` }}>
                <p>{lane.group}</p><h2>{lane.title}</h2><span>{lane.description}</span><small>{lane.events.length} 个节点</small>
              </div>
            ))}
          </div>
          <div className={`timeline-scroll ${panning ? "is-panning" : ""}`} ref={timelineRef} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
            <div className="timeline-canvas" ref={canvasRef} style={{ width: `${zoom * 100}%`, minWidth: `${Math.round(1180 * zoom)}px` }}>
              <div className="time-axis">
                {activeTicks.map((tick) => (
                  <div key={tick} className="tick" style={{ left: `${toPercent(tick, activeStart, activeEnd)}%` }}><span>{tick.slice(0, 7)}</span><i /></div>
                ))}
              </div>
              <div className="vertical-grid" aria-hidden="true">
                {activeTicks.map((tick) => <i key={tick} style={{ left: `${toPercent(tick, activeStart, activeEnd)}%` }} />)}
              </div>
              {connections.length ? <svg className="relation-overlay" aria-hidden="true">{connections.map((line) => {
                const bend = Math.max(60, Math.abs(line.x2 - line.x1) * 0.35);
                const direction = line.x2 >= line.x1 ? 1 : -1;
                return <path key={line.id} d={`M ${line.x1} ${line.y1} C ${line.x1 + bend * direction} ${line.y1}, ${line.x2 - bend * direction} ${line.y2}, ${line.x2} ${line.y2}`} />;
              })}</svg> : null}
              {visibleLanes.map((lane) => {
                const height = laneHeight(lane);
                const axisY = sparseLayout ? 7 + laneLevels(lane) * 44 : COMPACT_AXIS_Y;
                const layouts: EventCardLayout[] = sparseLayout
                  ? lane.events.map((event, eventIndex) => {
                    const cardTop = 12 + (eventIndex % laneLevels(lane)) * 88;
                    const placement = cardTop + 72 <= axisY ? "above" as const : "below" as const;
                    return { event, eventIndex, anchorPercent: toPercent(event.date, activeStart, activeEnd), cardPercent: toPercent(event.date, activeStart, activeEnd), placement, cardTop, connectorY: placement === "above" ? cardTop + 72 : cardTop };
                  })
                  : compactEventLayout(lane, activeStart, activeEnd, zoom);
                return (
                  <div className={`timeline-lane color-${lane.color}`} key={lane.id} style={{ height: `${height}px` }}>
                    <div className="lane-baseline timeline-axis-line" style={{ top: `${axisY}px` }} />
                    <svg className="lane-event-guides" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
                      {layouts.map((layout) => {
                        const direction = layout.placement === "above" ? -1 : 1;
                        const elbowY = axisY + direction * 15;
                        const approachY = layout.connectorY - direction * 10;
                        return <path vectorEffect="non-scaling-stroke" key={`guide-${layout.event.id}`} d={`M ${layout.anchorPercent} ${axisY} L ${layout.anchorPercent} ${elbowY} C ${layout.anchorPercent} ${approachY}, ${layout.cardPercent} ${approachY}, ${layout.cardPercent} ${layout.connectorY}`} />;
                      })}
                    </svg>
                    {layouts.map((layout) => <span
                      aria-hidden="true"
                      className={`event-axis-dot ${selected?.id === layout.event.id ? "selected" : ""} ${relatedModelIds.has(layout.event.id) ? "related" : ""}`}
                      key={`dot-${layout.event.id}`}
                      style={{ left: `${layout.anchorPercent}%`, top: `${axisY}px` }}
                    />)}
                    {layouts.map((layout) => {
                      const event = layout.event;
                      return (
                        <button
                          type="button"
                          ref={(element) => { if (element) markerRefs.current.set(event.id, element); else markerRefs.current.delete(event.id); }}
                          className={`event-marker placement-${layout.placement} tier-${event.tier ?? "baseline"} ${selected?.id === event.id ? "selected" : ""} ${relatedModelIds.has(event.id) ? "related-model" : ""} ${relatedModelIds.size && selected?.id !== event.id && !relatedModelIds.has(event.id) ? "relationship-muted" : ""}`}
                          key={event.id}
                          style={{ left: `${layout.cardPercent}%`, top: `${layout.cardTop}px` }}
                          onClick={() => setSelected(event)}
                          aria-label={`查看 ${event.title} 的详细证据`}
                        >
                          <i /><span className="event-date">{event.date.slice(0, 10)}</span><strong>{event.title}</strong>
                          {event.score ? <em>{event.score}</em> : null}
                          {event.primaryContributor ? <small className="event-contributor">{event.primaryContributor.role === "first-author" ? "一作" : "团队"} · {event.primaryContributor.name}</small> : null}
                          {event.tier === "watch" ? <small>权重待发布</small> : null}
                        </button>
                      );
                    })}
                    {!lane.events.length ? <div className="empty-lane">当前筛选下没有节点</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : <ComparisonTable lanes={visibleLanes} onSelect={setSelected} showTier={data.page === "history"} />}

      <footer className="site-footer">
        <p><span className="status-dot" /> 数据快照：{SNAPSHOT_DATE} · 动态榜单分数均带观察日期</p>
        <p>UNKNOWN ≠ EMPTY · 未披露信息主动保留</p>
      </footer>

      {selected ? <><button className="panel-scrim" type="button" onClick={() => setSelected(null)} aria-label="关闭" /><EvidencePanel event={selected} eventById={eventById} onClose={() => setSelected(null)} /></> : null}
    </main>
  );
}
