# 📦 file-relay

[简体中文](README.md) | **English**

File and text sharing on Cloudflare Workers / Pages. Senders receive a **six-digit pickup code**; recipients use a code, link or QR code. The admin panel manages files, upload sources, audit logs and access protection.

Designed for personal and small-group use within Cloudflare Free-plan constraints. The default file limit is **9.9 GB**, with a **9.99 GB R2 bucket guard**. Neither value guarantees a zero account bill: requests, operations and other account resources also matter.

[Deployment](docs/deployment.en.md) · [Admin guide (Chinese)](docs/admin.md) · [Security (Chinese)](docs/security.md) · [Documentation index](docs/README.md)

## Features

- File and text sharing; select up to ten files, upload sequentially and generate a separate code for each. Progress, cancellation and failed-upload retries are supported.
- One-, seven- or thirty-day expiry. Unnoted visitors default to five file-upload admissions per week; noted visitors may create permanent or unlimited-pickup shares.
- Direct small-file uploads to KV and multipart large-file uploads to R2, with file-size and capacity checks.
- Admin filtering, file details, bounded previews, downloads, share-rule editing and deletion. Admin downloads do not consume public pickup counts.
- Upload-source dialogs show visitor IDs or admin notes, network exit IPs and approximate locations. Optional uploader names and file descriptions are admin-only.
- Separate security workspace for login/upload/pickup rate limits, IP/region bans, allow entries and rule testing.
- Login, operation, upload, pickup and security audit categories, with filters, details and JSON export.
- Configurable cleanup after expiry, Chinese/English UI, light/dark themes and mobile layouts.

## Deploy

Recommended: **Pages + GitHub + KV + R2**. Connect the repository, build with `npm run build:pages`, output to `dist/pages`, bind `fileKV` and `BUCKET`, add Secret `ADMIN_TOKEN`, then redeploy. [Step-by-step instructions](docs/deployment.en.md#a-pages-with-github).

| Method | Local tools | Updates |
|---|---|---|
| [Pages with GitHub](docs/deployment.en.md#a-pages-with-github) | None | Push to the production branch |
| [Pages CLI](docs/deployment.en.md#b-pages-cli) | Git, Node.js 22+ | `npm run deploy` |
| [Paste a Worker](docs/deployment.en.md#c-paste-a-worker) | None with a prebuilt file | Replace all of `dist/worker.js` |
| [Pages drag and drop](docs/deployment.en.md#d-pages-drag-and-drop) | None with a prebuilt file | Upload a folder containing `_worker.js` |

Each method runs the same code. Bindings determine the available features:

| Bindings | File backend | Unnoted visitor file uploads | Persistent protection/audit |
|---|---|---|---|
| `fileKV` only | KV, up to 25 MiB | Disabled; send finite text first for an admin to note the visitor | Disabled |
| `fileKV` + `BUCKET` | R2, default 9.9 GB | Five admissions/week by default | Enabled |
| `fileKV` + `DB` | KV, up to 25 MiB | Five admissions/week by default | Enabled; D1 stores quota/protection state |
| `DB` + `BUCKET` | R2, default 9.9 GB | Five admissions/week by default | Enabled; D1 provides atomic pickup counts |

**KV remains the metadata backend when both `fileKV` and `DB` are bound.** Adding D1 does not migrate shares or switch metadata. D1-only supports text; file uploads additionally need R2. [Resource setup](docs/deployment.en.md#prepare-resources).

## Upload-and-capacity limits

MB/GB are decimal; MiB/GiB are binary.

| Project limit | Default |
|---|---|
| Complete file | 9.9 GB; KV also has a 25 MiB limit |
| R2 upload request/part | 100 MB |
| R2 part count | Up to 10,000 |
| R2 bucket guard | 9.99 GB, including objects and reservations |
| Unnoted visitor file quota | Five admissions/week; resets Monday in Asia/Shanghai; cancellation does not refund admission |

All visitors share the global size limit. Notes remove weekly and permanent/unlimited-share restrictions, while size, capacity and security checks still apply. Capacity rejection displays remaining space and stops subsequent batch uploads. [Operations guide (Chinese)](docs/operations.md#容量与免费额度).

### What the free allowance means

R2 Standard includes **10 GB-month/month** of free storage, with separate operation allowances. The application's guard checks the bound bucket, not the account bill. [Official R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## Configuration

Configure production bindings and variables in the Cloudflare project, then redeploy. `wrangler.jsonc` is primarily for local development.

| Variable | Default | Meaning |
|---|---|---|
| `MAX_FILE_SIZE` | `9900000000` | Complete-file limit in bytes |
| `MAX_TEXT_LENGTH` | `65536` | Text character limit |
| `PART_SIZE` | `100000000` | R2 part bytes, bounded to 5 MiB–100 MB |
| `MAX_PARTS` | `10000` | R2 part count, 1–10,000 |
| `SESSION_TTL_MS` | `86400000` | Stale upload-session cleanup age in milliseconds |

### Admin settings

Secret `ADMIN_TOKEN` is required. Optional `ADMIN_PATH` changes the default `/admin` entry. The admin settings dialog contains retention, weekly visitor quotas and browser-local page sizes. Protection rules live in the separate security workspace. [Admin guide (Chinese)](docs/admin.md#设置与翻页).

The KV card detects its binding automatically. To display usage, configure `CF_ACCOUNT_ID`, `CF_KV_NAMESPACE_ID` and Secret `CF_ANALYTICS_TOKEN`. [KV analytics setup (Chinese)](docs/kv-usage.md).

### Adjust the upload limit

Set `MAX_FILE_SIZE=1000000000` for a 1 GB complete-file limit. The R2 total-capacity guard is a code constant, not an environment variable. [Capacity details (Chinese)](docs/operations.md#容量与免费额度).

## Cleanup

Public pickup stops at expiry. Expired shares are retained for **30 days** by default and removed on the next successful cleanup. Admins can download retained files. Permanent shares and exhausted shares without an expired date are not automatically removed by this rule.

Workers can use Cron; Pages uses homepage-triggered cleanup or an external scheduler. [Cleanup setup](docs/deployment.en.md#configure-cleanup).

## Updating a deployment

Keep existing storage bindings and secrets, finish incomplete uploads, then update using your original deployment method. Existing variable overrides persist; check effective limits through `/api/config`.

Older D1 installations may need the source-field migration; do not rerun it on databases that already have those fields. KV/D1 metadata switching requires a separate migration. [Upgrade, backup and rollback (Chinese)](docs/operations.md#更新已有部署).

## Development and tests

```bash
npm ci
# Copy .dev.vars.example to .dev.vars and set a local admin token.
npm run dev
```

Requires Node.js 22+. Isolated integration/browser tests also use Python, Playwright and Chromium. [Development guide (Chinese)](docs/development.md) documents setup, architecture and tests by module.

## API

Use finite pickup counts for an unnoted visitor:

```bash
curl -X POST 'https://your-domain.example/api/shares/text' \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello file-relay","expiry":"7d","maxPickups":5}'
```

Public responses omit upload provenance. Multipart clients must retain their visitor cookie. [API reference (Chinese)](docs/api.md) covers routes, authentication, payloads, errors and audit filters.

## Command reference

| Purpose | Command | Deploys? |
|---|---|---|
| Local development | `npm run dev` | No |
| Build standalone Worker | `npm run build:single` | No |
| Build Pages | `npm run build:pages` | No |
| Preview Pages | `npm run dev:pages` after building | No |
| Deploy Pages | `npm run deploy -- --project-name file-relay --branch main` | Yes |

## FAQ

**Does the KV card show free space?** No. It shows the namespace daily peak against the account-shared 1 GB allowance, not remaining account capacity.

**Does a source IP identify the uploader?** No. It describes a network exit. Proxies, shared networks and cookie changes affect association. [Source limitations (Chinese)](docs/upload-sources.md#识别范围).

**Can uploads resume after a refresh?** Not currently. Closing the page attempts cancellation; subsequent cleanup handles stale sessions.

**Does cancelling a download refund its count?** No. Counting happens when the file starts returning. An audit success does not prove the browser finished downloading.

**Can exhausted KV writes affect pickup?** Yes: pickup counting writes metadata. KV counts also lack D1's atomic guarantees. [Troubleshooting (Chinese)](docs/operations.md#常见问题).

## Layout

`public/` holds pages/styles; `src/` holds Worker logic; `schema/` holds D1 tables/migrations; `test/` holds tests; `tools/` holds build tools; `dist/worker.js` is the prebuilt pasteable artifact. [Code structure (Chinese)](docs/development.md#代码结构).

## Credits and license

Inspired by [FileCodeBox](https://github.com/vastsa/FileCodeBox), built with [Hono](https://github.com/honojs/hono) and Cloudflare. [MIT License](LICENSE).
