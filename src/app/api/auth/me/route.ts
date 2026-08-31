import { getSession } from '@/lib/auth';
import { ok } from '@/lib/http';
export async function GET() { return ok({ session: await getSession() }); }
