# Lingua Server v10.4 — DeepL Language Safety

# Language map update — 2026-11-23

This v10.4 safety note described the earlier 29-language DeepL map. It is superseded for Burmese by the current provider verification: DeepL API supports Burmese using code `MY`, so the current `DEEPL_SUPPORTED` map contains 30 codes and includes `my: "MY"`. Burmese is now part of the ordinary DeepL language selector. Other broad languages still require their configured provider path.

See `LANGUAGE_PAIR_SUPPORT_v1.4.1.md` and `desktop-bridge/RELEASE_NOTES_v1.0.36.md` for the current routing and UI behavior.

---

The production-facing language list is restricted to the 29 language codes already present in the current Lingua `DEEPL_SUPPORTED` mapping. This prevents users from selecting Arabic or another Google-only language while the production server is operating on DeepL without a verified Google fallback.

The restriction is deliberate and reversible. Broader languages should only be re-enabled after Google Translation is configured, cost-guarded and live-tested.
