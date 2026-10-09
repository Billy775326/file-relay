# Deployment guide

[Project overview](../README.en.md) | [简体中文](deployment.md)

Choose one method. All methods run the same application and enforce the same upload limits.

## Choose a method

| Method | Best for | Local tools | Updates |
|---|---|---|---|
| [A: Pages with GitHub](#a-pages-with-github) | Automatic deployment on push | None | Push changes |
| [B: Pages CLI](#b-pages-cli) | Manual terminal-based publishing | Git, Node.js 22+ | `npm run deploy` |
| [C: Paste a Worker](#c-paste-a-worker) | No local build setup | None | Replace the complete `worker.js` |
| [D: Pages drag and drop](#d-pages-drag-and-drop) | Browser-based file upload | None with a prebuilt file | Upload the new deployment folder |

Choose Git integration or Direct Upload when creating a Pages project. Direct Upload projects cannot be converted to Git integration; create a new Git-connected project if needed. See [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Prepare resources

### Create storage

In Cloudflare, create a KV namespace, for example `file-relay-meta`. For files larger than 25 MiB, also create an R2 bucket, such as `file-relay-files`, using Standard storage.

**Resource names are your choice; binding names must match exactly:**

| Resource | Example resource name | Binding | Required? |
|---|---|---|---|
| KV namespace | `file-relay-meta` | `fileKV` | Default setup |
| R2 bucket | `file-relay-files` | `BUCKET` | Large-file mode |
| D1 database | `file-relay` | `DB` | Optional; see D1 steps below |

Start with KV or KV + R2. R2 has a 9.99 GB bucket guard; per-file limits and available capacity both apply. See [upload limits](../README.en.md#upload-and-capacity-limits).

### Prepare the admin token

Generate a strong random string using a password manager. Save it later as the `ADMIN_TOKEN` Secret. It signs in to this application's admin page; **it is not a Cloudflare API Token**.

## A: Pages with GitHub

### 1. Create and build

1. Fork this repository or push it to your own GitHub account.
2. In Workers & Pages, create a **Pages** project connected to Git.
3. Authorize and select the repository. Select `main`, or your actual production branch.
4. Configure the build:

| Setting | Value |
|---|---|
| Framework preset | None |
| Root directory | Empty, unless the application is in a repository subfolder |
| Build command | `npm run build:pages` |
| Build output directory | `dist/pages` |
| Node.js | Repository `.node-version` selects 22; align any existing `NODE_VERSION` override to 22 or later |

Start the initial deployment. Missing-binding API errors are expected until the next step is complete.

### 2. Bind resources and set the token

Open the **Pages project** settings. In Bindings or Functions, add `fileKV` and optionally `BUCKET`. In Variables and Secrets, add `ADMIN_TOKEN` as a Secret.

Configure Production first. Configure Preview separately if required, preferably with separate test storage.

Save and redeploy. Dashboard labels may change; use the project's resource-binding and variable settings. See [official binding instructions](https://developers.cloudflare.com/pages/functions/bindings/).

### 3. Verify and update

Open the Pages URL and follow [verification](#verify-the-deployment). Future pushes to the production branch update the site automatically.

**Cleanup:** homepage visits trigger background cleanup. Add an [external scheduler](#configure-cleanup) for low-traffic sites.

## B: Pages CLI

### 1. Download and install

Install Git and Node.js 22 or later, then run each command:

```bash
git clone https://github.com/Billy775326/file-relay.git
cd file-relay
npm ci
npx wrangler login
```

Sign in through the browser to the account containing your storage resources.

### 2. Create a Pages project

```bash
npx wrangler pages project create file-relay --production-branch main
```

Skip this for an existing project. Replace `file-relay` in subsequent commands if using another project name.

In its dashboard, configure Production bindings `fileKV`, optional `BUCKET`, and Secret `ADMIN_TOKEN`.

### 3. Build and publish

```bash
npm run deploy -- --project-name file-relay --branch main
```

**This rebuilds before uploading `dist/pages`.** A failed build stops deployment. Match `--branch` to the production branch; other branches can create preview deployments.

Open the reported URL and [verify](#verify-the-deployment). Use the same command after updating code.

**Cleanup:** use homepage cleanup or an external scheduler, as with method A.

## C: Paste a Worker

### 1. Get the complete file

Open [dist/worker.js](../dist/worker.js), copy the complete Raw content, or download the raw file. Do not copy the HTML of the GitHub page.

### 2. Create and configure

1. Create a **Worker** in Cloudflare and deploy its starter example to create the project.
2. Open the code editor, replace the example with the complete `worker.js`, and deploy.
3. Add `fileKV` and optionally `BUCKET` in its resource bindings.
4. Add Secret `ADMIN_TOKEN` in Variables and Secrets, then save and apply the settings.
5. Add Cron Trigger `0 */6 * * *`.

### 3. Verify and update

Open the Worker URL and [verify](#verify-the-deployment). To update, replace all code with the latest `dist/worker.js`, deploy, and retain the resource bindings.

After editing source code, rebuild locally:

```bash
npm ci
npm run build:single
```

This generates a file; it does not publish to Cloudflare.

## D: Pages drag and drop

### 1. Prepare a folder

**With Node.js:** run `npm ci` and `npm run build:pages` in the repository, then use the generated `dist/pages` folder.

**Without Node.js:** download raw [dist/worker.js](../dist/worker.js), place it in an empty folder, and rename it `_worker.js`. Keep the leading underscore and avoid an accidental `.txt` suffix.

```text
pages/
└── _worker.js
```

### 2. Upload and configure

1. Create a Pages Direct Upload project using the dashboard upload option.
2. Upload that folder and deploy. Do not upload the source repository or just `public/`.
3. Configure Production bindings `fileKV`, optional `BUCKET`, and Secret `ADMIN_TOKEN`.
4. Create another deployment with the same folder to apply the bindings.

### 3. Verify and update

[Verify the deployment](#verify-the-deployment). For updates, replace `_worker.js` with the latest build, create a new deployment and select Production.

**Cleanup:** the same as other Pages methods. This app uses the supported `_worker.js` advanced mode, not a static-only upload.

## Verify the deployment

Use these checks for every method:

| Check | Expected result |
|---|---|
| Homepage | Send page loads |
| `/api/health` | `{"ok":true}` |
| `/api/config` | `fileBackend` is `kv` or `r2`; limits match your settings |
| Create and retrieve text | Content matches |
| Upload and download a small file | File opens correctly |
| Sign in at `/admin` with `ADMIN_TOKEN` | Share list and deletion work |

Use the custom path if `ADMIN_PATH` is configured. R2 capacity protection is enabled automatically. **Do not upload 9.99 GB just to test it:** developers can run [local quota tests](../README.en.md#development-and-tests).

## Configure cleanup

**Workers:** add Cron Trigger `0 */6 * * *`.

**Pages:** homepage visits trigger cleanup. For low-traffic sites, schedule a POST every six hours:

```bash
curl -X POST 'https://your-domain.example/api/admin/cleanup' \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

Replace the domain and token. In Windows PowerShell use `curl.exe`; alternatively enter the URL, POST method and Authorization header separately in your scheduler. Never place the token in the URL.

Expired shares are checked when accessed, but reclaiming bytes and reservations requires successful cleanup. Do not delete `__file-relay/quota-v1.json`.

## Optional: D1 metadata

For new deployments that require atomic pickup counting:

1. Create a D1 database, for example `file-relay`.
2. Run the full [schema/schema.sql](../schema/schema.sql) in its SQL Console.
3. Bind `DB` and `BUCKET` to the app, and remove `fileKV`. KV still wins if both metadata bindings are present.
4. Save, redeploy and repeat verification.

Changing bindings does not migrate existing KV shares. Migrate records and address historical KV files first; do not delete the old namespace directly.

## Updates and troubleshooting

| Symptom | Action |
|---|---|
| Unsupported Node.js version | Use Node.js 22+ locally and for Pages builds; check `NODE_VERSION` |
| Page works, API reports missing metadata | Check current environment's `fileKV` or `DB`, save and redeploy |
| Large files still use KV limits | Check the R2 binding is named `BUCKET` |
| Old limits after code update | Review dashboard `MAX_FILE_SIZE` and `PART_SIZE`; old overrides persist |
| CLI deployment does not update the public site | Check `--project-name` and production `--branch` |
| Forgotten admin token | Reset `ADMIN_TOKEN` in project settings |
| Capacity alert | Delete unneeded shares or cancel unfinished uploads; see overview quota details |

See [configuration](../README.en.md#configuration) for variables. Finish old uploads before upgrading and restart uploads after changing part size. Keep the bindings required to read historical files.
