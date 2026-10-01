# Lingua Bridge v1.0.30 QA report

## Root cause found

1. Production `/api/translate` logs showed repeated Gemini HTTP 429 failures. A legacy forced-provider environment can route common DeepL-supported languages through Gemini and exhaust its quota.
2. The desktop inline-card retry path preserved a message fingerprint after failure, but the delayed retry then exited immediately when it saw that same fingerprint. A transient failure could therefore leave a message permanently without a card.
3. Visible-history scanning repeatedly targeted a fixed small slice of the newest bubbles. Older visible untranslated bubbles could be skipped indefinitely.
4. `scheduleScan()` used a reset-on-every-mutation debounce. Busy Telegram DOM activity could continuously postpone scanning.
5. Full message discovery/diagnostics ran every 500 ms, adding unnecessary DOM work and reducing UI responsiveness.

## v1.0.30 changes

- Pending fingerprint set prevents duplicate in-flight incoming requests.
- A failed fingerprint is now retryable after its backoff expires.
- Target language is captured per pending request, preventing a late result from being cached/displayed under a newly selected target.
- Visible messages are progressively backfilled until all eligible visible cards have been translated.
- Scan scheduling is leading-edge throttled at 70 ms instead of being indefinitely postponed by continuous mutations.
- Full diagnostic scans move to a 3.5 s timer; lightweight unread/composer/conversation work remains frequent.
- Common DeepL-supported language cards can use two translation workers; broad-language providers stay serialized.
- Server routing prefers DeepL for supported pairs even if a stale `TRANSLATE_PROVIDER=gemini` preference exists. Set `TRANSLATE_PROVIDER_STRICT=true` only to deliberately force one provider.
- Native Electron theme is forced dark and the main window title contains an English/Chinese thank-you message.

## Automated checks run

PASS:
- desktop preflight
- desktop validation
- admin/custom audit
- retained v1.0.28 UX audit
- retained v1.0.29 recovery audit
- v1.0.30 incoming-speed audit
- Electron main/preload/app JavaScript syntax checks
- static renderer build
- v1.0.30 server routing audit

## Required live checks

- Deploy the v1.0.30 server first.
- German/English/Spanish/Chinese should use the common-language fast path when DeepL is configured.
- Burmese and other broad-only languages still depend on Gemini/Microsoft/Google capacity; provider quota cannot be bypassed by desktop code.
- Test one long Telegram chat with `Auto translate visible history` enabled and, if desired, `Also translate my own sent messages` enabled.
