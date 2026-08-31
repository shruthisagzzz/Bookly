import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createCustomerSession } from '@/lib/auth';
import { error, ok } from '@/lib/http';
import { z } from 'zod';

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(100), phone: z.string().trim().max(30).optional().or(z.literal('')) });

export async function POST(req: NextRequest) {
  try {
    const input = schema.parse(await req.json());
    const email = input.email.toLowerCase();
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return error('An account already exists for this email. Please sign in.', 409);
    const customer = await prisma.customer.create({ data: { name: input.name, email, passwordHash: await hashPassword(input.password), phone: input.phone || null } });
    await createCustomerSession({ customerId: customer.id, role: 'CUSTOMER', name: customer.name, email: customer.email });
    return ok({ customer: { id: customer.id, name: customer.name, email: customer.email } }, 201);
  } catch (e) { return error(e instanceof Error ? e.message : 'Unable to create account', 400); }
}
