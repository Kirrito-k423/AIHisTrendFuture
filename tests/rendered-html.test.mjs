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

test("server-renders all three evidence timeline pages", async () => {
  const cases = [
    ["/history", "deepseek-v3", "gpt-oss-120b"],
    ["/trends", "trend-sparse-default", "trend-cost-per-intelligence"],
    ["/future", "future-rack-scale-computer", "future-human-average-bundle"],
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

  assert.equal((source.match(/modelEvent\(\{/g) ?? []).length, 15);
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
