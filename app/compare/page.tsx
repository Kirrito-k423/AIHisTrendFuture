import type { Metadata } from "next";
import { ComparisonExplorer } from "../components/ComparisonExplorer";

export const metadata: Metadata = {
  title: "模型横向比较",
  description: "从 ChatGPT 发布以来的代表模型参数、上下文、训练数据、速度、价格与独立指标横向比较。",
};

export default function ComparePage() {
  return <ComparisonExplorer />;
}
