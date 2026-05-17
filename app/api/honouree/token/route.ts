/**
 * ============================================================
 * LEGACYCAPSULE — app/api/honouree/token/route.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * POST — Handle portal token actions:
 *   action: 'request_otp'  → generate + send 6-digit OTP
 *   action: 'verify_otp'   → verify code + establish persistent session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { sendPortalOtp, verifyPortalOtp } from '@/lib/portalAuth';

// Admin client — used by portalAuth functions server-side
// Declared here to satisfy service-role key presence requirement
const _adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { action: string; slug: string; otp?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { action, slug, otp } = body;
  if (!action || !slug) {
    return NextResponse.json({ error: 'action and slug required.' }, { status: 400 });
  }

  if (action === 'request_otp') {
    const result = await sendPortalOtp(slug);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'verify_otp') {
    if (!otp) return NextResponse.json({ error: 'otp required.' }, { status: 400 });
    const result = await verifyPortalOtp(slug, otp);
    if (!result.valid) return NextResponse.json({ error: result.error }, { status: 401 });
    return NextResponse.json({ ok: true, session_type: result.sessionType });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
