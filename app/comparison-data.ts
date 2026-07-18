import { historyData } from "./data";
import { representativeModelCatalog, type RawModelCatalogEntry } from "./model-catalog";
import {
  getParameterInferenceMethod,
  parameterEstimateByModelId,
  type ParameterEstimate,
} from "./parameter-inference";
import type { FactStatus } from "./types";

export const metricKeys = [
  "aaIntelligence",
  "aaAgentic",
  "totalParamsB",
  "activeParamsB",
  "contextK",
  "weightSizeGB",
  "trainingTokensT",
  "outputTokensPerSecond",
  "blendedPricePerMTok",
] as const;

export type MetricKey = (typeof metricKeys)[number];

export const structuredFieldDefinitions = [
  { label: "发布日期", group: "基础信息" },
  { label: "总参数规模", group: "规模与权重" },
  { label: "每 token 激活参数", group: "规模与权重" },
  { label: "公开权重大小", group: "规模与权重" },
  { label: "权重 / 训练精度", group: "规模与权重" },
  { label: "模型类型", group: "架构设计" },
  { label: "注意力创新", group: "架构设计" },
  { label: "MoE / 稠密", group: "架构设计" },
  { label: "其他架构创新", group: "架构设计" },
  { label: "开创 / 关键方案", group: "架构设计" },
  { label: "训练硬件", group: "训练系统" },
  { label: "训练机器规模", group: "训练系统" },
  { label: "训练数据量", group: "训练系统" },
  { label: "训练数据构成", group: "训练系统" },
  { label: "训练阶段", group: "训练过程" },
  { label: "各阶段时间", group: "训练过程" },
  { label: "总训练时长", group: "训练过程" },
  { label: "训练算法 / 机制", group: "训练过程" },
  { label: "低精度训练", group: "训练过程" },
  { label: "AI Infra 创新", group: "训练过程" },
  { label: "Artificial Analysis 指标", group: "外部测量" },
  { label: "榜单上下文 / 口径", group: "外部测量" },
  { label: "榜单中位速度", group: "外部测量" },
] as const;

export type StructuredFieldLabel = (typeof structuredFieldDefinitions)[number]["label"];

export interface ComparisonSource {
  title: string;
  url: string;
}

export interface StructuredComparisonFact {
  value: string;
  status: FactStatus;
  sources: ComparisonSource[];
  method?: string;
}

export interface MetricValue {
  value: number;
  sourceUrl: string;
  observedAt?: string;
  note?: string;
  derived?: boolean;
}

export interface ComparisonModel {
  id: string;
  name: string;
  organization: string;
  releaseDate: string;
  access: "open" | "api" | "pending";
  license: string;
  modality: "LLM" | "VLM" | "Image" | "Video" | "Omni";
  architecture: string;
  primarySourceUrl: string;
  parameterEstimate?: ParameterEstimate;
  metrics: Partial<Record<MetricKey, MetricValue>>;
  structuredFacts: Record<StructuredFieldLabel, StructuredComparisonFact>;
  notes?: string[];
}

export interface MetricDefinition {
  key: MetricKey;
  title: string;
  shortTitle: string;
  unit: string;
  description: string;
  better: "higher" | "lower" | "context";
  scale: "linear";
}

export const metricDefinitions: Record<MetricKey, MetricDefinition> = {
  aaIntelligence: {
    key: "aaIntelligence",
    title: "Artificial Analysis Intelligence Index",
    shortTitle: "AA 智能指数",
    unit: "分",
    description: "Artificial Analysis 综合智能指数。榜单会重算，必须与观察日期一起阅读。",
    better: "higher",
    scale: "linear",
  },
  aaAgentic: {
    key: "aaAgentic",
    title: "Artificial Analysis Agentic Index",
    shortTitle: "AA Agent 指数",
    unit: "分",
    description: "工具调用、规划、自主性与复杂 Agent 工作流的综合指标；不同版本不可混用。",
    better: "higher",
    scale: "linear",
  },
  totalParamsB: {
    key: "totalParamsB",
    title: "总参数规模",
    shortTitle: "总参数",
    unit: "B",
    description: "模型全部参数，统一换算为十亿参数。只有官方值进入图表；论文推算以 ≥ 或区间显示，不作为精确点排序。",
    better: "context",
    scale: "linear",
  },
  activeParamsB: {
    key: "activeParamsB",
    title: "每 token 激活参数",
    shortTitle: "激活参数",
    unit: "B / token",
    description: "稀疏模型每个 token 实际经过的参数规模；不能用专家数量简单反推。",
    better: "context",
    scale: "linear",
  },
  contextK: {
    key: "contextK",
    title: "上下文窗口",
    shortTitle: "上下文",
    unit: "K tokens",
    description: "官方支持的最大上下文，统一换算为千 token；API 与本地部署可能不同。",
    better: "higher",
    scale: "linear",
  },
  weightSizeGB: {
    key: "weightSizeGB",
    title: "公开权重体积",
    shortTitle: "权重体积",
    unit: "GB",
    description: "官方仓库核心权重文件大小。闭源模型及尚未发布权重的模型保持未知。",
    better: "context",
    scale: "linear",
  },
  trainingTokensT: {
    key: "trainingTokensT",
    title: "训练数据量",
    shortTitle: "训练 Tokens",
    unit: "T tokens",
    description: "官方披露的预训练 token 数，统一换算为万亿 token；数据构成另见证据档案。",
    better: "context",
    scale: "linear",
  },
  outputTokensPerSecond: {
    key: "outputTokensPerSecond",
    title: "在线输出速度",
    shortTitle: "输出速度",
    unit: "tokens/s",
    description: "服务端点的输出速度。供应商、输入长度、并发与统计口径不同，不能直接等同于系统吞吐。",
    better: "higher",
    scale: "linear",
  },
  blendedPricePerMTok: {
    key: "blendedPricePerMTok",
    title: "混合调用价格",
    shortTitle: "混合价格",
    unit: "USD / MTok",
    description: "按来源披露的输入/输出/cache 混合假设折算；仅比较同一成本口径。",
    better: "lower",
    scale: "linear",
  },
};

const architectureOverrides: Record<string, string> = {
  "deepseek-v2-chat": "DeepSeekMoE + MLA",
  "deepseek-v3-1226": "DeepSeekMoE + MLA + MTP",
  "deepseek-r1-0528": "DeepSeekMoE + MLA · Reasoning",
  "deepseek-v4-pro": "MoE + CSA/HCA + mHC",
  "kimi-k2": "Sparse MoE + MLA",
  "kimi-k25": "Native Multimodal MoE + MLA · Agent Swarm",
  "kimi-k26": "Multimodal MoE + MLA",
  "kimi-k3": "Stable LatentMoE + KDA",
  "glm-45": "Sparse MoE",
  "glm-5": "MoE + MLA / DSA + Shared MTP · Asynchronous Agent RL",
  "glm-52-max": "MoE + DSA + IndexShare",
  "llama-4-maverick": "Multimodal MoE",
  "mixtral-8x7b-instruct": "Sparse MoE",
  "qwen3-235b-a22b": "MoE + GQA",
  "qwen35-397b-a17b": "Native Multimodal MoE + Gated DeltaNet / Full Attention",
  "qwen36-35b-a3b": "MoE + Gated DeltaNet / Full Attention",
  "minimax-text-01": "Lightning Attention + MoE",
  "minimax-m1-80k": "Lightning Attention + MoE · Reasoning",
  "minimax-m2": "Sparse MoE",
  "minimax-m21": "Sparse MoE",
  "minimax-m25": "Full Attention + Sparse MoE + 3×MTP · Forge",
  "minimax-m3": "MoE + MiniMax Sparse Attention",
};

function normalizeModality(modality: string): ComparisonModel["modality"] {
  if (modality.includes("audio") || modality.includes("video")) return "Omni";
  if (modality.includes("image")) return "VLM";
  return "LLM";
}

function structuralMetric(value: number | null, sourceUrl: string, note?: string): MetricValue | undefined {
  return value === null ? undefined : { value, sourceUrl, note };
}

function dynamicMetric(value: number | null, sourceUrl: string | null, note: string): MetricValue | undefined {
  return value === null || !sourceUrl ? undefined : {
    value,
    sourceUrl,
    observedAt: "2026-07-18",
    note,
  };
}

const historyEventIdByCatalogId: Partial<Record<string, string>> = {
  "deepseek-v3-1226": "deepseek-v3-2024-12",
  "qwen3-235b-a22b": "qwen3-235b-a22b",
  "kimi-k2": "kimi-k2",
  "kimi-k25": "kimi-k2-5",
  "qwen35-397b-a17b": "qwen3-5-397b-a17b",
  "minimax-m25": "minimax-m2-5",
  "glm-5": "glm-5",
  "qwen36-35b-a3b": "qwen3-6-35b-a3b",
  "kimi-k26": "kimi-k2-6",
  "deepseek-v4-pro": "deepseek-v4-pro",
  "minimax-m3": "minimax-m3",
  "glm-52-max": "glm-5-2",
  "kimi-k3": "kimi-k3",
};

const historyModelEvents = historyData.lanes
  .filter((lane) => lane.id === "llm-training" || lane.id === "multimodal-training")
  .flatMap((lane) => lane.events);

function rawSource(raw: RawModelCatalogEntry): ComparisonSource[] {
  return [{ title: "模型主来源", url: raw.primarySourceUrl }];
}

function aaSources(raw: RawModelCatalogEntry): ComparisonSource[] {
  return raw.aaUrl ? [{ title: "Artificial Analysis", url: raw.aaUrl }] : [];
}

function unknownFact(raw: RawModelCatalogEntry): StructuredComparisonFact {
  return {
    value: "未知",
    status: "未知",
    sources: rawSource(raw),
    method: "已检查当前主来源，尚未找到可核验披露。",
  };
}

function fallbackStructuredFact(raw: RawModelCatalogEntry, label: StructuredFieldLabel): StructuredComparisonFact {
  const disclosed = (value: string, sources = rawSource(raw)): StructuredComparisonFact => ({ value, status: "已披露", sources });
  const derived = (value: string, sources = rawSource(raw), method?: string): StructuredComparisonFact => ({ value, status: "推导", sources, method });
  if (label === "发布日期") return disclosed(raw.releaseDate);
  if (label === "总参数规模") {
    if (raw.totalParamsB !== null) return disclosed(formatMetricValue("totalParamsB", raw.totalParamsB));
    const estimate = parameterEstimateByModelId[raw.id];
    if (estimate) {
      const method = getParameterInferenceMethod(estimate.methodId);
      return derived(
        `${estimate.display} · ${estimate.kind === "lower-bound" ? "保守下界" : "有效知识容量"}`,
        [{ title: method?.paper ?? "参数推算论文", url: estimate.sourceUrl }],
        `论文评估对象：${estimate.evaluatedModel}；版本日期：${estimate.observedAt}。${estimate.calculation} 置信说明：${estimate.confidence} 适用边界：${estimate.caveat}`,
      );
    }
  }
  if (label === "每 token 激活参数" && raw.activeParamsB !== null) {
    return raw.activeParamsB === raw.totalParamsB
      ? derived(formatMetricValue("activeParamsB", raw.activeParamsB), rawSource(raw), "稠密模型按总参数作为每 token 激活参数。")
      : disclosed(formatMetricValue("activeParamsB", raw.activeParamsB));
  }
  if (label === "公开权重大小" && raw.weightSizeGB !== null) return disclosed(formatMetricValue("weightSizeGB", raw.weightSizeGB));
  if (label === "模型类型") {
    const architecture = architectureOverrides[raw.id];
    if (architecture) return derived(architecture, rawSource(raw), "由官方披露的结构摘要归一化为可比较标签。可展开历史节点查看完整表述。");
  }
  if (label === "训练数据量" && raw.trainingTokensT !== null) return disclosed(formatMetricValue("trainingTokensT", raw.trainingTokensT));
  if (label === "Artificial Analysis 指标" && (raw.aaIntelligence !== null || raw.aaAgentic !== null)) {
    const values = [
      raw.aaIntelligence !== null ? `Intelligence ${raw.aaIntelligence}` : null,
      raw.aaAgentic !== null ? `Agentic ${raw.aaAgentic}` : null,
    ].filter(Boolean);
    return disclosed(values.join("；"), aaSources(raw));
  }
  if (label === "榜单上下文 / 口径" && raw.aaUrl) {
    return disclosed("Artificial Analysis 2026-07-18 动态快照；历史模型可能为 estimated", aaSources(raw));
  }
  if (label === "榜单中位速度" && raw.outputTokensPerSecond !== null) {
    return disclosed(formatMetricValue("outputTokensPerSecond", raw.outputTokensPerSecond), aaSources(raw));
  }
  return unknownFact(raw);
}

function structuredFactsFor(raw: RawModelCatalogEntry): Record<StructuredFieldLabel, StructuredComparisonFact> {
  const eventId = historyEventIdByCatalogId[raw.id];
  const event = eventId ? historyModelEvents.find((item) => item.id === eventId) : undefined;
  const eventSources = new Map(event?.sources.map((item) => [item.id, { title: item.title, url: item.url }]) ?? []);

  return Object.fromEntries(structuredFieldDefinitions.map(({ label }) => {
    if (label === "开创 / 关键方案" && event?.breakthroughs?.length) {
      const sources = event.sources
        .filter((item) => item.type !== "第三方测量")
        .map((item) => ({ title: item.title, url: item.url }));
      return [label, {
        value: event.breakthroughs.map((item, index) => `${index + 1}. ${item}`).join("\n"),
        status: "已披露",
        sources: sources.length ? sources : rawSource(raw),
        method: "只列官方明确提出、首次规模化组合或该版本的关键实现；继承与采用的技术在节点修订说明中单独标界。",
      } satisfies StructuredComparisonFact];
    }
    const fact = event?.facts.find((item) => item.label === label);
    if (!fact) return [label, fallbackStructuredFact(raw, label)];
    const sources = fact.sourceIds
      .map((sourceId) => eventSources.get(sourceId))
      .filter((item): item is ComparisonSource => Boolean(item));
    return [label, {
      value: fact.value,
      status: fact.status,
      sources: sources.length ? sources : rawSource(raw),
      method: fact.method,
    } satisfies StructuredComparisonFact];
  })) as Record<StructuredFieldLabel, StructuredComparisonFact>;
}

export const comparisonModels: ComparisonModel[] = representativeModelCatalog.map((raw) => ({
  id: raw.id,
  name: raw.name,
  organization: raw.org,
  releaseDate: raw.releaseDate,
  access: raw.access,
  license: raw.license ?? "未知（权重尚未发布）",
  modality: normalizeModality(raw.modality),
  architecture: architectureOverrides[raw.id]
    ?? (raw.totalParamsB !== null && raw.activeParamsB !== null && raw.activeParamsB < raw.totalParamsB ? "Sparse MoE" : raw.totalParamsB !== null ? "Dense / 架构见主来源" : "未披露"),
  primarySourceUrl: raw.primarySourceUrl,
  parameterEstimate: parameterEstimateByModelId[raw.id],
  structuredFacts: structuredFactsFor(raw),
  metrics: {
    aaIntelligence: dynamicMetric(raw.aaIntelligence, raw.aaUrl, "Artificial Analysis v4.1 动态快照；历史模型可能为 estimated"),
    aaAgentic: dynamicMetric(raw.aaAgentic, raw.aaUrl, "Artificial Analysis Agentic Index 动态快照"),
    totalParamsB: structuralMetric(raw.totalParamsB, raw.primarySourceUrl),
    activeParamsB: structuralMetric(raw.activeParamsB, raw.primarySourceUrl, raw.activeParamsB === raw.totalParamsB ? "Dense 模型按总参数作为每 token 激活参数" : undefined),
    contextK: structuralMetric(raw.contextK, raw.primarySourceUrl),
    weightSizeGB: structuralMetric(raw.weightSizeGB, raw.primarySourceUrl, "官方仓库权重文件口径；不同精度不可混用"),
    trainingTokensT: structuralMetric(raw.trainingTokensT, raw.primarySourceUrl),
    outputTokensPerSecond: dynamicMetric(raw.outputTokensPerSecond, raw.aaUrl, "AA 服务供应商速度快照；不是聚合吞吐"),
    blendedPricePerMTok: dynamicMetric(raw.blendedPricePerMTok, raw.aaUrl, "AA 7:2:1 cache/input/output 混合口径；无 cache 时按来源口径"),
  },
}));

export function formatMetricValue(key: MetricKey, value: number) {
  if (key === "contextK") return value >= 1000 ? `${value / 1000}M` : `${value}K`;
  if (key === "totalParamsB" || key === "activeParamsB") return value >= 1000 ? `${value / 1000}T` : `${value}B`;
  if (key === "weightSizeGB") return value >= 1000 ? `${(value / 1000).toFixed(2)} TB` : `${value} GB`;
  if (key === "trainingTokensT") return `${value}T`;
  if (key === "outputTokensPerSecond") return `${value} tok/s`;
  if (key === "blendedPricePerMTok") return `$${value}`;
  return String(value);
}
