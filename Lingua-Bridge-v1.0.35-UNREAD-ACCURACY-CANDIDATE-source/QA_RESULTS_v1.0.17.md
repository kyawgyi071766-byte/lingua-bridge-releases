# Lingua Bridge v1.0.17 QA Results

## Desktop no-refresh architecture
PASS — persistent webview map
PASS — persistent webview host outside normal UI render tree
PASS — renderer no longer injects/recreates the active webview
PASS — inactive views remain mounted and session-isolated
PASS — active/inactive setting is sent per webview
PASS — hidden webviews suspend translation scanning/direct-send UI
PASS — dark first-load mask avoids white first-load surface
PASS — Current/Global conversation state remains instance-bound
PASS — drag ordering preserved
PASS — Chrome in-app preserved
PASS — Signal in-app preserved
PASS — Admin Custom App Manager preserved

## Language/provider architecture
PASS — DeepL core preserved
PASS — Microsoft Translator server route preserved
PASS — Google fallback preserved
PASS — Myanmar/Burmese code `my` present
PASS — broad language list expanded
PASS — broad language selectors are disabled when Microsoft/Google is unavailable
PASS — provider status refresh control added
PASS — original text remains protected on provider failure

## Automated commands
- `npm run qa` — PASS
- `npm run build:web` — PASS
- `node --check dist/app.js` — PASS
- root `microsoft-translator-audit.js` — PASS
- root `static-audit.js` — 19/19 PASS
- root `update-feed-audit.js` — 8/8 PASS

## Live-test requirement
Electron webview persistence still requires final live Windows testing with real Telegram/WhatsApp sessions. Broad languages such as Myanmar/Burmese require a real Microsoft Translator or Google Translate credential on the Lingua server; the source intentionally does not embed API secrets.
