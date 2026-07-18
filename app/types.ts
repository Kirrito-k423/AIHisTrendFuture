export type Confidence = "高" | "中" | "低";
export type FactStatus = "已披露" | "推导" | "未知";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: "官方博客" | "论文" | "技术报告" | "模型卡" | "代码仓" | "第三方测量" | "数据集";
  accessedAt: string;
}

export interface Fact {
  label: string;
  value: string;
  status: FactStatus;
  sourceIds: string[];
  method?: string;
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
  revisionNotes?: string[];
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
