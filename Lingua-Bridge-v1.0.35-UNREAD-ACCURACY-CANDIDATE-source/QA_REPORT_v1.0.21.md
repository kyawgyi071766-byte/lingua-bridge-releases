# Lingua Bridge v1.0.21 Public Release Candidate — QA Report

## Static/server audits passed
- Rate-limit stability: PASS
- Gemini translator wiring: PASS
- Security/static audit: 19/19 PASS
- Desktop update feed: 8/8 PASS
- Device limits: 18/18 PASS
- Access code/admin: 18/18 PASS
- Public/private download mode: PASS

## Desktop audits passed
- Preflight: PASS
- Renderer validation: PASS
- Admin custom apps: PASS
- v1.0.20 stability regression audit: PASS
- v1.0.21 public-release/update audit: PASS
- JavaScript syntax checks: PASS
- Static renderer build: PASS

## Update safety added
- Stable app identity is `com.lingua.bridge` / `Lingua Bridge` to preserve the upgrade path from the original stable Windows app.
- Update URLs must use HTTPS.
- The stable update feed requires a 64-character SHA-256.
- v1.0.21 downloads the installer itself, hashes the complete file, deletes it on checksum mismatch, and only allows a file verified in the current Lingua session to be launched.
- Silent installation remains disabled until the Windows installer is code-signed.

## Final checks still required on Windows before paid advertising
- Build the Windows installer and ZIP using `desktop-bridge\\BUILD_WINDOWS_v1.0.21_PUBLIC_RELEASE.bat`.
- Install over the existing v1.0.9 on a Windows test machine and confirm settings/account data behavior.
- Test a clean install on a second Windows user/profile.
- Upload the installer to the public GitHub Release and configure the Vercel stable update-feed variables.
- Confirm v1.0.9 reports v1.0.21 as available and v1.0.21 can download, SHA-256 verify, and launch a later test update.
- Run live English↔Myanmar plus another broad language under realistic message volume.

## Production capacity note
Gemini Free Tier has real provider quotas. v1.0.20+ prevents Lingua from creating artificial translation bursts, but a shared free API project cannot guarantee capacity for many simultaneous paying customers. A paid/second broad-language provider should be added before large advertising spend.
