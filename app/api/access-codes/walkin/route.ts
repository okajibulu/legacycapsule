// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/walkin/route.ts
// PURPOSE: Register a walk-in guest in real time on event day.
//          Generates a unique code immediately. Used when an unregistered
//          guest arrives at the venue and needs to be admitted.
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
// SECTION 2 — POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, guest_name, participant_type, section_id } = await req.json()

    if (!capsule_id || !guest_name) {
      return NextResponse.json(
        { error: 'capsule_id and guest_name required' },
        { status: 400 }
      )
    }

    // ── Generate unique numeric code per capsule ──────────────────────────────
    let numeric_code = ''
    for (let i = 0; i < 20; i++) {
      const candidate = String(Math.floor(100000 + Math.random() * 900000))
      const { data: existing } = await db
        .from('event_access_codes')
        .select('id')
        .eq('capsule_id', capsule_id)
        .eq('numeric_code', candidate)
        .maybeSingle()
      if (!existing) { numeric_code = candidate; break }
    }

    if (!numeric_code) {
      return NextResponse.json(
        { error: 'Could not generate unique code — please retry' },
        { status: 500 }
      )
    }

    // ── Generate QR payload ───────────────────────────────────────────────────
    const secret    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback'
    const raw       = `${capsule_id}:${numeric_code}`
    const hash      = crypto.createHmac('sha256', secret).update(raw).digest('hex').slice(0, 16)
    const qr_payload = `LC:${capsule_id.slice(0, 8)}:${numeric_code}:${hash}`

    // ── Insert code record ────────────────────────────────────────────────────
    const { data: code, error } = await db
      .from('event_access_codes')
      .insert({
        capsule_id,
        guest_name:       guest_name.trim(),
        participant_type: participant_type ?? 'general',
        section_id:       section_id ?? null,
        numeric_code,
        qr_payload,
        max_uses:         1,
        status:           'generated',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, code })

  } catch (e) {
    console.error('[access-codes/walkin]', e)
    return NextResponse.json({ error: 'Walk-in registration failed' }, { status: 500 })
  }
}
