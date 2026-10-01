export interface ChainTransfer {
  txHash: string;
  rawAmount: string;
  decimals: number;
  timestampMs: number;
}

export function amountMatches(rawAmount: string, decimals: number, expectedCents: number): boolean {
  if (!/^\d+$/.test(rawAmount) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) return false;
  try {
    const scale = 10n ** BigInt(decimals);
    const left = BigInt(rawAmount) * 100n;
    const right = BigInt(expectedCents) * scale;
    const diff = left >= right ? left - right : right - left;
    return diff <= scale;
  } catch {
    return false;
  }
}

export function normalizeConfirmedTronTransfer(
  row: any,
  walletAddress: string,
  usdtContract: string,
  sinceMs: number,
): ChainTransfer | null {
  const to = typeof row?.to_address === 'string' ? row.to_address : '';
  const contract = typeof row?.contract_address === 'string' ? row.contract_address : '';
  const txHash = typeof row?.transaction_id === 'string' ? row.transaction_id : '';
  const rawAmount = typeof row?.quant === 'string' ? row.quant : '';
  const decimals = Number(row?.tokenInfo?.tokenDecimal ?? 6);
  const timestampMs = Number(row?.block_ts ?? 0);
  if (!txHash || !rawAmount || to !== walletAddress || contract !== usdtContract) return null;
  if (row?.confirmed !== true || row?.finalResult !== 'SUCCESS' || row?.contractRet !== 'SUCCESS' || row?.event_type !== 'Transfer') return null;
  if (!Number.isFinite(timestampMs) || timestampMs < sinceMs) return null;
  return { txHash, rawAmount, decimals, timestampMs };
}
