import { representativeModelCatalog } from "./model-catalog";

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
  metrics: Partial<Record<MetricKey, MetricValue>>;
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
    description: "模型全部参数，统一换算为十亿参数。闭源模型未披露时保持未知。",
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
  "kimi-k26": "Multimodal MoE + MLA",
  "kimi-k3": "Stable LatentMoE + KDA",
  "glm-45": "Sparse MoE",
  "glm-52-max": "MoE + DSA + IndexShare",
  "llama-4-maverick": "Multimodal MoE",
  "mixtral-8x7b-instruct": "Sparse MoE",
  "qwen3-235b-a22b": "MoE + GQA",
  "qwen36-35b-a3b": "MoE + Gated DeltaNet / Full Attention",
  "minimax-text-01": "Lightning Attention + MoE",
  "minimax-m1-80k": "Lightning Attention + MoE · Reasoning",
  "minimax-m2": "Sparse MoE",
  "minimax-m21": "Sparse MoE",
  "minimax-m25": "Sparse MoE",
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
