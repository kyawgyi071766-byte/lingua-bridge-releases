# Lingua v9 — Easy Translate + Google-first release

This source tree combines the existing Lingua SaaS backend (accounts, quotas, admin, USDT billing) with the Lingua Bridge desktop client for direct messenger translation.

## What changed

- Google Cloud Translation is now the recommended primary provider in auto mode for broad worldwide coverage.
- `TRANSLATE_PRIMARY=google` is documented and supported.
- Burmese/Myanmar and any explicit source/target outside DeepL's supported subset are routed to Google first.
- DeepL remains an optional fallback for supported pairs.
- The desktop bridge remains keyless: Google/DeepL secrets stay on Vercel only.
- Desktop bridge v0.3 adds provider-health display and a Burmese → English live test.
- Multiple isolated WhatsApp / Telegram / Messenger / Instagram / Discord / X / Google Chat sessions remain supported.
- Incoming inline translation and outgoing translate-before-send remain supported.

## Production variables for translation

- `TRANSLATE_PROVIDER=auto`
- `TRANSLATE_PRIMARY=google`
- `GOOGLE_TRANSLATE_API_KEY=<server-side Google Cloud Translation API key>`
- `DEEPL_API_KEY=<optional>`
- `DEEPL_API_URL=<optional; normally auto-detected>`

Never place provider keys in the desktop client.

## Validation performed in this workspace

- Desktop renderer static build completed successfully.
- Desktop JavaScript/preload/main-process files passed Node syntax checks.
- Lingua static security/configuration audit passed all checks.
- Distribution static checks passed.

A complete production `npm run build` was not run here because this workspace does not have the project's npm dependencies installed. Run the included CI/build workflow or install dependencies on the build machine before release.

## Before selling

1. Configure a valid Google Cloud Translation API key in Vercel Production.
2. Redeploy Lingua and verify provider status.
3. Run the desktop v0.3 Burmese → English provider test and confirm it reports Google.
4. Live-test current WhatsApp Web and every messenger you advertise; third-party DOMs can change.
5. Build and code-sign the Windows installer, then test on a clean Windows machine.
6. Test multiple WhatsApp accounts to confirm session isolation.
7. Test an actual paid Lingua account and quota enforcement.
