# 脚本用增删查改接口

[文档导航](README.md) | [原有接口参考](api.md) | [OpenAPI 定义](openapi.json)

`/api/v1` 供自用脚本管理文件与文本分享，使用独立 `API_TOKEN`，不依赖后台登录 Cookie。Token 可管理当前站点的全部分享，只保存在可信脚本或服务端，不交给公开网页或普通上传者。

## 启用与权限

在 Cloudflare 项目的 Production 环境添加 Secret **`API_TOKEN`**，使用密码管理器生成强随机值，保存后重新部署。未配置返回 `503 api_disabled`，不退回使用 `ADMIN_TOKEN`；更换或移除此 Secret 即可轮换或停用脚本接口。

每次请求携带：

```http
Authorization: Bearer your-api-token
```

不接受 URL 参数或 Cookie 代替 Token。原 `/api/admin/...` 继续使用管理员 Cookie，API Token 不授予后台设置、来源 IP 和安全规则的管理入口。响应禁止缓存。

脚本 Token 拥有永久、不限次分享和周次数豁免权限，但不绕过全局文件大小、R2 容量或上传范围的 IP/地区/频率规则。Token 鉴权受登录范围防护，错误凭据与后台登录共用失败计数和封禁；管理查询、修改、下载不属于公开取件计数/限流。纯 KV 的认证可用，但不提供持久化防护和审计。

## 接口清单

以下路径均以 `/api/v1` 开头。

| 操作 | 方法 / 路径 | 说明 |
|---|---|---|
| 查配置 | `GET /config` | 文件后端、全局上限、分片大小与脚本能力 |
| 增文本 | `POST /shares` | JSON 文本分享 |
| 增 KV 文件 | `POST /shares/file` | 原始字节直传，最多 25 MiB，需 KV 文件模式 |
| 查列表 | `GET /shares` | 分页、类型/状态/关键词筛选 |
| 查详情 | `GET /shares/{code}` | 文件或文本详情及 ETag，不消耗取件次数 |
| 改分享 | `PATCH /shares/{code}` | 修改内容/名称/规则，必须携带 `If-Match` |
| 删分享 | `DELETE /shares/{code}` | 删除文件及记录、释放容量预留，重复删除安全 |
| 下批次文件 | `GET /shares/{code}/files/{index}/download` | 按详情中的序号下载单个批次成员 |
| 下文件 | `GET /shares/{code}/download` | 管理下载，不消耗取件次数，可下载仍保留的过期文件 |
| 初始化 R2 | `POST /uploads/init` | 校验并预留完整文件大小 |
| 传 R2 分片 | `PUT /uploads/{id}/parts/{n}` | 原始字节，序号从 1 开始 |
| 完成 R2 | `POST /uploads/{id}/complete` | 校验分片列表，创建分享 |
| 取消 R2 | `POST /uploads/{id}/abort` | 取消会话，回收可释放的预留 |

OpenAPI 文件可导入接口工具或用于生成客户端；导入后把示例服务器地址替换为实际域名。所有口令、ID 和 ETag 示例均为示意。

## 最短调用流程

在自己的脚本环境设置 `FILE_RELAY_BASE_URL` 为站点地址、`FILE_RELAY_API_TOKEN` 为所配置的 Secret；下列环境变量是客户端变量，与服务器 Secret 分开管理。

### 1. 创建文本

```bash
curl -sS -X POST "$FILE_RELAY_BASE_URL/api/v1/shares" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"脚本创建的内容","expiry":"7d","maxPickups":5}'
```

成功 HTTP 201，返回 `code`、`kind`、`size`、`expireAt`、`maxPickups` 和 `pickupUrl`。保存返回的口令，后续不要直接使用文档中的示例口令。

输入 `text` 必须非空，受 `MAX_TEXT_LENGTH` 限制。`expiry` 为 `1d|7d|30d|forever`；`maxPickups` 为 1–999，`null` 或省略表示不限次。可选称呼最多 40 字符、说明最多 300 字符，只供后台查看；创建不接受其他字段。

创建、修改以及分片初始化/完成的 JSON 请求最多 **1 MiB**。这个限制不作用于 KV 原始文件体或 R2 分片体。

### 2. 查询列表和详情

```bash
curl -sS "$FILE_RELAY_BASE_URL/api/v1/shares?kind=text&status=active&limit=20&offset=0" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN"

curl -i "$FILE_RELAY_BASE_URL/api/v1/shares/246810" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN"
```

列表返回 `{ total, limit, offset, rows }`，默认每页 20，允许 1–100，偏移非负整数。`kind` 为 `all|file|text`，`status` 为 `all|active|expired|exhausted`；`q` 最多 80 字符，按原有列表文件名前 40 字符、口令或访客标识筛选，返回不包含来源线索。

详情统一使用 camelCase，包含 `id`、`code`、`kind`、`filename`、`mime`、`size`、`text`、`pickupCount`、`maxPickups`、`expireAt`、`createdAt`、`status`、`pickupUrl`、`downloadUrl`。文件 `text` 为 `null`，文本没有下载地址；不返回 IP、Cookie、Token、内部文件键或来源对象。文本大小是 JavaScript 字符串长度，文件大小是字节数。

详情响应头的 **ETag** 代表持久化内容和规则，不包含随时间变化的显示状态。`If-None-Match` 精确匹配时返回 304。GET/HEAD 查询都不计取件次数。

网页创建的批次在列表中给出 `fileCount`，详情的 `files` 列出各文件的 `index`、大小、名称、类型与管理下载地址。批次不接受 `filename` 修改，修改规则或删除作用于整批。

### 3. 修改

从详情响应头复制 ETag（包含两边双引号），通过 `If-Match` 提交：

```bash
curl -sS -X PATCH "$FILE_RELAY_BASE_URL/api/v1/shares/246810" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'If-Match: "replace-with-etag-from-detail"' \
  -d '{"text":"修改后的内容","maxPickups":10}'
```

| 可改字段 | 约束 |
|---|---|
| `text` | 仅文本分享，非空，不超过全局字符上限；同步更新大小 |
| `filename` | 仅文件分享，1–255 字符，不接受控制字符；不替换文件正文 |
| `pickupCount` | 0–2,147,483,647 |
| `maxPickups` | 1–2,147,483,647，或 `null` 表示不限次 |
| `expireAt` | Unix 毫秒，非负整数且不晚于 9999-12-31，或 `null` 表示永久 |

只提交要修改的字段；空对象、未知字段和不匹配内容类型返回 400。不能修改 ID、口令、创建时间、上传来源或存储键；要替换文件正文请创建新分享。状态由最终次数和时间计算，不提交 `status`。

缺 `If-Match` 返回 **428**，与当前 ETag 不符返回 **412**；后端条件写入时检测到竞争返回 **409**。遇到这些情况重新读取，审核差异后再提交，不用旧快照自动覆盖。D1 提供原子条件更新，KV 仍受最终一致与读改写限制，不能保证跨节点强一致。

已进入自动清理期不能修改；文件已丢失返回 410，无法确认文件存储状态返回 503。成功返回更新后的详情及新 ETag，不增加上传或公开取件次数。

### 4. 下载与删除

```bash
curl -f "$FILE_RELAY_BASE_URL/api/v1/shares/246810/download" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN" \
  -o downloaded-file.bin

curl -sS -X DELETE "$FILE_RELAY_BASE_URL/api/v1/shares/246810" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN"
```

下载仅适用文件。删除成功返回 `{ "ok": true }`；已不存在返回 `{ "ok": true, "already": true }`。文件存储绑定缺失或删除失败时，不把尚未回收的文件伪装成删除成功。仅次数用尽/到期的保留文件仍可管理下载。

## 文件上传

先读取 `/api/v1/config`。`fileBackend` 为 `kv` 使用直传，为 `r2` 使用分片，为 `none` 时无文件后端。

KV 示例（在本机准备好 `example.txt`，域名和文件名按实际替换）：

```bash
curl -f -X POST "$FILE_RELAY_BASE_URL/api/v1/shares/file?filename=example.txt&expiry=7d&maxPickups=5" \
  -H "Authorization: Bearer $FILE_RELAY_API_TOKEN" \
  -H 'Content-Type: application/octet-stream' \
  --data-binary @example.txt
```

R2 复用[分片字段与顺序](api.md#r2-分片上传)，把基础路径改为 `/api/v1/uploads`，每个请求携带同一 Token。无需 Cookie；服务端使用 Token 对应的私有主体校验会话归属，换网络不改变主体。轮换前应完成或取消在途上传；轮换后需重新开始，旧会话无法用新 Token 接管，由后续清理回收。不要把上传会话 ID 当成取件码或公开分享。

所有全局/后端文件限制继续生效，默认完整文件 9.9 GB、分片最多 100 MB，R2 9.99 GB 容量保护仍统计对象、系统状态与预留。空间不足 507，返回 `remainingBytes` / `capacityBytes`，不能用 API Token 绕过。

## 审计与错误处理

R2/D1 下，Token 创建/上传结果使用现有上传日志；列表、详情、修改、删除、下载为操作日志，身份为 `token`。修改只记录字段及分享规则快照，不记录新旧文本正文。鉴权失败与封禁进入安全事件，重复鉴权失败合并，不记录 Token 或完整 URL。

常见状态：401 凭据错误，403 访问/地区规则或跨来源，409 竞争/清理期，410 文件缺失，412/428 修改前提条件，413 大小/JSON 过大，415 非 JSON，429 防护封禁，503 未启用/存储异常，507 容量不足。错误为受控 `error` / `message`，防护可附重试时间和请求编号。

`X-Audit-Status: unavailable` 表示业务已处理但日志未保存，不要因此重做创建、修改或删除。POST 创建不提供幂等键，网络回执未知时先查询确认已完成部分；分片、完成和取消依现有上传生命周期处理，不盲目自动重试整次上传。
