import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DOWNLOAD_ACCESS_TOKEN = '0123456789abcdef0123456789abcdef';
const { downloadCookieValue, verifyDownloadCookie } = await import('../src/lib/downloadAccess.ts');

test('download cookie expires after 24 hours', () => {
  const issuedAt = Date.UTC(2026, 8, 22, 0, 0, 0);
  const cookie = downloadCookieValue(issuedAt);
  assert.equal(verifyDownloadCookie(cookie, issuedAt + 23 * 60 * 60 * 1000), true);
  assert.equal(verifyDownloadCookie(cookie, issuedAt + 25 * 60 * 60 * 1000), false);
});

test('download cookie is rejected after token rotation', () => {
  const issuedAt = Date.UTC(2026, 8, 22, 0, 0, 0);
  const cookie = downloadCookieValue(issuedAt);
  process.env.DOWNLOAD_ACCESS_TOKEN = 'fedcba9876543210fedcba9876543210';
  assert.equal(verifyDownloadCookie(cookie, issuedAt + 1_000), false);
});
