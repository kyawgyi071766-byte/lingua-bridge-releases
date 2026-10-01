# Lingua Bridge v1.0.11 Candidate QA Results

Automated/static QA executed in the build workspace:

- `npm run qa` — PASS
- Renderer source syntax — PASS
- Electron main/preload syntax — PASS
- Static renderer build — PASS
- Existing multi-service flow — PASS
- Existing Current/Global conversation-scoped logic markers — PASS
- Existing customer Live-mode enforcement — PASS
- Existing owner diagnostics/device/gift-code/update/cache/proxy wiring — PASS
- Signal Desktop external-only launcher — PASS
- Signal official download fallback — PASS
- Owner/Admin Custom App Manager present — PASS
- Custom create/edit/delete actions — PASS
- Customer picker excludes owner custom templates — PASS
- HTTPS-only custom URL validation — PASS
- Embedded URL credentials blocked — PASS
- Custom template persistence — PASS
- Custom service session isolation — PASS
- Deleting a template preserves existing custom instances — PASS
- Candidate app ID/product name/output are separate from stable Lingua Bridge — PASS

Live Windows QA is still required before replacing the public stable installer. The candidate is intentionally side-by-side and does not deploy to Vercel or alter the v1.0.9 public release.
