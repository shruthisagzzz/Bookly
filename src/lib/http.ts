import { NextResponse } from 'next/server';

export function ok(data: unknown, status = 200) { return NextResponse.json(data, { status }); }
export function error(message: string, status = 400, details?: unknown) { return NextResponse.json({ error: message, details }, { status }); }
