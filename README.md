# 📦 file-relay 文件中转站

**简体中文** | [English](README.en.md)

运行在 Cloudflare Workers / Pages 上的文件与文本分享服务。发送方上传内容后获得 **6 位取件码**，接收方通过口令、链接或二维码取件；管理员在后台管理文件、查看来源与日志、设置访问防护。

适合个人和小范围分享，按 Cloudflare 免费套餐的限制设计。默认单文件 **9.9 GB**，R2 桶容量保护为 **9.99 GB**；这些限制不等于账户账单保证，使用量还受请求、读写操作及账户其他资源影响。

[部署](docs/deployment.md) · [后台使用](docs/admin.md) · [安全防护](docs/security.md) · [全部文档](docs/README.md)

## 功能

- 文件、文本分享；一次最多选择 10 个文件。整批上传完成后生成一个取件码，接收方可逐个选择下载。
- 有效期可选 1 天、7 天、30 天；未备注访客默认每周 5 次文件上传，已备注访客可创建永久、不限次分享。
- KV 小文件直传、R2 大文件分片上传；上传前校验单文件大小与可用容量。
- 文件管理支持筛选、详情、有限内容预览、下载、编辑分享规则与删除。管理员下载不消耗公开取件次数。
- 文本分享支持后台查看完整正文、复制全文、编辑正文及分享规则，不消耗公开取件次数。
- 上传来源显示访客标识或备注、请求出口 IP 与大致属地；可选称呼和文件说明仅管理员可见。
- 独立安全防护：后台登录、上传与取件限流，IP／地区封禁、允许名单、规则测试。
- 日志审计覆盖登录、后台操作、上传、取件和安全事件，支持筛选、详情与 JSON 导出。
- 默认保留过期分享 30 天后清理，可在后台调整；支持中英文、明暗主题和手机布局。

## 快速部署

推荐 **Pages + GitHub + KV + R2**：连接仓库，构建命令填写 `npm run build:pages`，输出目录填写 `dist/pages`，绑定 `fileKV`、`BUCKET`，添加管理员 Secret `ADMIN_TOKEN`，再重新部署。[按步骤操作](docs/deployment.md#a-pages-连接-github)。

| 方式 | 需要本地环境吗 | 更新方式 |
|---|---|---|
| [Pages 连接 GitHub](docs/deployment.md#a-pages-连接-github) | 不需要 | 推送生产分支后自动构建部署 |
| [命令行部署 Pages](docs/deployment.md#b-命令行部署-pages) | Git、Node.js 22+ | `npm run deploy` |
| [Workers 单文件粘贴](docs/deployment.md#c-workers-单文件粘贴) | 使用预构建文件时不需要 | 替换完整 `dist/worker.js` |
| [Pages 拖放上传](docs/deployment.md#d-pages-拖放上传) | 使用预构建文件时不需要 | 上传含 `_worker.js` 的目录 |

所有方式使用同一套程序，能力取决于绑定：

| 绑定 | 文件模式 | 未备注访客文件上传 | 安全防护与审计 |
|---|---|---|---|
| 仅 `fileKV` | KV，最多 25 MiB | 不开放；可先发限时、限次文本供管理员备注 | 不启用持久化防护与审计 |
| `fileKV` + `BUCKET` | R2，默认最多 9.9 GB | 默认每周 5 次 | 启用 |
| `fileKV` + `DB` | KV，最多 25 MiB | 默认每周 5 次 | 启用，D1 保存配额与防护状态 |
| `DB` + `BUCKET` | R2，默认最多 9.9 GB | 默认每周 5 次 | 启用，D1 提供原子取件计数 |

**同时绑定 `fileKV` 和 `DB` 时，分享元数据优先使用 KV。** 添加 D1 不会迁移旧记录或自动切换元数据后端；仅绑定 D1 时可分享文本，文件上传还需要 R2。[部署资源选择](docs/deployment.md#部署前准备)。

## 上传与容量限制

MB / GB 为十进制，MiB / GiB 为二进制。

| 项目限制 | 默认值 |
|---|---|
| 单个完整文件 | 9.9 GB；KV 模式还受 25 MiB 上限约束 |
| R2 单次分片请求 | 100 MB |
| R2 分片数 | 最多 10,000 片 |
| R2 桶容量保护 | 9.99 GB，包含现有对象与上传预留 |
| 未备注访客文件数 | 每周 5 个文件，批次按文件数计，北京时间周一重置；取消不退回已接纳次数 |

所有访客共用全局文件大小上限。备注只解除周次数和永久／不限次分享限制，不绕过大小、容量或安全防护。上传容量不足时显示剩余额度并停止后续批量上传。[容量与清理说明](docs/operations.md#容量与免费额度)。

### 免费额度的含义

R2 Standard 的免费存储按 **10 GB-month/月**计量，另外限制操作用量；项目的 9.99 GB 保护只检查当前桶，不统计整个账户的账单。[官方 R2 计费](https://developers.cloudflare.com/r2/pricing/)。

## 配置

生产绑定和变量在 Cloudflare 项目设置中配置，保存后重新部署；`wrangler.jsonc` 主要用于本地开发。

| 变量 | 默认值 | 用途 |
|---|---|---|
| `MAX_FILE_SIZE` | `9900000000` | 单个完整文件上限，字节 |
| `MAX_TEXT_LENGTH` | `65536` | 文本字符数上限 |
| `PART_SIZE` | `100000000` | R2 分片字节数，限制在 5 MiB–100 MB |
| `MAX_PARTS` | `10000` | R2 分片数量上限，1–10,000 |
| `SESSION_TTL_MS` | `86400000` | 遗留上传会话清理期限，毫秒 |

### 管理设置

`ADMIN_TOKEN` 是必填管理员 Secret；可选 `ADMIN_PATH` 自定义后台入口，默认 `/admin`。后台设置可修改过期保留天数、访客周次数和当前浏览器的每页条数；防护规则在独立的“安全防护”页面管理。[配置与设置区别](docs/admin.md#设置与翻页)。

KV 卡片自动识别绑定。需要显示具体用量时，再配置 `CF_ACCOUNT_ID`、`CF_KV_NAMESPACE_ID` 和 Secret `CF_ANALYTICS_TOKEN`。[KV 统计配置](docs/kv-usage.md)。

### 调整上传上限

例如将 `MAX_FILE_SIZE` 设为 `1000000000`，即可限制完整文件为 1 GB。R2 总容量阈值是代码常量，不是同名环境变量；调整方法与边界见[运维说明](docs/operations.md#容量与免费额度)。

## 自动清理

公开分享到期后立即停止取件，默认再保留 **30 天**，到下一次成功清理时删除。保留期内管理员仍可下载；永久分享、仅次数用完的分享不因该条件自动清理。

Workers 可配置 Cron，Pages 使用首页触发或外部定时器。[清理配置](docs/deployment.md#清理配置) · [后台保留设置](docs/admin.md#过期保留天数)。

## 更新已有部署

保留原有存储绑定与管理员 Secret，结束未完成上传，再按原部署方式更新。旧环境变量覆盖值不会随代码更新自动删除；升级后通过 `/api/config` 检查有效上限。

较早的 D1 数据库可能需要来源字段迁移；已支持来源字段的数据库不重复迁移。切换 KV / D1 元数据后端须另外迁移记录。[升级、备份与回退](docs/operations.md#更新已有部署)。

## 开发与测试

```bash
npm ci
# 复制 .dev.vars.example 为 .dev.vars，并设置本地管理员令牌
npm run dev
```

需要 Node.js 22+。隔离集成测试还需要 Python、Playwright 与 Chromium。安装、构建、模块测试和界面架构见[开发指南](docs/development.md)。

## API

最小示例使用未备注访客也允许的有限取件次数：

```bash
curl -X POST 'https://your-domain.example/api/shares/text' \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello file-relay","expiry":"7d","maxPickups":5}'
```

公开接口不返回上传来源；分片客户端必须保留访客 Cookie。外部脚本可使用独立 `API_TOKEN` 调用 [`/api/v1` 增删查改接口](docs/script-api.md)，支持文本、文件及 R2 分片，无需后台 Cookie。完整网页/后台路径、错误和日志筛选见[API 参考](docs/api.md)。

## 命令速查

| 目的 | 命令 | 是否部署 |
|---|---|---|
| 本地开发 | `npm run dev` | 否 |
| 构建单文件 | `npm run build:single` | 否 |
| 构建 Pages | `npm run build:pages` | 否 |
| 本地预览 Pages | `npm run dev:pages`（先构建） | 否 |
| 部署 Pages | `npm run deploy -- --project-name file-relay --branch main` | 是 |

## 常见问题

**KV 卡片显示的是剩余空间吗？** 不是。分子是当前命名空间的日峰值，1 GB 分母是账户共享免费额度，不能据此判断账户剩余容量。

**来源 IP 能证明上传者是谁吗？** 不能。它反映网络出口；代理、共享网络、Cookie 更换均会影响关联。[来源识别范围](docs/upload-sources.md#识别范围)。

**刷新后能继续上传吗？** 当前不支持断点续传，页面关闭时尽力取消，会话由后续清理回收。

**下载取消会返还次数吗？** 不会。文件开始返回即计数，日志中的成功也不能证明浏览器完成下载。

**KV 写额度耗尽会影响取件吗？** 会，公开取件计数需要写回元数据。KV 并发计数也不具备 D1 的原子保证。[排障表](docs/operations.md#常见问题)。

## 项目结构

`public/` 为页面和样式，`src/` 为 Worker 业务，`schema/` 为 D1 表及迁移，`test/` 为测试，`tools/` 为构建工具，`dist/worker.js` 为可粘贴产物。目录职责见[开发指南](docs/development.md#代码结构)。

## 致谢与许可

灵感来自 [FileCodeBox](https://github.com/vastsa/FileCodeBox)，基于 [Hono](https://github.com/honojs/hono) 与 Cloudflare 构建。[MIT License](LICENSE)。
