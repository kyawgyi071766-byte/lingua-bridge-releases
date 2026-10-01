# One Codebase → Web · Android · iPhone · Windows · macOS · Linux

The Next.js deployment is the product backend. Capacitor mobile shells and Electron desktop shells load the deployed HTTPS site. You control the server, database, translation provider keys, owner Trust Wallet receiving address, and app-store listings.

## 1. Production web backend first

Set a real PostgreSQL `DATABASE_URL`, translation API key(s), crypto payment variables, auth/email secrets, and `NEXT_PUBLIC_SITE_URL`.

```bash
npm install
npx prisma generate
npx prisma db push
npm run verify:config
npm run audit:static
npm run build
```

Deploy the web app to your chosen host, then set `SERVER_URL=https://your-domain.com` for native wrappers.

## 2. Crypto payment preflight

For TRON / USDT-TRC20:

```env
CRYPTO_CHAIN=tron
CRYPTO_WALLET_ADDRESS=T...
TRONSCAN_API_KEY=optional-but-recommended
```

For BSC / USDT-BEP20:

```env
CRYPTO_CHAIN=bsc
CRYPTO_WALLET_ADDRESS=0x...
BSCSCAN_API_KEY=required
```

Use only a public receiving address. Never store a seed phrase or private key in the app or environment.

## 3. Android

```bash
npx cap add android     # first time only
npm run android
```

Open Android Studio → Build → Generate Signed Bundle → upload `.aab`.

## 4. iPhone / iOS

```bash
npx cap add ios         # first time only
npm run ios
```

Open Xcode → Archive → upload. iOS distribution requires Apple developer tooling/account.

## 5. Desktop

```bash
SERVER_URL=https://your-domain.com npm run electron:dev
SERVER_URL=https://your-domain.com npm run electron:build
```

Use OS-specific builders/signing for Windows, macOS, and Linux production installers.

## 6. Final release checks

- Test signup, login, email verification, password reset, and logout.
- Test DeepL and Google fallback behavior.
- Create a crypto payment claim without sending funds and confirm it stays `pending` with no suspension.
- On a test/low-value production payment, send the exact displayed USDT amount on the exact displayed network and verify immediate plan activation.
- Confirm the same transaction hash cannot activate two payments.
- Test admin manual confirmation and manual suspend/unsuspend controls.
- Test paid-plan expiry to Free.
- Test the support widget both with and without `OPENAI_API_KEY`.
