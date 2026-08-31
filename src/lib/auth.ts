import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me-please-32chars');
const COOKIE = 'booking_session';
const CUSTOMER_COOKIE = 'customer_session';

export type Session = { userId: string; role: UserRole; tenantId: string | null; name: string; email: string };
export type CustomerSession = { customerId: string; role: 'CUSTOMER'; name: string; email: string };

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createSession(session: Session) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || !payload.role) return null;
    return { userId: String(payload.userId), role: payload.role as UserRole, tenantId: payload.tenantId ? String(payload.tenantId) : null, name: String(payload.name ?? ''), email: String(payload.email ?? '') };
  } catch { return null; }
}


export async function createCustomerSession(session: CustomerSession) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function clearCustomerSession() { (await cookies()).delete(CUSTOMER_COOKIE); }

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.customerId || payload.role !== 'CUSTOMER' || !payload.email) return null;
    return { customerId: String(payload.customerId), role: 'CUSTOMER', name: String(payload.name ?? ''), email: String(payload.email).toLowerCase() };
  } catch { return null; }
}

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session || session.role !== role) throw new Error('UNAUTHORIZED');
  if (role === UserRole.BUSINESS_ADMIN && session.tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { enabled: true } });
    if (!tenant?.enabled) throw new Error('TENANT_DISABLED');
  }
  return session;
}
