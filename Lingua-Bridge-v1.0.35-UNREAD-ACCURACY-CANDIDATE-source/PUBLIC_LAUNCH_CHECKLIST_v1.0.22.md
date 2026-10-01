# Lingua Bridge v1.0.22 — Public launch checklist

1. Run `DEPLOY_VERCEL_v1.0.22_GLOBAL_PUBLIC_RELEASE.bat` from the project root.
2. Run `desktop-bridge\BUILD_WINDOWS_v1.0.22_GLOBAL_PUBLIC_RELEASE.bat` on Windows.
3. Install `Lingua-Bridge-Setup-1.0.22.exe` over the existing Lingua Bridge installation and confirm:
   - version 1.0.22 opens;
   - Telegram/WhatsApp sessions remain available;
   - settings remain available;
   - English ↔ Myanmar/Burmese works;
   - the composer target-language hint disappears while typing;
   - Check for updates still opens normally.
4. Test the same installer on a second clean Windows user or Windows machine.
5. Create GitHub Release `v1.0.22` and upload the EXE (and optional ZIP fallback).
6. Copy the EXE's direct HTTPS release-asset URL and the exact SHA-256 printed by the build script.
7. In Vercel Production set:
   - `DOWNLOAD_ACCESS_MODE=public`
   - `DOWNLOAD_WINDOWS_URL=<direct HTTPS EXE asset URL>`
   - `DESKTOP_STABLE_VERSION=1.0.22`
   - `DESKTOP_STABLE_WINDOWS_URL=<same direct HTTPS EXE asset URL>`
   - `DESKTOP_STABLE_WINDOWS_SHA256=<exact 64-character SHA-256>`
   - `DESKTOP_STABLE_RELEASE_NOTES=Lingua Bridge v1.0.22 global public release`
   - `DESKTOP_STABLE_MANDATORY=false`
8. Redeploy Production.
9. Verify `/downloads`, `/robots.txt`, and `/sitemap.xml` are public.
10. In an older Lingua build press **Check for updates** and confirm v1.0.22 is detected.
11. For Google discovery, add the site to Google Search Console, set `GOOGLE_SITE_VERIFICATION`, redeploy, then submit `/sitemap.xml`.

## Important
- Google/Chrome search discovery is not instant or guaranteed; indexing and ranking are controlled by the search engine.
- An unsigned Windows installer may trigger Microsoft SmartScreen. A Windows code-signing certificate is recommended before a large public advertising campaign.
- Gemini/provider free-tier rate limits still apply even though Lingua now deduplicates and paces translation requests.
