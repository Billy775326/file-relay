# 📦 file-relay

[简体中文](README.md) | **English**

A file and text sharing service for Cloudflare Workers / Pages. Upload content, receive a **six-digit pickup code**, and share it through a code, link or QR code.

Designed for the **Cloudflare Free plan**. The default deployment needs one KV namespace. Adding an R2 bucket enables multipart uploads and **9.99 GB bucket-capacity protection**.

> Request limits, per-file limits and free storage allowances are separate concepts. Capacity protection covers the bound bucket; it does not guarantee zero charges for the entire account.

[Deploy](#deploy) · [Upload-and-capacity limits](#upload-and-capacity-limits) · [Configuration](#configuration) · [Updating a deployment](#updating-a-deployment) · [Development and tests](#development-and-tests) · [API](#api) · [FAQ](#faq)

## Features

- File and text sharing through pickup codes, links and QR codes.
- Select up to 10 files, upload sequentially and receive a separate code for each; progress, speed and retries included.
- Expiry options: 1, 7 or 30 days, or forever. The UI offers 1, 5 or unlimited pickups.
- Direct KV uploads; multipart uploads with cancellation when R2 is bound.
- A capacity alert stops the upload batch when R2 space is insufficient.
- Token-protected admin page with statistics, share lists, deletion and an optional custom entry path.
- Expiry cleanup, Chinese and English UI, dark mode and mobile layouts.

## Deploy

Choose a method, then follow the [deployment guide](docs/deployment.en.md).

| Method | Local tools | Updates |
|---|---|---|
| [Pages + GitHub](docs/deployment.en.md#a-pages-with-github) | None | Automatic builds on push |
| [Pages CLI](docs/deployment.en.md#b-pages-cli) | Git, Node.js 22+ | `npm run deploy`, which rebuilds before uploading |
| [Paste a Worker](docs/deployment.en.md#c-paste-a-worker) | None | Replace complete `worker.js` |
| [Pages drag and drop](docs/deployment.en.md#d-pages-drag-and-drop) | None with a prebuilt file | Upload folder containing `_worker.js` |

Every method needs storage bindings and an `ADMIN_TOKEN` Secret in Cloudflare project settings:

| Use case | Bindings | Details |
|---|---|---|
| Small files and text | `fileKV` → KV | Default; files and metadata share KV |
| Large files | `fileKV` → KV; `BUCKET` → R2 | R2 files with KV metadata |
| Strict concurrent pickup counting | `DB` → D1; `BUCKET` → R2 | Initialize the database; see the guide's D1 steps |

**KV takes priority when both `fileKV` and `DB` are bound.** Adding D1 does not switch backends or migrate records.

To generate files locally without publishing, use `npm run build:pages` or `npm run build:single`.

## Upload-and-capacity limits

All applicable limits are enforced together. **MB / GB are decimal; MiB / GiB are binary.**

| Limit | Value | Scope |
|---|---|---|
| KV file | 25 MiB = 26,214,400 bytes | Raw bytes; share metadata is stored separately |
| R2 part request | Default 100 MB = 100,000,000 bytes | Upload passes through a Free-plan Worker |
| Complete file | `MAX_FILE_SIZE`, default 10 GB | All parts combined; checked server-side |
| R2 part count | Default maximum 10,000 | Also constrained by `PART_SIZE` and `MAX_PARTS` |
| R2 capacity protection | Fixed 9.99 GB = 9,990,000,000 bytes | Objects, upload reservations and ledger in the bound bucket |

**The default configuration cannot accept a full 10 GB file:** the bucket-capacity guard rejects it first. An empty bucket also needs room for its ledger; existing files further reduce available space.

The upload path is browser → Worker → R2. R2's native single-request limit is not the limit of this Worker path. S3 presigned direct uploads are not implemented.

Official references: [KV limits](https://developers.cloudflare.com/kv/platform/limits/), [Worker request limits](https://developers.cloudflare.com/workers/platform/limits/#request-and-response-limits), [R2 limits](https://developers.cloudflare.com/r2/platform/limits/).

### How 9.99 GB capacity protection works

1. On new upload initialization, paginate through the bucket with R2 `list()` and sum object sizes.
2. Include full-size reservations for unfinished uploads. Completed objects and their reservations are counted once.
3. Reject a full bucket or an upload that would exceed the threshold with HTTP `507` / `capacity_exceeded`.
4. Display a capacity alert and stop the remaining files in the batch.

The ledger lives at `__file-relay/quota-v1.json` in R2. Conditional writes protect concurrent reservations; **no additional bindings are required**. Do not edit or delete this object manually.

Successful cancellation, admin deletion and expiry cleanup release reservations. Storage or accounting failures block new admission. Reservations are retained when removal cannot be confirmed. Deleting application files directly in the R2 dashboard may leave reservations; use the admin page for routine deletion.

Existing bucket objects are counted. Other buckets, historical operations and concurrent uploads bypassing this app are outside its protection. Scanning costs grow with object count. KV files and text shares are unaffected by the R2 threshold.

### What the free allowance means

R2 Standard includes **10 GB-month of storage per month**, plus separate Class A and Class B operation allowances. The 9.99 GB threshold is an application policy, not an account billing query. Scans, multipart operations and downloads also consume operation allowances. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## Configuration

For dashboard setup, follow the [deployment guide](docs/deployment.en.md).

Configure production variables in Cloudflare project settings. [wrangler.jsonc](wrangler.jsonc) primarily serves local development.

| Variable | Default | Meaning |
|---|---|---|
| `MAX_FILE_SIZE` | `10000000000` | Complete-file byte limit; both modes; cannot override platform limits or remaining R2 capacity |
| `MAX_TEXT_LENGTH` | `65536` | Server-side text length limit |
| `PART_SIZE` | `100000000` | R2 part bytes, clamped to 5 MiB–100 MB |
| `MAX_PARTS` | `10000` | R2 part count, clamped to 1–10,000 |
| `SESSION_TTL_MS` | `86400000` | Cleanup age for unfinished sessions, default 24 hours |

### Admin settings

| Secret | Required | Purpose |
|---|---|---|
| `ADMIN_TOKEN` | Yes | Admin login token; store as a production Secret |
| `ADMIN_PATH` | No | Custom entry such as `panel-x7k9`; defaults to `/admin` |

Custom paths accept 1–64 letters, digits, hyphens or underscores, with an optional leading slash. `/api` and `/pickup` are reserved. Setting a custom path makes the old `/admin` entry return 404; admin APIs remain authenticated.

### Adjust the upload limit

For a 1 GB per-file limit:

```text
MAX_FILE_SIZE=1000000000
```

The bucket threshold is **not an environment variable**. It is `R2_CAPACITY_MAX` in [src/quota.ts](src/quota.ts). Reducing `MAX_FILE_SIZE` does not delete existing files, but blocks oversized existing upload sessions from continuing.

## Cleanup

Expiry and pickup limits are checked during requests. Reclaiming stored bytes requires actual cleanup. Exhausting pickups does not immediately delete a file; permanent shares need manual deletion.

- **Standalone Workers:** configure Cron Trigger `0 */6 * * *` in the dashboard.
- **Pages:** homepage visits trigger background cleanup, with an approximate six-hour KV throttle. This is not a strict distributed lock. D1 deployments without KV have no such throttle marker.
- **External scheduler:** low-traffic sites can call the cleanup API every six hours:

```bash
curl -X POST 'https://your-domain.example/api/admin/cleanup' \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

Response: `{"ok":true,"deletedShares":0,"abortedSessions":0}`. Keep admin tokens out of public repositories.

## Updating a deployment

1. Finish old in-progress uploads before upgrading. The guard counts existing objects and imports visible legacy sessions.
2. Review dashboard variables. Old `MAX_FILE_SIZE` and `PART_SIZE` overrides survive code updates. Remove them or set `10000000000` and `100000000` to adopt current defaults.
3. Rebuild and deploy Pages, or replace the complete `dist/worker.js` in paste mode. Restart uploads after changing part size.
4. Check `/api/config`, then verify upload, pickup and deletion.

When changing file storage, retain bindings for historical files. KV file keys start with `f:`; R2 objects use separate keys. Reading old files requires the appropriate binding. **Switching KV / D1 metadata backends requires record migration; there is no automatic migration.**

## Development and tests

Use [wrangler.jsonc](wrangler.jsonc) for local development. Enable `BUCKET` to test R2. To test D1, configure `DB`, remove `fileKV`, and initialize the schema. Production bindings remain in project settings.

```bash
npm ci
npm run dev
```

Copy [.dev.vars.example](.dev.vars.example) to `.dev.vars` and replace the local token. `.dev.vars` is Git-ignored:

```text
ADMIN_TOKEN=your-local-test-token
```

Checks and build:

```bash
npx tsc --noEmit
node tools/check-i18n.mjs
npm run test:limits
npm run test:quota
npm run build:pages
```

Browser testing requires Python, Playwright and Chromium:

```bash
python -m pip install playwright
python -m playwright install chromium
npm run test:quota-runtime
```

The quota runtime test starts a local emulator using the build output. It covers admission, upload/download, cancellation, deletion and the browser alert without Cloudflare credentials.

For a running local server:

```bash
python test/e2e_test.py http://localhost:8787
python test/ui_smoke.py http://localhost:8787
```

These tests create shares and files. The R2 API test uses a file larger than one configured part. Do not treat them as read-only checks against production.

## API

`expiry`: `1d`, `7d`, `30d` or `forever`. `maxPickups`: an integer from 1–999, or `null` for unlimited pickups.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check; requires a metadata binding |
| GET | `/api/config` | File backend, per-file/text limits and part size; does not return bucket usage |
| POST | `/api/shares/text` | Create text share |
| POST | `/api/shares/file` | Raw KV file upload; metadata in query parameters |
| POST | `/api/pickup` | Retrieve and count text; return file metadata without counting |
| GET | `/api/pickup/:code/download` | Download and count file pickup |
| POST | `/api/uploads/init` | Reserve capacity and initialize multipart upload |
| PUT | `/api/uploads/:id/parts/:n` | Upload one R2 part |
| POST | `/api/uploads/:id/complete` | Complete upload and create share |
| POST | `/api/uploads/:id/abort` | Cancel and release reclaimable reservations |
| POST | `/api/admin/login`, `/api/admin/logout` | Manage admin session |
| GET | `/api/admin/stats`, `/api/admin/shares` | Share statistics and list; not actual bucket usage |
| DELETE | `/api/admin/shares/:code` | Delete share and file |
| POST | `/api/admin/cleanup` | Clean expired shares and stale upload sessions |

Admin APIs use a signed Cookie. Cleanup also accepts `Authorization: Bearer <ADMIN_TOKEN>`.

```bash
curl -X POST 'https://your-domain.example/api/shares/text' \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello file-relay","expiry":"7d","maxPickups":null}'

curl -X POST 'https://your-domain.example/api/pickup' \
  -H 'Content-Type: application/json' \
  -d '{"code":"376966"}'
```

Insufficient R2 capacity returns HTTP `507`:

```json
{"error":"capacity_exceeded","message":"容量超出免费额度"}
```

Capacity-service failures return `503`. Per-file size violations return `413`.

## Command reference

| Purpose | Command | Publishes? |
|---|---|---|
| Local development | `npm run dev` | No |
| Build standalone file | `npm run build:single` | No |
| Build Pages output | `npm run build:pages` | No |
| Preview Pages locally | `npm run dev:pages` (build first) | No |
| Deploy Pages | `npm run deploy -- --project-name file-relay --branch main` | Yes, rebuilds first |

Local Static Assets can affect routing in `dev:pages`. Use `npm run test:quota-runtime` to check the embedded routing and quota alert.

## FAQ

**Why is capacity rejected below 9.99 GB?** The next file, unfinished reservations and ledger bytes also count. Cancel unfinished uploads or delete files through the admin page. Cleanup failures may retain reservations.

**Does adding D1 enable strict counting?** No. KV wins when both are bound. D1 uses atomic updates; KV read-modify-write counting can exceed pickup limits under concurrency, and code allocation has a collision window. There is no guarantee that over-pickups stop at one or two.

**Can exhausted KV writes affect downloads?** Yes. Pickup counting writes to KV, so new shares, text pickups and file downloads may fail.

**Can uploads resume after refresh?** Not currently. The page tries to cancel on close; remaining sessions depend on cleanup.

**Does cancelling a download refund a pickup?** No. Files count when download starts; text counts when viewed.

**Forgot the admin token?** Reset `ADMIN_TOKEN` in project settings. Existing admin sessions become invalid.

**Missing metadata database error?** Check the current environment's `fileKV` or `DB` binding and its spelling.

**Cannot access the site?** Check deployment logs, bindings and network access to the domain. Default-domain availability depends on your network; configure a custom domain if appropriate.

## Layout

```text
docs/       Chinese and English deployment guides
src/        Routes, KV/D1 metadata, files, limits, R2 quota ledger and cleanup
public/     Send, pickup and admin pages with vanilla JavaScript
schema/     D1 initialization SQL
tools/      Build and translation checks
test/       Boundary, quota, runtime, API and browser tests
dist/       worker.js; Pages output at pages/_worker.js
```

See [src/quota.ts](src/quota.ts) for capacity accounting, [src/limits.ts](src/limits.ts) for upload limits and [package.json](package.json) for commands.

## Credits and license

Inspired by [FileCodeBox](https://github.com/vastsa/FileCodeBox). Built with [Hono](https://github.com/honojs/hono) and Cloudflare Workers / Pages, KV, R2 and D1.

[MIT License](LICENSE)
