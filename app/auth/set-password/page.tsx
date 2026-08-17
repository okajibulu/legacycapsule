// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/auth/set-password/page.tsx
// PURPOSE:   Password creation page for Family Rep Full Access and Co-admin
//            accounts. Reached via invite link in email.
//            Token validated server-side. Password submitted to
//            /api/team/set-password which hashes and stores it.
//            After password set: redirected to their portal.
//            Single-use — token invalidated on first use.
//            ECS: warm, plain English. Never mentions "hash", "token", "auth".
// ARCHITECTURE: CA-SPEC-001 — Step 8.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { redirect }     from 'next/navigation'
import SetPasswordClient from './SetPasswordClient'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Server component — validates token before rendering ═══

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string; slug?: string }>
}) {
  const { token, type, slug } = await searchParams

  // ── Missing params ────────────────────────────────────────────────────
  if (!token || !type || !slug) {
    redirect('/signin?error=invalid_link')
  }

  // ── Validate token — find matching active account ─────────────────────
  const { data: account } = await db
    .from('capsule_accounts')
    .select('id, name, email, account_type, invite_used_at, invite_token_expires_at, is_active, capsule_id')
    .eq('invite_token', token)
    .eq('account_type', type)
    .eq('is_active', true)
    .maybeSingle()

  if (!account) {
    redirect('/signin?error=invalid_link')
  }

  // ── Already used ──────────────────────────────────────────────────────
  if (account.invite_used_at) {
    redirect('/signin?error=link_used')
  }

  // ── Expired ───────────────────────────────────────────────────────────
  if (account.invite_token_expires_at && new Date(account.invite_token_expires_at) < new Date()) {
    redirect('/signin?error=link_expired')
  }

  // ── Fetch capsule for honouree name ───────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('honouree_name, slug')
    .eq('id', account.capsule_id)
    .maybeSingle()

  return (
    <SetPasswordClient
      token={token}
      accountType={type as 'family_rep_full_access' | 'coadmin'}
      capsuleSlug={slug}
      honoureeName={capsule?.honouree_name ?? 'this capsule'}
      accountName={account.name}
      accountEmail={account.email}
    />
  )
}
