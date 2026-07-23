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

test("timeline markers rise above overlapping cards on hover and keyboard focus", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.timeline-lane\s*\{[\s\S]*?isolation:\s*isolate/);
  assert.match(css, /\.event-marker:hover,[\s\S]*?\.event-marker:focus-visible,[\s\S]*?z-index:\s*40/);
});

test("keeps the fixed research schema and explicit unknown values", async () => {
  const source = await readFile(
    new URL("../app/data.ts", import.meta.url),
    "utf8",
  );

  assert.equal((source.match(/modelEvent\(\{/g) ?? []).length, 26);
  assert.match(source, /const kimiK25 = modelEvent/);
  assert.match(source, /const glm5 = modelEvent/);
  assert.match(source, /const minimaxM25 = modelEvent/);
  assert.match(source, /const qwen35 = modelEvent/);
  assert.match(source, /Agent Swarm/);
  assert.match(source, /Muon Split/);
  assert.match(source, /Prefix Tree Merging/);
  assert.match(source, /Gated DeltaNet/);
  assert.match(source, /const wan22 = modelEvent/);
  assert.match(source, /const qwenImage = modelEvent/);
  assert.match(source, /const zImageTurbo = modelEvent/);
  assert.match(source, /const cosmos3Edge = modelEvent/);
  assert.match(source, /Decoupled-DMD/);
  assert.match(source, /MSRoPE/);
  assert.match(source, /Denoising-stage MoE/);
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

  const research = JSON.parse(await readFile(new URL("../app/generative-research.json", import.meta.url), "utf8"));
  assert.equal(research.length, 28);
  assert.equal(research.filter((item) => item.entry_kind === "model").length, 25);
  assert.equal(research.filter((item) => item.entry_kind === "method").length, 3);
  assert.ok(research.every((item) => item.unknown_fields && item.sources?.length && item.novelty_claims?.length));
  assert.ok(research.every((item) => item.source_article === "https://shaojiemike.top/artificial-intelligence/2023/12/20/Idea2StableDiffusion/"));
  assert.ok(research.some((item) => item.slug === "nextstep-1-1" && item.modality === "T2I"));
  assert.ok(research.some((item) => item.slug === "abot-world-0" && item.modality === "T2V"));
  assert.ok(research.some((item) => item.slug === "self-forcing" && item.entry_kind === "method"));
});

test("comparison catalog covers ChatGPT through current Qwen and MiniMax", async () => {
  const source = await readFile(new URL("../app/model-catalog.ts", import.meta.url), "utf8");
  const research = await readFile(new URL("../app/generative-research.json", import.meta.url), "utf8");
  assert.ok((source.match(/id: /g) ?? []).length >= 50);
  assert.match(source, /2022-11-30/);
  assert.match(source, /Qwen3\.7/);
  assert.match(source, /Gemini 3\.6 Flash/);
  assert.match(source, /MiniMax‑M3/);
  assert.match(source, /Wan2\.2‑T2V‑A14B/);
  assert.match(source, /Qwen-Image/);
  assert.match(source, /Z-Image-Turbo/);
  assert.match(source, /modality: "text→image"/);
  assert.match(source, /modality: "text→video"/);
  assert.match(source, /aaIntelligence/);
  assert.match(source, /primarySourceUrl/);
  assert.match(source, /\.\.\.generativeResearchCatalog/);
  assert.match(research, /Qwen-Image-2/);
  assert.match(research, /GLM-Image/);
  assert.match(research, /Step-Video-T2V 30B/);
  assert.match(research, /Seedance 2\.0/);
  assert.match(research, /ABot-World-0/);
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

  assert.equal((definitionBlock.match(/label:/g) ?? []).length, 26);
  assert.match(dataSource, /historyEventIdByCatalogId/);
  assert.match(dataSource, /已检查当前主来源，尚未找到可核验披露/);
  assert.match(comparisonSource, /StructuredComparison/);
  assert.match(comparisonSource, /数值矩阵/);
  assert.match(comparisonSource, /结构化文字字段/);
  assert.match(comparisonSource, /reorderSelectedColumns/);
  assert.match(comparisonSource, /draggable/);
  assert.match(comparisonSource, /onDrop/);
  assert.match(comparisonSource, /按厂商筛选可加入模型/);
  assert.match(comparisonSource, /按模型任务类型筛选可加入模型/);
  assert.match(comparisonSource, /<optgroup/);

  const response = await render("/compare");
  const html = await response.text();
  assert.match(html, /注意力创新/);
  assert.match(html, /全部厂商/);
  assert.match(html, /全部类型/);
  assert.match(html, /T2I/);
  assert.match(html, /T2V/);
  assert.match(html, /Wan2\.2‑T2V‑A14B/);
  assert.match(html, /Qwen-Image/);
  assert.match(html, /Z-Image-Turbo/);
  assert.match(html, /拖动排序/);
  assert.match(html, /开创 \/ 关键方案/);
  assert.match(html, /训练算法 \/ 机制/);
  assert.match(html, /输出规格/);
  assert.match(html, /生成速度/);
  assert.match(html, /生成榜单 Elo/);
  assert.match(html, /Qwen-Image-2/);
  assert.match(html, /GLM-Image/);
  assert.match(html, /Seedance 2\.0/);
  assert.match(html, /Step-Video-T2V 30B/);
  assert.match(html, /ABot-World-0/);
  assert.match(html, /Agent Swarm/);
  assert.match(html, /Muon Split/);
  assert.match(html, /Prefix Tree Merging/);
  assert.match(html, /Gated DeltaNet/);
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

test("training technology history covers four evidence-backed STAR lanes", async () => {
  const dataSource = await readFile(new URL("../app/training-tech-data.ts", import.meta.url), "utf8");
  const timelineSource = await readFile(new URL("../app/components/TimelineExplorer.tsx", import.meta.url), "utf8");

  assert.equal((dataSource.match(/^const .* = technology\(/gm) ?? []).length, 35);
  for (const expected of [
    "Full Attention",
    "Multi-Query Attention",
    "Grouped-Query Attention",
    "Multi-Head Latent Attention",
    "PagedAttention",
    "Gated DeltaNet",
    "DeepSeek Sparse Attention",
    "Kimi Delta Attention",
    "LatentMoE",
    "Stable LatentMoE",
    "Attention Residuals",
    "DeepSeek-V4 CSA/HCA",
    "Sigmoid Tanh Unit",
    "Quantization-Aware Training",
    "Auxiliary-Loss-Free",
    "Muon Optimizer",
    "DanceGRPO",
    "DiffusionNFT",
    "On-Policy Distillation",
    "Tunix Agentic RL",
    "Triton-Ascend",
    "Ascend C",
    "Liger Kernel",
    "LLM MegaKernel",
    "DeepSpeed ZeRO",
    "PyTorch FSDP1",
    "PyTorch FSDP2",
    "DeepEP",
    "UltraEP",
    "veScale-FSDP",
  ]) assert.match(dataSource, new RegExp(expected));
  assert.match(dataSource, /tokenMixing/);
  assert.match(dataSource, /kvLayout/);
  assert.match(dataSource, /selectorCompressor/);
  assert.match(dataSource, /Indexer with kpool：[\s\S]*?无官方一手依据/);
  assert.match(dataSource, /β=4\.0、linear_β=25\.0/);
  assert.match(dataSource, /待 2026-07-27 权重或技术报告交叉核验/);
  assert.match(dataSource, /5–66% 吞吐/);
  assert.match(dataSource, /尚不能视为已公开可用/);
  assert.match(timelineSource, /STAR 技术档案/);
  assert.match(timelineSource, /Situation \/ 动机/);
  assert.match(timelineSource, /Action \/ 实验流程/);

  const response = await render("/history");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /训练技术 \/ 01/);
  assert.match(html, /Full Attention \/ Transformer/);
  assert.match(html, /Multi-Head Latent Attention/);
  assert.match(html, /Stable LatentMoE/);
  assert.match(html, /Sigmoid Tanh Unit/);
  assert.match(html, /Quantization-Aware Training/);
  assert.match(html, /UltraEP/);
  assert.match(html, /veScale-FSDP/);
});

test("technology and model comparison live under the hidden history submenu", async () => {
  const headerSource = await readFile(new URL("../app/components/SiteHeader.tsx", import.meta.url), "utf8");
  const hubSource = await readFile(new URL("../app/components/ComparisonHub.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.equal((headerSource.match(/id: "(?:history|trends|future)"/g) ?? []).length, 3);
  assert.match(headerSource, /href="\/history\/compare"/);
  assert.match(headerSource, /history-subnav/);
  assert.match(css, /\.history-subnav[\s\S]*?visibility:\s*hidden/);
  assert.match(css, /\.history-nav:hover \.history-subnav/);
  assert.match(hubSource, /技术比较/);
  assert.match(hubSource, /模型比较/);
  assert.match(hubSource, /硬件比较/);
  assert.match(hubSource, /HardwareComparison/);

  const response = await render("/history/compare");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /训练技术横向比较/);
  assert.match(html, /FSDP1/);
  assert.match(html, /FSDP2/);
  assert.match(html, /veScale-FSDP/);
  assert.match(html, /模型比较/);
  assert.match(html, /硬件比较/);
});

test("every training technology has attributable ownership and model relations", async () => {
  const dataSource = await readFile(new URL("../app/training-tech-data.ts", import.meta.url), "utf8");
  const timelineSource = await readFile(new URL("../app/components/TimelineExplorer.tsx", import.meta.url), "utf8");

  assert.equal((dataSource.match(/role: "(?:first-author|project-team)"/g) ?? []).length, 35);
  assert.equal((dataSource.match(/sourceUrl: "https:\/\//g) ?? []).length, 35);
  assert.match(dataSource, /Ashish Vaswani/);
  assert.match(dataSource, /Woosuk Kwon/);
  assert.match(dataSource, /Zhihong Shao/);
  assert.match(dataSource, /Google Tunix 团队/);
  assert.match(dataSource, /Huawei Ascend C 团队/);
  assert.match(dataSource, /PyTorch Distributed 团队/);
  assert.match(dataSource, /DeepSeek-AI 开源基础设施团队/);
  assert.match(dataSource, /modelLinksByTechnology/);
  assert.match(dataSource, /modelId: "deepseek-v3-2024-12", relation: "采用"/);
  assert.match(dataSource, /modelId: "kimi-k2", relation: "采用"/);
  assert.match(timelineSource, /relation-overlay/);
  assert.match(timelineSource, /related-model/);
  assert.match(timelineSource, /关联模型/);
});

test("history includes five source-backed DeepSpeed columns and all 21 requested methods", async () => {
  const dataSource = await readFile(new URL("../app/deepspeed-tech-data.ts", import.meta.url), "utf8");
  const historySource = await readFile(new URL("../app/data.ts", import.meta.url), "utf8");

  assert.equal((dataSource.match(/= deepSpeedEvent\(\{/g) ?? []).length, 21);
  assert.equal((dataSource.match(/group: "DeepSpeed 专栏 \/ 0[1-5]"/g) ?? []).length, 5);
  assert.match(dataSource, /网页底部 Updated 是站点构建时间，不作为发布日期/);
  for (const expected of [
    "ZeRO-Offload", "ZeRO++", "Mixed Precision ZeRO++", "Automatic Tensor Parallelism",
    "1-bit Adam", "1-bit LAMB", "0/1 Adam", "Domino",
    "DeepNVMe", "Ulysses-Offload", "ZenFlow", "DataStates-LLM Async Checkpoint",
    "DeepSpeed-MoE", "DeepSpeed-MoE Inference", "DeepSpeed Model Compression", "Mixture-of-Quantization",
    "DeepSpeed FLOPs Profiler", "PyTorch Profiler with DeepSpeed", "Communication Logging",
    "DeepSpeed Autotuning", "DeepSpeed Monitor",
  ]) assert.match(dataSource, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(historySource, /import \{ deepSpeedTechnologyLanes \}/);
  assert.match(historySource, /\.\.\.deepSpeedTechnologyLanes/);

  const response = await render("/history");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /DeepSpeed 专栏 \/ 01/);
  assert.match(html, /DeepSpeed 专栏 \/ 05/);
  assert.match(html, /ZeRO-Offload/);
  assert.match(html, /DataStates-LLM Async Checkpoint/);
  assert.match(html, /DeepSpeed Monitor/);
});

test("history adds verified hardware lanes and comparable spec fields", async () => {
  const hardwareSource = await readFile(new URL("../app/hardware-data.ts", import.meta.url), "utf8");
  const comparisonSource = await readFile(new URL("../app/components/HardwareComparison.tsx", import.meta.url), "utf8");
  const historySource = await readFile(new URL("../app/data.ts", import.meta.url), "utf8");

  assert.equal((hardwareSource.match(/^\s+id: "hw-/gm) ?? []).length, 16);
  for (const expected of [
    "NVIDIA A100 80GB SXM", "NVIDIA H100 SXM", "NVIDIA H800 PCIe", "NVIDIA H20", "NVIDIA B200", "GB200 NVL72",
    "Ascend 910B", "Ascend 910C", "Ascend 950DT", "Atlas 900 A3 SuperPoD 384", "Atlas 950 · 1024 卡实机", "Atlas 950 SuperPoD 8192",
    "Google TPU7x / Ironwood", "寒武纪 MLU370-X8", "Cerebras CS-3 / WSE-3", "AMD Instinct MI300X",
  ]) assert.match(hardwareSource, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const field of ["FP32", "FP16 / BF16", "FP8", "FP4", "INT4", "显存 / 内存", "显存带宽", "互联带宽", "功耗", "单价", "集群 / 超节点"]) assert.match(comparisonSource, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(hardwareSource, /官方资料未发布 TPU v8/);
  assert.match(hardwareSource, /1024 卡物理集群/);
  assert.match(hardwareSource, /unitPrice: unknown/);
  assert.match(historySource, /\.\.\.hardwareLanes/);
});

test("timeline defaults compact and supports pan, Ctrl-wheel zoom, and sparse opt-in", async () => {
  const source = await readFile(new URL("../app/components/TimelineExplorer.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /useState\(false\)/);
  assert.match(source, /if \(!sparseLayout\) return 1/);
  assert.match(source, /addEventListener\("wheel", handleWheel, \{ passive: false \}\)/);
  assert.match(source, /onPointerDown=\{startPan\}/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /Math\.max\(1, Math\.min\(4/);
  assert.match(source, /if \(!event\.ctrlKey\) return/);
  assert.match(source, /disabled=\{zoom <= 1\}/);
  assert.match(source, /Ctrl \+ 滚轮缩放/);
  assert.match(source, /zoomAnchorRef/);
  assert.match(source, /timeRatio: Math\.max\(0, Math\.min\(1, canvasPoint \/ Math\.max\(canvasWidth, 1\)\)\)/);
  assert.match(source, /anchor\.timeRatio \* canvasWidth - anchor\.viewportOffset/);
  assert.doesNotMatch(source, /requestAnimationFrame\(\(\) => \{ scroll\.scrollLeft/);
  assert.match(source, /稀疏布局/);
  assert.match(css, /\.layout-compact \.lane-label/);
  assert.match(css, /cursor:\s*grab/);
  assert.match(css, /\.timeline-canvas\s*\{\s*transition:\s*none/);
});

test("history separates content categories from rolling time windows", async () => {
  const source = await readFile(new URL("../app/components/TimelineExplorer.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const label of ["训练技术", "训练硬件", "模型", "推理"]) assert.match(source, new RegExp(`label: "${label}"`));
  for (const label of ["最近一季度", "最近半年", "最近一年", "最近三年", "全部"]) assert.match(source, new RegExp(`label: "${label}"`));
  assert.match(source, /useState<HistoryCategory>\("technology"\)/);
  assert.match(source, /useState<HistoryTimeWindow>\("all"\)/);
  assert.match(source, /setHistoryCategory/);
  assert.match(source, /setHistoryTimeWindow/);
  assert.match(source, /event\.date >= windowStart && event\.date <= SNAPSHOT_DATE/);
  assert.match(source, /lane\.id === "extreme-inference" \|\| lane\.id === "inference-papers"/);
  assert.doesNotMatch(source, />当前前沿<\/button>/);
  assert.doesNotMatch(source, />完整历史<\/button>/);
  assert.match(css, /\.history-filter-bar/);
  assert.match(css, /\.history-filter-group button\.active/);

  const response = await render("/history");
  const html = await response.text();
  assert.match(html, /内容类别/);
  assert.match(html, /时间范围/);
  assert.match(html, /最近一季度/);
  assert.match(html, /最近三年/);
});

test("timeline uses opaque staggered cards, axis dots, and dashed guides with a 30% overlap bound", async () => {
  const source = await readFile(new URL("../app/components/TimelineExplorer.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /MAX_CARD_OVERLAP_RATIO = 0\.3/);
  assert.match(source, /MIN_CARD_GAP_PERCENT_AT_100/);
  assert.match(source, /resolveCardPositions/);
  assert.match(source, /placement: "above"/);
  assert.match(source, /layout\.placement = "below"/);
  assert.match(source, /className="lane-event-guides"/);
  assert.match(source, /className=\{`event-axis-dot/);
  assert.match(css, /\.lane-event-guides path[\s\S]*?stroke-dasharray:\s*5 5/);
  assert.match(css, /\.event-axis-dot[\s\S]*?border-radius:\s*50%/);
  assert.match(css, /\.event-marker\.tier-baseline,[\s\S]*?opacity:\s*1/);
  assert.match(css, /\.event-marker\.relationship-muted[\s\S]*?opacity:\s*1/);
  const cardWidth = Number(source.match(/COMPACT_CARD_WIDTH = (\d+)/)?.[1]);
  const overlapLimit = Number(source.match(/MAX_CARD_OVERLAP_RATIO = ([\d.]+)/)?.[1]);
  const minimumCenterGap = cardWidth * (1 - overlapLimit);
  assert.ok((cardWidth - minimumCenterGap) / cardWidth <= 0.3 + 1e-9);
});

test("multimodal comparison omits AA intelligence and agent metrics", async () => {
  const source = await readFile(new URL("../app/components/ComparisonExplorer.tsx", import.meta.url), "utf8");
  assert.match(source, /AA_TEXT_ONLY_METRICS/);
  assert.match(source, /modality === "LLM"/);
  assert.match(source, /metricKeys\.filter\(\(key\) => !AA_TEXT_ONLY_METRICS\.includes\(key\)\)/);
  assert.match(source, /多模态模型比较已移除这两项/);
  assert.match(source, /field\.label !== "Artificial Analysis 指标"/);
});
