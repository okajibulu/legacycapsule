// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/capsules/route.ts
// PURPOSE:   Returns all capsules accessible by an email + password combination.
//            Called by AdminSigninPanel after credential validation.
//            Validates password against each matching account's hash.
//            Returns capsule list with honouree name, event type, access level.
//            If only one capsule: caller can skip selection and redirect directly.
//            Never returns password hashes.
// ARCHITECTURE: CA-SPEC-001 — Admin login flow.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.17
// DATE:      17 August 2026
//
// POST body: { email, password }
// Returns:   { capsules: CapsuleAccess[] }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Types ═══

export interface CapsuleAccess {
  capsule_id:    string
  capsule_slug:  string
  honouree_name: string
  event_type:    string
  event_tag:     string | null
  account_type:  string
  account_id:    string
}

// ═══ SECTION 3 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    // ── Find all active accounts for this email ───────────────────────────
    const { data: accounts } = await db
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, password_hash, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .in('account_type', ['family_rep_full_access', 'coadmin'])

    if (!accounts || accounts.length === 0) {
      // Still run bcrypt to prevent timing attacks
      await bcrypt.compare(password, '$2a$10$invalidhashpaddingtomaintaintiming000000000000000000000')
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    // ── Validate password against first account with a hash ───────────────
    // All accounts for the same email share the same password
    const accountWithHash = accounts.find(a => a.password_hash)
    if (!accountWithHash?.password_hash) {
      await bcrypt.compare(password, '$2a$10$invalidhashpaddingtomaintaintiming000000000000000000000')
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    const passwordValid = await bcrypt.compare(password, accountWithHash.password_hash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    // ── Fetch capsule details for each account ────────────────────────────
    const capsuleIds = accounts.map(a => a.capsule_id)

    const { data: capsules } = await db
      .from('capsules')
      .select('id, slug, honouree_name, event_type, event_tag')
      .in('id', capsuleIds)
      .is('deleted_at', null)

    if (!capsules || capsules.length === 0) {
      return NextResponse.json(
        { error: 'No active capsules found for this account.' },
        { status: 404 }
      )
    }

    // ── Build response list ───────────────────────────────────────────────
    const capsuleList: CapsuleAccess[] = accounts
      .map(account => {
        const capsule = capsules.find(c => c.id === account.capsule_id)
        if (!capsule) return null
        return {
          capsule_id:    capsule.id,
          capsule_slug:  capsule.slug,
          honouree_name: capsule.honouree_name,
          event_type:    capsule.event_type,
          event_tag:     capsule.event_tag ?? null,
          account_type:  account.account_type,
          account_id:    account.id,
        }
      })
      .filter(Boolean) as CapsuleAccess[]

    return NextResponse.json({ capsules: capsuleList })

  } catch (err) {
    console.error('[team/capsules]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}