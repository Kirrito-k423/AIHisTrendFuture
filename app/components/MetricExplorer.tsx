"use client";

import type { ECharts, EChartsOption } from "echarts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  comparisonModels,
  formatMetricValue,
  metricDefinitions,
  metricKeys,
  type ComparisonModel,
  type MetricKey,
  type MetricValue,
} from "../comparison-data";
import { SiteHeader } from "./SiteHeader";

interface ChartPoint {
  model: ComparisonModel;
  metric: MetricValue;
}

interface EChartDatum {
  value: number | [string, number];
  modelName: string;
  organization: string;
  releaseDate: string;
  formattedValue: string;
  sourceUrl: string;
  observedAt: string;
  status: string;
  note?: string;
  itemStyle?: Record<string, unknown>;
  symbolSize?: number;
}

type TimelineType = "step" | "line" | "scatter";
type RankingType = "bar" | "scatter";
type DateWindow = "all" | "12m" | "2026" | "2025plus";
type EvidenceSortKey = "releaseDate" | "name" | "organization" | "value" | "status";
type SortDirection = "asc" | "desc";

const ORG_COLORS = ["#0f8092", "#ce6c2a", "#6f5bad", "#2f8f55", "#2457d6", "#bd3e6b", "#7d7424", "#343a40", "#0089d0", "#a855f7"];

function colorForOrganization(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ORG_COLORS[hash % ORG_COLORS.length];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

function compactAxisValue(value: number) {
  const absolute = Math.abs(value);
  const format = (number: number, digits: number) => new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: digits,
  }).format(number);
  if (absolute >= 1_000_000_000) return `${format(value / 1_000_000_000, 1)}B`;
  if (absolute >= 1_000_000) return `${format(value / 1_000_000, 1)}M`;
  if (absolute >= 1_000) return `${format(value / 1_000, 1)}K`;
  if (absolute >= 100) return format(value, 0);
  if (absolute >= 1) return format(value, 2);
  return format(value, 4);
}

function datumFor(point: ChartPoint, metricKey: MetricKey, timeline: boolean): EChartDatum {
  const focusedStyle = {
    borderColor: "#111c24",
    borderWidth: 3,
  };
  return {
    value: timeline ? [point.model.releaseDate, point.metric.value] : point.metric.value,
    modelName: point.model.name,
    organization: point.model.organization,
    releaseDate: point.model.releaseDate,
    formattedValue: formatMetricValue(metricKey, point.metric.value),
    sourceUrl: point.metric.sourceUrl,
    observedAt: point.metric.observedAt ?? "发布时",
    status: point.metric.derived ? "推导" : "已披露",
    note: point.metric.note,
    itemStyle: focusedStyle,
  };
}

function tooltipFormatter(rawParams: unknown) {
  const params = Array.isArray(rawParams) ? rawParams.find(Boolean) : rawParams;
  const data = (params as { data?: EChartDatum } | undefined)?.data;
  if (!data?.modelName) return "";
  return [
    `<div class="echarts-tooltip-title">${escapeHtml(data.modelName)}</div>`,
    `<div><span>机构</span><strong>${escapeHtml(data.organization)}</strong></div>`,
    `<div><span>发布日期</span><strong>${escapeHtml(data.releaseDate)}</strong></div>`,
    `<div><span>数值</span><strong>${escapeHtml(data.formattedValue)}</strong></div>`,
    `<div><span>状态</span><strong>${escapeHtml(data.status)} · ${escapeHtml(data.observedAt)}</strong></div>`,
    data.note ? `<p>${escapeHtml(data.note)}</p>` : "",
    "<small>点击数据点打开原始来源 ↗</small>",
  ].join("");
}

function buildTimelineOption(
  points: ChartPoint[],
  metricKey: MetricKey,
  chartType: TimelineType,
  focusId: string | null,
): EChartsOption {
  const definition = metricDefinitions[metricKey];
  const organizations = Array.from(new Set(points.map((point) => point.model.organization)));
  const series = organizations.map((organization) => {
    const data = points
      .filter((point) => point.model.organization === organization)
      .sort((a, b) => a.model.releaseDate.localeCompare(b.model.releaseDate))
      .map((point) => {
        const datum = datumFor(point, metricKey, true);
        if (point.model.id !== focusId) delete datum.itemStyle;
        datum.symbolSize = point.model.id === focusId ? 13 : 8;
        return datum;
      });
    return {
      name: organization,
      type: chartType === "scatter" ? "scatter" as const : "line" as const,
      step: chartType === "step" ? "end" as const : false,
      showSymbol: true,
      symbol: chartType === "scatter" ? "circle" : "roundRect",
      symbolSize: 8,
      lineStyle: { width: 2 },
      itemStyle: { color: colorForOrganization(organization) },
      emphasis: { focus: "series" as const, scale: 1.5 },
      data,
    };
  });

  return {
    animationDuration: 350,
    color: organizations.map(colorForOrganization),
    grid: { left: 78, right: 24, top: 48, bottom: 112, containLabel: false },
    tooltip: {
      trigger: "item",
      confine: true,
      borderColor: "#aeb8bc",
      backgroundColor: "rgba(255,255,255,.98)",
      textStyle: { color: "#111c24", fontSize: 11 },
      extraCssText: "box-shadow:0 12px 32px rgba(17,28,36,.14);max-width:340px",
      formatter: tooltipFormatter,
    },
    legend: {
      type: "scroll",
      left: 72,
      right: 20,
      bottom: 4,
      itemWidth: 12,
      itemHeight: 7,
      textStyle: { color: "#526068", fontSize: 9 },
      pageTextStyle: { color: "#526068" },
    },
    toolbox: {
      right: 8,
      top: 4,
      feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: { pixelRatio: 2 } },
      iconStyle: { borderColor: "#526068" },
      emphasis: { iconStyle: { borderColor: "#0f8092" } },
    },
    xAxis: {
      type: "time",
      name: "发布日期",
      nameLocation: "middle",
      nameGap: 48,
      axisLabel: { color: "#68737a", fontSize: 10 },
      axisLine: { lineStyle: { color: "#aeb8bc" } },
      splitLine: { show: true, lineStyle: { color: "#e5e8e9", type: "dashed" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 6,
      name: definition.unit,
      nameTextStyle: { color: "#68737a", fontSize: 10, padding: [0, 0, 4, 0] },
      axisLabel: { color: "#68737a", fontSize: 10, formatter: compactAxisValue },
      axisLine: { show: true, lineStyle: { color: "#aeb8bc" } },
      splitLine: { lineStyle: { color: "#dfe3e4", type: "dashed" } },
    },
    dataZoom: [
      { type: "inside", xAxisIndex: 0, filterMode: "none" },
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "none",
        bottom: 40,
        height: 18,
        borderColor: "#c9cfd1",
        fillerColor: "rgba(15,128,146,.12)",
        handleStyle: { color: "#0f8092" },
        textStyle: { color: "#68737a", fontSize: 9 },
      },
    ],
    series: series as unknown as EChartsOption["series"],
    graphic: points.length ? undefined : [{
      type: "text",
      left: "center",
      top: "middle",
      style: { text: "当前筛选下没有可绘制的数据点", fill: "#68737a", fontSize: 13 },
    }],
  };
}

function buildRankingOption(
  points: ChartPoint[],
  metricKey: MetricKey,
  chartType: RankingType,
  focusId: string | null,
): EChartsOption {
  const definition = metricDefinitions[metricKey];
  const sorted = [...points].sort((a, b) => b.metric.value - a.metric.value).slice(0, 30);
  const organizations = Array.from(new Set(sorted.map((point) => point.model.organization)));
  const series = organizations.map((organization) => ({
    name: organization,
    type: chartType,
    stack: chartType === "bar" ? "model" : undefined,
    symbolSize: 12,
    barMaxWidth: 30,
    itemStyle: { color: colorForOrganization(organization) },
    emphasis: { focus: "series" as const, scale: true },
    data: sorted.map((point) => {
      if (point.model.organization !== organization) return null;
      const datum = datumFor(point, metricKey, false);
      if (point.model.id !== focusId) delete datum.itemStyle;
      return datum;
    }),
  }));

  return {
    animationDuration: 350,
    color: organizations.map(colorForOrganization),
    grid: { left: 74, right: 18, top: 48, bottom: 126, containLabel: false },
    tooltip: {
      trigger: "item",
      confine: true,
      borderColor: "#aeb8bc",
      backgroundColor: "rgba(255,255,255,.98)",
      textStyle: { color: "#111c24", fontSize: 11 },
      extraCssText: "box-shadow:0 12px 32px rgba(17,28,36,.14);max-width:340px",
      formatter: tooltipFormatter,
    },
    legend: {
      type: "scroll",
      left: 68,
      right: 16,
      bottom: 4,
      itemWidth: 12,
      itemHeight: 7,
      textStyle: { color: "#526068", fontSize: 9 },
    },
    toolbox: {
      right: 4,
      top: 4,
      feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: { pixelRatio: 2 } },
      iconStyle: { borderColor: "#526068" },
      emphasis: { iconStyle: { borderColor: "#0f8092" } },
    },
    xAxis: {
      type: "category",
      data: sorted.map((point) => point.model.name),
      axisLabel: { color: "#526068", fontSize: 9, interval: 0, rotate: 46, width: 110, overflow: "truncate" },
      axisLine: { lineStyle: { color: "#aeb8bc" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 6,
      name: definition.unit,
      nameTextStyle: { color: "#68737a", fontSize: 10 },
      axisLabel: { color: "#68737a", fontSize: 10, formatter: compactAxisValue },
      axisLine: { show: true, lineStyle: { color: "#aeb8bc" } },
      splitLine: { lineStyle: { color: "#dfe3e4", type: "dashed" } },
    },
    dataZoom: [
      { type: "inside", xAxisIndex: 0, filterMode: "filter" },
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "filter",
        bottom: 45,
        height: 18,
        end: sorted.length > 15 ? 55 : 100,
        borderColor: "#c9cfd1",
        fillerColor: "rgba(15,128,146,.12)",
        handleStyle: { color: "#0f8092" },
        textStyle: { color: "#68737a", fontSize: 9 },
      },
    ],
    series,
    graphic: sorted.length ? undefined : [{
      type: "text",
      left: "center",
      top: "middle",
      style: { text: "当前筛选下没有可绘制的数据点", fill: "#68737a", fontSize: 13 },
    }],
  };
}

function EChartsPanel({
  points,
  metricKey,
  mode,
  focusId,
  chartType,
}: {
  points: ChartPoint[];
  metricKey: MetricKey;
  mode: "timeline" | "ranking";
  focusId: string | null;
  chartType: TimelineType | RankingType;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const definition = metricDefinitions[metricKey];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let chart: ECharts | undefined;
    let observer: ResizeObserver | undefined;
    let cancelled = false;

    void import("echarts").then((echarts) => {
      if (cancelled) return;
      chart = echarts.init(container, undefined, { renderer: "canvas" });
      const option = mode === "timeline"
        ? buildTimelineOption(points, metricKey, chartType as TimelineType, focusId)
        : buildRankingOption(points, metricKey, chartType as RankingType, focusId);
      chart.setOption(option, { notMerge: true });
      chart.on("click", (params) => {
        const sourceUrl = (params.data as EChartDatum | undefined)?.sourceUrl;
        if (sourceUrl) window.open(sourceUrl, "_blank", "noopener,noreferrer");
      });
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(container);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      chart?.dispose();
    };
  }, [chartType, focusId, metricKey, mode, points]);

  return (
    <div
      className={`echarts-wrap echarts-wrap-${mode}`}
      ref={containerRef}
      role="img"
      aria-label={`${definition.title}${mode === "timeline" ? "随发布日期变化" : "绝对值排行"}，支持悬停提示、图例筛选与缩放`}
    />
  );
}

function MetricHeader() {
  return <SiteHeader activePage="history" comparisonActive left={{ href: "/history/compare", label: "← 技术 / 模型比较" }} right={{ label: "指标证据页" }} />;
}

function ChartTypeButtons<T extends string>({ value, options, onChange }: {
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="chart-type-buttons" aria-label="图表类型">
      {options.map(([key, label]) => (
        <button type="button" key={key} className={value === key ? "active" : ""} onClick={() => onChange(key)}>{label}</button>
      ))}
    </div>
  );
}

function SortableEvidenceHeader({ label, sortKey, currentKey, direction, onSort }: {
  label: string;
  sortKey: EvidenceSortKey;
  currentKey: EvidenceSortKey;
  direction: SortDirection;
  onSort: (key: EvidenceSortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`table-sort-button ${active ? "active" : ""}`} onClick={() => onSort(sortKey)}>
        {label}<span aria-hidden="true">{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

export function MetricExplorer({ initialMetric, initialFocus }: { initialMetric: string; initialFocus?: string }) {
  const router = useRouter();
  const metricKey = metricKeys.includes(initialMetric as MetricKey) ? initialMetric as MetricKey : "aaIntelligence";
  const definition = metricDefinitions[metricKey];
  const [organization, setOrganization] = useState("全部机构");
  const [access, setAccess] = useState("全部权限");
  const [dateWindow, setDateWindow] = useState<DateWindow>("all");
  const [timelineType, setTimelineType] = useState<TimelineType>("step");
  const [rankingType, setRankingType] = useState<RankingType>("bar");
  const [focusId, setFocusId] = useState<string | null>(initialFocus ?? null);
  const [evidenceSort, setEvidenceSort] = useState<{ key: EvidenceSortKey; direction: SortDirection }>({ key: "releaseDate", direction: "desc" });

  const organizations = useMemo(() => ["全部机构", ...Array.from(new Set(comparisonModels.map((model) => model.organization))).sort()], []);
  const points = useMemo(() => comparisonModels
    .filter((model) => model.metrics[metricKey])
    .filter((model) => organization === "全部机构" || model.organization === organization)
    .filter((model) => access === "全部权限" || model.access === access)
    .filter((model) => {
      if (dateWindow === "all") return true;
      if (dateWindow === "12m") return model.releaseDate >= "2025-07-18";
      if (dateWindow === "2026") return model.releaseDate.startsWith("2026-");
      return model.releaseDate >= "2025-01-01";
    })
    .map((model) => ({ model, metric: model.metrics[metricKey]! }))
    .sort((a, b) => a.model.releaseDate.localeCompare(b.model.releaseDate)), [access, dateWindow, metricKey, organization]);

  const evidencePoints = useMemo(() => [...points].sort((a, b) => {
    let comparison = 0;
    if (evidenceSort.key === "releaseDate") comparison = a.model.releaseDate.localeCompare(b.model.releaseDate);
    if (evidenceSort.key === "name") comparison = a.model.name.localeCompare(b.model.name, "zh-CN");
    if (evidenceSort.key === "organization") comparison = a.model.organization.localeCompare(b.model.organization, "zh-CN");
    if (evidenceSort.key === "value") comparison = a.metric.value - b.metric.value;
    if (evidenceSort.key === "status") comparison = Number(Boolean(a.metric.derived)) - Number(Boolean(b.metric.derived));
    return (evidenceSort.direction === "asc" ? 1 : -1) * comparison || b.model.releaseDate.localeCompare(a.model.releaseDate);
  }), [evidenceSort, points]);

  const focusedPoint = points.find((point) => point.model.id === focusId);

  function toggleEvidenceSort(key: EvidenceSortKey) {
    setEvidenceSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "name" || key === "organization" ? "asc" : "desc" });
  }

  return (
    <main className="atlas metric-page">
      <MetricHeader />
      <section className="metric-page-heading">
        <div>
          <p className="kicker"><span>METRIC EXPLORER</span>RELEASE DATE × MODEL VALUE</p>
          <h1>{definition.title}</h1>
          <p>{definition.description}</p>
        </div>
        <dl>
          <div><dt>有数据模型</dt><dd>{points.length}</dd></div>
          <div><dt>单位</dt><dd>{definition.unit}</dd></div>
          <div><dt>坐标</dt><dd>LINEAR</dd></div>
        </dl>
      </section>

      <section className="metric-controls">
        <label><span>指标</span><select value={metricKey} onChange={(event) => router.push(`/metrics/${event.target.value}`)}>{metricKeys.map((key) => <option value={key} key={key}>{metricDefinitions[key].shortTitle}</option>)}</select></label>
        <label><span>机构</span><select value={organization} onChange={(event) => setOrganization(event.target.value)}>{organizations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>权限</span><select value={access} onChange={(event) => setAccess(event.target.value)}><option>全部权限</option><option value="open">开放权重</option><option value="api">API / 闭源</option><option value="pending">权重待发布</option></select></label>
        <label><span>时间</span><select value={dateWindow} onChange={(event) => setDateWindow(event.target.value as DateWindow)}><option value="all">全部时间</option><option value="12m">近 12 个月</option><option value="2026">仅 2026</option><option value="2025plus">2025 至今</option></select></label>
        {focusedPoint ? <div className="focus-chip"><span>来自对比表</span><strong>{focusedPoint.model.name} · {formatMetricValue(metricKey, focusedPoint.metric.value)}</strong><button type="button" onClick={() => setFocusId(null)}>清除</button></div> : null}
      </section>

      <section className="chart-interaction-note">
        <strong>ECharts 交互</strong><span>悬停看数值 · 点击图例筛选机构 · 滚轮/底部滑块缩放 · 点击数据点打开来源</span>
      </section>

      <section className="metric-chart-grid">
        <article className="chart-panel timeline-chart-panel">
          <header>
            <div><span>01 / 时间演进</span><h2>什么时候，谁把数字推进到多少</h2></div>
            <ChartTypeButtons value={timelineType} options={[["step", "阶梯线"], ["line", "折线"], ["scatter", "散点"]]} onChange={setTimelineType} />
          </header>
          <p className="chart-axis-note">横轴：发布日期 · 纵轴：{definition.unit} · 线性等距刻度</p>
          <EChartsPanel points={points} metricKey={metricKey} mode="timeline" focusId={focusId} chartType={timelineType} />
        </article>
        <article className="chart-panel bars-chart-panel">
          <header>
            <div><span>02 / 绝对值</span><h2>同一口径下的模型排行</h2></div>
            <ChartTypeButtons value={rankingType} options={[["bar", "柱状"], ["scatter", "散点"]]} onChange={setRankingType} />
          </header>
          <p className="chart-axis-note">最多 30 个模型 · 线性等距刻度</p>
          <EChartsPanel points={points} metricKey={metricKey} mode="ranking" focusId={focusId} chartType={rankingType} />
        </article>
      </section>

      <section className="metric-evidence-table">
        <header><div><span>03 / 数据与来源</span><h2>每个点都能回到证据，也能按列排序</h2></div><Link href="/history/compare">返回横向比较 →</Link></header>
        <div className="metric-table-scroll"><table><thead><tr>
          <SortableEvidenceHeader label="发布日期" sortKey="releaseDate" currentKey={evidenceSort.key} direction={evidenceSort.direction} onSort={toggleEvidenceSort} />
          <SortableEvidenceHeader label="模型" sortKey="name" currentKey={evidenceSort.key} direction={evidenceSort.direction} onSort={toggleEvidenceSort} />
          <SortableEvidenceHeader label="机构" sortKey="organization" currentKey={evidenceSort.key} direction={evidenceSort.direction} onSort={toggleEvidenceSort} />
          <SortableEvidenceHeader label="数值" sortKey="value" currentKey={evidenceSort.key} direction={evidenceSort.direction} onSort={toggleEvidenceSort} />
          <SortableEvidenceHeader label="状态" sortKey="status" currentKey={evidenceSort.key} direction={evidenceSort.direction} onSort={toggleEvidenceSort} />
          <th>观察日 / 口径</th><th>来源</th>
        </tr></thead><tbody>{evidencePoints.map((point) => <tr key={point.model.id} className={point.model.id === focusId ? "focused-row" : ""}><td className="mono">{point.model.releaseDate}</td><td><strong>{point.model.name}</strong></td><td>{point.model.organization}</td><td><strong>{formatMetricValue(metricKey, point.metric.value)}</strong></td><td>{point.metric.derived ? "推导" : "已披露"}</td><td>{point.metric.observedAt ?? "发布时"}{point.metric.note ? <small>{point.metric.note}</small> : null}</td><td><a href={point.metric.sourceUrl} target="_blank" rel="noreferrer">原始来源 ↗</a></td></tr>)}</tbody></table></div>
      </section>
      <footer className="site-footer"><p><span className="status-dot" /> 动态榜单必须与观察日期一起引用</p><p>未知值不进入图表，但仍保留在比较矩阵</p></footer>
    </main>
  );
}
