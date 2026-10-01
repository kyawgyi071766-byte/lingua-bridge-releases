# Lingua Bridge v1.0.19 — Reorder + Gemini Diagnostics Candidate

## Fixed
- Replaced Electron/Chromium HTML5 DataTransfer account dragging with pointer-capture dragging.
- Moving a lower account to the top now updates the array, DOM order, and persisted localStorage order immediately.
- Fixed downward-drag index calculation that could make an account appear to snap back.
- Dragging/reordering does not rebuild or reload persistent Telegram/WhatsApp webviews.

## Translation diagnostics
- Owner provider diagnostics now shows the exact Lingua server URL used by the desktop client.
- Gemini/Microsoft/Google broad languages remain disabled until the server reports a configured broad provider.
- Myanmar/Burmese support still requires GEMINI_API_KEY, MICROSOFT_TRANSLATOR_KEY, or GOOGLE_TRANSLATE_API_KEY on the same server environment the desktop app uses.

## Safety
- Stable v1.0.9 is not overwritten.
- No provider API key is embedded in the desktop package.
