/**
 * 文件存储抽象:大存储模式(R2,分片上传,单文件最大 2GB)
 * 或 小存储模式(KV 直存,单文件 ≤ KV_FILE_MAX,整个部署只需一个 KV 命名空间)。
 * 由 wrangler.jsonc 是否绑定 BUCKET 决定,免改代码切换。
 *
 * 键约定:KV 直存的文件键带 "f:" 前缀(与元数据 s:/会话 u: 隔离);
 * R2 模式的键是裸 uuid。读到旧键时按前缀路由,两模式的历史数据互不干扰。
 */
import { num, type Env } from './types';

export const KV_FILE_PREFIX = 'f:';
/** KV 单值上限 25 MiB,留编码/元数据余量取 24 MiB */
export const KV_FILE_MAX = 24 * 1024 * 1024;

export type FileBackend = 'r2' | 'kv';

export function fileMode(env: Env): FileBackend | null {
  if (env.BUCKET) return 'r2';
  if (env.fileKV) return 'kv';
  return null;
}

export function isKvFileKey(key: string): boolean {
  return key.startsWith(KV_FILE_PREFIX);
}

/** 当前模式的单文件上限 */
export function fileMaxSize(env: Env): number {
  const configured = num(env.MAX_FILE_SIZE, 2 * 1024 ** 3);
  return fileMode(env) === 'kv' ? Math.min(configured, KV_FILE_MAX) : configured;
}

/** 小存储模式:写入文件字节(KV put 接受 ArrayBuffer) */
export async function putFileBytes(env: Env, key: string, bytes: ArrayBuffer): Promise<void> {
  await env.fileKV!.put(key, bytes);
}

/** 取文件流:按键前缀路由到 KV 或 R2;不存在/后端未绑定返回 null(上层 410) */
export async function readFileStream(env: Env, key: string): Promise<ReadableStream | null> {
  if (isKvFileKey(key)) {
    if (!env.fileKV) return null;
    return env.fileKV.get(key, 'stream');
  }
  if (!env.BUCKET) return null;
  const obj = await env.BUCKET.get(key);
  return obj?.body ?? null;
}

/** 删文件:按键前缀路由;后端未绑定时静默跳过(仅元数据删除) */
export async function deleteFile(env: Env, key: string | null): Promise<void> {
  if (!key) return;
  if (isKvFileKey(key)) {
    if (env.fileKV) await env.fileKV.delete(key);
    return;
  }
  if (env.BUCKET) await env.BUCKET.delete(key);
}
