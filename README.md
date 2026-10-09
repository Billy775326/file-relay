# 📦 file-relay 文件中转站

**简体中文** | [English](README.en.md)

基于 Cloudflare Workers / Pages 的文件与文本分享服务。发送方上传内容，获得 **6 位取件码**；接收方输入取件码，或扫描二维码取件。

项目按 **Cloudflare 免费套餐**设计。默认只需一个 KV 命名空间；添加 R2 桶后支持大文件分片上传，并提供 **9.99 GB 桶容量保护**。

> 免费套餐的请求限制、单文件上限和免费存储额度是不同概念。R2 容量保护仅覆盖当前绑定桶，不保证整个账户零费用。

[快速部署](#快速部署) · [上传与容量限制](#上传与容量限制) · [配置](#配置) · [更新已有部署](#更新已有部署) · [开发与测试](#开发与测试) · [API](#api) · [常见问题](#常见问题)

## 功能

- 文件与文本分享，支持取件码、取件链接和二维码。
- 一次选择最多 10 个文件，顺序上传，分别生成取件码；提供进度、速度和失败重试。
- 有效期支持 1 天、7 天、30 天或永久；页面可选取件 1 次、5 次或不限。
- KV 文件直传；绑定 R2 后自动改为分片上传，支持取消。
- R2 容量不足时弹出“容量超出免费额度”，停止后续批量上传。
- 管理后台支持令牌登录、统计、分享列表与删除，可自定义入口。
- 自动清理过期分享，中英文界面、深色模式和移动端适配。

## 快速部署

先选择适合自己的方式，完整步骤见 [部署指南](docs/deployment.md)。

| 方式 | 本地环境 | 更新方式 |
|---|---|---|
| [Pages + GitHub](docs/deployment.md#a-pages-连接-github) | 无需安装 | 推送代码后自动构建 |
| [命令行部署 Pages](docs/deployment.md#b-命令行部署-pages) | Git、Node.js 22+ | `npm run deploy`，自动先构建再上传 |
| [Workers 单文件粘贴](docs/deployment.md#c-workers-单文件粘贴) | 无需安装 | 替换完整 `worker.js` |
| [Pages 拖放上传](docs/deployment.md#d-pages-拖放上传) | 使用预构建文件时无需安装 | 上传含 `_worker.js` 的文件夹 |

所有方式都需要在 Cloudflare 项目中绑定资源，并添加管理员 Secret `ADMIN_TOKEN`：

| 用途 | 绑定 | 说明 |
|---|---|---|
| 小文件与文本 | `fileKV` → KV 命名空间 | 默认方案，文件与元数据共用 KV |
| 大文件分享 | `fileKV` → KV；`BUCKET` → R2 桶 | R2 文件 + KV 元数据 |
| 严格控制并发取件次数 | `DB` → D1；`BUCKET` → R2 桶 | 先初始化数据库，见指南 D1 步骤 |

**同时绑定 `fileKV` 和 `DB` 时优先使用 KV。** 添加 D1 不会自动切换后端或迁移记录。

只在本地生成部署文件，使用 `npm run build:pages` 或 `npm run build:single`；这两个命令不会发布到 Cloudflare。

## 上传与容量限制

以下限制同时生效，实际可上传大小以最严格的一项为准。**MB / GB 使用十进制；MiB / GiB 使用二进制。**

| 限制 | 当前值 | 作用范围 |
|---|---|---|
| KV 单文件 | 25 MiB，即 26,214,400 字节 | 原始文件字节，不含另存的分享元数据 |
| R2 单次分片请求 | 默认 100 MB，即 100,000,000 字节 | 上传经过免费套餐 Worker |
| 单个完整文件 | `MAX_FILE_SIZE`，默认 10 GB | 包含全部分片，服务端校验 |
| R2 分片数 | 默认最多 10,000 片 | 还受 `PART_SIZE` 与 `MAX_PARTS` 配置限制 |
| R2 总容量保护 | 固定 9.99 GB，即 9,990,000,000 字节 | 当前桶的对象、上传预留和容量台账 |

**默认配置不代表可以上传一个完整的 10 GB 文件**：桶容量保护会先拦截它。即使桶为空，也要为容量台账留出空间；桶已有文件时，可上传大小还取决于剩余容量。

本项目采用“浏览器 → Worker → R2”路径。R2 原生接口的单次上传上限不能直接作为此路径的请求上限；本项目未实现 S3 预签名直传。

官方参考：[KV 限制](https://developers.cloudflare.com/kv/platform/limits/)、[Workers 请求限制](https://developers.cloudflare.com/workers/platform/limits/#request-and-response-limits)、[R2 限制](https://developers.cloudflare.com/r2/platform/limits/)。

### 9.99 GB 容量保护如何工作

1. 新上传初始化时，通过 R2 `list()` 分页读取当前桶对象，累计实际字节数。
2. 加上进行中上传的完整文件预留空间，合并后的同名对象与预留去重计算。
3. 当前占用已达阈值，或新文件将导致超限时，返回 HTTP `507` / `capacity_exceeded`。
4. 页面弹出 **“容量超出免费额度”**，并停止本次批量上传。

容量台账位于 R2 的 `__file-relay/quota-v1.json`，通过条件写入处理并发预留，**无需额外绑定**。请勿手动编辑或删除该对象。

成功取消上传、通过管理后台删除文件、清理过期文件后，会释放对应预留。存储故障或计量失败时拒绝新上传；不能确认字节已清除时保留预留。直接在 R2 控制台删除本项目文件可能留下预留，日常删除请使用管理后台。

统计覆盖当前桶内已有对象，但不覆盖其他桶、历史操作次数，以及绕过本项目进行的并发上传。扫描成本随对象数量增加。KV 文件和文本分享不受此 R2 阈值限制。

### 免费额度的含义

R2 Standard 免费存储按 **10 GB-month/月**计量，另有 Class A、Class B 操作额度。9.99 GB 是本项目设置的实时容量阈值，不是 Cloudflare 账户账单查询结果。容量扫描、分片上传和下载也会消耗操作额度，详见 [R2 官方计费](https://developers.cloudflare.com/r2/pricing/)。

## 配置

部署位置与操作步骤见 [部署指南](docs/deployment.md)。

生产环境在 Cloudflare 项目设置中配置；[wrangler.jsonc](wrangler.jsonc) 主要用于本地开发。

| 变量 | 默认值 | 说明 |
|---|---|---|
| `MAX_FILE_SIZE` | `10000000000` | 单个完整文件上限，单位字节；两种文件模式都生效，不能突破各自平台上限或 R2 剩余容量 |
| `MAX_TEXT_LENGTH` | `65536` | 服务端文本长度上限 |
| `PART_SIZE` | `100000000` | R2 分片字节数，自动限制在 5 MiB 至 100 MB |
| `MAX_PARTS` | `10000` | R2 分片数量，自动限制在 1–10,000 |
| `SESSION_TTL_MS` | `86400000` | 未完成上传会话的清理期限，默认 24 小时 |

### 管理设置

| Secret | 是否必填 | 说明 |
|---|---|---|
| `ADMIN_TOKEN` | 是 | 管理员登录令牌；在生产控制台保存为 Secret |
| `ADMIN_PATH` | 否 | 自定义入口，如 `panel-x7k9`；默认 `/admin` |

自定义入口支持 1–64 位字母、数字、`-`、`_`，可带前导 `/`，不能使用 `/api` 或 `/pickup`。设置后旧 `/admin` 入口返回 404，管理 API 仍需要令牌鉴权。

### 调整上传上限

例如，将单文件限制为 1 GB：

```text
MAX_FILE_SIZE=1000000000
```

**桶总容量阈值不是环境变量**，固定定义在 [src/quota.ts](src/quota.ts) 的 `R2_CAPACITY_MAX`。降低 `MAX_FILE_SIZE` 不会删除已有文件，但会阻止超过新上限的旧会话继续上传。

## 自动清理

过期时间和取件次数在请求时检查，失效分享不能正常取件；文件空间需要实际清理后才会释放。取件次数耗尽不会立即删除文件，永久分享需手动删除。

- **Workers 单文件部署**：在控制台配置 Cron Trigger：`0 */6 * * *`。
- **Pages 部署**：首页访问触发后台清理，KV 标记提供约 6 小时的节流窗口；这不是严格的分布式锁。未绑定 KV 的 D1 模式没有该节流标记。
- **外部定时器**：低访问量站点可每 6 小时调用一次管理清理接口：

```bash
curl -X POST 'https://your-domain.example/api/admin/cleanup' \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

接口返回 `{"ok":true,"deletedShares":0,"abortedSessions":0}`。不要把管理令牌写入公开仓库。

## 更新已有部署

1. 结束旧版本未完成的上传，再部署新版本。容量保护会统计已有对象，并兼容可见的旧上传会话。
2. 检查控制台环境变量。旧的 `MAX_FILE_SIZE`、`PART_SIZE` 不会因更新代码而消失；要使用当前默认值，删除覆盖值或分别设置为 `10000000000`、`100000000`。
3. Pages 重新构建部署；粘贴模式替换完整 `dist/worker.js`。修改分片大小后重新开始上传。
4. 通过 `/api/config` 检查生效的单文件上限和分片大小，再测试上传、取件和删除。

切换文件存储时，保留历史文件所在资源的绑定。KV 文件键以 `f:` 开头，R2 对象使用独立键；保留相应绑定才能读取旧文件。**切换 KV / D1 元数据后端需要迁移记录，代码不会自动完成迁移。**

## 开发与测试

本地开发使用 [wrangler.jsonc](wrangler.jsonc)。测试 R2 时启用其中的 `BUCKET` 绑定；测试 D1 时配置 `DB`、移除 `fileKV` 并初始化表。生产资源绑定仍在项目控制台管理。

```bash
npm ci
npm run dev
```

将 [.dev.vars.example](.dev.vars.example) 复制为 `.dev.vars`，修改本地管理令牌。`.dev.vars` 已被 Git 忽略：

```text
ADMIN_TOKEN=your-local-test-token
```

常用检查命令：

```bash
npx tsc --noEmit
node tools/check-i18n.mjs
npm run test:limits
npm run test:quota
npm run build:pages
```

浏览器测试需要 Python、Playwright 和 Chromium：

```bash
python -m pip install playwright
python -m playwright install chromium
npm run test:quota-runtime
```

`test:quota-runtime` 使用构建产物启动本地模拟环境，验证容量拦截、上传下载、取消删除及浏览器弹窗，不需要 Cloudflare 凭据。

对已启动的本地服务进行 API / 页面测试：

```bash
python test/e2e_test.py http://localhost:8787
python test/ui_smoke.py http://localhost:8787
```

这些测试会创建分享和测试文件；R2 API 测试使用超过一个分片大小的文件。不要把生产地址当作无副作用的检查目标。

## API

`expiry`：`1d` / `7d` / `30d` / `forever`。`maxPickups`：1–999 的整数，或 `null` 表示不限次。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/health` | 健康检查，需要元数据绑定 |
| GET | `/api/config` | 当前文件模式、单文件上限、文本上限和分片大小；不返回桶总占用 |
| POST | `/api/shares/text` | 创建文本分享 |
| POST | `/api/shares/file` | KV 原始字节直传，文件名等通过查询参数传入 |
| POST | `/api/pickup` | 文本查看并计数；文件只返回元数据 |
| GET | `/api/pickup/:code/download` | 下载文件并计数 |
| POST | `/api/uploads/init` | R2 容量预留与上传初始化 |
| PUT | `/api/uploads/:id/parts/:n` | 上传一个 R2 分片 |
| POST | `/api/uploads/:id/complete` | 合并分片并创建分享 |
| POST | `/api/uploads/:id/abort` | 取消上传并释放可回收的预留 |
| POST | `/api/admin/login`、`/api/admin/logout` | 管理会话登录、退出 |
| GET | `/api/admin/stats`、`/api/admin/shares` | 分享统计与列表；统计不是桶实际容量 |
| DELETE | `/api/admin/shares/:code` | 删除分享及对应文件 |
| POST | `/api/admin/cleanup` | 清理过期分享和遗留上传会话 |

管理接口使用签名 Cookie；清理接口额外支持 `Authorization: Bearer <ADMIN_TOKEN>`。

```bash
curl -X POST 'https://your-domain.example/api/shares/text' \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello file-relay","expiry":"7d","maxPickups":null}'

curl -X POST 'https://your-domain.example/api/pickup' \
  -H 'Content-Type: application/json' \
  -d '{"code":"376966"}'
```

R2 容量不足返回：

```json
{"error":"capacity_exceeded","message":"容量超出免费额度"}
```

HTTP 状态为 `507`；容量服务不可用时返回 `503`，单文件超限为 `413`。

## 命令速查

| 目的 | 命令 | 是否发布 |
|---|---|---|
| 本地开发 | `npm run dev` | 否 |
| 构建单文件 | `npm run build:single` | 否 |
| 构建 Pages | `npm run build:pages` | 否 |
| 本地预览 Pages | `npm run dev:pages`（先构建） | 否 |
| 部署 Pages | `npm run deploy -- --project-name file-relay --branch main` | 是，先构建后发布 |

`dev:pages` 可能受到本地 Static Assets 优先路由影响；需要验证完整内联路由和容量弹窗时，使用 `npm run test:quota-runtime`。

## 常见问题

**桶中还不到 9.99 GB，为什么提示容量不足？** 还需计算新文件、未完成上传预留和台账本身。取消遗留上传或通过后台删除文件后重试；清理失败可能保留预留。

**加上 D1 就能严格计数吗？** 不能。当前同时绑定 KV 和 D1 时优先 KV。D1 使用原子更新限制取件次数；KV 使用读改写，存在并发超取和口令碰撞窗口，没有“最多只多取一两次”的保证。

**KV 写额度耗尽会影响下载吗？** 会。取件计数需要写回 KV，因此新分享、文本取件和文件下载都可能失败。

**刷新后能继续上传吗？** 当前不支持断点续传。页面关闭时尽力取消会话，未完成会话由后续清理处理。

**下载取消会返还次数吗？** 不会，文件开始下载即计数；文本查看即计数。

**忘记管理令牌怎么办？** 在项目设置中重设 `ADMIN_TOKEN`，旧管理会话随之失效。

**部署后提示没有元数据库？** 检查当前环境是否绑定 `fileKV` 或 `DB`，以及绑定名称是否一致。

**如何排查访问失败？** 先检查部署日志、绑定和域名网络连通性。默认域名的可达性取决于所在网络，可根据需要绑定自定义域名。

## 项目结构

```text
docs/       中英文部署指南
src/        路由、KV/D1 元数据、文件存储、上传限制、R2 容量台账及清理
public/     发送、取件、管理页面和原生 JavaScript
schema/     D1 初始化 SQL
tools/     构建和翻译检查脚本
test/      边界、容量、运行时、API 和浏览器测试
dist/      worker.js；Pages 产物位于 pages/_worker.js
```

容量逻辑见 [src/quota.ts](src/quota.ts)，上传限制见 [src/limits.ts](src/limits.ts)，部署与测试命令见 [package.json](package.json)。

## 致谢与许可

灵感来自 [FileCodeBox](https://github.com/vastsa/FileCodeBox)。基于 [Hono](https://github.com/honojs/hono) 和 Cloudflare Workers / Pages、KV、R2、D1 构建。

[MIT License](LICENSE)
