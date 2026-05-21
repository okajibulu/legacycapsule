/* =========================================================
   app/api/email/verify-code/route.ts — v3
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

   POST — generate, store, send email
   PUT  — validate, mark verified
========================================================= */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'noreply@itslegacycapsule.com'
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

/* =========================================================
   POST — Generate, store, send
========================================================= */
export async function POST(request: NextRequest) {
  try {
    const { capsuleId, capsuleSlug, organiserEmail, honoureeName } = await request.json()

    if (!capsuleId || !organiserEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const code = generateCode()
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
        email: organiserEmail.trim().toLowerCase(),
        token: capsuleSlug ?? capsuleId,
        type: 'booking_verification',
        record_id: capsuleId,
        verification_code: code,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to store code' }, { status: 500 })
    }

    // Send email
    await resend.emails.send({
      from: `LegacyCapsule <${FROM}>`,
      to: organiserEmail,
      subject: `Your verification code: ${code}`,
      html: `
        <!DOCTYPE html>
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
                        Enter this code to open your capsule for<br/>
                        <strong style="color:rgba(255,255,255,0.85);">${honoureeName ?? 'your event'}</strong>
                      </p>
                    </td></tr>

                    <tr><td style="padding-bottom:24px;">
                      <div style="text-align:center;padding:28px 24px;background:rgba(226,195,107,0.07);border:1px solid rgba(226,195,107,0.25);border-radius:12px;">
                        <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(226,195,107,0.55);">
                          Your verification code
                        </p>
                        <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:0.5em;color:#E2C36B;font-family:'Courier New',monospace;text-shadow:0 0 24px rgba(226,195,107,0.5);">
                          ${code}
                        </p>
                        <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.25);">
                          Valid for 30 minutes
                        </p>
                      </div>
                    </td></tr>

                    <tr><td style="padding-bottom:20px;">
                      <div style="padding:16px;background:rgba(226,195,107,0.04);border:1px solid rgba(226,195,107,0.12);border-radius:10px;">
                        <p style="margin:0;font-size:12px;color:rgba(226,195,107,0.6);line-height:1.8;">
                          ✦ At the close of your event, LegacyCapsule automatically compiles every tribute,
                          photo, and voice from your wall into a beautifully designed digital publication,
                          complete with the Capsule Profile you have built. The platform can be triggered to
                          send it to every person who contributed, wherever they are. No designer. No effort.
                          Just a permanent, shareable record of a moment that mattered.
                        </p>
                      </div>
                    </td></tr>

                    <tr><td style="text-align:center;">
                      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.65;">
                        If you did not request this, you can safely ignore this email.<br/>
                        itslegacycapsule.com/for/${capsuleSlug ?? ''}
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
        </html>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Verify code POST error:', error)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}

/* =========================================================
   PUT — Validate submitted code
========================================================= */
export async function PUT(request: NextRequest) {
  try {
    const { capsuleId, code } = await request.json()

    if (!capsuleId || !code) {
      return NextResponse.json({ valid: false, error: 'Missing fields' }, { status: 400 })
    }

    // Fetch most recent unverified code for this capsule
    const { data, error } = await supabase
      .from('email_verifications')
      .select('id, verification_code, expires_at')
      .eq('record_id', capsuleId)
      .eq('type', 'booking_verification')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'No code found' })
    }

    // Check expiry
    if (new Date() > new Date(data.expires_at)) {
      await supabase.from('email_verifications').delete().eq('id', data.id)
      return NextResponse.json({ valid: false, error: 'Code has expired' })
    }

    // Validate — case insensitive
    if (code.trim().toUpperCase() !== data.verification_code?.toUpperCase()) {
      return NextResponse.json({ valid: false })
    }

    // Mark as verified
    await supabase
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', data.id)

    // Mark capsule as verified
    await supabase
      .from('capsules')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', capsuleId)

    return NextResponse.json({ valid: true })

  } catch (error) {
    console.error('Verify code PUT error:', error)
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 })
  }
}
