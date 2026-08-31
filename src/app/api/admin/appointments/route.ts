import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { error, ok } from '@/lib/http';

export async function GET(req: NextRequest) { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const url = new URL(req.url); const status = url.searchParams.get('status'); const date = url.searchParams.get('date'); const where: any = { tenantId: s.tenantId! }; if (status && ['CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'].includes(status)) where.status = status; if (date) { const d = new Date(`${date}T00:00:00.000Z`); const next = new Date(d); next.setUTCDate(next.getUTCDate()+1); where.startAt = { gte: d, lt: next }; } const appointments = await prisma.appointment.findMany({ where, include: { service: true }, orderBy: { startAt: 'asc' } }); return ok({ appointments }); } catch { return error('Unauthorized', 401); } }
