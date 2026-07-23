# DeepSpeed 官方源监控合同

## 监控目的

把 DeepSpeed 教程、Release、README Latest News 和相关 Examples 变更作为每日候选源。监控只负责发现变化，技术结论仍需回到官方文档、源码、PR 和论文核验。

## 固定入口

- 主仓库：`https://github.com/deepspeedai/DeepSpeed`
- 教程目录：`docs/_tutorials`
- 官方动态：`README.md` 的 Latest News
- Release：`https://github.com/deepspeedai/DeepSpeed/releases`
- 示例仓库：`https://github.com/deepspeedai/DeepSpeedExamples`
- API：匿名只读 `GET https://api.github.com/repos/deepspeedai/*`

不要使用 `www.deepspeed.ai` 页面底部的 `Updated` 作为文章修改日期。该字段会随整站构建一起变化；首次出现和实质修改应以 Git 历史为准。官网 Atom Feed 只覆盖传统 Blog，也不能替代教程目录监控。

## 每日运行

```bash
node scripts/fetch-deepspeed-updates.mjs \
  --since-hours 36 \
  --output /tmp/deepspeed-updates.json
```

本机需要代理时追加：

```bash
--proxy http://127.0.0.1:7890
```

默认 36 小时窗口与每日任务重叠，减少跨时区和短时失败造成的漏检。结果按 commit SHA 去重，不把重复窗口内的同一提交当作两个事件。

## 信号分级

| 信号 | 处理 |
|---|---|
| 新增 `docs/_tutorials/*.md`、新 Release | 立即进入深研和提醒 |
| API、配置、支持模型、并行/通信/显存、性能数字、限制条件改变 | 进入证据评审；达到总分 7 且证据强度至少 2 才入库 |
| 受关注主题在 DeepSpeedExamples 出现匹配提交 | 检查代码路径、配置和适用边界后再决定是否入库 |
| 拼写、链接、导航、组织名、纯格式变化 | 不单独提醒，只进入周摘要 |
| 无变化 | 静默，不创建记录、不提交、不部署 |

脚本分类只是路由提示，不是事实判断。commit message、patch 和 README 文本仍需按不可信候选处理；性能倍数必须回到论文或可复核实验条件。

## 重点主题

默认跟踪：

- 内存与并行：ZeRO-Offload、ZeRO++、MixZ++、AutoTP。
- 通信优化：1-bit Adam、1-bit LAMB、0/1 Adam、Domino。
- 存储与异步：DeepNVMe、Ulysses-Offload、ZenFlow、DataStates。
- 稀疏与压缩：DeepSpeed-MoE、MoE Inference、Model Compression、MoQ。
- 可观测与调优：FLOPs Profiler、PyTorch Profiler、Communication Logging、Autotuning、Monitor。

新增同类技术时不要被关键词表阻断：教程目录、Release 和 Latest News 的新内容仍应进入评审。

## 入库边界

- 新教程不自动等于技术突破。若只是已有功能的使用说明，可以记录为“官方可用性更新”，但不强行新增训练技术节点。
- 既有教程的实质修改可以修订现有节点、限制或可用性，不为每次提交创建新时间点。
- Release 只有在机制、能力边界或可测性能发生变化时进入主数据；版本号和依赖修复留在周摘要。
- DeepSpeedExamples 的示例更新只证明某条官方路径可运行，不自动证明论文级收益可以复现。
