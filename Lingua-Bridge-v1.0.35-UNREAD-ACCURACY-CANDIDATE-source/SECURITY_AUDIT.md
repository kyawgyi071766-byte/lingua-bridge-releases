# Lingua Security / Payment Audit Notes

## Implemented safeguards

- Translation/provider secrets, blockchain explorer keys, and AI support keys stay server-side.
- Crypto billing stores only a public owner receiving address. No wallet private key or seed phrase is required or supported.
- Payment claims use unique, collision-protected amounts and a temporary unique `matchKey` to reduce ambiguous on-chain matching.
- Auto-verification accepts only confirmed incoming transfers to the configured wallet, on the configured USDT token contract/network, within the claim verification window, and within ±0.01 USDT of the expected amount.
- Transaction hashes are unique in the database so the same transfer cannot activate multiple payment claims.
- Payment verification errors never suspend or downgrade a user.
- Plan activation is performed in a database transaction and immediately sets `paidUntil` to 30 days after confirmation.
- Expired crypto paid access is reverted to Free before `/api/translate` serves a request.
- Suspension is admin-only. There is no automatic fraud suspension path.
- Admin self-suspension is blocked in the UI/API to reduce owner lockout risk.
- Legacy Stripe routes are retained but disabled by default with `LEGACY_STRIPE_ENABLED=false` so old webhook activity cannot unexpectedly overwrite crypto-managed plans.
- Support AI has a no-key fallback, message/rate limits, and explicit instructions never to request wallet seed phrases, private keys, passwords, or one-time codes.
- Cross-site mutation requests are blocked by the existing same-site protections.
- Existing HTTPS, httpOnly cookie, auth-secret, email-token, and rate-limit hardening remains in place.

## Deployment checks still required by the owner

- Verify the exact Trust Wallet receiving address and selected chain before going live.
- Verify the USDT contract used by the chosen network; optional contract override env vars are available if your provider/explorer uses a different supported token contract.
- Use production-grade PostgreSQL backups.
- Use HTTPS only.
- Keep explorer/API/AI keys in host environment secrets, never client code.
- Test a real small payment end-to-end before advertising paid access.
- Review local tax, refund, consumer-protection, sanctions/AML, and crypto-payment requirements for the jurisdictions where you sell the service.
