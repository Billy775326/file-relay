# 后台文件管理

登录后台后，点击内容栏的文件名打开详情弹窗。弹窗显示完整文件名、大小、类型、取件次数、创建时间、过期时间及最早清理时间，并提供下载按钮。文本分享不显示文件详情入口。

管理员下载不增加取件次数；过期或次数用完的文件，只要仍在存储中就能下载。文件被删除后无法恢复。公开取件仍按原有有效期和次数限制执行。

## 过期保留天数

列表上方的“过期后保留”默认是 **30 天**，允许设置 **0–3650 的整数**。0 表示过期后即可清理；保存设置本身不会删除文件。

- 清理依据是“过期时间 + 保留天数”，不是上传时间。新设置适用于已有过期记录和后续过期记录。
- 文件和文本分享使用同一保留规则。永久分享不会自动清理；仅取件次数用完不会触发清理。
- 保留期结束后，在下一次成功的清理任务中删除元数据和文件。文件详情的“最早清理”不是精确删除时间。
- 保留期间文件仍占用存储，管理员可手动删除。未完成的上传会话仍按 `SESSION_TTL_MS` 清理，不受此设置影响。
- 已启动的清理使用启动时读取的设置；KV 后端的设置传播可能短暂延迟。

Workers 的 Cron、Pages 首页触发和外部定时调用共用此规则。Pages 无访问时不会仅因时间到达而执行首页清理；低访问量站点请按 [部署指南](deployment.md#清理配置) 设置外部定时器。

## 升级与存储

无需配置新的环境变量。KV 使用独立系统键保存天数，不修改现有分享结构。D1 使用 `app_settings` 表；旧数据库在首次保存设置时自动创建这张表，不覆盖分享和访客备注。没有保存过设置的旧数据库使用 30 天默认值。

设置读取失败或存储值损坏时，清理会停止，避免将错误配置当作 0 天删除文件。修复后等待下一次清理或使用已有管理员清理接口。

## 管理接口

以下接口都要求有效管理员 Cookie，返回 `Cache-Control: no-store`。

| 接口 | 输入与响应 |
|---|---|
| `GET /api/admin/settings` | 返回 `{ "expiredRetentionDays": 30 }` |
| `PUT /api/admin/settings` | JSON `{ "expiredRetentionDays": 30 }`，返回保存后的同一字段；需要 `Content-Type: application/json`，如有 `Origin` 则必须同源 |
| `GET /api/admin/shares/:code` | 六位口令；返回文件详情，不增加取件次数 |
| `GET /api/admin/shares/:code/download` | 返回文件流及附件文件名；不增加取件次数 |

文件详情包含 `code`、`filename`、`size`（字节）、`mime`、`createdAt`、`expireAt`、`cleanupAfter`、`pickupCount`、`maxPickups`、`status` 和 `downloadUrl`。时间使用 Unix 毫秒；永久分享的 `expireAt`、`cleanupAfter` 为 `null`，不限次时 `maxPickups` 为 `null`。详情不包含完整 IP 或内部文件存储键。

未登录返回 401；非法口令、天数或非文件记录返回 400；记录不存在返回 404；下载时文件已清理返回 410。设置接口的非 JSON 请求返回 415，跨来源请求返回 403。降低保留天数可能使旧记录进入下一次清理范围。

## 验证

在仓库根目录安装依赖，构建后执行：

```bash
npm run build:pages
npm run test:retention
npm run test:admin-download
```

需要 Python Playwright 与 Chromium。测试使用隔离的 KV、R2、D1 实例及测试文件，不连接生产数据。
