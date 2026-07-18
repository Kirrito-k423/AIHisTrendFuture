import type { Metadata } from "next";
import { TimelineExplorer } from "../components/TimelineExplorer";
import { historyData } from "../data";

export const metadata: Metadata = {
  title: "历史",
  description: "开放权重 AI 模型训练与推理技术的可追溯时间图谱。",
};

export default function HistoryPage() {
  return <TimelineExplorer data={historyData} />;
}
