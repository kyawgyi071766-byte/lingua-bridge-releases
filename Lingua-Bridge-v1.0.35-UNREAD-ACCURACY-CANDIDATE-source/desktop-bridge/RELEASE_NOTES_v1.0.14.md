# Lingua Bridge v1.0.14 Candidate

## Signal in-app behavior
- The Signal tile is now added to Lingua's left account list like other services.
- Selecting Signal loads the official `https://signal.org/` site inside Lingua's workspace instead of opening Chrome.
- A dedicated **Open Signal Desktop** toolbar button is shown while Signal is active.
- If Signal Desktop is not installed, Lingua stays on the in-app official Signal site; no browser fallback is used.
- Important: Signal does not provide an official browser chat client, so actual Signal messaging still requires Signal Desktop paired with a phone.

## Faster service adding
- Service instance numbering is computed once per add operation instead of rescanning the full list for every copy.
- New HTTPS service partitions request a lightweight Electron session preconnect warmup.
- The modal closes and the new instance is persisted/rendered immediately; warmup completes in the background.
- Persistent isolated login partitions are preserved.

## Preserved
- Stable v1.0.9 is not modified.
- Drag-and-drop account ordering from v1.0.13.
- Updated Lingua logo.
- Owner/Admin Custom App Manager.
- Incoming Myanmar/Burmese display option (requires configured Google Cloud Translation server path).
- Current/Global conversation-scoped translation controls.
