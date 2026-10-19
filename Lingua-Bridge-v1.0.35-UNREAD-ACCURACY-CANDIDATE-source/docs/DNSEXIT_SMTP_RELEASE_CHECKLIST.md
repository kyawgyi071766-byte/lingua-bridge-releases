# Lingua Bridge — DNSExit SMTP rollout (DO NOT deploy early)

## Current state

- DNSExit delegated free sender domain: lingua-bridge-sshk.publicvm.com.
- DNSExit Relay Account was reported OK and sender domain has been added; SPF/DKIM and real Gmail delivery are NOT yet verified.
- Resend explicitly rejected the free public subdomain. Do not use Resend for this DNSExit domain.
- Production currently uses shared Resend testing sender @resend.dev; OTP branch is unmerged. No production config has been modified.
- This branch contains no relay usernames/passwords and performs no real sending during automated tests.

## DNSExit DNS setup

Go to DNSExit DNS Settings for lingua-bridge-sshk.publicvm.com.

1. Add root TXT (Host @ or the UI root label) with VALUE: v=spf1 include:dnsexit.com -all.
   Do not create a SECOND SPF TXT record if one already exists; combine mechanisms into the single valid record.
2. Add CNAME host relay._domainkey pointing to dkim.dnsexit.com. Use the fully-qualified host only if DNSExit UI requires it.
3. Do not delete existing website A/CNAME or MX entries. Sending emails does not require incoming MX.
4. In DNSExit Mail Relay > Sender Domains, verify SPF and DKIM. Require both to show passing.
5. Verify relay account status is OK and its billing is truly free/trial; Pay As You Go does NOT guarantee 25 free emails per day. Official free offer mentions 25 relays/day with renewal every 180 days. Check the actual account's quota.

Official DNSExit guidance:
https://dnsexit.com/faq/?tab=mail-relay&faq=configure-spf-dkim-for-a-domain
https://dnsexit.com/services/email-smtp-relay-outbound/

## Controlled Gmail test BEFORE any production rollout

With a mailbox you own and SMTP credentials from DNSExit (do not paste secrets into chat or GitHub):
- SMTP host: relay.dnsexit.com
- Port: 587
- TLS: STARTTLS required, certificate validation enabled
- Authentication: SMTP relay username + SMTP relay password (not necessarily DNSExit web password).
- Sender address: Lingua Bridge <verify@lingua-bridge-sshk.publicvm.com>
- Recipient: a Gmail test mailbox controlled by the user.

Verify the message arrives and is DKIM/SPF authenticated; check Relay Activity, spam and quotas.

## Coordinated Vercel rollout (ONLY after inbox check)

Set ALL of these in Vercel Production together:
- EMAIL_TRANSPORT=dnsexit-smtp
- EMAIL_FROM=Lingua Bridge <verify@lingua-bridge-sshk.publicvm.com>
- SMTP_USER=<DNSExit SMTP relay username, sensitive>
- SMTP_PASSWORD=<DNSExit SMTP relay password, sensitive>
- DNSEXIT_SENDER_VERIFIED=true, ONLY after both SPF/DKIM and real controlled Gmail delivery PASS.

Keep AUTH_SECRET, DATABASE_URL, other user data, and Resend key unchanged for rollback. Do not use a random Email From sender. The 25/day limit is likely too small for an unlimited public signup rollout.

Run in Preview and CI first: npm ci, npm run audit:static, npm run build, desktop QA, secret scan. Resolve any merge conflicts with main before deployment. After deploying, test signup, 6-digit verification (invalid/expired/replay), resend, forgot-password, password reset, session revocation, previously verified existing users, and desktop translation. Monitor errors/bounces and be ready to roll back.

The DNSExit SMTP transport uses a fixed hostname and port, authenticated STARTTLS with certificate validation, and fails closed if the sender is not exactly on the intended domain or the verified rollout flag is missing in production. The flag does not substitute for DNS/mailbox verification. No automatic production merge is authorized before E2E delivery is confirmed.
