# Lingua Bridge v1.0.34 distribution handoff

## Current state (2026-09-26)

- The Vercel project `lingua-github-import` already serves `/downloads`, but the live page is the older private v1.0.9 page. `/api/download/list` returns `authorized:false`, and the stable update feed still points to v1.0.9.
- The public GitHub repository `kyawgyi071766-byte/lingua-bridge-releases` is reserved for release binaries. A v1.0.34 `.exe` has not been built or uploaded by this handoff.
- The v1.0.34 source passed desktop QA and static web build on Linux; the Windows installer must be built and checked on Windows.

## 1. Build on Windows

Unzip the v1.0.34 source privately. If using the separate publication kit, copy its `desktop-bridge/BUILD_WINDOWS_v1.0.34_RELEASE.ps1` into the unzipped source's `desktop-bridge/` folder. In PowerShell, from that folder, run `./BUILD_WINDOWS_v1.0.34_RELEASE.ps1`. It installs dependencies, runs QA, builds an x64 NSIS installer, and writes `SHA256SUMS.txt` beside it in `release-v1.0.34-public/`.

Install that `.exe` on Windows. With a test conversation, verify one translated WhatsApp send, one new incoming message card, one outgoing message card without a Translate click, no duplicate send, and app login. Read the SHA-256 shown by the script. A build that has only passed automated QA must not be labeled verified for customers.

## 2. Upload to GitHub Releases

Use **only** `https://github.com/kyawgyi071766-byte/lingua-bridge-releases` as the public binary repository. Create tag `v1.0.34`, then upload exactly `Lingua-Bridge-Setup-1.0.34.exe` and `SHA256SUMS.txt` to that release. Keep it a draft until the Windows test succeeds. Do not upload `.env`, API keys, the server source, or the source ZIP to the public releases repository.

After publication, verify the actual download works and matches the checksum. The intended direct asset URL is:

`https://github.com/kyawgyi071766-byte/lingua-bridge-releases/releases/download/v1.0.34/Lingua-Bridge-Setup-1.0.34.exe`

This URL does not work until that release and asset exist. An unsigned installer may show a Windows reputation warning; code signing is a separate distribution decision.

## 3. Configure Vercel production

The Vercel source is the **repository root** (Next.js), excluding `desktop-bridge/`, `release*/`, `.exe`, and `.zip` as already configured in `.vercelignore`. The Vercel project is `lingua-github-import`. Retain its existing private server secrets and database settings; do not copy them into GitHub.

Set these production environment variables after the verified GitHub release exists:

| Variable | Value |
| --- | --- |
| `DOWNLOAD_ACCESS_MODE` | `public` |
| `DOWNLOAD_WINDOWS_URL` | Verified direct GitHub asset URL above |
| `DESKTOP_STABLE_VERSION` | `1.0.34` |
| `DESKTOP_STABLE_WINDOWS_URL` | Same verified direct GitHub asset URL |
| `DESKTOP_STABLE_WINDOWS_SHA256` | Exact 64-character SHA-256 from the Windows build |
| `DESKTOP_STABLE_RELEASE_NOTES` | `Automatic sent-message cards and WhatsApp send stability` |
| `DESKTOP_STABLE_MANDATORY` | `false` |

Redeploy **production** after changing environment variables. Existing provider keys, `DATABASE_URL`, login/payment settings, and `NEXT_PUBLIC_SITE_URL` remain configured in Vercel. Do not enable public mode if the intended commercial flow requires the download itself to be private; an account subscription can still be required inside the desktop app.

## 4. Verify before sharing

1. `/downloads` must show the correct version and a Windows download button without an access code.
2. `/api/download/list` must show `authorized:true` and a Windows entry with the intended URL.
3. `/api/desktop/update?platform=win32&arch=x64&current=1.0.33` must show `version:1.0.34`, the intended URL, and the exact SHA-256.
4. Download the `.exe` from the customer page and compare its SHA-256 with `SHA256SUMS.txt`.

Only after all four checks pass, share this **customer landing page**:

`https://lingua-github-import.vercel.app/downloads`

Suggested customer text: “Lingua Bridge Windows ကို ဒီစာမျက်နှာမှ ဒေါင်းလုဒ်လုပ်နိုင်ပါတယ် — https://lingua-github-import.vercel.app/downloads ။ Install ပြီးနောက် သင့် Lingua account ဖြင့် ဝင်ပါ။”
