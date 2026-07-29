// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/generate/route.ts
// PURPOSE: Generate unique access codes for all guests in a capsule.
//          Batch code generation — single DB query instead of N×20 sequential
//          calls, eliminating Vercel Hobby timeout on large guest lists.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: AI14 · Claude Opus 4.6 · 29 July 2026
// REPLACES: Previous version (sequential collision checks — timed out on Vercel)
// VERSION: v2.10.5
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import crypto                        from 'crypto'

// ═══ SECTION 1 — Supabase client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Tier → participant_type mapping ═══

const TIER_TO_TYPE: Record<string, string> = {
  'VVIP':           'vvip',
  'VIP':            'vip',
  'General':        'general',
  'Reception Only': 'reception_only',
  'Staff':          'staff',
  'Media':          'media',
  'Vendor':         'vendor',
}

const MAX_USES_BY_TYPE: Record<string, number> = {
  vvip:           999,
  vip:            999,
  general:        1,
  reception_only: 1,
  staff:          999,
  media:          999,
  vendor:         999,
}

// ═══ SECTION 3 — Batch code generation ═══
//
// Fetches ALL existing codes for the capsule in ONE query,
// then generates unique codes locally using a Set for O(1) lookups.
// This replaces the previous approach of N×20 sequential DB round-trips
// which caused Vercel Hobby timeouts on any guest list > 3 people.

async function generateUniqueCodes(
  capsule_id: string,
  count: number
): Promise<string[]> {
  // Single DB query — fetch all existing codes for this capsule
  const { data: existing } = await db
    .from('event_access_codes')
    .select('numeric_code')
    .eq('capsule_id', capsule_id)

  const usedCodes  = new Set((existing ?? []).map((r: any) => r.numeric_code))
  const generated: string[] = []

  // Generate locally — no DB calls in the loop
  let attempts = 0
  const maxAttempts = count * 100   // generous ceiling, collision rate is negligible

  while (generated.length < count && attempts < maxAttempts) {
    attempts++
    const code = String(Math.floor(100000 + Math.random() * 900000))
    if (!usedCodes.has(code)) {
      generated.push(code)
      usedCodes.add(code)   // prevent duplicates within this batch
    }
  }

  if (generated.length < count) {
    throw new Error(
      `Could not generate ${count} unique codes after ${maxAttempts} attempts. `
      + 'Please try again.'
    )
  }

  return generated
}

// ═══ SECTION 4 — QR payload generation ═══

function generateQrPayload(capsule_id: string, numeric_code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'lc-fallback-secret'
  const raw    = `${capsule_id}:${numeric_code}`
  const hash   = crypto
    .createHmac('sha256', secret)
    .update(raw)
    .digest('hex')
    .slice(0, 16)
  return `LC:${capsule_id.slice(0, 8)}:${numeric_code}:${hash}`
}

// ═══ SECTION 5 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, scope, guest_ids, confirm_regenerate } = body

    // ── 5.1 Input validation ─────────────────────────────────────────────────

    if (!capsule_id) {
      return NextResponse.json(
        { error: 'capsule_id is required.' },
        { status: 400 }
      )
    }

    const resolvedScope = scope ?? 'all'

    if (!['all', 'confirmed', 'selected'].includes(resolvedScope)) {
      return NextResponse.json(
        { error: `Invalid scope "${resolvedScope}". Use: all | confirmed | selected.` },
        { status: 400 }
      )
    }

    if (resolvedScope === 'selected' && (!guest_ids || guest_ids.length === 0)) {
      return NextResponse.json(
        { error: 'guest_ids required when scope is "selected".' },
        { status: 400 }
      )
    }

    // ── 5.2 Config — soft check, default to free_seating if not set ──────────

    const { data: config, error: configErr } = await db
      .from('event_access_config')
      .select('id, code_mode, checkin_opens_at, checkin_closes_at, hall_config')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (configErr) {
      console.error('[access-codes/generate] Config fetch error:', configErr)
      return NextResponse.json(
        { error: 'Could not read hall configuration. Please try again.' },
        { status: 500 }
      )
    }

    // Use defaults if no config saved — don't block generation
    const effectiveConfig = config ?? {
      hall_config:       'free_seating',
      code_mode:         'single',
      checkin_opens_at:  null,
      checkin_closes_at: null,
    }

    // ── 5.3 Sent-code safety check ────────────────────────────────────────────

    if (resolvedScope === 'all' && !confirm_regenerate) {
      const { count: sentCount } = await db
        .from('event_access_codes')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsule_id)
        .in('status', ['sent', 'delivered'])

      if (sentCount && sentCount > 0) {
        return NextResponse.json(
          {
            warning:    true,
            sent_count: sentCount,
            error:
              `${sentCount} guest${sentCount !== 1 ? 's have' : ' has'} already `
              + `received their code by email. Regenerating will invalidate those codes. `
              + `Re-submit with confirm_regenerate: true to proceed.`,
          },
          { status: 409 }
        )
      }
    }

    // ── 5.4 Fetch guests ──────────────────────────────────────────────────────

    let guestQuery = db
      .from('guests')
      .select(
        'id, name, email, tier, participant_type, section_id, '
        + 'special_note, vendor_company, vendor_role, valid_from'
      )
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)

    if (resolvedScope === 'confirmed') {
      guestQuery = (guestQuery as any).eq('rsvp_status', 'confirmed')
    } else if (resolvedScope === 'selected') {
      guestQuery = (guestQuery as any).in('id', guest_ids)
    }

    const { data: rawGuests, error: guestErr } = await guestQuery

    if (guestErr) {
      console.error('[access-codes/generate] Guest fetch error:', guestErr)
      return NextResponse.json(
        { error: 'Could not fetch guest list. Please try again.' },
        { status: 500 }
      )
    }

    const guests = (rawGuests ?? []) as unknown as Array<{
      id:               string
      name:             string
      email:            string | null
      tier:             string
      participant_type: string | null
      section_id:       string | null
      special_note:     string | null
      vendor_company:   string | null
      vendor_role:      string | null
      valid_from:       string | null
    }>

    if (!guests || guests.length === 0) {
      return NextResponse.json(
        {
          error: resolvedScope === 'confirmed'
            ? 'No confirmed guests found. Check that guests have confirmed their RSVP.'
            : 'No guests found for this capsule. Add guests before generating codes.',
        },
        { status: 404 }
      )
    }

    // ── 5.5 Delete existing codes for scope ───────────────────────────────────

    if (resolvedScope === 'all') {
      const { error: deleteErr } = await db
        .from('event_access_codes')
        .delete()
        .eq('capsule_id', capsule_id)

      if (deleteErr) {
        console.error('[access-codes/generate] Delete error:', deleteErr)
        return NextResponse.json(
          { error: 'Failed to clear existing codes. Please try again.' },
          { status: 500 }
        )
      }
    } else {
      const ids = guests.map(g => g.id)
      if (ids.length > 0) {
        await db
          .from('event_access_codes')
          .delete()
          .eq('capsule_id', capsule_id)
          .in('guest_id', ids)
      }
    }

    // ── 5.6 Generate all codes in one batch ───────────────────────────────────

    let uniqueCodes: string[]
    try {
      uniqueCodes = await generateUniqueCodes(capsule_id, guests.length)
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message ?? 'Could not generate unique codes. Please try again.' },
        { status: 500 }
      )
    }

    // ── 5.7 Build batch insert payload ────────────────────────────────────────

    const batchRows:    any[] = []
    const guestUpdates: { id: string; access_code: string }[] = []
    const errors:       { guest_name: string; reason: string }[] = []

    for (let i = 0; i < guests.length; i++) {
      const guest        = guests[i]
      const numeric_code = uniqueCodes[i]

      try {
        const qr_payload       = generateQrPayload(capsule_id, numeric_code)
        const participant_type =
          guest.participant_type
          ?? TIER_TO_TYPE[guest.tier ?? 'General']
          ?? 'general'

        batchRows.push({
          capsule_id,
          guest_id:         guest.id,
          participant_type,
          guest_name:       guest.name,
          guest_email:      guest.email          ?? null,
          section_id:       guest.section_id     ?? null,
          numeric_code,
          qr_payload,
          vendor_company:   guest.vendor_company ?? null,
          vendor_role:      guest.vendor_role    ?? null,
          valid_from:       guest.valid_from     ?? effectiveConfig.checkin_opens_at  ?? null,
          valid_until:      effectiveConfig.checkin_closes_at ?? null,
          special_note:     guest.special_note   ?? null,
          max_uses:         MAX_USES_BY_TYPE[participant_type] ?? 1,
          use_count:        0,
          card_included:    false,
          status:           'generated',
        })

        guestUpdates.push({ id: guest.id, access_code: numeric_code })

      } catch (rowErr: any) {
        console.error(`[access-codes/generate] Row build failed for ${guest.name}:`, rowErr)
        errors.push({ guest_name: guest.name, reason: rowErr.message ?? 'Unknown' })
      }
    }

    // ── 5.8 Batch insert in chunks of 100 ────────────────────────────────────

    let insertedCount = 0

    const CHUNK = 100
    for (let i = 0; i < batchRows.length; i += CHUNK) {
      const chunk = batchRows.slice(i, i + CHUNK)
      const { error: insertErr } = await db
        .from('event_access_codes')
        .insert(chunk)

      if (insertErr) {
        console.error('[access-codes/generate] Batch insert error:', insertErr)
        errors.push(...chunk.map((r: any) => ({
          guest_name: r.guest_name,
          reason:     insertErr.message,
        })))
      } else {
        insertedCount += chunk.length
      }
    }

    // ── 5.9 Backward-compat: update guests.access_code ───────────────────────

    for (const update of guestUpdates) {
      try {
        await db
          .from('guests')
          .update({ access_code: update.access_code })
          .eq('id', update.id)
      } catch (e) {
        console.warn('[access-codes/generate] Could not update guests.access_code:', e)
      }
    }

    // ── 5.10 Response ─────────────────────────────────────────────────────────

    return NextResponse.json({
      ok:             true,
      generated:      insertedCount,
      errors:         errors.length,
      config_defaulted: !config,
      ...(errors.length > 0 && {
        error_detail: errors.map(e => `${e.guest_name}: ${e.reason}`),
      }),
    })

  } catch (e: any) {
    console.error('[access-codes/generate] Unexpected error:', e)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
