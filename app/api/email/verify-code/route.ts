/* =========================================================
   FILE PATH: app/api/email/verify-code/route.ts — v4
   Uses email_verifications table — purpose built.

   Columns used:
   - email         → organiser email
   - token         → capsule slug (reference)
   - type          → 'booking_verification'
   - record_id     → capsule id
   - verification_code → the 4-char code
   - expires_at    → 30 min from generation
   - verified_at   → set on successful validation

   Charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
   Excludes I, O, 0, 1 — no visual confusion.

   POST — generate, store, send verification code email
   PUT  — validate, mark verified, send welcome email

   Welcome email variants (v4):
   - free path     → "Your capsule is ready"
   - book path     → "Your capsule is reserved"
   - gift path     → handled by gift-notification route

   UPDATED: Claude Sonnet 4.6 · July 2026
   - Welcome email now path-aware (free vs pre-booked)
   - Pre-booked capsule email reflects reserved state
   - Free capsule email reflects pending-until-first-tribute state
   - Hardcoded itslegacycapsule.com replaced with APP_URL env var
========================================================= */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = 'LegacyCapsule <noreply@itslegacycapsule.com>'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

/* =========================================================
   POST — Generate, store, send verification code
========================================================= */
export async function POST(request: NextRequest) {
  try {
    const { capsuleId, capsuleSlug, organiserEmail, honoureeName } = await request.json()

    if (!capsuleId || !organiserEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const code      = generateCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Delete any existing unverified codes for this capsule first
    await supabase
      .from('email_verifications')
      .delete()
      .eq('record_id', capsuleId)
      .eq('type', 'booking_verification')
      .is('verified_at', null)

    // Insert fresh code
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        email:             organiserEmail.trim().toLowerCase(),
        token:             capsuleSlug ?? capsuleId,
        type:              'booking_verification',
        record_id:         capsuleId,
        verification_code: code,
        expires_at:        expiresAt,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to store code' }, { status: 500 })
    }

    // Send verification code email
    await resend.emails.send({
      from:    FROM,
      to:      organiserEmail,
      subject: `Your verification code: ${code}`,
      html:    verificationEmailHtml({ code, honoureeName, capsuleSlug }),
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Verify code POST error:', error)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}

/* =========================================================
   PUT — Validate submitted code, send welcome email
========================================================= */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { capsuleId, code, path } = body
    // path: 'free' | 'book' | 'gift'

    if (!capsuleId || !code) {
      return NextResponse.json({ valid: false, error: 'Missing fields' }, { status: 400 })
    }

    // ── Validate code ─────────────────────────────────────────────────────────
    const { data: verification } = await supabase
      .from('email_verifications')
      .select('id, email, expires_at, verified_at')
      .eq('record_id', capsuleId)
      .eq('type', 'booking_verification')
      .eq('verification_code', code.toUpperCase().trim())
      .is('verified_at', null)
      .single()

    if (!verification) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired code' })
    }

    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Code has expired. Please request a new one.' })
    }

    // ── Mark verified ─────────────────────────────────────────────────────────
    await supabase
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    await supabase
      .from('capsules')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', capsuleId)

    // ── Silent account creation block (unchanged) ─────────────────────────────
    try {
      const orgEmail = verification.email
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const authUser = { user: users.find(u => u.email === orgEmail) ?? null }
      const { data: capsuleForAuth } = await supabase
        .from('capsules')
        .select('id')
        .eq('id', capsuleId)
        .single()

      let userId: string | null = null

      if (!authUser?.user) {
        const { data: newUser } = await supabase.auth.admin.createUser({
          email:             orgEmail,
          email_confirm:     true,
          user_metadata:     { role: 'organiser' },
        })
        if (newUser?.user) userId = newUser.user.id
        else {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', orgEmail)
            .single()
          if (existing) userId = existing.id
        }
      } else if (authUser?.user) {
        userId = authUser.user.id
      }

      if (userId && capsuleForAuth) {
        await supabase.from('profiles').upsert(
          { id: userId, email: orgEmail, role: 'organiser' },
          { onConflict: 'id' }
        )
        await supabase.from('capsule_access').upsert(
          { capsule_id: capsuleForAuth.id, user_id: userId, role: 'owner', permissions: '["all"]' },
          { onConflict: 'capsule_id,user_id' }
        )
      }
    } catch (accountError) {
      console.error('Silent account creation error:', accountError)
    }

    // ── Welcome email — path-aware ────────────────────────────────────────────
    // Gift path: welcome email sent by gift-notification route, not here
    if (path !== 'gift') {
const { data: capsule } = await supabase
        .from('capsules')
        .select('slug, honouree_name, organiser_email, event_type')
        .eq('id', capsuleId)
        .single()

      if (capsule?.organiser_email) {
        const isBooked     = path === 'book'
        const capsuleUrl   = `${APP_URL}/for/${capsule.slug}`
        const manageUrl    = `${APP_URL}/manage/${capsule.slug}`
        const signinUrl    = `${APP_URL}/signin`

        await resend.emails.send({
          from:    FROM,
          to:      capsule.organiser_email,
          subject: isBooked
            ? `Your LegacyCapsule for ${capsule.honouree_name} is reserved`
            : `Your LegacyCapsule for ${capsule.honouree_name} is ready`,
          html: welcomeEmailHtml({
            honoureeName: capsule.honouree_name,
            capsuleUrl,
            manageUrl,
            signinUrl,
            isBooked,
          }),
        })
      }
    }

    // Seed story prompts -- non-blocking, fires for all paths including gift
    // event_type fetched separately to ensure it's always available
    fetch(`${APP_URL}/api/capsule/seed-prompts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ capsule_id: capsuleId }),
    }).catch(() => {}) // silent -- never block verification flow

    // Seed story prompts non-blocking -- event_type fetched by route if needed
    fetch(`${APP_URL}/api/capsule/seed-prompts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ capsule_id: capsuleId }),
    }).catch(() => {})

    return NextResponse.json({ valid: true })

  } catch (error) {
    console.error('Verify code PUT error:', error)
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 })
  }
}

/* =========================================================
   SECTION — Verification code email template
   Sent immediately when code is requested.
   Same for all paths — just confirms email ownership.
========================================================= */
function verificationEmailHtml(d: {
  code:          string
  honoureeName?: string
  capsuleSlug?:  string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.16em;color:#E2C36B;">LEGACY</span>
          <span style="font-size:11px;font-weight:800;letter-spacing:0.16em;color:rgba(255,255,255,0.3);">CAPSULE</span>
        </td></tr>

        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:16px;overflow:hidden;">
          <div style="height:2px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.6),transparent);"></div>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 28px;">

            <tr><td style="text-align:center;padding-bottom:24px;">
              <p style="margin:0 0 10px;font-size:32px;line-height:1;">✉</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">
                Verify your email
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.65;">
                Enter this code to continue setting up your capsule for<br/>
                <strong style="color:rgba(255,255,255,0.85);">${d.honoureeName ?? 'your event'}</strong>
              </p>
            </td></tr>

            <tr><td style="padding-bottom:24px;">
              <div style="text-align:center;padding:28px 24px;background:rgba(226,195,107,0.07);border:1px solid rgba(226,195,107,0.25);border-radius:12px;">
                <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(226,195,107,0.55);">
                  Your verification code
                </p>
                <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:0.5em;color:#E2C36B;font-family:'Courier New',monospace;text-shadow:0 0 24px rgba(226,195,107,0.5);">
                  ${d.code}
                </p>
                <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.25);">
                  Valid for 30 minutes
                </p>
              </div>
            </td></tr>

            <tr><td style="padding-bottom:20px;">
              <div style="padding:16px;background:rgba(226,195,107,0.04);border:1px solid rgba(226,195,107,0.12);border-radius:10px;">
                <p style="margin:0;font-size:12px;color:rgba(226,195,107,0.6);line-height:1.8;">
                  ✦ At the close of your event, LegacyCapsule compiles every tribute,
                  photo and voice into a beautifully designed digital publication — sent to every
                  person who contributed, wherever they are. A permanent record of a moment that mattered.
                </p>
              </div>
            </td></tr>

            <tr><td style="text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.65;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td></tr>

          </table>
        </td></tr>

        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.08em;text-transform:uppercase;">
            LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* =========================================================
   SECTION — Welcome email template
   Sent after successful verification.
   Two variants: free (pending) and pre-booked (reserved).
========================================================= */
function welcomeEmailHtml(d: {
  honoureeName: string
  capsuleUrl:   string
  manageUrl:    string
  signinUrl:    string
  isBooked:     boolean
}) {
  const heading = d.isBooked
    ? `Your capsule for <span style="color:#E2C36B;">${d.honoureeName}</span> is reserved`
    : `Your capsule for <span style="color:#E2C36B;">${d.honoureeName}</span> is ready`

  const subheading = d.isBooked
    ? `Your capsule and selected services have been reserved. When you are ready to begin collecting tributes, share your link and the capsule will come to life with the first voice that arrives.`
    : `Your capsule is set up and waiting. Share your tribute wall link with family and friends — the capsule comes to life when the first tribute arrives.`

  const nextSteps = d.isBooked ? [
    'Your selected services are ready and waiting.',
    'Share your tribute wall link whenever you are ready to begin.',
    'Your capsule goes live when the first tribute arrives.',
    'Approve tributes, manage content and track participation from your dashboard.',
  ] : [
    'Share your tribute wall link with family and friends.',
    'Your capsule goes live when the first tribute arrives.',
    'Approve tributes and manage your capsule from your dashboard.',
    'At the close of your event, generate a beautifully compiled publication for everyone who contributed.',
  ]

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;color:#E2C36B;">LEGACY</span>
          <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;color:rgba(255,255,255,0.28);">CAPSULE</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.15);border-radius:18px;overflow:hidden;">
          <div style="height:2px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.6),transparent);"></div>

          <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 32px;">

            <!-- Heading -->
            <tr><td style="text-align:center;padding-bottom:24px;">
              <p style="margin:0 0 12px;font-size:28px;line-height:1;">${d.isBooked ? '◈' : '✦'}</p>
              <h1 style="margin:0;font-size:23px;font-weight:700;color:#ffffff;font-family:Georgia,serif;line-height:1.35;">
                ${heading}
              </h1>
              <p style="margin:14px 0 0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.75;max-width:380px;margin-left:auto;margin-right:auto;">
                ${subheading}
              </p>
            </td></tr>

            <!-- Divider -->
            <tr><td style="padding-bottom:24px;">
              <div style="height:1px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.2),transparent);"></div>
            </td></tr>

            <!-- Tribute wall link -->
            <tr><td style="padding-bottom:20px;">
              <p style="margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(226,195,107,0.5);">
                Your Tribute Wall
              </p>
              <p style="margin:0 0 10px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.65;">
                ${d.isBooked
                  ? 'Share this link when you are ready. Tributes will begin arriving as soon as you do.'
                  : 'Share this link with everyone who should be part of this story.'}
              </p>
              <a href="${d.capsuleUrl}" style="display:block;padding:12px 16px;border-radius:10px;background:rgba(226,195,107,0.07);border:1px solid rgba(226,195,107,0.2);color:#E2C36B;font-size:13px;font-weight:600;text-decoration:none;word-break:break-all;">
                ${d.capsuleUrl}
              </a>
            </td></tr>

            <!-- Dashboard CTA -->
            <tr><td style="padding-bottom:24px;">
              <p style="margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(226,195,107,0.5);">
                Your Dashboard
              </p>
              <p style="margin:0 0 12px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.65;">
                Approve tributes, manage content and monitor your capsule. Bookmark this link.
              </p>
              <a href="${d.manageUrl}" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
                Open Dashboard →
              </a>
            </td></tr>

            <!-- Next steps -->
            <tr><td style="padding-bottom:20px;">
              <div style="padding:18px 20px;border-radius:12px;background:rgba(226,195,107,0.04);border:1px solid rgba(226,195,107,0.1);">
                <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(226,195,107,0.5);">
                  What happens next
                </p>
                ${nextSteps.map(step =>
                  `<p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;">✦ ${step}</p>`
                ).join('')}
              </div>
            </td></tr>

            <!-- Sign in note -->
            <tr><td>
              <div style="padding:14px 16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.7;">
                  You can sign in to your dashboard anytime at
                  <a href="${d.signinUrl}" style="color:rgba(226,195,107,0.55);text-decoration:none;"> itslegacycapsule.com/signin</a>
                  using this email address.
                </p>
              </div>
            </td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0 0 6px;font-style:italic;font-size:12px;color:rgba(255,255,255,0.2);font-family:Georgia,serif;">
            "Events end. Legacies don't."
          </p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.1);letter-spacing:0.1em;text-transform:uppercase;">
            LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
