# Lingua Bridge v1.0.21 — Public Release Candidate

## Upgrade behavior

- Keeps the stable Windows identity `com.lingua.bridge` / `Lingua Bridge`, matching the original stable Windows app, so the NSIS installer is an in-place upgrade path instead of a side-by-side candidate.
- v1.0.9 can already query `/api/desktop/update`; after the stable feed is configured it can tell users a newer version exists and send them to Downloads.
- v1.0.21 adds a direct **Download Lingua <version>** button after an update is detected.
- Silent self-replacement is intentionally disabled until the Windows installer is code-signed.

## Publish a new version

1. Build with `desktop-bridge\BUILD_WINDOWS_v1.0.21_PUBLIC_RELEASE.bat`.
2. Test the installer and ZIP on a clean Windows account.
3. Upload the installer and ZIP to a GitHub Release.
4. Copy the installer's SHA-256 shown by the build script.
5. Set Vercel Production environment variables:
   - `DOWNLOAD_ACCESS_MODE=public` (only when you want anyone to download)
   - `DOWNLOAD_WINDOWS_URL=<HTTPS release asset URL>`
   - `DESKTOP_STABLE_VERSION=1.0.21`
   - `DESKTOP_STABLE_WINDOWS_URL=<HTTPS installer URL>`
   - `DESKTOP_STABLE_WINDOWS_SHA256=<64-char SHA-256>`
   - `DESKTOP_STABLE_RELEASE_NOTES=<short notes>`
   - `DESKTOP_STABLE_MANDATORY=false`
6. Redeploy Vercel.
7. On v1.0.9 press **Check for updates**; it should report v1.0.21. On v1.0.21+ the direct update-download button should appear.

## Production limitations before paid advertising

- Gemini Free Tier has real quota/rate limits. v1.0.20+ removes artificial request bursts, but a shared free project cannot guarantee translation capacity for many simultaneous paying customers.
- A Windows code-signing certificate is strongly recommended before broad distribution. Without it Windows SmartScreen may warn users, and silent automatic replacement remains disabled.
- Run real end-to-end tests for account creation, device limits, translation, payment activation, support, download, update feed, and rollback before calling the release fully stable.
