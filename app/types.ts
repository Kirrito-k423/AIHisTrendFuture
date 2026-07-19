export type Confidence = "高" | "中" | "低";
export type FactStatus = "已披露" | "推导" | "未知";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: "官方博客" | "论文" | "技术报告" | "模型卡" | "代码仓" | "第三方测量" | "数据集" | "讲座整理";
  accessedAt: string;
}

export interface Fact {
  label: string;
  value: string;
  status: FactStatus;
  sourceIds: string[];
  method?: string;
}

export interface StarNarrative {
  situation: string;
  target: string;
  action: string;
  result: string;
}

export interface PrimaryContributor {
  name: string;
  role: "first-author" | "project-team";
  organization: string;
  profileUrl?: string;
  profileLabel?: "个人主页" | "GitHub" | "论文作者页" | "官方项目";
  sourceUrl: string;
  note?: string;
}

export interface ModelTechnologyLink {
  modelId: string;
  relation: "采用" | "技术谱系" | "基础模型" | "实验验证" | "训练 / 推理支撑";
  note?: string;
}

export type TechnologyCategory = "模型结构" | "算法流程" | "高效算子" | "并行方案";

export interface TechnologyComparison {
  category: TechnologyCategory;
  mechanism: string;
  bestFor: string;
  experiment: string;
  result: string;
  computeMemory: string;
  parallelism: string;
  limitations: string;
  availability: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  organization: string;
  eyebrow: string;
  summary: string;
  confidence: Confidence;
  score?: string;
  tags: string[];
  facts: Fact[];
  sources: Source[];
  basisIds?: string[];
  breakthroughs?: string[];
  revisionNotes?: string[];
  tier?: "frontier" | "watch" | "baseline";
  star?: StarNarrative;
  comparison?: TechnologyComparison;
  eventKind?: "technology" | "model" | "hardware" | "research";
  primaryContributor?: PrimaryContributor;
  modelLinks?: ModelTechnologyLink[];
}

export interface TimelineLane {
  id: string;
  group: string;
  title: string;
  description: string;
  color: "cyan" | "amber" | "violet" | "green";
  events: TimelineEvent[];
}

export interface TimelinePageData {
  page: "history" | "trends" | "future";
  kicker: string;
  title: string;
  intro: string;
  windowLabel: string;
  startDate: string;
  endDate: string;
  tickDates: string[];
  lanes: TimelineLane[];
}
