# Lingua Bridge v1.0.20 — Rate-limit stability candidate

## Fixed
- Prevents repeated host renders from re-sending identical messenger settings and re-triggering history translation scans.
- Caps incoming translation concurrency at one request and paces broad-language (Gemini/Microsoft/Google) traffic.
- Deduplicates queued incoming translation text and retries transient provider failures later instead of immediately surfacing a red error.
- Reduces automatic visible-message scans from large forced bursts to a small recent-message window.
- Adds bounded exponential backoff and Retry-After support for provider 429/5xx responses.
- Lets Gemini try the next configured model after a bounded 429 failure instead of failing the whole request immediately.
- Reduces device last-seen database write contention during translation bursts.
- Ships a root .vercelignore so desktop binaries/build outputs are not uploaded to Vercel.

## Preserved
- v1.0.19 pointer reorder and saved order.
- Persistent no-refresh messenger webviews.
- Burmese/Myanmar and other broad-language selectors.
- DeepL -> Gemini -> Microsoft -> Google provider chain.
- Signal, Chrome/Web, Admin Custom Apps, Current/Global profiles, direct send, and original-text safety.

## Operational note
Gemini Free Tier still has project/model quotas. v1.0.20 prevents Lingua from creating artificial request bursts, but no client can guarantee unlimited free-tier translations after Google quota is genuinely exhausted.
