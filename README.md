# 📦 file-relay 文件中转站

**简体中文** | [English](README.en.md)

以取件码分享文件与文本的自托管服务,基于 Cloudflare 原生技术栈实现:**默认仅需 Workers 与一个 KV 命名空间**,免费套餐即可运行;有较大文件需求(>24MB)时可加装 R2。

本项目为 [FileCodeBox](https://github.com/vastsa/FileCodeBox) 的 Cloudflare 等价替代:上传文件或文本,生成 6 位取件口令,对方凭口令取件。

支持三种部署方式:Pages + GitHub 自动构建、wrangler 命令行手动部署 Pages、免环境单文件粘贴(见「部署方式」)。注:`*.pages.dev` / `*.workers.dev` 域名在中国大陆无法直接访问,验证时需使用代理,或绑定自定义域名。

## 功能

- **文件分享(默认 KV 直传)**:单文件不超过 24MB,单请求直传,部署无需任何存储桶;有较大文件需求时可放开 `r2_buckets`,升级为 R2 分片上传,单文件上限约 2 GB,均无需修改代码
- **多文件批量分享**:一次选择最多 10 个文件,逐个顺序上传,每行独立进度,完成后逐张生成结果卡片,支持一键复制全部口令
- **文本分享**:粘贴文本生成口令,取件页一键复制
- **有效期**:1 天 / 7 天 / 30 天 / 永久 × 取件次数 1 / 5 / 不限,组合失效
- **取件二维码**:每个分享结果附带 `pickup` 链接二维码,扫码直达取件页
- **中英双语界面**:一键切换,按浏览器语言自动初始化,偏好持久保存
- **自动清理**:Workers cron 每 6 小时回收过期分享(R2 模式另清理孤儿分片会话);Pages 无 cron,改为打开首页自动节流清理(6h 窗口)+ 可选外部定时器;取件时惰性校验,清理异常不影响功能
- **管理后台**:令牌登录,提供统计、列表与删除;入口默认为 `/admin`,可通过 Secret `ADMIN_PATH` 自定义(设置后 `/admin` 返回 404,以防扫描)
- **配置切换免改代码**:文件存储默认 KV、R2 可选;元数据默认 KV、D1 可选,全部通过 wrangler.jsonc 切换
- 移动端适配、深色模式;上传含进度、速度与失败重试

## 存储选型:小存储模式(KV,默认)与大存储模式(R2)

**根据分享文件的大小选择文件存储**(由 wrangler.jsonc 是否放开 `r2_buckets` 决定,切换无需修改代码):

| | 📦 小存储模式(KV,**默认**) | 🗄️ 大存储模式(R2) |
|---|---|---|
| 单文件上限 | **24 MB**(KV 单值上限 25MiB,留余量) | **约 2 GB**(10MB 分片 multipart) |
| 部署资源 | **仅需一个 KV 命名空间** | R2 桶 + KV/D1 元数据 |
| 上传方式 | 单请求直传(含进度与重试) | 分片(进度、重试、可取消) |
| 免费存储额度 | 1 GB | 10 GB |
| 免费操作额度 | **写 1000 次/天** + 读 10 万次/天 | 写 100 万次/月 + 读 1000 万次/月 |
| 超额价格 | 写 $5/百万;读 $0.50/百万;存储 $0.50/GB·月 | 存储 $0.015/GB·月;写 $4.50/百万;读 $0.36/百万 |
| 出口流量 | 免费(但读操作计费) | **免费**(下载不产生带宽费用) |
| 适用场景 | **以小文件为主**(文档、图片、压缩包) | **以大文件为主**(百 MB 级、视频、安装包) |

要点:默认小存储模式,部署最简,日常传输文档与图片足够;KV 每次上传消耗 1-2 次写额度(免费 1000 次/天),重度或大文件场景可放开 `r2_buckets` 升级大存储模式(R2 免费额度对个人几乎用不完,下载无流量费用)。切换仅影响新分享,旧数据按存储键前缀自动路由,无需迁移。

### 元数据后端:KV(默认)与 D1(可选)

| | KV(默认) | D1(可选) |
|---|---|---|
| 一致性 | 最终一致(写后最长 60 秒全球可见) | **强一致** |
| 取件计数 | 读改写,极端并发可能超出次数 1-2 次 | 原子 UPDATE,**严格不超取** |
| 口令唯一 | 先查后写,存在理论碰撞窗口 | UNIQUE 约束,**严格唯一** |
| 免费额度 | 见上表 | 500 万行读/天 + 10 万行写/天 + 5GB |

个人自用、低并发场景两者无实际差异;多人共用或高并发取件建议切换 D1(建库后放开 wrangler.jsonc 的 `d1_databases`)。

**部署组合速查**:**默认 = 仅绑定 KV(文件与元数据共用一个命名空间,配置最简)** | 大文件需求 = 放开 r2_buckets(R2 + KV)| 需要强一致 = R2 + D1

### 免费额度与收费标准(2026,以[官方定价页](https://developers.cloudflare.com/workers/platform/pricing/)为准)

| 资源 | 免费套餐额度 | 超额/付费价格 |
|---|---|---|
| Workers | 10 万请求/天 | Workers Paid **$5/月**:1000 万请求/月,超出 $0.30/百万 |
| KV 读 | 10 万次/天 | 付费 $0.50/百万(含 1000 万/月) |
| KV 写/删/列表 | 各 1000 次/天 | 付费 $5/百万(各含 100 万/月) |
| KV 存储 | 1 GB | $0.50/GB·月 |
| D1 行读 | 500 万行/天 | 付费 $0.001/百万行(含 250 亿/月) |
| D1 行写 | 10 万行/天 | 付费 $1/百万行(含 5000 万/月) |
| D1 存储 | 5 GB | $0.75/GB·月 |
| R2 存储 | 10 GB | $0.015/GB·月 |
| R2 Class A(写) | 100 万次/月 | $4.50/百万 |
| R2 Class B(读) | 1000 万次/月 | $0.36/百万 |
| R2 出口流量 | **无限,永久免费** | —— |

KV 模式下每次取件约消耗 1 次读 + 1 次写:免费额度每天 1000 次写,个人使用充足;若分享量达到千级,可考虑 $5/月的 Workers Paid 或切换 D1(读额度宽裕得多)。

## 部署方式

| 方式 | 适用场景 | 特点 |
|---|---|---|
| [方式一](#方式一pages--github-连接自动构建) Pages + GitHub 连接 | 需要 push 即部署 | 自动构建,绑定全在控制台配置、永不被部署覆盖 |
| [方式二](#方式二wrangler-命令行手动部署-pages) wrangler 命令行 | 具备 Node.js 环境 | 手动部署 Pages,一条命令上传产物 |
| [方式三](#方式三单文件部署控制台粘贴免-github-与-node) 单文件粘贴 | 不安装 Node、不连接 Git | 整个服务打包为一个 worker.js,控制台粘贴即可使用 |

> 三种方式跑的是同一套代码:`build:pages` 产出的 `dist/pages/_worker.js`(Pages 用)与 `dist/worker.js`(粘贴用)同源同行为。**Pages 的绑定(KV/变量)存在项目设置里、与部署解耦**——部署一万次也不会清掉控制台手动配的绑定,无需在仓库里维护资源 ID;方式三同理。仅当你自行沿用旧的 `wrangler deploy`(Workers)流程时,才有「未写进 wrangler.jsonc 的绑定被部署清除」的问题(见 FAQ)。

### 方式一:Pages + GitHub 连接(自动构建)

无需安装 Node 的网页部署方式,**仓库不需要修改任何配置**。仓库连接 Cloudflare Pages 后,每次 `git push` 自动重新构建部署(免费构建额度对个人充足)。

#### 1. 推送到 GitHub

将本仓库推送至自己的 GitHub 账号(私有或公开均可)。

#### 2. 创建 KV 命名空间(必需;默认模式下文件与元数据均存储于此)

控制台左侧 **Storage & Databases → KV → Create namespace**,名称如 `file-relay-meta`。命名空间本身不需要把 ID 填进仓库——稍后在 Pages 控制台绑定它。

#### 3.(可选)创建 R2 / D1 资源

默认小存储模式可跳过本步骤:

- **R2(需传输 >24MB 大文件)**:**Storage & Databases → R2 → Create bucket**(首次使用 R2 可能要求绑定付款方式)
- **D1(需要强一致元数据)**:**Storage & Databases → D1 → Create database**,创建后进入该库的 **Console** 标签页,将仓库 `schema/schema.sql` 全文粘贴执行以建表

#### 4. 连接仓库并首次构建

1. 控制台 **Workers & Pages → Create → Pages → Connect to Git**(新版界面在 Compute → Pages 标签下)
2. 首次将跳转 GitHub 授权:安装 **Cloudflare Pages** App 并勾选本仓库(私有仓库选择 *Only select repositories* 即可)
3. 返回 Cloudflare 选中仓库,项目名保持 `file-relay`,构建配置:
   - **Framework preset**:None
   - **Build command**:`npm run build:pages`
   - **Build output directory**:`dist/pages`
4. 点击 **Save and Deploy**,约 1 分钟完成。产物为单文件 `dist/pages/_worker.js`(Pages 高级模式:全部请求先进 Worker,前端页面已内联),静态文件无需单独上传

#### 5. 配置绑定与变量(部署后进行,一次配好永不被覆盖)

- **Settings → Functions → KV namespace bindings → Add binding**:Variable name `fileKV`(必须一致),Namespace 选中第 2 步创建的命名空间,Environment 选 Production(需要预览环境调试可再给 Preview 配一次)
- **Settings → Variables and Secrets → Add**:类型 **Secret**,名称 `ADMIN_TOKEN`,值为强随机串(本地有 OpenSSL 可用 `openssl rand -base64 24` 生成,亦可使用密码管理器);(可选)`ADMIN_PATH` 自定义管理入口(如 `panel-x7k9`,设置后 `/admin` 返回 404)
- 各项 vars 均有代码默认值,可不设置;如需覆盖,以纯文本变量(非 Secret)添加同名条目即可
- 大文件 / 强一致模式:在同一 **Functions** 绑定页加 `BUCKET`(R2 桶)或 `DB`(D1 库)

Pages 的绑定与环境变量属于项目设置,**只上传产物的部署不会碰它们**;此后每次 push 自动部署都无需再管。

#### 6. 定时清理(Pages 没有 Cron Triggers)

过期分享有惰性检查兜底,**功能正确性不依赖清理**——过期/取完的分享不会被取到;清理只负责回收存储。Pages 不支持 Cron Triggers,补偿机制叠加生效:

- **访问即清理(自动)**:每次有人打开首页,后台顺带执行一次节流清理(6 小时窗口内最多真正执行一次,后台运行不影响页面速度)——常用站点无需任何额外配置
- **外部定时器**(可选,低流量站点兜底):[cron-job.org](https://cron-job.org) / UptimeRobot / 本地 cron,每 6 小时请求一次:

  ```bash
  curl -X POST https://<项目名>.pages.dev/api/admin/cleanup -H "Authorization: Bearer <ADMIN_TOKEN>"
  ```

  返回 `{"ok":true,"deletedShares":n,"abortedSessions":n}`
- **手动**:管理页登录后同样调用上述接口(cookie 鉴权即可)

#### 7. 验证与日常更新

- 访问 `https://<项目名>.pages.dev`:发送一条文本分享并成功取件即部署完成;管理后台默认位于 `/admin`(设置 ADMIN_PATH 则为 `/<该值>`),使用 ADMIN_TOKEN 登录
- 此后每次向 `main` 推送即自动部署新版本;绑定与变量始终在控制台管理,不受部署影响

### 方式二:wrangler 命令行(手动部署 Pages)

```bash
# 0. 前置条件:Node.js ≥ 18;克隆本仓库后安装依赖
npm install

# 1. 登录 Cloudflare(浏览器授权)
npx wrangler login

# 2. 构建 Pages 产物(= build:single + 复制为 dist/pages/_worker.js)
npm run build:pages

# 3. 部署到 Pages(首次会询问项目名,如 file-relay;之后直接更新)
npm run deploy

# 4.(可选)本地创建 KV/R2/D1 资源,替代控制台手点:
npx wrangler kv namespace create file-relay-meta
npx wrangler r2 bucket create file-relay
npx wrangler d1 create file-relay && npm run db:remote   # D1 建库+建表;本地调试 npm run db:local
```

部署完成后获得 `https://<项目名>.pages.dev`。**`wrangler pages deploy` 只上传构建产物、不上传绑定**——KV 与变量仍按方式一第 5 步在控制台配置(一次配好,后续部署不覆盖),ADMIN_TOKEN 也可以用 `npx wrangler pages secret put ADMIN_TOKEN` 代替控制台添加。定时清理同方式一第 6 步。

本地开发:`npm run dev`(仓库模式,直接热更新 TS 源码 + `public/`;追加 `--test-scheduled` 后访问 `/__scheduled` 可手动触发 cron 逻辑)。调试 Pages/单文件产物形态:`npm run build:pages && npm run dev:pages`。端到端测试:`python test/e2e_test.py`(默认请求 `http://localhost:8787`,可通过 BASE 参数指定目标地址)。

> ⚠️ `wrangler pages dev` 会把 wrangler.jsonc 的 `assets`(./public)并入本地静态资产层,Pages 静态优先——本地 `/` 等页面路径不进 Worker(与生产行为相反:生产产物 dist/pages 只有 _worker.js,所有请求都先进 Worker)。调试首页触发的清理逻辑时,需临时移走 wrangler.jsonc 再启动 pages dev。

### 方式三:单文件部署(控制台粘贴,免 GitHub 与 Node)

整个服务(后端与全部前端页面)打包为**一个 `worker.js`**,粘贴至控制台编辑器即可运行——适合不便连接 Git 或安装 Node 的环境。纯控制台部署没有配置文件,绑定与 Secret 均在控制台管理,不存在前述「部署清除绑定」问题。

#### 1. 获取 worker.js

直接使用仓库内已构建的 [dist/worker.js](dist/worker.js)(约 240 KB)。如需在代码修改后重新生成:

```bash
npm install
npm run build:single     # 产出 dist/worker.js
```

仓库中的 `dist/worker.js` 与源码同步维护;自行修改代码后需重新构建并替换该文件,以保持两者一致。

#### 2. 控制台创建并粘贴

1. **Compute (Workers) → Create → Create Worker**(默认 Hello World 模板即可),名称如 `file-relay`
2. 部署后进入 **Edit code**,清空编辑器,粘贴 `dist/worker.js` 全文,点击 **Deploy**

#### 3. 控制台配置

1. **Settings → Bindings → Add → KV namespace**:变量名必须为 `fileKV`,选中目标命名空间(必需)
2. **Settings → Variables and Secrets → Add → Secret**:`ADMIN_TOKEN`(必需);可选 `ADMIN_PATH` 自定义管理入口
3. **Settings → Triggers & Events → Cron Triggers → Add**:`0 */6 * * *`(每 6 小时清理过期分享)
4. 各项 vars 均有代码默认值,可不设置;如需覆盖默认值,在 **Variables and Secrets** 中以纯文本变量(非 Secret)形式添加同名条目即可;如需大文件或强一致,再绑定 `BUCKET`(R2)/ `DB`(D1)

#### 4. 验证

访问 `https://<worker名>.<子域>.workers.dev`,发送一条文本分享并成功取件即部署完成。

> **模式取舍**:三种方式功能完全一致且同一代码源——方式一/二(Pages)与方式三(Workers 粘贴)都是前端内联的单文件形态,修改页面后:Pages 走 push 自动构建(或重跑 `npm run build:pages` + deploy),粘贴模式需重新 `build:single` 并整文件替换。绑定同一个 KV 命名空间时,取件口令与数据跨方式互通。

## API 接口

除网页操作外,全部功能均可编程调用。参数约定:`expiry` 取值 `1d | 7d | 30d | forever`;`maxPickups` 取 1-999 或 `null`(不限次)。错误统一返回 `{error, message}`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/config` | 当前上传模式与限额(KV 模式 `fileBackend=kv`) |
| POST | `/api/shares/text` | 创建文本分享,返回 `{code, expireAt, …}` |
| POST | `/api/shares/file` | KV 模式文件直传(query 传 `filename`/`mime`/`expiry`/`maxPickups`,请求体为文件字节,≤24MB) |
| POST | `/api/pickup` | 凭口令取件:文本直接返回内容;文件返回元数据(此步不计数) |
| GET | `/api/pickup/:code/download` | 下载文件(此步计数) |
| POST | `/api/uploads/init` 等 | R2 大存储模式分片上传四端点(init / `:id/parts/:n` / complete / abort) |
| POST | `/api/admin/login` 等 | 管理接口(HMAC 签名 cookie 鉴权):`stats`、`shares` 列表、`DELETE shares/:code` 按口令删除 |
| POST | `/api/admin/cleanup` | 手动/外部定时触发清理(Pages 无 Cron 的补偿通道):管理 cookie 或 `Authorization: Bearer <ADMIN_TOKEN>` 鉴权,返回 `{ok, deletedShares, abortedSessions}` |

调用示例:

```bash
# 文本分享 → {"code":"376966","expireAt":…}
curl -X POST https://<你的域名>/api/shares/text \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello file-relay","expiry":"7d","maxPickups":null}'

# 凭口令取件
curl -X POST https://<你的域名>/api/pickup \
  -H 'Content-Type: application/json' -d '{"code":"376966"}'

# 文件直传(KV 模式,单文件 ≤24MB)
curl -X POST 'https://<你的域名>/api/shares/file?filename=doc.zip&mime=application/zip&expiry=1d&maxPickups=5' \
  --data-binary @doc.zip
```

## 配置(环境变量 `vars`)

所有 var 均有代码默认值,不设置亦可运行;标注 ❌ 者仅 R2 大存储模式使用,小存储(KV)模式可整体删除。

| 变量 | 默认 | 适用 | 说明 |
|---|---|---|---|
| MAX_FILE_SIZE | 2 GiB | 两模式 | 单文件上限;KV 模式实际取 min(该值, 24MB) |
| MAX_TEXT_LENGTH | 65536 | 两模式 | 文本字符上限 |
| PART_SIZE | 10 MiB | 仅 R2 ❌ | 分片大小(非末片须 ≥5MB,且 <100MB 请求体限制) |
| SESSION_TTL_MS | 24h | 仅 R2 ❌ | 孤儿分片会话判定阈值 |
| MAX_PARTS | 10000 | 仅 R2 ❌ | R2 分片数上限 |

ADMIN_TOKEN 为 Secret(Pages 在控制台 Variables and Secrets 添加,或 `npx wrangler pages secret put ADMIN_TOKEN`;粘贴模式在控制台添加),任何模式均需设置。

### Secrets

| Secret | 必需 | 说明 |
|---|---|---|
| `ADMIN_TOKEN` | 是 | 管理后台登录令牌(强随机串) |
| `ADMIN_PATH` | 可选 | 自定义管理入口:取值为字母/数字/`-`/`_` 组成的单段路径(1-64 位,如 `panel-x7k9`),设置后后台入口变为 `https://…/<该值>`,`/admin` 与 `/admin.html` 一律返回 404,以防被扫描;未设置则默认 `/admin`。请勿与 `/pickup`、`/api` 等现有路径同名。此 Secret 仅隐藏登录页,`/api/admin/*` 接口本身始终受 ADMIN_TOKEN 保护 |

## 设计取舍(已知边界)

- **不支持断点续传**:刷新或关闭页面即放弃本次上传(R2 模式会尽力中止服务端会话,剩余依赖 cron 兜底)
- **下载即计数**:次数限制按「开始下载」计,中途取消亦消耗(防止并发超取的必要代价);文本查看即计数,文件可先查看卡片再决定下载
- **取件完成后不立即删除文件**:文件(KV 键/R2 对象)保留至自然过期或管理员删除,取件人可看到「次数已用完」而非「口令不存在」
- 口令为 6 位数字(100 万空间):D1 依赖 UNIQUE 约束并以碰撞换码;KV 采用先查后写,极端并发下存在理论碰撞窗口
- KV 模式取件计数为读改写,极端并发下可能超出次数上限 1-2 次(个人使用无感知)

## 常见问题

- **接口返回 500「未绑定元数据库」**:未配置 KV/D1 绑定。三种部署方式的绑定都在控制台配置(Pages:Settings → Functions;粘贴:Settings → Bindings),且不会被部署覆盖——若你额外自行沿用旧的 `wrangler deploy`(Workers)流程,注意它以 wrangler.jsonc 为绑定唯一来源,未写入配置的绑定会被移除
- **忘记 ADMIN_TOKEN**:Secret 不可查看,只能重设——Pages 在控制台 Variables and Secrets 重新编辑(或 `npx wrangler pages secret put ADMIN_TOKEN`),粘贴模式在 Worker 设置中重新编辑。重设后已登录的管理会话即失效
- **中国大陆无法访问 `*.pages.dev` / `*.workers.dev`**:属预期现象;验证需使用代理,或绑定自定义域名后直连
- **切换存储模式是否影响已有分享**:不影响。存储键按前缀自动路由(`f:` 前缀为 KV 文件,裸 uuid 为 R2 对象),新旧数据并存,无需迁移
- **KV 写额度耗尽**:当日新分享创建失败,已有分享的读取与下载不受影响,次日额度自动重置;亦可持续大用量场景切换 D1 或升级付费套餐

## 结构

```
src/          Hono Worker:store(KV/D1 双后端)/ share(取件下载 + KV 直传)/ upload(R2 分片,大存储模式)/ admin / cleanup(cron + cleanup 接口 + 首页触发节流清理)
              asset-resolver.ts 静态资源双模式(Static Assets / 单文件内联);standalone.ts 单文件部署入口
public/       原生 JS 三页面(发送 / 取件 / 管理),本地 wrangler dev 由 Static Assets 托管,部署形态内联进 _worker.js
dist/         build:single 产物 worker.js(已入库,用于方式三粘贴);build:pages 复制为 dist/pages/_worker.js(方式一/二 Pages 部署)
tools/        构建(内联生成 / 收尾 / Pages 复制)与 i18n 校验脚本
schema/       D1 初始化 SQL(仅切换 D1 元数据后端时需要,默认不用)
test/         Python 端到端测试
```

## 致谢

- **[FileCodeBox](https://github.com/vastsa/FileCodeBox)** —— 本项目的灵感来源与产品原型
- **[Hono](https://github.com/honojs/hono)** —— 轻量高性能的边缘 Web 框架
- **[Wrangler](https://github.com/cloudflare/workers-sdk)** / **[@cloudflare/workers-types](https://github.com/cloudflare/workers-types)** —— Cloudflare Workers 官方工具链与类型
- 托管于 [Cloudflare Workers](https://workers.cloudflare.com/) / [Workers KV](https://developers.cloudflare.com/kv/) / [R2](https://developers.cloudflare.com/r2/)(可选)/ [D1](https://developers.cloudflare.com/d1/)(可选)

## 许可证

[MIT](LICENSE)
