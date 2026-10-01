# Lingua Bridge v1.0.13 — Drag Order + New Logo + Burmese Incoming Candidate

## Added without replacing stable v1.0.9

- Drag-and-drop ordering for messaging accounts in the left sidebar.
  - Press and hold an account with the mouse and drag it higher or lower.
  - The new order is saved in `lingua.instances` and restored on the next launch.
  - Reordering changes only the sidebar DOM/order; it does not rebuild the active messenger webview.
- Replaced the desktop Lingua badge/window/installer icon with the owner-supplied Lingua logo.
- Preserved v1.0.12 safe Signal behavior and the Owner/Admin Custom App Manager.
- Added **Myanmar / Burmese (မြန်မာ)** as an **incoming-message display target only**.
  - Burmese is intentionally not added to source/outgoing send selectors in this candidate.
  - It requires Google Cloud Translation on the Lingua server.
  - If Google is not configured, the selection is rejected without changing the current language profile.

## Server-side Burmese preparation

The bundled server source adds language code `my` to the translation language registry. Existing provider routing already sends languages outside the DeepL map to Google Cloud Translation in automatic mode. This server patch is **not deployed automatically** by the Windows candidate builder.

## Safety

- Separate Windows app ID/name/output folder.
- Stable `Lingua Bridge v1.0.9` is not overwritten.
- Existing Telegram/WhatsApp session isolation, direct-send protection, Current/Global conversation profiles, device limits, gift codes, owner diagnostics, Signal launcher, and custom app templates are preserved in the candidate source.
- Production Vercel/server configuration is not changed by this package.
