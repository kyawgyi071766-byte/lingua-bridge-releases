# Lingua Server v10.3 — Device Limit System

## Rules
- Purchased Pro / Business: up to 2 active Lingua Bridge desktop devices.
- Gift / Access Code Pro / Business: 1 active Lingua Bridge desktop device.
- Free accounts: device limit is not enforced.
- Desktop Test Mode is local mock mode and does not consume or register a device slot.

## Security
- Lingua Bridge derives a SHA-256 Windows machine fingerprint in memory; it does not persist a Lingua device ID locally.
- The server HMAC-SHA-256 hashes the submitted fingerprint with `AUTH_SECRET` before database storage.
- The database stores only `fingerprint_hash` plus non-secret display metadata (device name/type/platform/app version/last seen).
- Existing Access Code lookup remains SHA-256 and owner-viewable code storage remains AES-256-GCM.

## Owner controls
- Owner Dashboard shows each user's active devices and slot usage.
- Owner may remove any device, including gift-code devices.
- Gift-code users cannot remove their own device slot.

## User controls
- Settings / Account shows active device count, allowed total, device name/type and last used.
- Purchased users may remove a device. Removing the current desktop device logs the app out.

## Compatibility
This release is additive. Existing quotas, purchase expiry, gift-code expiry/revocation, payment flow, Current/Global chat settings and Test Mode behavior remain unchanged.
