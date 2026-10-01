import Stripe from 'stripe';

const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
export const legacyStripeEnabled = (process.env.LEGACY_STRIPE_ENABLED || '').trim().toLowerCase() === 'true';
export const stripeConfigured = secretKey.startsWith('sk_') && !secretKey.includes('placeholder') && !secretKey.startsWith('replace-');

export const stripe = new Stripe(stripeConfigured ? secretKey : 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

export const PRICE_IDS: Record<'pro' | 'business', string> = {
  pro: (process.env.STRIPE_PRICE_PRO || '').trim(),
  business: (process.env.STRIPE_PRICE_BUSINESS || '').trim(),
};

export function paidPlan(value: unknown): 'pro' | 'business' | null {
  return value === 'pro' || value === 'business' ? value : null;
}

export function planFromPriceId(priceId: unknown): 'pro' | 'business' | null {
  if (typeof priceId !== 'string') return null;
  if (PRICE_IDS.pro && priceId === PRICE_IDS.pro) return 'pro';
  if (PRICE_IDS.business && priceId === PRICE_IDS.business) return 'business';
  return null;
}
