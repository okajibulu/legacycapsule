// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/verify/route.ts
// PURPOSE:   Validates email + password for FR Full Access and Co-admin accounts.
//            On success: creates a 30-day session cookie scoped to /manage/[slug].
//            Session token stored as SHA-256 hash in capsule_accounts.invite_token
//            (prefixed 'session:') — same pattern as familyRepAuth.ts for FR Elder.
//            Returns account type, name, and granted permissions (for co-admin).
//            Never returns the password hash.
// ARCHITECTURE: CA-SPEC-001 — Step 15a.
//               bcryptjs for password comparison.
//               Cookie: httpOnly, SameSite=Strict, path-scoped to /manage/[slug].
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.15
// DATE:      16 August 2026
//
// POST body: { email, password, capsule_slug }
// Returns:   { ok, account_type, name, permissions: string[] }
// Sets:      lc_mgr_[slug] session cookie
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { createHash }                from 'crypto'
import bcrypt                        from 'bcryptjs'
import { cookies }                   from 'next/headers'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Constants ═══

const SESSION_MAX_AGE = 60 * 60 * 24 * 30  // 30 days

const cookieName      = (slug: string) => `lc_mgr_${slug}`

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function generateSessionToken(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}-${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
    .digest('hex')
}

// ═══ SECTION 3 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { email, password, capsule_slug } = await req.json()

    // ── Validation ────────────────────────────────────────────────────────
    if (!email?.trim() || !password || !capsule_slug) {
      return NextResponse.json(
        { error: 'Email, password and capsule are required.' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ─────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, slug, honouree_name')
      .eq('slug', capsule_slug)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json(
        { error: 'Capsule not found.' },
        { status: 404 }
      )
    }

    // ── Find account by email ─────────────────────────────────────────────
    // Only FR Full Access and Co-admin use password auth
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, name, email, account_type, password_hash, is_active')
      .eq('capsule_id', capsule.id)
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .in('account_type', ['family_rep_full_access', 'coadmin'])
      .maybeSingle()

    // ── Deliberate constant-time failure — never reveal if email exists ────
    if (!account || !account.password_hash) {
      // Still run bcrypt compare to prevent timing attacks
      await bcrypt.compare(password, '$2a$10$invalidhashpaddingtomaintaintiming000000000000000000000')
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    // ── Verify password ───────────────────────────────────────────────────
    const passwordValid = await bcrypt.compare(password, account.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    // ── Fetch permissions (co-admin only) ─────────────────────────────────
    let permissions: string[] = []
    if (account.account_type === 'coadmin') {
      const { data: permRows } = await db
        .from('capsule_account_permissions')
        .select('permission_key')
        .eq('account_id', account.id)
      permissions = (permRows ?? []).map(r => r.permission_key)
    }

    // ── Create session ────────────────────────────────────────────────────
    const sessionToken = generateSessionToken()
    const sessionHash  = sha256(sessionToken)
    const now          = new Date().toISOString()

    await db
      .from('capsule_accounts')
      .update({
        invite_token:   `session:${sessionHash}`,
        last_active_at: now,
      })
      .eq('id', account.id)

    // ── Set session cookie ────────────────────────────────────────────────
    const cookieStore = await cookies()
    cookieStore.set(cookieName(capsule_slug), sessionToken, {
      httpOnly: true,
      sameSite: 'strict',
      path:     `/manage/${capsule_slug}`,
      maxAge:   SESSION_MAX_AGE,
      secure:   process.env.NODE_ENV === 'production',
    })

    return NextResponse.json({
      ok:           true,
      account_type: account.account_type,
      name:         account.name,
      permissions,
    })

  } catch (err) {
    console.error('[team/verify]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}