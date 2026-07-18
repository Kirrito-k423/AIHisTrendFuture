"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import {
  comparisonModels,
  formatMetricValue,
  metricDefinitions,
  metricKeys,
  structuredFieldDefinitions,
  type ComparisonModel,
  type MetricKey,
} from "../comparison-data";

const SNAPSHOT_DATE = "2026-07-18";

type SortKey = "name" | "releaseDate" | MetricKey;
type SortDirection = "asc" | "desc";
type ComparisonView = "numeric" | "structured";

const DEFAULT_STRUCTURED_MODELS = ["kimi-k3", "glm-52-max", "minimax-m3", "deepseek-v4-pro"];

function isMetricKey(key: SortKey): key is MetricKey {
  return metricKeys.includes(key as MetricKey);
}

function compareModels(a: ComparisonModel, b: ComparisonModel, key: SortKey, direction: SortDirection) {
  if (isMetricKey(key)) {
    const aValue = a.metrics[key]?.value;
    const bValue = b.metrics[key]?.value;
    if (aValue === undefined && bValue === undefined) return b.releaseDate.localeCompare(a.releaseDate);
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    const numericDifference = aValue - bValue;
    return (direction === "asc" ? numericDifference : -numericDifference)
      || b.releaseDate.localeCompare(a.releaseDate);
  }

  const comparison = key === "name"
    ? a.name.localeCompare(b.name, "zh-CN")
    : a.releaseDate.localeCompare(b.releaseDate);
  return (direction === "asc" ? comparison : -comparison)
    || a.name.localeCompare(b.name, "zh-CN");
}

function accessLabel(access: ComparisonModel["access"]) {
  if (access === "open") return "开放权重";
  if (access === "pending") return "权重待发布";
  return "API / 闭源";
}

function ComparisonHeader() {
  const tabs = [
    ["历史", "/history", "01"],
    ["趋势", "/trends", "02"],
    ["未来", "/future", "03"],
    ["模型对比", "/compare", "04"],
  ] as const;

  return (
    <header className="site-header comparison-header">
      <div className="page-switch page-switch-left"><Link href="/future">← 未来</Link></div>
      <nav aria-label="主页面">
        {tabs.map(([label, href, index]) => (
          <Link key={href} href={href} className={href === "/compare" ? "active" : ""}>
            <small>{index}</small>{label}
          </Link>
        ))}
      </nav>
      <div className="page-switch page-switch-right"><span className="switch-edge">快照 {SNAPSHOT_DATE}</span></div>
    </header>
  );
}

function MetricCell({ model, metric }: { model: ComparisonModel; metric: MetricKey }) {
  const point = model.metrics[metric];
  if (!point) return <span className="matrix-unknown">未知</span>;

  return (
    <Link
      className="metric-cell-link"
      href={`/metrics/${metric}?focus=${encodeURIComponent(model.id)}`}
      title={`查看 ${metricDefinitions[metric].title} 的时间变化与绝对值比较`}
    >
      <strong>{formatMetricValue(metric, point.value)}</strong>
      <small>{point.derived ? "推导" : "已披露"} ↗</small>
    </Link>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
  className,
  metric,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
  metric?: MetricKey;
}) {
  const active = currentKey === sortKey;
  return (
    <th className={className} aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`table-sort-button ${active ? "active" : ""}`} onClick={() => onSort(sortKey)}>
        {label}<span aria-hidden="true">{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
      {metric ? <Link className="header-chart-link" href={`/metrics/${metric}`}>图表 ↗</Link> : null}
      {metric ? <small>{metricDefinitions[metric].unit}</small> : null}
    </th>
  );
}

function StructuredComparison({
  models,
  availableModels,
  onAdd,
  onRemove,
  onClear,
}: {
  models: ComparisonModel[];
  availableModels: ComparisonModel[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="structured-comparison" aria-label="模型结构化文字字段比较">
      <header className="structured-toolbar">
        <div>
          <span>STRUCTURED EVIDENCE MATRIX</span>
          <h2>把模型设计与训练细节并排阅读</h2>
          <p>每列一个模型，每行一个固定字段；未知不会被隐藏，状态、来源与推导口径保留在单元格内。</p>
        </div>
        <div className="structured-picker">
          <label>
            <span>加入模型</span>
            <select value="" onChange={(event) => { if (event.target.value) onAdd(event.target.value); }}>
              <option value="">选择模型…</option>
              {availableModels.map((model) => <option value={model.id} key={model.id}>{model.name} · {model.organization}</option>)}
            </select>
          </label>
          <button type="button" onClick={onClear} disabled={!models.length}>清空</button>
        </div>
      </header>

      {models.length ? (
        <div className="structured-matrix-scroll">
          <table className="structured-matrix">
            <thead>
              <tr>
                <th className="structured-field-col">结构化字段</th>
                {models.map((model) => {
                  const disclosedCount = structuredFieldDefinitions.filter(({ label }) => model.structuredFacts[label].status !== "未知").length;
                  return (
                    <th key={model.id}>
                      <strong>{model.name}</strong>
                      <span>{model.organization}</span>
                      <small>{model.releaseDate} · {accessLabel(model.access)}</small>
                      <div className="structured-model-actions">
                        <em>已核验 {disclosedCount}/{structuredFieldDefinitions.length}</em>
                        <a href={model.primarySourceUrl} target="_blank" rel="noreferrer">主来源 ↗</a>
                        <button type="button" onClick={() => onRemove(model.id)}>移除</button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {structuredFieldDefinitions.map((field, index) => {
                const beginsGroup = index === 0 || structuredFieldDefinitions[index - 1].group !== field.group;
                return (
                  <Fragment key={field.label}>
                    {beginsGroup ? (
                      <tr className="structured-group-row">
                        <th>{field.group}</th>
                        <td colSpan={models.length}>{structuredFieldDefinitions.filter((item) => item.group === field.group).length} 项统一字段</td>
                      </tr>
                    ) : null}
                    <tr>
                      <th className="structured-field-col">{field.label}</th>
                      {models.map((model) => {
                        const fact = model.structuredFacts[field.label];
                        return (
                          <td key={model.id} className={fact.status === "未知" ? "structured-unknown" : ""}>
                            <p>{fact.value}</p>
                            <div className="structured-fact-meta">
                              <span data-status={fact.status}>{fact.status}</span>
                              {fact.sources.slice(0, 2).map((source, sourceIndex) => (
                                <a href={source.url} target="_blank" rel="noreferrer" title={source.title} key={`${source.url}-${sourceIndex}`}>来源 {sourceIndex + 1} ↗</a>
                              ))}
                              {fact.sources.length > 2 ? <small>+{fact.sources.length - 2}</small> : null}
                            </div>
                            {fact.method ? <details><summary>计算 / 判断口径</summary><small>{fact.method}</small></details> : null}
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="structured-empty">
          <strong>还没有选择模型</strong>
          <p>从上方加入模型，或切回“数值矩阵”勾选多行，再回来逐字段对照。</p>
        </div>
      )}
    </section>
  );
}

export function ComparisonExplorer() {
  const [query, setQuery] = useState("");
  const [organization, setOrganization] = useState("全部机构");
  const [access, setAccess] = useState("全部权限");
  const [modality, setModality] = useState("全部模态");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_STRUCTURED_MODELS));
  const [onlySelected, setOnlySelected] = useState(false);
  const [view, setView] = useState<ComparisonView>("structured");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "releaseDate", direction: "desc" });

  const organizations = useMemo(
    () => ["全部机构", ...Array.from(new Set(comparisonModels.map((model) => model.organization))).sort()],
    [],
  );
  const modalities = useMemo(
    () => ["全部模态", ...Array.from(new Set(comparisonModels.map((model) => model.modality))).sort()],
    [],
  );

  const visibleModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return comparisonModels
      .filter((model) => {
        const structuredText = Object.values(model.structuredFacts).map((fact) => fact.value).join(" ");
        const matchesQuery = !needle || [model.name, model.organization, model.architecture, model.modality, structuredText]
          .join(" ").toLowerCase().includes(needle);
        const matchesOrg = organization === "全部机构" || model.organization === organization;
        const matchesAccess = access === "全部权限" || model.access === access;
        const matchesModality = modality === "全部模态" || model.modality === modality;
        const matchesSelected = !onlySelected || selected.has(model.id);
        return matchesQuery && matchesOrg && matchesAccess && matchesModality && matchesSelected;
      })
      .sort((a, b) => compareModels(a, b, sort.key, sort.direction));
  }, [access, modality, onlySelected, organization, query, selected, sort]);

  const selectedModels = useMemo(() => Array.from(selected)
    .map((id) => comparisonModels.find((model) => model.id === id))
    .filter((model): model is ComparisonModel => Boolean(model)), [selected]);

  const availableStructuredModels = useMemo(() => comparisonModels
    .filter((model) => !selected.has(model.id))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)), [selected]);

  function toggleModel(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "name" ? "asc" : "desc" });
  }

  return (
    <main className="atlas comparison-page">
      <ComparisonHeader />

      <section className="comparison-summary">
        <div>
          <p className="kicker"><span>MODEL DATABASE</span>2022—2026 / SOURCE BACKED</p>
          <h1>模型横向比较</h1>
          <p>数值指标可以排序和进入时间图；模型类型、注意力、MoE、训练数据、阶段、低精度与 Infra 等文字字段，也能按同一结构并排比较。未披露字段保持“未知”。</p>
        </div>
        <dl>
          <div><dt>模型</dt><dd>{comparisonModels.length}</dd></div>
          <div><dt>机构</dt><dd>{organizations.length - 1}</dd></div>
          <div><dt>字段</dt><dd>{metricKeys.length} + {structuredFieldDefinitions.length}</dd></div>
        </dl>
      </section>

      <section className="metric-shortcuts" aria-label="指标分析入口">
        {metricKeys.map((key) => (
          <Link href={`/metrics/${key}`} key={key}>
            <span>{metricDefinitions[key].shortTitle}</span>
            <small>{metricDefinitions[key].unit} · 时间趋势 + 绝对值</small>
          </Link>
        ))}
      </section>

      <section className="comparison-controls" aria-label="模型筛选">
        <label className="matrix-search">
          <span>检索</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="模型、机构、架构或模态" />
        </label>
        <label><span>机构</span><select value={organization} onChange={(event) => setOrganization(event.target.value)}>{organizations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>权限</span><select value={access} onChange={(event) => setAccess(event.target.value)}><option>全部权限</option><option value="open">开放权重</option><option value="api">API / 闭源</option><option value="pending">权重待发布</option></select></label>
        <label><span>模态</span><select value={modality} onChange={(event) => setModality(event.target.value)}>{modalities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button type="button" className={onlySelected ? "active" : ""} disabled={!selected.size} onClick={() => setOnlySelected((value) => !value)}>仅看已选 {selected.size || ""}</button>
        <button type="button" onClick={() => { setSelected(new Set()); setOnlySelected(false); }}>清空</button>
        {view === "numeric"
          ? <span className="sort-summary">排序：{sort.key === "name" ? "模型" : sort.key === "releaseDate" ? "发布日期" : metricDefinitions[sort.key].shortTitle} {sort.direction === "asc" ? "↑" : "↓"}</span>
          : <span className="sort-summary">并排模型：{selected.size}</span>}
      </section>

      <section className="comparison-view-switch" aria-label="比较内容类型">
        <button type="button" className={view === "numeric" ? "active" : ""} onClick={() => setView("numeric")}>
          <span>数值矩阵</span><small>{metricKeys.length} 项 · 可排序 / 可视化</small>
        </button>
        <button type="button" className={view === "structured" ? "active" : ""} onClick={() => setView("structured")}>
          <span>结构化文字字段</span><small>{structuredFieldDefinitions.length} 项 · 架构 / 训练 / Infra</small>
        </button>
        <p>勾选模型后，两种视图共用同一组选择。</p>
      </section>

      {view === "numeric" ? (
        <section className="model-matrix-wrap" aria-label="模型数值横向比较矩阵">
          <table className="model-matrix">
          <thead>
            <tr>
              <th className="select-col">选择</th>
              <SortableHeader label="模型" sortKey="name" currentKey={sort.key} direction={sort.direction} onSort={toggleSort} className="model-col" />
              <SortableHeader label="发布日期" sortKey="releaseDate" currentKey={sort.key} direction={sort.direction} onSort={toggleSort} />
              <th>权限 / 许可</th>
              <th>模态 / 架构</th>
              {metricKeys.map((key) => <SortableHeader key={key} label={metricDefinitions[key].shortTitle} sortKey={key} currentKey={sort.key} direction={sort.direction} onSort={toggleSort} metric={key} />)}
              <th>主来源</th>
            </tr>
          </thead>
          <tbody>
            {visibleModels.map((model) => (
              <tr key={model.id} className={selected.has(model.id) ? "selected-row" : ""}>
                <td className="select-col"><input type="checkbox" checked={selected.has(model.id)} onChange={() => toggleModel(model.id)} aria-label={`选择 ${model.name}`} /></td>
                <td className="model-col"><strong>{model.name}</strong><small>{model.organization}</small></td>
                <td className="mono">{model.releaseDate}</td>
                <td><strong>{accessLabel(model.access)}</strong><small>{model.license}</small></td>
                <td><strong>{model.modality}</strong><small>{model.architecture}</small></td>
                {metricKeys.map((key) => <td key={key}><MetricCell model={model} metric={key} /></td>)}
                <td><a className="source-button" href={model.primarySourceUrl} target="_blank" rel="noreferrer">官方来源 ↗</a></td>
              </tr>
            ))}
          </tbody>
          </table>
          {!visibleModels.length ? <p className="table-empty">当前筛选下没有模型。</p> : null}
        </section>
      ) : (
        <StructuredComparison
          models={selectedModels}
          availableModels={availableStructuredModels}
          onAdd={(id) => setSelected((current) => new Set([...current, id]))}
          onRemove={(id) => setSelected((current) => { const next = new Set(current); next.delete(id); return next; })}
          onClear={() => { setSelected(new Set()); setOnlySelected(false); }}
        />
      )}

      <footer className="site-footer"><p><span className="status-dot" /> 数据快照：{SNAPSHOT_DATE}</p><p>数值与文字字段共享证据 · UNKNOWN ≠ EMPTY</p></footer>
    </main>
  );
}
