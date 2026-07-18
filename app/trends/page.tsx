import type { Metadata } from "next";
import { TimelineExplorer } from "../components/TimelineExplorer";
import { trendsData } from "../data";

export const metadata: Metadata = {
  title: "趋势",
  description: "由历史证据推导、可修订且可证伪的未来一至两年 AI 技术趋势。",
};

export default function TrendsPage() {
  return <TimelineExplorer data={trendsData} />;
}
