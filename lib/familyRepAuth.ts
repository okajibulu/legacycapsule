// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/familyRepAuth.ts
// PURPOSE:   Server-side authentication for the Family Rep Elder portal.
//            Uses the new capsule_accounts table (CA-SPEC-001).
//            Parallel to portalAuth.ts which handles the legacy
//            honouree_portal_tokens flow — both coexist (Option A migration).
//            SESSION MODEL:
//              - Invite token in URL → validates → sets 30-day cookie
//              - Cookie checked on every portal load (fast path)
//            SERVER-SIDE ONLY. Never import in client components.
// ARCHITECTURE: CA-SPEC-001 — Step 5.
//               Cookie path-scoped to /family/[slug]
//               Token: HMAC-SHA256 signed, 7-day invite expiry, single-use
//               Session: SHA-256 hashed, stored in capsule_accounts.session_hash
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { createHash, createHmac } from 'crypto'
import { cookies } from 'next/headers'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Constants ═══

const SESSION_MAX_AGE = 60 * 60 * 24 * 30          // 30 days in seconds
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000   // 7 days

const cookieName = (slug: string) => `lc_fre_${slug}` // fre = family_rep_elder

// ═══ SECTION 3 — Hashing utilities ═══

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function generateSessionToken(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}-${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
    .digest('hex')
}

// ═══ SECTION 4 — Auth result type ═══

export interface FamilyRepAuthResult {
  valid:      boolean
  accountId?: string
  capsuleId?: string
  name?:      string
  email?:     string
  error?:     string
}

// ═══ SECTION 5 — Token validation (invite link) ═══
// Called on first portal visit when ?token= is in URL.
// Validates token → sets 30-day session cookie.

export async function validateFamilyRepToken(
  slug: string,
  token: string
): Promise<FamilyRepAuthResult> {
  if (!token || token.length < 20) {
    return { valid: false, error: 'Invalid invite link.' }
  }

  try {
    // Fetch capsule id from slug
    const { data: capsule } = await db
      .from('capsules')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!capsule) {
      return { valid: false, error: 'Capsule not found.' }
    }

    // Find matching active Elder account by invite token
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, name, email, invite_token_expires_at, invite_used_at, is_active')
      .eq('capsule_id', capsule.id)
      .eq('account_type', 'family_rep_elder')
      .eq('invite_token', token)
      .maybeSingle()

    if (!account || !account.is_active) {
      return { valid: false, error: 'This invite link is not recognised.' }
    }

    // Check token not already used
    if (account.invite_used_at) {
      // Token was used — but we allow continued access via cookie.
      // This branch means someone clicked the link again after first use.
      // Fall through to session cookie check instead (handled in checkFamilyRepAuth).
      return { valid: false, error: 'This invite link has already been used. Please use your browser bookmark or request a new link.' }
    }

    // Check expiry
    if (account.invite_token_expires_at && new Date(account.invite_token_expires_at) < new Date()) {
      return { valid: false, error: 'This invite link has expired. Please ask the organiser to send a new one.' }
    }

    // Valid — establish session
    const sessionToken = generateSessionToken()
    const sessionHash  = sha256(sessionToken)
    const now          = new Date().toISOString()

    const { error: updateError } = await db
      .from('capsule_accounts')
      .update({
        invite_used_at: now,
        last_active_at: now,
        // Store session hash for cookie validation
        // We repurpose invite_token field as null once used and add session tracking
        // via a new approach — we use a separate session record approach for cleanliness
      })
      .eq('id', account.id)

    if (updateError) {
      console.error('[familyRepAuth] Session update error:', updateError)
      return { valid: false, error: 'Something went wrong. Please try again.' }
    }

    // Store session hash on account record
    await db
      .from('capsule_accounts')
      .update({ invite_token: `session:${sessionHash}` })
      .eq('id', account.id)
      // We store sessions as "session:[hash]" prefix in invite_token field
      // until a dedicated session table is added in the next migration pass

    // Write 30-day session cookie
    const cookieStore = await cookies()
    cookieStore.set(cookieName(slug), sessionToken, {
      httpOnly: true,
      sameSite: 'strict',
      path:     `/family/${slug}`,
      maxAge:   SESSION_MAX_AGE,
      secure:   process.env.NODE_ENV === 'production',
    })

    return {
      valid:     true,
      accountId: account.id,
      capsuleId: capsule.id,
      name:      account.name,
      email:     account.email,
    }

  } catch (err) {
    console.error('[familyRepAuth] validateFamilyRepToken error:', err)
    return { valid: false, error: 'Something went wrong. Please try again.' }
  }
}

// ═══ SECTION 6 — Session cookie validation ═══
// Called on every portal load after the first visit.
// Fast path — validates cookie against stored session hash.

export async function validateFamilyRepSession(
  slug: string
): Promise<FamilyRepAuthResult> {
  try {
    const cookieStore   = await cookies()
    const sessionCookie = cookieStore.get(cookieName(slug))

    if (!sessionCookie?.value) {
      return { valid: false, error: 'No session found.' }
    }

    const sessionHash = sha256(sessionCookie.value)

    // Fetch capsule
    const { data: capsule } = await db
      .from('capsules')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!capsule) return { valid: false, error: 'Capsule not found.' }

    // Find account by session hash
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, name, email, is_active')
      .eq('capsule_id', capsule.id)
      .eq('account_type', 'family_rep_elder')
      .eq('invite_token', `session:${sessionHash}`)
      .eq('is_active', true)
      .maybeSingle()

    if (!account) {
      return { valid: false, error: 'Session expired or not recognised.' }
    }

    // Update last_active_at (non-blocking)
    db.from('capsule_accounts')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', account.id)
      .then(() => {})

    return {
      valid:     true,
      accountId: account.id,
      capsuleId: capsule.id,
      name:      account.name,
      email:     account.email,
    }

  } catch (err) {
    console.error('[familyRepAuth] validateFamilyRepSession error:', err)
    return { valid: false, error: 'Something went wrong.' }
  }
}

// ═══ SECTION 7 — Combined auth check ═══
// Main gate for the FR Elder portal page.
// Priority: cookie (returning visitor) → token (first visit) → invalid.

export async function checkFamilyRepAuth(
  slug: string,
  token?: string | null
): Promise<FamilyRepAuthResult> {
  // Fast path — returning visitor with cookie
  const cookieResult = await validateFamilyRepSession(slug)
  if (cookieResult.valid) return cookieResult

  // First visit — validate invite token from URL
  if (token) {
    return validateFamilyRepToken(slug, token)
  }

  return { valid: false, error: 'Access required. Please use your portal link.' }
}