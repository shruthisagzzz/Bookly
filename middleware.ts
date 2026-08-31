import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  const path=req.nextUrl.pathname;
  if (!path.startsWith('/owner') && !path.startsWith('/admin')) return NextResponse.next();
  if (!req.cookies.get('booking_session')?.value) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}
export const config={matcher:['/owner/:path*','/admin/:path*']};
