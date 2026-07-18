import type { Metadata } from "next";
import { MetricExplorer } from "../../components/MetricExplorer";
import { metricDefinitions, metricKeys, type MetricKey } from "../../comparison-data";

export function generateStaticParams() {
  return metricKeys.map((metric) => ({ metric }));
}

export async function generateMetadata({ params }: { params: Promise<{ metric: string }> }): Promise<Metadata> {
  const { metric } = await params;
  const key = metricKeys.includes(metric as MetricKey) ? metric as MetricKey : "aaIntelligence";
  return {
    title: metricDefinitions[key].shortTitle,
    description: `${metricDefinitions[key].title}的发布时间演进、绝对值比较与逐点来源。`,
  };
}

export default async function MetricPage({
  params,
  searchParams,
}: {
  params: Promise<{ metric: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const [{ metric }, { focus }] = await Promise.all([params, searchParams]);
  return <MetricExplorer initialMetric={metric} initialFocus={focus} />;
}
