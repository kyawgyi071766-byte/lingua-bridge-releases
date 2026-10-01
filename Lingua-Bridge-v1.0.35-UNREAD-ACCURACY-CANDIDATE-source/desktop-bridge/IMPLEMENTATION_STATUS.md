# Lingua Bridge Desktop v0.3 — implementation status

Implemented:
- Unlimited duplicate messaging accounts with isolated persistent sessions.
- Quantity-based add-service flow (1–20 copies per add action).
- Current vs Global translation settings.
- 100+ language selector aligned with the Lingua backend.
- Incoming auto-translation overlays under messenger messages.
- Direct native-composer translate-before-send interception for Enter and Send buttons.
- Automatic send after translation, with optional confirm-before-send mode.
- Hidden-by-default fallback Translate & Insert / Translate & Send composer.
- WhatsApp, Telegram, Messenger/Facebook, Instagram, Discord, X, Google Chat and generic DOM adapter rules.
- Rename/remove/reset-session controls per messaging instance.
- Local translation response cache and throttled incoming translation queue.
- Lingua SaaS login, quota, billing and translation API integration.
- Encrypted Lingua auth-cookie persistence using Electron safeStorage where available.
- Normal Chrome user-agent for embedded messenger compatibility.
- Windows NSIS packaging configuration.

Backend companion changes prepared and included in Lingua v9:
- Google Cloud Translation remains server-side via GOOGLE_TRANSLATE_API_KEY.
- DeepL + Google provider auto fallback supported.
- DeepL endpoint auto-selects free/pro endpoint when DEEPL_API_URL is not explicitly supplied.
- Authenticated /api/translate/status route reports provider configuration without exposing secrets.

Still requires live validation before selling:
- Add a valid GOOGLE_TRANSLATE_API_KEY in the Vercel Production environment for Burmese/Myanmar and broad language coverage.
- Fix/replace the current DeepL key if DeepL continues returning HTTP 403.
- Live-test and tune DOM selectors against current WhatsApp Web, Telegram Web and each advertised messenger.
- Verify all relevant third-party service terms for embedded browsers and automated message insertion/sending.
- Build and code-sign the Windows installer on Windows.
- Perform a clean-machine installer test and account/session isolation test.

- v0.3 provider health UI and Burmese → English live test.
- v0.3 understands server `primary` routing status (Google-first recommended).
