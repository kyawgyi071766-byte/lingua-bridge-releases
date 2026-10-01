# Lingua Bridge v1.0.28 QA Report

Automated source QA performed before packaging.

## Passed

- Node syntax check: `electron/service-preload.cjs`
- Node syntax check: `src/app.js`
- Desktop preflight
- Desktop validation
- Owner/Admin custom-app audit
- v1.0.28 targeted UX audit
- Static renderer build (`dist/`)
- Empty-composer language guide is restored and is hidden only after text is entered
- Source/target labels are sent to the messenger preload
- Sidebar account name/phone details remain persisted in local storage
- Right-click/double-click account editing is wired
- Translation cards stop click propagation into the host messenger
- Successful incoming translations are cached and can be reattached after messenger DOM re-render
- Per-message incoming source remains `auto` for mixed-language conversations
- Persistent no-refresh webviews retained
- Signal companion and Escape Back retained

## Live Windows checks still required

Automated QA cannot prove third-party Telegram/WhatsApp DOM behavior forever. Before public release, verify on Windows:

1. Empty message box shows `Auto detect → <target>`; typing hides it; clearing text restores it.
2. Right-click a Telegram account, save name/phone, then hover to confirm persistence.
3. Click/select a translated card and navigate the chat; the card should remain or be restored after DOM re-render.
4. Telegram/WhatsApp send behavior, unread badges, Signal launch and Esc Back still work.
