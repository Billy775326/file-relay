# 📦 file-relay

[简体中文](README.md) | **English**

A self-hosted file and text sharing service built on pickup codes, implemented with Cloudflare's native stack: **by default it requires only Workers and one KV namespace**, and runs on the free plan; R2 can be added when larger files (>24MB) are needed.

This project is a Cloudflare-equivalent alternative to [FileCodeBox](https://github.com/vastsa/FileCodeBox): upload a file or piece of text, receive a 6-digit pickup code, and the recipient collects it with that code.

Three deployment methods are supported: Pages + GitHub automatic builds, manual Pages deploy via the wrangler CLI, and environment-free single-file paste (see [Deployment](#deployment-methods)). Note: `*.pages.dev` / `*.workers.dev` hostnames are not directly reachable from mainland China; verification requires a proxy, or bind a custom domain.

## Features

- **File sharing (KV direct upload by default)**: single files up to 24MB via a single request, no storage bucket required; for larger files, enable `r2_buckets` to upgrade to chunked R2 uploads with a ~2GB per-file limit — no code changes needed either way
- **Multi-file batch sharing**: select up to 10 files at once, uploaded sequentially with per-file progress; each file gets its own result card, plus one-click copy of all codes
- **Text sharing**: paste text to get a pickup code; one-click copy on the pickup page
- **Validity**: 1 day / 7 days / 30 days / forever × pickup limit of 1 / 5 / unlimited, whichever expires first
- **Pickup QR codes**: every result card includes a QR code of the `pickup` link — scan to open the pickup page directly
- **Bilingual UI (Chinese/English)**: one-click toggle, auto-initialized from the browser language, preference persisted
- **Automatic cleanup**: Workers cron reclaims expired shares every 6 hours (the R2 mode also cleans up orphaned multipart sessions); Pages has no cron, so it instead cleans up automatically on homepage visits (throttled, 6h window) with an optional external timer; pickups are validated lazily, so cleanup issues never affect functionality
- **Admin console**: token login with statistics, listing, and deletion; the entrance defaults to `/admin` and can be customized via the `ADMIN_PATH` secret (once set, `/admin` returns 404 to resist scanning)
- **Configuration-driven mode switching**: file storage defaults to KV with optional R2; metadata defaults to KV with optional D1 — all switched via wrangler.jsonc
- Mobile-friendly layout, dark mode; uploads include progress, speed, and retry on failure

## Storage Selection: Small-Storage Mode (KV, default) vs Large-Storage Mode (R2)

**Choose file storage by the size of the files you share** (determined by whether `r2_buckets` is enabled in wrangler.jsonc; switching requires no code changes):

| | 📦 Small-storage (KV, **default**) | 🗄️ Large-storage (R2) |
|---|---|---|
| Per-file limit | **24 MB** (KV value cap 25MiB minus headroom) | **~2 GB** (10MB multipart chunks) |
| Required resources | **One KV namespace only** | R2 bucket + KV/D1 metadata |
| Upload method | Single request with progress and retry | Chunked (progress, retry, cancellable) |
| Free storage | 1 GB | 10 GB |
| Free operations | **1,000 writes/day** + 100k reads/day | 1M writes/month + 10M reads/month |
| Overage pricing | Writes $5/M; reads $0.50/M; storage $0.50/GB·mo | Storage $0.015/GB·mo; writes $4.50/M; reads $0.36/M |
| Egress traffic | Free (reads still billed) | **Free** (downloads incur no bandwidth cost) |
| Best for | **Mostly small files** (documents, images, archives) | **Mostly large files** (hundreds of MB, video, installers) |

Key points: the default small-storage mode is the simplest to deploy and is sufficient for everyday documents and images; each KV upload consumes 1-2 writes (1,000 free per day). For heavy or large-file use cases, enable `r2_buckets` to upgrade to large-storage mode (R2's free tier is nearly unlimited for personal use, and downloads are free of bandwidth charges). Switching affects only new shares; existing data is routed automatically by key prefix, with no migration required.

### Metadata Backend: KV (default) vs D1 (optional)

| | KV (default) | D1 (optional) |
|---|---|---|
| Consistency | Eventual (up to 60s global visibility after writes) | **Strong** |
| Pickup counting | Read-modify-write; extreme concurrency may exceed the limit by 1-2 | Atomic UPDATE, **strictly enforced** |
| Code uniqueness | Check-then-write; theoretical race window | UNIQUE constraint, **strictly enforced** |
| Free tier | See table above | 5M row reads/day + 100k row writes/day + 5GB |

For personal, low-concurrency use the two are practically identical; for shared or high-concurrency pickup scenarios, switch to D1 (create the database, then enable `d1_databases` in wrangler.jsonc).

**Combination quick reference**: **Default = KV only (files and metadata share one namespace, simplest)** | Large files = enable r2_buckets (R2 + KV) | Strong consistency = R2 + D1

### Free Tiers and Pricing (2026; see the [official pricing page](https://developers.cloudflare.com/workers/platform/pricing/))

| Resource | Free tier | Paid / overage price |
|---|---|---|
| Workers | 100k requests/day | Workers Paid **$5/mo**: 10M requests/month, then $0.30/M |
| KV reads | 100k/day | Paid $0.50/M (10M/month included) |
| KV writes/deletes/lists | 1,000/day each | Paid $5/M (1M/month included each) |
| KV storage | 1 GB | $0.50/GB·mo |
| D1 row reads | 5M/day | Paid $0.001/M rows (25B/month included) |
| D1 row writes | 100k/day | Paid $1/M rows (50M/month included) |
| D1 storage | 5 GB | $0.75/GB·mo |
| R2 storage | 10 GB | $0.015/GB·mo |
| R2 Class A (writes) | 1M/month | $4.50/M |
| R2 Class B (reads) | 10M/month | $0.36/M |
| R2 egress | **Unlimited, always free** | —— |

Each pickup in KV mode costs roughly 1 read + 1 write: the 1,000 free daily writes are ample for personal use; at thousands of shares per day, consider the $5/month Workers Paid plan or switch to D1 (its read allowance is far more generous).

## Deployment Methods

| Method | Best for | Characteristics |
|---|---|---|
| [Option 1](#option-1-pages--github-connection-automatic-builds) Pages + GitHub connection | Deploy on every push | Automatic builds; bindings are configured in the dashboard and never overwritten by deployments |
| [Option 2](#option-2-wrangler-cli-manual-pages-deploy) Wrangler CLI | Node.js available | Manual Pages deploy; a single command uploads the build output |
| [Option 3](#option-3-single-file-deployment-dashboard-paste-no-github-or-node) Single-file paste | No Node, no Git | The whole service as one worker.js, pasted into the dashboard editor |

> All three methods run the same code: `build:pages` produces `dist/pages/_worker.js` (for Pages) and `dist/worker.js` (for pasting) from the same source with identical behavior. **Pages bindings (KV/variables) live in the project settings, decoupled from deployments** — deploy ten thousand times and dashboard-configured bindings are never wiped, so there is no need to maintain resource IDs in the repository; the same applies to Option 3. Only if you additionally keep using the legacy `wrangler deploy` (Workers) flow does the "bindings absent from wrangler.jsonc get removed at deploy time" behavior apply (see FAQ).

### Option 1: Pages + GitHub Connection (Automatic Builds)

A browser-only deployment without installing Node, where **the repository requires no configuration changes**. Once the repository is connected to Cloudflare Pages, every `git push` rebuilds and redeploys automatically (the free build quota is ample for personal use).

#### 1. Push to GitHub

Push this repository to your own GitHub account (private or public).

#### 2. Create a KV namespace (required; in the default mode it stores both files and metadata)

Dashboard: **Storage & Databases → KV → Create namespace**, e.g. `file-relay-meta`. The namespace ID does not need to go into the repository — you will bind it in the Pages dashboard shortly.

#### 3. (Optional) Create R2 / D1 resources

Skip this step for the default small-storage mode:

- **R2 (for files >24MB)**: **Storage & Databases → R2 → Create bucket** (first-time R2 use may require a payment method)
- **D1 (for strongly consistent metadata)**: **Storage & Databases → D1 → Create database**, then open the database's **Console** tab and paste the full `schema/schema.sql` from this repository to create the tables

#### 4. Connect the repository and run the first build

1. Dashboard: **Workers & Pages → Create → Pages → Connect to Git** (in the newer UI, under Compute → Pages tab)
2. The first connection redirects to GitHub for authorization: install the **Cloudflare Pages** App and select this repository (*Only select repositories* is sufficient for private repos)
3. Back in Cloudflare, select the repository, keep the project name `file-relay`, and set the build configuration:
   - **Framework preset**: None
   - **Build command**: `npm run build:pages`
   - **Build output directory**: `dist/pages`
4. Click **Save and Deploy**; it completes in about a minute. The output is the single file `dist/pages/_worker.js` (Pages advanced mode: all requests enter the Worker first, with the frontend pages already inlined) — no static files are uploaded separately

#### 5. Configure bindings and variables (after the first deployment, once and never overwritten)

- **Settings → Functions → KV namespace bindings → Add binding**: Variable name `fileKV` (must match exactly), Namespace selects the one created in step 2, Environment Production (add a Preview binding too if you want a preview environment)
- **Settings → Variables and Secrets → Add**: type **Secret**, name `ADMIN_TOKEN`, value a strong random string (locally `openssl rand -base64 24`, or a password manager); optionally `ADMIN_PATH` for a custom admin entrance (e.g. `panel-x7k9`; once set, `/admin` returns 404)
- All vars have code defaults and may be omitted; to override a default, add a plain-text variable (not a Secret) of the same name
- Large-file / strong-consistency modes: add `BUCKET` (R2) or `DB` (D1) on the same **Functions** bindings page

Pages bindings and environment variables are project settings, **and deployments that only upload build output never touch them**; subsequent automatic deployments on every push need no further attention.

#### 6. Scheduled cleanup (Pages has no Cron Triggers)

Expired shares are validated lazily as a safety net, so **functional correctness never depends on cleanup** — expired or exhausted shares cannot be picked up; cleanup only reclaims storage. Pages does not support Cron Triggers, so compensating mechanisms stack:

- **Cleanup on visit (automatic)**: every homepage visit triggers a throttled background cleanup (at most one real run per 6-hour window, executed via waitUntil without slowing the page) — for a site with regular visitors, no extra configuration is needed
- **External timer** (optional, a safety net for low-traffic sites): [cron-job.org](https://cron-job.org) / UptimeRobot / a local cron, hitting the endpoint every 6 hours:

  ```bash
  curl -X POST https://<project-name>.pages.dev/api/admin/cleanup -H "Authorization: Bearer <ADMIN_TOKEN>"
  ```

  Returns `{"ok":true,"deletedShares":n,"abortedSessions":n}`
- **Manual**: after logging into the admin console, call the same endpoint (cookie auth works)

#### 7. Verify and update

- Visit `https://<project-name>.pages.dev`: create a text share and pick it up successfully — deployment is complete; the admin console defaults to `/admin` (or `/<ADMIN_PATH>` if set), logging in with ADMIN_TOKEN
- Every subsequent push to `main` deploys a new version automatically; bindings and variables remain managed in the dashboard, unaffected by deployments

### Option 2: Wrangler CLI (Manual Pages Deploy)

```bash
# 0. Prerequisites: Node.js >= 18; clone the repository and install dependencies
npm install

# 1. Log in to Cloudflare (browser authorization)
npx wrangler login

# 2. Build the Pages output (= build:single + copy to dist/pages/_worker.js)
npm run build:pages

# 3. Deploy to Pages (the first run asks for a project name, e.g. file-relay; afterwards it updates directly)
npm run deploy

# 4. (Optional) Create KV/R2/D1 resources locally instead of clicking the dashboard:
npx wrangler kv namespace create file-relay-meta
npx wrangler r2 bucket create file-relay
npx wrangler d1 create file-relay && npm run db:remote   # D1 database + tables; use npm run db:local locally
```

After deployment you get `https://<project-name>.pages.dev`. **`wrangler pages deploy` uploads only the build output, not bindings** — KV and variables are still configured in the dashboard as in Option 1 step 5 (once configured, subsequent deploys never overwrite them); ADMIN_TOKEN can also be set with `npx wrangler pages secret put ADMIN_TOKEN` instead of the dashboard. Scheduled cleanup works as in Option 1 step 6.

For local development use `npm run dev` (repository mode with hot-reloading TS sources + `public/`; append `--test-scheduled`, then visit `/__scheduled` to trigger the cron manually). To debug the Pages/single-file output shape: `npm run build:pages && npm run dev:pages`. End-to-end tests: `python test/e2e_test.py` (defaults to `http://localhost:8787`; override with the BASE argument).

> ⚠️ `wrangler pages dev` merges the `assets` block from wrangler.jsonc (./public) into its local static-asset layer, and Pages serves static assets first — locally, page paths such as `/` never reach the Worker (the opposite of production, where the dist/pages output contains only _worker.js and every request enters the Worker first). When debugging homepage-triggered cleanup, temporarily move wrangler.jsonc away before starting pages dev.

### Option 3: Single-File Deployment (Dashboard Paste, No GitHub or Node)

The entire service (backend and all frontend pages) is bundled into **one `worker.js`** that is pasted into the dashboard editor — suitable for environments where connecting Git or installing Node is impractical. A pure-dashboard deployment has no config file; bindings and secrets are managed in the dashboard, and the binding-removal behavior described in the FAQ does not apply.

#### 1. Obtain worker.js

Use the prebuilt [dist/worker.js](dist/worker.js) in this repository (~240 KB). To regenerate it after code changes:

```bash
npm install
npm run build:single     # produces dist/worker.js
```

The committed `dist/worker.js` is kept in sync with the source; if you modify the code yourself, rebuild and replace the file to keep them consistent.

#### 2. Create in the dashboard and paste

1. **Compute (Workers) → Create → Create Worker** (the default Hello World template is fine), e.g. `file-relay`
2. After deployment open **Edit code**, clear the editor, paste the entire `dist/worker.js`, and click **Deploy**

#### 3. Dashboard configuration

1. **Settings → Bindings → Add → KV namespace**: the variable name must be `fileKV`; select the target namespace (required)
2. **Settings → Variables and Secrets → Add → Secret**: `ADMIN_TOKEN` (required); optionally `ADMIN_PATH` for a custom admin entrance
3. **Settings → Triggers & Events → Cron Triggers → Add**: `0 */6 * * *` (cleans expired shares every 6 hours)
4. All vars have code defaults and may be omitted; to override a default, add a plain-text variable (not a Secret) of the same name under **Variables and Secrets**; bind `BUCKET` (R2) / `DB` (D1) only if large files or strong consistency are needed

#### 4. Verify

Visit `https://<worker-name>.<subdomain>.workers.dev` and create a text share; picking it up successfully completes the deployment.

> **Trade-off**: all three methods are functionally identical and share the same code source — Options 1/2 (Pages) and Option 3 (Workers paste) both ship the single-file form with the frontend inlined. After page changes: Pages rebuilds automatically on push (or re-run `npm run build:pages` + deploy); the paste mode requires re-running `npm run build:single` and replacing the whole file. When the same KV namespace is bound, pickup codes and data interoperate across methods.

## API

Beyond the web UI, all features are programmable. Parameter conventions: `expiry` is one of `1d | 7d | 30d | forever`; `maxPickups` is 1-999 or `null` (unlimited). Errors return `{error, message}` uniformly.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Current upload mode and limits (`fileBackend=kv` in KV mode) |
| POST | `/api/shares/text` | Create a text share; returns `{code, expireAt, …}` |
| POST | `/api/shares/file` | KV-mode direct file upload (query params `filename`/`mime`/`expiry`/`maxPickups`; body is the raw file bytes, ≤24MB) |
| POST | `/api/pickup` | Pick up by code: text shares return the content; file shares return metadata (not counted) |
| GET | `/api/pickup/:code/download` | Download the file (this step counts) |
| POST | `/api/uploads/init` etc. | R2 large-storage chunked upload endpoints (init / `:id/parts/:n` / complete / abort) |
| POST | `/api/admin/login` etc. | Admin endpoints (HMAC-signed cookie auth): `stats`, `shares` listing, `DELETE shares/:code` by pickup code (idempotent: a nonexistent code also returns ok, tiding over the KV eventual-consistency window) |
| POST | `/api/admin/cleanup` | Manually/externally trigger cleanup (compensation channel for Pages having no cron): admin cookie or `Authorization: Bearer <ADMIN_TOKEN>` auth; returns `{ok, deletedShares, abortedSessions}` |

Examples:

```bash
# Text share → {"code":"376966","expireAt":…}
curl -X POST https://<your-domain>/api/shares/text \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello file-relay","expiry":"7d","maxPickups":null}'

# Pick up by code
curl -X POST https://<your-domain>/api/pickup \
  -H 'Content-Type: application/json' -d '{"code":"376966"}'

# Direct file upload (KV mode, ≤24MB per file)
curl -X POST 'https://<your-domain>/api/shares/file?filename=doc.zip&mime=application/zip&expiry=1d&maxPickups=5' \
  --data-binary @doc.zip
```

## Configuration (wrangler.jsonc `vars`)

Every var has a code default and may be omitted entirely; items marked ❌ are used only by the R2 large-storage mode and can be deleted entirely in small-storage (KV) mode.

| Variable | Default | Applies to | Description |
|---|---|---|---|
| MAX_FILE_SIZE | 2 GiB | Both modes | Per-file cap; KV mode uses min(value, 24MB) |
| MAX_TEXT_LENGTH | 65536 | Both modes | Text length cap in characters |
| PART_SIZE | 10 MiB | R2 only ❌ | Chunk size (non-final chunks must be ≥5MB and <100MB request-body limit) |
| SESSION_TTL_MS | 24h | R2 only ❌ | Threshold for orphaned multipart sessions |
| MAX_PARTS | 10000 | R2 only ❌ | Maximum number of R2 parts |

ADMIN_TOKEN is a Secret (Pages: add it under Variables and Secrets in the dashboard, or `npx wrangler pages secret put ADMIN_TOKEN`; paste mode: add it in the dashboard) and is required in every mode.

### Secrets

| Secret | Required | Description |
|---|---|---|
| `ADMIN_TOKEN` | Yes | Admin console login token (a strong random string) |
| `ADMIN_PATH` | Optional | Custom admin entrance: a single path segment of letters/digits/`-`/`_` (1-64 chars, e.g. `panel-x7k9`). Once set, the console entrance becomes `https://…/<value>` and both `/admin` and `/admin.html` return 404 to resist scanning; unset, it defaults to `/admin`. Do not reuse existing paths such as `/pickup` or `/api`. This secret only hides the login page — the `/api/admin/*` endpoints are always protected by ADMIN_TOKEN |

## Design Trade-offs (Known Limits)

- **No resumable uploads**: refreshing or closing the page abandons the upload (R2 mode aborts the server-side session on a best-effort basis; the remainder is handled by the cron)
- **Download counts on start**: pickup limits are counted when a download begins, and cancelling midway still consumes one (the necessary cost of preventing concurrent over-pickup); viewing text counts immediately, while files let the recipient inspect the card before downloading
- **Files are not deleted immediately after pickup**: the file (KV key / R2 object) is kept until natural expiry or admin deletion, so recipients see "limit exhausted" rather than "code not found"
- Codes are 6 digits (a space of one million): D1 relies on a UNIQUE constraint with collision retries; KV uses check-then-write with a theoretical race window under extreme concurrency
- Pickup counting in KV mode is read-modify-write and may exceed the limit by 1-2 under extreme concurrency (imperceptible for personal use)

## FAQ

- **API returns 500 "metadata store not bound"**: a KV/D1 binding is not configured. All three deployment methods configure bindings in the dashboard (Pages: Settings → Functions; paste mode: Settings → Bindings), and they are never overwritten by deployments — only if you additionally keep using the legacy `wrangler deploy` (Workers) flow, note that it treats wrangler.jsonc as the single source of bindings and removes ones absent from the config
- **Forgot ADMIN_TOKEN**: Secrets cannot be viewed, only reset — Pages: re-edit it under Variables and Secrets in the dashboard (or `npx wrangler pages secret put ADMIN_TOKEN`); paste mode: re-edit it in the Worker settings. Existing admin sessions become invalid after a reset
- **`*.pages.dev` / `*.workers.dev` unreachable from mainland China**: expected; verification requires a proxy, or bind a custom domain for direct access
- **Do storage-mode switches affect existing shares**: No. Keys are routed by prefix (`f:` prefix = KV files, bare uuid = R2 objects); old and new data coexist with no migration
- **When KV write quota is exhausted**: creating new shares fails that day, while reading and downloading existing shares is unaffected; the quota resets the next day. For sustained heavy use, switch to D1 or upgrade to a paid plan

## Structure

```
src/          Hono Worker: store (dual KV/D1 backend) / share (pickup download + KV direct upload) / upload (R2 chunking, large-storage mode) / admin / cleanup (cron + cleanup endpoint + homepage-triggered throttled cleanup)
              asset-resolver.ts dual-mode static assets (Static Assets / single-file inline); standalone.ts single-file entry point
public/       Vanilla JS three pages (send / pickup / admin), served by Static Assets in local wrangler dev and inlined into the build output
dist/         build:single output worker.js (committed to the repository, directly usable for Option 3); build:pages copies it to dist/pages/_worker.js (Options 1/2 Pages deploys)
tools/        Build scripts (inline generation / finishing / Pages copy) and the i18n checker
schema/       D1 initialization SQL (only needed when switching to the D1 metadata backend)
test/         Python end-to-end tests
```

## Acknowledgments

- **[FileCodeBox](https://github.com/vastsa/FileCodeBox)** — the inspiration and product prototype for this project
- **[Hono](https://github.com/honojs/hono)** — a lightweight, high-performance edge web framework
- **[Wrangler](https://github.com/cloudflare/workers-sdk)** / **[@cloudflare/workers-types](https://github.com/cloudflare/workers-types)** — the official Cloudflare Workers toolchain and types
- Hosted on [Cloudflare Workers](https://workers.cloudflare.com/) / [Workers KV](https://developers.cloudflare.com/kv/) / [R2](https://developers.cloudflare.com/r2/) (optional) / [D1](https://developers.cloudflare.com/d1/) (optional)

## License

[MIT](LICENSE)
