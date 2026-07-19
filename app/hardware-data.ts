import type { Fact, FactStatus, Source, TimelineEvent, TimelineLane } from "./types";

const ACCESSED_AT = "2026-07-19";

export type HardwareVendorGroup = "NVIDIA" | "Huawei Ascend" | "其他厂商";

export interface HardwareMetric {
  value: string;
  status: FactStatus;
  sourceIds: string[];
  note?: string;
}

export interface HardwareDevice {
  id: string;
  date: string;
  name: string;
  vendor: string;
  group: HardwareVendorGroup;
  form: string;
  positioning: string;
  fp32: HardwareMetric;
  fp16: HardwareMetric;
  fp8: HardwareMetric;
  fp4: HardwareMetric;
  int4: HardwareMetric;
  memory: HardwareMetric;
  memoryBandwidth: HardwareMetric;
  interconnect: HardwareMetric;
  power: HardwareMetric;
  unitPrice: HardwareMetric;
  clusterScale: HardwareMetric;
  sources: Source[];
}

function source(id: string, title: string, publisher: string, url: string, type: Source["type"] = "技术报告"): Source {
  return { id, title, publisher, url, type, accessedAt: ACCESSED_AT };
}

function disclosed(value: string, sourceIds: string[], note?: string): HardwareMetric {
  return { value, status: "已披露", sourceIds, note };
}

function derived(value: string, sourceIds: string[], note: string): HardwareMetric {
  return { value, status: "推导", sourceIds, note };
}

function unknown(note = "厂商公开资料未披露可核验值"): HardwareMetric {
  return { value: "未公开", status: "未知", sourceIds: [], note };
}

const a100 = source("a100-datasheet", "NVIDIA A100 Tensor Core GPU Datasheet", "NVIDIA", "https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-nvidia-us-2188504-web.pdf");
const h100 = source("h100-product", "NVIDIA H100 Tensor Core GPU", "NVIDIA", "https://www.nvidia.com/en-us/data-center/h100/", "官方博客");
const h800 = source("h800-oem", "ThinkSystem NVIDIA H800 PCIe Gen5 GPU", "Lenovo Press", "https://lenovopress.lenovo.com/lp1814-thinksystem-nvidia-h800-pcie-gen5-gpu");
const h20 = source("h20-vgpu", "NVIDIA Virtual GPU Software Documentation — Supported GPUs", "NVIDIA", "https://docs.nvidia.com/vgpu/gpus-supported-by-vgpu.html");
const hgx = source("hgx-platform", "NVIDIA HGX Platform", "NVIDIA", "https://www.nvidia.com/en-us/data-center/hgx/", "官方博客");
const dgxB200 = source("dgx-b200", "NVIDIA DGX B200", "NVIDIA", "https://www.nvidia.com/en-us/data-center/dgx-b200/", "官方博客");
const gb200 = source("gb200-nvl72", "NVIDIA GB200 NVL72", "NVIDIA", "https://www.nvidia.com/en-us/data-center/gb200-nvl72/", "官方博客");

const ascendRoadmap = source("ascend-roadmap", "徐直军主题演讲：昇腾芯片演进与超节点路线", "Huawei", "https://www.huawei.com/cn/news/2025/9/hc-xu-keynote-speech", "官方博客");
const atlas950 = source("atlas-950-waic", "华为在 WAIC 2026 展示 Atlas 950 SuperPoD", "Huawei", "https://www.huawei.com/cn/news/2026/7/atlas-950-superpod", "官方博客");

const tpu7x = source("tpu7x-doc", "TPU7x (Ironwood) architecture and configurations", "Google Cloud", "https://docs.cloud.google.com/tpu/docs/tpu7x");
const tpuCluster = source("tpu-cluster", "Cluster reliability for trillion-parameter models on TPUs", "Google Cloud", "https://cloud.google.com/blog/products/compute/cluster-reliability-for-trillion-parameter-models-on-tpus", "官方博客");
const mlu370 = source("mlu370-x8", "思元 370 MLU370-X8 智能加速卡", "寒武纪", "https://cambricon.com/index.php?a=lists&c=index&catid=406&m=content", "官方博客");
const cs3 = source("cerebras-cs3", "Cerebras CS-3 / Wafer-Scale Engine 3", "Cerebras", "https://www.cerebras.ai/system", "官方博客");
const cs3Launch = source("cerebras-cs3-launch", "Cerebras Announces Third Generation Wafer Scale Engine", "Cerebras", "https://www.cerebras.ai/blog/cerebras-cs3", "官方博客");
const mi300x = source("mi300x-product", "AMD Instinct MI300X Accelerator", "AMD", "https://www.amd.com/en/products/accelerators/instinct/mi300.html", "官方博客");

export const hardwareDevices: HardwareDevice[] = [
  {
    id: "hw-nvidia-a100-80gb", date: "2020-05-14", name: "NVIDIA A100 80GB SXM", vendor: "NVIDIA", group: "NVIDIA", form: "单卡 / SXM",
    positioning: "Ampere 训练基线，提供第三代 Tensor Core、HBM2e 与 600 GB/s NVLink。",
    fp32: disclosed("19.5 TFLOPS", [a100.id]), fp16: disclosed("312 TFLOPS（Tensor；稀疏 624）", [a100.id]), fp8: unknown("A100 不支持原生 FP8 Tensor Core"), fp4: unknown("A100 不支持原生 FP4 Tensor Core"), int4: disclosed("1,248 TOPS（稀疏）", [a100.id]),
    memory: disclosed("80 GB HBM2e", [a100.id]), memoryBandwidth: disclosed("2,039 GB/s", [a100.id]), interconnect: disclosed("NVLink 600 GB/s", [a100.id]), power: disclosed("400 W（SXM）", [a100.id]), unitPrice: unknown("NVIDIA 未公开统一单卡成交价；OEM / 区域 / 合同差异大"), clusterScale: disclosed("DGX A100：8 GPU；DGX SuperPOD 可扩展", [a100.id]), sources: [a100],
  },
  {
    id: "hw-nvidia-h100-sxm", date: "2022-03-22", name: "NVIDIA H100 SXM", vendor: "NVIDIA", group: "NVIDIA", form: "单卡 / SXM",
    positioning: "Hopper 数据中心主力训练卡，引入 Transformer Engine 与 FP8。",
    fp32: disclosed("67 TFLOPS", [h100.id]), fp16: disclosed("989 TFLOPS（Tensor；稀疏 1,979）", [h100.id]), fp8: disclosed("1,979 TFLOPS（稀疏 3,958）", [h100.id]), fp4: unknown("H100 无原生 FP4 Tensor Core"), int4: unknown("官方产品页未给 INT4 峰值"),
    memory: disclosed("80 GB HBM3", [h100.id]), memoryBandwidth: disclosed("3.35 TB/s", [h100.id]), interconnect: disclosed("NVLink 900 GB/s", [h100.id]), power: disclosed("最高 700 W", [h100.id]), unitPrice: unknown("官方询价；未公开统一单卡价格"), clusterScale: disclosed("HGX H100：8 GPU；DGX SuperPOD 集群", [h100.id]), sources: [h100],
  },
  {
    id: "hw-nvidia-h800", date: "2023-03-21", name: "NVIDIA H800 PCIe", vendor: "NVIDIA", group: "NVIDIA", form: "单卡 / PCIe",
    positioning: "面向特定出口限制市场的 Hopper 变体；采用 OEM 官方页面保留其具体 SKU 口径。",
    fp32: disclosed("51 TFLOPS", [h800.id]), fp16: disclosed("756 TFLOPS（稀疏 1,513）", [h800.id]), fp8: disclosed("1,513 TFLOPS（稀疏 3,026）", [h800.id]), fp4: unknown(), int4: unknown(),
    memory: disclosed("80 GB / 94 GB HBM", [h800.id]), memoryBandwidth: disclosed("2.0 / 3.9 TB/s（随 SKU）", [h800.id]), interconnect: disclosed("NVLink 400 GB/s", [h800.id]), power: disclosed("350 / 400 W（随 SKU）", [h800.id]), unitPrice: unknown("未公开统一成交价"), clusterScale: disclosed("OEM 服务器配置；规模取决于系统集成", [h800.id]), sources: [h800],
  },
  {
    id: "hw-nvidia-h20", date: "2024-01-01", name: "NVIDIA H20", vendor: "NVIDIA", group: "NVIDIA", form: "单卡 / 数据中心",
    positioning: "Hopper 市场特供型号；官方可核验资料确认产品支持，但没有完整公开规格表。",
    fp32: unknown(), fp16: unknown(), fp8: unknown(), fp4: unknown(), int4: unknown(), memory: unknown(), memoryBandwidth: unknown(), interconnect: unknown(), power: unknown(), unitPrice: unknown("官方询价"), clusterScale: disclosed("NVIDIA vGPU 支持列表确认 H20 产品", [h20.id]), sources: [h20],
  },
  {
    id: "hw-nvidia-b200", date: "2024-03-18", name: "NVIDIA B200", vendor: "NVIDIA", group: "NVIDIA", form: "单 GPU / HGX B200 组件",
    positioning: "Blackwell 训练与推理 GPU；单卡值按官方 HGX B200 八卡总量拆分时明确标记为推导。",
    fp32: derived("75 TFLOPS", [hgx.id], "HGX B200 官方 8 GPU 合计 600 TFLOPS ÷ 8"), fp16: derived("4.5 PFLOPS", [hgx.id], "HGX B200 官方 8 GPU 合计 36 PFLOPS ÷ 8；需结合页面稀疏脚注"), fp8: derived("9 PFLOPS", [hgx.id], "HGX B200 官方 8 GPU 合计 72 PFLOPS ÷ 8；需结合页面稀疏脚注"), fp4: derived("18 PFLOPS", [hgx.id], "HGX B200 官方 8 GPU 合计 144 PFLOPS ÷ 8；需结合页面稀疏脚注"), int4: unknown(),
    memory: derived("180 GB HBM3e", [dgxB200.id], "DGX B200 8 GPU 总显存 1,440 GB ÷ 8"), memoryBandwidth: derived("8 TB/s", [dgxB200.id], "DGX B200 8 GPU 总带宽 64 TB/s ÷ 8"), interconnect: disclosed("NVLink 1.8 TB/s / GPU", [hgx.id]), power: unknown("公开页披露整机 DGX B200 14.3 kW，未在该页拆分单 GPU TDP"), unitPrice: unknown("官方询价"), clusterScale: disclosed("DGX B200：8 GPU / 1,440 GB / 14.3 kW", [dgxB200.id]), sources: [hgx, dgxB200],
  },
  {
    id: "hw-nvidia-gb200-nvl72", date: "2024-03-18", name: "GB200 NVL72", vendor: "NVIDIA", group: "NVIDIA", form: "机架级系统 / 72 GPU",
    positioning: "把 72 颗 Blackwell GPU 作为机架级 NVLink 域，面向超大模型训练与推理。",
    fp32: disclosed("5.76 PFLOPS（整机）", [gb200.id]), fp16: disclosed("360 PFLOPS（整机）", [gb200.id]), fp8: disclosed("720 PFLOPS（整机）", [gb200.id]), fp4: disclosed("1.44 EFLOPS NVFP4（整机）", [gb200.id]), int4: unknown(),
    memory: disclosed("13.4 TB HBM3e", [gb200.id]), memoryBandwidth: disclosed("576 TB/s（整机）", [gb200.id]), interconnect: disclosed("NVLink 130 TB/s（整机）", [gb200.id]), power: unknown("官方产品页未给统一机架功耗"), unitPrice: unknown("系统级官方询价"), clusterScale: disclosed("72 GPU / 36 Grace CPU；多机架扩展", [gb200.id]), sources: [gb200],
  },
  {
    id: "hw-ascend-910b", date: "2023-01-01", name: "Ascend 910B", vendor: "Huawei", group: "Huawei Ascend", form: "单 NPU",
    positioning: "国产 AI 训练基础型号；华为公开路线材料未给完整单芯片精度与存储规格。",
    fp32: unknown(), fp16: unknown(), fp8: unknown(), fp4: unknown(), int4: unknown(), memory: unknown(), memoryBandwidth: unknown(), interconnect: unknown(), power: unknown(), unitPrice: unknown("商务询价"), clusterScale: disclosed("华为路线演讲确认 910B 产品代际", [ascendRoadmap.id]), sources: [ascendRoadmap],
  },
  {
    id: "hw-ascend-910c", date: "2025-03-01", name: "Ascend 910C", vendor: "Huawei", group: "Huawei Ascend", form: "单 NPU / A3 组件",
    positioning: "Atlas 900 A3 超节点核心 NPU；公开材料更侧重 384 卡系统而非单卡完整参数表。",
    fp32: unknown(), fp16: unknown(), fp8: unknown(), fp4: unknown(), int4: unknown(), memory: unknown(), memoryBandwidth: unknown(), interconnect: unknown(), power: unknown(), unitPrice: unknown("商务询价"), clusterScale: disclosed("Atlas 900 A3：384 颗 910C", [ascendRoadmap.id]), sources: [ascendRoadmap],
  },
  {
    id: "hw-atlas-a3-384", date: "2025-03-01", name: "Atlas 900 A3 SuperPoD 384", vendor: "Huawei", group: "Huawei Ascend", form: "超节点 / 384 NPU",
    positioning: "以 384 颗 Ascend 910C 构成统一超节点，强调大带宽低时延互联与统一内存。",
    fp32: unknown(), fp16: unknown(), fp8: disclosed("最高 300 PFLOPS（系统）", [ascendRoadmap.id]), fp4: unknown(), int4: unknown(), memory: disclosed("48 TB 统一内存", [ascendRoadmap.id]), memoryBandwidth: unknown(), interconnect: disclosed("超节点互联；小包通信效率相对传统集群提升约 3×", [ascendRoadmap.id]), power: unknown(), unitPrice: unknown("系统级商务询价"), clusterScale: disclosed("384 × Ascend 910C；CloudMatrix384 云实例", [ascendRoadmap.id]), sources: [ascendRoadmap],
  },
  {
    id: "hw-ascend-950dt", date: "2026-10-01", name: "Ascend 950DT", vendor: "Huawei", group: "Huawei Ascend", form: "单 NPU / 规划发布",
    positioning: "面向 FP8 / MXFP8 / MXFP4 / HiF8 的新一代训练芯片；官方计划 2026 Q4 发布。",
    fp32: unknown(), fp16: unknown(), fp8: disclosed("1 PFLOPS", [ascendRoadmap.id]), fp4: disclosed("2 PFLOPS", [ascendRoadmap.id]), int4: unknown(), memory: disclosed("144 GB HBM", [ascendRoadmap.id]), memoryBandwidth: disclosed("4 TB/s", [ascendRoadmap.id]), interconnect: disclosed("2 TB/s / 芯片", [ascendRoadmap.id]), power: unknown(), unitPrice: unknown("尚未发布统一价格"), clusterScale: disclosed("用于 Atlas 950 SuperPoD；计划 2026 Q4", [ascendRoadmap.id]), sources: [ascendRoadmap],
  },
  {
    id: "hw-atlas-950-1024-demo", date: "2026-07-17", name: "Atlas 950 · 1024 卡实机", vendor: "Huawei", group: "Huawei Ascend", form: "WAIC 实机集群 / 1024 NPU",
    positioning: "WAIC 2026 的 1024 卡物理展示；这是卡数而非 1,000 个计算节点。",
    fp32: unknown(), fp16: unknown(), fp8: disclosed("1 EFLOPS（系统）", [atlas950.id]), fp4: disclosed("2 EFLOPS（系统）", [atlas950.id]), int4: unknown(), memory: disclosed("256 TB 统一内存", [atlas950.id]), memoryBandwidth: unknown(), interconnect: disclosed("TB 级 NPU 互联；约 3 μs RTT", [atlas950.id]), power: unknown(), unitPrice: unknown("展示系统未公开价格"), clusterScale: disclosed("1024 卡物理集群；WAIC 2026 展示", [atlas950.id]), sources: [atlas950],
  },
  {
    id: "hw-atlas-950-8192", date: "2026-12-01", name: "Atlas 950 SuperPoD 8192", vendor: "Huawei", group: "Huawei Ascend", form: "超节点 / 最大配置",
    positioning: "官方最大 8192 卡配置，不与 WAIC 1024 卡实机展示混为一谈。",
    fp32: unknown(), fp16: unknown(), fp8: disclosed("8 EFLOPS（系统）", [atlas950.id]), fp4: disclosed("16 EFLOPS（系统）", [atlas950.id]), int4: unknown(), memory: disclosed("1,152 TB 统一内存", [atlas950.id]), memoryBandwidth: unknown(), interconnect: disclosed("约 16 PB/s（系统）", [atlas950.id]), power: unknown(), unitPrice: unknown("系统级商务询价"), clusterScale: disclosed("8192 卡；160 机柜；约 1,000 m²", [atlas950.id]), sources: [atlas950],
  },
  {
    id: "hw-google-tpu7x", date: "2025-04-09", name: "Google TPU7x / Ironwood", vendor: "Google", group: "其他厂商", form: "单芯片 / Pod",
    positioning: "当前 Google 官方可核验的最新 TPU 代际；官方资料未发布 TPU v8。",
    fp32: unknown("官方 TPU7x 表未给 FP32 峰值"), fp16: disclosed("2,307 TFLOPS BF16", [tpu7x.id]), fp8: disclosed("4,614 TFLOPS", [tpu7x.id]), fp4: unknown(), int4: unknown(), memory: disclosed("192 GiB HBM", [tpu7x.id]), memoryBandwidth: disclosed("7,380 GB/s", [tpu7x.id]), interconnect: disclosed("ICI 1,200 GB/s", [tpu7x.id]), power: unknown(), unitPrice: unknown("Google Cloud 按服务定价，未公开芯片采购单价"), clusterScale: disclosed("最高 9,216 芯片 Pod", [tpu7x.id, tpuCluster.id]), sources: [tpu7x, tpuCluster],
  },
  {
    id: "hw-cambricon-mlu370-x8", date: "2021-11-01", name: "寒武纪 MLU370-X8", vendor: "寒武纪", group: "其他厂商", form: "单加速卡",
    positioning: "官方规格最完整、可核验的寒武纪训练 / 推理卡之一；不以未披露的更新型号参数替代。",
    fp32: disclosed("24 TFLOPS", [mlu370.id]), fp16: disclosed("96 TFLOPS（含 BF16）", [mlu370.id]), fp8: unknown(), fp4: unknown(), int4: disclosed("支持 INT4（峰值未单列）", [mlu370.id]), memory: disclosed("48 GB LPDDR5", [mlu370.id]), memoryBandwidth: disclosed("614.4 GB/s", [mlu370.id]), interconnect: disclosed("MLU-Link 200 GB/s 双向", [mlu370.id]), power: disclosed("250 W", [mlu370.id]), unitPrice: unknown("商务询价"), clusterScale: disclosed("支持多卡 MLU-Link；规模依系统方案", [mlu370.id]), sources: [mlu370],
  },
  {
    id: "hw-cerebras-cs3", date: "2024-03-13", name: "Cerebras CS-3 / WSE-3", vendor: "Cerebras", group: "其他厂商", form: "晶圆级系统",
    positioning: "以单片晶圆级引擎、大容量片上 SRAM 和超高片上带宽减少传统多 GPU 切分。",
    fp32: unknown(), fp16: disclosed("125 PFLOPS（系统）", [cs3.id, cs3Launch.id]), fp8: unknown(), fp4: unknown(), int4: unknown(), memory: disclosed("44 GB 片上 SRAM", [cs3.id]), memoryBandwidth: disclosed("21 PB/s", [cs3.id]), interconnect: disclosed("214 Pb/s 片上互联", [cs3.id]), power: disclosed("约 23 kW（发布口径）", [cs3Launch.id]), unitPrice: unknown("系统级商务询价"), clusterScale: disclosed("最高 2,048 台 CS-3", [cs3.id]), sources: [cs3, cs3Launch],
  },
  {
    id: "hw-amd-mi300x", date: "2023-12-06", name: "AMD Instinct MI300X", vendor: "AMD", group: "其他厂商", form: "单 OAM 加速器",
    positioning: "以 192 GB HBM3 和高带宽面向超大模型训练与推理，是 NVIDIA 之外的主流 GPU 路线。",
    fp32: disclosed("163.4 TFLOPS", [mi300x.id]), fp16: disclosed("1,307.4 TFLOPS（稀疏 2,614.9）", [mi300x.id]), fp8: disclosed("2,614.9 TFLOPS（稀疏 5,229.8）", [mi300x.id]), fp4: unknown(), int4: unknown(), memory: disclosed("192 GB HBM3", [mi300x.id]), memoryBandwidth: disclosed("5.3 TB/s", [mi300x.id]), interconnect: disclosed("Infinity Fabric 1,024 GB/s（OAM）", [mi300x.id]), power: disclosed("750 W", [mi300x.id]), unitPrice: unknown("AMD / OEM 官方询价"), clusterScale: disclosed("MI300X Platform：8 GPU", [mi300x.id]), sources: [mi300x],
  },
];

const metricFields: Array<[string, keyof Pick<HardwareDevice, "fp32" | "fp16" | "fp8" | "fp4" | "int4" | "memory" | "memoryBandwidth" | "interconnect" | "power" | "unitPrice" | "clusterScale">]> = [
  ["FP32", "fp32"], ["FP16 / BF16", "fp16"], ["FP8", "fp8"], ["FP4", "fp4"], ["INT4", "int4"], ["显存 / 内存", "memory"], ["显存带宽", "memoryBandwidth"], ["互联带宽", "interconnect"], ["功耗", "power"], ["单价", "unitPrice"], ["集群 / 超节点", "clusterScale"],
];

function toTimelineEvent(device: HardwareDevice): TimelineEvent {
  const facts: Fact[] = metricFields.map(([label, key]) => {
    const metric = device[key];
    return { label, value: metric.value, status: metric.status, sourceIds: metric.sourceIds, method: metric.note };
  });
  return {
    id: device.id,
    date: device.date,
    title: device.name,
    organization: device.vendor,
    eyebrow: `${device.group} / ${device.form}`,
    summary: device.positioning,
    confidence: device.sources.length ? "高" : "中",
    score: device.fp8.status !== "未知" ? device.fp8.value : device.fp16.value,
    tags: ["硬件", device.vendor, device.group, device.form],
    facts,
    sources: device.sources,
    eventKind: "hardware",
    tier: device.date >= "2026-01-01" ? "frontier" : "baseline",
    star: {
      situation: device.positioning,
      target: `在 ${device.form} 形态下提升训练 / 推理计算、内存容量或互联扩展能力。`,
      action: `按官方 ${device.sources.length} 条来源核验精度吞吐、内存、带宽、互联、功耗、价格与集群规模；未公开字段保留未知。`,
      result: `${device.fp8.status !== "未知" ? `FP8 ${device.fp8.value}` : `FP16/BF16 ${device.fp16.value}`}；${device.memory.value}；${device.clusterScale.value}。`,
    },
  };
}

const groupMeta: Record<HardwareVendorGroup, { id: string; group: string; title: string; description: string; color: TimelineLane["color"] }> = {
  NVIDIA: { id: "hardware-nvidia", group: "训练硬件 / 01", title: "NVIDIA GPU / 集群", description: "A100、H100/H800/H20、B200 与 NVL72", color: "green" },
  "Huawei Ascend": { id: "hardware-ascend", group: "训练硬件 / 02", title: "Huawei Ascend / 超节点", description: "910B/910C、A3 384、950DT 与 Atlas 950", color: "amber" },
  其他厂商: { id: "hardware-other", group: "训练硬件 / 03", title: "其他厂商 / 系统", description: "TPU7x、寒武纪、Cerebras 与 AMD", color: "violet" },
};

export const hardwareLanes: TimelineLane[] = (Object.keys(groupMeta) as HardwareVendorGroup[]).map((group) => ({
  ...groupMeta[group],
  events: hardwareDevices.filter((device) => device.group === group).map(toTimelineEvent),
}));
