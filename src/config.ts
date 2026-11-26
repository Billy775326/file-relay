import type { Context } from 'hono';
import { num, type Env } from './types';
import { fileMode } from './filestore';
import { uploadPartSize } from './limits';
import { MAX_BATCH_FILES } from './batch';
import { publicUploadPolicy } from './upload-policy';

export async function configResponse(c: Context<{ Bindings: Env }>) {
  c.header('Cache-Control', 'no-store');
  return c.json({ fileBackend: fileMode(c.env) ?? 'none', metadataBackend: c.env.fileKV ? 'kv' : 'd1',
    ...await publicUploadPolicy(c), maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65_536), maxBatchFiles: MAX_BATCH_FILES, partSize: uploadPartSize(c.env) });
}
