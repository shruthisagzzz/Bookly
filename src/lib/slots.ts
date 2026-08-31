import { DateTime } from 'luxon';
import { prisma } from './prisma';

export type Slot = { start: string; end: string; label: string };

export async function generateSlots(tenantId: string, serviceId: string, dateISO: string): Promise<Slot[]> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true, enabled: true } });
  const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId, status: 'ACTIVE' } });
  if (!tenant || !tenant.enabled || !service) return [];

  const day = DateTime.fromISO(dateISO, { zone: tenant.timezone });
  if (!day.isValid) return [];
  const weekday = day.weekday % 7; // Luxon Sunday=7; app convention Sunday=0.
  const rules = await prisma.availabilityRule.findMany({ where: { tenantId, dayOfWeek: weekday }, orderBy: { startTime: 'asc' } });
  if (!rules.length) return [];

  const dayStart = day.startOf('day').toUTC().toJSDate();
  const dayEnd = day.endOf('day').toUTC().toJSDate();
  const booked = await prisma.appointment.findMany({ where: { tenantId, startAt: { lt: dayEnd }, endAt: { gt: dayStart }, status: { in: ['CONFIRMED', 'COMPLETED', 'NO_SHOW'] } }, select: { startAt: true, endAt: true } });

  const now = DateTime.now().setZone(tenant.timezone);
  const slots: Slot[] = [];
  for (const rule of rules) {
    let cursor = DateTime.fromISO(`${dateISO}T${rule.startTime}`, { zone: tenant.timezone });
    const ruleEnd = DateTime.fromISO(`${dateISO}T${rule.endTime}`, { zone: tenant.timezone });
    while (cursor.plus({ minutes: service.durationMin }) <= ruleEnd) {
      const end = cursor.plus({ minutes: service.durationMin });
      const overlaps = booked.some(a => cursor.toUTC().toMillis() < a.endAt.getTime() && end.toUTC().toMillis() > a.startAt.getTime());
      if (!overlaps && cursor > now) {
        slots.push({ start: cursor.toUTC().toISO()!, end: end.toUTC().toISO()!, label: cursor.toFormat('h:mm a') });
      }
      cursor = cursor.plus({ minutes: 15 });
    }
  }
  return slots;
}
