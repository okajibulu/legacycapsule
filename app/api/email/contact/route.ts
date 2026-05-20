/* =========================================================
   app/api/email/contact/route.ts
   Receives upgrade enquiry and capsule expansion requests
   from the organiser dashboard. Sends to LC team via Resend.

   POST body:
   {
     name: string
     email: string
     message: string
     capsule: string        — honouree name
     subject?: string       — optional override
   }
========================================================= */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const TEAM_EMAIL = 'hello@itslegacycapsule.com'
const FROM = 'noreply@itslegacycapsule.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, capsule, subject } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const emailSubject = subject ?? `Capsule enquiry from ${name}`

    // Email to the LC team
    await resend.emails.send({
      from: `LegacyCapsule <${FROM}>`,
      to: TEAM_EMAIL,
      replyTo: email.trim(),
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                  <!-- Header -->
                  <tr>
                    <td style="padding-bottom:24px;">
                      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.16em;color:#E2C36B;">
                        LEGACY<span style="color:rgba(255,255,255,0.35);">CAPSULE</span>
                      </p>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:16px;overflow:hidden;">

                      <!-- Gold top rule -->
                      <div style="height:2px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.6),transparent);"></div>

                      <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 28px 24px;">

                        <!-- Subject line -->
                        <tr>
                          <td style="padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">
                              ${emailSubject}
                            </p>
                          </td>
                        </tr>

                        <!-- Sender details -->
                        <tr>
                          <td style="padding-top:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom:8px;">
                                  <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(226,195,107,0.55);">From</p>
                                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#ffffff;">${name.trim()}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:8px;">
                                  <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(226,195,107,0.55);">Email</p>
                                  <p style="margin:4px 0 0;font-size:14px;color:rgba(226,195,107,0.8);">
                                    <a href="mailto:${email.trim()}" style="color:rgba(226,195,107,0.8);text-decoration:none;">${email.trim()}</a>
                                  </p>
                                </td>
                              </tr>
                              ${capsule ? `
                              <tr>
                                <td>
                                  <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(226,195,107,0.55);">Capsule</p>
                                  <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">${capsule}</p>
                                </td>
                              </tr>` : ''}
                            </table>
                          </td>
                        </tr>

                        <!-- Message -->
                        <tr>
                          <td style="padding-top:20px;">
                            <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(226,195,107,0.55);">Message</p>
                            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.75;white-space:pre-wrap;">${message.trim()}</p>
                          </td>
                        </tr>

                        <!-- Reply CTA -->
                        <tr>
                          <td style="padding-top:24px;">
                            <a
                              href="mailto:${email.trim()}?subject=Re: ${encodeURIComponent(emailSubject)}"
                              style="display:inline-block;padding:10px 24px;border-radius:8px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.04em;"
                            >
                              Reply to ${name.trim()}
                            </a>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding-top:24px;text-align:center;">
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:0.08em;">
                        LEGACYCAPSULE · REVOWORLDTECH · VALNEX
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    // Auto-reply to the organiser — warm acknowledgement
    await resend.emails.send({
      from: `LegacyCapsule <${FROM}>`,
      to: email.trim(),
      subject: 'We received your message',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                  <!-- Header -->
                  <tr>
                    <td style="padding-bottom:24px;">
                      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.16em;color:#E2C36B;">
                        LEGACY<span style="color:rgba(255,255,255,0.35);">CAPSULE</span>
                      </p>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:16px;overflow:hidden;">
                      <div style="height:2px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.6),transparent);"></div>

                      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 28px;">
                        <tr>
                          <td style="padding-bottom:20px;text-align:center;">
                            <p style="margin:0;font-size:28px;line-height:1;">✦</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:16px;">
                            <p style="margin:0;font-size:20px;font-weight:700;color:#E2C36B;font-family:Georgia,serif;text-align:center;">
                              Thank you, ${name.trim()}.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:24px;text-align:center;">
                            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.75;">
                              We have received your message and will be in touch within 24 hours.
                              ${capsule ? `<br/>Your capsule for <strong style="color:rgba(255,255,255,0.85);">${capsule}</strong> is live and collecting tributes.` : ''}
                            </p>
                          </td>
                        </tr>

                        <!-- Divider -->
                        <tr>
                          <td style="padding-bottom:24px;">
                            <div style="height:1px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.25),transparent);"></div>
                          </td>
                        </tr>

                        <!-- Message echo -->
                        <tr>
                          <td style="padding-bottom:8px;">
                            <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(226,195,107,0.45);">Your message</p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;font-style:italic;white-space:pre-wrap;">"${message.trim()}"</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding-top:24px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.15);letter-spacing:0.08em;">
                        LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
                      </p>
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.1);">
                        itslegacycapsule.com
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Contact email error:', error)
    // Return success anyway — don't alarm the user over email failures
    return NextResponse.json({ success: true })
  }
}
