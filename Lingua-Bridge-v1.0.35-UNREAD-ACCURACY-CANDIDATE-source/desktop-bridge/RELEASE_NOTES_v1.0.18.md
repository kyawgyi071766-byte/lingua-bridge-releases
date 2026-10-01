# Lingua Bridge v1.0.18 — Gemini Fallback Candidate

- Preserves v1.0.17 persistent no-refresh account switching.
- Adds Gemini API as a server-side broad-language translation fallback.
- Recommended chain: DeepL -> Gemini -> Microsoft -> Google.
- Broad languages such as Myanmar/Burmese can be enabled when GEMINI_API_KEY is configured.
- Gemini key never ships in the desktop app.
- Microsoft/Google remain optional backup providers.
- Original text is preserved when every provider fails.
- Candidate stays side-by-side with stable Lingua.
