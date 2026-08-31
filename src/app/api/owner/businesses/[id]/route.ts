import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { error, ok } from '@/lib/http';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { await requireRole(UserRole.SYSTEM_OWNER); const { id } = await params; const body = await req.json(); if (typeof body.enabled !== 'boolean') return error('enabled must be boolean'); return ok({ business: await prisma.tenant.update({ where: { id }, data: { enabled: body.enabled } }) }); } catch (e) { return error(e instanceof Error ? e.message : 'Unable to update business', 400); } }
