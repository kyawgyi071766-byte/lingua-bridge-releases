# Lingua Bridge v1.0.33 — WhatsApp send candidate

- Keeps the v1.0.32 incoming queue delivery repair.
- WhatsApp draft replacement now uses Electron's native `webFrame.insertText` on a selected composer. It inserts the translation once and checks the settled draft before sending. A mismatch stops the send and restores the original where possible.
- Empty translated text never initiates a send.
- Translation failures display `ဘာသာပြန်ခြင်းမအောင်မြင်ပါ`; composer send failures display `စာပို့ခြင်း မအောင်မြင်ပါ` in a neutral status. Raw provider/queue errors are no longer shown as red translation banners.
- `npm run qa` and `npm run build:web` pass on Linux. Windows WhatsApp delivery requires live verification before this candidate is released to customers. Do not claim delivery from a simulated click alone.
