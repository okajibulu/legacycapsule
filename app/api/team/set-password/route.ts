// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/set-password/route.ts
// PURPOSE:   Consumes an invite token, validates it, hashes the password
//            with bcrypt (10 rounds), stores the hash, and marks the invite
//            as used. Single-use — token invalidated immediately on success.
//            After this call, the account holder can log in with their email
//            and new password via /api/team/verify.
//            SERVER-SIDE ONLY. Never returns the hash to the client.
// ARCHITECTURE: CA-SPEC-001 — Step 8.
//               bcryptjs — installed as dependency.
//               Invite token stored in capsule_accounts.invite_token.
//               Session storage: invite_token prefixed with 'session:' on login.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: { token, password, account_type }
// Returns:   { ok: true, redirect_url }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { token, password, account_type } = await req.json()

    // ── Validation ────────────────────────────────────────────────────────
    if (!token || !password || !account_type) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    if (!['family_rep_full_access', 'coadmin'].includes(account_type)) {
      return NextResponse.json(
        { error: 'Invalid account type.' },
        { status: 400 }
      )
    }

    // ── Find matching active account ──────────────────────────────────────
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, invite_used_at, invite_token_expires_at, is_active, email')
      .eq('invite_token', token)
      .eq('account_type', account_type)
      .eq('is_active', true)
      .maybeSingle()

    if (!account) {
      return NextResponse.json(
        { error: 'This invite link is not recognised. Please request a new one from the organiser.' },
        { status: 404 }
      )
    }

    // ── Single-use guard ──────────────────────────────────────────────────
    if (account.invite_used_at) {
      return NextResponse.json(
        { error: 'This invite link has already been used. Please sign in with your email and password.' },
        { status: 409 }
      )
    }

    // ── Expiry guard ──────────────────────────────────────────────────────
    if (account.invite_token_expires_at && new Date(account.invite_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired. Please ask the organiser to send a new one.' },
        { status: 410 }
      )
    }

    // ── Hash password — bcrypt, 10 rounds ─────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10)

    // ── Update account — store hash, mark invite used ─────────────────────
    const now = new Date().toISOString()

    const { error: updateError } = await db
      .from('capsule_accounts')
      .update({
        password_hash:  passwordHash,
        invite_used_at: now,
        invite_token:   null,   // clear invite token — it is spent
        last_active_at: now,
      })
      .eq('id', account.id)

    if (updateError) {
      console.error('[team/set-password] Update error:', updateError)
      return NextResponse.json(
        { error: 'Something went wrong setting up your access. Please try again.' },
        { status: 500 }
      )
    }

    // ── Fetch capsule slug for redirect URL ───────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('slug')
      .eq('id', account.capsule_id)
      .maybeSingle()

    const slug = capsule?.slug ?? ''

    const redirectUrl = account_type === 'family_rep_full_access'
      ? `${APP_URL}/manage/${slug}?welcome=1`
      : `${APP_URL}/manage/${slug}/coadmin?welcome=1`

    return NextResponse.json({ ok: true, redirect_url: redirectUrl })

  } catch (err) {
    console.error('[team/set-password]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}