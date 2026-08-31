import { requireCustomer } from '@/lib/auth';
import { error, ok } from '@/lib/http';

export async function GET() {
  try {
    const customer = await requireCustomer();
    return ok({ customer });
  } catch {
    return error('Unauthorized', 401);
  }
}
