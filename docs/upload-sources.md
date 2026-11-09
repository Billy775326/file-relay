# 上传来源与管理员备注

后台列表显示访客标识和上传时 IP 属地；详情显示完整 IP、原始访客标识、记录时间及备注。备注按访客保存，对其新旧上传统一生效。清空备注后恢复标识。来源只对管理员开放，公开取件不会返回这些字段。

## 识别范围

- 访客通过服务端签名、HttpOnly、SameSite=Lax 的 Cookie 关联，HTTPS 下增加 Secure。Cookie 有效期为一年；清除浏览器数据、换浏览器或失效后会分配新标识。它不提供访问权限，也不能证明实际操作者身份。
- `ADMIN_TOKEN` 用于签名；更换令牌后旧 Cookie 失效。未设置令牌时不签发持久 Cookie，每次上传生成新的临时标识。生产部署应配置管理员令牌。
- 来源 IP 从 Cloudflare 入口的 `CF-Connecting-IP` 读取；不使用客户端填写的 IP 或 `X-Forwarded-For`。地理信息读取 `request.cf` 的国家、地区、城市；本地无可信入口信息时不推测来源。
- 城市缺失时保留可用的国家、地区，全部缺失显示“未知”；未记录来源的旧文件显示“未记录”。地名沿用 Cloudflare 提供的名称，可能是英文。属地反映网络出口，不是精确位置。
- R2 在初始化时固定快照，后续分片、更换网络、修改 Cookie 或完成上传均不会覆盖它。KV 文件和文本在创建分享时记录。
- 备注最长 64 个字符，仅允许单行；作为纯文本显示。KV 传播存在延迟，当前页面保存后会立即更新，其他页面可能稍后才显示。来源随分享清理；备注独立保留至管理员清空，以关联该访客后续上传。

## 升级现有部署

### KV（默认）

直接部署新代码，无需修改现有数据。新字段缺失按旧记录读取，已有分享仍可取件。备注使用独立的 `v:` 键，避免修改分享时覆盖取件计数。

### 已有 D1

在仓库根目录执行以下命令，数据库名 `file-relay` 替换为实际名称。先完成备份；迁移完成后再部署代码，避免新代码访问尚不存在的字段。

```bash
npx wrangler d1 export file-relay --remote --output=./d1-before-upload-source.sql
npx wrangler d1 execute file-relay --remote --file=./schema/migrations/0001-upload-source.sql
```

备份含实际分享数据，应存放在受控目录，不能提交仓库。迁移仅新增 `shares.source_json`、`upload_sessions.source_json` 和 `visitor_notes` 表，不删除文件或修改旧记录。执行前可通过 `PRAGMA table_info(shares);` 和 `PRAGMA table_info(upload_sessions);` 检查字段；该迁移只执行一次。若执行中断，核对两个字段和备注表的实际状态，只补执行缺失的语句。

新建 D1 数据库直接执行 `schema/schema.sql`，不再执行此迁移。代码回退到之前版本可保留新增字段；不应为了回退而删除真实数据。旧版 KV 代码若执行取件更新，可能移除列表 metadata 中的来源投影；需重新升级或修复投影才能恢复列表展示，原 JSON 来源仍保留。

## 管理接口

所有接口需要管理员 Cookie，响应使用 `Cache-Control: no-store`。

| 接口 | 返回 / 行为 |
| --- | --- |
| `GET /api/admin/shares` | 每条记录增加 `source`，含 `visitorId`、`country`、`region`、`city`、`capturedAt`、`note`；不含 IP |
| `GET /api/admin/shares/:code/source` | `{ source }` 包含上述字段及 `ip`；旧记录为 `{ source: null }` |
| `PUT /api/admin/shares/:code/source` | JSON `{ "note": "设计组" }`；按该分享的访客保存备注，空白字符串清除；返回 `{ visitorId, note }` |

来源快照时间 `capturedAt` 为 UTC epoch 毫秒，页面按浏览器时区显示。地理字段和 IP 可以为 `null`。未登录返回 401，无此分享返回 404；无来源的旧记录不能设置访客备注，返回 409；备注类型、长度、控制字符非法返回 400。备注接口仅接收 JSON，并拒绝与服务地址不匹配的 Origin。

## 回归与发布验收

本功能涉及元数据、公开接口与管理员权限，采用以下回归集，在仓库根目录执行：

```bash
npx tsc --noEmit
node tools/check-i18n.mjs
npm run test:limits
npm run test:quota
npm run build:pages
npm run test:quota-runtime
npm run test:source
```

`test:source` 使用独立 Miniflare/workerd 实例，覆盖 KV 元数据 + KV 文件、KV 元数据 + R2 文件、D1 元数据 + R2 文件；执行既有 `e2e_test.py` 校验上传下载哈希、取件和后台删除，并补充签名 Cookie 防篡改、来源快照、备注、鉴权、公开响应隔离、D1 旧数据迁移及浏览器详情交互。需要 Python Playwright 与 Chromium；不连接生产存储。

部署后检查 Cloudflare 构建记录和正式域名静态资源、配置接口。对生产真实上传或管理员记录的验证应明确记录范围，不以本地模拟结果冒充线上身份和属地实测。
