# Lingua Bridge v1.0.29 — Inline Translation Recovery

This candidate fixes the failure mode where direct outgoing translation still works but inline translation cards under Telegram/WhatsApp messages stop appearing.

## Root cause fixed
- Failed card translations no longer clear their message fingerprint and immediately requeue on every messenger DOM mutation.
- Repeated provider 429/502 responses now trigger per-message exponential cooldown instead of a retry storm.
- The host translation queue pauses globally after a transient provider error and limits history retry work.
- Automatic server routing now prefers DeepL for supported pairs even if a stale chain/primary setting places Gemini first.
- Gemini/Microsoft/Google remain available for languages DeepL does not support, including Myanmar/Burmese.

## Retained
- v1.0.28 composer hint behavior.
- Account name/phone metadata and hover tooltip.
- Translation card click isolation/cache restoration.
- v1.0.27 Signal companion and ESC Back.
- v1.0.26 per-message auto-detect/no-flash behavior.
- v1.0.25 safe-send/payment verification behavior.

This release requires both the Vercel server deploy and the desktop build because the fix spans provider routing and desktop retry behavior.
