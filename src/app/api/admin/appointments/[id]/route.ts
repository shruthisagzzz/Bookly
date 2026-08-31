import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { error, ok } from '@/lib/http';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const s = await requireRole(UserRole.BUSINESS_ADMIN); const { id } = await params; const { status } = await req.json(); if (!['CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'].includes(status)) return error('Invalid appointment status'); const result = await prisma.appointment.updateMany({ where: { id, tenantId: s.tenantId! }, data: { status } }); if (!result.count) return error('Appointment not found', 404); return ok({ success: true }); } catch { return error('Unable to update appointment', 400); } }
