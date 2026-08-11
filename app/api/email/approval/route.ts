// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/email/approval/route.ts
// PURPOSE:   Approval email orchestrator — triggered when an organiser approves
//            a contribution. Sends Keepsake Card via sendKeepsakeCard (lib/email).
//            Also handles: ref code assignment, participation summary update,
//            legacy builder recalculation, and Realtime broadcast to live wall.
// ARCHITECTURE: D27 — Path A, Step 2. Keepsake Card sent on approval.
//               Email copy lives in lib/email.ts → sendKeepsakeCard.
//               Route is a pure orchestrator — no email HTML here.
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.91
// DATE:      11 August 2026
// NOTE:      ECS copy audit for sendKeepsakeCard lives in lib/email.ts —
//            requires separate upload session to complete.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendKeepsakeCard } from '@/lib/email'
import { assignRefCode, updateParticipationSummary, recalculateLegacyBuilders } from '@/lib/participation/refCode'

// ═══ SECTION 1 — Supabase admin client ═══
// Service role — required to fetch contribution + capsule without RLS restriction.

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { contributionId } = await req.json()

    if (!contributionId) {
      return NextResponse.json(
        { error: 'contributionId is required' },
        { status: 400 }
      )
    }

    // ── Fetch contribution ─────────────────────────────────────────────────
    // contributor_name — not name. Confirmed column name.
    const { data: contribution, error: contribError } = await adminClient
      .from('contributions')
      .select('id, capsule_id, contributor_name, city, country, tribute_text, thumbnail_url, email, ref_code, edit_token')
      .eq('id', contributionId)
      .single()

    if (contribError || !contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
    }

    // No email — nothing to send
    if (!contribution.email) {
      return NextResponse.json({ ok: true, skipped: 'no email on record' })
    }

    // ── Fetch capsule ──────────────────────────────────────────────────────
    const { data: capsule, error: capsuleError } = await adminClient
      .from('capsules')
      .select('slug, honouree_name, event_type')
      .eq('id', contribution.capsule_id)
      .single()

    if (capsuleError || !capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Generate edit_token if not already set ────────────────────────────
    let editToken = contribution.edit_token
    if (!editToken) {
      editToken = crypto.randomUUID()
      await adminClient
        .from('contributions')
        .update({ edit_token: editToken })
        .eq('id', contributionId)
    }

    // ── Assign ref code (generates contributor's share code) ──────────────
    if (!contribution.ref_code) {
      await assignRefCode(contributionId)
    }

    // ── Update participation summary + legacy builders ─────────────────────
    await updateParticipationSummary(contribution.capsule_id)
    await recalculateLegacyBuilders(contribution.capsule_id)

    // ── Broadcast to Live Wall via Supabase Realtime ───────────────────────
    // Fires whenever a tribute is approved — powers the live display wall.
    // Non-blocking — broadcast failure must never break the approval flow.
    try {
      await adminClient.channel(`capsule-${contribution.capsule_id}`).send({
        type:    'broadcast',
        event:   'new_contribution',
        payload: {
          id:               contribution.id,
          contributor_name: contribution.contributor_name,
          city:             contribution.city,
          country:          contribution.country,
          tribute_text:     contribution.tribute_text,
          thumbnail_url:    contribution.thumbnail_url ?? null,
          is_dday:          false,
        },
      })
    } catch (broadcastErr) {
      console.error('[approval] Realtime broadcast failed:', broadcastErr)
    }

    // ── Send Keepsake Card — D27 ───────────────────────────────────────────
    // ECS-compliant copy lives in lib/email.ts → sendKeepsakeCard.
    await sendKeepsakeCard({
      contributorEmail: contribution.email,
      contributorName:  contribution.contributor_name,
      subjectName:      capsule.honouree_name,
      eventType:        capsule.event_type,
      tributeText:      contribution.tribute_text,
      capsuleSlug:      capsule.slug,
      city:             contribution.city,
      country:          contribution.country,
      refCode:          contribution.ref_code ?? null,
      editLink:         editToken
        ? `${process.env.NEXT_PUBLIC_APP_URL}/for/${capsule.slug}/edit/${editToken}`
        : null,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[approval] Route error:', err)
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again.' },
      { status: 500 }
    )
  }
}