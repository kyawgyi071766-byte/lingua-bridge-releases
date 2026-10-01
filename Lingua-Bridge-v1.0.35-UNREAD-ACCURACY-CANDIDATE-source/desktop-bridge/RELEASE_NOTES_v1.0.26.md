# Lingua Bridge v1.0.26 - Fast Auto-Detect + No-Flash Candidate

## Changes
- Incoming messages always use per-message source-language auto detection. A customer can switch between English, Spanish, Chinese, French, Burmese, and other supported languages in the same conversation without changing the source-language setting.
- New incoming messages receive priority over historical backfill.
- Translation DOM scan debounce reduced from 550 ms to 110 ms.
- Broad-provider pacing is adaptive: normal live chat is faster, while provider 429/quota pressure automatically slows the queue instead of flooding Gemini.
- Historical translation remains lower-priority and more conservatively paced.
- Persistent messenger webviews keep their last valid geometry during UI-only rerenders, eliminating the blank/white frame caused by temporarily hiding the webview host.
- Messenger webviews are still not recreated when switching Lingua accounts or translation settings.

## Safety retained
- v1.0.25 safe-send protections are retained.
- Translation cache remains enabled.
- Existing Telegram/WhatsApp sessions and account ordering are retained.
