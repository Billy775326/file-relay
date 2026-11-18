# 后台 KV 用量

[文档导航](README.md) | [部署指南](deployment.md) | [容量区别](operations.md#容量与免费额度)

后台自动识别 `fileKV` 绑定。绑定本身不能直接提供总字节数，具体统计通过 Cloudflare GraphQL Analytics 读取，不逐键读取生产内容。未绑定时不展示 KV 卡片；配置统计不是上传功能的前提。

## 配置步骤

1. 确认当前生产环境绑定 `fileKV` 的命名空间和所属 Cloudflare 账户。
2. 创建自定义 API Token，权限选择 **Account → Account Analytics → Read**，资源限定到目标账户。不要把管理员登录令牌当作 Analytics Token。[官方权限说明](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/)。
3. 在同一个 Pages/Worker 项目的 Variables and Secrets 添加：

| 名称 | 类型 | 填写内容 |
|---|---|---|
| `CF_ACCOUNT_ID` | Text | 目标账户的 32 位十六进制 ID |
| `CF_KV_NAMESPACE_ID` | Text | 实际绑定 `fileKV` 的 32 位十六进制命名空间 ID |
| `CF_ANALYTICS_TOKEN` | Secret | 上一步创建的只读 Token |

4. 保存并重新部署，使变量在运行环境生效。Production 与 Preview 分开配置；预览使用测试资源。
5. 登录后台刷新概览，查看用量与帮助提示中的键数、采样日期；也可查看管理员统计接口的 `kv` 字段。

Token 不放入前端、Git、URL 或日志；更换 Token 后重新应用生产配置。统计失败不应影响文件管理或替代上传准入检查。

## 显示的数字代表什么

| 字段 | 含义 |
|---|---|
| 用量 | 当前命名空间最近三天查询范围中，最新可用 UTC 日期的字节峰值 |
| 键数 | 同一日期的键数量峰值；与字节峰值不一定发生在同一时刻 |
| 采样日期 | Cloudflare 返回的 UTC 日期，不是浏览器本地日期 |
| 1 GB 分母 | 账户共享的 KV 免费存储参考，不是命名空间独享额度 |

项目查询 `kvStorageAdaptiveGroups` 的 `max.byteCount`、`max.keyCount` 与 `dimensions.date`。[官方 KV 统计示例](https://developers.cloudflare.com/kv/observability/metrics-analytics/)。

它是日峰值，不是实时用量；删除后数字可能暂时不下降。其他命名空间不计入分子，不能据此计算账户剩余免费空间，也不参与文件上传容量判断。[KV 额度与限制](https://developers.cloudflare.com/kv/platform/limits/)。

## 状态与缓存

| `kv.state` | 页面含义 | 检查方向 |
|---|---|---|
| `unbound` | 未绑定，不显示卡片 | 是否需要在该环境绑定 `fileKV` |
| `unconfigured` | 尚未配置完整统计 | 三项变量、ID 格式、实际部署环境 |
| `available` | 可显示数字 | `usedBytes`、`keyCount`、`sampleDate` |
| `unavailable` | 暂时无法获取 | 权限、有效期、账户/命名空间是否匹配、数据是否可用、网络 |

无数据和错误不伪装成零；只有有效统计明确返回 0 时才显示零。成功结果在 Worker 实例内缓存五分钟，失败缓存三十秒，单次查询最长五秒；并发同一查询共用进行中的请求。这不是全局统一缓存，不承诺每次刷新都立即访问 Analytics。

具体字段由 `GET /api/admin/stats` 的 `kv` 返回，含 `bound`、`state`、`source`、`quotaScope: "account"`、`freeQuotaBytes: 1000000000` 及可用的统计值。后台不会返回 Token 或 Cloudflare 原始错误详情。

## 验证与排障

先确认命名空间 ID 来自绑定资源而不是资源名称，再确认账户和 Token 权限；仅验证 Token 有效不代表有目标账户 Analytics 权限。配置修改后需部署，之后仍可能受实例缓存和数据延迟影响。

本地 `npm run test:kv-usage` 使用模拟 GraphQL 响应，验证状态、权限配置缺失、零值、缓存、并发及失败，不访问生产命名空间。真实统计是否可用应由当前生产接口确认，不能用模拟器结果替代。
