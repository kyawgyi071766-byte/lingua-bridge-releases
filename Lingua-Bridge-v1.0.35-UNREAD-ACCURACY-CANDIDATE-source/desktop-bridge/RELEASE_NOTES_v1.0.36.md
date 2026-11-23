# Lingua Bridge Desktop v1.0.36

# Lingua Bridge Desktop v1.0.36 — language refresh hotfix

## Burmese DeepL routing and live composer language hint

- Move Burmese / Myanmar (`my`) into the regular DeepL language list using API code `MY`; it no longer requires a Gemini/Microsoft/Google fallback to be selectable.
- On every language-setting edit, send the active conversation's effective profile to its messenger webview immediately, bypassing a stale settings signature.
- Refresh the native composer pill immediately and again after the next layout frame; retry briefly when a messenger SPA replaces the composer during a language switch.
- Add deterministic regression tests for both directions of the source/target label update and for Burmese's availability in the standard language picker.
- No messenger page reload is performed when a language setting changes.

The installer version remains 1.0.36 for this hotfix. Existing installations that already report 1.0.36 may need to install the refreshed test build manually because version-only update checks cannot distinguish two builds with the same version number.

Live provider translation quality still depends on an active authorized account/provider key. These CI tests verify routing and immediate UI-state synchronization; they do not send a live DeepL request or certify translation quality.

---

## Multi-app outgoing translation fix

- Prefer the actual focused message editor when sending with Enter, even when a messaging site's DOM class names change.
- Reuse the focused composer for Send-button and form-submit events.
- Add submit-event coverage alongside Enter and pointer/click interception.
- Preserve the original composer reference while translation is in progress.
- Avoid sending a translated message into a different chat if the conversation changes while translation is running.
- Extend regression tests for TikTok-style contenteditable editors, nested editor targets, and search-field rejection.
- Keep service-specific selectors and the generic web-chat fallback for supported messaging services.

## Validation

- The repository quality gate runs the multi-app adapter regression.
- The desktop Windows build runs the complete desktop QA suite before building the v1.0.36 installer.
- Live compatibility still needs a manual send test on TikTok and the other messaging services after installing the new build; websites can change their DOM independently.

## October 18, 2026 safety and history hotfix

- Enabling **Auto translate visible history** now re-scans already-visible incoming chat messages rather than ignoring previously fingerprinted bubbles. Older messages loaded by scrolling are scanned as they appear. Existing translated cards use the local translation cache.
- **Confirm translated text before send** is **translation-only**: Send/Enter translates the draft but does not deliver it. A second Enter/Send does not deliver the translated draft while confirmation mode remains enabled.
- Confirmation-only behavior is enforced even when other outgoing-translation toggles are disabled and when settings change while a translation request is in flight. Other programmatic send paths also honor confirmation mode.
- Automated tests cover history opt-in, deduplication, newly loaded older messages, and the no-send confirmation behavior; desktop QA must pass before installer publication.
- Historical translation is opt-in per current conversation/Global profile; existing users must enable the checkbox for chats they want scanned. Provider usage can increase when this option is enabled.
- The same version number (1.0.36) is retained; existing installations may require manually downloading and reinstalling the refreshed setup EXE because version-only update checks cannot distinguish a same-version hotfix.
- A real signed-in Telegram session and delivery-blocking end-to-end test still require manual validation on Windows; automated CI cannot certify every messenger UI revision.

## Live server and confirmation safety verification (October 18)

- Production /api/health returned HTTP 200 with database status ok from GitHub-hosted runner.
- Production /api/translate/status and POST /api/translate returned HTTP 401 for unsigned-in clients; cross-site browser metadata was blocked with 403.
- Public downloads and stable update metadata returned HTTP 200.
- Closing a fallback-composer safety gap: enabling Confirm Before Send now strictly translates and inserts the text without a send dialog or message delivery.
- Dynamic regression tests cover both confirmation-only mode and ordinary sending when confirmation is disabled.
- Automated tests do not exercise provider inference without a logged-in test user, nor actual Telegram chat DOM on a signed-in Windows desktop; those require manual real-account verification.
