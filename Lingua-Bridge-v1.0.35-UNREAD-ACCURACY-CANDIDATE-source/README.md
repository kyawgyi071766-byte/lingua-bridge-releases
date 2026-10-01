# Lingua — Translation SaaS with USDT Billing

Lingua is a full-stack translation SaaS built with Next.js App Router, TypeScript, Tailwind, Prisma/PostgreSQL, DeepL/Microsoft Translator/Google Translate, JWT cookie auth, and one shared codebase for web, Capacitor mobile shells, and Electron desktop wrappers.

## Current paid-plan flow

Stripe files are intentionally kept for legacy compatibility, but they are disabled by default and are not shown in the UI. Customer upgrades use USDT only:

1. User opens **Billing** and chooses Pro or Business.
2. `POST /api/payment/create` creates or reuses a pending payment claim with a collision-protected unique USDT amount.
3. Lingua shows the exact amount, active network, and owner Trust Wallet address.
4. User sends the exact amount and clicks **I have paid — verify now**.
5. `POST /api/payment/check` checks confirmed incoming USDT transfers through TronScan (TRC20) or BscScan/Etherscan-compatible BSC APIs (BEP20).
6. A matching, unused transaction immediately confirms the payment and activates the selected plan for 30 days.
7. When `paidUntil` expires, `/api/translate` automatically reverts the account to Free before translating.

Payment verification never suspends an account. Suspension is admin-only and intended only for proven fraud.

## Plans

- Free — $0, configurable free monthly character quota.
- Pro — $9 / 30 days, 500,000 characters/month.
- Business — $29 / 30 days, 5,000,000 characters/month.

The on-chain payment amount includes a small unique cent suffix used only to identify the incoming transfer without a memo.

## Crypto configuration

Required production variables:

```env
CRYPTO_CHAIN=tron
CRYPTO_WALLET_ADDRESS=YOUR_OWNER_TRUST_WALLET_ADDRESS
TRONSCAN_API_KEY=
BSCSCAN_API_KEY=
```

- `CRYPTO_CHAIN=tron` uses USDT-TRC20 and TronScan. The TronScan key is optional but recommended.
- `CRYPTO_CHAIN=bsc` uses USDT-BEP20 and requires `BSCSCAN_API_KEY`.
- Optional token-contract overrides are documented in `.env.example`.
- Never put a wallet seed phrase or private key in Lingua. Only the public receiving address belongs in `CRYPTO_WALLET_ADDRESS`.

## AI customer support

A floating support widget is available on every page. It supports quick replies for payment instructions, pricing, payment-not-detected cases, and human escalation.

Optional OpenAI-compatible variables:

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is empty, Lingua automatically uses a built-in keyword responder. The support prompt explicitly instructs the bot never to ask for seed phrases, private keys, passwords, or one-time codes.

## Admin controls

The admin dashboard includes:

- User plan and usage overview.
- Manual **Suspend / Unsuspend** control. Admin accounts cannot be suspended through the UI. Suspension is never automatic.
- Crypto payment history.
- Manual payment confirmation when legitimate proof exists but explorer auto-detection missed the transfer. Manual confirmation activates the paid plan immediately for 30 days.
- Supported-app list management.

## Database changes

`User` now includes:

- `paidUntil DateTime?`
- `suspended Boolean @default(false)`

A `Payment` model stores payment claim, amount, chain, transaction hash, status, claim/confirmation timestamps, and a temporary matching key that prevents two active claims from sharing a payment amount.

After setting a real PostgreSQL `DATABASE_URL`, run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

For production deployments where schema history matters, prefer `prisma migrate dev` during development and `prisma migrate deploy` in production after reviewing the migration.

## Important environment variables

See `.env.example` for the complete list. Production requires at minimum:

- `AUTH_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL`
- at least one translation provider key
- `CRYPTO_CHAIN`
- `CRYPTO_WALLET_ADDRESS`
- `BSCSCAN_API_KEY` when BSC is selected
- email variables when email verification is enabled

Run `npm run verify:config` before production deployment.

## Main new files

```text
src/lib/cryptoPayments.ts
src/app/api/payment/create/route.ts
src/app/api/payment/check/route.ts
src/app/api/support/route.ts
src/app/api/admin/user/suspend/route.ts
src/app/api/admin/payment/confirm/route.ts
src/components/SupportWidget.tsx
src/components/AdminUserTable.tsx
src/components/AdminPayments.tsx
```

Legacy Stripe implementation remains under `src/lib/stripe.ts`, `/api/checkout`, `/api/billing-portal`, and `/api/webhook/stripe`, but `LEGACY_STRIPE_ENABLED=false` is the default.

## Lingua Bridge desktop messaging translator

The `desktop-bridge/` folder contains the v0.3 Electron client for Easy Translate-style direct chat translation. It supports multiple isolated WhatsApp/Telegram/etc. sessions, incoming inline translation, and native-composer translate-before-send behavior. Provider keys remain server-side; configure Google Cloud Translation for Burmese/Myanmar and broad language coverage.


## v9 translation routing

For the Easy Translate-style desktop workflow, v1.0.16 adds Microsoft Translator as the Stage 1 broad-language fallback. The recommended candidate chain is `TRANSLATE_CHAIN=deepl,microsoft,google`; DeepL is skipped automatically for unsupported language pairs, Microsoft handles broader languages such as Burmese/Myanmar, Arabic, Hindi, Thai and Vietnamese, and Google can remain a later fallback when configured. Provider API keys stay only in Vercel server environment variables.

## v10.1 Owner Gift Access integration

When used with the Lingua v10.1 server, signed-in users can choose **Redeem Gift Code** inside the Lingua account panel. The desktop calls `/api/access-code/redeem`; plan and quota validation remain server-side. A successful redemption switches the desktop to Live mode and refreshes account/voice allowance. Pro codes receive 300 voice uses/month and Business codes receive 2,000 voice uses/month.


## v1.0.29 inline translation recovery
Stops failed inline message translations from repeatedly re-requesting on every messenger DOM mutation, adds provider-wide back-pressure, and prefers DeepL for supported language pairs to conserve broad-provider quota. Run the v1.0.29 Vercel deploy before testing the v1.0.29 desktop build.
