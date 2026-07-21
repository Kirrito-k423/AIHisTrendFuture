# AI 技术时空图谱

把 AI 技术的历史、趋势与未来放进同一套可追溯的时间坐标系。

站点采用“横向时间、纵向分类”的研究视图：历史页默认只显示 2026 当前前沿，可切换完整历史、检索、按置信度筛选或进入对比表。点击任一节点，右侧证据面板会展开完整字段、原始来源、计算方法、推导链、置信度和修订记录。

## 当前内容

- **历史**：LLM/VLM、T2I/图像编辑、T2V/视频编辑、Omni、生成训练方法、极致推理性能与推理技术论文。
- **趋势（1–2 年）**：稀疏化、训练规模与数据质量、低精度训练、内存层级、电力约束、单位智能成本。
- **未来（5–10 年）**：芯片与机架、异构推理、能源园区、长时程 Agent、人类平均智能、AI 科学家与治理外壳。
- **78 个时间节点**，其中包含 34 个可横向比较的训练技术节点；从 T2I/T2V 综述逐条核验了 27 个候选条目（24 个模型、3 个方法），任何未查到的项目都显式保留为“未知”。
- **当前快照**：Kimi K3（API 已上线、权重待发布）、GLM‑5.2、MiniMax‑M3、DeepSeek‑V4‑Pro、Kimi K2.6、Qwen3.6、Cosmos3‑Super、Cosmos3‑Edge 与 LTX‑2.3；旧模型作为架构和性能基线。
- **模型对比**：覆盖从 2022‑11 ChatGPT 到 2026‑07 的 87 个代表模型，并可按 T2I/T2V 筛选。除 LLM 指标外，还提供生成 Elo、单次生成时间、输出规格及逐项来源。

## 证据规则

1. 模型事实优先引用官方仓库、官方博客、论文或技术报告；Artificial Analysis 仅承担可比基准数据。
2. “直接证据”“由证据计算”“推导”“未知”四种状态明确区分，避免把推断伪装成事实。
3. 趋势和未来判断必须列出历史依据、推导方法、关键假设、可观测指标与失效条件。
4. 同一模型始终保留参数、权重、架构、硬件、数据、阶段、时间、算法、低精度和 Infra 等固定字段。
5. LLM 动态指标快照日期为 **2026-07-18**，本轮 T2I/T2V 调研访问日期为 **2026-07-19**，Cosmos3‑Edge 与 UltraEP 访问日期为 **2026-07-21**；基准会随榜单刷新而变化，引用时请同时记录日期。
6. Attention 技术不强行放进单一互斥枚举：分别记录 token mixing、KV/state layout、selector/compressor；DeepSeek-V4 的 `kpool` 别名因无一手依据保持未核验。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

访问 `http://localhost:3000`。质量检查：

```bash
npm run lint
npm test
```

更新 `research/model-briefs/*.json` 后，重新生成站点使用的研究数据：

```bash
npm run research:bundle
```

## 每日 AI 前沿深研

仓库内置 [`ai-trend-daily-research`](./skills/ai-trend-daily-research/SKILL.md) skill：从 AI HOT 公共只读接口发现 SOTA 模型、训练 / 推理技术和硬件突破候选，回到一手来源核验后，再按本仓库的固定字段与证据状态更新内容。没有达到证据门槛的日期不会创建空更新或重新发布站点。

该 skill 的 canonical 源保留在本仓库；本机 Codex 通过 `~/.codex/skills/ai-trend-daily-research` 的符号链接发现它。首次安装后通常需要新开任务或重载应用。

## 项目结构

```text
app/
  components/TimelineExplorer.tsx  # 时间图谱与证据抽屉
  components/ComparisonExplorer.tsx # 模型横向比较矩阵
  components/MetricExplorer.tsx     # 指标时间演进与绝对值图
  data.ts                          # 事件、字段、来源与推导链
  generative-research.ts          # T2I/T2V 研究数据适配器
  generative-research.json        # 可部署的研究数据快照
  model-catalog.ts                 # ChatGPT 以来的代表模型目录
  comparison-data.ts              # 可比较数值与来源契约
  history/ trends/ future/         # 三个独立页面
  types.ts                         # 可追溯数据契约
public/og.png                      # 社交分享图
research/model-briefs/             # 每个模型/方法一份独立调研记录
scripts/generate-generative-research.mjs # 调研数据打包脚本
skills/ai-trend-daily-research/          # AI HOT 每日前沿发现、核验与发布闭环
tests/rendered-html.test.mjs       # 路由与字段完整性测试
```

## 贡献

欢迎提交 Issue 或 PR 补充来源、修正事实和更新趋势判断。新增模型时请使用现有 `modelEvent` 结构，不能因为没有资料而删除字段；请填写“未知”，并在有新证据时补充来源。

代码采用 [MIT License](./LICENSE)，本项目原创数据整理采用 [CC BY 4.0](./DATA_LICENSE.md)。外部来源、论文与商标仍归各自权利人所有。
