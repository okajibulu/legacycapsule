/* =========================================================
   app/api/auth/signin/route.ts
   Generates a 4-char sign-in code and sends via Resend.
   Stores in email_verifications table (type: 'signin').
========================================================= */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  return code
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email?.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

    const normalised = email.trim().toLowerCase()
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Delete any existing unverified signin codes for this email
    await supabase.from('email_verifications').delete()
      .eq('email', normalised).eq('type', 'signin').is('verified_at', null)

    // Insert fresh code
    const { error: insertError } = await supabase.from('email_verifications').insert({
      email: normalised,
      token: code,
      type: 'signin',
      record_id: normalised, // use email as record_id for signin
      verification_code: code,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
    }

    // Send email
    await resend.emails.send({
      from: 'LegacyCapsule <noreply@itslegacycapsule.com>',
      to: email,
      subject: `Your sign-in code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

                <tr><td style="padding-bottom:24px;text-align:center;">
                  <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;color:#E2C36B;">LEGACY</span>
                  <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;color:rgba(255,255,255,0.28);">CAPSULE</span>
                </td></tr>

                <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.15);border-radius:18px;overflow:hidden;">
                  <div style="height:2px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.6),transparent);"></div>
                  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 28px;">

                    <tr><td style="text-align:center;padding-bottom:24px;">
                      <p style="margin:0 0 12px;font-size:28px;">◈</p>
                      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;font-family:Georgia,serif;">Your sign-in code</h1>
                      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.50);">Enter this in the browser window where you requested it</p>
                    </td></tr>

                    <tr><td style="padding-bottom:24px;">
                      <div style="text-align:center;padding:28px;background:rgba(226,195,107,0.07);border:1px solid rgba(226,195,107,0.25);border-radius:12px;">
                        <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(226,195,107,0.55);">Sign-in code</p>
                        <p style="margin:0;font-size:52px;font-weight:800;letter-spacing:0.5em;color:#E2C36B;font-family:'Courier New',monospace;text-shadow:0 0 28px rgba(226,195,107,0.4);">${code}</p>
                        <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.25);">Expires in 15 minutes</p>
                      </div>
                    </td></tr>

                    <tr><td style="text-align:center;">
                      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.20);line-height:1.65;">
                        If you didn't request this, you can safely ignore this email.<br/>
                        Do not share this code with anyone.
                      </p>
                    </td></tr>

                  </table>
                </td></tr>

                <tr><td style="padding-top:24px;text-align:center;">
                  <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.1em;text-transform:uppercase;">
                    LEGACYCAPSULE · EVENTS END. LEGACIES CONTINUE.
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
    console.error('Signin route error:', error)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
