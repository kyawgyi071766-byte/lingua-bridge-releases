# Lingua Bridge v1.0.25 Candidate

- Fixes a WhatsApp/direct-send race where follow-up keypress/beforeinput/click events could escape while translation was already in progress, allowing the original draft to be sent alongside the translated draft.
- Replaces the entire messenger composer in one verified operation and refuses to auto-send unless the composer exactly matches the translated text.
- Applies the same safe-send verification to all supported messenger webviews, not only WhatsApp.
- Preserves Telegram behavior, persistent no-refresh sessions, unread badges, sidebar collapse/expand, account tooltips, translation providers and existing settings.
- Adds optional payment receipt upload for AI-assisted screening, duplicate-image hashing, and fraud indicators.
- Receipt images never activate a paid plan on their own. Pro/Business activation requires an independent blockchain match or owner flow that itself performs the same on-chain check.
- Duplicate transaction hashes remain blocked. Reused receipt images are detected.
- Customer support uses real signed-in payment state: confirmed paid users are told to refresh Lingua; unresolved cases are directed to sshksshk2002@gmail.com.
