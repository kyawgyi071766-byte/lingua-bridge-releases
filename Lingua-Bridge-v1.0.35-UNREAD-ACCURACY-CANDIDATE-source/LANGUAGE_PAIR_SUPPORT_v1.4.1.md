# Burmese ↔ Bulgarian provider support — v1.4.1

## Confirmed by current provider documentation

The app's language catalog contains:
- Burmese / Myanmar: `my`
- Bulgarian: `bg`

DeepL's current Translator language list contains 114 languages, including Burmese. The DeepL API Service Specification also lists `MY` as both a source and target language. Lingua Bridge's DeepL map now uses `my: "MY"` so the app sends the correct API language code in either direction.

| Provider | Burmese (`my`) | Bulgarian (`bg`) | Notes |
| --- | --- | --- | --- |
| DeepL | Supported | Supported | App maps Burmese to API code `MY` and Bulgarian to `BG` |
| Google Cloud Translation | Supported | Supported | Official NMT language list includes both codes; the v2 Basic API supports text translation |
| Microsoft Translator | Supported | Supported | The Cloud Text translation table lists both codes |

Official references:
- DeepL Translator languages: https://support.deepl.com/hc/en-us/articles/360019925219-DeepL-Translator-languages
- DeepL API supported languages: https://developers.deepl.com/docs/getting-started/supported-languages
- DeepL Pro Service Specification (API source and target codes): https://www.deepl.com/pro-license_embedded
- Google Cloud Translation languages: https://docs.cloud.google.com/translate/docs/languages
- Google Cloud Translation Basic API overview: https://docs.cloud.google.com/translate/docs/api-overview
- Microsoft Translator language support: https://learn.microsoft.com/azure/ai-services/Translator/language-support

## Expected Lingua routing

1. Burmese → Bulgarian: DeepL is now eligible and receives `source_lang=MY`, `target_lang=BG`.
2. Bulgarian → Burmese: DeepL is now eligible and receives `source_lang=BG`, `target_lang=MY`.
3. When DeepL is exhausted or unavailable, the provider chain can continue to another configured provider.
4. If all configured providers are unavailable or rejected, Lingua must return the original message unchanged and report a temporary translation failure; it must not replace the original message with an empty result.

## Billing and free usage warning

The DeepL language list confirms language support, not that a particular API key is active or that a provider request will succeed. DeepL API Free uses its free endpoint and is subject to its own usage limits. Lingua Bridge applies a conservative local cap when it detects a DeepL API Free key or endpoint; the local cap does not replace provider-side usage enforcement.

Google currently provides a $10 monthly credit for the first 500,000 NMT text-translation characters, but Google Cloud Translation still requires an active Cloud Billing account. This is not a no-billing service. The local 450,000-character cap only limits Lingua Bridge's own recorded usage; it cannot control other apps sharing the same Google Cloud project or replace Google's billing controls.

Reference: https://cloud.google.com/products/translate/pricing and https://docs.cloud.google.com/translate/docs/setup

## What is not yet proven

The code-level routing audit verifies the API language-code mapping, not translation output quality. A live Burmese ↔ Bulgarian provider request and human review have not been performed in this pass. Do not use private customer conversations as test material. Before a public release, use a short, non-sensitive example in each direction and confirm both the returned text and provider metadata.
