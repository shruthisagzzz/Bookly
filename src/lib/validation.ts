import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const businessSchema = z.object({ name: z.string().min(2).max(100), slug: z.string().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), contactName: z.string().max(100).optional(), email: z.string().email().optional().or(z.literal('')), phone: z.string().max(30).optional(), timezone: z.string().min(2) });
export const serviceSchema = z.object({ name: z.string().min(2).max(100), description: z.string().max(500).optional(), durationMin: z.coerce.number().int().min(15).max(480), status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE') });
export const availabilitySchema = z.object({ dayOfWeek: z.coerce.number().int().min(0).max(6), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) });
export const bookingSchema = z.object({ serviceId: z.string().min(1), startAt: z.string().datetime(), customerName: z.string().min(2).max(100), customerEmail: z.string().email(), customerPhone: z.string().max(30).optional() });
