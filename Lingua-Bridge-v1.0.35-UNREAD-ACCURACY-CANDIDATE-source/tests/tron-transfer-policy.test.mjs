import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfirmedTronTransfer, amountMatches } from '../src/lib/tronTransferPolicy.ts';

const wallet = 'TC4gLVT6RnjdnMB6qCgq2mAb5KNnM9ovzM';
const contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const sinceMs = 1_700_000_000_000;
const exact = {
  to_address: wallet,
  contract_address: contract,
  confirmed: true,
  finalResult: 'SUCCESS',
  contractRet: 'SUCCESS',
  event_type: 'Transfer',
  transaction_id: 'abc123',
  quant: '9030000',
  tokenInfo: { tokenDecimal: 6 },
  block_ts: sinceMs + 1_000,
};

test('accepts only an exact confirmed successful incoming USDT transfer', () => {
  assert.deepEqual(normalizeConfirmedTronTransfer(exact, wallet, contract, sinceMs), {
    txHash: 'abc123', rawAmount: '9030000', decimals: 6, timestampMs: sinceMs + 1_000,
  });
});

for (const [name, patch] of [
  ['wrong destination', { to_address: 'TXx6tM3u6xE7Dx9qH9k8JtR5vN2cB1aZpQ' }],
  ['wrong token contract', { contract_address: 'TWrongContract1111111111111111111111' }],
  ['unconfirmed transfer', { confirmed: false }],
  ['failed transfer', { finalResult: 'FAILED' }],
  ['non-transfer event', { event_type: 'Approval' }],
  ['stale transfer', { block_ts: sinceMs - 1 }],
]) {
  test(`rejects ${name}`, () => {
    assert.equal(normalizeConfirmedTronTransfer({ ...exact, ...patch }, wallet, contract, sinceMs), null);
  });
}

test('matches the exact two-decimal claim and rejects a material mismatch', () => {
  assert.equal(amountMatches('9030000', 6, 903), true);
  assert.equal(amountMatches('9020000', 6, 903), true);
  assert.equal(amountMatches('9019999', 6, 903), false);
  assert.equal(amountMatches('not-a-number', 6, 903), false);
});

