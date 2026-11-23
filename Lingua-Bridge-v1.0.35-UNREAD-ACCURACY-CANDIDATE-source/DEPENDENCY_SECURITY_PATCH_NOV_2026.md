# Dependency Security and Desktop Language Hotfix — November 2026

This PR updates the packaged web/desktop source dependencies, fixes Burmese routing through DeepL, and updates the embedded desktop messenger's language status pill so a selected customer language is reflected immediately without refreshing the messenger page.

## Security dependency updates

- Electron runtime: `44.4.3` → `44.9.1`. The updated package entry retains the upstream npm registry URL and SHA-512 integrity.
- Next.js: `15.5.27` → `15.5.29`, with the nested/hoisted PostCSS dependency resolved to `8.5.28`.
- sharp: `0.35.4` → `0.35.5`.
- qs: `6.16.0` → `6.16.1`.
- fast-uri: `3.1.8` → `3.1.9`.
- source-map-js: `1.2.1` → `1.2.2`.
- postcss-selector-parser: `6.1.4` → `6.1.5`.
- tar: top-level package updated to `7.5.23`; scoped Capacitor CLI override updated to `7.5.23`.
- Capacitor CLI scoped filesystem tooling: rimraf `6.1.4` and glob `14.0.6`.
- undici: major-compatible locked copies updated to `7.30.1` and `6.29.1`.
- minimatch: affected Electron Builder dependency paths use `11.0.9`; unrelated legacy nested copies are not force-overridden.
- Application Node runtime pinned to `22.x` with `.nvmrc`, and CI asserts Node 22 on both Linux and Windows.

Scoped npm overrides are used where appropriate so fixes do not indiscriminately replace unrelated package trees. The regenerated `package-lock.json` is committed on this security branch; CI verifies reproducible installation with `npm ci`.

## Burmese DeepL support and live language hint

- DeepL API Burmese language code `MY` is now present in `DEEPL_SUPPORTED`; Bulgarian remains `BG`.
- In Desktop Bridge, Burmese / Myanmar was moved from the optional Gemini/Microsoft/Google-only language list into the standard DeepL language picker. It is no longer disabled when broad-language providers are absent.
- The host panel now sends the current effective Current/Global conversation profile to the active messenger webview immediately and bypasses a stale settings signature on explicit language edits.
- The embedded service preload refreshes the bottom composer pill on receipt of `lingua-settings`, then refreshes after the next layout frame and briefly retries if a messenger SPA remounts its composer.
- The change does not reload the messenger page.
- Provider status text was corrected so it no longer says Burmese requires Gemini/Microsoft/Google. Arabic, Hindi, Thai, Vietnamese and other broad languages still require an available broad-language provider.
- Regression tests cover live source/target pill text changes, webview IPC delivery with the latest effective profile, Burmese language-picker eligibility, and provider status copy.

DeepL's overall supported language list is broader than Lingua Bridge's selected API mapping; this patch adds Burmese to the application's current mapping and does not claim all DeepL-listed languages are enabled in Lingua.

## Final CI verification

Latest successful PR-triggered GitHub Actions run on commit `ef5b458d7e311a20b012675bfc1f7380b7b9f943`:

https://github.com/kyawgyi071766-byte/lingua-bridge-releases/actions/runs/45107457260

All three jobs completed successfully:

- Linux: Node 22 assertion, `npm ci`, dependency lock audit, static audit, translation resilience/language-pair audits, Gemini/public-release audits, copy-message and multi-app adapter regressions, webview settings regression, composer target-hint regression, language-picker regression, Electron security regression, and Next.js production build.
- Windows SaaS installer: Node 22 assertion, `npm ci`, Electron NSIS packaging, installer size check, Windows PE/MZ header check, SHA-256 generation, and artifact upload.
- Windows Desktop Bridge installer: Node 22 assertion, `npm ci`, full `npm run qa` (including the new language-pill and Burmese picker regressions), Windows installer build, PE/MZ header check, SHA-256 generation, and artifact upload.

Secret-history scan passed on the same commit:
https://github.com/kyawgyi071766-byte/lingua-bridge-releases/actions/runs/45107452045

### Dependency audit

The downloaded CI `npm audit --json` report was inspected directly for this committed lockfile:

- Total dependencies: 479 (47 prod, 395 dev, 61 optional, 12 peer).
- Vulnerabilities: 0 total — 0 info, 0 low, 0 moderate, 0 high, 0 critical.
- Audit artifact ID: `14788625019`.

This is a point-in-time result for this committed lockfile and the advisory database at the time of the run; it is not a guarantee that future advisories cannot appear.

### Windows test artifacts

**Lingua Bridge Desktop v1.0.36**

- Artifact: `lingua-bridge-desktop-test-v1.0.36`
- Artifact ID: `14788765123`
- File: `Lingua-Bridge-Setup-1.0.36.exe`
- Size: 83,127,328 bytes.
- SHA-256: `42f20ef73dff177743416d05c7915954fd695fb40b079a6320260c2af2badcc4`.

**Lingua SaaS Desktop v1.0.35**

- Artifact: `lingua-saas-windows-test-v1.0.35`
- Artifact ID: `14787833862`
- File: `Lingua Translate Setup 1.0.35.exe`
- Size: 182,380,516 bytes.
- SHA-256: `6db9849d6db628b8f8299ede461a185c206093bcf01a34f489b073265885ac6a`.

Both artifacts were downloaded and checked independently: each file has a valid Windows PE/MZ header and its actual SHA-256 exactly matches the included `SHA256SUMS.txt`. Both installers are **unsigned** because no code-signing certificate is configured. These are CI test artifacts, not official public releases; they expire on 2026-11-30.

## Vercel Preview smoke checks

Latest Preview for commit `ef5b458d7e311a20b012675bfc1f7380b7b9f943`:

https://lingua-github-import-m63nt44w9-kyawgyi071766-1899.vercel.app

- Deployment `dpl_8GVRDRfBBbtLRXrq2AvLShfwEcen` is `READY`; built with Node.js 22.x.
- Prisma found 6 existing migrations and reported no pending migrations.
- Next.js compilation/type checks passed and all 39 static pages generated.
- Homepage, login, signup, downloads, install, privacy, terms, and manifest returned HTTP 200.
- `/api/health` returned HTTP 200 with `{"status":"ok"}`; CSP, HSTS and `nosniff` headers were present.
- No error/fatal runtime logs were found for this Preview deployment in the inspected 30-minute window.

The project-wide runtime error aggregation did show one earlier Google Translate HTTP 403 event at 2026-11-23 03:09 UTC, but it was attributed to the previous Preview deployment `dpl_4qGfTQSbzKpWDntrNJ37wFqXU2dT`, not the latest Preview. This indicates that a configured Google credential/provider request was rejected at that earlier point. It is not claimed as fixed by this language-map patch; the current Preview health check passes, but live authenticated provider E2E testing has not been performed.

## Remaining pre-release validation

- Live Burmese ↔ Bulgarian translation output quality and human review have not been performed. No billable provider request was sent.
- Authenticated provider status/dashboard E2E checks require an authorized Preview session; they were not bypassed or claimed as verified.
- The Windows installers are unsigned and must not be treated as signed public releases.

## Release status and scope

This security/desktop hotfix PR is stacked on provider-resilience PR #49 and targets `feat/provider-resilience-1.4.1`. PR #50 remains Draft and unmerged. PR #49 also remains Draft and unmerged. No production deployment, production database migration, or production environment update has been performed.
