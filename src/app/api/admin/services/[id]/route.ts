import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { serviceSchema } from '@/lib/validation';
import { error, ok } from '@/lib/http';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const { id } = await params; const data = serviceSchema.partial().parse(await req.json()); const result = await prisma.service.updateMany({ where: { id, tenantId: s.tenantId! }, data }); if (!result.count) return error('Service not found', 404); return ok({ success: true }); } catch (e) { return error(e instanceof Error ? e.message : 'Unable to update service', 400); } }
