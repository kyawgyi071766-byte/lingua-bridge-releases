# Lingua Bridge v1.0.31 candidate

## WhatsApp send correction

- Replaced the contenteditable draft in one browser editing operation.
- Removed synthetic beforeinput/input dispatch after that operation. It could make WhatsApp replay the draft, duplicating the message several times.
- Removed the second delete/insert recovery pass. Failed exact-text verification still blocks auto-send.
- If the browser refuses to edit the composer, it fails closed rather than directly changing the DOM behind WhatsApp's draft state.

## Verification

- `npm run qa` includes a controlled-composer regression that reproduces draft duplication caused by synthetic beforeinput.
- `npm run build:web` builds the desktop renderer.
- This Linux workspace cannot run the installed Windows app against an authenticated WhatsApp session. Test a short non-sensitive message in Windows before public distribution.

## Scope

This is a source candidate. No production server deployment or Windows installer is included. The separate WhatsApp conversation-identity and incoming-card issues remain under investigation.
