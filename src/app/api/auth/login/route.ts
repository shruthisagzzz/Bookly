import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { createSession, verifyPassword } from '@/lib/auth';
import { error, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const input = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { tenant: true } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return error('Invalid email or password', 401);
    if (user.role === 'BUSINESS_ADMIN' && !user.tenant?.enabled) return error('This business account is disabled', 403);
    await createSession({ userId: user.id, role: user.role, tenantId: user.tenantId, name: user.name, email: user.email });
    return ok({ role: user.role, tenantId: user.tenantId });
  } catch (e) { return error(e instanceof Error ? e.message : 'Invalid request', 400); }
}
