import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${pathname}-${process.pid}-${Date.now()}-${Math.random()}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders timeline, comparison, and metric pages", async () => {
  const cases = [
    ["/history", "deepseek-v3", "gpt-oss-120b"],
    ["/trends", "trend-sparse-default", "trend-cost-per-intelligence"],
    ["/future", "future-rack-scale-computer", "future-human-average-bundle"],
    ["/compare", "chatgpt-gpt35", "minimax-m3"],
    ["/metrics/totalParamsB", "总参数规模", "DeepSeek V4 Pro"],
  ];

  for (const [pathname, firstEvent, lastEvent] of cases) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

    const html = await response.text();
    assert.match(html, /AI 技术时空图谱/);
    assert.match(html, new RegExp(firstEvent));
    assert.match(html, new RegExp(lastEvent));
    assert.match(html, /og\.png/);
  }
});

test("keeps the fixed research schema and explicit unknown values", async () => {
  const source = await readFile(
    new URL("../app/data.ts", import.meta.url),
    "utf8",
  );

  assert.equal((source.match(/modelEvent\(\{/g) ?? []).length, 17);
  assert.match(source, /总参数规模/);
  assert.match(source, /公开权重大小/);
  assert.match(source, /注意力创新/);
  assert.match(source, /训练机器规模/);
  assert.match(source, /训练阶段/);
  assert.match(source, /总训练时长/);
  assert.match(source, /训练算法 \/ 机制/);
  assert.match(source, /低精度训练/);
  assert.match(source, /AI Infra 创新/);
  assert.match(source, /value\.startsWith\("未知"\) \? "未知"/);
  assert.match(source, /: "未知"/);
  assert.match(source, /https:\/\//);
});

test("comparison catalog covers ChatGPT through current Qwen and MiniMax", async () => {
  const source = await readFile(new URL("../app/model-catalog.ts", import.meta.url), "utf8");
  assert.ok((source.match(/id: /g) ?? []).length >= 50);
  assert.match(source, /2022-11-30/);
  assert.match(source, /Qwen3\.7/);
  assert.match(source, /MiniMax‑M3/);
  assert.match(source, /aaIntelligence/);
  assert.match(source, /primarySourceUrl/);
});

test("metric charts use interactive ECharts with linear axes and sortable tables", async () => {
  const metricSource = await readFile(new URL("../app/components/MetricExplorer.tsx", import.meta.url), "utf8");
  const comparisonSource = await readFile(new URL("../app/components/ComparisonExplorer.tsx", import.meta.url), "utf8");
  const dataSource = await readFile(new URL("../app/comparison-data.ts", import.meta.url), "utf8");

  assert.match(metricSource, /import\("echarts"\)/);
  assert.match(metricSource, /tooltip:/);
  assert.match(metricSource, /legend:/);
  assert.match(metricSource, /dataZoom:/);
  assert.match(metricSource, /type: "value"/);
  assert.match(metricSource, /ChartTypeButtons/);
  assert.match(metricSource, /SortableEvidenceHeader/);
  assert.match(comparisonSource, /compareModels/);
  assert.match(comparisonSource, /SortableHeader/);
  assert.doesNotMatch(metricSource, /Math\.log|type:\s*["']log/);
  assert.doesNotMatch(dataSource, /scale:\s*["']log/);

  const response = await render("/metrics/totalParamsB");
  const html = await response.text();
  assert.match(html, /ECharts 交互/);
  assert.match(html, /阶梯线/);
  assert.match(html, /按列排序/);
});

test("comparison page renders source-backed structured text fields side by side", async () => {
  const dataSource = await readFile(new URL("../app/comparison-data.ts", import.meta.url), "utf8");
  const comparisonSource = await readFile(new URL("../app/components/ComparisonExplorer.tsx", import.meta.url), "utf8");
  const definitionBlock = dataSource.match(/export const structuredFieldDefinitions = \[([\s\S]*?)\] as const;/)?.[1] ?? "";

  assert.equal((definitionBlock.match(/label:/g) ?? []).length, 22);
  assert.match(dataSource, /historyEventIdByCatalogId/);
  assert.match(dataSource, /已检查当前主来源，尚未找到可核验披露/);
  assert.match(comparisonSource, /StructuredComparison/);
  assert.match(comparisonSource, /数值矩阵/);
  assert.match(comparisonSource, /结构化文字字段/);

  const response = await render("/compare");
  const html = await response.text();
  assert.match(html, /注意力创新/);
  assert.match(html, /训练算法 \/ 机制/);
  assert.match(html, /DSA \+ IndexShare/);
  assert.match(html, /已核验/);
  assert.match(html, /未知/);
});

test("closed-model parameter estimates keep methods, uncertainty, and charts separate", async () => {
  const inferenceSource = await readFile(new URL("../app/parameter-inference.ts", import.meta.url), "utf8");
  const comparisonSource = await readFile(new URL("../app/components/ComparisonExplorer.tsx", import.meta.url), "utf8");
  const dataSource = await readFile(new URL("../app/comparison-data.ts", import.meta.url), "utf8");

  assert.equal((inferenceSource.match(/sourceUrl: "https:\/\/arxiv\.org\/abs\//g) ?? []).length, 9);
  assert.match(inferenceSource, /θ̂\(z\) = 41\.18/);
  assert.match(inferenceSource, /accuracy ≈ a · log\(N\) \+ b/);
  assert.match(inferenceSource, /NightVision/);
  assert.match(inferenceSource, /Nopt ∝ C\^0\.49~0\.50/);
  assert.match(inferenceSource, /"chatgpt-gpt35"/);
  assert.match(inferenceSource, /"gemini-25-pro"/);
  assert.match(inferenceSource, /display: "≥9B"/);
  assert.match(inferenceSource, /display: "≈3\.0T/);
  assert.match(comparisonSource, /论文推算 · 不入图/);
  assert.doesNotMatch(dataSource, /totalParamsB: structuralMetric\(parameterEstimate/);

  const response = await render("/compare");
  const html = await response.text();
  assert.match(html, /闭源参数估算方法/);
  assert.match(html, /5(?:<!-- -->)? 种方法 · (?:<!-- -->)?4(?:<!-- -->)? 个模型已接入/);
  assert.match(html, /官方披露优先/);
  assert.match(html, /不拿媒体传闻/);
  assert.match(html, /≈3\.0T（约 1\.0–9\.0T）/);
  assert.match(html, /保守下界/);
});
