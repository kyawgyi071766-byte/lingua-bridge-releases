# Lingua Bridge v0.3 release notes

This release changes Lingua from a separate translation-page-only workflow into an Easy Translate-style desktop messaging workflow.

Key behavior:
- Add the same WhatsApp or Telegram service repeatedly; every copy has an isolated login session.
- Incoming visible chat messages can be translated inline under the original message.
- Users type directly in the messenger's native message field.
- Pressing Enter/Send can be intercepted, translated to the selected language, reinserted, and sent automatically.
- Optional confirmation mode inserts the translation and waits for a second Send/Enter action.
- Current-account and Global translation profiles are supported.
- A fallback composer remains available but is hidden by default.
- The language selector is aligned with the Lingua backend's 100+ languages.
- Server-side DeepL + Google Translate auto fallback is supported; Google is required for Burmese/Myanmar coverage in the current provider design.

Before commercial release, live-test every advertised messenger because third-party DOM structures and policies can change independently of Lingua.


## v0.3 additions

- Adds a provider health card in the desktop translation settings.
- Shows whether Google and DeepL are configured without exposing either API key.
- Adds a one-click Burmese → English provider test so the owner can verify Google routing before selling the installer.
- Server auto-routing now defaults to Google-first worldwide coverage when `TRANSLATE_PRIMARY` is omitted, while still allowing `TRANSLATE_PRIMARY=deepl`.
- Explicit source languages outside DeepL's supported subset are routed to Google first.
