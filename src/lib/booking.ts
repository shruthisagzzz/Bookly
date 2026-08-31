export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

export function canBookSlot(input: { startAt: Date; endAt: Date; available: boolean; existing: { startAt: Date; endAt: Date; status: string }[] }) {
  if (!input.available) return { ok: false, reason: 'SLOT_UNAVAILABLE' } as const;
  const active = input.existing.filter(x => ['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(x.status));
  if (active.some(x => overlaps(input.startAt, input.endAt, x.startAt, x.endAt))) return { ok: false, reason: 'CONFLICT' } as const;
  return { ok: true } as const;
}
