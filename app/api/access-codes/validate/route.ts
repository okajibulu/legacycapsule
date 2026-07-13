// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/validate/route.ts
// PURPOSE: Validate a scanned or typed access code.
//          THE most critical route in the access code system.
//          Must be fast (<200ms), reliable, handle all edge cases.
//          Writes every attempt (valid or invalid) to event_checkin_log.
//          Step 4 of LC-ACCESS-001 build sequence.
// SPEC: Section 5.1 — Full specification implemented exactly.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Client
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Participant type display labels
// ─────────────────────────────────────────────────────────────────────────────

const TIER_DISPLAY: Record<string, string> = {
  vvip:           'VVIP',
  vip:            'VIP',
  general:        'General',
  reception_only: 'Reception Guest',
  staff:          'Staff',
  media:          'Media',
  vendor:         'Vendor',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Route handler
// Implements all 9 steps from Section 5.1 exactly.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { code, capsule_id, usher_session_id } = await req.json()

    if (!code || !capsule_id) {
      return NextResponse.json({ outcome: 'invalid', message: 'Code and capsule_id required' }, { status: 400 })
    }

    const device_info = req.headers.get('user-agent')?.slice(0, 100) ?? null
    const now = new Date()

    // ── Step 1: Look up code by numeric_code OR qr_payload ──────────────────
    const { data: accessCode } = await db
      .from('event_access_codes')
      .select(`
        id, capsule_id, guest_id, participant_type, guest_name, guest_email,
        section_id, numeric_code, valid_from, valid_until, max_uses, use_count,
        status, special_note, vendor_company, vendor_role,
        event_sections ( name )
      `)
      .eq('capsule_id', capsule_id)
      .or(`numeric_code.eq.${code.trim()},qr_payload.eq.${code.trim()}`)
      .maybeSingle()

    // ── Step 2: Not found → log + return invalid ─────────────────────────────
    if (!accessCode) {
      await db.from('event_checkin_log').insert({
        capsule_id,
        scanned_code:     code.trim(),
        outcome:          'invalid',
        checked_in_at:    now.toISOString(),
        usher_session_id: usher_session_id ?? null,
        device_info,
      })
      return NextResponse.json({ outcome: 'invalid', message: 'Code not recognised' })
    }

    const sectionName = (accessCode.event_sections as any)?.name ?? null

    // ── Step 3: valid_from in the future → not_yet_valid ────────────────────
    if (accessCode.valid_from && new Date(accessCode.valid_from) > now) {
      await db.from('event_checkin_log').insert({
        capsule_id,
        access_code_id:   accessCode.id,
        scanned_code:     code.trim(),
        outcome:          'not_yet_valid',
        guest_name:       accessCode.guest_name,
        participant_type: accessCode.participant_type,
        section_name:     sectionName,
        checked_in_at:    now.toISOString(),
        usher_session_id: usher_session_id ?? null,
        device_info,
      })
      return NextResponse.json({
        outcome:    'not_yet_valid',
        guest_name: accessCode.guest_name,
        valid_from: accessCode.valid_from,
        message:    `Entry valid from ${new Date(accessCode.valid_from).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      })
    }

    // ── Step 4: status = revoked or expired → invalid ────────────────────────
    if (accessCode.status === 'revoked' || accessCode.status === 'expired') {
      await db.from('event_checkin_log').insert({
        capsule_id,
        access_code_id:   accessCode.id,
        scanned_code:     code.trim(),
        outcome:          accessCode.status,
        guest_name:       accessCode.guest_name,
        participant_type: accessCode.participant_type,
        section_name:     sectionName,
        checked_in_at:    now.toISOString(),
        usher_session_id: usher_session_id ?? null,
        device_info,
      })
      return NextResponse.json({ outcome: 'invalid', message: 'This code is no longer valid' })
    }

    // ── Step 5: use_count >= max_uses → already_used ────────────────────────
    if (accessCode.use_count >= accessCode.max_uses) {
      // Fetch first check-in time from log
      const { data: firstEntry } = await db
        .from('event_checkin_log')
        .select('checked_in_at')
        .eq('access_code_id', accessCode.id)
        .eq('outcome', 'admitted')
        .order('checked_in_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      await db.from('event_checkin_log').insert({
        capsule_id,
        access_code_id:   accessCode.id,
        scanned_code:     code.trim(),
        outcome:          'already_used',
        guest_name:       accessCode.guest_name,
        participant_type: accessCode.participant_type,
        section_name:     sectionName,
        checked_in_at:    now.toISOString(),
        usher_session_id: usher_session_id ?? null,
        device_info,
      })

      return NextResponse.json({
        outcome:          'already_used',
        guest_name:       accessCode.guest_name,
        participant_type: accessCode.participant_type,
        first_checkin_at: firstEntry?.checked_in_at ?? null,
      })
    }

    // ── Step 6: Increment use_count, update status if max reached ───────────
    const newUseCount = accessCode.use_count + 1
    const newStatus   = newUseCount >= accessCode.max_uses ? 'used' : 'delivered'

    await db
      .from('event_access_codes')
      .update({ use_count: newUseCount, status: newStatus, updated_at: now.toISOString() })
      .eq('id', accessCode.id)

    // ── Step 7: Insert admitted row into event_checkin_log ──────────────────
    const { data: checkinRow } = await db
      .from('event_checkin_log')
      .insert({
        capsule_id,
        access_code_id:   accessCode.id,
        scanned_code:     code.trim(),
        outcome:          'admitted',
        guest_name:       accessCode.guest_name,
        participant_type: accessCode.participant_type,
        section_name:     sectionName,
        checked_in_at:    now.toISOString(),
        usher_session_id: usher_session_id ?? null,
        device_info,
      })
      .select('id')
      .single()

    // ── Step 8: Update guests.checked_in_at if guest_id is set ──────────────
    if (accessCode.guest_id) {
      await db
        .from('guests')
        .update({ checked_in_at: now.toISOString() })
        .eq('id', accessCode.guest_id)
    }

    // ── Step 9: Return admitted with full guest context ──────────────────────
    return NextResponse.json({
      outcome:          'admitted',
      guest_name:       accessCode.guest_name,
      participant_type: accessCode.participant_type,
      tier_display:     TIER_DISPLAY[accessCode.participant_type] ?? accessCode.participant_type,
      section_name:     sectionName,
      special_note:     accessCode.special_note ?? null,
      vendor_company:   accessCode.vendor_company ?? null,
      vendor_role:      accessCode.vendor_role ?? null,
      is_vvip:          accessCode.participant_type === 'vvip',
      use_count:        newUseCount,
      checkin_id:       checkinRow?.id ?? null,
    })

  } catch (e) {
    console.error('[access-codes/validate]', e)
    return NextResponse.json({ outcome: 'invalid', message: 'Validation error — please retry' }, { status: 500 })
  }
}
