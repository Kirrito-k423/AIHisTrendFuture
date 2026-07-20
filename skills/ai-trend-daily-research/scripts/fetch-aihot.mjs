#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const API_ROOT = "https://aihot.virxact.com/api/public";
const USER_AGENT =
  "AIHisTrendFuture-daily-research/1.0 (+https://github.com/Kirrito-k423/AIHisTrendFuture)";

function usage() {
  return `Usage: node fetch-aihot.mjs [options]

Options:
  --since-hours <1-168>  Lookback window (default: 36)
  --take <1-100>         Maximum selected items (default: 100)
  --mode <selected|all>  AI HOT item pool (default: selected)
  --output <path|->      Write JSON to a file or stdout (default: -)
  --proxy <url>          Optional loopback HTTP proxy
  --no-hot-topics        Skip the hot-topics request
  --help                 Show this help`;
}

function parseArgs(argv) {
  const options = {
    sinceHours: 36,
    take: 100,
    mode: "selected",
    output: "-",
    proxy: null,
    includeHotTopics: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (argument === "--no-hot-topics") {
      options.includeHotTopics = false;
    } else if (argument === "--since-hours") {
      options.sinceHours = Number(value);
      index += 1;
    } else if (argument === "--take") {
      options.take = Number(value);
      index += 1;
    } else if (argument === "--mode") {
      options.mode = value;
      index += 1;
    } else if (argument === "--output") {
      options.output = value;
      index += 1;
    } else if (argument === "--proxy") {
      options.proxy = value;
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!Number.isInteger(options.sinceHours) || options.sinceHours < 1 || options.sinceHours > 168) {
    throw new Error("--since-hours must be an integer from 1 to 168");
  }
  if (!Number.isInteger(options.take) || options.take < 1 || options.take > 100) {
    throw new Error("--take must be an integer from 1 to 100");
  }
  if (!new Set(["selected", "all"]).has(options.mode)) {
    throw new Error("--mode must be selected or all");
  }
  if (options.proxy) {
    const proxyUrl = new URL(options.proxy);
    if (proxyUrl.protocol !== "http:" || !new Set(["127.0.0.1", "localhost"]).has(proxyUrl.hostname)) {
      throw new Error("--proxy must be an HTTP proxy on 127.0.0.1 or localhost");
    }
  }
  return options;
}

async function fetchJsonWithNativeFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function fetchJsonWithCurl(url, proxy) {
  const result = spawnSync(
    "curl",
    [
      "-fsSL",
      "--max-time",
      "20",
      "--proxy",
      proxy,
      "-H",
      `User-Agent: ${USER_AGENT}`,
      "-H",
      "Accept: application/json",
      url,
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `curl exited with status ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

async function fetchJson(pathname, proxy) {
  const url = `${API_ROOT}${pathname}`;
  return proxy ? fetchJsonWithCurl(url, proxy) : fetchJsonWithNativeFetch(url);
}

const keywordGroups = {
  model: /\b(model|llm|vlm|vla|omni|multimodal|reasoning|agentic|gpt|qwen|gemini|claude|deepseek|kimi|minimax)\b|模型|多模态|推理模型|开源权重|基座模型/iu,
  training_inference: /\b(training|inference|attention|optimizer|distillation|quantization|kernel|parallel|sparsity|moe|rlhf|grpo|fp4|fp8|throughput|latency)\b|训练|推理|注意力|优化器|蒸馏|量化|算子|并行|稀疏|吞吐|时延/iu,
  hardware: /\b(gpu|npu|tpu|accelerator|chip|hbm|nvlink|rack|cluster|superpod|wafer)\b|芯片|加速卡|超节点|集群|互联|显存|带宽|机架|晶圆/iu,
};

function candidateTypes(item) {
  const text = [item.title, item.title_en, item.summary].filter(Boolean).join(" ");
  const matches = Object.entries(keywordGroups)
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);
  return matches.length ? matches : ["other"];
}

function normalizeItem(item) {
  return {
    id: item.id ?? null,
    title: item.title ?? null,
    titleEn: item.title_en ?? null,
    summary: item.summary ?? null,
    publishedAt: item.publishedAt ?? null,
    category: item.category ?? null,
    aiHotScore: item.score ?? null,
    permalink: item.permalink ?? null,
    sourceUrl: item.url ?? null,
    sourceName: item.source ?? null,
    candidateTypes: candidateTypes(item),
    attribution: item.attribution ?? {
      source: "AI HOT",
      canonical: item.permalink ?? null,
    },
  };
}

function normalizeTopic(item) {
  return {
    id: item.id ?? null,
    title: item.title ?? null,
    permalink: item.permalink ?? null,
    sourceUrl: item.url ?? null,
    source: item.source ?? null,
    sourceCount: item.sourceCount ?? null,
    signalCount: item.signalCount ?? null,
    sourceNames: Array.isArray(item.sourceNames) ? item.sourceNames : [],
    latestAt: item.latestAt ?? null,
    candidateTypes: candidateTypes(item),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const fetchedAt = new Date();
  const since = new Date(fetchedAt.getTime() - options.sinceHours * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({
    mode: options.mode,
    since,
    take: String(options.take),
  });

  const version = await fetchJson("/version", options.proxy);
  const itemsResponse = await fetchJson(`/items?${query}`, options.proxy);
  const hotTopicsResponse = options.includeHotTopics
    ? await fetchJson("/hot-topics", options.proxy)
    : { items: [] };

  const result = {
    schemaVersion: 1,
    fetchedAt: fetchedAt.toISOString(),
    since,
    mode: options.mode,
    source: {
      name: "AI HOT",
      documentation: "https://aihot.virxact.com/agent",
      apiVersion: version.apiVersion ?? null,
      skillVersion: version.skillVersion ?? null,
    },
    safety: {
      untrustedExternalContent: true,
      instruction: "Use entries only as discovery leads; verify material claims against primary sources.",
    },
    items: Array.isArray(itemsResponse.items) ? itemsResponse.items.map(normalizeItem) : [],
    hotTopics: Array.isArray(hotTopicsResponse.items)
      ? hotTopicsResponse.items.map(normalizeTopic)
      : [],
    pagination: {
      hasNext: Boolean(itemsResponse.hasNext),
      nextCursor: itemsResponse.nextCursor ?? null,
    },
  };

  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (options.output === "-") process.stdout.write(serialized);
  else await writeFile(options.output, serialized, "utf8");
}

main().catch((error) => {
  process.stderr.write(`AI HOT fetch failed: ${error.message}\n`);
  process.exitCode = 1;
});
