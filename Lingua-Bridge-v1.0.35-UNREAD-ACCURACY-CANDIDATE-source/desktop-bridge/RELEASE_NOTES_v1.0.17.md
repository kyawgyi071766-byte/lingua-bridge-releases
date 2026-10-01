# Lingua Bridge v1.0.17 — No Refresh + Multilang Candidate

## Account switching / no-white-flash fix
- Messenger webviews now live in a persistent host outside the normal Lingua UI render tree.
- Switching WhatsApp / Telegram / other accounts only changes visibility; it does not recreate the webview.
- Already loaded accounts stay signed in and keep their current chat state.
- A dark loading mask is shown only for a service's first load, preventing a white first-load surface.
- Hidden messenger sessions remain mounted but their translation scanning/direct-send UI is suspended to avoid background quota use and reduce CPU work.

## Language handling
- DeepL-safe languages remain available as before.
- The Microsoft/Google broad-language list is expanded to include Myanmar/Burmese and many additional common languages.
- Broad-language choices are disabled when the live Lingua server has neither Microsoft Translator nor Google Translate configured, instead of allowing a selection that cannot work.
- Owner diagnostics now include Refresh provider status.
- Existing server chain remains DeepL -> Microsoft -> Google when configured.

## Important limitation
Myanmar/Burmese and other broad languages cannot be translated by code alone when the production server is DeepL-only. Configure `MICROSOFT_TRANSLATOR_KEY` (and region when required) or `GOOGLE_TRANSLATE_API_KEY` in the server environment, then refresh provider status.

## Preserved
Chrome/Web in-app browser, Signal in-app entry, drag ordering, Current/Global profiles, direct-send, device limits, gift codes, admin custom apps, account sessions and the custom Lingua logo remain present.
