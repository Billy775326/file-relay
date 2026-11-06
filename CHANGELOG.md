# Changelog

## [Unreleased]

### Changed

- 默认单文件上限调整为 9.9 GB；已有部署需将 `MAX_FILE_SIZE` 改为 `9900000000` 或删除旧覆盖值。KV 仍受 25 MiB 限制。

### Added

- R2 上传前校验剩余容量，初始化成功和容量不足响应返回剩余可用字节数；空间不足弹窗显示具体剩余额度。
