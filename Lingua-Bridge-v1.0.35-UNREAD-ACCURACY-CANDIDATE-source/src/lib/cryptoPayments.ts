import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { PLANS } from './plans';
import { amountMatches, normalizeConfirmedTronTransfer, type ChainTransfer } from './tronTransferPolicy';

export type CryptoChain = 'tron' | 'bsc';
export type PaidPlan = 'pro' | 'business';

const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const BSC_USDT_CONTRACT = process.env.BSC_USDT_CONTRACT?.trim() || '0x55d398326f99059fF775485246999027B3197955';
const PAYMENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const CLAIM_TIME_GRACE_MS = 60 * 1000;
const MATCH_KEY_HOLD_MS = 10 * 60 * 1000;

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'business';
}

export function cryptoConfig() {
  const chainRaw = (process.env.CRYPTO_CHAIN || 'tron').trim().toLowerCase();
  const chain: CryptoChain = chainRaw === 'bsc' ? 'bsc' : 'tron';
  const walletAddress = (process.env.CRYPTO_WALLET_ADDRESS || '').trim();
  if (!walletAddress) throw new Error('CRYPTO_WALLET_ADDRESS is not configured.');
  if (chain === 'tron' && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(walletAddress)) {
    throw new Error('CRYPTO_WALLET_ADDRESS is not a valid TRON address for CRYPTO_CHAIN=tron.');
  }
  if (chain === 'bsc' && !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    throw new Error('CRYPTO_WALLET_ADDRESS is not a valid BSC address for CRYPTO_CHAIN=bsc.');
  }
  return {
    chain,
    walletAddress,
    network: chain === 'tron' ? 'USDT-TRC20 (TRON)' : 'USDT-BEP20 (BNB Smart Chain)',
  };
}

function basePriceCents(plan: PaidPlan): number {
  return Math.round(PLANS[plan].price * 100);
}

function startSlot(userId: string, plan: PaidPlan): number {
  const digest = createHash('sha256').update(`${userId}:${plan}`).digest();
  return digest.readUInt16BE(0) % 33;
}

function amountStringFromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export async function createOrReusePayment(userId: string, plan: PaidPlan) {
  const { chain, walletAddress, network } = cryptoConfig();
  const now = Date.now();
  const cutoff = new Date(now - PAYMENT_WINDOW_MS);
  const releasedBefore = new Date(now - MATCH_KEY_HOLD_MS);

  await prisma.payment.updateMany({
    where: { status: 'confirmed', matchKey: { not: null }, confirmedAt: { not: null, lt: releasedBefore } },
    data: { matchKey: null },
  });

  const existing = await prisma.payment.findFirst({
    where: { userId, plan, chain, status: 'pending', claimedAt: { gte: cutoff } },
    orderBy: { claimedAt: 'desc' },
  });
  if (existing) {
    return {
      payment: existing,
      walletAddress,
      network,
      reused: true,
    };
  }

  await prisma.payment.updateMany({
    where: { userId, plan, chain, status: 'pending', claimedAt: { lt: cutoff } },
    data: { status: 'failed', matchKey: null },
  });

  const baseCents = basePriceCents(plan);
  const slot = startSlot(userId, plan);

  for (let attempt = 0; attempt < 33; attempt += 1) {
    const code = ((slot + attempt) % 33) + 1;
    const amountCents = baseCents + code * 3;
    const amount = amountStringFromCents(amountCents);
    const matchKey = `${chain}:${amountCents}`;
    try {
      const payment = await prisma.payment.create({
        data: {
          userId,
          plan,
          amount,
          chain,
          status: 'pending',
          claimedAt: new Date(),
          matchKey,
        },
      });
      return { payment, walletAddress, network, reused: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
      throw error;
    }
  }

  throw new Error('All temporary payment amount codes are currently in use. Please try again later.');
}

async function fetchTronTransfers(walletAddress: string, sinceMs: number): Promise<ChainTransfer[]> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const apiKey = process.env.TRONSCAN_API_KEY?.trim();
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

  const transfers: ChainTransfer[] = [];
  const pageSize = 50;
  for (let page = 0; page < 20; page += 1) {
    const start = page * pageSize;
    const params = new URLSearchParams({
      start: String(start),
      limit: String(pageSize),
      contract_address: TRON_USDT_CONTRACT,
      relatedAddress: walletAddress,
      direction: 'in',
      confirm: '0',
      start_timestamp: String(sinceMs),
      end_timestamp: String(Date.now()),
    });
    const response = await fetch(`https://apilist.tronscanapi.com/api/token_trc20/transfers?${params.toString()}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`TronScan verification failed with HTTP ${response.status}.`);
    const body = await response.json().catch(() => ({}));
    if (!Array.isArray(body?.token_transfers)) {
      const detail = typeof body?.message === 'string' ? body.message : 'Unexpected TronScan response.';
      throw new Error(`TronScan verification failed: ${detail}`);
    }
    const rows = body.token_transfers;
    for (const row of rows) {
      const transfer = normalizeConfirmedTronTransfer(row, walletAddress, TRON_USDT_CONTRACT, sinceMs);
      if (transfer) transfers.push(transfer);
    }
    const rangeTotal = Number(body?.rangeTotal ?? body?.total ?? rows.length);
    if (rows.length < pageSize || (Number.isFinite(rangeTotal) && start + pageSize >= rangeTotal)) break;
  }
  return transfers;
}

async function fetchBscPage(walletAddress: string, page: number, apiKey: string, useV2: boolean) {
  const params = new URLSearchParams({
    module: 'account',
    action: 'tokentx',
    contractaddress: BSC_USDT_CONTRACT,
    address: walletAddress,
    page: String(page),
    offset: '100',
    startblock: '0',
    endblock: '999999999',
    sort: 'desc',
    apikey: apiKey,
  });
  if (useV2) params.set('chainid', '56');
  const endpoint = useV2 ? 'https://api.etherscan.io/v2/api' : 'https://api.bscscan.com/api';
  const response = await fetch(`${endpoint}?${params.toString()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`BscScan verification failed with HTTP ${response.status}.`);
  const body = await response.json().catch(() => ({}));
  if (Array.isArray(body?.result)) return body.result;
  const detail = typeof body?.result === 'string' ? body.result : typeof body?.message === 'string' ? body.message : 'Unexpected BscScan response.';
  if (/no transactions found/i.test(detail)) return [];
  throw new Error(`BscScan verification failed: ${detail}`);
}

async function fetchBscTransfers(walletAddress: string, sinceMs: number): Promise<ChainTransfer[]> {
  const apiKey = process.env.BSCSCAN_API_KEY?.trim();
  if (!apiKey) throw new Error('BSCSCAN_API_KEY is required when CRYPTO_CHAIN=bsc.');

  const transfers: ChainTransfer[] = [];
  let useV2 = false;
  for (let page = 1; page <= 10; page += 1) {
    let rows: any[];
    try {
      rows = await fetchBscPage(walletAddress, page, apiKey, useV2);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!useV2 && /deprecated|v2/i.test(message)) {
        useV2 = true;
        rows = await fetchBscPage(walletAddress, page, apiKey, true);
      } else {
        throw error;
      }
    }

    let oldest = Number.POSITIVE_INFINITY;
    for (const row of rows) {
      const to = typeof row?.to === 'string' ? row.to : '';
      const contract = typeof row?.contractAddress === 'string' ? row.contractAddress : '';
      const txHash = typeof row?.hash === 'string' ? row.hash : '';
      const rawAmount = typeof row?.value === 'string' ? row.value : '';
      const decimals = Number(row?.tokenDecimal ?? 18);
      const timestampMs = Number(row?.timeStamp ?? 0) * 1000;
      if (Number.isFinite(timestampMs)) oldest = Math.min(oldest, timestampMs);
      if (!txHash || !rawAmount || to.toLowerCase() !== walletAddress.toLowerCase() || contract.toLowerCase() !== BSC_USDT_CONTRACT.toLowerCase()) continue;
      if (!Number.isFinite(timestampMs) || timestampMs < sinceMs) continue;
      transfers.push({ txHash, rawAmount, decimals, timestampMs });
    }
    if (rows.length < 100 || oldest < sinceMs) break;
  }
  return transfers;
}

export async function findMatchingTransfer(payment: { amount: Prisma.Decimal; chain: string; claimedAt: Date }) {
  const { chain, walletAddress } = cryptoConfig();
  if (payment.chain !== chain) throw new Error('This payment claim belongs to a different configured network.');
  const sevenDaysAgo = Date.now() - PAYMENT_WINDOW_MS;
  if (payment.claimedAt.getTime() < sevenDaysAgo) return null;
  const claimStart = payment.claimedAt.getTime() - CLAIM_TIME_GRACE_MS;
  const sinceMs = Math.max(sevenDaysAgo, claimStart);
  const transfers = chain === 'tron'
    ? await fetchTronTransfers(walletAddress, sinceMs)
    : await fetchBscTransfers(walletAddress, sinceMs);
  const expectedCents = Math.round(Number(payment.amount) * 100);

  return transfers.find((transfer) =>
    transfer.timestampMs >= sinceMs && amountMatches(transfer.rawAmount, transfer.decimals, expectedCents)
  ) ?? null;
}

export async function activatePayment(paymentId: string, txHash?: string | null) {
  const now = new Date();
  const paidUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (db) => {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment claim not found.');
    if (!isPaidPlan(payment.plan)) throw new Error('Payment claim has an invalid plan.');
    if (payment.status === 'confirmed') {
      const user = await db.user.findUnique({ where: { id: payment.userId } });
      return { payment, user, alreadyConfirmed: true };
    }

    if (txHash) {
      const used = await db.payment.findFirst({ where: { txHash, id: { not: payment.id } }, select: { id: true } });
      if (used) throw new Error('That blockchain transaction is already linked to another payment.');
    }

    const confirmed = await db.payment.update({
      where: { id: payment.id },
      data: { status: 'confirmed', txHash: txHash || payment.txHash, confirmedAt: now },
    });
    const user = await db.user.update({
      where: { id: payment.userId },
      data: { plan: payment.plan, paidUntil, grantType: 'purchase', accessCodeId: null },
    });
    return { payment: confirmed, user, alreadyConfirmed: false };
  });
}

export function paymentWindowMs() {
  return PAYMENT_WINDOW_MS;
}
