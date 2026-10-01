# Lingua Bridge v1.0.7 — DeepL Language Safety

- Language selectors now expose only the 29 target languages validated by the current Lingua DeepL mapping.
- Removed Arabic, Thai, Vietnamese, Burmese/Myanmar and every other language outside the current DeepL-supported map from desktop selectors.
- Existing saved Current/Global/legacy profiles using a removed language are migrated safely: source -> Auto detect; incoming/outgoing target -> English.
- Direct-send, Current/Global conversation profiles, device limits, gift codes, settings/update center and messenger sessions are unchanged.
- This is intentionally a conservative release. Broader languages can be restored later only after the Google provider is configured and live-tested.
