import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { PLANS, planLimit, voicePlanLimit } from '@/lib/plans';
import BillingClient from '@/components/BillingClient';
import RedeemGiftCode from '@/components/RedeemGiftCode';
import { ensureCurrentUsage } from '@/lib/usage';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/billing');

  const usage = await ensureCurrentUsage(user.id);
  if (!usage) redirect('/login');
  const limit = planLimit(usage.plan);
  const pct = limit > 0 ? Math.min(100, Math.round((usage.usageChars / limit) * 100)) : 0;
  const voiceLimit = voicePlanLimit(usage.plan);
  const voicePct = voiceLimit > 0 ? Math.min(100, Math.round((usage.voiceUses / voiceLimit) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold">Billing &amp; Plan</h1>
      <p className="text-slate-500 text-sm mt-1">Upgrade with USDT sent directly to the owner Trust Wallet.</p>

      <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-slate-500">Current plan</div>
            <div className="text-3xl font-extrabold capitalize mt-1">{usage.plan}</div>
            <div className="text-sm text-slate-500 mt-1">
              {usage.grantType === 'gift_code' && usage.plan !== 'free' ? 'Gift access · no payment required' : `$${(PLANS[usage.plan as keyof typeof PLANS]?.price ?? 0)}/month`} · {(limit / 1000).toLocaleString()}k chars/month
            </div>
            {usage.grantType === 'gift_code' && usage.plan !== 'free' ? (
              <div className="text-xs text-green-700 mt-1">Gift-code access · {usage.paidUntil ? `active until ${usage.paidUntil.toISOString().slice(0, 10)}` : 'permanent while the owner code remains active'}</div>
            ) : usage.paidUntil ? (
              <div className="text-xs text-green-700 mt-1">Purchased access active until {usage.paidUntil.toISOString().slice(0, 10)}</div>
            ) : null}
          </div>
          <div className="w-full sm:w-64">
            <div className="text-xs text-slate-500 mb-1">
              This month: {(usage.usageChars / 1000).toFixed(1)}k / {(limit / 1000).toLocaleString()}k chars used
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-slate-500 mt-4 mb-1">
              Voice: {usage.voiceUses.toLocaleString()} / {voiceLimit.toLocaleString()} translations used
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600" style={{ width: `${voicePct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4">Upgrade your plan</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {(['pro', 'business'] as const).map((id) => {
          const plan = PLANS[id];
          const current = usage.plan === id;
          return (
            <div key={id} className={`bg-white border rounded-2xl p-6 ${current ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-slate-200'}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <span className="text-2xl font-extrabold">${plan.price}<span className="text-sm font-normal text-slate-500">/30 days</span></span>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              </ul>
              <BillingClient plan={id} currentPlan={usage.plan} />
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold">Purchase, Account & Payment Support</h2>
        <p className="text-sm text-slate-600 mt-2">Contact the owner with your Lingua account Gmail address, preferred Pro or Business plan, and any questions.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="https://t.me/linguabridgebridish" target="_blank" rel="noreferrer" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold">Contact on Telegram</a>
          <a href="mailto:sshksshk2002@gmail.com" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-lg font-semibold">Email via Gmail</a>
        </div>
      </div>

      <RedeemGiftCode />

      <div className="mt-8 text-xs text-slate-500 space-y-1">
        <p>Crypto is the only payment method shown in Lingua. Each upgrade gets a unique USDT amount so Lingua can identify the incoming transfer without a memo. The exact checkout amount can include temporary identification cents (up to $0.99 above the listed base price).</p>
        <p>Payment verification never suspends your account. After a confirmed transfer, the selected plan activates immediately for 30 days. If paid access expires, the account returns to Free.</p>
      </div>
    </div>
  );
}
export const metadata = { title: 'Billing', robots: { index: false, follow: false } };
