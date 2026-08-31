import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { error, ok } from '@/lib/http';
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const { id } = await params; const result = await prisma.availabilityRule.deleteMany({ where: { id, tenantId: s.tenantId! } }); if (!result.count) return error('Availability rule not found', 404); return ok({ success: true }); } catch { return error('Unauthorized', 401); } }
