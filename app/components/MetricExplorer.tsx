"use client";

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

interface ChartPoint {
  model: ComparisonModel;
  metric: MetricValue;
}

const ORG_COLORS = ["#0f8092", "#ce6c2a", "#6f5bad", "#2f8f55", "#2457d6", "#bd3e6b", "#7d7424", "#343a40", "#0089d0", "#a855f7"];

function colorForOrganization(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ORG_COLORS[hash % ORG_COLORS.length];
}

function transformValue(value: number, scale: "linear" | "log") {
  return scale === "log" ? Math.log10(Math.max(value, 0.0001)) : value;
}

function inverseValue(value: number, scale: "linear" | "log") {
  return scale === "log" ? 10 ** value : value;
}

function CanvasChart({
  points,
  metricKey,
  mode,
  focusId,
}: {
  points: ChartPoint[];
  metricKey: MetricKey;
  mode: "timeline" | "bars";
  focusId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const definition = metricDefinitions[metricKey];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    function draw() {
      if (!canvas || !container) return;
      const width = Math.max(container.clientWidth, 640);
      const height = mode === "timeline" ? 430 : 390;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);

      if (!points.length) {
        context.fillStyle = "#68737a";
        context.font = "13px Inter, Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("当前筛选下没有可绘制的数据点", width / 2, height / 2);
        return;
      }

      const padding = mode === "timeline"
        ? { left: 76, right: 30, top: 28, bottom: 58 }
        : { left: 62, right: 18, top: 26, bottom: 110 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const transformed = points.map((point) => transformValue(point.metric.value, definition.scale));
      const minValue = Math.min(...transformed, 0);
      const maxValue = Math.max(...transformed, 1);
      const range = Math.max(maxValue - minValue, 1);

      context.font = "11px Inter, Arial, sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";
      for (let index = 0; index <= 5; index += 1) {
        const y = padding.top + (plotHeight * index) / 5;
        const transformedTick = maxValue - (range * index) / 5;
        context.strokeStyle = "#d8dcde";
        context.setLineDash([3, 5]);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = "#68737a";
        context.fillText(formatMetricValue(metricKey, Number(inverseValue(transformedTick, definition.scale).toPrecision(3))), padding.left - 10, y);
      }

      if (mode === "timeline") {
        const timestamps = points.map((point) => new Date(point.model.releaseDate).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRange = Math.max(maxTime - minTime, 1);
        const xFor = (date: string) => padding.left + ((new Date(date).getTime() - minTime) / timeRange) * plotWidth;
        const yFor = (value: number) => padding.top + (1 - (transformValue(value, definition.scale) - minValue) / range) * plotHeight;

        const byOrganization = new Map<string, ChartPoint[]>();
        for (const point of points) {
          const group = byOrganization.get(point.model.organization) ?? [];
          group.push(point);
          byOrganization.set(point.model.organization, group);
        }

        for (const [organization, group] of byOrganization) {
          const sorted = [...group].sort((a, b) => a.model.releaseDate.localeCompare(b.model.releaseDate));
          context.strokeStyle = colorForOrganization(organization);
          context.lineWidth = 1.7;
          context.beginPath();
          sorted.forEach((point, index) => {
            const x = xFor(point.model.releaseDate);
            const y = yFor(point.metric.value);
            if (index === 0) context.moveTo(x, y);
            else {
              const previous = sorted[index - 1];
              context.lineTo(x, yFor(previous.metric.value));
              context.lineTo(x, y);
            }
          });
          context.stroke();

          sorted.forEach((point) => {
            const x = xFor(point.model.releaseDate);
            const y = yFor(point.metric.value);
            const focused = point.model.id === focusId;
            context.fillStyle = colorForOrganization(organization);
            context.fillRect(x - (focused ? 5 : 3), y - (focused ? 5 : 3), focused ? 10 : 6, focused ? 10 : 6);
            if (focused) {
              context.fillStyle = "#111c24";
              context.textAlign = "left";
              context.textBaseline = "bottom";
              context.font = "bold 11px Inter, Arial, sans-serif";
              context.fillText(`${point.model.name} · ${formatMetricValue(metricKey, point.metric.value)}`, Math.min(x + 8, width - 220), y - 7);
            }
          });
        }

        context.fillStyle = "#68737a";
        context.font = "10px Inter, Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "top";
        for (let index = 0; index <= 5; index += 1) {
          const time = minTime + (timeRange * index) / 5;
          const date = new Date(time);
          context.fillText(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`, padding.left + (plotWidth * index) / 5, height - padding.bottom + 14);
        }
      } else {
        const sorted = [...points].sort((a, b) => b.metric.value - a.metric.value).slice(0, 30);
        const gap = 7;
        const barWidth = Math.max(8, (plotWidth - gap * Math.max(sorted.length - 1, 0)) / Math.max(sorted.length, 1));
        sorted.forEach((point, index) => {
          const x = padding.left + index * (barWidth + gap);
          const normalized = (transformValue(point.metric.value, definition.scale) - minValue) / range;
          const barHeight = Math.max(2, normalized * plotHeight);
          const y = padding.top + plotHeight - barHeight;
          context.fillStyle = colorForOrganization(point.model.organization);
          context.globalAlpha = point.model.id === focusId ? 1 : 0.88;
          context.fillRect(x, y, barWidth, barHeight);
          context.globalAlpha = 1;
          if (point.model.id === focusId) {
            context.strokeStyle = "#111c24";
            context.lineWidth = 2;
            context.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
          }
          context.save();
          context.translate(x + barWidth / 2, height - padding.bottom + 8);
          context.rotate(-Math.PI / 3);
          context.fillStyle = "#344047";
          context.font = "10px Inter, Arial, sans-serif";
          context.textAlign = "right";
          context.textBaseline = "middle";
          context.fillText(point.model.name, 0, 0);
          context.restore();
        });
      }
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [definition.scale, focusId, metricKey, mode, points]);

  return <canvas ref={canvasRef} role="img" aria-label={`${definition.title}${mode === "timeline" ? "随发布日期变化" : "绝对值排行"}`} />;
}

function MetricHeader() {
  const tabs = [["历史", "/history", "01"], ["趋势", "/trends", "02"], ["未来", "/future", "03"], ["模型对比", "/compare", "04"]] as const;
  return (
    <header className="site-header comparison-header">
      <div className="page-switch page-switch-left"><Link href="/compare">← 模型对比</Link></div>
      <nav aria-label="主页面">{tabs.map(([label, href, index]) => <Link key={href} href={href} className={href === "/compare" ? "active" : ""}><small>{index}</small>{label}</Link>)}</nav>
      <div className="page-switch page-switch-right"><span className="switch-edge">指标证据页</span></div>
    </header>
  );
}

export function MetricExplorer({ initialMetric, initialFocus }: { initialMetric: string; initialFocus?: string }) {
  const router = useRouter();
  const metricKey = metricKeys.includes(initialMetric as MetricKey) ? initialMetric as MetricKey : "aaIntelligence";
  const definition = metricDefinitions[metricKey];
  const [organization, setOrganization] = useState("全部机构");
  const [access, setAccess] = useState("全部权限");
  const [focusId, setFocusId] = useState<string | null>(initialFocus ?? null);

  const organizations = useMemo(() => ["全部机构", ...Array.from(new Set(comparisonModels.map((model) => model.organization))).sort()], []);
  const points = useMemo(() => comparisonModels
    .filter((model) => model.metrics[metricKey])
    .filter((model) => organization === "全部机构" || model.organization === organization)
    .filter((model) => access === "全部权限" || model.access === access)
    .map((model) => ({ model, metric: model.metrics[metricKey]! }))
    .sort((a, b) => a.model.releaseDate.localeCompare(b.model.releaseDate)), [access, metricKey, organization]);

  const focusedPoint = points.find((point) => point.model.id === focusId);

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
          <div><dt>坐标</dt><dd>{definition.scale === "log" ? "LOG" : "LINEAR"}</dd></div>
        </dl>
      </section>

      <section className="metric-controls">
        <label><span>指标</span><select value={metricKey} onChange={(event) => router.push(`/metrics/${event.target.value}`)}>{metricKeys.map((key) => <option value={key} key={key}>{metricDefinitions[key].shortTitle}</option>)}</select></label>
        <label><span>机构</span><select value={organization} onChange={(event) => setOrganization(event.target.value)}>{organizations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>权限</span><select value={access} onChange={(event) => setAccess(event.target.value)}><option>全部权限</option><option value="open">开放权重</option><option value="api">API / 闭源</option><option value="pending">权重待发布</option></select></label>
        {focusedPoint ? <div className="focus-chip"><span>来自对比表</span><strong>{focusedPoint.model.name} · {formatMetricValue(metricKey, focusedPoint.metric.value)}</strong><button type="button" onClick={() => setFocusId(null)}>清除</button></div> : null}
      </section>

      <section className="metric-chart-grid">
        <article className="chart-panel timeline-chart-panel">
          <header><div><span>01 / 时间演进</span><h2>什么时候，谁把数字推进到多少</h2></div><small>横轴：发布日期 · 纵轴：{definition.unit}</small></header>
          <div className="canvas-wrap"><CanvasChart points={points} metricKey={metricKey} mode="timeline" focusId={focusId} /></div>
          <div className="chart-legend">{Array.from(new Set(points.map((point) => point.model.organization))).map((org) => <span key={org}><i style={{ background: colorForOrganization(org) }} />{org}</span>)}</div>
        </article>
        <article className="chart-panel bars-chart-panel">
          <header><div><span>02 / 绝对值</span><h2>同一口径下的模型排行</h2></div><small>最多显示 30 个有数据模型</small></header>
          <div className="canvas-wrap"><CanvasChart points={points} metricKey={metricKey} mode="bars" focusId={focusId} /></div>
        </article>
      </section>

      <section className="metric-evidence-table">
        <header><div><span>03 / 数据与来源</span><h2>每个点都能回到证据</h2></div><Link href="/compare">返回横向比较 →</Link></header>
        <div className="metric-table-scroll"><table><thead><tr><th>发布日期</th><th>模型</th><th>机构</th><th>数值</th><th>状态</th><th>观察日 / 口径</th><th>来源</th></tr></thead><tbody>{[...points].sort((a, b) => b.model.releaseDate.localeCompare(a.model.releaseDate)).map((point) => <tr key={point.model.id} className={point.model.id === focusId ? "focused-row" : ""}><td className="mono">{point.model.releaseDate}</td><td><strong>{point.model.name}</strong></td><td>{point.model.organization}</td><td><strong>{formatMetricValue(metricKey, point.metric.value)}</strong></td><td>{point.metric.derived ? "推导" : "已披露"}</td><td>{point.metric.observedAt ?? "发布时"}{point.metric.note ? <small>{point.metric.note}</small> : null}</td><td><a href={point.metric.sourceUrl} target="_blank" rel="noreferrer">原始来源 ↗</a></td></tr>)}</tbody></table></div>
      </section>
      <footer className="site-footer"><p><span className="status-dot" /> 动态榜单必须与观察日期一起引用</p><p>未知值不进入图表，但仍保留在比较矩阵</p></footer>
    </main>
  );
}
