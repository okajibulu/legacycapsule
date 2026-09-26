// ═══════════════════════════════════════════════════════════
// FILE PATH: app/api/auth/verify-invite/route.ts
// PURPOSE: Server-side invite token verification for set-password page
// ARCHITECTURE: Replaces direct browser-side capsule_accounts query
//               now blocked by RLS (AI28v2.12.64)
// BUILT BY: AI28 · Claude Opus 4.6
// VERSION: AI28v2.12.64
// DATE: 25 September 2026
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Service role client (bypasses RLS) ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GET handler — validate invite token ──
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token || token.length < 32) {
      return NextResponse.json(
        { error: 'Invalid or missing invite token' },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, name, email, invite_token_expires_at, invite_used_at')
      .eq('invite_token', token)
      .single();

    if (error || !account) {
      return NextResponse.json(
        { error: 'This invite link is not valid. Please ask the organiser to resend your invitation.' },
        { status: 404 }
      );
    }

    // ── Check if already used ──
    if (account.invite_used_at) {
      return NextResponse.json(
        { error: 'This invite link has already been used. If you need to reset your password, ask the organiser to resend your invitation.' },
        { status: 410 }
      );
    }

    // ── Check expiry ──
    if (account.invite_token_expires_at && new Date(account.invite_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired. Please ask the organiser to resend your invitation.' },
        { status: 410 }
      );
    }

    // ── Fetch capsule slug for redirect ──
    const { data: capsule } = await supabase
      .from('capsules')
      .select('slug')
      .eq('id', account.capsule_id)
      .single();

    // ── Return only safe fields — never password_hash, never the token itself ──
    return NextResponse.json({
      id: account.id,
      capsule_id: account.capsule_id,
      account_type: account.account_type,
      name: account.name,
      email: account.email,
      slug: capsule?.slug || null,
    });
  } catch (err) {
    console.error('[verify-invite] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}