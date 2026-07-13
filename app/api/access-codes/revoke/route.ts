// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/revoke/route.ts
// PURPOSE: Revoke a specific access code. Revoked codes cannot be scanned.
//          Permanently marks the code as invalid without deleting the record.
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
// SECTION 2 — POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { access_code_id } = await req.json()

    if (!access_code_id) {
      return NextResponse.json({ error: 'access_code_id required' }, { status: 400 })
    }

    await db
      .from('event_access_codes')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', access_code_id)

    return NextResponse.json({ ok: true })

  } catch (e) {
    console.error('[access-codes/revoke]', e)
    return NextResponse.json({ error: 'Revoke failed' }, { status: 500 })
  }
}
