# Dependency Security Patch — November 2026

This patch updates two dependency paths identified during the November 2026 review.

## Changes

- Electron runtime: `44.4.3` → `44.9.1`. Electron's security advisory for compromised eMudhra intermediate certificates marks 44.x versions before 44.9.1 as affected. The lockfile retains the upstream npm tarball URL and SHA-512 integrity.
- Next.js nested PostCSS: `8.4.31` → `8.5.28`, using an npm override scoped to `next`. This resolves the nested PostCSS copy without changing Next.js or the app's top-level PostCSS version.

## Verification

- `npm ci` must succeed using the committed lockfile.
- `npm run audit:dependency-security` verifies the minimum locked versions and Electron SHA-512 integrity.
- The existing web build and desktop regression/installer QA remain required.

## Security references

- Electron advisory GHSA-jr5w-w6x2-84p9 / CVE-2026-115570: https://github.com/advisories/GHSA-jr5w-w6x2-84p9
- PostCSS advisory GHSA-qx2v-qp2m-jg93: https://github.com/advisories/GHSA-qx2v-qp2m-jg93
- PostCSS advisory GHSA-6g55-p6wh-862q: https://github.com/advisories/GHSA-6g55-p6wh-862q
- PostCSS advisory GHSA-fxqj-rqcc-2cmp: https://github.com/advisories/GHSA-fxqj-rqcc-2cmp
- PostCSS advisory GHSA-r28c-9q8g-f849: https://github.com/advisories/GHSA-r28c-9q8g-f849

These dependency updates do not by themselves constitute a complete remediation of every advisory reported by npm. Review the full `npm audit` report separately.
