import researchBriefs from "./generative-research.json";
import type { RawModelCatalogEntry } from "./model-catalog";
import type { Fact, Source, TimelineEvent } from "./types";

const ACCESSED = "2026-07-19";
const SOURCE_ARTICLE = "https://shaojiemike.top/artificial-intelligence/2023/12/20/Idea2StableDiffusion/";

type UnknownRecord = Record<string, unknown>;

export interface GenerativeResearchBrief extends UnknownRecord {
  slug: string;
  name: string;
  family: string;
  entry_kind: "model" | "method" | "rumor";
  modality: "T2I" | "T2V" | "Edit" | "Omni";
  organization: string;
  release_date: string;
  access: unknown;
  license: unknown;
  comparison_eligible: boolean;
  history_eligible: boolean;
  sources: Array<{ title: string; url: string; source_type: string }>;
  novelty_claims: Array<{ claim: string; scope_boundary: string; evidence: string; confidence: string }>;
}

export const generativeResearchBriefs = researchBriefs as GenerativeResearchBrief[];

const existingHistorySlugs = new Set([
  "wan-video-2-1",
  "wan-2-2",
  "hunyuanvideo-13b",
]);

function unknown(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0 || value.every(unknown);
  if (typeof value === "string") return /^(未知|未披露|not disclosed|n\/a|null)$/i.test(value.trim());
  return false;
}

function compactObject(value: UnknownRecord): string {
  if (typeof value.claim === "string") {
    return `${value.claim}${value.scope_boundary ? `｜边界：${value.scope_boundary}` : ""}`;
  }
  const heading = [value.stage, value.name].filter(Boolean).join(" / ");
  const rest = Object.entries(value)
    .filter(([key]) => !["stage", "name"].includes(key))
    .map(([key, item]) => `${key}: ${toText(item)}`)
    .join("；");
  return heading ? `${heading}：${rest}` : rest;
}

function toText(value: unknown): string {
  if (unknown(value)) return "未知";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item, index) => `${index + 1}. ${toText(item)}`).join("\n");
  if (typeof value === "object") return compactObject(value as UnknownRecord);
  return String(value);
}

function sourceType(sourceType: string, url: string): Source["type"] {
  const haystack = `${sourceType} ${url}`.toLowerCase();
  if (haystack.includes("artificialanalysis") || haystack.includes("leaderboard") || haystack.includes("benchmark")) return "第三方测量";
  if (haystack.includes("github") || haystack.includes("source_code") || haystack.includes("repository")) return "代码仓";
  if (haystack.includes("huggingface") || haystack.includes("model_card") || haystack.includes("modelscope")) return "模型卡";
  if (haystack.includes("paper") || haystack.includes("arxiv")) return "论文";
  if (haystack.includes("report")) return "技术报告";
  if (haystack.includes("dataset")) return "数据集";
  return "官方博客";
}

function sourcesFor(brief: GenerativeResearchBrief): Source[] {
  const seen = new Set<string>();
  const sourceItems = [...(brief.sources ?? [])];
  if (!sourceItems.some((item) => item.url === SOURCE_ARTICLE)) {
    sourceItems.push({ title: "Ideas around T2I2V models（线索索引）", url: SOURCE_ARTICLE, source_type: "secondary_article" });
  }
  return sourceItems.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).map((item, index) => ({
    id: `gr-${brief.slug}-${index + 1}`,
    title: item.title,
    publisher: new URL(item.url).hostname,
    url: item.url,
    type: item.url === SOURCE_ARTICLE ? "讲座整理" : sourceType(item.source_type, item.url),
    accessedAt: ACCESSED,
  }));
}

function statusFor(value: unknown): Fact["status"] {
  if (unknown(value)) return "未知";
  const text = toText(value);
  return /(推算|推断|估计|约等于|理论载荷|derived|estimate)/i.test(text) ? "推导" : "已披露";
}

function fact(label: string, value: unknown, sourceIds: string[]): Fact {
  const status = statusFor(value);
  return {
    label,
    value: toText(value),
    status,
    sourceIds,
    method: status === "未知"
      ? "独立调研已检查所列官方材料，尚未找到可核验披露。"
      : status === "推导" ? "该值含推算或理论口径；请结合来源与节点修订说明阅读。" : undefined,
  };
}

function normalizedDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  return /^\d{4}$/.test(value) ? `${value}-01-01` : "2026-07-19";
}

function outputSpec(brief: GenerativeResearchBrief): string {
  const resolution = toText(brief.max_output_resolution);
  const duration = toText(brief.max_output_duration_seconds);
  const fps = toText(brief.native_fps);
  return [resolution !== "未知" ? `分辨率 ${resolution}` : null, duration !== "未知" ? `时长 ${duration}s` : null, fps !== "未知" ? `${fps} fps` : null]
    .filter(Boolean)
    .join("；") || "未知";
}

function generationSpeed(brief: GenerativeResearchBrief): string {
  const seconds = toText(brief.generation_time_seconds);
  const context = toText(brief.generation_time_context);
  return seconds === "未知" ? context : `${seconds}s；${context}`;
}

function modelKindSummary(brief: GenerativeResearchBrief): string {
  const architecture = toText(brief.architecture);
  const active = toText(brief.parameter_active);
  if (/moe|mixture.of.expert|稀疏/i.test(`${architecture} ${active}`)) return `MoE / 稀疏；${active}`;
  if (brief.entry_kind === "method") return "方法论文，不是独立可部署模型";
  return active === "未知" ? "未知" : `稠密或未披露 MoE；${active}`;
}

function briefToEvent(brief: GenerativeResearchBrief): TimelineEvent {
  const sources = sourcesFor(brief);
  const sourceIds = sources.map((item) => item.id);
  const novelty = brief.novelty_claims ?? [];
  const modality = brief.modality === "Edit" ? "T2I / Edit" : brief.modality;
  const tags = [modality, brief.entry_kind === "method" ? "方法" : "模型", brief.family].filter(Boolean);
  const summary = novelty[0]?.claim ?? toText(brief.architecture);
  const score = typeof brief.aa_elo === "number" ? `AA Elo ${brief.aa_elo}` : undefined;
  return {
    id: `research-${brief.slug}`,
    date: normalizedDate(brief.release_date),
    tier: normalizedDate(brief.release_date) >= "2026-01-01" ? "frontier" : normalizedDate(brief.release_date) >= "2025-09-01" ? "watch" : "baseline",
    title: brief.name,
    organization: brief.organization,
    eyebrow: `${modality} / ${brief.entry_kind === "method" ? "技术方法" : toText(brief.access).includes("开放") ? "开放权重" : "托管或待发布"}`,
    summary,
    confidence: brief.entry_kind === "rumor" ? "低" : novelty.some((item) => String(item.confidence).includes("低")) ? "中" : "高",
    tags,
    score,
    facts: [
      fact("发布日期", brief.release_date, sourceIds),
      fact("总参数规模", brief.parameter_total, sourceIds),
      fact("每 token 激活参数", brief.parameter_active, sourceIds),
      fact("公开权重大小", brief.weight_size, sourceIds),
      fact("权重 / 训练精度", brief.precision, sourceIds),
      fact("模型类型", brief.architecture, sourceIds),
      fact("注意力创新", brief.attention_or_sequence_design, sourceIds),
      fact("MoE / 稠密", modelKindSummary(brief), sourceIds),
      fact("其他架构创新", `${toText(brief.vae_or_tokenizer)}\n${toText(brief.text_encoder_or_conditioner)}`, sourceIds),
      fact("训练硬件", brief.training_hardware, sourceIds),
      fact("训练机器规模", brief.training_hardware_scale, sourceIds),
      fact("训练数据量", brief.training_data_scale, sourceIds),
      fact("训练数据构成", brief.training_data_composition, sourceIds),
      fact("训练阶段", brief.training_stages, sourceIds),
      fact("各阶段时间", brief.training_stage_times, sourceIds),
      fact("总训练时长", brief.training_stage_times, sourceIds),
      fact("训练算法 / 机制", brief.training_algorithms, sourceIds),
      fact("低精度训练", brief.precision, sourceIds),
      fact("AI Infra 创新", brief.training_infra, sourceIds),
      fact("Artificial Analysis 指标", brief.aa_elo === null ? "未知" : `Elo ${toText(brief.aa_elo)}（${toText(brief.aa_elo_observed_at)}）`, sourceIds),
      fact("榜单上下文 / 口径", brief.benchmark_scores, sourceIds),
      fact("榜单中位速度", brief.inference_performance, sourceIds),
      fact("输出规格", outputSpec(brief), sourceIds),
      fact("生成速度", generationSpeed(brief), sourceIds),
      fact("生成榜单 Elo", brief.aa_elo === null ? "未知" : `Elo ${toText(brief.aa_elo)}（${toText(brief.aa_elo_observed_at)}）`, sourceIds),
    ],
    sources,
    breakthroughs: novelty.map((item) => `${item.claim}｜边界：${item.scope_boundary}`),
    revisionNotes: [
      `条目身份：${brief.entry_kind}；比较资格：${brief.comparison_eligible ? "是" : "否"}。`,
      `发布日期口径：${toText(brief.release_date_basis)}`,
      `访问与许可：${toText(brief.access)}；${toText(brief.license)}`,
      `仍未知：${toText(brief.unknown_fields)}`,
      `独立调研记录：${toText(brief.research_file)}`,
    ],
  };
}

export const generativeResearchEvents = generativeResearchBriefs
  .filter((brief) => brief.history_eligible && !existingHistorySlugs.has(brief.slug))
  .map(briefToEvent);

function numeric(value: unknown, unitPattern?: RegExp): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (unknown(value)) return null;
  const text = toText(value).replace(/,/g, "");
  const match = unitPattern ? text.match(unitPattern) : text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[1] ?? match[0]) : null;
}

function accessFor(brief: GenerativeResearchBrief): RawModelCatalogEntry["access"] {
  const value = toText(brief.access);
  if (brief.entry_kind === "rumor" || /待发布|to be released|preview only/i.test(value)) return "pending";
  if (/开放|open.?weight|github|hugging face|modelscope/i.test(value)) return "open";
  return "api";
}

function catalogModality(brief: GenerativeResearchBrief): string {
  if (brief.modality === "T2V") return "text+image→video";
  return "text+image→image";
}

function primarySource(brief: GenerativeResearchBrief): string {
  return brief.sources?.find((item) => !item.url.includes("shaojiemike.top"))?.url ?? SOURCE_ARTICLE;
}

export const generativeResearchCatalog: RawModelCatalogEntry[] = generativeResearchBriefs
  .filter((brief) => brief.entry_kind === "model" && brief.comparison_eligible && !existingHistorySlugs.has(brief.slug))
  .map((brief) => ({
    id: brief.slug,
    name: brief.name,
    org: brief.organization,
    releaseDate: normalizedDate(brief.release_date),
    access: accessFor(brief),
    license: toText(brief.license),
    modality: catalogModality(brief),
    totalParamsB: numeric(brief.parameter_total, /(\d+(?:\.\d+)?)\s*B\b/i),
    activeParamsB: numeric(brief.parameter_active, /(\d+(?:\.\d+)?)\s*B\b/i),
    contextK: null,
    weightSizeGB: numeric(brief.weight_size, /(\d+(?:\.\d+)?)\s*(?:GB|GiB)\b/i),
    trainingTokensT: null,
    aaIntelligence: null,
    aaAgentic: null,
    outputTokensPerSecond: null,
    blendedPricePerMTok: null,
    primarySourceUrl: primarySource(brief),
    aaUrl: brief.sources?.find((item) => item.url.includes("artificialanalysis.ai"))?.url ?? null,
    architectureLabel: toText(brief.architecture),
    aaGenerativeElo: numeric(brief.aa_elo),
    generationSeconds: numeric(brief.generation_time_seconds),
    generationContext: toText(brief.generation_time_context),
  }));

export const generativeResearchHistoryIds = Object.fromEntries(
  generativeResearchCatalog.map((item) => [item.id, `research-${item.id}`]),
) as Record<string, string>;
