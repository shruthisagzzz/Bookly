import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/auth';
import { error, ok } from '@/lib/http';

export async function GET() {
  try {
    const customer = await requireCustomer();
    const appointments = await prisma.appointment.findMany({
      where: { customerEmail: customer.email },
      include: { service: true, tenant: true },
      orderBy: { startAt: 'desc' },
    });
    return ok({ appointments });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return error('Unauthorized', 401);
    return error('Unable to load bookings', 500);
  }
}
