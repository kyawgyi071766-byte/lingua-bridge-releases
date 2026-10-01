# Lingua Bridge v1.0.16 — Microsoft Translator Stage 1 Candidate

## Added
- Owner diagnostics now show Microsoft Translator configuration status.
- Provider-backed language candidates: Arabic, Hindi, Myanmar/Burmese, Thai, Vietnamese.
- These broader languages can be used for source, incoming display and outgoing target only when the server reports Microsoft Translator or Google Translate configured.
- Existing DeepL-safe languages continue to work as before.

## Server candidate routing
- Recommended chain: DeepL -> Microsoft Translator -> Google Translate.
- DeepL is skipped automatically for unsupported language pairs.
- If every provider fails, the request fails cleanly and the original text is preserved.
- Provider keys remain server-side only.

## Preserved
- v1.0.15 Chrome/Web in-app browser and fast add.
- Signal in-app official site + Signal Desktop launcher behavior.
- Drag-and-drop account ordering.
- Owner/Admin custom web apps.
- Existing Current/Global profiles and direct-send safeguards.

## Live release gate
Do not replace stable v1.0.9 or production server yet. Configure Microsoft Translator in a Preview environment and test at least English<->Burmese, English<->Thai, English<->Vietnamese, English<->Arabic and English<->Hindi before production promotion.
