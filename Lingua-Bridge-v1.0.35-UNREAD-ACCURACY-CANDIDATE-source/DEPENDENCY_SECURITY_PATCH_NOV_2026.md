# Dependency Security Patch — November 2026

This review updates the packaged web/desktop source dependency tree and verifies the exact committed lockfile using GitHub Actions.

## Security updates

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
- minimatch: the affected Electron Builder dependency paths use `11.0.9`; unrelated legacy nested copies are not force-overridden.

Scoped npm overrides are used where appropriate so fixes do not indiscriminately replace unrelated package trees. The regenerated `package-lock.json` is committed on this security branch; CI verifies reproducible installation with `npm ci`.

## Verification

The latest successful GitHub Actions run is:

https://github.com/kyawgyi071766-byte/lingua-bridge-releases/actions/runs/45100003248

The run completed all of the following successfully:

- Regenerated and committed the lockfile on the isolated security branch.
- `npm ci` on Linux and Windows.
- `audit:dependency-security`, including minimum-version and lock-entry checks.
- Static, translation resilience, language-pair, Gemini/public-release audits.
- Electron desktop security regression test.
- Next.js production build.
- Windows Electron installer build.

The CI-captured `npm audit --json` report for the committed dependency tree reported **0 total vulnerabilities** (0 info, 0 low, 0 moderate, 0 high, 0 critical). This result is specific to the lockfile and registry advisory database at the time of this run; it is not a guarantee that future advisories cannot appear.

## Security references

- Electron advisory GHSA-jr5w-w6x2-84p9 / CVE-2026-115570: https://github.com/advisories/GHSA-jr5w-w6x2-84p9
- PostCSS advisories: https://github.com/advisories/GHSA-qx2v-qp2m-jg93, https://github.com/advisories/GHSA-6g55-p6wh-862q, https://github.com/advisories/GHSA-fxqj-rqcc-2cmp, https://github.com/advisories/GHSA-r28c-9q8g-f849

## Release status and remaining validation

This security PR is stacked on provider-resilience PR #49 and targets `feat/provider-resilience-1.4.1`. Both PRs remain drafts and neither is merged into `main`. No production deployment or production environment change is included.

The CI language-pair audit verifies code routing and fallback eligibility, not translation quality. A live Burmese ↔ Bulgarian provider quality test has not been performed; no billable provider request was sent. Authentication, actual provider availability and human-reviewed sample translations remain separate pre-release checks.

This patch is a targeted dependency remediation. Re-run `npm audit` on future dependency updates and review newly reported advisories before release.
