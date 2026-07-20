"use client";

import { useMemo, useState, type ReactNode } from "react";
import { trainingTechnologies } from "../training-tech-data";
import type { StarNarrative, TechnologyCategory, TechnologyComparison, TechnologyFamily, TimelineEvent } from "../types";
import { SiteHeader } from "./SiteHeader";

const SNAPSHOT_DATE = "2026-07-20";
const categories: Array<"全部" | TechnologyCategory> = ["全部", "模型结构", "算法流程", "高效算子", "并行方案"];
const defaultSelection = ["tech-fsdp1", "tech-fsdp2", "tech-vescale-fsdp"];

type TechnologyEvent = TimelineEvent & {
  star: StarNarrative;
  comparison: TechnologyComparison;
};

const technologies = trainingTechnologies.filter(
  (event): event is TechnologyEvent => Boolean(event.star && event.comparison),
);
const families: Array<"全部" | TechnologyFamily> = ["全部", ...Array.from(new Set(technologies.map((event) => event.comparison.family)))];

function ComparisonMatrix({ models }: { models: TechnologyEvent[] }) {
  const rows: Array<[string, (event: TechnologyEvent) => ReactNode]> = [
    ["分类 / 发布", (event) => <><strong>{event.comparison.category} · {event.comparison.family}</strong><small>{event.date} · {event.organization}</small></>],
    ["一作 / 主责团队", (event) => event.primaryContributor ? <span className="tech-source-stack"><strong>{event.primaryContributor.name}</strong><small>{event.primaryContributor.organization}</small>{event.primaryContributor.profileUrl ? <a href={event.primaryContributor.profileUrl} target="_blank" rel="noreferrer">{event.primaryContributor.profileLabel ?? "作者页"} ↗</a> : null}</span> : "未标注"],
    ["核心机制", (event) => event.comparison.mechanism],
    ["Token mixing", (event) => event.comparison.tokenMixing ?? "不适用 / 未单列"],
    ["KV / state layout", (event) => event.comparison.kvLayout ?? "不适用 / 未单列"],
    ["Selector / compressor", (event) => event.comparison.selectorCompressor ?? "无 / 未单列"],
    ["S · Situation", (event) => event.star.situation],
    ["T · Target", (event) => event.star.target],
    ["A · Action / 实验", (event) => event.star.action],
    ["R · Result", (event) => <strong>{event.star.result}</strong>],
    ["适用场景", (event) => event.comparison.bestFor],
    ["计算 / 显存", (event) => event.comparison.computeMemory],
    ["并行维度", (event) => event.comparison.parallelism],
    ["局限 / 边界", (event) => event.comparison.limitations],
    ["代码 / 可用性", (event) => event.comparison.availability],
    ["实证", (event) => (
      <span className="tech-source-stack">
        {event.sources.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.type} · {item.title} ↗</a>)}
      </span>
    )],
  ];

  return (
    <section className="technology-matrix-wrap" aria-label="训练技术横向比较矩阵">
      <header>
        <div><span>02 / SIDE-BY-SIDE</span><h2>同一证据口径，逐维比较技术</h2></div>
        <p>Result 保留原论文实验口径；“最高提升”不跨硬件、模型与任务外推。</p>
      </header>
      {models.length ? (
        <div className="technology-matrix-scroll">
          <table className="technology-matrix">
            <thead><tr><th>比较维度</th>{models.map((event) => <th key={event.id}><small>{event.comparison.category}</small><strong>{event.title}</strong><span>{event.score}</span></th>)}</tr></thead>
            <tbody>{rows.map(([label, render]) => <tr key={label}><th>{label}</th>{models.map((event) => <td key={event.id}>{render(event)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : <div className="technology-empty"><strong>尚未选择技术</strong><p>从上方勾选 2–5 项，建立可读的横向矩阵。</p></div>}
    </section>
  );
}

export function TechnologyComparison({ hubNavigation }: { hubNavigation?: ReactNode }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("全部");
  const [family, setFamily] = useState<(typeof families)[number]>("全部");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(defaultSelection);
  const availableFamilies = useMemo<Array<"全部" | TechnologyFamily>>(() => [
    "全部",
    ...Array.from(new Set(technologies
      .filter((event) => category === "全部" || event.comparison.category === category)
      .map((event) => event.comparison.family))),
  ], [category]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return technologies.filter((event) => {
      const matchesCategory = category === "全部" || event.comparison.category === category;
      const matchesFamily = family === "全部" || event.comparison.family === family;
      const haystack = [event.title, event.organization, event.summary, event.comparison.family, event.comparison.mechanism, event.comparison.bestFor, ...event.tags].join(" ").toLowerCase();
      return matchesCategory && matchesFamily && (!needle || haystack.includes(needle));
    });
  }, [category, family, query]);

  const selected = selectedIds
    .map((id) => technologies.find((event) => event.id === id))
    .filter((event): event is TechnologyEvent => Boolean(event));

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length >= 5 ? [...current.slice(1), id] : [...current, id]);
  }

  return (
    <main className="atlas technology-comparison-page">
      <SiteHeader activePage="history" comparisonActive left={{ href: "/history", label: "← 历史图谱" }} right={{ label: `快照 ${SNAPSHOT_DATE}` }} />
      {hubNavigation}

      <section className="comparison-summary technology-summary">
        <div>
          <p className="kicker"><span>HISTORY / TRAINING TECHNOLOGY</span>2017—2026 / SOURCE BACKED</p>
          <h1>训练技术横向比较</h1>
          <p>把 Attention、MoE、残差、激活函数、优化器、量化训练、kernel 与分布式系统放在同一张矩阵中，但不混淆指标口径。每项都能回到论文、官方博客或代码仓，并按 STAR 说明为什么做、如何验证、得到什么结果。</p>
        </div>
        <dl>
          <div><dt>技术</dt><dd>{technologies.length}</dd></div>
          <div><dt>子分类</dt><dd>{families.length - 1}</dd></div>
          <div><dt>直接来源</dt><dd>{technologies.reduce((sum, event) => sum + event.sources.length, 0)}</dd></div>
        </dl>
      </section>

      <section className="technology-controls" aria-label="训练技术筛选">
        <label><span>检索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="attention、MoE、GRPO、kernel、FSDP…" /></label>
        <div className="technology-category-filter" aria-label="技术大类">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setFamily("全部"); }}>{item}</button>)}</div>
        <div className="technology-family-filter" aria-label="技术子分类">{availableFamilies.map((item) => <button type="button" key={item} className={family === item ? "active" : ""} onClick={() => setFamily(item)}>{item}</button>)}</div>
        <span>已选 {selectedIds.length} / 5</span>
        <button type="button" onClick={() => setSelectedIds([])}>清空比较</button>
      </section>

      <section className="technology-catalog" aria-label="训练技术目录">
        {visible.map((event) => (
          <article key={event.id} className={selectedIds.includes(event.id) ? "selected" : ""}>
            <header><span>{event.comparison.category} · {event.comparison.family}</span><time>{event.date}</time></header>
            <h2>{event.title}</h2>
            <p>{event.summary}</p>
            {event.primaryContributor ? <p className="technology-contributor"><span>{event.primaryContributor.role === "first-author" ? "第一作者" : "主责团队"}</span><strong>{event.primaryContributor.name}</strong><small>{event.primaryContributor.organization}</small>{event.primaryContributor.profileUrl ? <a href={event.primaryContributor.profileUrl} target="_blank" rel="noreferrer">{event.primaryContributor.profileLabel ?? "作者页"} ↗</a> : null}</p> : null}
            <dl>
              <div><dt>核心 Result</dt><dd>{event.score}</dd></div>
              <div><dt>适用</dt><dd>{event.comparison.bestFor}</dd></div>
              <div><dt>可用性</dt><dd>{event.comparison.availability}</dd></div>
            </dl>
            <footer>
              <button type="button" onClick={() => toggle(event.id)}>{selectedIds.includes(event.id) ? "移出比较" : "加入比较"}</button>
              <span>{event.sources.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.type} ↗</a>)}</span>
            </footer>
          </article>
        ))}
      </section>

      <ComparisonMatrix models={selected} />
      <footer className="site-footer"><p><span className="status-dot" /> 数据快照：{SNAPSHOT_DATE}</p><p>STAR 可追溯 · RESULT 不跨口径外推</p></footer>
    </main>
  );
}
