# Lingua Voice Translator release

Voice entitlement policy:
- Free: 10 live voice translations / calendar month
- Pro: 300 / calendar month
- Business: 2,000 / calendar month
- Recommended maximum: 30 seconds per voice item

Server endpoints:
- GET /api/voice/usage
- POST /api/voice/translate

The desktop client performs speech recognition when Chromium supports it, then sends only the transcript to the server. The server enforces the account plan quota and performs translation through the existing Google/DeepL routing. Text-to-speech playback uses the local system/browser voices and does not consume an additional server voice translation use.

The server is authoritative for usage. Test Mode in the desktop client does not consume production quota.
