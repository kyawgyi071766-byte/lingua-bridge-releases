# Translation Provider Resilience — v1.4.1

## What changed

- Keeps the existing provider chain, language-pair filtering, bounded retry logic, and fallback behavior.
- Adds a shared, database-backed monthly character counter for each translation provider. It reuses the existing `RateLimitBucket` table, so this change does not require a Prisma schema migration.
- Adds atomic budget reservations before an external provider is called. If a configured monthly limit is exhausted, the router skips that provider and tries the next compatible provider.
- Persists provider cooldowns in the database so a 429, 456, repeated timeout, or server error is not retried by every new serverless instance.
- Clears the persistent cooldown after a successful translation.
- Adds provider usage status to `GET /api/translate/status` for the verified owner admin only. It reports character counts, configured limits, request counts, failure counts, and active cooldowns. It never returns API keys or message text.
- Sends Google Cloud Translation credentials in the `x-goog-api-key` request header rather than the URL query string.

## Monthly budgets

The optional environment variables are:

- `DEEPL_MONTHLY_CHAR_LIMIT`
- `GEMINI_MONTHLY_CHAR_LIMIT`
- `MICROSOFT_TRANSLATOR_MONTHLY_CHAR_LIMIT`
- `GOOGLE_TRANSLATE_MONTHLY_CHAR_LIMIT`

A value of `0` means no local cap. For DeepL API Free, detected either from a key ending in `:fx` or the `api-free.deepl.com` endpoint, the default local cap is 450,000 Unicode characters per UTC calendar month, leaving a margin below the plan's published monthly allowance. Google Cloud Translation Basic (the v2 endpoint used here) also defaults to 450,000 characters per UTC calendar month. Google currently applies a $10 monthly credit to the first 500,000 NMT text-translation characters, but Cloud Translation still requires an active Cloud Billing account; this is not a no-billing API. Usage above the credit can be billed to the linked billing account, and other apps in the same Google Cloud project can consume the shared allowance. Explicit provider limit variables override the local defaults.

Counters are conservative: characters are reserved before the provider call and are not rolled back on provider errors, because a timeout can happen after a provider has received and processed a request. This favors preventing accidental overuse over maximizing the displayed remaining balance.

## Operational notes

- Provider order remains controlled by `TRANSLATE_CHAIN`, `TRANSLATE_PROVIDER`, and `TRANSLATE_PRIMARY`. Providers without credentials and unsupported DeepL language pairs are skipped.
- A monthly cap is a local safeguard, not a provider-issued quota. Keep the provider's own quota/billing alerts enabled as well.
- The shared counter records aggregate usage only. It does not store submitted text, translations, API keys, or user identifiers in readable form.
- Google Cloud Translation may require an active billing account. A local character cap does not make a billable provider free; do not enable a billable provider unless its billing conditions and spending cap are understood.
- MyMemory is intentionally not added as a general-purpose fallback because its terms and usage model impose constraints that are not suitable for an unrestricted chat-translation pipeline.

## Remaining follow-up work

1. Verify the exact source/target pairs used by the app against each provider's currently supported language list.
2. Add a translation-result cache only after defining a privacy/retention policy for message text.
3. Evaluate a Burmese-capable local model on realistic Burmese ↔ Bulgarian samples before selecting it as an offline fallback.
4. Run the desktop incoming/outgoing regression suite and live provider smoke tests before publishing a production release.


## Official provider references

- Google Cloud Translation language support: https://docs.cloud.google.com/translate/docs/languages
- Google Cloud Translation Basic setup and billing requirement: https://docs.cloud.google.com/translate/docs/setup
- Google Cloud Translation pricing and monthly NMT credit: https://cloud.google.com/products/translate/pricing
- Microsoft Translator language support: https://learn.microsoft.com/azure/ai-services/Translator/language-support

These references document provider support, not the translation quality of Lingua Bridge's selected language pairs. Real Burmese ↔ Bulgarian sample tests are still required before production release.
