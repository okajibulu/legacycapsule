// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/generate/route.ts
// PURPOSE: Generate unique access codes for all guests in a capsule.
//          Reads hall config, detects previously-sent codes and returns a
//          warning before destructive regeneration, batch-inserts codes,
//          and updates guests.access_code for backward compatibility.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 4 — Generate Route Hardening
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// REPLACES: Previous version by AI11 (Claude Sonnet 4.6)
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
//
// guests.tier uses capitalised display names (set during guest creation).
// event_access_codes.participant_type uses lowercase internal keys.
// Unmapped tiers fall back to 'general'.

const TIER_TO_TYPE: Record<string, string> = {
  'VVIP':           'vvip',
  'VIP':            'vip',
  'General':        'general',
  'Reception Only': 'reception_only',
  'Staff':          'staff',
  'Media':          'media',
  'Vendor':         'vendor',
}

// max_uses per participant type:
// VVIP/VIP/Staff/Media/Vendor get 999 (re-entry allowed at organiser's discretion)
// General and Reception Only are single-entry by default
const MAX_USES_BY_TYPE: Record<string, number> = {
  vvip:           999,
  vip:            999,
  general:        1,
  reception_only: 1,
  staff:          999,
  media:          999,
  vendor:         999,
}

// ═══ SECTION 3 — Code generation helpers ═══

/**
 * generateUniqueNumericCode
 * Produces a 6-digit numeric code guaranteed unique within the capsule.
 * Checks event_access_codes for collision before returning.
 * Retries up to 20 times — collision probability is negligible below 100k guests.
 */
// Pre-fetch all existing codes for this capsule once,
// then generate locally without repeated DB calls.
// This reduces N*20 round-trips to a single query.
async function generateUniqueCodes(
  capsule_id: string,
  count: number
): Promise<string[]> {
  // Fetch all existing codes in one query
  const { data: existing } = await db
    .from('event_access_codes')
    .select('numeric_code')
    .eq('capsule_id', capsule_id)

  const usedCodes = new Set((existing ?? []).map(r => r.numeric_code))
  const generated: string[] = []

  let attempts = 0
  while (generated.length < count && attempts < count * 50) {
    attempts++
    const code = String(Math.floor(100000 + Math.random() * 900000))
    if (!usedCodes.has(code) && !generated.includes(code)) {
      generated.push(code)
      usedCodes.add(code)
    }
  }

  if (generated.length < count) {
    throw new Error('Could not generate enough unique codes. Please try again.')
  }

  return generated
}

/**
 * generateQrPayload
 * HMAC-SHA256 signed payload encoding capsule scope.
 * A code scanned against the wrong capsule will always fail validation.
 * Format: LC:{capsule_id[0:8]}:{numeric_code}:{hmac[0:16]}
 */
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

// ═══ SECTION 4 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, scope, guest_ids, confirm_regenerate } = body

    // ── 4.1 Input validation ─────────────────────────────────────────────────

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
        { error: 'guest_ids array is required when scope is "selected".' },
        { status: 400 }
      )
    }

    // ── 4.2 Config validation ────────────────────────────────────────────────
    // Refuse to generate if no hall config has been saved.
    // This prevents orphaned codes with no venue context.

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

    if (!config) {
      return NextResponse.json(
        {
          error: 'No hall configuration found for this capsule. '
               + 'Save your venue setup in the Setup tab before generating codes.',
        },
        { status: 422 }
      )
    }

    // ── 4.3 Sent-code detection — regeneration safety check ─────────────────
    // If any existing codes have already been emailed (status = 'sent' | 'delivered'),
    // return a warning payload BEFORE deleting anything.
    // The client must re-submit with { confirm_regenerate: true } to proceed.
    // This protects guests who received a code that is about to be invalidated.

    if (resolvedScope === 'all' && !confirm_regenerate) {
      const { count: sentCount } = await db
        .from('event_access_codes')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsule_id)
        .in('status', ['sent', 'delivered'])

      if (sentCount && sentCount > 0) {
        return NextResponse.json(
          {
            warning:       true,
            sent_count:    sentCount,
            error:
              `${sentCount} guest${sentCount !== 1 ? 's have' : ' has'} already received `
              + `their access code by email. Regenerating will invalidate those codes — `
              + `guests will need to be re-sent new codes. `
              + `Re-submit with confirm_regenerate: true to proceed.`,
          },
          { status: 409 }
        )
      }
    }

    // ── 4.4 Fetch guests ─────────────────────────────────────────────────────

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

    if (guestErr) {
      console.error('[access-codes/generate] Guest fetch error:', guestErr)
      return NextResponse.json(
        { error: 'Could not fetch guest list. Please try again.' },
        { status: 500 }
      )
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json(
        {
          error:
            resolvedScope === 'confirmed'
              ? 'No confirmed guests found. Check that guests have confirmed their RSVP.'
              : 'No guests found for this capsule. Add guests before generating codes.',
        },
        { status: 404 }
      )
    }

    // ── 4.5 Delete existing codes for scope ──────────────────────────────────

    if (resolvedScope === 'all') {
      const { error: deleteErr } = await db
        .from('event_access_codes')
        .delete()
        .eq('capsule_id', capsule_id)

      if (deleteErr) {
        console.error('[access-codes/generate] Delete error:', deleteErr)
        return NextResponse.json(
          { error: 'Failed to clear existing codes before regeneration. Please try again.' },
          { status: 500 }
        )
      }
    } else {
      const guestIdList = guests.map(g => g.id)
      if (guestIdList.length > 0) {
        await db
          .from('event_access_codes')
          .delete()
          .eq('capsule_id', capsule_id)
          .in('guest_id', guestIdList)
      }
    }

    // ── 4.6 Build batch insert payload ───────────────────────────────────────
    // Generate codes for all guests first, then batch-insert in one DB call.
    // This is dramatically faster than per-guest sequential inserts for
    // large guest lists (300+).
    //
    // valid_until is populated from config.checkin_closes_at when available —
    // this connects the guest's code validity window to the configured check-in
    // period so stale codes are automatically rejected at the door.

    const batchRows    = []
    const guestUpdates = []
    const errors:       { guest_id: string; guest_name: string; reason: string }[] = []

    // Generate all codes in one batch — single DB round-trip instead of N*20
    let uniqueCodes: string[]
    try {
      uniqueCodes = await generateUniqueCodes(capsule_id, guests.length)
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message ?? 'Could not generate unique codes. Please try again.' },
        { status: 500 }
      )
    }

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i]
      try {
        const numeric_code     = uniqueCodes[i]
        const qr_payload       = generateQrPayload(capsule_id, numeric_code)

        // Prefer guests.participant_type (if set) over tier mapping
        const participant_type =
          guest.participant_type
          ?? TIER_TO_TYPE[guest.tier ?? 'General']
          ?? 'general'

        batchRows.push({
          capsule_id,
          guest_id:         guest.id,
          participant_type,
          guest_name:       guest.name,
          guest_email:      guest.email       ?? null,
          section_id:       guest.section_id  ?? null,
          numeric_code,
          qr_payload,
          vendor_company:   guest.vendor_company ?? null,
          vendor_role:      guest.vendor_role    ?? null,
          valid_from:       guest.valid_from     ?? config.checkin_opens_at ?? null,
          valid_until:      config.checkin_closes_at ?? null,
          special_note:     guest.special_note   ?? null,
          max_uses:         MAX_USES_BY_TYPE[participant_type] ?? 1,
          use_count:        0,
          card_included:    false,
          status:           'generated',
        })

        guestUpdates.push({ id: guest.id, access_code: numeric_code })

      } catch (codeErr: any) {
        console.error(`[access-codes/generate] Code generation failed for ${guest.name}:`, codeErr)
        errors.push({
          guest_id:   guest.id,
          guest_name: guest.name,
          reason:     codeErr.message ?? 'Unknown error',
        })
      }
    }

    // ── 4.7 Batch insert ─────────────────────────────────────────────────────

    let insertedCount = 0

    if (batchRows.length > 0) {
      // Supabase batch insert — single round-trip for all rows
      const CHUNK = 100   // insert in chunks of 100 to stay within payload limits
      for (let i = 0; i < batchRows.length; i += CHUNK) {
        const chunk = batchRows.slice(i, i + CHUNK)
        const { error: insertErr } = await db
          .from('event_access_codes')
          .insert(chunk)

        if (insertErr) {
          console.error('[access-codes/generate] Batch insert error:', insertErr)
          // Don't abort — count what was inserted, report remainder as errors
          errors.push(...chunk.map(r => ({
            guest_id:   r.guest_id,
            guest_name: r.guest_name,
            reason:     insertErr.message,
          })))
        } else {
          insertedCount += chunk.length
        }
      }
    }

    // ── 4.8 Backward-compat: update guests.access_code ──────────────────────
    // GuestManagementSection reads guests.access_code directly.
    // Update in a best-effort loop — failures here are non-blocking.

    for (const update of guestUpdates) {
      try {
        await db
          .from('guests')
          .update({ access_code: update.access_code })
          .eq('id', update.id)
      } catch (updateErr) {
        console.warn(
          `[access-codes/generate] Could not update guests.access_code for ${update.id}:`,
          updateErr
        )
      }
    }

    // ── 4.9 Response ─────────────────────────────────────────────────────────

    return NextResponse.json({
      ok:        true,
      generated: insertedCount,
      errors:    errors.length,
      ...(errors.length > 0 && {
        error_detail: errors.map(e => `${e.guest_name}: ${e.reason}`),
      }),
    })

  } catch (e: any) {
    console.error('[access-codes/generate] Unexpected error:', e)
    return NextResponse.json(
      { error: 'An unexpected error occurred during code generation. Please try again.' },
      { status: 500 }
    )
  }
}
