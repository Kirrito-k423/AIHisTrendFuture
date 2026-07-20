# AIHisTrendFuture 数据契约

## 证据优先级

1. 官方仓库、模型卡、官方发布页、论文或技术报告、厂商规格页。
2. 原始基准或可追踪的第三方测量，用于动态可比指标。
3. AI HOT、媒体和搜索结果仅用于发现与导航。

始终区分直接披露、由证据计算、推导和未知。动态指标必须带版本、观察日期、上下文和服务商口径。

## 事件到文件的映射

| 事件类型 | 主数据入口 | 必须检查的派生面 |
|---|---|---|
| LLM / VLM / Omni 模型 | `app/data.ts` 的 `modelEvent` | `app/model-catalog.ts`、`app/comparison-data.ts`、历史与指标页、README、测试 |
| T2I / T2V 模型或生成方法 | `research/model-briefs/<slug>.json` | 运行 `npm run research:bundle` 生成 `app/generative-research.json`，再检查目录、历史、比较和测试 |
| 训练或推理技术 | `app/training-tech-data.ts` | STAR、`TechnologyComparison`、贡献者、`modelLinksByTechnology`、历史比较和测试 |
| 极致推理系统纪录或推理论文 | `app/data.ts` 对应 inference lane | 分类、比较关系、来源、历史筛选和测试 |
| GPU / NPU / TPU / 机架 / 集群 | `app/hardware-data.ts` | `hardwareDevices`、硬件比较、历史分类、README 和测试 |
| 趋势或未来判断修订 | `app/data.ts` 的 trends / future 事件 | `basisIds`、推导方法、关键假设、可观测指标、失效条件和修订记录 |

不要同时创建两个互相竞争的主记录。派生 JSON 必须由生成脚本产生。

## 固定字段规则

- 模型记录保留参数、激活参数、权重大小、精度、架构、注意力、MoE、硬件、硬件规模、数据、阶段、时间、算法、低精度、Infra 和动态基准字段。
- 训练技术记录保留机制、适用场景、实验、结果、计算/内存、并行、限制、可用性、STAR、主要贡献者和模型关系。
- 硬件记录保留 FP32、FP16/BF16、FP8、FP4、INT4、内存、内存带宽、互联、功耗、价格和集群规模。厂商未披露统一价格时写未知。
- `sourceIds` 必须能在事件的 `sources` 中解析。计算值使用 `status: "推导"` 并给出公式或拆分方法。
- 事件日期使用 `YYYY-MM-DD`。同一产品的发布、权重、API、论文与量产日期不同就分别说明，不挑对叙事最有利的日期。
- `tier: "frontier"` 只用于当前前沿或重点观察；旧基线和仅供谱系参考的项目使用 `baseline`。
- 绝对“首次”“最强”“SOTA”必须限定范围，并列出可比较基线和失效条件。

## 一致性检查

- 更新源码内访问日期只覆盖本轮真正重新访问的来源，不批量伪造刷新。
- 更新 README 的节点数、模型数、快照日期和“当前快照”时，以代码实际统计为准。
- 测试中存在明确的节点计数和关键名称断言。新增记录时同步更新断言；不要为了通过测试删除字段或绕过计数。
- 新来源 URL 应稳定、直接并尽量无追踪参数。论文优先 DOI、arXiv abstract 或官方 proceedings 页面。
- `unknown` 是有效研究结果；空串、猜测和无来源的常识补全不是。
