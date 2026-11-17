# 后台 KV 用量

后台统计自动识别 `fileKV`。KV 的值大小不能通过绑定直接获取，因此用量来自 Cloudflare GraphQL `kvStorageAdaptiveGroups`，不会逐键读取生产数据。

在生产项目设置中添加 `CF_ACCOUNT_ID`、`CF_KV_NAMESPACE_ID`，后者必须对应绑定 `fileKV` 的命名空间。将拥有目标账户 Analytics Read 权限的 API Token 作为 Secret `CF_ANALYTICS_TOKEN` 保存，禁止放入前端或仓库。

界面显示最近三天内最新日期的字节峰值和键数量峰值（两项分别取峰值，不保证发生于同一时刻），标注 UTC 日期。这不是实时值，也不是账户全部命名空间的免费额度使用量；不参与上传容量判断。成功结果缓存五分钟，失败缓存三十秒，查询最长五秒。未绑定时不展示 KV 卡片；未配置和无数据时不会伪装成零。

参考：[Cloudflare KV Metrics and analytics](https://developers.cloudflare.com/kv/observability/metrics-analytics/)

KV 卡片同时显示当前命名空间用量和账户共享免费额度 1 GB。分母来自免费套餐标准，并非该命名空间独占的总容量；比例仅表示此空间占免费额度的份额，不能据此计算账户剩余容量。其他命名空间的占用未包含在分子中。

额度依据：[KV Pricing](https://developers.cloudflare.com/kv/platform/pricing/)、[KV Limits](https://developers.cloudflare.com/kv/platform/limits/)。
