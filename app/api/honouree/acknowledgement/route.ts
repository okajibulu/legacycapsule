/**
 * ============================================================
 * LEGACYCAPSULE — app/api/honouree/acknowledgement/route.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * POST — Record an "I've sent a gift" acknowledgement from the
 * public profile page Ways to Honour section.
 *
 * Flow:
 *   1. Insert row to support_acknowledgements
 *   2. If supporter provided email → fire sendSupportThankYou()
 *   3. Return ok
 *
 * Body: {
 *   capsule_id:         string
 *   support_account_id: string
 *   supporter_name:     string
 *   supporter_email?:   string   (optional — contributor may skip)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { sendSupportThankYou }       from '@/lib/honoureeEmail';


// ============================================================
// SECTION 1 — Admin client
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


// ============================================================
// SECTION 2 — Route handler
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {

  // ── 2.1  Parse and validate body ──────────────────────────

  let body: {
    capsule_id:         string;
    support_account_id: string;
    supporter_name:     string;
    supporter_email?:   string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { capsule_id, support_account_id, supporter_name, supporter_email } = body;

  if (!capsule_id || !support_account_id || !supporter_name?.trim()) {
    return NextResponse.json(
      { error: 'capsule_id, support_account_id, and supporter_name are required.' },
      { status: 400 }
    );
  }


  // ── 2.2  Fetch capsule for email send ──────────────────────

  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id, slug, event_type, honouree_name')
    .eq('id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule) {
    return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 });
  }

  // ── 2.3  Fetch support account for method label ────────────

  const { data: account } = await adminClient
    .from('capsule_support_accounts')
    .select('method_label')
    .eq('id', support_account_id)
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: 'Support account not found.' }, { status: 404 });
  }


  // ── 2.4  Insert acknowledgement record ────────────────────

const { error: insertErr } = await adminClient
    .from('support_acknowledgements')
    .insert({
      capsule_id,
      support_account_id,
      supporter_name:  supporter_name.trim(),
      supporter_email: supporter_email?.trim() || null,
    })

  if (insertErr) {
    console.error('[acknowledgement] insert error:', insertErr.message);
    return NextResponse.json(
      { error: 'Failed to record acknowledgement.' },
      { status: 500 }
    );
  }


  // ── 2.5  Send thank-you email if email provided ───────────

  let emailSent = false;

  if (supporter_email?.trim()) {
    const result = await sendSupportThankYou({
      capsuleId:      capsule_id,
      eventType:      capsule.event_type,
      honoureeName:   capsule.honouree_name,
      slug:           capsule.slug,
      supporterName:  supporter_name.trim(),
      supporterEmail: supporter_email.trim(),
      methodLabel:    account.method_label,
    });

    if (result.ok) {
      // Mark thank-you as sent
await adminClient
        .from('support_acknowledgements')
        .update({
          thank_you_sent_at: new Date().toISOString(),
        })
        .eq('capsule_id', capsule_id)
        .eq('supporter_name', supporter_name.trim())
        .order('created_at', { ascending: false })
        .limit(1)

      emailSent = true;
    }
  }


  // ── 2.6  Return success ────────────────────────────────────

  return NextResponse.json({
    ok:         true,
    email_sent: emailSent,
  }, { status: 201 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
