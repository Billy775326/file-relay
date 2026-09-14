# 📦 file-relay 文件中转站

像取快递一样取文件的自托管分享服务,Cloudflare 原生技术栈(Workers + R2 + KV/D1),免费套餐可跑。

FileCodeBox 的 CF 等价替代:上传文件或文本 → 生成 6 位取件口令 → 对方输入口令取件。

## 功能

- **文件分享,双存储模式**:默认小存储模式 KV 直传(单文件 ≤24MB,部署只需一个 KV 命名空间);放开 `r2_buckets` 升级大存储模式 R2 分片上传,单文件最大 **2 GB**
- **文本分享**:粘贴文本生成口令,取件页一键复制
- **有效期**:1 天 / 7 天 / 30 天 / 永久 × 取件次数 1 / 5 / 不限,组合失效
- **自动清理**:cron 每 6 小时回收过期分享与孤儿分片;取件时惰性校验,cron 挂了功能也不受影响
- **管理后台** `/admin`:令牌登录,统计 + 列表 + 删除
- **配置切换免改代码**:文件存储 R2/KV 二选一,元数据 KV/D1 二选一,全在 wrangler.jsonc
- 中文 UI、移动端适配、深色模式;上传带进度/速度/分片重试

## 存储选型:小存储模式(KV,默认)vs 大存储模式(R2)

**按分享文件的大小选文件存储**(wrangler.jsonc 是否放开 `r2_buckets` 决定,免改代码切换):

| | 📦 小存储模式(KV,**默认**) | 🗄️ 大存储模式(R2) |
|---|---|---|
| 单文件上限 | **24 MB**(KV 单值上限 25MiB,留余量) | **~2 GB**(10MB 分片 multipart) |
| 部署资源 | **只需一个 KV 命名空间**(免建桶) | R2 桶 + KV/D1 元数据 |
| 上传方式 | 单请求直传(带进度/重试) | 分片(进度/重试/可取消) |
| 免费存储额度 | 1 GB | 10 GB |
| 免费操作额度 | **仅 1000 写/天** + 10 万读/天 | 100 万写/月 + 1000 万读/月 |
| 超额收费 | 写 $5/百万;读 $0.50/百万;存储 $0.50/GB·月 | $0.015/GB·月;写 $4.50/百万;读 $0.36/百万 |
| 出口流量 | 免费(但读操作计费) | **免费**(下载不花带宽钱) |
| 适用 | **小文件为主**(文档、图片、压缩包) | **大文件为主**(百 MB 级、视频、安装包) |

要点:默认小存储——部署最简(一个 KV 全搞定),日常传文档/图片够用;KV 每次上传消耗 1-2 次写额度(免费 1000 次/天),重度或大文件场景放开 `r2_buckets` 升级大存储(R2 免费额度对个人几乎用不完,下载零流量费)。切换只影响新分享,旧数据按存储键前缀自动路由,无需迁移。

### 元数据后端:KV(默认)vs D1

| | KV(默认) | D1(可选) |
|---|---|---|
| 一致性 | 最终一致(写后最长 60s 全球可见) | **强一致** |
| 取件计数 | 读改写,极端并发可能超次数 1-2 次 | 原子 UPDATE,**硬保证不超取** |
| 口令唯一 | 先查后写,理论碰撞窗口 | UNIQUE 约束,**硬保证** |
| 免费额度 | 见上表 | 500 万行读/天 + 10 万行写/天 + 5GB |

个人自用低并发,两者无实际差异;多人共用/高并发取件切 D1(建库后放开 wrangler.jsonc 的 `d1_databases`)。

### 收费参考(2026,以 [官方定价页](https://developers.cloudflare.com/workers/platform/pricing/) 为准)

- Workers 免费版 10 万请求/天;Workers Paid **$5/月** 含 1000 万请求/月,超额 $0.30/百万
- R2 / KV / D1 免费额度见上两表,超出按表内价格计费;R2 出口流量永久免费

**部署组合速查**:**默认 = 只绑 KV(文件+元数据一个命名空间,最简)** | 大存储 = 放开 r2_buckets(R2 + KV)| 大存储强一致 = R2 + D1

### 免费额度与收费(2026 年,以 [官方定价页](https://developers.cloudflare.com/workers/platform/pricing/) 为准)

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

KV 模式下每次取件 ≈ 1 读 + 1 写:免费额度每天 1000 次写,个人使用绰绰有余;若分享量上千再考虑 $5/月的 Workers Paid 或切 D1(读额度宽裕得多)。

## 手动部署

### 方式一:wrangler 命令行(推荐)

```bash
# 0. 前置:Node.js ≥ 18;克隆本仓库后安装依赖
npm install

# 1. 登录 Cloudflare(浏览器授权)
npx wrangler login

# 2.(可选,大存储模式才需要)建 R2 桶并放开 wrangler.jsonc 的 r2_buckets 块
#    首次用 R2 需在控制台开通过一次,可能要求绑卡
npx wrangler r2 bucket create file-relay
#    名字被占就换名,同步改 wrangler.jsonc 的 r2_buckets.bucket_name

# 3. 建 KV 命名空间(存元数据,默认后端)
npx wrangler kv namespace create file-relay-meta
#    把输出的 id 填进 wrangler.jsonc 的 kv_namespaces[0].id

# 4. 设置管理令牌(强随机串,自己生成,例如 openssl rand -base64 24)
npx wrangler secret put ADMIN_TOKEN

# 5. 部署(会自动上传静态资源、注册 cron)
npm run deploy

# 6.(可选)切 D1 后端:建库并初始化表结构,再改 wrangler.jsonc(注释 KV、放开 D1)
npx wrangler d1 create file-relay          # database_id 填进 wrangler.jsonc
npm run db:remote                          # 远端建表;本地调试用 npm run db:local
```

部署完成后得到 `https://<worker名>.<子域>.workers.dev`;管理后台在 `/admin`,令牌即第 4 步设置的值。

### 方式二:Cloudflare 控制台(GitHub 连接)

不想装 Node 的话:把本仓库推到 GitHub → 控制台 Workers & Pages → Create → 连接该仓库(Cloudflare 会自动识别 `wrangler.jsonc` 构建)→ 在 Worker 的 Settings 里手动添加绑定:

- **KV namespace**:`KV` → 新建 `file-relay-meta`(默认小存储模式,文件+元数据都用它)
- **R2 bucket**(可选,大存储模式):`BUCKET` → 新建桶 `file-relay`,并放开 `wrangler.jsonc` 的 `r2_buckets` 块
- **Secret**:`ADMIN_TOKEN` → 你的强随机串
- **Cron**:Triggers 里确认 `0 */6 * * *`

### 注意事项

- **大陆访问**:`*.workers.dev` 被墙,需代理访问;绑定自有域名(Custom Domains)通常可直连
- **workers.dev 防护**会拦截非浏览器 UA 的脚本请求(error 1010),自动化测试需自定义 User-Agent
- 本地开发:`npm run dev`(`--test-scheduled` 后访问 `/__scheduled` 可手动触发 cron)
- 端到端测试:`python test/e2e_test.py`(默认打 `http://localhost:8787`,可传 BASE 参数)

## 配置(wrangler.jsonc `vars`)

| 变量 | 默认 | 说明 |
|---|---|---|
| MAX_FILE_SIZE | 2 GiB | 单文件上限 |
| MAX_TEXT_LENGTH | 65536 | 文本字符上限 |
| PART_SIZE | 10 MiB | 分片大小(非末片须 ≥5MB,<100MB 请求体限制) |
| SESSION_TTL_MS | 24h | 孤儿分片会话判定 |
| MAX_PARTS | 10000 | R2 分片数上限 |

## 设计取舍(已知边界)

- **不支持断点续传**:刷新/关页即放弃本次上传(会尽力 abort 服务端会话,剩余靠 cron 兜底)
- **下载即计数**:次数限制按"开始下载"计,中途取消也消耗(防并发超取的必要代价);文本查看即计数,文件可先看卡片再决定下载
- **取完不立即删文件**:R2 对象保留到自然过期或管理员删除,取件人能看到"次数已用完"而非"口令不存在"
- 口令 6 位数字(100 万空间):D1 靠 UNIQUE 约束 + 碰撞换码;KV 靠先查后写,极端并发下存在理论碰撞窗口
- KV 模式取件计数为读改写,极端并发下可能超出次数上限 1-2 次(个人使用无感)

## 结构

```
src/          Hono Worker:store(KV/D1 双后端) / upload(分片) / share(取件下载) / admin / cleanup(cron)
public/       原生 JS 三页面(发送 / 取件 / 管理),Workers Static Assets 托管
schema/       D1 初始化 SQL(KV 模式不需要)
test/         Python 端到端测试
```

## 致谢

- **[FileCodeBox](https://github.com/vastsa/FileCodeBox)** —— 本项目的灵感来源与产品原型
- **[Hono](https://github.com/honojs/hono)** —— 轻量高性能的边缘 Web 框架
- **[Wrangler](https://github.com/cloudflare/workers-sdk)** / **[@cloudflare/workers-types](https://github.com/cloudflare/workers-types)** —— Cloudflare Workers 官方工具链与类型
- 托管于 [Cloudflare Workers](https://workers.cloudflare.com/) / [R2](https://developers.cloudflare.com/r2/) / [Workers KV](https://developers.cloudflare.com/kv/) / [D1](https://developers.cloudflare.com/d1/)
