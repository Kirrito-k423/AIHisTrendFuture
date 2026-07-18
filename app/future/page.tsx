import type { Metadata } from "next";
import { TimelineExplorer } from "../components/TimelineExplorer";
import { futureData } from "../data";

export const metadata: Metadata = {
  title: "未来",
  description: "有证据边界、假设与失效条件的五至十年 AI 技术情景图谱。",
};

export default function FuturePage() {
  return <TimelineExplorer data={futureData} />;
}
