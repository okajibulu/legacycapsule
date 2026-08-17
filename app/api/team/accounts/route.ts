// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/accounts/route.ts
// PURPOSE:   Returns capsule_accounts records filtered by capsule_id and type.
//            Used by FamilyRepFullAccessPanel, FamilyRepElderSection, and
//            future CoadminList components to fetch their account lists.
//            Never returns password_hash — excluded from select.
// ARCHITECTURE: CA-SPEC-001 — Step 9.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// GET ?capsule_id=[id]&type=[account_type]
// Returns: { accounts: CapsuleAccount[] }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function GET(req: NextRequest) {
  try {
    const capsule_id   = req.nextUrl.searchParams.get('capsule_id')
    const account_type = req.nextUrl.searchParams.get('type')

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id is required.' }, { status: 400 })
    }

    // ── Build query ───────────────────────────────────────────────────────
    // Never select password_hash — security boundary
    let query = db
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, name, email, invite_sent_at, invite_used_at, last_active_at, is_active, created_by, created_at')
      .eq('capsule_id', capsule_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (account_type) {
      query = query.eq('account_type', account_type)
    }

    const { data, error } = await query

    if (error) {
      console.error('[team/accounts] Query error:', error)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ accounts: data ?? [] })

  } catch (err) {
    console.error('[team/accounts]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}