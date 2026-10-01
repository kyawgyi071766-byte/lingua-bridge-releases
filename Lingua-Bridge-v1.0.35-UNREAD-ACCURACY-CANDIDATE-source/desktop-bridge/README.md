# Lingua Bridge Desktop v0.3

Desktop client for the Lingua SaaS backend. It is designed to behave like an Easy Translate-style messaging translator rather than a separate translation page.

## Main workflow

1. Add WhatsApp, Telegram, Messenger, Instagram, Discord, X, Google Chat or another supported web chat.
2. Add the same service multiple times; every copy gets an isolated persistent browser session, so different accounts can remain logged in at the same time.
3. Choose a Current-account or Global translation profile.
4. Incoming visible messages can be translated automatically and displayed directly under the original message.
5. Type directly inside the messenger's own message composer. When you press Enter/Send, Lingua intercepts the send action, translates to the selected outgoing language, places the translated text back in the native composer, and sends it automatically unless confirmation is enabled.
6. A separate fallback composer is available but hidden by default.

## Translation providers

The desktop app never contains a DeepL or Google API key. It signs in to the existing Lingua server and calls `/api/translate`. The server chooses the provider:

- DeepL for supported language pairs when configured.
- Microsoft Translator Stage 1 broad-language fallback for Burmese/Myanmar, Arabic, Hindi, Thai and Vietnamese; Google remains an optional later fallback.
- `TRANSLATE_PROVIDER=auto` is recommended.

This keeps API keys private and keeps plan quotas, account suspension, billing, and usage accounting under the owner's control.

## Security and account control

- Messaging login passwords are entered only into the official embedded service page, not into Lingua.
- Each messaging instance uses its own `persist:lingua-*` Electron partition.
- Lingua's SaaS login session is encrypted at rest with Electron `safeStorage` when the operating system provides encryption.
- Translation results are cached locally to reduce duplicate API requests caused by virtualized chat UIs.
- Automatic outgoing translation can require a second user confirmation before sending.
- Web service DOM structures can change. The app includes current selectors plus a fallback composer, but live compatibility testing is required before commercial release.

## Development

Install dependencies and run `npm run dev`.

## Windows installer

On Windows, run `npm run build:win`. The installer is generated in `release/`.

For public distribution, code-sign the installer and test the current WhatsApp Web / Telegram Web / other service UIs and terms before shipping.
