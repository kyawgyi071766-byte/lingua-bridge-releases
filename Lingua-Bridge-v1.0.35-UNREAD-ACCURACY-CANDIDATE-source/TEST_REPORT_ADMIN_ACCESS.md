# Admin + Access Code Test Report — 2026-09-20

## Passed
- Existing server static audit: 18/18 PASS.
- Distribution static checks: PASS.
- Access Code/Admin source audit: 18/18 PASS.
- Modified TypeScript/TSX files parsed with TypeScript; no non-resolution syntax/type parse errors were reported.
- Desktop v0.7.1 JavaScript syntax checks: PASS.
- Desktop preflight: PASS.
- Desktop validation: PASS, including voice endpoint wiring.
- Neon temporary-branch migration: PASS.
- Neon temporary branch contains voice quota columns, grant/activity columns, `access_codes`, and `access_code_redemptions`.
- Temporary-branch simulated gift redemption: PASS (Free test user -> Pro gift grant, access-code relation, redemption audit record, used_count=1).

## Production facts observed before deployment
- Production Neon currently has only the init and crypto-payment migrations applied.
- Therefore the v10 voice migration and the new Access Code/Admin migration are still pending in production until deployment.
- Production `/api/voice/usage` and `/api/voice/translate` were previously observed as 404 before the v10 voice backend is deployed.

## Pending live QA after production deployment
- Owner `/admin` login.
- Create 30-day Pro code.
- Redeem from a Free test account and verify 300 voice/month.
- Verify a second account cannot reuse a 1-use code.
- Revoke a gift code and verify the user returns to Free immediately.
- Create Business and permanent codes.
- Verify revenue cards against confirmed Payment records.
- Verify desktop v0.7.1 Redeem Gift Code -> Live mode.
- Verify `/api/voice/usage` and `/api/voice/translate` are no longer 404.
