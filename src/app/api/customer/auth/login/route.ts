import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createCustomerSession } from '@/lib/auth';
import { error, ok } from '@/lib/http';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function POST(req: NextRequest) {
  try {
    const input = schema.parse(await req.json());
    const customer = await prisma.customer.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!customer || !(await verifyPassword(input.password, customer.passwordHash))) return error('Invalid email or password', 401);
    await createCustomerSession({ customerId: customer.id, role: 'CUSTOMER', name: customer.name, email: customer.email });
    return ok({ customer: { id: customer.id, name: customer.name, email: customer.email } });
  } catch (e) { return error(e instanceof Error ? e.message : 'Invalid request', 400); }
}
