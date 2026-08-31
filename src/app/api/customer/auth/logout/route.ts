import { clearCustomerSession } from '@/lib/auth';
import { ok } from '@/lib/http';
export async function POST() { await clearCustomerSession(); return ok({ success: true }); }
