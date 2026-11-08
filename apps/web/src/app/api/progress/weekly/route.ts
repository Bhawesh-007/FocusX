// Progress API is intentionally not built yet (docs/progress.md — planned).
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Progress API is not implemented yet.' } },
    { status: 501 },
  );
}
