import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/auth';
import { error, ok } from '@/lib/http';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customer = await requireCustomer();
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.customerEmail !== customer.email) return error('Booking not found', 404);
    if (appointment.status === 'CANCELLED') return ok({ success: true });
    if (appointment.status !== 'CONFIRMED') return error('This booking cannot be cancelled', 409);
    const updated = await prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    return ok({ success: true, appointment: updated });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return error('Unauthorized', 401);
    return error(e instanceof Error ? e.message : 'Unable to cancel booking', 400);
  }
}
