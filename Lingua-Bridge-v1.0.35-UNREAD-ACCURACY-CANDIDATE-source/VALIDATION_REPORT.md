# Lingua v6 — Validation Report

Date: 2026-09-19

## Implemented scope

- USDT direct-wallet payment claims for TRON (TRC20) and BNB Smart Chain (BEP20).
- Unique per-claim USDT amounts, seven-day verification window, explorer-based verification, duplicate transaction protection, and immediate 30-day plan activation.
- Payment records, `paidUntil`, and manual-only `suspended` account state in Prisma/PostgreSQL.
- AI customer-support widget with OpenAI-compatible API support and a no-key fallback responder.
- Admin-only user suspension/unsuspension and manual payment confirmation.
- Legacy Stripe source retained but disabled by default and removed from customer billing UI.
- Paid-plan expiry to Free is enforced in the translation API.

## Validation completed in this environment

- `node scripts/static-audit.js`: PASS — 17/17 checks.
- Internal TypeScript project check with local external-module stubs: PASS.
- TypeScript syntax/transpile pass across 58 `.ts`/`.tsx` files: PASS.
- Heuristic secret scan: PASS — no embedded production-looking API keys, crypto private keys, or seed phrases were detected.
- Prisma migration files and PostgreSQL migration lock are included.

## Full build/database verification limitation

A true dependency-backed `npm run build` could not be completed in this execution environment because the supplied `node_modules` tree does not contain runnable `prisma`/`next` binaries and this environment cannot currently reach the npm registry. The observed build result was:

```text
> prisma generate && next build
sh: 1: prisma: not found
```

An attempt to obtain Prisma through `npx prisma db push` hit npm registry DNS/network failures (`EAI_AGAIN`) and timed out. No real production PostgreSQL connection string was provided here, so applying the schema to the owner's database would not be appropriate from this environment anyway.

Therefore, do **not** interpret this report as a claim that the final production Next.js build or the owner's live database migration has already run. On a normal machine/CI runner with registry access and the real `.env`, run the commands below before release:

```bash
npm install
npx prisma generate
npx prisma db push
npm run verify:config
npm run audit:static
npm run build
```

For an existing production database where migrations are version-controlled, prefer:

```bash
npx prisma migrate deploy
npm run build
```

## Release gate

Do not accept real customer payments until all of the following are true:

1. The real Trust Wallet receiving address and selected chain are configured and independently verified.
2. A small end-to-end live USDT test payment has been detected and activated correctly.
3. A second test proves that a non-matching transfer cannot activate a claim.
4. Admin manual confirmation and Suspend/Unsuspend have been tested with non-admin accounts.
5. `npm run build` passes with zero errors in the actual deployment environment.
6. The PostgreSQL migration has been applied and backed up.
7. Terms, privacy policy, tax/accounting, refund handling, and any local crypto-payment obligations have been reviewed for the operating jurisdiction.
