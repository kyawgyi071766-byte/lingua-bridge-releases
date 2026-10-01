# Lingua Bridge v1.0.32 — incoming queue delivery candidate

- Each incoming message ID is admitted separately, including repeated text.
- When the 24-item pending queue overflows, displaced requests receive an error response instead of waiting forever.
- Includes the v1.0.31 WhatsApp composer safety change.
- Regression test: `desktop-bridge/scripts/incoming-queue-regression.cjs`.

`npm run qa` and `npm run build:web` pass on Linux. This is source code, not a Windows installer or a verified live-messenger release. Live WhatsApp/Telegram DOM capture, provider responses, and inline card rendering still require a Windows test with diagnostics. Do not publish it as a stable release until that test passes.
