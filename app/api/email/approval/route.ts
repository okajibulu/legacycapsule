// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL EMAIL ROUTE
// Route: POST /api/email/approval
// Called from organiser manage page when a tribute is approved.
// D27: Sends Keepsake Card — premium HTML email, not plain text.
// Never import email functions directly into client components.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendKeepsakeCard } from '@/lib/email'

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE — service role to fetch contribution + capsule details
// ─────────────────────────────────────────────────────────────────────────────
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
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
    // contributor_name — not name. Gotcha #3.
    const { data: contribution, error: contribError } = await adminClient
      .from('contributions')
      .select('id, capsule_id, contributor_name, city, country, tribute_text, email')
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

    // ── Send Keepsake Card — D27 ───────────────────────────────────────────
    await sendKeepsakeCard({
      contributorEmail: contribution.email,
      contributorName: contribution.contributor_name,
      subjectName: capsule.honouree_name,
      eventType: capsule.event_type,
      tributeText: contribution.tribute_text,
      capsuleSlug: capsule.slug,
      city: contribution.city,
      country: contribution.country,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Approval email route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}