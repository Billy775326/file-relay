# 开发、构建与测试

[文档导航](README.md) | [部署指南](deployment.md) | [API 参考](api.md)

本文面向修改代码的开发者。所有命令从仓库根目录执行，使用本地模拟资源；生产部署另见部署指南。

## 环境与安装

| 工具 | 要求 |
|---|---|
| Node.js | 22+，仓库 `.node-version` 为 22 |
| npm | 使用 `package-lock.json`，通过 `npm ci` 安装 |
| Wrangler / TypeScript | 随项目开发依赖安装，不要求全局安装 |
| Python | 运行浏览器测试时需要，`python` 命令必须能导入 Playwright |
| Chromium | 通过 Playwright 安装，与所用 Playwright 版本匹配 |

```bash
npm ci
```

首次本地开发时，将 `.dev.vars.example` 复制为 `.dev.vars` 并编辑 `ADMIN_TOKEN`。已有本地配置时直接编辑，避免覆盖。文件已被 Git 忽略，不使用生产令牌：

```text
ADMIN_TOKEN=replace-with-your-local-random-token
# ADMIN_PATH=panel-local
```

启动：

```bash
npm run dev
```

部分测试（例如 `test:kv-usage`）直接导入 TypeScript，推荐使用 Node.js 22.18+ 或更新受支持版本，确保默认启用类型剥离；构建脚本声明的最低主版本仍为 22。[Node.js 版本说明](https://nodejs.org/api/typescript.html#type-stripping)。

默认读取 `wrangler.jsonc`，在本地模拟 KV。占位命名空间 ID 供模拟使用，不应替换成真实生产凭据。本地开发不需要为了使用模拟 KV 而登录 Cloudflare。

### 本地 R2 与 D1

- 测试大文件：启用 `wrangler.jsonc` 中的 `r2_buckets` 注释段，绑定名为 `BUCKET`，重启开发服务。
- 测试 D1 元数据：移除本地 `fileKV` 绑定，启用 `DB` 的 `d1_databases` 配置，再运行 `npm run db:local`。
- 测试 KV 文件 + D1 配额：同时保留 `fileKV` 和 `DB`，不绑定 R2。分享元数据仍在 KV，D1 保存原子配额、防护和审计状态。

本地模拟数据通常写入 `.wrangler/`，不同 worktree 或并行任务应使用独立运行目录与端口。`--remote` 数据库命令访问真实资源，不属于本地初始化步骤。

### 安装浏览器测试环境

建议在仓库外建立专用 Python 虚拟环境，避免环境目录混入代码：

```bash
python -m venv ../file-relay-test-venv
# Linux / macOS
source ../file-relay-test-venv/bin/activate
python -m pip install playwright
python -m playwright install chromium
```

Windows PowerShell 的激活命令为 `..\file-relay-test-venv\Scripts\Activate.ps1`。Node 测试脚本调用的是 `python`，因此激活环境后再运行表中的测试命令。Linux 若缺少浏览器系统库，按 Playwright 安装输出补充依赖；不要因环境缺失而跳过关键断言。

## 构建

```bash
npm run build:single
npm run build:pages
```

| 命令 | 输出 | 是否发布 |
|---|---|---|
| `build:single` | 完整内联页面与服务端的 `dist/worker.js` | 否，Wrangler 使用 `--dry-run` |
| `build:pages` | 上述产物及 `dist/pages/_worker.js` | 否 |
| `dev:pages` | 预览已生成的 `dist/pages` | 否 |
| `deploy` | 先构建，再通过 Wrangler 上传 Pages | 是 |

`dist/worker.js` 是仓库跟踪的预构建文件。修改程序、页面或构建工具后重新生成，并核对产物；仅修改文档时不应产生无关的产物差异。`public/` 不能单独部署成可工作的后端。

`dev:pages` 可能受到本地 Static Assets 优先路由影响。需要检查完整内联 Worker 的首页清理、上传与容量行为时，优先使用下面的 Miniflare 集成测试，而不是把本地静态层表现当作生产路由。

## 检查与测试

先按改动范围选择测试，不要求每次运行整张表。依赖构建产物的测试，应先执行 `npm run build:pages`。

### 基础检查

```bash
npx tsc --noEmit
node tools/check-i18n.mjs
npm run test:limits
npm run test:quota
```

### 按模块选择回归

| 改动范围 | 命令 | 主要验证 |
|---|---|---|
| 静态资源版本与缓存 | `npm run test:asset-version` | 构建标识、HTML/模块依赖版本 |
| 初始布局与刷新 | `npm run test:first-paint` | 暂停脚本加载时的布局、恢复后的交互 |
| 文件列表与分页 | `npm run test:admin-layout`、`npm run test:admin-filters` | 偏好、筛选、翻页、迟到响应、手机布局 |
| 脚本 Token CRUD | `npm run test:api` | 独立鉴权、文本/文件操作、ETag 并发、分片、容量回收与审计 |
| 审计 | `npm run test:audit` | 后台与公开业务日志、并发合并、筛选导出、保留、权限和写失败 |
| 安全防护 | `npm run test:security`、`npm run test:login-protection` | IP/地区/范围、限流、解封、并发与故障拒绝 |
| 来源与备注 | `npm run test:source` | 签名 Cookie、来源快照、迁移、隐私投影、弹窗 |
| 访客上传策略 | `npm run test:upload-policy` | 周额度、备注权限、会话归属、并发和重置 |
| R2 容量与上传 | `npm run test:quota-runtime` | 容量校验、实际元数据占用、流式上传、取消回收 |
| 过期清理 | `npm run test:retention` | 保留设置、旧记录、删除时机 |
| 文件下载与状态 | `npm run test:admin-download` | 存储检查、管理员下载、不消耗取件次数 |
| 文件预览 | `npm run test:preview` | 有限读取、编码/图片边界、权限与界面 |
| 编辑分享 | `npm run test:share-edit` | 状态联动、快照冲突、时区与失败输入保留 |
| KV 用量 | `npm run test:kv-usage` | GraphQL 响应、状态、缓存及展示 |

多数集成脚本使用隔离的 Miniflare/workerd、KV、R2、D1，其中包含界面的脚本还会启动 Python Playwright。它们不会读取生产凭据，也不把模拟器通过当作线上验收。

### 针对已启动服务的测试

`test/e2e_test.py` 和 `test/ui_smoke.py` 会上传、取件及删除测试数据，并可能生成超过一个分片大小的文件。默认仅用于隔离服务；R2 测试建议使用 5 MiB 的本地 `PART_SIZE`。

```bash
python test/e2e_test.py http://localhost:8787
python test/ui_smoke.py http://localhost:8787
```

API 测试需要通过 `FILE_RELAY_VISITOR_COOKIE` 提供已备注的测试访客 Cookie；管理员段从 `FILE_RELAY_ADMIN_TOKEN` 或 `.dev.vars` 读取令牌。`test:source` 已负责创建这些隔离夹具并调用 API 测试，通常比手动准备更方便。不要把生产域名当作无副作用的测试目标。

### 文档验证

核对相对文件链接与锚点、JSON 示例、npm 脚本名称和源码中的路由/默认值。外部平台事实应链接已阅读的官方文档。纯文档变更不需要重跑与内容无关的全部业务测试，也不将过去的测试记录写成本轮结果。

## 代码结构

| 目录 / 文件 | 职责 |
|---|---|
| `src/index.ts` | 路由、前置防护、静态页与定时入口 |
| `src/share.ts`、`src/upload.ts` | 分享/取件与 R2 分片生命周期 |
| `src/store*.ts` | KV / D1 分享、会话和备注存储 |
| `src/filestore.ts`、`src/quota.ts` | 文件读取、容量统计与预留 |
| `src/upload-policy.ts`、`src/upload-source.ts` | 周额度、签名访客关联与来源快照 |
| `src/security*.ts`、`src/login-protection.ts` | 访问规则、限流与登录封禁 |
| `src/audit.ts`、`src/public-audit.ts` | 审计存储、筛选与公开业务结果记录 |
| `src/settings.ts`、`src/cleanup.ts` | 后台设置与清理 |
| `src/file-preview.ts`、`src/kv-usage.ts` | 有限内容预览与只读 Analytics |
| `public/` | 页面、主题、前端交互和二维码模块 |
| `schema/` | 新建 D1 表结构与旧库增量迁移 |
| `tools/` | 资源版本、内联与产物生成 |
| `test/` | 隔离集成、界面和边界回归 |

## 页面启动与资源版本

发送、取件、后台的最终初始布局放在 HTML 中。`ui.js`、`ui-entry.js` 等模块负责增强交互；公共页面不加载后台专属控制器。不要通过脚本在启动后重排整页基础结构，避免刷新闪现旧布局。

构建对 `public/` 内容计算统一版本，加入 CSS/JS 链接及相对模块导入。`src/asset-resolver.ts` 返回 ETag、`X-File-Relay-Build`、浏览器 `no-cache` 和 CDN `no-store`。版本参数用于避免旧资源混用，不提供历史资源托管。域名缓存规则仍可能覆盖响应策略，线上排查见[更新检查](operations.md#页面更新与缓存)。

## 提交与交付

任务分支完成后，检查实际差异、凭据、构建产物与相关测试。提交使用英文 `type(scope): description`，用户变化写入 `CHANGELOG.md` 的 Unreleased。

Pages Git 集成的生产分支推送会触发部署。确认自动工作流与已有授权后再推送；普通代码提交不提升版本、不创建标签或 Release。文档提交、代码合并、正式发版与生产验收分别报告。
