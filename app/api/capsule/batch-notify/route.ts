// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/batch-notify/route.ts
// PURPOSE:   Receives { capsule_id, capsule_slug } from featureUnlocker.ts
//            after a contribution tier upgrade payment succeeds.
//            Queries queued_submissions for contributors with status='queued'
//            and a non-null contributor_email, then sends each one a
//            sendWallReopenNotification email.
//            Fire-and-forget from featureUnlocker — this route is non-blocking
//            and always returns 200 to the caller regardless of partial email
//            failures.
//            Marks sent rows status='notified' to prevent duplicate sends.
// BUILT BY:  AI34 · Claude Sonnet 4.6
// VERSION:   AI34v2.12.77
// DATE:      23 November 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse }     from 'next/server'
import { createClient }                   from '@supabase/supabase-js'
import { sendWallReopenNotification }     from '@/lib/email/sendWallReopenNotification'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest): Promise<NextResponse> {

  // ── Parse body ────────────────────────────────────────────────────────────
  let capsule_id:   string
  let capsule_slug: string

  try {
    const body   = await req.json()
    capsule_id   = body.capsule_id
    capsule_slug = body.capsule_slug

    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug are required.' },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // ── Fetch capsule context ─────────────────────────────────────────────────
  const { data: capsule, error: capsuleErr } = await db
    .from('capsules')
    .select('honouree_name, event_type')
    .eq('id', capsule_id)
    .maybeSingle()

  if (capsuleErr || !capsule) {
    console.error('[batch-notify] Capsule not found or DB error:', capsule_id, capsuleErr)
    // Return 200 — featureUnlocker fire-and-forget must not see a 4xx/5xx
    return NextResponse.json({ ok: false, error: 'Capsule not found.' }, { status: 200 })
  }

  // ── Fetch queued contributors with an email ───────────────────────────────
  // status='queued'   : hit the wall, work was saved, never notified
  // status='notified' : already sent — excluded to prevent duplicate sends
  const { data: queued, error: queueErr } = await db
    .from('queued_submissions')
    .select('id, session_token, contributor_name, contributor_email')
    .eq('capsule_id', capsule_id)
    .eq('status', 'queued')
    .not('contributor_email', 'is', null)

  if (queueErr) {
    console.error('[batch-notify] queued_submissions query error:', queueErr)
    return NextResponse.json({ ok: false, error: 'DB query failed.' }, { status: 200 })
  }

  if (!queued || queued.length === 0) {
    console.log(`[batch-notify] No queued contributors with email for capsule ${capsule_id}`)
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 }, { status: 200 })
  }

  // ── Send notification per contributor ────────────────────────────────────
  let sent    = 0
  let skipped = 0

  for (const row of queued) {
    try {
      await sendWallReopenNotification({
        recipientEmail: row.contributor_email!,
        recipientName:  row.contributor_name ?? null,
        honoureeName:   capsule.honouree_name,
        eventType:      capsule.event_type,
        capsuleSlug:    capsule_slug,
        sessionToken:   row.session_token,
      })

      // ── Mark as notified (best-effort) ───────────────────────────────────
      const { error: updateErr } = await db
        .from('queued_submissions')
        .update({ status: 'notified' })
        .eq('id', row.id)

      if (updateErr) {
        // Email already sent — log and continue; do not re-send
        console.warn('[batch-notify] Failed to mark row as notified:', row.id, updateErr)
      }

      sent++
    } catch (sendErr) {
      console.error('[batch-notify] Email failed for', row.contributor_email, sendErr)
      skipped++
      // Continue to next contributor — partial failure is acceptable
    }
  }

  // ── Log lifecycle event (non-blocking) ───────────────────────────────────
  try {
    await db.from('capsule_lifecycle_events').insert({
      capsule_id,
      event_type:  'wall_reopen_notified',
      payload:     { sent, skipped, total: queued.length },
      created_by:  'system',
    })
  } catch {
    // Non-fatal
  }

  console.log(`[batch-notify] Complete for ${capsule_id}: sent=${sent}, skipped=${skipped}`)

  return NextResponse.json({ ok: true, sent, skipped }, { status: 200 })
}
