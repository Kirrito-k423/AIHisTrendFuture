export type ParameterInferenceOutput = "保守下界" | "有效知识容量" | "结构估计" | "精确结构量" | "训练先验";

export interface ParameterInferenceMethod {
  id: string;
  name: string;
  paper: string;
  sourceUrl: string;
  output: ParameterInferenceOutput;
  formula: string;
  observations: string;
  validation: string;
  useWhen: string;
  limitation: string;
}

export interface ParameterEstimate {
  kind: "lower-bound" | "effective-capacity";
  display: string;
  pointB?: number;
  approximateRangeB?: [number, number];
  methodId: string;
  evaluatedModel: string;
  observedAt: string;
  sourceUrl: string;
  calculation: string;
  confidence: string;
  caveat: string;
}

export const parameterInferenceMethods: ParameterInferenceMethod[] = [
  {
    id: "memorization-pca",
    name: "流行文本记忆指纹",
    paper: "Nikolic, 2026 · Inferring the Size of Large Language Models From Popular Text Memorization",
    sourceUrl: "https://arxiv.org/abs/2605.29223",
    output: "保守下界",
    formula: "θ̂(z) = 41.18 · exp(0.62z)；下界 = max(0.5θ̂, 显著击败的最大稠密基线)",
    observations: "37 篇流行文本 × 6 个前缀长度 × 5 个提示模板；比较下一 token 命中率，并用 PCA 折叠成记忆指数 z。",
    validation: "19 个开放稠密模型上的绝对拟合 R²=0.95；成对判断约 90% precision / recall；16 个 MoE 校准模型均满足下界。",
    useWhen: "只能调用文本 API，但能稳定取得确定性下一 token 输出；适合回答“至少多大”。",
    limitation: "不能恢复精确总参数或激活参数；文本污染、对齐策略和路由会改变记忆信号。闭源结果必须写成 ≥。",
  },
  {
    id: "ikp-capacity",
    name: "不可压缩知识探针（IKP）",
    paper: "Li, 2026 · Incompressible Knowledge Probes",
    sourceUrl: "https://arxiv.org/abs/2604.24827",
    output: "有效知识容量",
    formula: "accuracy ≈ a · log(N) + b；由 93 个开放模型反演 N，并报告预测区间",
    observations: "1,311 道通过去污染与可答性过滤的长尾事实题，覆盖 7 个稀有度层级；只需黑盒问答。",
    validation: "开放模型校准 R²=0.910；留一法中位误差 1.48×，72% 在 2× 内、86% 在 3× 内；90% 预测区间约为点估计的 ÷3 到 ×3。",
    useWhen: "需要比较闭源模型的知识容量数量级，且能运行大规模固定探针集。",
    limitation: "估的是 effective knowledge capacity，不等于物理晶体管式参数计数；拒答、工具调用、检索增强和领域偏置会造成偏差。",
  },
  {
    id: "nightvision",
    name: "NightVision 光谱 + TTFT",
    paper: "Ellis et al., 2026 · Black-Box Inference of LLM Architectural Properties with Restrictive API Access",
    sourceUrl: "https://arxiv.org/abs/2607.01313",
    output: "结构估计",
    formula: "rank(共同 token 的 logit 矩阵) → hidden size d；TTFT(prompt length) 斜率 + d → depth L → P",
    observations: "同一批输出 token 的少量 logit / logprob，以及多种提示长度下重复测量的首 token 时延。",
    validation: "hidden size 平均相对误差 23%，MoE 子集 9%；当 d 估对时，≥3B 模型的层数与总参数平均相对误差约 53%。",
    useWhen: "API 暴露 top-logprobs，且服务端时延能被多次测量；适合给结构近似与交叉验证。",
    limitation: "服务栈、批处理、量化、推理硬件与架构比例假设都会污染 TTFT；<3B 模型误差常超过 100%，不能伪装成精确值。",
  },
  {
    id: "projection-recovery",
    name: "输出投影层恢复",
    paper: "Carlini et al., 2024 · Stealing Part of a Production Language Model",
    sourceUrl: "https://arxiv.org/abs/2403.06634",
    output: "精确结构量",
    formula: "logit 差分矩阵的秩 = 输出投影的隐藏维度；进一步查询可重建投影矩阵",
    observations: "API 返回足够多 token 的精确 logit / logprob，并允许构造大量受控查询。",
    validation: "论文恢复了 OpenAI Ada、Babbage 与 gpt-3.5-turbo 的隐藏维度，并演示了部分投影层重建。",
    useWhen: "目标是确认 hidden dimension 或为 NightVision 提供更强的 d 输入。",
    limitation: "hidden dimension 不是总参数；没有层数、FFN、MoE 专家与共享权重信息时，不能单独推出 P。API 也可能限制精度。",
  },
  {
    id: "compute-optimal-prior",
    name: "训练计算量 / Scaling-law 先验",
    paper: "Hoffmann et al., 2022 · Training Compute-Optimal Large Language Models",
    sourceUrl: "https://arxiv.org/abs/2203.15556",
    output: "训练先验",
    formula: "Nopt ∝ C^0.49~0.50，Dopt ∝ C^0.50~0.51；稠密近似 C ≈ 6ND",
    observations: "可信的训练 FLOPs、芯片数量 × 利用率 × 时间，或训练 token 数 D；必须明确稠密 / MoE 口径。",
    validation: "Chinchilla 在多组模型规模、token 与计算预算上拟合 compute-optimal 前沿。",
    useWhen: "供应商披露了训练集群、时长或 token，可作为参数数量级的一致性检查和先验。",
    limitation: "它回答“若按 compute-optimal 训练应有多大”，不是识别实际架构；过训练、蒸馏、多阶段训练和 MoE 会破坏简单反演。",
  },
];

export const parameterEstimateByModelId: Partial<Record<string, ParameterEstimate>> = {
  "chatgpt-gpt35": {
    kind: "lower-bound",
    display: "≥9B",
    pointB: 9,
    methodId: "memorization-pca",
    evaluatedModel: "openai/gpt-3.5-turbo API alias",
    observedAt: "2026-06-05 · arXiv v3",
    sourceUrl: "https://arxiv.org/abs/2605.29223",
    calculation: "论文先由 444 维记忆表现构造 PCA 指数 z，再取 0.5×指数拟合值与成对检验显著击败的最大稠密基线二者之大，得到 ≥9B。",
    confidence: "经开放模型与 MoE 校准的保守下界；不是点估计。",
    caveat: "论文测量的是当时的 gpt-3.5-turbo API alias，不保证等同于 2022 年最初 ChatGPT 权重快照。",
  },
  "gpt-4o-2024-11": {
    kind: "lower-bound",
    display: "≥111B",
    pointB: 111,
    methodId: "memorization-pca",
    evaluatedModel: "openai/gpt-4o API alias",
    observedAt: "2026-06-05 · arXiv v3",
    sourceUrl: "https://arxiv.org/abs/2605.29223",
    calculation: "同一记忆指纹 + 指数校准 + 稠密基线成对置换检验流程给出 ≥111B。",
    confidence: "经开放模型与 MoE 校准的保守下界；不是总参数点估计。",
    caveat: "论文测量的是 gpt-4o alias；服务端可能滚动换权重，不能证明它与 Nov ’24 固定快照完全相同。",
  },
  "gemini-25-pro": {
    kind: "effective-capacity",
    display: "≈3.0T（约 1.0–9.0T）",
    pointB: 3000,
    approximateRangeB: [1000, 9000],
    methodId: "ikp-capacity",
    evaluatedModel: "Gemini 2.5 Pro",
    observedAt: "2026-07-05 · arXiv v2",
    sourceUrl: "https://arxiv.org/abs/2604.24827",
    calculation: "将 1,311 道长尾知识探针准确率代入开放模型的 log-linear 校准曲线，点估计约 3.0T；按论文约 3× 的 90% prediction interval 展开为约 1.0–9.0T。",
    confidence: "留一法中位误差 1.48×；这里只报告数量级与约 90% 预测区间。",
    caveat: "这是有效知识容量，不是官方物理总参数；安全拒答、检索或后训练可能使其偏离真实参数。",
  },
  "claude-fable-5": {
    kind: "effective-capacity",
    display: "≈3.5T（约 1.2–10.5T）",
    pointB: 3500,
    approximateRangeB: [1167, 10500],
    methodId: "ikp-capacity",
    evaluatedModel: "Claude Fable 5",
    observedAt: "2026-07-05 · arXiv v2",
    sourceUrl: "https://arxiv.org/abs/2604.24827",
    calculation: "长尾知识探针准确率经 93 个开放模型的 log-linear 曲线反演为约 3.5T；区间按论文约 ÷3 到 ×3 的 90% 预测带近似展开。",
    confidence: "数量级估计；不是可直接用于容量规划的精确参数值。",
    caveat: "估计的是 effective knowledge capacity；Adaptive / Max 推理设置与物理架构之间没有一一对应关系。",
  },
};

export function getParameterInferenceMethod(id: string) {
  return parameterInferenceMethods.find((method) => method.id === id);
}
