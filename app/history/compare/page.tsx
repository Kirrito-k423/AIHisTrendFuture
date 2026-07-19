import type { Metadata } from "next";
import { ComparisonHub } from "../../components/ComparisonHub";

export const metadata: Metadata = {
  title: "训练技术与模型比较",
  description: "历史图谱的二级比较页：按 STAR 与证据比较训练技术，或横向比较代表模型。",
};

export default function HistoryComparePage() {
  return <ComparisonHub />;
}
