import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { serviceSchema } from '@/lib/validation';
import { error, ok } from '@/lib/http';

export async function GET() { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); return ok({ services: await prisma.service.findMany({ where: { tenantId: s.tenantId! }, orderBy: { createdAt: 'desc' } }) }); } catch { return error('Unauthorized', 401); } }
export async function POST(req: NextRequest) { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const data = serviceSchema.parse(await req.json()); const service = await prisma.service.create({ data: { ...data, tenantId: s.tenantId! } }); return ok({ service }, 201); } catch (e) { return error(e instanceof Error ? e.message : 'Unable to create service', 400); } }
