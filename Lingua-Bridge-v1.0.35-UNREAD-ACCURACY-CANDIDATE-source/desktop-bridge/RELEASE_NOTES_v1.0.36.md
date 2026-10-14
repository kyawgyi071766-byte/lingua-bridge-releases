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
