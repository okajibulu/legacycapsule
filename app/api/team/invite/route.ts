// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/invite/route.ts
// PURPOSE:   Creates a capsule_accounts record and sends an invite email.
//            Handles account_type: family_rep_elder (magic link invite).
//            Handles account_type: family_rep_full_access (password invite).
//            Handles account_type: coadmin (password invite + permissions).
//            For FR Elder: generates a magic link token, stores in capsule_accounts,
//            sends ECS-compliant email.
//            Existing /api/rep/invite route is UNTOUCHED (Option A migration).
// ARCHITECTURE: CA-SPEC-001 — Step 5.
//               capsule_accounts table (AI21 migration).
//               Logs to capsule_activity_log via logAction.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: {
//   capsule_id, capsule_slug, account_type, name, email,
//   permissions?: string[]   (co-admin only)
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'
import crypto                        from 'crypto'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — Clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Token generation ═══

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ═══ SECTION 3 — Email builders ═══

function buildElderInviteEmail(params: {
  repName:      string
  honoureeName: string
  portalUrl:    string
}): string {
  const { repName, honoureeName, portalUrl } = params
  const firstName = repName.split(' ')[0]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Family Portal Access — ${honoureeName}</title>
</head>
<body style="margin:0;padding:0;background:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Brand -->
        <tr><td align="center" style="padding-bottom:36px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
        </td></tr>

        <!-- Gold ornament -->
        <tr><td align="center" style="padding-bottom:20px;">
          <p style="margin:0;font-size:28px;color:#D4AE2A;">&#10022;</p>
        </td></tr>

        <!-- Headline -->
        <tr><td align="center" style="padding-bottom:32px;">
          <h1 style="margin:0 0 10px;font-family:Georgia,'Playfair Display',serif;font-size:24px;font-weight:700;color:#F5F3EE;line-height:1.35;">
            Your family portal is ready, ${firstName}.
          </h1>
          <p style="margin:0;font-size:14px;color:rgba(226,195,107,0.75);font-style:italic;">
            A private space to read every tribute and acknowledgement for ${honoureeName}.
          </p>
        </td></tr>

        <!-- Card -->
        <tr><td style="padding:3px;border-radius:18px;background:linear-gradient(135deg,#D4AE2A,#B8960C,#D4AE2A);">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:16px;overflow:hidden;">
            <tr><td style="height:4px;background:linear-gradient(90deg,#2D1B69,#D4AE2A,#2D1B69);font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:32px 36px 36px;">

              <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:15px;color:#1a1a2e;">
                Dear ${repName},
              </p>

              <p style="margin:0 0 16px;font-size:14px;color:#4a4a5e;line-height:1.85;">
                You have been given Family Representative access to
                <strong style="color:#1a1a2e;">${honoureeName}</strong>'s LegacyCapsule.
                Your private portal gives you a dedicated view of every tribute, story,
                and acknowledgement received on behalf of the family — and lets you
                respond personally to those who reached out.
              </p>

              <p style="margin:0 0 24px;font-size:14px;color:#4a4a5e;line-height:1.85;">
                This link is yours alone. Please do not share it.
              </p>

              <!-- Gold rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 24px;"></div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${portalUrl}"
                   style="display:inline-block;padding:14px 40px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.05em;">
                  Open My Portal &rarr;
                </a>
              </div>

              <!-- What you can access -->
              <div style="background:rgba(45,27,105,0.06);border-radius:10px;padding:16px 18px;margin-bottom:20px;">
                <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(45,27,105,0.5);">What you can access</p>
                <p style="margin:0 0 7px;font-size:13px;color:#4a4a5e;">&#10022;&nbsp;&nbsp;All tributes and voices for ${honoureeName}</p>
                <p style="margin:0 0 7px;font-size:13px;color:#4a4a5e;">&#10022;&nbsp;&nbsp;Community stories and memories</p>
                <p style="margin:0 0 7px;font-size:13px;color:#4a4a5e;">&#10022;&nbsp;&nbsp;Ways to Honour acknowledgements</p>
                <p style="margin:0;font-size:13px;color:#4a4a5e;">&#10022;&nbsp;&nbsp;Respond personally on behalf of the family</p>
              </div>

              <!-- Bottom rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 18px;"></div>

              <p style="margin:0;font-size:12px;color:#9090a0;text-align:center;line-height:1.7;">
                Your access link is active for 30 days on this device.<br/>
                If you lose access, the organiser can send a new link at any time.
              </p>

            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.1em;text-transform:uppercase;">
            VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
          </p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.08);">itslegacycapsule.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ═══ SECTION 4 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id,
      capsule_slug,
      account_type,
      name,
      email,
      permissions = [],
      created_by = 'organiser',
      actor_name,
      actor_email,
    } = body

    // ── Validation ────────────────────────────────────────────────────────
    if (!capsule_id || !capsule_slug || !account_type || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    if (!['family_rep_elder', 'family_rep_full_access', 'coadmin'].includes(account_type)) {
      return NextResponse.json({ error: 'Invalid account type.' }, { status: 400 })
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    // ── Check capsule exists ──────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, honouree_name, event_type')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Check for existing active account with same email + type ──────────
    const { data: existing } = await db
      .from('capsule_accounts')
      .select('id, is_active')
      .eq('capsule_id', capsule_id)
      .eq('account_type', account_type)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing?.is_active) {
      return NextResponse.json(
        { error: 'An account with this email already exists for this capsule.' },
        { status: 409 }
      )
    }

    // ── Generate invite token ──────────────────────────────────────────────
    const inviteToken   = generateInviteToken()
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // ── Build portal URL ───────────────────────────────────────────────────
    // FR Elder: magic link → /family/[slug]/[token]
    // FR Full Access + Co-admin: password set → /auth/set-password?token=
    const portalUrl = account_type === 'family_rep_elder'
      ? `${APP_URL}/family/${capsule_slug}/${inviteToken}`
      : `${APP_URL}/auth/set-password?token=${inviteToken}&type=${account_type}&slug=${capsule_slug}`

    // ── Create capsule_accounts record ────────────────────────────────────
    const { data: newAccount, error: insertError } = await db
      .from('capsule_accounts')
      .insert({
        capsule_id,
        account_type,
        name:                    name.trim(),
        email:                   email.toLowerCase().trim(),
        invite_token:            inviteToken,
        invite_token_expires_at: tokenExpiresAt,
        invite_sent_at:          new Date().toISOString(),
        is_active:               true,
        created_by,
      })
      .select('id')
      .single()

    if (insertError || !newAccount) {
      console.error('[team/invite] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Something went wrong creating the account. Please try again.' },
        { status: 500 }
      )
    }

    // ── Insert permissions for co-admin ───────────────────────────────────
    if (account_type === 'coadmin' && permissions.length > 0) {
      const permRows = permissions.map((key: string) => ({
        account_id:     newAccount.id,
        capsule_id,
        permission_key: key,
        granted_by:     created_by,
      }))

      const { error: permError } = await db
        .from('capsule_account_permissions')
        .insert(permRows)

      if (permError) {
        console.error('[team/invite] Permission insert error:', permError)
        // Non-fatal — account created, permissions failed. Log and continue.
      }
    }

    // ── Send invite email ─────────────────────────────────────────────────
    let emailSubject = ''
    let emailHtml    = ''

    if (account_type === 'family_rep_elder') {
      emailSubject = `Your family portal access — ${capsule.honouree_name}'s LegacyCapsule`
      emailHtml    = buildElderInviteEmail({
        repName:      name.trim(),
        honoureeName: capsule.honouree_name,
        portalUrl,
      })
    } else {
      // FR Full Access and Co-admin — password invite (placeholder until SetPasswordPage built in Step 8)
      emailSubject = `You've been invited to manage ${capsule.honouree_name}'s LegacyCapsule`
      emailHtml    = `<p style="font-family:Arial,sans-serif;font-size:14px;">Hi ${name.trim()},<br/><br/>
        You have been invited to access <strong>${capsule.honouree_name}</strong>'s LegacyCapsule.<br/><br/>
        <a href="${portalUrl}" style="color:#D4AE2A;">Set up your access &rarr;</a><br/><br/>
        This link expires in 7 days.<br/><br/>
        LegacyCapsule · RevoWorldTech</p>`
    }

    const { error: emailError } = await resend.emails.send({
      from:    'LegacyCapsule <noreply@itslegacycapsule.com>',
      to:      email.toLowerCase().trim(),
      subject: emailSubject,
      html:    emailHtml,
    })

    if (emailError) {
      console.error('[team/invite] Email send error:', emailError)
      // Account created but email failed — return error so organiser can resend
      return NextResponse.json(
        { error: 'Account created but we could not send the invite email. Please try resending.' },
        { status: 500 }
      )
    }

    // ── Log action ─────────────────────────────────────────────────────────
    const actionKeyMap: Record<string, string> = {
      family_rep_elder:      ACTION_KEYS.TEAM_ELDER_INVITED,
      family_rep_full_access: ACTION_KEYS.TEAM_FULL_ACCESS_INVITED,
      coadmin:               ACTION_KEYS.TEAM_COADMIN_INVITED,
    }
    const actionLabelMap: Record<string, string> = {
      family_rep_elder:      `Invited ${name.trim()} as Family Rep`,
      family_rep_full_access: `Invited ${name.trim()} as Family Rep Full Access`,
      coadmin:               `Invited ${name.trim()} as Co-admin`,
    }

    await logAction({
      capsule_id,
      actor_type:   created_by === 'organiser' ? 'organiser' : 'family_rep_full_access',
      actor_name:   actor_name  ?? 'Organiser',
      actor_email:  actor_email ?? '',
      action_key:   actionKeyMap[account_type],
      action_label: actionLabelMap[account_type],
      entity_type:  'capsule_account',
      entity_id:    newAccount.id,
      payload:      { account_type, email: email.toLowerCase().trim(), name: name.trim() },
    })

    return NextResponse.json({ ok: true, account_id: newAccount.id })

  } catch (err) {
    console.error('[team/invite]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}