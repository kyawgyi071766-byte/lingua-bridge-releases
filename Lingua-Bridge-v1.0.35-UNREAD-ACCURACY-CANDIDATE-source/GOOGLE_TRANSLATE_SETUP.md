# Google Cloud Translation setup for Lingua

Lingua v9 supports DeepL + Google Cloud Translation in server-side `auto` mode.

Required Vercel Production variables for broad language coverage:

- `TRANSLATE_PROVIDER=auto`
- `TRANSLATE_PRIMARY=google` (recommended for worldwide/Burmese coverage)
- `GOOGLE_TRANSLATE_API_KEY=<Google Cloud Translation API key>`
- `DEEPL_API_KEY=<optional DeepL key>`
- `DEEPL_API_URL=<optional explicit DeepL endpoint>`

Google is especially important for Burmese/Myanmar (`my`) and languages outside DeepL's supported subset.

Security rule: never put `GOOGLE_TRANSLATE_API_KEY` or `DEEPL_API_KEY` in the Electron desktop source. The desktop client signs in to Lingua and calls the server's `/api/translate` endpoint so provider secrets remain under the owner-controlled Vercel environment.

After changing provider environment variables, redeploy the Vercel Production deployment. The authenticated `/api/translate/status` endpoint can report whether DeepL and Google are configured without returning either secret.

## Recommended routing

With `TRANSLATE_PROVIDER=auto` and `TRANSLATE_PRIMARY=google`, Lingua tries Google first for broad language coverage, then DeepL as a fallback for DeepL-supported target pairs. If you explicitly select a source language that DeepL does not support, Lingua routes that request to Google first. This avoids Burmese/Myanmar text being sent to DeepL first.

The Google key remains server-side in Vercel. Do not place it in Electron, browser JavaScript, the PWA bundle, or mobile wrappers.
