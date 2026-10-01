# Vercel environment checklist

Use Production environment values, not placeholders.

## Required for launch
- AUTH_SECRET
- DATABASE_URL
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SUPPORT_EMAIL
- ADMIN_EMAIL
- DEEPL_API_KEY and/or GOOGLE_TRANSLATE_API_KEY
- TRANSLATE_PROVIDER=auto
- CRYPTO_CHAIN=tron (recommended initial network)
- CRYPTO_WALLET_ADDRESS
- TRONSCAN_API_KEY (recommended for TRON reliability)
- EMAIL_VERIFICATION_REQUIRED=true
- RESEND_API_KEY
- EMAIL_FROM
- SERVER_URL (same HTTPS origin as NEXT_PUBLIC_SITE_URL)

## Optional
- OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL
- DOWNLOAD_ACCESS_TOKEN and DOWNLOAD_*_URL values
- Legacy Stripe values should remain disabled unless intentionally restored.

## Launch checks
1. Vercel production build succeeds.
2. Sign up with a fresh email and verify it.
3. Log in and translate a short test in at least 3 language pairs.
4. Create a USDT payment instruction and verify the wallet/network/amount visually.
5. Make one small real payment before opening sales; verify automatic activation and paidUntil.
6. Test admin manual payment confirmation on a test record.
7. Test support fallback with OPENAI_API_KEY absent, then AI mode if enabled.
8. Install the PWA on one Android device, one iPhone, and one desktop browser.

## Messenger desktop translation providers
For Lingua Bridge / Easy Translate style desktop messaging, keep provider keys only on the server:
- `TRANSLATE_PROVIDER=auto`
- `DEEPL_API_KEY` (optional but recommended for DeepL-supported languages)
- `MICROSOFT_TRANSLATOR_KEY` (Stage 1 broad-language fallback; supports Burmese/Myanmar, Arabic, Hindi, Thai, Vietnamese and many more)
- `MICROSOFT_TRANSLATOR_REGION` (required for regional/multi-service Azure resources; optional for global Translator resources)
- `MICROSOFT_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com`
- `GOOGLE_TRANSLATE_API_KEY` (optional later fallback / broad coverage)
- `TRANSLATE_CHAIN=deepl,gemini,microsoft,google`

The desktop app never ships these provider keys. It calls `/api/translate` using the signed-in Lingua account so plan limits, suspension rules, and usage accounting remain server-controlled.
