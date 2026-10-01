# Upgrade system — v1.0.21+

## What old v1.0.9 can do
The old stable desktop already calls `/api/desktop/update`. After the Vercel stable feed is configured, v1.0.9 can detect that v1.0.21 is newer and direct the user to Downloads.

## What v1.0.21 adds
From v1.0.21 onward the Settings page can download the owner-published HTTPS installer, verify the complete file against the SHA-256 from the Vercel update feed, and ask the user before launching the installer.

## Publish each future version
1. Keep `appId=com.lingua.bridge` and `productName=Lingua Bridge`.
2. Increase the desktop package version, e.g. 1.0.22.
3. Build/test the Windows installer.
4. Upload it to a public GitHub Release.
5. Copy its SHA-256.
6. Update these Vercel Production variables:
   - `DESKTOP_STABLE_VERSION`
   - `DESKTOP_STABLE_WINDOWS_URL`
   - `DESKTOP_STABLE_WINDOWS_SHA256`
   - `DESKTOP_STABLE_RELEASE_NOTES`
   - `DESKTOP_STABLE_MANDATORY=false`
   - `DOWNLOAD_WINDOWS_URL` (usually the same installer URL)
7. Redeploy Vercel.
8. Test update detection from the previous stable release before announcing it.

For public downloads set `DOWNLOAD_ACCESS_MODE=public`. Use `private` if owner access codes should still gate downloads.
