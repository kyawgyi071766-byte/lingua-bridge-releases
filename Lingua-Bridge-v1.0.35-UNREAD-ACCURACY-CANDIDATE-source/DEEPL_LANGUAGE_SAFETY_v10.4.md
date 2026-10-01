# Lingua Server v10.4 — DeepL Language Safety

The production-facing language list is restricted to the 29 language codes already present in the current Lingua `DEEPL_SUPPORTED` mapping. This prevents users from selecting Arabic or another Google-only language while the production server is operating on DeepL without a verified Google fallback.

The restriction is deliberate and reversible. Broader languages should only be re-enabled after Google Translation is configured, cost-guarded and live-tested.
