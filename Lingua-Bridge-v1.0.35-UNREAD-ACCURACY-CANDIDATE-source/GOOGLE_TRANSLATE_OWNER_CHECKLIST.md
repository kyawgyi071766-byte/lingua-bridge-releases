# Owner checklist — Google Translate

Use this checklist before public release.

- Create/choose a Google Cloud project owned by the business owner.
- Enable Cloud Translation API.
- Create an API key and restrict it to the Cloud Translation API where supported by the chosen Google Cloud configuration.
- Put the key only in Vercel Production as `GOOGLE_TRANSLATE_API_KEY`.
- Set `TRANSLATE_PROVIDER=auto`.
- Set `TRANSLATE_PRIMARY=google`.
- Redeploy Production.
- Sign in to Lingua Bridge v0.3 and use **Test Burmese → English**.
- Confirm the test succeeds and reports provider `google`.
- Keep DeepL configured only as an optional fallback unless you intentionally choose DeepL-first routing.
- Never paste the Google or DeepL key into the Electron app, frontend code, screenshots, support chats, or customer devices.
