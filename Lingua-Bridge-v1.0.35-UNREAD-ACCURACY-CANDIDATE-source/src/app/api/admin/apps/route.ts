import { NextResponse } from 'next/server';
import { getOwnerAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isUnsafeCrossOriginRequest } from '@/lib/security';

async function requireAdmin() {
  return getOwnerAdmin();
}


export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const apps = await prisma.supportedApp.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ apps });
}

export async function POST(req: Request) {
  if (isUnsafeCrossOriginRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const quantity = Number(body.quantity);
  const color = typeof body.color === 'string' ? body.color.trim() : '#2563eb';
  if (!name || name.length > 80) return NextResponse.json({ error: 'App name must be 1 to 80 characters.' }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) return NextResponse.json({ error: 'Quantity must be an integer from 1 to 10000.' }, { status: 400 });
  if (!/^#[0-9a-f]{6}$/i.test(color)) return NextResponse.json({ error: 'Color must be a valid hex color.' }, { status: 400 });
  const app = await prisma.supportedApp.create({ data: { name, quantity, color } });
  return NextResponse.json({ ok: true, app });
}

export async function DELETE(req: Request) {
  if (isUnsafeCrossOriginRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const deleted = await prisma.supportedApp.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ error: 'App not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
