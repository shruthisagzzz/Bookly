import { describe, expect, it } from 'vitest';
import { canBookSlot, overlaps } from '../src/lib/booking';

describe('booking conflict rules', () => {
  it('detects overlapping appointments', () => {
    expect(overlaps(new Date('2026-09-01T10:00:00Z'), new Date('2026-09-01T10:30:00Z'), new Date('2026-09-01T10:15:00Z'), new Date('2026-09-01T10:45:00Z'))).toBe(true);
  });
  it('allows adjacent appointments', () => {
    expect(overlaps(new Date('2026-09-01T10:00:00Z'), new Date('2026-09-01T10:30:00Z'), new Date('2026-09-01T10:30:00Z'), new Date('2026-09-01T11:00:00Z'))).toBe(false);
  });
  it('rejects conflicts but ignores cancelled bookings', () => {
    const result = canBookSlot({
      startAt: new Date('2026-09-01T10:00:00Z'), endAt: new Date('2026-09-01T10:30:00Z'), available: true,
      existing: [
        { startAt: new Date('2026-09-01T10:15:00Z'), endAt: new Date('2026-09-01T10:45:00Z'), status: 'CONFIRMED' },
        { startAt: new Date('2026-09-01T10:00:00Z'), endAt: new Date('2026-09-01T10:30:00Z'), status: 'CANCELLED' },
      ]
    });
    expect(result).toEqual({ ok: false, reason: 'CONFLICT' });
  });
  it('rejects unavailable slots', () => {
    expect(canBookSlot({ startAt: new Date(), endAt: new Date(Date.now() + 1), available: false, existing: [] })).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' });
  });
});
