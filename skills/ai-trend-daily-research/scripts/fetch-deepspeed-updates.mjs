#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const API_ROOT = "https://api.github.com";
const USER_AGENT =
  "AIHisTrendFuture-daily-research/1.0 (+https://github.com/Kirrito-k423/AIHisTrendFuture)";
const TOPICS = [
  "ZeRO-Offload",
  "ZeRO++",
  "MixZ++",
  "AutoTP",
  "1-bit Adam",
  "1-bit LAMB",
  "0/1 Adam",
  "Domino",
  "DeepNVMe",
  "Ulysses-Offload",
  "ZenFlow",
  "DataStates",
  "DeepSpeed-MoE",
  "MoE Inference",
  "Model Compression",
  "MoQ",
  "FLOPs Profiler",
  "PyTorch Profiler",
  "Communication Logging",
  "Autotuning",
  "Monitor",
];

const TOPIC_PATTERN =
  /\b(zero(?:-offload|\+\+)?|mixz\+\+|autotp|1-bit (?:adam|lamb)|0\/1 adam|domino|deepnvme|ulysses(?:-offload)?|zenflow|datastates|deep(?:speed)?[- ]?moe|moe inference|model compression|moq|flops profiler|pytorch profiler|communication logging|autotuning|monitor)\b/iu;
const HOUSEKEEPING_PATTERN =
  /\b(typo|spell(?:ing)?|grammar|broken link|fix link|sidebar|navigation|format(?:ting)?|org reference|rename only)\b/iu;
const TECHNICAL_PATTERN =
  /\b(api|config|support|performance|throughput|latency|memory|offload|checkpoint|parallel|optimizer|quantiz|inference|training|kernel|collective|all[- ]?to[- ]?all|all[- ]?reduce|reduce[- ]?scatter|bugfix|fix)\b/iu;

function usage() {
  return `Usage: node fetch-deepspeed-updates.mjs [options]

Options:
  --since-hours <1-168>  Lookback window (default: 36)
  --take <1-100>         Maximum commits per tracked surface (default: 30)
  --output <path|->      Write JSON to a file or stdout (default: -)
  --proxy <url>          Optional loopback HTTP proxy
  --help                 Show this help`;
}

function parseArgs(argv) {
  const options = { sinceHours: 36, take: 30, output: "-", proxy: null };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (argument === "--since-hours") {
      options.sinceHours = Number(value);
      index += 1;
    } else if (argument === "--take") {
      options.take = Number(value);
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
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
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
      "Accept: application/vnd.github+json",
      "-H",
      "X-GitHub-Api-Version: 2022-11-28",
      url,
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `curl exited with status ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function fetchJson(url, proxy) {
  return proxy ? fetchJsonWithCurl(url, proxy) : fetchJsonWithNativeFetch(url);
}

function githubUrl(pathname, query = {}) {
  const url = new URL(`${API_ROOT}${pathname}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  return url.toString();
}

function shortMessage(commit) {
  return commit.commit?.message?.split("\n")[0]?.trim() ?? "";
}

function normalizedFiles(detail) {
  return (detail.files ?? []).map((file) => ({
    path: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch ? file.patch.slice(0, 6000) : null,
  }));
}

function classify(surface, message, files) {
  const joined = `${message}\n${files.map((file) => `${file.path}\n${file.patch ?? ""}`).join("\n")}`;
  const newTutorial = files.some(
    (file) => file.status === "added" && file.path.startsWith("docs/_tutorials/"),
  );
  const release = surface === "release";
  const housekeeping = HOUSEKEEPING_PATTERN.test(message) && !TECHNICAL_PATTERN.test(joined);
  const trackedTopic = TOPIC_PATTERN.test(joined);
  const substantive =
    newTutorial ||
    release ||
    trackedTopic ||
    TECHNICAL_PATTERN.test(message) ||
    files.some((file) => file.changes >= 20);

  if (newTutorial || release) {
    return { kind: newTutorial ? "new_tutorial" : "release", priority: "immediate", action: "alert" };
  }
  if (housekeeping || !substantive) {
    return { kind: "maintenance", priority: "low", action: "weekly_digest" };
  }
  return {
    kind: trackedTopic ? "tracked_topic_update" : "technical_update",
    priority: "high",
    action: "research",
  };
}

async function commitUpdates({ repository, path, surface, since, take, proxy, topicFilter = false }) {
  const query = { since, per_page: take };
  if (path) query.path = path;
  const commits = await fetchJson(githubUrl(`/repos/${repository}/commits`, query), proxy);
  const updates = [];

  for (const commit of Array.isArray(commits) ? commits : []) {
    const detail = await fetchJson(commit.url, proxy);
    const files = normalizedFiles(detail);
    const message = shortMessage(commit);
    const searchable = `${message}\n${files.map((file) => file.path).join("\n")}`;
    if (topicFilter && !TOPIC_PATTERN.test(searchable)) continue;
    const classification = classify(surface, message, files);
    updates.push({
      surface,
      repository,
      sha: commit.sha,
      committedAt: commit.commit?.committer?.date ?? commit.commit?.author?.date ?? null,
      message,
      url: commit.html_url,
      author: commit.author?.login ?? commit.commit?.author?.name ?? null,
      classification,
      matchedTrackedTopic: TOPIC_PATTERN.test(searchable),
      files,
    });
  }
  return updates;
}

async function releaseUpdates({ since, take, proxy }) {
  const releases = await fetchJson(
    githubUrl("/repos/deepspeedai/DeepSpeed/releases", { per_page: take }),
    proxy,
  );
  return (Array.isArray(releases) ? releases : [])
    .filter((release) => release.published_at && release.published_at >= since)
    .map((release) => ({
      surface: "release",
      repository: "deepspeedai/DeepSpeed",
      tag: release.tag_name,
      publishedAt: release.published_at,
      name: release.name,
      url: release.html_url,
      prerelease: release.prerelease,
      classification: classify("release", release.name ?? release.tag_name ?? "", []),
    }));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const fetchedAt = new Date();
  const since = new Date(fetchedAt.getTime() - options.sinceHours * 60 * 60 * 1000).toISOString();

  const groups = await Promise.all([
    commitUpdates({
      repository: "deepspeedai/DeepSpeed",
      path: "docs/_tutorials",
      surface: "tutorial",
      since,
      take: options.take,
      proxy: options.proxy,
    }),
    commitUpdates({
      repository: "deepspeedai/DeepSpeed",
      path: "README.md",
      surface: "latest_news",
      since,
      take: options.take,
      proxy: options.proxy,
    }),
    commitUpdates({
      repository: "deepspeedai/DeepSpeedExamples",
      path: null,
      surface: "examples",
      since,
      take: options.take,
      proxy: options.proxy,
      topicFilter: true,
    }),
    releaseUpdates({ since, take: options.take, proxy: options.proxy }),
  ]);
  const updates = groups.flat().sort((left, right) => {
    const leftDate = left.committedAt ?? left.publishedAt ?? "";
    const rightDate = right.committedAt ?? right.publishedAt ?? "";
    return rightDate.localeCompare(leftDate);
  });

  const result = {
    schemaVersion: 1,
    fetchedAt: fetchedAt.toISOString(),
    since,
    source: {
      name: "DeepSpeed official GitHub",
      repositories: [
        "https://github.com/deepspeedai/DeepSpeed",
        "https://github.com/deepspeedai/DeepSpeedExamples",
      ],
    },
    trackedTopics: TOPICS,
    policy: {
      noChange: "silent",
      newTutorialOrRelease: "immediate alert",
      substantiveTechnicalChange: "send to evidence review",
      maintenanceOnly: "weekly digest",
    },
    updates,
    summary: {
      total: updates.length,
      immediate: updates.filter((item) => item.classification.priority === "immediate").length,
      high: updates.filter((item) => item.classification.priority === "high").length,
      low: updates.filter((item) => item.classification.priority === "low").length,
    },
  };

  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (options.output === "-") process.stdout.write(serialized);
  else await writeFile(options.output, serialized, "utf8");
}

main().catch((error) => {
  process.stderr.write(`DeepSpeed monitor failed: ${error.message}\n`);
  process.exitCode = 1;
});
