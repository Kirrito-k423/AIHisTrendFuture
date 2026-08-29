# AI 技术时空图谱

把 AI 技术的历史、趋势与未来放进同一套可追溯的时间坐标系。

站点采用“横向时间、纵向分类”的研究视图：历史页默认只显示 2026 当前前沿，可切换完整历史、检索、按置信度筛选或进入对比表。点击任一节点，右侧证据面板会展开完整字段、原始来源、计算方法、推导链、置信度和修订记录。

## 当前内容

- **历史**：LLM/VLM、T2I/图像编辑、T2V/视频编辑、Omni、生成训练方法、极致推理性能与推理技术论文。
- **趋势（1–2 年）**：稀疏化、训练规模与数据质量、低精度训练、内存层级、电力约束、单位智能成本。
- **未来（5–10 年）**：芯片与机架、异构推理、能源园区、长时程 Agent、人类平均智能、AI 科学家与治理外壳。
- **147 个时间节点**，其中包含 65 个可横向比较的训练技术节点；新增 5 条 DeepSpeed 专栏泳道，按官方教程 Git 首次提交或实质修改时间纳入 23 个方法。从 T2I/T2V/Omni 综述逐条核验的 34 个候选条目（30 个模型、4 个方法）仍保留原证据状态，任何未查到的项目都显式标为“未知”。
- **当前快照**：Hy4 preview（Apache-2.0 / 770B backbone + 10B MTP / 49B+0.7B active / 1M / Gated DSA+IndexCache+iHC）、ZeRO Checkpoint Dtype Export（DeepSpeed v0.19.6 / `zero_to_torch.py` / FP16-BF16 export / BF16 output 50.32% of FP32 in official E2E validation）、MiniMax-H3 H200 benchmark（开放权重 / 33B dense H3-Base / SGLang lossless 1.85–1.95× / fastest 6.24× @ SSIM 0.8498-0.9144 FL2VA）、GLM-5.3-Flash（MIT / 320B-A18B / sparse+linear attention / 1M / AA 57 官方引述）、Qwen3.8-Flash-Next（Qwen4 preview / 180B total / 6B active / GDN+QSA / 262K）、Gemini 3.5 Transcribe（Gemini API / streaming+non-streaming STT / FLEURS WER 5.50/5.04）、Vera Rubin NVL72 AgentX（DeepSeek V4-Pro / AgentX / up to 30x throughput/MW vs GB300 NVL72 / pending SemiAnalysis review）、Apple M5 Ultra Mac Studio（512GB unified memory / 1.2TB/s / Thunderbolt 5 RDMA cluster up to 3x inference）、MetaRoCE（AI-scale Ethernet RDMA / endpoint multipath / ~86% throughput @ 1% packet loss / OCP spec 2026-10 计划发布）、DeepSpeed AutoTP equivalence check（Qwen3-0.6B / AutoTP=3 uneven 6/6/4 / fp32 loss curves）、DeepSpeed Apple Silicon MPS ZeRO support（ZeRO 0-3 / Metal FusedAdam / gloo CPU staging / ZeRO-Offload via CPUAdam）、GLM-5.3（GLM-5.2 base / post-training / DeepSWE 66.9 / 1M）、dots3-note Preview（Apache-2.0 / 280B-A16B / 512K / text+image+video+audio→text）、Gemini 3.7 Flash（API / DeepSWE 65.3 / FrontierCode 43.6 / introductory $0.75/$3.75）、MiniMax Music 3.0（开放权重主张 / 8 层 RVQ / Hybrid-LM / Flow-VAE）、DeepSeek-V4-Pro 正式版（Terminal Bench 87.9 / DeepSWE 62.7 / Responses API）、DeepSeek-V4-Pro H20 serving（H20-141GB / 271 output tok/s / 1M context）、FastMetal-QAD（Apple Silicon / INT8 / 1.3B-14B / 720P edge inference）、QAD（LFM2.5 Q4_0 / 96.5–97.4% BF16 retention）、Qwen3.8-27B（Apache-2.0 / 27.8B dense / 262K / Gated DeltaNet+Attention）、Qwen3.8-2.4T-A95B（开放权重 / 2.446T MoE / A95B / 256K）、Grok 4.6（闭源 API / 长时运行 Agent / Cursor day-0）、LTX-2.5（开放权重 / 22B 音视频世界模型 / 10s 720p 6.8s API 口径）、Unified Radix Cache（SGLang / hybrid prefix cache / 无公开倍率）、NVIDIA Nemotron 3.5 Lightning（开放权重 / 30B-3B active / 1M / MTP+DFlash+DSpark）、Muse Glimmer 30B（Apache-2.0 / 29.6B / 131K / SGLang day-0）、NemotronLabs VoiceChat 11B（开放权重 / 全双工语音 / tool calling / 448 ms）、Claude zeta research model（内部模型 / zeta zeros ≥67.2% / Lean）、GPT-5.6-Cyber（Daybreak Red / cyber 专用模型 / 指标未披露）、DeepSpeed v0.19.5 `pin_memory` 修订、HPC-Ops × SGLang（H20/H200 MoE 推理算子 / Hy3 TPOT 15.1–48.8% 下降）、Categorical Flow Maps（1.7B / 2.1T tokens / 4-step language generation）、Ling-3.0-flash（开放权重 / 124B MoE / 35 KDA + 7 Gated MLA）、Qwen3.8-Max（2.4T MoE API / 指标未披露）、NVIDIA Alpamayo 2 Super（开放权重 / AV VLA）、SpecForge v0.3、OpenAI Astra、DeepSeek-V4-Flash-0731、Inkling-Small、MAI-Cyber-1-Flash、Claude Opus 5、Kimi K3、Qwen-Audio-3.0-TTS、Gemini 3.6 Flash、GLM‑5.2、MiniMax‑M3、Qwen3.6 与 Cosmos3‑Edge；旧模型作为架构和性能基线。
- **模型对比**：覆盖从 2022‑11 ChatGPT 到 2026‑08 的 120 个代表模型，并可按 T2I/T2V/Omni 筛选。除 LLM 指标外，还提供生成 Elo、单次生成时间、输出规格及逐项来源。

## 证据规则

1. 模型事实优先引用官方仓库、官方博客、论文或技术报告；Artificial Analysis 仅承担可比基准数据。
2. “直接证据”“由证据计算”“推导”“未知”四种状态明确区分，避免把推断伪装成事实。
3. 趋势和未来判断必须列出历史依据、推导方法、关键假设、可观测指标与失效条件。
4. 同一模型始终保留参数、权重、架构、硬件、数据、阶段、时间、算法、低精度和 Infra 等固定字段。
5. LLM 动态指标默认快照日期为 **2026-07-18**；Gemini 3.6 Flash 单条动态指标访问日期为 **2026-07-22**；本轮 T2I/T2V 调研访问日期为 **2026-07-19**，Cosmos3‑Edge 与 UltraEP 访问日期为 **2026-07-21**，ABot‑World‑0 与 Tunix 访问日期为 **2026-07-23**，Claude Opus 5 与 FLUX 3 访问日期为 **2026-07-25**，Kimi K3 权重与架构公开状态、AgentENV 训练基础设施访问日期为 **2026-07-28**，MAI-Cyber-1-Flash 访问日期为 **2026-07-29**，AngelSpec 与 DeepSpeed AutoTP `colwise_gather_output` 访问日期为 **2026-07-30**，GPT-5.6 Terra/Luna 官方价格与 Fast mode 访问日期为 **2026-07-31**，DeepSeek V4 Flash-0731、Inkling-Small、MiniMax H3 与 Seedance 2.5 访问日期为 **2026-08-01**，OpenAI Astra 与 DeepSpeed AutoTP ZeRO-3 checkpoint 修订访问日期为 **2026-08-03**，SenseNova-U1.5 Preview 与 DeepSpeedExamples AutoTP smoke 路径访问日期为 **2026-08-04**，Qwen3.8-Max、NVIDIA Alpamayo 2 Super 与 SpecForge v0.3 访问日期为 **2026-08-05**，Ling-3.0-flash 访问日期为 **2026-08-06**，DeepSpeed v0.19.4 发布修订访问日期为 **2026-08-07**，HPC-Ops × SGLang 与 Categorical Flow Maps 访问日期为 **2026-08-08**，OpenAI Astra 网络安全披露访问日期为 **2026-08-09**，Muse Glimmer、NemotronLabs VoiceChat 11B、Claude zeta research model、GPT-5.6-Cyber 与 DeepSpeed v0.19.5 `pin_memory` 修订访问日期为 **2026-08-11**，NVIDIA Nemotron 3.5 Lightning 访问日期为 **2026-08-12**，Qwen3.8-2.4T-A95B、Grok 4.6、LTX-2.5 与 Unified Radix Cache 访问日期为 **2026-08-13**，Gemini 3.7 Flash、MiniMax Music 3.0 与 DeepSeek-V4-Pro 正式版访问日期为 **2026-08-14**，GLM-5.3 与 dots3-note Preview 访问日期为 **2026-08-15**，Qwen3.8-27B 访问日期为 **2026-08-16**，DeepSeek-V4-Pro H20 serving、FastMetal-QAD 与 Liquid LFM2.5 QAD 访问日期为 **2026-08-20**，DeepSpeed Apple Silicon MPS ZeRO support 访问日期为 **2026-08-24**，MetaRoCE 与 DeepSpeed AutoTP equivalence check 访问日期为 **2026-08-25**，Vera Rubin NVL72 AgentX 与 Apple M5 Ultra Mac Studio 访问日期为 **2026-08-26**，GLM-5.3-Flash、Qwen3.8-Flash-Next、Gemini 3.5 Transcribe 与 DeepSpeed MPS ZeRO-Offload/FusedAdam 修订访问日期为 **2026-08-27**，MiniMax-H3 开放权重 / H200 benchmark 与 DeepSpeed v0.19.6 ZeRO checkpoint dtype export 访问日期为 **2026-08-28**，Hy4 preview 访问日期为 **2026-08-29**；基准会随榜单刷新而变化，引用时请同时记录日期。
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

仓库内置 [`ai-trend-daily-research`](./skills/ai-trend-daily-research/SKILL.md) skill：从 AI HOT 公共只读接口发现 SOTA 模型、训练 / 推理技术和硬件突破候选，同时监控 DeepSpeed 官方教程、Release、Latest News 与重点示例变更；回到一手来源核验后，再按本仓库的固定字段与证据状态更新内容。没有达到证据门槛的日期不会创建空更新或重新发布站点。

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
