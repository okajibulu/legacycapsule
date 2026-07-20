// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/generate/route.ts
// PURPOSE: Generate access codes for all confirmed guests in a capsule.
//          Step 3 of LC-ACCESS-001 build sequence.
//          - Reads guests from guests table
//          - Maps tier → participant_type
//          - Generates 6-digit numeric code unique per capsule
//          - Generates QR payload (capsule_id:code hash)
//          - Inserts into event_access_codes
//          - Updates guests.access_code for backward compat
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import crypto                        from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Client
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Tier → participant_type mapping
// Existing guests table uses capitalized tier names (VVIP, VIP, General…)
// event_access_codes uses lowercase participant_type per schema
// ─────────────────────────────────────────────────────────────────────────────

const TIER_TO_TYPE: Record<string, string> = {
  'VVIP':             'vvip',
  'VIP':              'vip',
  'General':          'general',
  'Reception Only':   'reception_only',
  'Staff':            'staff',
  'Media':            'media',
  'Vendor':           'vendor',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Code generation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a 6-digit numeric code unique per capsule.
 * Retries until no collision found in event_access_codes for this capsule.
 */
async function generateUniqueNumericCode(capsule_id: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const { data } = await db
      .from('event_access_codes')
      .select('id')
      .eq('capsule_id', capsule_id)
      .eq('numeric_code', code)
      .maybeSingle()
    if (!data) return code
  }
  throw new Error('Could not generate unique code after 20 attempts')
}

/**
 * Generate QR payload: HMAC-SHA256 hash of capsule_id + code + secret.
 * Encodes capsule scope so it can never validate against the wrong capsule.
 */
function generateQrPayload(capsule_id: string, numeric_code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback'
  const raw = `${capsule_id}:${numeric_code}`
  const hash = crypto.createHmac('sha256', secret).update(raw).digest('hex').slice(0, 16)
  return `LC:${capsule_id.slice(0, 8)}:${numeric_code}:${hash}`
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, scope, guest_ids } = await req.json()
    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    // ── Validate scope ──────────────────────────────────────────────────────
    // scope: 'all' (default) | 'confirmed' | 'selected'
    // 'selected' requires guest_ids array
    const resolvedScope = scope ?? 'all'
    if (resolvedScope === 'selected' && (!guest_ids || guest_ids.length === 0)) {
      return NextResponse.json({ error: 'guest_ids required when scope is selected' }, { status: 400 })
    }

    // ── Fetch config ────────────────────────────────────────────────────────
    const { data: config } = await db
      .from('event_access_config')
      .select('code_mode')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    // ── Fetch guests filtered by scope ──────────────────────────────────────
    // 'all' fetches everyone. 'confirmed' filters by rsvp_status. 'selected' uses guest_ids.
    let guestQuery = db
      .from('guests')
      .select('id, name, email, tier, section_id, special_note, vendor_company, vendor_role, valid_from, rsvp_status')
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)

    if (resolvedScope === 'confirmed') {
      guestQuery = (guestQuery as any).eq('rsvp_status', 'confirmed')
    } else if (resolvedScope === 'selected') {
      guestQuery = (guestQuery as any).in('id', guest_ids)
    }

    const { data: guests, error: guestError } = await guestQuery

    if (guestError) throw guestError
    if (!guests || guests.length === 0) {
      return NextResponse.json({ error: 'No guests found for this capsule' }, { status: 404 })
    }

    // ── Delete existing codes for the relevant scope ─────────────────────────
    // 'all': wipe all codes for this capsule (full regeneration)
    // 'confirmed' / 'selected': wipe only the codes for the guests in scope
    if (resolvedScope === 'all') {
      await db.from('event_access_codes').delete().eq('capsule_id', capsule_id)
    } else {
      const guestIdList = guests?.map(g => g.id) ?? []
      if (guestIdList.length > 0) {
        await db.from('event_access_codes')
          .delete()
          .eq('capsule_id', capsule_id)
          .in('guest_id', guestIdList)
      }
    }

    // ── Generate codes for each guest ───────────────────────────────────────
    const generated = []
    const errors = []

    for (const guest of guests) {
      try {
        const numeric_code = await generateUniqueNumericCode(capsule_id)
        const qr_payload   = generateQrPayload(capsule_id, numeric_code)
        const participant_type = TIER_TO_TYPE[guest.tier ?? 'General'] ?? 'general'

        const { data: code, error: insertError } = await db
          .from('event_access_codes')
          .insert({
            capsule_id,
            guest_id:         guest.id,
            participant_type,
            guest_name:       guest.name,
            guest_email:      guest.email ?? null,
            section_id:       guest.section_id ?? null,
            numeric_code,
            qr_payload,
            vendor_company:   guest.vendor_company ?? null,
            vendor_role:      guest.vendor_role ?? null,
            valid_from:       guest.valid_from ?? null,
            special_note:     guest.special_note ?? null,
            max_uses:         participant_type === 'general' ? 1 : 999,
            status:           'generated',
          })
          .select('id, numeric_code, qr_payload')
          .single()

        if (insertError) throw insertError

        // Update guests.access_code for backward compat with GuestManagementSection
        await db.from('guests').update({ access_code: numeric_code }).eq('id', guest.id)

        generated.push({ guest_id: guest.id, guest_name: guest.name, numeric_code, participant_type })

      } catch (guestErr) {
        console.error(`[access-codes/generate] Failed for guest ${guest.name}:`, guestErr)
        errors.push({ guest_id: guest.id, guest_name: guest.name })
      }
    }

    return NextResponse.json({
      ok:        true,
      generated: generated.length,
      errors:    errors.length,
      codes:     generated,
    })

  } catch (e) {
    console.error('[access-codes/generate]', e)
    return NextResponse.json({ error: 'Code generation failed' }, { status: 500 })
  }
}
