/** Compare normalized digests to avoid leaking secret length or matching prefixes. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const encode = new TextEncoder();
  const [da, db] = await Promise.all([a, b].map(value => crypto.subtle.digest('SHA-256', encode.encode(value))));
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual?: (a: ArrayBuffer, b: ArrayBuffer) => boolean };
  if (subtle.timingSafeEqual) return subtle.timingSafeEqual(da, db);
  const aa = new Uint8Array(da), bb = new Uint8Array(db);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  return difference === 0;
}
