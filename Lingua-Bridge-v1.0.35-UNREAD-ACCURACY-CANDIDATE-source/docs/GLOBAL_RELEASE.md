# Lingua global release plan

## Recommended release order

1. **Vercel web + PWA first.** This is the fastest worldwide version and uses one codebase on Android, iPhone/iPad, Windows, macOS and Linux. Users can install it from the browser.
2. **Private test installers next.** Run `.github/workflows/build-test-installers.yml` after the web URL is live. It produces an Android test APK plus Windows/Linux/macOS test installers and an iOS Simulator build.
3. **Signed store releases last.** Android Play release needs an Android signing key. Real iPhone installation needs an Apple Developer account, signing certificate/provisioning, then TestFlight/App Store. Windows/macOS signing is strongly recommended before selling native installers.

## Vercel requirements

Create a Vercel project for this repository and configure all production values from `.env.example`. At minimum production needs:

- `AUTH_SECRET`
- `DATABASE_URL` (managed PostgreSQL)
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL`
- one translation provider key (`DEEPL_API_KEY` and/or `GOOGLE_TRANSLATE_API_KEY`)
- `CRYPTO_CHAIN` and `CRYPTO_WALLET_ADDRESS`
- `RESEND_API_KEY` and `EMAIL_FROM` when email verification is enabled
- optional `OPENAI_API_KEY` for AI support

Vercel uses `npm run vercel-build`, which runs Prisma generation, production migrations, and the Next.js build. A deployment should fail rather than go live with an unapplied database migration.

## Private download links

Set `DOWNLOAD_ACCESS_TOKEN` to a long random secret. Send a recipient:

`https://YOUR_DOMAIN/downloads#YOUR_TOKEN`

The URL fragment is not sent with the first HTTP request. The browser exchanges it for a 24-hour httpOnly cookie. Rotate `DOWNLOAD_ACCESS_TOKEN` to revoke previously shared links.

Set installer destinations as HTTPS URLs:

- `DOWNLOAD_ANDROID_URL`
- `DOWNLOAD_WINDOWS_URL`
- `DOWNLOAD_MAC_URL`
- `DOWNLOAD_LINUX_URL`
- `DOWNLOAD_IOS_URL` (normally TestFlight/App Store)

## Important platform facts

- **PWA:** installable immediately on Android/iPhone/desktop after HTTPS deployment.
- **Android test APK:** can be built in GitHub Actions. For public Play distribution, create and protect a release keystore and publish a signed AAB.
- **iPhone:** a real-device native IPA cannot be distributed globally without Apple signing/provisioning. Use the PWA immediately, then TestFlight/App Store for the native version.
- **Windows/macOS:** unsigned installers can trigger operating-system trust warnings. Code signing/notarization should be completed before a broad paid launch.
