# Lingua Bridge v1.0.11 — Owner/Admin Custom Apps + Signal candidate

This is a **side-by-side candidate build**. The known-working v1.0.9 production installer and Vercel production site are not modified.

## Added
- Owner/Admin-only **Custom App Manager** inside **Add messaging service**.
- Owner/Admin can save reusable HTTPS web-chat/app templates with a custom name and URL.
- Saved custom templates appear in the service picker only for an authenticated Lingua account whose server role is `admin`.
- Custom app instances use isolated persistent Electron partitions, so each copy keeps its own login session.
- Custom templates can be edited or deleted without destroying already-added instances or their existing login sessions.
- HTTPS validation blocks `http:`, `file:`, `javascript:`, `data:` and URLs containing embedded usernames/passwords.
- Signal remains built in. Lingua launches the official Signal Desktop app through `sgnl://`; if Signal is not installed, it opens the official Signal download page.

## Preserved
- Existing WhatsApp, Telegram, Messenger, Instagram, Facebook, Discord, X/Twitter, Google Chat, TikTok, VK, LINE, Teams, Snapchat, Zalo, Slack, Google Messages and LinkedIn entries.
- Existing v1.0.9/v1.0.10 Current/Global per-conversation behavior.
- Existing translation/direct-send logic and generic adapter fallback.
- Existing account login, owner diagnostics, gift-code, device-limit, cache, proxy and update UI.
- Existing persisted messaging instances are not removed by the v1.0.11 migration.

## Deliberate safety boundary
- Owner custom templates are stored locally on the owner/admin Windows installation. They are **not synchronized to all customer PCs** in this candidate. Server-side distribution of owner-defined services is intentionally deferred so the working production backend does not need to change.
- A custom site loading successfully does not guarantee native composer/direct-send translation. Unknown sites use the generic adapter until separately live-tested/tuned.
- Signal stays outside the embedded browser; Signal authentication/messages remain in official Signal Desktop.

## Release gate
Do not replace the public v1.0.9 installer until this candidate passes live Windows tests. Build with `BUILD_WINDOWS_v1.0.11_ADMIN_CUSTOM_CANDIDATE.bat`.
