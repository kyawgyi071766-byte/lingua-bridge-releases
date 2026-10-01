# Lingua Bridge v1.0.22 — QA report

Date: 2026-09-25

## Passed automated/static checks
- Desktop preflight and validation: PASS
- Admin custom-app audit: PASS
- v1.0.20 rate-limit carry-forward audit: PASS
- v1.0.22 composer UX / stable identity / update audit: PASS
- Desktop JavaScript syntax checks: PASS
- Static renderer build: PASS
- Public download safety audit: PASS
- Global SEO/public-distribution audit: PASS
- Rate-limit stability audit: PASS
- Gemini translator audit: PASS
- Desktop update-feed audit: 8/8 PASS
- Static security audit: 19/19 PASS

## Verified design properties
- Composer target hint hides while the message box is focused or contains text.
- Public download links can go directly to the configured HTTPS release asset; the Windows binary is not proxied through Vercel.
- Public downloads are indexable, robots allow `/downloads`, and the sitemap includes `/downloads`.
- Google Search Console verification token is configurable server-side.
- Stable Windows application identity remains `com.lingua.bridge` / `Lingua Bridge`.
- Update downloads remain HTTPS + SHA-256 verified before launch.

## Still requires Windows live release gate
This environment cannot prove the final Windows EXE installs successfully on every Windows system. Before calling v1.0.22 final stable, build it on Windows and perform the upgrade + clean-user tests in `PUBLIC_LAUNCH_CHECKLIST_v1.0.22.md`.
