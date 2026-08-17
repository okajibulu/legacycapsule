// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/upgrade/route.ts
// PURPOSE:   Upgrades the organiser account to Family Rep Full Access.
//            One-way, irreversible. Requires capsule_id and a new password.
//            Creates a new capsule_accounts record of type family_rep_full_access
//            using the organiser's existing email.
//            Sets organiser_upgraded_to_full_access = true on the capsule.
//            Logs to capsule_activity_log.
//            Billing anchor (organiser_email on capsules) is never changed.
// ARCHITECTURE: CA-SPEC-001 — Step 9.
//               bcryptjs for password hashing (10 rounds).
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: { capsule_id, password }
// Auth:      Organiser session (organiser_email must match capsule.organiser_email)
//            Validated via X-Organiser-Email header set by manage dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, password } = await req.json()

    // ── Validation ────────────────────────────────────────────────────────
    if (!capsule_id || !password) {
      return NextResponse.json(
        { error: 'capsule_id and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ─────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, slug, organiser_email, honouree_name, organiser_upgraded_to_full_access')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Already upgraded guard ─────────────────────────────────────────────
    if (capsule.organiser_upgraded_to_full_access) {
      return NextResponse.json(
        { error: 'This account has already been upgraded to Family Rep Full Access.' },
        { status: 409 }
      )
    }

    // ── Check no existing FRFA account (belt + suspenders) ────────────────
    const { data: existingFRFA } = await db
      .from('capsule_accounts')
      .select('id')
      .eq('capsule_id', capsule_id)
      .eq('account_type', 'family_rep_full_access')
      .eq('is_active', true)
      .maybeSingle()

    if (existingFRFA) {
      return NextResponse.json(
        { error: 'A Family Rep Full Access account already exists for this capsule.' },
        { status: 409 }
      )
    }

    // ── Hash password ──────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10)
    const now          = new Date().toISOString()

    // ── Create FRFA account using organiser's email ────────────────────────
    const { data: newAccount, error: insertError } = await db
      .from('capsule_accounts')
      .insert({
        capsule_id,
        account_type:   'family_rep_full_access',
        name:           'Organiser (upgraded)',
        email:          capsule.organiser_email,
        password_hash:  passwordHash,
        invite_token:   null,
        invite_used_at: now,
        invite_sent_at: now,
        is_active:      true,
        created_by:     'organiser_self_upgrade',
        last_active_at: now,
      })
      .select('id')
      .single()

    if (insertError || !newAccount) {
      console.error('[team/upgrade] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── Mark capsule as upgraded ───────────────────────────────────────────
    // Billing anchor (organiser_email) is never changed.
    const { error: capsuleUpdateError } = await db
      .from('capsules')
      .update({
        organiser_upgraded_to_full_access: true,
        organiser_upgraded_at:             now,
      })
      .eq('id', capsule_id)

    if (capsuleUpdateError) {
      console.error('[team/upgrade] Capsule update error:', capsuleUpdateError)
      // Non-fatal — account created, flag not set. Log and continue.
    }

    // ── Log action ─────────────────────────────────────────────────────────
    await logAction({
      capsule_id,
      actor_type:   'organiser',
      actor_id:     'organiser',
      actor_name:   'Organiser',
      actor_email:  capsule.organiser_email,
      action_key:   ACTION_KEYS.TEAM_ORGANISER_UPGRADED,
      action_label: `Organiser upgraded their account to Family Rep Full Access`,
      entity_type:  'capsule_account',
      entity_id:    newAccount.id,
      payload:      { email: capsule.organiser_email, irreversible: true },
    })

    return NextResponse.json({
      ok:          true,
      redirect_url: `/manage/${capsule.slug}?upgraded=1`,
    })

  } catch (err) {
    console.error('[team/upgrade]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}