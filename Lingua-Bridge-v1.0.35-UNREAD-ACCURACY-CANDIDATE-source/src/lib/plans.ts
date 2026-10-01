export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    monthlyChars: Number(process.env.FREE_QUOTA_CHARS ?? 500),
    monthlyVoiceUses: 10,
    features: ['29 currently validated DeepL languages', 'Text translation', '10 voice translations per month', 'Clipboard and share workflows'],
  },
  pro: {
    name: 'Pro',
    price: 9,
    monthlyChars: 500_000,
    monthlyVoiceUses: 300,
    features: ['Everything in Free', '500k characters per month', '300 voice translations per month', 'Chat translator', 'Provider fallback when configured'],
  },
  business: {
    name: 'Business',
    price: 29,
    monthlyChars: 5_000_000,
    monthlyVoiceUses: 2_000,
    features: ['Everything in Pro', '5M characters per month', '2,000 voice translations per month', 'Higher monthly usage allowance', 'Same secure server-side API key handling'],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function planLimit(plan: string): number {
  const value = (PLANS[plan as PlanId] ?? PLANS.free).monthlyChars;
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function voicePlanLimit(plan: string): number {
  const value = (PLANS[plan as PlanId] ?? PLANS.free).monthlyVoiceUses;
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
