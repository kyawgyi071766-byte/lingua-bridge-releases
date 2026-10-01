# Lingua Bridge v1.0.22 release status

Status: **GLOBAL PUBLIC RELEASE CANDIDATE**

Automated/static QA passed for the composer UX fix, multilingual translation carry-forward, rate-limit stability, persistent no-refresh switching, stable upgrade identity, verified update downloads, public distribution, SEO/indexability, download routing, and static security audits.

The only remaining release gate is a real Windows build/install test:
1. build the Windows EXE/ZIP on Windows;
2. install over the existing Lingua Bridge stable installation;
3. verify sessions/settings/translation and the typing-overlay fix;
4. perform one clean Windows-user or clean-machine installation;
5. upload the tested EXE and publish its exact SHA-256 in the Vercel stable update feed.

Do not describe the release as guaranteed error-free until that live Windows gate passes.
