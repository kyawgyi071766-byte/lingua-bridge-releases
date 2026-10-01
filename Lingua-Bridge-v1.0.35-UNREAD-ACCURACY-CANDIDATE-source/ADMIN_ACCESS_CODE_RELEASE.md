# Lingua v10.1 — Owner Admin Dashboard + Gift Access Codes

## Added
- Owner-only `/admin` dashboard guarded server-side by the exact `ADMIN_EMAIL` account.
- Automatic one-time role bootstrap for the exact `ADMIN_EMAIL` account if an older database row still has role `user`.
- User counts: Free, Pro, Business, active gift-code users, and users active in the last 15 minutes.
- Confirmed crypto revenue totals: today (UTC), current month (UTC), and all time.
- Voice usage and text-character usage totals.
- High-entropy Pro / Business gift access codes.
- Durations: 30 days, 90 days, or permanent.
- `max_uses`, default 1, configurable up to 1000.
- Permanent revocation. Revoking a code immediately returns its active gift users to Free.
- User-side Billing page `Redeem Gift Code` panel.
- Desktop Bridge v0.7.1 `Redeem Gift Code` button.
- Successful desktop redemption switches the desktop translation engine to Live mode.

## Security model
- Access-code lookup uses SHA-256 hashes, not plaintext.
- The owner-viewable code copy is AES-256-GCM encrypted at rest using a key derived from backend-only `AUTH_SECRET`.
- Code generation uses cryptographically secure randomness and an ambiguity-safe alphabet.
- Redemption is authenticated, rate limited by user and IP, server validated, and run in a Serializable database transaction.
- A one-use code cannot be redeemed by a second account after its use count reaches 1.
- Gift access expires/revokes server-side; client-side edits cannot extend quota.
- Admin APIs require both the owner email configured by `ADMIN_EMAIL` and owner/admin authorization.
- Admin pages are marked noindex.

## Database additions
- `User.grant_type` (`free`, `purchase`, `gift_code`)
- `User.access_code_id`
- `User.last_active_at`
- `access_codes`
- `access_code_redemptions` audit table
- Existing pending v10 voice fields: `voiceUses`, `voiceUsageResetAt`

## Voice quotas
- Free: 10 / month
- Pro: 300 / month
- Business: 2,000 / month

## Deployment
This source is already linked to the existing Vercel project by `.vercel/project.json`.
On an authorized Windows PC, double-click `DEPLOY_V10_ADMIN_ACCESS.bat`.
Vercel runs `npm run vercel-build`, which applies pending Prisma migrations before `next build`.

Do not put real API keys or database passwords inside this source archive.
