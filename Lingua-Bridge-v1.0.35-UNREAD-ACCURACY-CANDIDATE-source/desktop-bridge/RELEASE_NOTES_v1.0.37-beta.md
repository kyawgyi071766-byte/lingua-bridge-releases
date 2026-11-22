# Lingua Bridge Desktop v1.0.37-beta.1

## Incoming translation first-scan fix

- Restore locally cached translations for previously translated history.
- Keep the newest three incoming messages eligible for real-time translation when a conversation is first opened.
- Do not silently mark all visible incoming messages as seen and return before the real-time translation pass when automatic historical translation is disabled.
- Keep older uncached history available for manual translation.

## Test focus

1. Open a chat with existing incoming messages and confirm the newest incoming messages translate on first open.
2. Send a new incoming message and confirm it translates.
3. Switch away and back; cached cards should restore without re-translating the entire history.
4. Change the incoming target language and confirm a fresh translation is requested.

This is a beta build for testing, not a production release.