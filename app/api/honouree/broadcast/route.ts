/**
 * ============================================================
 * LEGACYCAPSULE — app/api/honouree/broadcast/route.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * POST — Send a broadcast to all opted-in contributors.
 * Enforces 7-day rate limit (D21).
 * Backend always batches (D56).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { sendBroadcastEmail }        from '@/lib/honoureeEmail';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { capsule_id: string; subject: string; body: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { capsule_id, subject, body: bodyText } = body;
  if (!capsule_id || !subject || !bodyText) {
    return NextResponse.json({ error: 'capsule_id, subject, and body required.' }, { status: 400 });
  }

  // ── 7-day rate limit check (D21) ──────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await adminClient
    .from('honouree_broadcasts')
    .select('id', { count: 'exact' })
    .eq('capsule_id', capsule_id)
    .in('status', ['complete', 'sending', 'pending'])
    .gte('created_at', sevenDaysAgo);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'One broadcast per 7 days per Capsule. Your next broadcast will be available soon.' },
      { status: 429 }
    );
  }

  // ── Fetch capsule ──────────────────────────────────────────
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name')
    .eq('id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule) return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 });

  // ── Fetch recipients (approved, have email) ───────────────
  const { data: contribs } = await adminClient
    .from('contributions')
    .select('contributor_name, email')
    .eq('capsule_id', capsule_id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .not('email', 'is', null);

  const recipients = (contribs ?? []).filter(c => c.email && c.contributor_name);

  // ── Create broadcast record ───────────────────────────────
  const { data: broadcast } = await adminClient
    .from('honouree_broadcasts')
    .insert({
      capsule_id,
      subject,
      body:            bodyText,
      recipient_count: recipients.length,
      status:          'sending',
      sent_at:         new Date().toISOString(),
    })
    .select('id')
    .single();

  if (!broadcast) return NextResponse.json({ error: 'Failed to create broadcast.' }, { status: 500 });

  // ── Send (batched in background — D56) ────────────────────
  const result = await sendBroadcastEmail({
    capsuleId:    capsule_id,
    broadcastId:  broadcast.id,
    honoureeName: capsule.honouree_name,
    slug:         capsule.slug,
    subject,
    body:         bodyText,
    recipients:   recipients.map(r => ({ name: r.contributor_name, email: r.email! })),
  });

  await adminClient
    .from('honouree_broadcasts')
    .update({ status: 'complete', sent_count: result.sent })
    .eq('id', broadcast.id);

  return NextResponse.json({ ok: true, sent: result.sent, failed: result.failed });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
