# GitHub 与 Sites 发布闭环

## 发布前置条件

- 工作树只包含本轮预期改动。
- `npm run lint` 和 `npm test` 成功；若模型 brief 变化，bundle 已重新生成。
- 每个新增事件至少有一条可访问的一手来源。
- 没有凭据、原始抓取全文、临时文件或未授权的第三方内容进入提交。

## GitHub

1. 拉取远端并确认本轮基于最新 `main`。存在远端推进时先重放改动并重新验证。
2. 提交精确的已验证源文件，提交信息为 `content: update AI frontier events for YYYY-MM-DD`。
3. 正常推送到 `Kirrito-k423/AIHisTrendFuture`，禁止强推。
4. 记录已推送的分支头 SHA。推送失败时停止后续线上发布，不能只部署未进入 GitHub 的状态。

## 在线 Sites

仓库含 `.openai/hosting.json`，必须遵循 `sites-building` 和 `sites-hosting`：

1. 复用成功的 `npm run build` 产物；源码改变后必须重建。
2. 复用 `.openai/hosting.json` 中既有 `project_id`，不要创建重复站点。
3. 把与 GitHub 相同的已验证源状态推送到 Sites 绑定的源仓库；版本的 `commit_sha` 必须等于该精确状态。
4. 用 Sites 打包脚本封装 `dist/`、hosting metadata 和迁移，再保存一个版本。
5. 优先私有部署。若站点是共享或公开访问，在真正部署前取得用户明确批准。
6. 轮询到 `succeeded` 后才报告线上成功，并返回部署结果中的精确 URL。

如果当天没有过线事件，就不创建空提交、不保存空版本、不重新部署。
