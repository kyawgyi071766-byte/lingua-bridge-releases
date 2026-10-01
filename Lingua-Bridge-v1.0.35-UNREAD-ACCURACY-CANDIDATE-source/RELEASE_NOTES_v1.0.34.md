# Lingua Bridge v1.0.34 — automatic sent-message cards candidate

- On direct send, watch for the newly created outgoing bubble and add its translation card automatically, without using the manual Translate button.
- If the translation provider identifies the typed source as the selected display language, use the already known original text immediately and avoid a second API request.
- Otherwise request a fresh translation for the outgoing bubble, prioritized as a new message.
- Limit the watch to the original conversation and exclude existing bubbles so the card cannot attach to an earlier matching message.
- Includes v1.0.33 WhatsApp send and v1.0.32 queue changes.

`npm run qa` and `npm run build:web` pass on Linux. This is a source candidate. Check actual WhatsApp send and automatic card timing on Windows before publishing an official version or selling the app.
