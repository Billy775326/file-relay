-- file-relay D1 初始化 schema
-- 执行: npx wrangler d1 execute file-relay --local --file=./schema/schema.sql
--       npx wrangler d1 execute file-relay --remote --file=./schema/schema.sql

-- 分享主表:文本与文件共用一张表,靠 kind 区分。
-- 不设 status 列:有效/过期/取完由 expire_at / pickup_count / max_pickups 惰性计算。
CREATE TABLE IF NOT EXISTS shares (
  id           TEXT PRIMARY KEY,             -- crypto.randomUUID()
  code         TEXT NOT NULL UNIQUE,         -- 6 位数字口令,UNIQUE 是防碰撞的最终裁决
  kind         TEXT NOT NULL CHECK (kind IN ('text','file')),
  filename     TEXT,                         -- 原始文件名,仅展示用
  size         INTEGER NOT NULL DEFAULT 0,   -- 字节;文本为字符数
  mime         TEXT,
  r2_key       TEXT UNIQUE,                  -- kind='file' 时必有;text 为 NULL
  text         TEXT,                         -- kind='text' 时必有;file 为 NULL
  max_pickups  INTEGER,                      -- NULL = 不限
  pickup_count INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,             -- epoch 毫秒
  expire_at    INTEGER                       -- NULL = 永久
);
CREATE INDEX IF NOT EXISTS idx_shares_expire  ON shares(expire_at);      -- 清理扫描用
CREATE INDEX IF NOT EXISTS idx_shares_created ON shares(created_at DESC); -- 管理列表用

-- 分片上传会话表:孤儿 multipart 的台账,cron 据此 abort。
-- 客户端只持有 id(session token),拿不到 upload_id / r2_key。
CREATE TABLE IF NOT EXISTS upload_sessions (
  id          TEXT PRIMARY KEY,
  upload_id   TEXT NOT NULL,                 -- R2 multipart uploadId
  r2_key      TEXT NOT NULL UNIQUE,
  filename    TEXT,
  mime        TEXT,
  size        INTEGER NOT NULL,              -- 声明的总大小,init 时已校验 ≤ MAX_FILE_SIZE
  parts       INTEGER NOT NULL,              -- ceil(size / PART_SIZE)
  expiry      TEXT,                          -- '1d' | '7d' | '30d' | 'forever'
  max_pickups INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON upload_sessions(created_at);
