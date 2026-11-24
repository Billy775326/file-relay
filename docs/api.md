# API 参考

[文档导航](README.md) | [后台管理](admin.md) | [开发指南](development.md)

所有路径相对站点根地址。以下示例中的域名、口令、文件和 ID 为示意；时间均为 Unix 毫秒，文件大小为字节。文本的 `size` / `textLength` 为 JavaScript 字符串长度，不是 UTF-8 字节数。

外部脚本建议使用独立 Token 的 [`/api/v1` 增删查改接口](script-api.md)，无须后台 Cookie。本文继续说明原有网页与后台接口。

## 通用约定

- 至少绑定 `fileKV` 或 `DB`，否则 API 前置检查返回配置错误。
- 管理接口使用签名 `admin` Cookie，默认有效期 24 小时；响应为 `Cache-Control: no-store`。更换 `ADMIN_TOKEN` 后旧 Cookie 失效。
- 管理设置、来源备注、编辑分享和安全规则写入要求 JSON；带 `Origin` 时必须与请求服务同源。登录也检查提供的 Origin。不要假定所有旧管理端点都有相同的内容类型检查。
- `ADMIN_PATH` 只改变后台页面地址，不改变 `/api/admin/...` 路由和鉴权要求。
- 访客关联使用独立签名 Cookie。客户端应保留响应的 Cookie，分片后续请求必须携带初始化访客的 Cookie；不要把浏览器访客标识当作可自行指定的身份字段。
- 错误通常为 `{ "error": "错误代码", "message": "可读说明" }`。下载导航接受 HTML 时，部分错误返回同状态的提示页。
- 业务完成但审计写入失败时，保留原响应状态，附 `X-Audit-Status: unavailable`。不要仅为补日志重做已完成操作。

## 健康检查与配置

| 方法 / 路径 | 返回 |
|---|---|
| `GET /api/health` | `{ "ok": true }` |
| `GET /api/config` | 文件/元数据后端、有效上限、当前访客上传能力及剩余周次数 |

配置字段：

| 字段 | 含义 |
|---|---|
| `fileBackend` | `r2`、`kv`；仅 D1 且无文件后端时为 `none` |
| `metadataBackend` | `kv` 或 `d1`；同时绑定时为 `kv` |
| `maxFileSize`、`maxTextLength`、`partSize` | 有效文件上限、文本字符上限、分片字节数 |
| `allowPermanent`、`allowUnlimited` | 当前访客能否创建永久／不限次分享 |
| `weeklyFileLimit`、`uploadsRemaining` | 周文件上限、可用次数；已备注访客为 `null` |
| `uploadsResetAt` | 下次北京时间周一重置的时间戳，或 `null` |
| `fileUploadAvailable` | 当前资源与访客规则是否支持新文件上传 |

此接口不返回 IP、访客 ID、桶总占用或账户剩余免费空间；纯 KV 的未备注访客显示文件上传不可用。安全封禁仍由具体请求另行校验，配置可用不等于请求必定获准。

## 创建分享

### 通用字段

| 字段 | 取值 |
|---|---|
| `expiry` | 必须是 `1d`、`7d`、`30d` 或 `forever` |
| `maxPickups` | 1–999 的整数；`null` / 省略表示不限次 |
| `displayName` | 选填字符串，最多 40 字符 |
| `description` | 选填字符串，最多 300 字符 |

未备注访客不得使用 `forever` 或不限次，应明确提交有限 `maxPickups`。非法说明字段在周额度接纳之前拒绝。只有文件上传计周次数，文本仍受分享选项与网络频率限制。

### 文本：`POST /api/shares/text`

JSON 请求示例：

```json
{
  "text": "hello file-relay",
  "expiry": "7d",
  "maxPickups": 5,
  "displayName": "小林",
  "description": "本次分享的说明"
}
```

`text` 为非空字符串，不能超过 `MAX_TEXT_LENGTH`。成功返回 HTTP **201**：

```json
{
  "code": "246810",
  "kind": "text",
  "size": 16,
  "expireAt": 1800000000000,
  "maxPickups": 5,
  "pickupUrl": "/pickup?code=246810"
}
```

称呼和说明不出现在公开取件响应中；不会将文本正文写入审计。

### KV 文件：`POST /api/shares/file`

仅无 R2 的 KV 文件模式可用。请求体是原始字节，不是 `multipart/form-data`；查询参数为 URI 编码的 `filename`、可选 `mime`、`expiry`、`maxPickups`。

可选称呼/说明放在 `X-Upload-Context`：`encodeURIComponent(JSON.stringify({ displayName, description }))`。不要将说明写进 URL。没有此请求头等同空说明。

上限取全局配置与 25 MiB 的较小值；非空内容才可创建分享。成功 HTTP **201**，结构与文本响应相同，`kind` 为 `file`、`size` 为字节数。R2 模式调用此接口返回 400 配置错误。

### R2 分片上传

| 步骤 | 接口 | 输入 / 成功响应 |
|---|---|---|
| 初始化 | `POST /api/uploads/init` | JSON `{ filename, size, mime?, expiry, maxPickups, displayName?, description? }` → `{ uploadId, partSize, parts, size, remainingBytes, capacityBytes }` |
| 上传分片 | `PUT /api/uploads/:id/parts/:n` | 原始字节 → `{ partNumber, etag }` |
| 完成 | `POST /api/uploads/:id/complete` | JSON `{ "parts": [{ "partNumber": 1, "etag": "example-etag" }] }` → 分享响应 |
| 取消 | `POST /api/uploads/:id/abort` | 取消当前访客会话 → `{ "ok": true }` |

上述成功状态为 **200**，仅 R2 模式可用。`:id` 使用初始化返回的 `uploadId`，是私有会话凭据，不是 R2 内部上传 ID；不要记录到公开日志或分享给接收方。

分片序号从 1 开始。实际分片长度须匹配声明大小，最后一片可小于 `partSize`；完成列表须覆盖全部分片且序号不重复。上传成功分片不生成独立审计条目，完成分享才记成功；失败分片会标注阶段。

参数和权限校验通过后，文件周次数先接纳，之后预留 R2 容量。后续容量不足、失败或取消不会退回已接纳的周次数。取消幂等；仍须符合会话归属。页面刷新后不支持断点续传。

初始化的 `remainingBytes` 是预留本文件后的快照。空间不足 HTTP **507**：

```json
{
  "error": "capacity_exceeded",
  "message": "容量超出免费额度",
  "remainingBytes": 123456789,
  "capacityBytes": 9990000000
}
```

## 公开取件与下载

### `POST /api/pickup`

请求 JSON `{ "code": "246810" }`。六位数字以字符串传输，保留前导零。

| 内容 | 成功响应 | 是否计数 |
|---|---|---|
| 文本 | `{ kind, text, size, expireAt, pickupsLeft }` | 查看时计数 |
| 文件 | `{ kind, filename, size, mime, expireAt, pickupsLeft, downloadUrl }` | 只读元数据，不计数 |

成功 HTTP **200**，`pickupsLeft: null` 表示不限次。公开响应不包含来源、备注、文件说明或内部存储键。

### `GET /api/pickup/:code/download`

返回附件文件流，并增加公开取件次数。过期或次数耗尽返回 410；文件已被清理也返回 410。下载开始后断开、取消或浏览器保存失败不会退回次数。审计中的成功只表示服务端开始返回文件流。

实现也接受 GET 路由对应的 HEAD 请求，审计标为“检查下载”。它沿用当前下载处理流程，不能把 HEAD 当作不消耗取件次数的探测接口；无副作用的文件元数据查询应使用 `/api/pickup`。

## 管理登录、统计与列表

| 方法 / 路径 | 约定 |
|---|---|
| `POST /api/admin/login` | JSON `{ "token": "your-admin-token" }`；成功 `{ ok: true }` 并设置 Cookie |
| `POST /api/admin/logout` | 清除当前管理 Cookie |
| `GET /api/admin/stats` | 分享统计、`storage`、`kv`、元数据/文件后端 |
| `GET /api/admin/shares` | 筛选分页列表，返回 `{ total, rows }` |

R2 `storage` 为 `{ usedBytes, capacityBytes }`，包含对象、系统状态及预留；未绑定或读取失败为 `null`。`kv` 状态与配置见[KV 统计](kv-usage.md)。

列表参数：`limit` 建议使用 1–200 的整数，默认 50；`offset` 从 0 开始；`kind=all|file|text`，`status=all|active|expired|exhausted`，`q` 最多 80 字符。搜索对象为口令、列表文件名前 40 字符及原始访客标识，不搜索备注/说明。后台界面每页最多 40 条，以控制 KV 读取预算。

列表字段保留 snake_case：`pickup_count`、`max_pickups`、`expire_at`、`created_at`、`text_preview`，来源是精简 `source`，不含完整 IP。全量详情接口另用 camelCase，不应混用。

## 管理文件与来源

| 方法 / 路径 | 行为 |
|---|---|
| `GET /api/admin/shares/:code` | 文件详情；文本分享返回 400 |
| `PUT /api/admin/shares/:code` | 修改文件分享规则，校验原快照与最终状态 |
| `GET /api/admin/shares/:code/preview` | 管理员有限预览，不增加公开取件次数 |
| `GET /api/admin/shares/:code/download` | 管理员下载，不增加公开取件次数；支持仍保留的过期文件 |
| `DELETE /api/admin/shares/:code` | 删除分享与可访问的对应文件；记录不存在也返回成功 |
| `GET /api/admin/shares/:code/source` | 完整来源或 `{ source: null }` |
| `GET /api/admin/shares/:code/source/activity` | 同访客最近 10 条现存分享，返回 `{ limit: 10, rows }` |
| `PUT /api/admin/shares/:code/source` | JSON `{ "note": "设计组" }`；空白清除备注，返回 `{ visitorId, note }` |

来源备注最多 64 字符且必须单行；它同时授予周上传豁免、永久和不限次分享权限。无来源的旧记录设置备注返回 409。来源详情只投影自填称呼，文件说明由文件详情提供。[身份边界](upload-sources.md#识别范围)。

文件详情主要字段：`id`、`code`、`filename`、`size`、`mime`、`description`、`displayName`、`createdAt`、`expireAt`、`pickupCount`、`maxPickups`、`status`、`source`、`downloadUrl`。

另含诊断字段：`cleanupAfter`、`retentionDays`、`evaluatedAt`、`cleanupStatus`（`permanent|active|retained|pending`）、`storage.state`（`available|missing|unknown`）和可取得的存储大小/时间。界面不展示清理日期，但接口仍返回这些字段。完整 IP、浏览器与存储键不放进文件详情。

### 编辑分享请求

提交 `expected: { id, pickupCount, maxPickups, expireAt }` 和 `rules: { pickupCount, maxPickups, expireAt, status }`。

- `pickupCount`：0–2,147,483,647；有限 `maxPickups`：1–2,147,483,647，或 `null`。
- `expireAt`：非负整数毫秒，最大 253,402,300,799,999，或 `null`；`status` 为 `active|expired|exhausted`。
- 状态必须与次数、时间一致，接口不替调用方自动联动。
- 快照变化或已进入清理期返回 409，文件缺失 410，无法确认存储状态 503。

### 预览响应

文本/CSV 返回 `{ kind: "text" | "csv", text, truncated }`；不支持返回 `{ kind: "unsupported", reason: "type" | "size" | "encoding" | "image" }`，状态仍为 200。图片返回二进制及 `X-Preview-Width`、`X-Preview-Height`。读取范围和支持类型见[文件内容预览](admin.md#文件内容预览)。

## 设置与清理

| 方法 / 路径 | 请求或响应 |
|---|---|
| `GET /api/admin/settings` | `{ "expiredRetentionDays": 30 }` |
| `PUT /api/admin/settings` | 保存同名 0–3650 整数字段 |
| `GET /api/admin/upload-policy` | `{ "weeklyFileLimit": 5 }` |
| `PUT /api/admin/upload-policy` | 保存同名 0–1000 整数字段，0 暂停未备注访客文件上传 |
| `POST /api/admin/cleanup` | `{ ok: true, deletedShares, abortedSessions }` |

上传策略不再提供单文件大小配置；旧字段 `maxFileSizeMB` 被忽略，大小由 `MAX_FILE_SIZE` 和后端控制。设置保存不直接清理文件。

清理接口额外支持 `Authorization: Bearer <ADMIN_TOKEN>`，用于外部定时器；其令牌认证同样经过登录防护。未携带 Bearer 时要求管理 Cookie。

## 日志审计

`GET /api/admin/audit-logs` 和 `GET /api/admin/audit-logs/export` 使用相同筛选参数：

| 参数 | 取值 |
|---|---|
| `category` | `all`（默认）、`login`、`operation`、`upload`、`pickup`、`security` |
| `result` | `all`（默认）、`success`、`failed`、`blocked` |
| `q` | 最多 80 字符，搜索 IP、操作对象、操作 ID、文件名快照和访客标识 |
| `from`、`to` | 非负整数毫秒，包含端点；`to` 默认当前时间 |
| `offset`、`limit` | 非负偏移、1–1000 条；默认 0、20 |

返回 `{ enabled, retentionDays: 30, maxEntries: 1000, total, offset, limit, rows }`。`total` 是匹配条目数，合并记录的请求次数另见 `detail.count`。非法过滤返回 400，存储不可用 503；纯 KV 返回 `enabled: false`。

条目包含 `id`、`at`、`category`、`action`、`result`、`actor`、`ip`、`country`、`region`、`city`、`method`、`status`、`target`、`agent`、`durationMs` 和受控 `detail`。重复失败/公开拦截可附 `count`、`firstAt`、`lastAt`；日期过滤使用条目的最近发生时间，合并次数覆盖该条目的固定五分钟窗口。新自动封禁单独记录。

导出接口仍受 `offset` / `limit` 限制；后台导出使用 `offset=0&limit=1000` 获取当前筛选全部保留记录。读取导出快照后，导出动作本身另记操作日志。覆盖范围、聚合与隐私见[日志审计](admin.md#日志审计)。

## 安全防护

| 方法 / 路径 | 行为 |
|---|---|
| `GET /api/admin/security` | `{ enabled, configRevision, rules, bans, allow, regions }` |
| `POST /api/admin/security` | 提交 `{ action, configRevision, ...参数 }`，成功 `{ ok: true, configRevision }` |
| `POST /api/admin/security/test` | 只读测试 `{ ip, scope, country, region, count }`，返回是否拦截及原因 |
| `GET /api/admin/login-protection` | 兼容登录状态接口，含规则与封禁 |
| `POST /api/admin/login-protection/unblock` | 兼容解封：JSON `{ ip }` |

规则写入应先读取并保留 `configRevision`，冲突返回 409，不能用重发旧配置覆盖。`scope` 是 `login|upload|pickup`；`scopes` 为非空去重数组。

| `action` | 附加字段 |
|---|---|
| `rules` | 完整 `rules`，每个范围含 `enabled`、`limit`、`window`、`duration` |
| `ban` | `ip`、`scopes`、非空 `note`、`minutes` |
| `unban` | `ips` 数组，最多 1,000 项 |
| `allow` | `ip`、`scopes`、非空 `note` |
| `removeAllow` | `ip` |
| `region` | 可选 `id`；`rule: { country, region, scopes, enabled, reason, until }` |
| `removeRegion` | `id` |

`rules.limit` 为 1–10,000，`window` 为 1–1,440 分钟，`duration` 为 1–10,080 分钟。手动 `ban.minutes` 为 0–43,200 的整数，0 永久；接口保留该范围用于兼容，后台只提供 **1 小时、1 天、7 天、永久**，没有自定义时间控件。备注/原因最多 120 字符。

地区规则的 `country` 为两位大写国家代码，`region` 为可空省州代码，`until` 为时间戳或 `null`，`scopes` 禁止含 `login`。规则测试的国家可为空，`count` 为 0–100,000，仅模拟，不查真实定位、不变更计数或封禁。

## 常见错误与重试

| 状态 | 例子 | 处理 |
|---|---|---|
| 400 | 参数、口令格式、分片列表或状态不一致 | 修正输入 |
| 401 | 管理认证无效或过期 | 重新认证；避免自动试错 |
| 403 | 访问规则、地区、分享选项、会话归属 | 查看错误类型，不换 Cookie 盲目重传 |
| 404 | 口令/会话/记录不存在 | 检查目标是否仍存在 |
| 409 | 配置或分享快照冲突、进入清理期 | 重新读取并审核后提交 |
| 410 | 过期、次数耗尽、文件已清理 | 重新分享或由管理员处理保留文件 |
| 413 | 文件超过有效上限 | 缩小文件或调整获准配置 |
| 415 | 管理写接口未使用 JSON | 修正 Content-Type |
| 429 | 频率或访客周次数超限 | 按对应重试/重置时间处理 |
| 503 | 存储、防护或配额不可用 | 保留输入，确认已完成部分后再决定重试 |
| 507 | R2 可用容量不足 | 检查 `remainingBytes` 并回收空间 |

站点安全错误可含 `reason=rate_limit|access_rule|region|service_unavailable`、`requestId`、`serverTime`、`retryAt`，有期限时附 `Retry-After` 秒数。周配额错误使用 `resetsAt`，不要混同封禁到期。Cloudflare 在 Worker 前返回的拦截页不保证有这些字段。
