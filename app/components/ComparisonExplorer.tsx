"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  comparisonModels,
  formatMetricValue,
  metricDefinitions,
  metricKeys,
  type ComparisonModel,
  type MetricKey,
} from "../comparison-data";

const SNAPSHOT_DATE = "2026-07-18";

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

export function ComparisonExplorer() {
  const [query, setQuery] = useState("");
  const [organization, setOrganization] = useState("全部机构");
  const [access, setAccess] = useState("全部权限");
  const [modality, setModality] = useState("全部模态");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onlySelected, setOnlySelected] = useState(false);

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
        const matchesQuery = !needle || [model.name, model.organization, model.architecture, model.modality]
          .join(" ").toLowerCase().includes(needle);
        const matchesOrg = organization === "全部机构" || model.organization === organization;
        const matchesAccess = access === "全部权限" || model.access === access;
        const matchesModality = modality === "全部模态" || model.modality === modality;
        const matchesSelected = !onlySelected || selected.has(model.id);
        return matchesQuery && matchesOrg && matchesAccess && matchesModality && matchesSelected;
      })
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  }, [access, modality, onlySelected, organization, query, selected]);

  function toggleModel(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="atlas comparison-page">
      <ComparisonHeader />

      <section className="comparison-summary">
        <div>
          <p className="kicker"><span>MODEL DATABASE</span>2022—2026 / SOURCE BACKED</p>
          <h1>模型横向比较</h1>
          <p>一行一个模型，一列一个可比指标。任何数字都能点击进入该指标的时间演进和绝对值排行；未披露字段保持“未知”。</p>
        </div>
        <dl>
          <div><dt>模型</dt><dd>{comparisonModels.length}</dd></div>
          <div><dt>机构</dt><dd>{organizations.length - 1}</dd></div>
          <div><dt>字段</dt><dd>{metricKeys.length}</dd></div>
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
      </section>

      <section className="model-matrix-wrap" aria-label="模型横向比较矩阵">
        <table className="model-matrix">
          <thead>
            <tr>
              <th className="select-col">选择</th>
              <th className="model-col">模型</th>
              <th>发布日期</th>
              <th>权限 / 许可</th>
              <th>模态 / 架构</th>
              {metricKeys.map((key) => <th key={key}><Link href={`/metrics/${key}`}>{metricDefinitions[key].shortTitle} ↗</Link><small>{metricDefinitions[key].unit}</small></th>)}
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

      <footer className="site-footer"><p><span className="status-dot" /> 数据快照：{SNAPSHOT_DATE}</p><p>点击数字进入指标页 · UNKNOWN ≠ EMPTY</p></footer>
    </main>
  );
}
