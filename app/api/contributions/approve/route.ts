// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/contributions/approve/route.ts
// PURPOSE:   Approves a contribution (pending → approved) from the organiser
//            manage dashboard. Replaces the direct Supabase client call in
//            manage/[slug]/page.tsx handleApprove.
//            Logs to capsule_activity_log via logAction.
//            Triggers approval email notification (non-blocking).
//            Uses service role — never anon client for write operations.
// ARCHITECTURE: CA-SPEC-001 — Step 7.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: { contribution_id, capsule_id, actor_name?, actor_email? }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { contribution_id, capsule_id, actor_name, actor_email } = await req.json()

    if (!contribution_id || !capsule_id) {
      return NextResponse.json(
        { error: 'contribution_id and capsule_id are required.' },
        { status: 400 }
      )
    }

    // ── Fetch contribution for log label ─────────────────────────────────
    const { data: contribution } = await db
      .from('contributions')
      .select('id, contributor_name, status')
      .eq('id', contribution_id)
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found.' }, { status: 404 })
    }

    if (contribution.status === 'approved') {
      return NextResponse.json({ error: 'This voice is already published.' }, { status: 409 })
    }

    // ── Approve ───────────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('contributions')
      .update({ status: 'approved' })
      .eq('id', contribution_id)
      .eq('capsule_id', capsule_id)

    if (updateError) {
      console.error('[contributions/approve] Update error:', updateError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── Trigger approval email (non-blocking) ─────────────────────────────
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
    fetch(`${appUrl}/api/email/approval`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contributionId: contribution_id }),
    }).catch(() => {})

    // ── Log action ─────────────────────────────────────────────────────────
    await logAction({
      capsule_id,
      actor_type:   'organiser',
      actor_name:   actor_name  ?? 'Organiser',
      actor_email:  actor_email ?? '',
      action_key:   ACTION_KEYS.CONTRIBUTION_APPROVED,
      action_label: `Published a voice from ${contribution.contributor_name}`,
      entity_type:  'contribution',
      entity_id:    contribution_id,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[contributions/approve]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}