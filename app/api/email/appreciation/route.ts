/**
 * ============================================================
 * LEGACYCAPSULE — app/api/email/appreciation/route.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * POST — Send appreciation email(s) from the honouree portal.
 *
 * Handles two send modes:
 *   individual  — one email to one contributor
 *   collective  — one personalised email to all reachable contributors
 *
 * Backend always batches regardless of UI trigger (D56).
 * Progress is updated on the broadcast row for real-time UI.
 *
 * Body: {
 *   capsule_id: string
 *   mode: 'individual' | 'collective'
 *   -- individual only --
 *   contribution_id: string
 *   -- collective has no extra fields --
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import {
  sendAppreciationEmail,
  sendCollectiveEmail,
}                                    from '@/lib/honoureeEmail';

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

  // ── 2.1  Parse body ───────────────────────────────────────
  let body: {
    capsule_id:      string;
    mode:            'individual' | 'collective';
    contribution_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { capsule_id, mode } = body;

  if (!capsule_id || !mode) {
    return NextResponse.json(
      { error: 'capsule_id and mode are required.' },
      { status: 400 }
    );
  }


  // ── 2.2  Fetch capsule metadata ───────────────────────────
  const { data: capsule, error: capErr } = await adminClient
    .from('capsules')
    .select('id, slug, event_type, honouree_name, family_rep_name, tier')
    .eq('id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (capErr || !capsule) {
    return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 });
  }


  // ── 2.3  Fetch custom template if set ─────────────────────
  const { data: template } = await adminClient
    .from('honouree_email_templates')
    .select('template_type, custom_body')
    .eq('capsule_id', capsule_id)
    .maybeSingle();

  const customBody = template?.template_type === 'custom'
    ? (template.custom_body ?? null)
    : null;


  // ── 2.4  Individual mode ───────────────────────────────────
  if (mode === 'individual') {
    const { contribution_id } = body;
    if (!contribution_id) {
      return NextResponse.json(
        { error: 'contribution_id required for individual mode.' },
        { status: 400 }
      );
    }

    const { data: contrib } = await adminClient
      .from('contributions')
      .select('id, contributor_name, email, tribute_text')
      .eq('id', contribution_id)
      .eq('capsule_id', capsule_id)
      .maybeSingle();

    if (!contrib || !contrib.email) {
      return NextResponse.json(
        { error: 'Contributor not found or has no email.' },
        { status: 404 }
      );
    }

    const excerpt = (contrib.tribute_text ?? '').slice(0, 120);

    const result = await sendAppreciationEmail({
      capsuleId:        capsule_id,
      eventType:        capsule.event_type,
      honoureeName:     capsule.honouree_name,
      familyRepName:    capsule.family_rep_name ?? null,
      slug:             capsule.slug,
      contributorId:    contrib.id,
      contributorName:  contrib.contributor_name,
      contributorEmail: contrib.email,
      tributeExcerpt:   excerpt,
      customBody,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Send failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, resend_id: result.resendId });
  }


  // ── 2.5  Collective mode ───────────────────────────────────
  if (mode === 'collective') {
    // Fetch all approved contributors with emails
    const { data: contribs } = await adminClient
      .from('contributions')
      .select('id, contributor_name, email, country, is_anonymous')
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .eq('is_anonymous', false)
      .is('deleted_at', null)
      .not('email', 'is', null);

    const allContribs = contribs ?? [];
    const reachable   = allContribs.filter(c => c.email && c.contributor_name);

    // Count total approved (including anonymous)
    const { count: totalCount } = await adminClient
      .from('contributions')
      .select('id', { count: 'exact' })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .is('deleted_at', null);

    // Count unique countries
    const { data: countryRows } = await adminClient
      .from('contributions')
      .select('country')
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .not('country', 'is', null);

    const countryCount = new Set((countryRows ?? []).map(r => r.country)).size;

    const result = await sendCollectiveEmail({
      capsuleId:      capsule_id,
      eventType:      capsule.event_type,
      honoureeName:   capsule.honouree_name,
      familyRepName:  capsule.family_rep_name ?? null,
      slug:           capsule.slug,
      totalCount:     totalCount ?? 0,
      countryCount,
      reachableCount: reachable.length,
      customBody,
      recipients: reachable.map(c => ({
        name:           c.contributor_name,
        email:          c.email!,
        contributionId: c.id,
      })),
    });

    return NextResponse.json({
      ok:     true,
      sent:   result.sent,
      failed: result.failed,
    });
  }

  return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
