# Lingua Bridge v1.0.35 — unread accuracy candidate

This candidate addresses a false Telegram account unread badge reported with v1.0.34. Telegram now counts only chat rows with an explicit unread marker. Generic `.badge` elements and Telegram window title numbers do not create unread counts.

Tradeoff: a chat hidden in an unmounted folder or an unrecognized Telegram DOM variant may be omitted from the account badge. This is deliberate: a missing badge is preferable to claiming a customer replied when no confirmed unread marker exists. Telegram notifications about account security may still appear in Telegram itself.

## Windows build

Extract this source ZIP. Open `desktop-bridge` and double-click `START-BUILD-WINDOWS.bat`. It runs QA, builds the x64 installer, and writes `release-v1.0.35-public/Lingua-Bridge-Setup-1.0.35.exe` plus `SHA256SUMS.txt`.

Before publishing, install the candidate on Windows and check: (1) all read or outgoing Telegram chat rows show no red account badge; (2) a real unread message in one chat shows 1; (3) opening that chat clears the badge if no other chat is unread; (4) WhatsApp sending and inline translations still work. Do not overwrite the published v1.0.34 release asset.

Local verification: `npm run qa` and `npm run build:web` passed on Linux. A Windows installer and end-to-end Telegram check were not possible in this environment.

The user-provided third-party portable translator link was not executed or incorporated into this project. No reliable product documentation was found at that direct binary URL, so its feature behavior was not assumed.
