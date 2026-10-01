# Lingua Bridge v1.0.22 — Global Public Release Candidate

## User-facing fix
- The in-messenger target-language hint no longer stays on top of the message composer while the user is typing.
- The hint hides as soon as the composer is focused or contains text, so it cannot cover typed content or occupy distracting visual space.

## Global distribution
- Public `/downloads` page is indexable and included in the sitemap.
- SEO metadata targets searches such as Lingua Bridge, desktop messenger translator, WhatsApp translator, Telegram translator and Myanmar/Burmese translator.
- Optional `GOOGLE_SITE_VERIFICATION` environment variable supports Google Search Console verification without a source edit.
- Public download mode returns the configured HTTPS release asset directly instead of proxying the large installer through Vercel.
- GitHub Release assets (or another HTTPS release CDN) can therefore handle the large binary globally.

## Upgrade safety
- Stable application identity remains `com.lingua.bridge` / `Lingua Bridge`.
- Existing verified update-download + SHA-256 verification remains enabled.
- Rate-limit stability, Gemini broad-language fallback, no-refresh messenger switching and pointer reorder are retained.

## Release gate
Static QA passed. Before advertising the build publicly, create the Windows artifacts on Windows, install over the existing stable version, confirm sessions/settings remain, upload the EXE to the release host, configure the Vercel stable feed with its exact SHA-256, and perform one clean-machine install test.
