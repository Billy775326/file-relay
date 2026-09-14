# 📦 file-relay 文件中转站

像取快递一样取文件的自托管分享服务,Cloudflare 原生技术栈(Workers + R2 + D1),免费套餐可跑。

FileCodeBox 的 CF 等价替代:上传文件或文本 → 生成 6 位取件口令 → 对方输入口令取件。

## 功能

- **文件分享**:分片上传(R2 multipart),单文件最大 **2 GB**,不受 Worker 免费版 100MB 请求体限制
- **文本分享**:粘贴文本生成口令,取件页一键复制
- **有效期**:1 天 / 7 天 / 30 天 / 永久 × 取件次数 1 / 5 / 不限,组合失效
- **自动清理**:cron 每 6 小时回收过期分享与孤儿分片;取件时惰性校验,cron 挂了功能也不受影响
- **管理后台** `/admin`:令牌登录,统计 + 列表 + 删除
- 中文 UI、移动端适配、深色模式;上传带进度/速度/分片重试

## 部署

```bash
npm install
npx wrangler login                                    # 首次
npx wrangler r2 bucket create file-relay              # 名字被占则换名并同步改 wrangler.jsonc
npx wrangler d1 create file-relay                     # 把输出的 database_id 填进 wrangler.jsonc
npm run db:remote                                     # 初始化生产库(本地调试用 npm run db:local)
npx wrangler secret put ADMIN_TOKEN                   # 设置管理令牌(强随机串)
npm run deploy
```

本地开发:`npm run dev`(`--test-scheduled` 后访问 `/__scheduled` 可手动触发 cron)。
端到端测试:`python test/e2e_test.py`(需先 `npm run db:local` + `npm run dev`)。

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
- 口令 6 位数字(100 万空间),UNIQUE 约束 + 碰撞自动换码重试

## 结构

```
src/        Hono Worker:upload(分片) / share(取件下载) / admin / cleanup(cron)
public/     原生 JS 三页面(发送 / 取件 / 管理),Workers Static Assets 托管
schema/     D1 初始化 SQL
```
