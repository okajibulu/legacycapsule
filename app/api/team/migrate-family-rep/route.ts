// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/migrate-family-rep/route.ts
// PURPOSE:   Silent Option A migration — converts existing family_rep_email
//            on the capsule record into a capsule_accounts Family Rep Elder
//            account. Called on first load of the Team tab if family_rep_email
//            exists but no corresponding Elder account exists yet.
//            Idempotent — safe to call multiple times, only creates once.
//            Does NOT invalidate the old /for/[slug]/honouree portal.
//            Old portal continues working (Phase 2 retirement).
// ARCHITECTURE: CA-SPEC-001 — Step 15b consolidation.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.15
// DATE:      16 August 2026
//
// POST body: { capsule_id, capsule_slug }
// Returns:   { ok: true, migrated: boolean }
//            migrated: true  = new Elder account created
//            migrated: false = already existed or nothing to migrate
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, capsule_slug } = await req.json()

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id is required.' }, { status: 400 })
    }

    // ── Fetch capsule — check for legacy family_rep_email ─────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, family_rep_email, family_rep_name')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Nothing to migrate — no legacy family rep ─────────────────────────
    if (!capsule.family_rep_email?.trim()) {
      return NextResponse.json({ ok: true, migrated: false })
    }

    // ── Check if Elder account already exists for this email ──────────────
    const { data: existing } = await db
      .from('capsule_accounts')
      .select('id')
      .eq('capsule_id', capsule_id)
      .eq('account_type', 'family_rep_elder')
      .eq('email', capsule.family_rep_email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      // Already migrated — idempotent
      return NextResponse.json({ ok: true, migrated: false })
    }

    // ── Create Elder account from legacy data ─────────────────────────────
    // No invite token — they already have portal access via old flow.
    // invite_used_at set to now so the account shows as "Active" not "Pending".
    const now = new Date().toISOString()

    const { error: insertError } = await db
      .from('capsule_accounts')
      .insert({
        capsule_id,
        account_type:   'family_rep_elder',
        name:           capsule.family_rep_name?.trim() || 'Family Representative',
        email:          capsule.family_rep_email.toLowerCase().trim(),
        invite_token:   null,
        invite_used_at: now,   // mark as active — they already had access
        invite_sent_at: now,
        is_active:      true,
        created_by:     'system_migration',
      })

    if (insertError) {
      // Unique constraint — already exists (race condition) — not an error
      if (insertError.code === '23505') {
        return NextResponse.json({ ok: true, migrated: false })
      }
      console.error('[migrate-family-rep] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Migration failed. Please try again.' },
        { status: 500 }
      )
    }

    console.log(`[migrate-family-rep] Migrated ${capsule.family_rep_email} → capsule_accounts Elder for capsule ${capsule_id}`)

    return NextResponse.json({ ok: true, migrated: true })

  } catch (err) {
    console.error('[migrate-family-rep]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}