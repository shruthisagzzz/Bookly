import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookingSchema } from '@/lib/validation';
import { generateSlots } from '@/lib/slots';
import { error, ok } from '@/lib/http';
import { DateTime } from 'luxon';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const input = bookingSchema.parse(await req.json());
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, enabled: true, timezone: true, name: true } });
    if (!tenant?.enabled) return error('Business not found or disabled', 404);
    const service = await prisma.service.findFirst({ where: { id: input.serviceId, tenantId: tenant.id, status: 'ACTIVE' } });
    if (!service) return error('Service not found', 404);
    const start = new Date(input.startAt); const end = new Date(start.getTime() + service.durationMin * 60000);
    if (start <= new Date()) return error('Choose a future time');
    const localDate = DateTime.fromJSDate(start, { zone: 'utc' }).setZone(tenant.timezone).toISODate()!;
    const validSlots = await generateSlots(tenant.id, service.id, localDate);
    const valid = validSlots.some(slot => new Date(slot.start).getTime() === start.getTime());
    if (!valid) return error('That slot is no longer available. Please choose another time.', 409);

    try {
      const appointment = await prisma.appointment.create({ data: { tenantId: tenant.id, serviceId: service.id, customerName: input.customerName, customerEmail: input.customerEmail.toLowerCase(), customerPhone: input.customerPhone || null, startAt: start, endAt: end } , include: { service: true, tenant: true } });
      return ok({ appointment: { id: appointment.id, bookingToken: appointment.bookingToken, businessName: appointment.tenant.name, service: appointment.service.name, startAt: appointment.startAt, endAt: appointment.endAt, customerName: appointment.customerName, customerEmail: appointment.customerEmail } }, 201);
    } catch (e: any) {
      if (e?.code === 'P2002' || e?.code === 'P2004' || e?.code === 'P2034') return error('That slot was just booked by someone else. Please choose another time.', 409);
      throw e;
    }
  } catch (e) { return error(e instanceof Error ? e.message : 'Unable to create booking', 400); }
}
