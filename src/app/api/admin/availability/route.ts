import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { availabilitySchema } from '@/lib/validation';
import { error, ok } from '@/lib/http';

export async function GET() { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); return ok({ availability: await prisma.availabilityRule.findMany({ where: { tenantId: s.tenantId! }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }) }); } catch { return error('Unauthorized', 401); } }
export async function POST(req: NextRequest) { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const data = availabilitySchema.parse(await req.json()); if (data.startTime >= data.endTime) return error('End time must be after start time'); const rule = await prisma.availabilityRule.create({ data: { ...data, tenantId: s.tenantId! } }); return ok({ rule }, 201); } catch (e) { return error(e instanceof Error ? e.message : 'Unable to create availability', 400); } }
