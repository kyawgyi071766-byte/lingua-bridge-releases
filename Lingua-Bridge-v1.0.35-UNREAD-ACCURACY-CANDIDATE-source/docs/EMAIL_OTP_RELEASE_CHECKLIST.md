# Lingua Bridge — verified email and password recovery rollout

## Current deployment blocker

Production `EMAIL_FROM` is presently a shared Resend `@resend.dev` testing sender, **not** a verified domain owned by the service. Resend limits test sending to the connected account's own address; **do not claim** that arbitrary Gmail/Outlook users can receive verification or reset codes. Never silently disable verification as a workaround.

## Intended secure behavior

1. Signup accepts regular free email providers, including Gmail and plus aliases, but rejects invalid and a small list of common disposable domains. A random-looking Gmail address cannot be judged fake by its spelling; only successful inbox verification proves control.
2. Signup stores a user as unverified without creating a login session. A six-digit OTP is generated with CSPRNG, bound to recipient and purpose using HMAC-SHA256 plus `AUTH_SECRET`, with a 15-minute expiry.
3. Verification is limited per IP and recipient, consumes the OTP atomically, then creates a session. Legacy 64-character email verification links remain accepted until their existing expiry.
4. Forgot Password sends an independent six-digit, 15-minute OTP. Redeeming it consumes the code, re-hashes the password and increments the session version to invalidate old sessions.
5. Login and existing cookie-based API sessions cannot bypass production email verification. There is **no** database schema migration.
6. All automated tests use an in-memory DB and intercepted mail sender. They do not prove real delivery to arbitrary inboxes.

## Before enabling for real customers

- In [Resend Domains](https://resend.com/domains), add a domain that you actually own, create the DNS records shown there and wait for **Verified** status. Do not use `vercel.app` subdomains unless you control the necessary DNS zone.
- In Vercel Production Environment Variables update `EMAIL_FROM` to a sender on **that verified domain** (e.g. `Lingua Bridge <accounts@yourdomain.example>` with your real domain). Keep `RESEND_API_KEY`, `AUTH_SECRET`, database and customer data unchanged.
- Redeploy the current verified GitHub `main` commit to production after the environment variable change and a passing CI build.
- With **a mailbox you control** (never a customer's inbox), exercise signup /verify-email, successful and incorrect code, expired and resent code, login blocked before verification, forgot-password reset flow, replay rejection, and original password not working after reset. Confirm delivery from Resend dashboard and the recipient mailbox.
- Confirm already verified accounts still log in; existing Lingua desktop sessions and translation remain unchanged.
- Watch delivery failures, 429s, and bounce rates. Do not publish a new release as fully verified if any of these checks fail.

## Releasing this branch

Feature PR must pass `npm run audit:static`, Next.js build, Secret scanning, and Desktop QA. **Keep this PR unmerged until a verified sending domain and a controlled inbox are available**, since production currently uses a testing sender.
