/**
 * 元数据存储抽象:Workers KV(默认,免建 D1,最终一致)或 D1(可选,强一致)。
 * 选择规则见 getStore();接口面完全一致,路由层不感知后端差异。
 * 语义差异(仅 KV 模式,个人自用规模无感):
 *  - 取件计数是读改写,并发下可能超次数(D1 靠原子 UPDATE 强保证)
 *  - 口令唯一靠先查后写,理论上有碰撞窗口(D1 靠 UNIQUE 约束)
 */
import type { Env } from './types';
import { createD1Store } from './store-d1';
import { createKVStore } from './store-kv';

export interface ShareRecord {
  id: string;
  code: string;
  kind: 'text' | 'file';
  filename: string | null;
  size: number;
  mime: string | null;
  r2Key: string | null;
  text: string | null;
  maxPickups: number | null;
  pickupCount: number;
  createdAt: number;
  expireAt: number | null;
}

export interface NewShare {
  kind: 'text' | 'file';
  filename?: string | null;
  size: number;
  mime?: string | null;
  r2Key?: string | null;
  text?: string | null;
  maxPickups: number | null;
  expireAt: number | null;
}

export interface SessionRecord {
  id: string;
  uploadId: string;
  r2Key: string;
  filename: string | null;
  mime: string | null;
  size: number;
  parts: number;
  expiry: string | null;
  maxPickups: number | null;
  createdAt: number;
}

/** 管理列表行(字段够算状态 + 文本预览即可) */
export interface ShareListRow {
  id: string;
  code: string;
  kind: 'text' | 'file';
  filename: string | null;
  size: number;
  pickupCount: number;
  maxPickups: number | null;
  expireAt: number | null;
  createdAt: number;
  textPreview: string | null;
}

export interface ShareStats {
  total: number;
  files: number;
  texts: number;
  totalBytes: number;
  active: number;
  todayCreated: number;
}

export interface ShareStore {
  /** 创建分享(内部处理口令碰撞重试);closeSessionId 非空时原子关闭上传会话 */
  createShare(s: NewShare, closeSessionId?: string): Promise<{ id: string; code: string }>;
  getByCode(code: string): Promise<ShareRecord | null>;
  /**
   * 取件计数并返回记录(已 +1);返回 null = 未取走(口令不存在 / 已失效 /
   * textOnly 时口令对应的不是文本分享),具体原因由调用方 getByCode 后分类。
   */
  tryPickup(code: string, opts?: { textOnly?: boolean }): Promise<ShareRecord | null>;
  listShares(limit: number, offset: number): Promise<{ total: number; rows: ShareListRow[] }>;
  stats(todayStart: number): Promise<ShareStats>;
  deleteByCode(code: string): Promise<void>;
  createSession(s: SessionRecord): Promise<void>;
  getSession(id: string): Promise<SessionRecord | null>;
  deleteSession(id: string): Promise<void>;
  /** cron 专用:过期分享(含 R2 键)与孤儿会话 */
  listExpiredShares(now: number, limit: number): Promise<Array<{ code: string; r2Key: string | null }>>;
  deleteByCodes(codes: string[]): Promise<void>;
  listStaleSessions(now: number, ttlMs: number): Promise<SessionRecord[]>;
}

/** 惰性状态计算:不依赖任何落库状态字段 */
export function shareStatusOf(
  expireAt: number | null,
  maxPickups: number | null,
  pickupCount: number,
  now: number,
): 'active' | 'expired' | 'exhausted' {
  if (expireAt !== null && expireAt <= now) return 'expired';
  if (maxPickups !== null && pickupCount >= maxPickups) return 'exhausted';
  return 'active';
}

/** 后端选择:都绑定优先 KV(与默认配置一致);只绑 D1 走 D1 模式;都没有 index.ts 前置拦截 */
export function getStore(env: Env): ShareStore {
  if (env.fileKV) return createKVStore(env.fileKV);
  if (env.DB) return createD1Store(env.DB);
  throw new Error('未绑定 KV 或 D1:请在 wrangler.jsonc 配置二选一的元数据库');
}
