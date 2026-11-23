# Lingua Language Safety Test Report — v10.4 / Desktop v1.0.7

Date: 2026-09-21

## Scope
Restrict all customer-selectable languages to the current Lingua DeepL mapping so a customer cannot choose a target such as Arabic that the current production code rejects.

## Allowed target languages (29)
Bulgarian, Czech, Danish, German, Greek, English, Spanish, Estonian, Finnish, French, Hungarian, Indonesian, Italian, Japanese, Korean, Lithuanian, Latvian, Norwegian, Dutch, Polish, Portuguese, Romanian, Russian, Slovak, Slovenian, Swedish, Turkish, Ukrainian, Chinese.

Source language may also be Auto detect.

## Removed from current selectors
Every language outside the current `DEEPL_SUPPORTED` mapping, including Arabic, Burmese/Myanmar, Thai, Vietnamese, Hindi and other Google-only languages.

## Migration behavior
Old saved settings using a removed language are migrated safely:
- source language -> Auto detect
- incoming target -> English
- outgoing/customer target -> English

## QA
- Desktop v1.0.7 preflight: PASS
- Desktop v1.0.7 validation: PASS
- JavaScript syntax checks: PASS
- Desktop static renderer build: PASS
- Server-bundled desktop bridge validation/build: PASS
- Server static security audit: 18/18 PASS
- Access Code/Admin audit: 18/18 PASS
- Device Limit audit: 18/18 PASS
- Update feed audit: 8/8 PASS
- Exact desktop language-set parity with current DeepL map: PASS
- Unsupported Arabic/Burmese/Thai/Vietnamese not exposed by server language list: PASS
- Legacy 100+ language marketing claim removed from server source: PASS

## Release note
This is a conservative safety release. Broader language coverage should only be re-enabled after Google Translation fallback is configured, cost-guarded and live-tested.


## Superseding update — 2026-11-23

This report remains a historical record of the 2026-09-21 implementation. Its statement that Burmese/Myanmar was outside the DeepL mapping is no longer current. DeepL API's Burmese source/target code `MY` is now included in `DEEPL_SUPPORTED`, and Burmese is a normal DeepL option in Desktop Bridge. The other test results and the migration behavior above describe the earlier release only.

Current language support and remaining live-quality validation are documented in `LANGUAGE_PAIR_SUPPORT_v1.4.1.md`.
