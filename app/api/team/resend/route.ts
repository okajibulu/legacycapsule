// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/resend/route.ts
// PURPOSE:   Resends an invite email for a capsule_accounts record.
//            Generates a fresh invite token (invalidates old one).
//            Works for all account types: family_rep_elder,
//            family_rep_full_access, coadmin.
//            Existing /api/rep/resend is UNTOUCHED (Option A migration).
// ARCHITECTURE: CA-SPEC-001 — Step 5.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: { account_id }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'
import crypto                        from 'crypto'

// ═══ SECTION 1 — Clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { account_id } = await req.json()

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required.' }, { status: 400 })
    }

    // ── Fetch account + capsule ───────────────────────────────────────────
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, name, email, is_active')
      .eq('id', account_id)
      .maybeSingle()

    if (!account || !account.is_active) {
      return NextResponse.json({ error: 'Account not found or inactive.' }, { status: 404 })
    }

    const { data: capsule } = await db
      .from('capsules')
      .select('slug, honouree_name')
      .eq('id', account.capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Generate fresh token ──────────────────────────────────────────────
    const newToken      = crypto.randomBytes(32).toString('hex')
    const tokenExpires  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await db
      .from('capsule_accounts')
      .update({
        invite_token:            newToken,
        invite_token_expires_at: tokenExpires,
        invite_used_at:          null,         // reset used flag so new link works
        invite_sent_at:          new Date().toISOString(),
      })
      .eq('id', account_id)

    if (updateError) {
      console.error('[team/resend] Token update error:', updateError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── Build portal URL ───────────────────────────────────────────────────
    const portalUrl = account.account_type === 'family_rep_elder'
      ? `${APP_URL}/family/${capsule.slug}/${newToken}`
      : `${APP_URL}/auth/set-password?token=${newToken}&type=${account.account_type}&slug=${capsule.slug}`

    // ── Send email ─────────────────────────────────────────────────────────
    const firstName = account.name.split(' ')[0]

    const { error: emailError } = await resend.emails.send({
      from:    'LegacyCapsule <noreply@itslegacycapsule.com>',
      to:      account.email,
      subject: `Your updated portal access — ${capsule.honouree_name}'s LegacyCapsule`,
      html: `
<div style="background:#0D0820;padding:40px 20px;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:16px;overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></div>
    <div style="padding:32px;">
      <p style="color:#E2C36B;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">LegacyCapsule</p>
      <h2 style="color:#F5F3EE;font-family:Georgia,serif;font-size:20px;margin:0 0 16px;">A fresh access link, ${firstName}</h2>
      <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.7;margin:0 0 24px;">
        Here is your updated access link for <strong style="color:rgba(255,255,255,0.85);">${capsule.honouree_name}</strong>'s LegacyCapsule. Your previous link is no longer active.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${portalUrl}" style="display:inline-block;padding:13px 36px;border-radius:10px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.7));color:#0D0820;font-size:14px;font-weight:700;text-decoration:none;">
          Open My Portal &rarr;
        </a>
      </div>
      <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin:0;">This link is private. Please do not share it. Valid for 7 days.</p>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></div>
    <div style="padding:12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;margin:0;">VALNEX, UNIPESSOAL LDA · RevoWorldTech · itslegacycapsule.com</p>
    </div>
  </div>
</div>`,
    })

    if (emailError) {
      console.error('[team/resend] Email error:', emailError)
      return NextResponse.json(
        { error: 'Token updated but email failed to send. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[team/resend]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}