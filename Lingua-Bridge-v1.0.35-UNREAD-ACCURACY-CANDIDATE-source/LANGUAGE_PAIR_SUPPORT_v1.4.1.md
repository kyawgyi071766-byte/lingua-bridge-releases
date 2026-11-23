# Burmese ↔ Bulgarian provider support — v1.4.1

## Confirmed by current provider documentation

The app's language catalog contains:
- Burmese / Myanmar: `my`
- Bulgarian: `bg`

The checked provider language references show:

| Provider | Burmese (`my`) | Bulgarian (`bg`) | Notes |
| --- | --- | --- | --- |
| Google Cloud Translation | Supported | Supported | Official NMT language list includes both codes; the v2 Basic API supports text translation |
| Microsoft Translator | Supported | Supported | The Cloud Text translation table lists both codes |
| DeepL | Not supported in Lingua's current map | Supported | Lingua must skip DeepL whenever Burmese is either source or target |

Official references:
- Google Cloud Translation languages: https://docs.cloud.google.com/translate/docs/languages
- Google Cloud Translation Basic API overview: https://docs.cloud.google.com/translate/docs/api-overview
- Microsoft Translator language support: https://learn.microsoft.com/azure/ai-services/Translator/language-support

## Expected Lingua routing

1. Burmese → Bulgarian: DeepL must be skipped because Burmese is not in Lingua's `DEEPL_SUPPORTED` map. Use Google or Microsoft when configured.
2. Bulgarian → Burmese: DeepL must be skipped because the target Burmese is unsupported. Use Google or Microsoft when configured.
3. If Google and Microsoft are both unavailable or rejected, Lingua must return the original message unchanged and report a temporary translation failure; it must not replace the original message with an empty result.

## Billing and free usage warning

Google currently provides a $10 monthly credit for the first 500,000 NMT text-translation characters, but Google Cloud Translation still requires an active Cloud Billing account. This is not a no-billing service. The local 450,000-character cap only limits Lingua Bridge's own recorded usage; it cannot control other apps sharing the same Google Cloud project or replace Google's billing controls.

Reference: https://cloud.google.com/products/translate/pricing and https://docs.cloud.google.com/translate/docs/setup

## What is not yet proven

Official language lists only confirm that a provider lists those languages. They do not prove the quality of Burmese ↔ Bulgarian output, nor do they prove that the credentials configured in this particular deployment are active. Before a production release, run a small set of human-reviewed examples in both directions and confirm the provider name returned by Lingua. Do not use private customer conversations as test material.
