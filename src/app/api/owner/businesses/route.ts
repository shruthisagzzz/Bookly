import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, hashPassword } from '@/lib/auth';
import { businessSchema } from '@/lib/validation';
import { error, ok } from '@/lib/http';

export async function GET() {
  try { await requireRole(UserRole.SYSTEM_OWNER); const businesses = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' }, include: { users: { where: { role: 'BUSINESS_ADMIN' }, select: { name: true, email: true } }, _count: { select: { appointments: true } } } }); return ok({ businesses }); }
  catch (e) { return error(e instanceof Error && e.message === 'UNAUTHORIZED' ? 'Unauthorized' : 'Unable to load businesses', e instanceof Error && e.message === 'UNAUTHORIZED' ? 401 : 500); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(UserRole.SYSTEM_OWNER);
    const body = await req.json();
    const business = businessSchema.parse(body.business);
    const admin = body.admin as { name?: string; email?: string; password?: string } | undefined;
    if (!admin?.name || !admin.email || !admin.password || admin.password.length < 8) return error('Admin name, email and an 8+ character password are required');
    const exists = await prisma.tenant.findFirst({ where: { OR: [{ slug: business.slug }, { users: { some: { email: admin.email.toLowerCase() } } }] } });
    if (exists) return error('Business slug or admin email already exists', 409);
    const created = await prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({ data: { ...business, email: business.email || null, contactName: business.contactName || null, phone: business.phone || null } });
      const passwordHash = await hashPassword(admin.password!);
      await tx.user.create({ data: { tenantId: tenant.id, name: admin.name!, email: admin.email!.toLowerCase(), passwordHash, role: UserRole.BUSINESS_ADMIN } });
      return tenant;
    });
    return ok({ business: created }, 201);
  } catch (e) { return error(e instanceof Error ? e.message : 'Unable to create business', 400); }
}
