# Lingua Desktop Update Feed (v10.2)

Endpoint: `GET /api/desktop/update`

The desktop client sends `platform`, `arch`, `current`, and `channel=stable|beta`.
The endpoint returns `configured:false` until the owner configures a signed HTTPS installer.

Required for the stable Windows feed:

- `DESKTOP_STABLE_VERSION`
- `DESKTOP_STABLE_WINDOWS_URL` (HTTPS only)
- `DESKTOP_STABLE_WINDOWS_SHA256` (64 lowercase/uppercase hex accepted; normalized by the route)
- `DESKTOP_STABLE_RELEASE_NOTES` (optional)
- `DESKTOP_STABLE_MANDATORY=true|false`

Use the Beta equivalents for owner testing. Do not point the feed at an unsigned installer and do not put secrets in these variables; they are release metadata.
