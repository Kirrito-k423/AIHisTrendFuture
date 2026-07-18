import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const researchDir = resolve(root, "research", "model-briefs");
const outputFile = resolve(root, "app", "generative-research.json");
const sourceArticle = "https://shaojiemike.top/artificial-intelligence/2023/12/20/Idea2StableDiffusion/";

const files = (await readdir(researchDir))
  .filter((name) => name.endsWith(".json"))
  .sort((a, b) => a.localeCompare(b));

const briefs = [];
for (const file of files) {
  const brief = JSON.parse(await readFile(resolve(researchDir, file), "utf8"));
  briefs.push({ ...brief, research_file: `research/model-briefs/${file}`, source_article: sourceArticle });
}

briefs.sort((a, b) => String(a.release_date).localeCompare(String(b.release_date)) || String(a.slug).localeCompare(String(b.slug)));
await writeFile(outputFile, `${JSON.stringify(briefs, null, 2)}\n`, "utf8");
console.log(`Bundled ${briefs.length} research briefs into ${outputFile}`);
