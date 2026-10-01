# Lingua Bridge v1.0.30 — Incoming Translation Speed + Recovery

- Fixes inline translation retries that could become permanently suppressed after a transient failure.
- Progressively translates all visible history instead of repeatedly scanning only the last few bubbles.
- Uses leading-edge scan throttling so continuous Telegram DOM changes cannot starve translation scans.
- Reduces expensive full-DOM diagnostics frequency for faster clicking/account switching.
- Allows two concurrent common-language translation cards while keeping broad-language providers serialized.
- Server routing prefers DeepL for supported language pairs even when a stale legacy `TRANSLATE_PROVIDER` preference exists. Set `TRANSLATE_PROVIDER_STRICT=true` only if an operator intentionally wants a single forced provider.
- Keeps per-message auto-detect for mixed-language customer conversations.
- Forces the Windows native theme dark and sets a bilingual thank-you window title: English + Chinese.

## Live test
1. Deploy the v1.0.30 server fix.
2. Build/install the desktop candidate.
3. Select German/Chinese/Burmese incoming targets and open a chat containing many visible messages.
4. Confirm cards progressively fill under both customer messages and your own sent messages when `Also translate my own sent messages` is enabled.
5. Switch accounts/chats repeatedly and confirm clicks remain responsive and there is no white flash.
