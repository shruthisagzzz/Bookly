import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { businessSchema } from '@/lib/validation';
import { error, ok } from '@/lib/http';

export async function GET() { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const business = await prisma.tenant.findUnique({ where: { id: s.tenantId! } }); return ok({ business }); } catch (e) { return error('Unauthorized', 401); } }
export async function PATCH(req: NextRequest) {
  try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const body = businessSchema.partial().parse(await req.json()); const business = await prisma.tenant.update({ where: { id: s.tenantId! }, data: body }); return ok({ business }); }
  catch (e) { return error(e instanceof Error ? e.message : 'Unable to update profile', 400); }
}
