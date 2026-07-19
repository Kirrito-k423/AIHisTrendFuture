"use client";

import { useState } from "react";
import { ComparisonExplorer } from "./ComparisonExplorer";
import { TechnologyComparison } from "./TechnologyComparison";
import { HardwareComparison } from "./HardwareComparison";

export function ComparisonHub({ initialView = "technology" }: { initialView?: "technology" | "model" | "hardware" }) {
  const [view, setView] = useState<"technology" | "model" | "hardware">(initialView);
  const navigation = (
    <section className="comparison-hub-switch" aria-label="历史比较二级页面">
      <div><small>HISTORY / 01.2</small><strong>比较工作台</strong></div>
      <button type="button" className={view === "technology" ? "active" : ""} onClick={() => setView("technology")}>
        <span>技术比较</span><small>结构 · 算法 · 算子 · 并行</small>
      </button>
      <button type="button" className={view === "model" ? "active" : ""} onClick={() => setView("model")}>
        <span>模型比较</span><small>参数 · 训练 · 指标 · 来源</small>
      </button>
      <button type="button" className={view === "hardware" ? "active" : ""} onClick={() => setView("hardware")}>
        <span>硬件比较</span><small>精度 · 内存 · 互联 · 集群</small>
      </button>
      <p>该入口属于“历史”的二级页面；顶部悬浮“历史”可再次进入。</p>
    </section>
  );

  if (view === "technology") return <TechnologyComparison hubNavigation={navigation} />;
  if (view === "hardware") return <HardwareComparison hubNavigation={navigation} />;
  return <ComparisonExplorer hubNavigation={navigation} />;
}
