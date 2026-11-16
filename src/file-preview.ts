import type { Env } from './types';
import { readFilePrefix } from './filestore';

export const TEXT_PREVIEW_BYTES = 64 * 1024;
export const IMAGE_PREVIEW_BYTES = 2 * 1024 * 1024;
export const IMAGE_PREVIEW_PIXELS = 16_000_000;
const TEXT_EXTENSIONS = new Set('txt log md csv json xml html htm css js mjs cjs ts tsx jsx py sh sql yaml yml toml ini conf cfg c cpp h java rs go bat ps1'.split(' '));
type Preview = { kind: 'text' | 'csv'; text: string; truncated: boolean }
  | { kind: 'unsupported'; reason: 'type' | 'size' | 'encoding' | 'image' }
  | { kind: 'image'; bytes: Uint8Array; mime: string; width: number; height: number };

/** Inspect raster headers before allowing browser decoding. SVG/HTML are never served as images. */
function imageInfo(b: Uint8Array): { mime: string; width: number; height: number } | null {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ascii = (at: number, n: number) => String.fromCharCode(...b.subarray(at, at + n));
  if (b.length >= 24 && b[0] === 137 && ascii(1, 7) === 'PNG\r\n\x1a\n' && ascii(12, 4) === 'IHDR') {
    let at = 8;
    while (at + 12 <= b.length) {
      if (ascii(at + 4, 4) === 'acTL') return null;
      const length = v.getUint32(at);
      if (length > b.length - at - 12) return null;
      at += 12 + length;
    }
    return { mime: 'image/png', width: v.getUint32(16), height: v.getUint32(20) };
  }
  if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
    let at = 2;
    while (at + 4 <= b.length) {
      if (b[at++] !== 255) return null;
      while (b[at] === 255) at++;
      const marker = b[at++];
      if (marker === 218 || marker === 217 || at + 2 > b.length) return null;
      const size = v.getUint16(at);
      if (size < 2 || at + size > b.length) return null;
      if ([192, 193, 194].includes(marker) && size >= 8) {
        return { mime: 'image/jpeg', height: v.getUint16(at + 3), width: v.getUint16(at + 5) };
      }
      at += size;
    }
  }
  if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const type = ascii(12, 4);
    if (type === 'VP8X') {
      if (b[20] & 2) return null; // Animated WebP is outside the bounded still-image preview.
      const u24 = (i: number) => b[i] | b[i + 1] << 8 | b[i + 2] << 16;
      return { mime: 'image/webp', width: 1 + u24(24), height: 1 + u24(27) };
    }
    if (type === 'VP8 ' && b[23] === 157 && b[24] === 1 && b[25] === 42) {
      return { mime: 'image/webp', width: v.getUint16(26, true) & 16383, height: v.getUint16(28, true) & 16383 };
    }
    if (type === 'VP8L' && b[20] === 47) {
      const bits = v.getUint32(21, true);
      return { mime: 'image/webp', width: 1 + (bits & 16383), height: 1 + ((bits >>> 14) & 16383) };
    }
  }
  return null;
}

export async function previewFile(env: Env, key: string, filename: string, size: number): Promise<Preview | null> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
  if (!isImage && !TEXT_EXTENSIONS.has(ext)) return { kind: 'unsupported', reason: 'type' };
  if (isImage && size > IMAGE_PREVIEW_BYTES) return { kind: 'unsupported', reason: 'size' };
  const limit = isImage ? IMAGE_PREVIEW_BYTES : TEXT_PREVIEW_BYTES;
  const bytes = await readFilePrefix(env, key, limit + 1);
  if (!bytes) return null;
  if (isImage) {
    if (bytes.length > limit) return { kind: 'unsupported', reason: 'size' };
    const info = imageInfo(bytes);
    if (!info || !info.width || !info.height || info.width * info.height > IMAGE_PREVIEW_PIXELS) return { kind: 'unsupported', reason: 'image' };
    return { kind: 'image', bytes, ...info };
  }
  const truncated = bytes.length > limit;
  try {
    // A truncated final UTF-8 character stays buffered rather than becoming a replacement glyph.
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes.subarray(0, limit), { stream: truncated });
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) return { kind: 'unsupported', reason: 'encoding' };
    return { kind: ext === 'csv' ? 'csv' : 'text', text, truncated };
  } catch { return { kind: 'unsupported', reason: 'encoding' }; }
}
