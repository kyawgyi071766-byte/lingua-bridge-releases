import { NextResponse } from 'next/server';
import { getOwnerAdmin } from '@/lib/auth';
import {
  accessCodeExpiry,
  decryptAccessCode,
  encryptAccessCode,
  generateAccessCode,
  hashAccessCode,
  isAccessDuration,
  isAccessLevel,
} from '@/lib/accessCodes';
import { prisma } from '@/lib/prisma';
import { isCrossSiteRequest } from '@/lib/security';

export const dynamic = 'force-dynamic';

async function requireOwner() {
  return getOwnerAdmin();
}

export async function GET() {
  const admin = await requireOwner();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: 250,
    include: { _count: { select: { redemptions: true, activeUsers: true } } },
  });

  return NextResponse.json({
    codes: codes.map((row) => ({
      id: row.id,
      code: (() => { try { return decryptAccessCode(row.encryptedCode); } catch { return 'UNAVAILABLE'; } })(),
      level: row.level,
      maxUses: row.maxUses,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      redemptions: row._count.redemptions,
      activeUsers: row._count.activeUsers,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const admin = await requireOwner();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const level = body.level;
  const duration = body.duration;
  const maxUses = Number(body.maxUses ?? 1);
  if (!isAccessLevel(level)) return NextResponse.json({ error: 'Level must be Pro or Business.' }, { status: 400 });
  if (!isAccessDuration(duration)) return NextResponse.json({ error: 'Duration must be 30d, 90d, or forever.' }, { status: 400 });
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000) {
    return NextResponse.json({ error: 'maxUses must be between 1 and 1000.' }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const plainCode = generateAccessCode(level);
    try {
      const created = await prisma.accessCode.create({
        data: {
          code: hashAccessCode(plainCode),
          encryptedCode: encryptAccessCode(plainCode),
          level,
          maxUses,
          expiresAt: accessCodeExpiry(duration),
          createdBy: admin.id,
        },
      });
      return NextResponse.json({
        ok: true,
        code: plainCode,
        accessCode: {
          id: created.id,
          level: created.level,
          maxUses: created.maxUses,
          usedCount: created.usedCount,
          expiresAt: created.expiresAt?.toISOString() ?? null,
          isActive: created.isActive,
          createdAt: created.createdAt.toISOString(),
        },
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error: any) {
      if (error?.code === 'P2002') continue;
      console.error('Access code create failed:', error);
      return NextResponse.json({ error: 'Could not create access code.' }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Could not generate a unique access code. Try again.' }, { status: 500 });
}

export async function PATCH(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const admin = await requireOwner();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'Code id is required.' }, { status: 400 });

  const existing = await prisma.accessCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Access code not found.' }, { status: 404 });

  const data: { isActive?: boolean; maxUses?: number } = {};
  if (body.isActive === false) data.isActive = false;
  if (body.isActive === true && !existing.isActive) {
    return NextResponse.json({ error: 'Revoked codes cannot be reactivated. Create a new code instead.' }, { status: 409 });
  }
  if (body.maxUses !== undefined) {
    const maxUses = Number(body.maxUses);
    if (!Number.isInteger(maxUses) || maxUses < existing.usedCount || maxUses < 1 || maxUses > 1000) {
      return NextResponse.json({ error: `maxUses must be between ${Math.max(1, existing.usedCount)} and 1000.` }, { status: 400 });
    }
    data.maxUses = maxUses;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: 'No supported change supplied.' }, { status: 400 });

  const updated = await prisma.$transaction(async (db) => {
    const row = await db.accessCode.update({ where: { id }, data });
    if (data.isActive === false) {
      await db.user.updateMany({
        where: { accessCodeId: id, grantType: 'gift_code' },
        data: { plan: 'free', paidUntil: null, grantType: 'free', accessCodeId: null },
      });
    }
    return row;
  });

  return NextResponse.json({
    ok: true,
    accessCode: {
      id: updated.id,
      level: updated.level,
      maxUses: updated.maxUses,
      usedCount: updated.usedCount,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      isActive: updated.isActive,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
