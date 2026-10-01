# Lingua v1.0.16 — Microsoft Translator Stage 1

This candidate adds Microsoft Translator as a server-side translation provider without changing the current stable v1.0.9 production deployment.

## Provider routing

Recommended candidate chain:

`DeepL -> Microsoft Translator -> Google Translate -> error/original text preserved`

DeepL is skipped automatically when a source/target pair is outside the DeepL map. Microsoft and Google are broad-coverage fallbacks.

## New server environment variables

- `MICROSOFT_TRANSLATOR_KEY`
- `MICROSOFT_TRANSLATOR_REGION` — optional for a global single-service Translator resource, required for regional/multi-service resources
- `MICROSOFT_TRANSLATOR_ENDPOINT` — default `https://api.cognitive.microsofttranslator.com`
- `TRANSLATE_CHAIN=deepl,microsoft,google`

Keys remain server-side and are never bundled into the Windows installer.

## Stage 1 extra languages

The candidate enables these provider-backed languages in addition to the existing DeepL-safe set:

- Arabic (`ar`)
- Hindi (`hi`)
- Myanmar / Burmese (`my`)
- Thai (`th`)
- Vietnamese (`vi`)

The desktop will only allow provider-backed selections after `/api/translate/status` reports Microsoft Translator or Google Translate as configured.

## Failure safety

If all configured providers fail, the translation request fails cleanly. The client must keep the original text/message visible and must not silently replace it with an empty or fabricated translation.

## Not included yet

Yandex Translate and LibreTranslate are intentionally not added in this stage. Add them only after Microsoft fallback passes live preview tests.
