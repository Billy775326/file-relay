# 部署指南

[返回项目首页](../README.md) | [English](deployment.en.md)

选一种部署方式即可。所有方式运行同一套程序，功能和上传限制相同。

## 选择方式

| 方式 | 适合谁 | 本地需要安装 | 更新方法 |
|---|---|---|---|
| [A：Pages 连接 GitHub](#a-pages-连接-github) | 希望推送代码后自动更新 | 无 | 推送代码 |
| [B：命令行部署 Pages](#b-命令行部署-pages) | 熟悉终端，希望手动发布 | Git、Node.js 22+ | `npm run deploy` |
| [C：Workers 单文件粘贴](#c-workers-单文件粘贴) | 不想配置构建环境 | 无 | 替换完整 `worker.js` |
| [D：Pages 拖放上传](#d-pages-拖放上传) | 希望在网页中上传部署文件 | 使用预构建文件时无需安装 | 上传新的部署目录 |

Pages 创建时选择 Git 集成或 Direct Upload。Direct Upload 项目不能直接改成 Git 集成；需要自动构建时，应新建 Git 集成项目。参见 [Cloudflare Direct Upload 说明](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 部署前准备

### 创建资源

登录 Cloudflare，创建一个 KV 命名空间，名称可以是 `file-relay-meta`。分享大于 25 MiB 的文件时，再创建一个 R2 桶，例如 `file-relay-files`，使用 Standard 存储。

**资源名称可以自定，程序绑定名称必须固定：**

| 资源 | 示例资源名 | 绑定名称 | 是否需要 |
|---|---|---|---|
| KV 命名空间 | `file-relay-meta` | `fileKV` | 默认方案需要 |
| R2 桶 | `file-relay-files` | `BUCKET` | 大文件模式需要 |
| D1 数据库 | `file-relay` | `DB` | 可选，见文末 D1 步骤 |

默认先用 KV 或 KV + R2 完成部署。当前 R2 桶容量保护为 9.99 GB，单文件配置与桶剩余容量同时生效，详见 [上传与容量限制](../README.md#上传与容量限制)。

### 准备管理员令牌

使用密码管理器生成强随机字符串，稍后保存为 `ADMIN_TOKEN` Secret。这个令牌用于本项目管理员登录，**不是 Cloudflare API Token**。

## A： Pages 连接 GitHub

### 1. 创建项目并构建

1. Fork 本仓库，或将代码推送到自己的 GitHub 仓库。
2. 在 Cloudflare 的 Workers & Pages 中创建 **Pages** 项目，选择连接 Git 仓库。
3. 授权并选中仓库，生产分支选择 `main`，或你的实际生产分支。
4. 填写构建设置：

| 设置 | 填写内容 |
|---|---|
| Framework preset | None |
| Root directory | 留空；代码在子目录时填写该子目录 |
| Build command | `npm run build:pages` |
| Build output directory | `dist/pages` |
| Node.js | 仓库 `.node-version` 指定 22；若已有 `NODE_VERSION` 覆盖，请同步为 22 或更高 |

启动首次部署。部署成功但 API 暂时提示缺少绑定，是尚未完成下一步。

### 2. 绑定资源并设置令牌

打开该 **Pages 项目**的 Settings，在 Bindings 或 Functions 的资源绑定区域添加 `fileKV`；使用 R2 时再添加 `BUCKET`。在 Variables and Secrets 中添加 Secret `ADMIN_TOKEN`。

先配置 Production。需要预览环境时单独配置 Preview，建议使用独立的测试资源，避免测试上传写入生产桶。

保存后重新部署。Cloudflare 控制台菜单名称可能调整，以项目中的资源绑定和变量设置入口为准；可参考 [官方绑定说明](https://developers.cloudflare.com/pages/functions/bindings/)。

### 3. 验证与更新

打开 Pages 提供的站点地址，完成下文 [验证部署](#验证部署)。以后推送到生产分支会自动更新站点。

**清理方式：** Pages 首页访问会触发后台清理。低访问量站点再配置 [外部定时清理](#清理配置)。

## B： 命令行部署 Pages

### 1. 下载代码和安装依赖

安装 Git、Node.js 22 或更高版本。在终端逐行执行：

```bash
git clone https://github.com/Billy775326/file-relay.git
cd file-relay
npm ci
npx wrangler login
```

`wrangler login` 会打开浏览器，登录存放 KV / R2 资源的 Cloudflare 账户。

### 2. 创建 Pages 项目

```bash
npx wrangler pages project create file-relay --production-branch main
```

已存在项目可跳过。`file-relay` 是示例项目名，实际名称不同时替换后续命令。

在项目控制台配置 Production 的 `fileKV`、可选 `BUCKET` 和 Secret `ADMIN_TOKEN`。

### 3. 构建并发布

```bash
npm run deploy -- --project-name file-relay --branch main
```

**该命令会先重新构建，再上传 `dist/pages`。** 构建失败不会继续发布；`--branch` 应与项目生产分支一致，否则可能生成预览部署。

打开命令输出的站点地址，完成 [验证部署](#验证部署)。后续更新代码后再次运行同一部署命令即可。

**清理方式：** 与方式 A 相同，使用首页清理或外部定时器。

## C： Workers 单文件粘贴

### 1. 获取完整文件

打开仓库的 [dist/worker.js](../dist/worker.js)，使用 Raw 视图复制完整内容，或下载原始文件后打开。不要复制 GitHub 页面本身的 HTML。

### 2. 创建并配置 Worker

1. 在 Cloudflare 创建一个 **Worker**，先部署默认示例以创建项目。
2. 进入代码编辑器，将示例代码完整替换为 `worker.js` 内容，保存部署。
3. 在该 Worker 的 Settings / Bindings 中添加 `fileKV`，大文件模式再加 `BUCKET`。
4. 在 Variables and Secrets 中添加 Secret `ADMIN_TOKEN`，保存并应用配置。
5. 在 Cron Triggers 中添加 `0 */6 * * *`。

### 3. 验证与更新

打开 Worker 提供的地址，完成 [验证部署](#验证部署)。更新时重新获取最新 `dist/worker.js`，替换完整代码后部署，保留原有资源绑定。

自行修改代码时先在本地重新生成文件：

```bash
npm ci
npm run build:single
```

这个命令只生成文件，不发布到 Cloudflare。

## D： Pages 拖放上传

### 1. 准备部署目录

**有 Node.js 环境：** 在仓库目录执行 `npm ci` 和 `npm run build:pages`，准备上传生成的 `dist/pages` 文件夹。

**没有 Node.js 环境：** 下载原始 [dist/worker.js](../dist/worker.js)，放入一个空文件夹，并重命名为 `_worker.js`。注意保留开头的下划线，不要变成 `_worker.js.txt`。

目录内容应为：

```text
pages/
└── _worker.js
```

### 2. 上传与配置

1. 在 Cloudflare Pages 选择 Direct Upload / 上传资源，创建项目。
2. 拖入上述文件夹并部署，不要上传整个源码仓库或单独的 `public/`。
3. 在 Pages 项目中配置 Production 的 `fileKV`、可选 `BUCKET` 和 Secret `ADMIN_TOKEN`。
4. 再创建一次部署，上传同一文件夹，使新绑定生效。

### 3. 验证与更新

完成 [验证部署](#验证部署)。以后用最新构建的 `_worker.js` 替换文件夹里的旧文件，再通过“创建新部署”上传，选择 Production。

**清理方式：** 与其他 Pages 部署一致。本项目使用 `_worker.js` 高级模式，支持网页拖放；不是只上传静态页面。

## 验证部署

按顺序检查，任何一种部署方式都适用：

| 检查 | 预期结果 |
|---|---|
| 打开首页 | 能看到发送页面 |
| 打开 `/api/health` | 返回 `{"ok":true}` |
| 打开 `/api/config` | `fileBackend` 为 `kv` 或 `r2`，上限与设置一致 |
| 发送一条文本并取件 | 内容一致 |
| 上传小文件并下载 | 文件可正常打开 |
| 打开 `/admin` 并输入 `ADMIN_TOKEN` | 登录成功，可看到分享并删除 |

设置 `ADMIN_PATH` 后，用自定义地址替代 `/admin`。R2 容量保护已默认启用，**不用真的上传 9.99 GB 测试**；开发者可运行 [本地容量测试](../README.md#开发与测试)。

## 清理配置

**Workers：** Cron Trigger 为 `0 */6 * * *`。

**Pages：** 首页自动触发后台清理。低流量站点可添加外部定时器，每六小时发送以下请求：

```bash
curl -X POST 'https://your-domain.example/api/admin/cleanup' \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

将域名与令牌替换成实际值；Windows PowerShell 使用 `curl.exe`，或在定时器中分别填写 URL、POST 方法和 Authorization 请求头。不要把令牌放进 URL。

过期限制会在取件时检查，但释放存储和上传预留需要清理成功。不要删除 R2 的 `__file-relay/quota-v1.json`。

## 可选：使用 D1 元数据

适合需要原子取件计数的新部署：

1. 创建 D1 数据库，例如 `file-relay`。
2. 打开数据库的 SQL Console，执行 [schema/schema.sql](../schema/schema.sql) 全文。
3. 在项目中绑定 `DB` 与 `BUCKET`，移除 `fileKV`。同时绑定 KV 和 D1 时，当前代码仍使用 KV。
4. 保存并重新部署，重新执行验证步骤。

已有 KV 分享不能通过更换绑定自动迁移。先迁移元数据和处理历史 KV 文件，再切换；不要直接删除旧命名空间。

## 更新与常见问题

| 情况 | 处理方法 |
|---|---|
| 构建报 Node.js 版本过低 | 本地和 Pages 构建环境使用 Node.js 22+，检查 `NODE_VERSION` 覆盖 |
| 页面正常，API 提示缺少元数据库 | 检查当前部署环境的 `fileKV` 或 `DB` 绑定，保存后重新部署 |
| 大文件仍按 KV 限制 | 检查是否绑定名为 `BUCKET` 的 R2 桶 |
| 代码更新后仍是旧上传上限 | 检查控制台 `MAX_FILE_SIZE`、`PART_SIZE`；已有覆盖值不会自动删除 |
| 命令行发布后正式域名未更新 | 检查 `--project-name` 与 `--branch` 是否指向目标生产环境 |
| 忘记管理令牌 | 在项目设置中重设 `ADMIN_TOKEN` |
| 提示容量超出免费额度 | 删除不需要的分享或取消遗留上传；详见首页容量保护说明 |

其他配置见 [环境变量](../README.md#配置)。上线前结束旧版本的未完成上传；修改分片大小后重新开始上传。所有方式都需要保留历史文件所在资源的绑定，才能继续读取旧分享。
