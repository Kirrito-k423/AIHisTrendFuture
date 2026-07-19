"use client";

import { useMemo, useState, type ReactNode } from "react";
import { hardwareDevices, type HardwareDevice, type HardwareMetric, type HardwareVendorGroup } from "../hardware-data";
import { SiteHeader } from "./SiteHeader";

const SNAPSHOT_DATE = "2026-07-19";
const groups: Array<"全部" | HardwareVendorGroup> = ["全部", "NVIDIA", "Huawei Ascend", "其他厂商"];
const defaultSelection = ["hw-nvidia-a100-80gb", "hw-nvidia-h100-sxm", "hw-nvidia-b200", "hw-ascend-950dt", "hw-google-tpu7x"];

const rows: Array<[string, (device: HardwareDevice) => ReactNode]> = [
  ["厂商 / 形态", (device) => <><strong>{device.vendor}</strong><small>{device.form} · {device.date}</small></>],
  ["FP32", (device) => <Metric metric={device.fp32} />],
  ["FP16 / BF16", (device) => <Metric metric={device.fp16} />],
  ["FP8", (device) => <Metric metric={device.fp8} />],
  ["FP4", (device) => <Metric metric={device.fp4} />],
  ["INT4", (device) => <Metric metric={device.int4} />],
  ["显存 / 内存", (device) => <Metric metric={device.memory} />],
  ["显存带宽", (device) => <Metric metric={device.memoryBandwidth} />],
  ["互联带宽", (device) => <Metric metric={device.interconnect} />],
  ["功耗", (device) => <Metric metric={device.power} />],
  ["单价", (device) => <Metric metric={device.unitPrice} />],
  ["集群 / 超节点", (device) => <Metric metric={device.clusterScale} />],
  ["定位 / 动机", (device) => device.positioning],
  ["实证", (device) => <span className="tech-source-stack">{device.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>{source.publisher} · {source.title} ↗</a>)}</span>],
];

function Metric({ metric }: { metric: HardwareMetric }) {
  return (
    <span className={`hardware-metric hardware-${metric.status}`} title={metric.note}>
      <strong>{metric.value}</strong>
      <small>{metric.status}{metric.note ? " · 查看口径" : ""}</small>
    </span>
  );
}
export function HardwareComparison({ hubNavigation }: { hubNavigation?: ReactNode }) {
  const [group, setGroup] = useState<(typeof groups)[number]>("全部");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(defaultSelection);
  const selected = selectedIds.map((id) => hardwareDevices.find((device) => device.id === id)).filter((device): device is HardwareDevice => Boolean(device));
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return hardwareDevices.filter((device) => (group === "全部" || device.group === group)
      && (!needle || [device.name, device.vendor, device.form, device.positioning].join(" ").toLowerCase().includes(needle)));
  }, [group, query]);

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length >= 5 ? [...current.slice(1), id] : [...current, id]);
  }

  return (
    <main className="atlas technology-comparison-page hardware-comparison-page">
      <SiteHeader activePage="history" comparisonActive left={{ href: "/history", label: "← 历史图谱" }} right={{ label: `快照 ${SNAPSHOT_DATE}` }} />
      {hubNavigation}

      <section className="comparison-summary technology-summary">
        <div>
          <p className="kicker"><span>HISTORY / TRAINING HARDWARE</span>2020—2026 / OFFICIAL SPECS</p>
          <h1>训练硬件横向比较</h1>
          <p>统一查看 FP32 / FP16 / FP8 / FP4 / INT4、内存、带宽、互联、功耗、单价与集群形态。稀疏值、整机值和单卡推导不混写；厂商没公开的字段保留“未公开”。</p>
        </div>
        <dl>
          <div><dt>硬件 / 系统</dt><dd>{hardwareDevices.length}</dd></div>
          <div><dt>厂商组</dt><dd>3</dd></div>
          <div><dt>官方 / OEM 来源</dt><dd>{new Set(hardwareDevices.flatMap((device) => device.sources.map((source) => source.url))).size}</dd></div>
        </dl>
      </section>

      <aside className="hardware-method-note">
        <strong>口径护栏</strong>
        <span>Google 官方目前可核验最新为 TPU7x / Ironwood，未发布 TPU v8。</span>
        <span>WAIC 2026 展示的是 Atlas 950 1024 卡物理集群，不是“1,000 个节点”；8192 卡是官方最大配置。</span>
        <span>单价没有可靠统一 MSRP 时，一律显示“官方询价 / 未公开”。</span>
      </aside>

      <section className="technology-controls" aria-label="训练硬件筛选">
        <label><span>检索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A100、B200、Ascend、TPU、Cerebras…" /></label>
        <div className="technology-category-filter">{groups.map((item) => <button type="button" key={item} className={group === item ? "active" : ""} onClick={() => setGroup(item)}>{item}</button>)}</div>
        <span>已选 {selectedIds.length} / 5</span>
        <button type="button" onClick={() => setSelectedIds([])}>清空比较</button>
      </section>

      <section className="hardware-catalog" aria-label="训练硬件目录">
        {visible.map((device) => (
          <article key={device.id} className={selectedIds.includes(device.id) ? "selected" : ""}>
            <header><span>{device.group}</span><time>{device.date}</time></header>
            <h2>{device.name}</h2>
            <p>{device.positioning}</p>
            <dl>
              <div><dt>FP8</dt><dd>{device.fp8.value}</dd></div>
              <div><dt>内存</dt><dd>{device.memory.value}</dd></div>
              <div><dt>互联</dt><dd>{device.interconnect.value}</dd></div>
            </dl>
            <footer><button type="button" onClick={() => toggle(device.id)}>{selectedIds.includes(device.id) ? "移出比较" : "加入比较"}</button><span>{device.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>{source.publisher} ↗</a>)}</span></footer>
          </article>
        ))}
      </section>

      <section className="technology-matrix-wrap hardware-matrix-wrap" aria-label="训练硬件横向比较矩阵">
        <header><div><span>02 / SIDE-BY-SIDE</span><h2>硬件规格与系统形态并排比较</h2></div><p>悬浮“查看口径”可见推导方法或未公开原因。</p></header>
        {selected.length ? <div className="technology-matrix-scroll"><table className="technology-matrix"><thead><tr><th>比较维度</th>{selected.map((device) => <th key={device.id}><small>{device.group}</small><strong>{device.name}</strong><span>{device.form}</span></th>)}</tr></thead><tbody>{rows.map(([label, render]) => <tr key={label}><th>{label}</th>{selected.map((device) => <td key={device.id}>{render(device)}</td>)}</tr>)}</tbody></table></div> : <div className="technology-empty"><strong>尚未选择硬件</strong><p>从上方勾选 2–5 项建立横向矩阵。</p></div>}
      </section>

      <footer className="site-footer"><p><span className="status-dot" /> 数据快照：{SNAPSHOT_DATE}</p><p>OFFICIAL ≠ ESTIMATE · UNKNOWN ≠ ZERO</p></footer>
    </main>
  );
}
