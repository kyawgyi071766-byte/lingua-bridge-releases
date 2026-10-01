# Lingua Official Distribution and Owner Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish one safe official customer download path, preserve the owner-only admin dashboard and customer counts, and release the language-safe server without exposing secrets or an obsolete installer.

**Architecture:** The existing Next.js/Vercel server remains the public web, authentication, download-gate, translation and owner-admin control plane. The Electron v1.0.8 installer is distributed only through the token-gated `/downloads` portal; `/admin` remains protected by server-side owner identity and shows customer totals from PostgreSQL. Deployment is gated on the updated Windows installer, verified production environment variables, migrations, and post-deploy smoke tests.

**Tech Stack:** Next.js 15, React 19, Prisma/PostgreSQL, Vercel, Electron 34/NSIS, DeepL and Google Cloud Translation.

**Spec:** `docs/GLOBAL_RELEASE.md`, `docs/VERCEL_ENV_CHECKLIST.md`, and the approved v1.0.8 unread/contact requirements in `RELEASE_NOTES_v1.0.8.md` of the desktop source.

## Global Constraints

- Never publish the obsolete v1.0.8 installer that lacks unread-account and contact-detail support.
- Never place provider keys, database credentials, owner credentials, wallet private keys or download tokens in desktop source or public files.
- Production translation must route unsupported DeepL languages to Google or return an explicit supported-language error; it must not silently send incorrect text.
- `/admin` must remain server-side restricted to `ADMIN_EMAIL` plus the `admin` database role.
- Customer downloads must use `/downloads#<DOWNLOAD_ACCESS_TOKEN>` and an httpOnly access cookie.
- Database migrations must succeed before production promotion.

## Review Focus

- A non-owner visiting `/admin` must be redirected and must not receive customer data.
- A missing, incorrect or rotated download token must not expose installer URLs.
- Arabic, Thai and Burmese must never be sent to DeepL when DeepL does not support the requested direction.
- The published Windows file must match the SHA-256 recorded in the release manifest.
- A database or provider outage must fail visibly without activating payments or corrupting usage totals.

---

### Task 1: Produce and verify the updated Windows installer

**Files:**
- Consume: `../source-review-108/BUILD_WINDOWS_INSTALLER.bat`
- Consume: `../source-review-108/package.json`
- Produce: `../source-review-108/release/Lingua Bridge Setup 1.0.8.exe`
- Create: `docs/releases/v1.0.8-windows.json`

**Interfaces:**
- Consumes: approved desktop source containing `lingua-unread-message`, `instance-unread-badge`, and `editAccountDetails`.
- Produces: a tested installer path, byte size and SHA-256 for distribution configuration.

- [ ] **Step 1: Run desktop QA before packaging**

Run on Windows from the extracted updated source:

```bat
npm install --no-audit --no-fund
npm run qa
```

Expected: all validation lines are `PASS` and the command exits with code `0`.

- [ ] **Step 2: Build the NSIS installer**

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Expected: `release\Lingua Bridge Setup 1.0.8.exe` exists and Electron Builder reports `SUCCESS`.

- [ ] **Step 3: Run the Windows smoke test**

Install the new build, sign into at least two messaging accounts, send a customer message to the inactive account, confirm its red unread badge increments, confirm opening it clears only that badge, and confirm **Account details** saves and displays the name and phone number.

- [ ] **Step 4: Record the exact artifact identity**

```powershell
$file = Resolve-Path '.\release\Lingua Bridge Setup 1.0.8.exe'
$hash = (Get-FileHash $file -Algorithm SHA256).Hash.ToLower()
$size = (Get-Item $file).Length
"{`"version`":`"1.0.8`",`"platform`":`"windows-x64`",`"bytes`":$size,`"sha256`":`"$hash`"}" | Set-Content '.\docs\releases\v1.0.8-windows.json' -Encoding utf8
```

Expected: the manifest contains the actual non-zero byte size and a 64-character lowercase SHA-256.

### Task 2: Verify language-safe server behavior

**Files:**
- Test: `scripts/static-audit.js`
- Modify only if a test fails: `src/lib/translator.ts`
- Modify only if a test fails: `src/lib/languages.ts`
- Test: `src/app/api/translate/route.ts`

**Interfaces:**
- Consumes: `TRANSLATE_PROVIDER`, `DEEPL_API_KEY`, and `GOOGLE_TRANSLATE_API_KEY` from Vercel production environment.
- Produces: correct provider selection or a clear error for every requested language pair.

- [ ] **Step 1: Run the existing language and security audits**

```bash
npm install --no-audit --no-fund
npm run verify:config
npm run audit:static
npm run build
```

Expected: all commands exit `0`; the build contains `/api/translate`, `/admin`, and `/downloads`.

- [ ] **Step 2: Test unsupported-DeepL routing before production**

Use an authenticated test account to submit English→Arabic, English→Thai and Burmese→English requests to the preview `/api/translate` route.

Expected: each returns HTTP `200` through Google when configured, or an explicit provider-configuration error; none logs `DeepL does not support target language`.

- [ ] **Step 3: Confirm secret separation**

```bash
npm run audit:static
rg -n "(DEEPL_API_KEY|GOOGLE_TRANSLATE_API_KEY|DATABASE_URL|AUTH_SECRET)=" src public electron desktop-bridge
```

Expected: audit passes and `rg` returns no embedded assignments.

### Task 3: Configure owner controls and private customer distribution

**Files:**
- Reference: `.env.example`
- Reference: `docs/VERCEL_ENV_CHECKLIST.md`
- Verify: `src/app/admin/page.tsx`
- Verify: `src/lib/downloadAccess.ts`
- Verify: `src/app/api/download/file/route.ts`

**Interfaces:**
- Consumes: production `ADMIN_EMAIL`, `DATABASE_URL`, `DOWNLOAD_ACCESS_TOKEN`, `DOWNLOAD_WINDOWS_URL`, and `NEXT_PUBLIC_SITE_URL`.
- Produces: owner URL `/admin`, customer URL `/downloads#<token>`, and protected Windows installer redirect.

- [ ] **Step 1: Verify required production variables exist without revealing values**

Confirm the presence of every required key in `docs/VERCEL_ENV_CHECKLIST.md`. Record only `present` or `missing`; never copy secret values into a report.

- [ ] **Step 2: Apply the production database migrations**

```bash
npx prisma migrate deploy
```

Expected: all migrations, including access-code/admin activity and device-limit migrations, are applied successfully.

- [ ] **Step 3: Configure the installer destination**

Upload the Task 1 `.exe` to an HTTPS file host controlled by the owner. Set `DOWNLOAD_WINDOWS_URL` to that exact HTTPS URL and set a long random `DOWNLOAD_ACCESS_TOKEN` in Vercel Production.

- [ ] **Step 4: Verify authorization boundaries**

Expected checks:

```text
anonymous /admin -> /login?next=/admin
authenticated non-owner /admin -> /dashboard
owner /admin -> dashboard with Total users and Users table
wrong download token -> 403
correct download token -> 24-hour httpOnly cookie and Windows download entry
```

### Task 4: Deploy, verify and publish the official links

**Files:**
- Deploy: `vercel.json`
- Verify: `src/app/api/health/route.ts`
- Create: `docs/releases/v1.0.8-production-release.md`

**Interfaces:**
- Consumes: the verified server source, migrated database, production variables and Task 1 installer URL.
- Produces: the official customer web link, private download link, owner link and customer-count location.

- [ ] **Step 1: Deploy a preview and inspect build logs**

```bash
vercel pull --yes --environment=preview
vercel build
vercel deploy --prebuilt
```

Expected: preview state is `READY` with no build errors.

- [ ] **Step 2: Run preview smoke tests**

Verify `/api/health`, signup/login, three translation directions, `/downloads`, download authorization, owner `/admin`, total-user count and the Windows download response.

- [ ] **Step 3: Promote the exact tested preview**

```bash
vercel promote <tested-preview-deployment-url>
```

Expected: production alias points to the tested deployment without rebuilding it.

- [ ] **Step 4: Verify production and runtime errors**

Expected:

```text
GET /api/health -> 200 {"status":"ok"}
GET /downloads -> 200
anonymous GET /admin -> login redirect
runtime error scan for 1 hour -> no new provider-routing errors
```

- [ ] **Step 5: Record the owner/customer handoff**

Write `docs/releases/v1.0.8-production-release.md` with the public web URL, owner `/admin` URL, private customer download-link format, user-count location, installer SHA-256, deployment ID and release timestamp. Do not include the real download token or any credential in the document.

