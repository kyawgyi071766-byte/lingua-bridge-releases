# Lingua Bridge v1.0.28 — Composer / Account Details / Translation Card Stability Candidate

## Changes

- Restores the in-messenger empty-composer language guide. Example: `Auto detect → Spanish (Español)`.
- The guide remains visible while an empty composer is focused and disappears as soon as the user types, so it never covers typed text.
- Keeps the existing toolbar **Account details** action and adds direct sidebar editing: right-click or double-click an account to save/edit the display name and phone number.
- Hover details now explain how to edit missing name/phone information and continue to show saved values locally on the PC.
- Inline incoming translation cards are now click-stable: mouse interaction on the card does not bubble into the host messenger.
- Successful incoming translations are cached by target language + message fingerprint and are reattached if a messenger virtual-list re-render removes the injected card.
- Retains v1.0.27 Signal companion / ESC Back, v1.0.26 per-message auto-detect and no-flash switching, v1.0.25 safe-send behavior, unread badges, and persistent sessions.

## Live QA to perform

1. Empty Telegram composer: language guide is visible. Type one character: guide disappears. Delete all text: guide returns.
2. Right-click Telegram 3: save account name and phone. Hover it: both saved values appear.
3. Receive/translate a message, click/select the translation card, then navigate the chat. Translation card remains or is restored after the messenger re-renders the message.
4. Confirm Telegram/WhatsApp sending, unread badges, Signal launch, and ESC Back remain unchanged.
