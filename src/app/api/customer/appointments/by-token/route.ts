import { prisma } from '@/lib/prisma';
import { error, ok } from '@/lib/http';
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) { const { token } = await params; const appointment = await prisma.appointment.findUnique({ where: { bookingToken: token }, include: { service: true, tenant: true } }); if (!appointment) return error('Booking not found', 404); return ok({ appointment }); }
