# Lingua Bridge Desktop v1.0.36

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
