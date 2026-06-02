// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/share/record/route.ts
// ROUTE: POST /api/share/record
// PURPOSE: Records a share event in capsule_share_events.
//          Called client-side when a visitor uses Copy Link,
//          WhatsApp share, or any other share channel.
//          Deduplicates by (ref_code, ip_hash, UTC calendar day).
//          Updates share_count in capsule_participation_summary.
// OWNER: AI7 — LC-PARTICIPATION-001 Phase 1
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Supabase service client
// ─────────────────────────────────────────────────────────────────────────────

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Valid share channels
// ─────────────────────────────────────────────────────────────────────────────

const VALID_CHANNELS = [
  'copy_link',
  'whatsapp',
  'keepsake_email',
  'native_share',
  'qr',
] as const

type ShareChannel = typeof VALID_CHANNELS[number]

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — IP hash helper
// SHA-256 of IP + daily salt — never stored in plain text.
// Daily salt means the hash rotates every UTC day, limiting
// tracking window while still preventing same-day spam.
// ─────────────────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
  return crypto
    .createHash('sha256')
    .update(ip + today + (process.env.IP_HASH_SALT ?? 'lc-salt'))
    .digest('hex')
    .slice(0, 32) // truncate — full hash not needed
}

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsuleId, refCode, channel, contributionId } = body

    // ── Input validation ───────────────────────────────────────────────────
    if (!capsuleId || typeof capsuleId !== 'string') {
      return NextResponse.json({ error: 'capsuleId is required' }, { status: 400 })
    }

    if (!refCode || typeof refCode !== 'string' || !/^[A-Z2-9]{8}$/.test(refCode)) {
      return NextResponse.json({ error: 'Invalid ref code format' }, { status: 400 })
    }

    if (!channel || !VALID_CHANNELS.includes(channel as ShareChannel)) {
      return NextResponse.json({ error: 'Invalid share channel' }, { status: 400 })
    }

    // ── Verify capsule exists ──────────────────────────────────────────────
    const { data: capsule, error: capsuleError } = await adminClient
      .from('capsules')
      .select('id')
      .eq('id', capsuleId)
      .single()

    if (capsuleError || !capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Build IP hash for deduplication ───────────────────────────────────
    const clientIp = getClientIp(req)
    const ipHash = clientIp ? hashIp(clientIp) : null

    // ── Insert share event ─────────────────────────────────────────────────
    // The UNIQUE INDEX on (ref_code, ip_hash, utc_date) handles deduplication.
    // On conflict we do nothing — the sharer already counted today.
    const { error: insertError } = await adminClient
      .from('capsule_share_events')
      .insert({
        capsule_id: capsuleId,
        sharer_contribution_id: contributionId ?? null,
        share_channel: channel,
        ref_code: refCode,
        ip_hash: ipHash,
      })

    if (insertError) {
      // Unique constraint violation = duplicate within same UTC day — silently ignore
      if (insertError.code === '23505') {
        return NextResponse.json({ ok: true, deduplicated: true })
      }
      console.error('[share/record] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record share' }, { status: 500 })
    }

    // ── Update share_count in participation summary ────────────────────────
    // Increment rather than full recount — fast and avoids a heavy query
    // on every share action. Full recount happens on next tribute approval.
    try {
      const { data: existing } = await adminClient
        .from('capsule_participation_summary')
        .select('share_count')
        .eq('capsule_id', capsuleId)
        .single()

      if (existing) {
        await adminClient
          .from('capsule_participation_summary')
          .update({
            share_count: (existing.share_count ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('capsule_id', capsuleId)
      } else {
        // Summary row doesn't exist yet — create it with share_count = 1
        await adminClient
          .from('capsule_participation_summary')
          .upsert(
            {
              capsule_id: capsuleId,
              share_count: 1,
              contributor_count: 0,
              photo_count: 0,
              country_count: 0,
              legacy_builder_count: 0,
              attributed_contrib_count: 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'capsule_id' }
          )
      }
    } catch (summaryErr) {
      // Non-fatal — share event was recorded, summary update failure is acceptable
      console.warn('[share/record] Summary update failed (non-fatal):', summaryErr)
    }

    return NextResponse.json({ ok: true, deduplicated: false })

  } catch (err) {
    console.error('[share/record] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
