import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { planLimit, voicePlanLimit } from '@/lib/plans';
import { ensureCurrentUsage } from '@/lib/usage';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  const limit = planLimit(state.plan);
  const voiceLimit = voicePlanLimit(state.plan);
  return NextResponse.json({
    plan: state.plan,
    used: state.usageChars,
    limit,
    remaining: Math.max(0, limit - state.usageChars),
    resetAt: state.usageResetAt,
    voiceUsed: state.voiceUses,
    voiceLimit,
    voiceRemaining: Math.max(0, voiceLimit - state.voiceUses),
    voiceResetAt: state.voiceUsageResetAt,
    grantType: state.grantType,
    paidUntil: state.paidUntil,
  });
}
