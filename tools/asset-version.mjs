import { createHash } from 'node:crypto';

/** Deterministic revision of the unmodified source assets, shared by every deployment. */
export function versionAssets(source) {
  const sorted = Object.entries(source).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const revision = createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
  const files = {};
  for (const [name, text] of sorted) {
    if (name.endsWith('.html')) {
      files[name] = text.replace(/\b(href|src)="(\/[^"?#]+\.(?:css|js))"/g,
        (all, attribute, url) => source[url.slice(1)] === undefined ? all : `${attribute}="${url}?v=${revision}"`);
    } else if (name.endsWith('.js')) {
      // Relative specifiers also need the revision: an entry URL query is not inherited by imports.
      files[name] = text.replace(/\b(from|import)\s+(['"])(\.{1,2}\/[^'"?#]+\.js)\2/g,
        (_, prefix, quote, url) => `${prefix} ${quote}${url}?v=${revision}${quote}`);
    } else files[name] = text;
  }
  return { files, revision };
}
