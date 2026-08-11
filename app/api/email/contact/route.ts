// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/email/contact/route.ts
// PURPOSE:   Receives upgrade enquiries and capsule expansion requests from the
//            organiser dashboard. Sends to LC team via Resend, then sends a
//            warm acknowledgement back to the organiser.
// ARCHITECTURE: Internal tool — not contributor-facing.
//               Team email: internal briefing format.
//               Organiser auto-reply: ECS-compliant warm acknowledgement.
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.91
// DATE:      11 August 2026
// POST body: { name, email, message, capsule, subject? }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// ═══ SECTION 1 — Config ═══

const resend = new Resend(process.env.RESEND_API_KEY)
const TEAM_EMAIL = 'hello@itslegacycapsule.com'
const FROM       = 'noreply@itslegacycapsule.com'

// ═══ SECTION 2 — Route handler ═══

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, capsule, subject } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email and message are required.' },
        { status: 400 }
      )
    }

    const emailSubject = subject ?? `Capsule enquiry from ${name}`

    // ── Team email — internal briefing format ─────────────────────────────
    // Dark template, internal tool. Not ECS contributor-facing.
    await resend.emails.send({
      from:    `LegacyCapsule <${FROM}>`,
      to:      TEAM_EMAIL,
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
              <div style="height:2px;background:linear-gradient(to right,transparent,rgba(226,195,107,0.6),transparent);"></div>
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 28px 24px;">

                <!-- Subject -->
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
                    <a href="mailto:${email.trim()}?subject=Re: ${encodeURIComponent(emailSubject)}"
                      style="display:inline-block;padding:10px 24px;border-radius:8px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
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
                LEGACYCAPSULE &middot; REVOWORLDTECH &middot; VALNEX
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })

    // ── Organiser auto-reply — ECS-compliant warm acknowledgement ─────────
    // ECS pillars: Belonging, Weight, Craftsmanship.
    // Previous version was administrative. Rewritten to honour the organiser's intent.
    await resend.emails.send({
      from:    `LegacyCapsule <${FROM}>`,
      to:      email.trim(),
      subject: `We heard you — ${capsule ? `regarding ${capsule}` : 'your message is with us'}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0820;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Brand mark -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:11px;color:rgba(212,174,42,0.6);letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">
                LegacyCapsule
              </p>
              <p style="margin:5px 0 0;font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:0.12em;">
                itslegacycapsule.com
              </p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#F5F3EE;border-radius:16px;border-top:4px solid #D4AE2A;padding:44px 40px;">

              <!-- Ornament -->
              <p style="margin:0 0 24px;text-align:center;font-size:28px;color:#D4AE2A;">✦</p>

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:13px;color:#6b6b80;text-align:center;">
                Dear ${name.trim()},
              </p>

              <!-- Heading -->
              <h1 style="margin:0 0 20px;font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;line-height:1.35;">
                Your message has arrived.
              </h1>

              <!-- Body -->
              <p style="margin:0 0 24px;font-size:14px;color:#4a4a5e;text-align:center;line-height:1.8;">
                ${capsule
                  ? `We will be in touch about <strong>${capsule}</strong> shortly — usually within a few hours. Every capsule matters to us, and so does the occasion behind it.`
                  : `We will be in touch shortly — usually within a few hours. Every occasion matters to us, and we want to make sure we give your question the attention it deserves.`
                }
              </p>

              <!-- Gold divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 24px;"></div>

              <!-- Message echo -->
              <div style="background-color:#FFFFFF;border-radius:10px;border-left:3px solid #D4AE2A;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;color:#9090a0;text-transform:uppercase;letter-spacing:0.12em;">
                  Your message
                </p>
                <p style="margin:0;font-size:13px;color:#4a4a5e;line-height:1.75;font-style:italic;white-space:pre-wrap;">&ldquo;${message.trim()}&rdquo;</p>
              </div>

              <!-- Soft divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.2),transparent);margin:0 0 22px;"></div>

              <!-- Permanence close — ECS: close with belonging, never with support offer -->
              <p style="margin:0;font-size:13px;color:#5a5a70;text-align:center;line-height:1.8;font-style:italic;">
                Every legacy we help build starts with someone who cared enough to reach out.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.12em;text-transform:uppercase;">
                VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
              </p>
              <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.25);">
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
      `.trim(),
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    // Log for team visibility — do not surface raw error to organiser
    console.error('[contact] Email error:', error)
    // Return success — contact form failures should not alarm the organiser
    // who has no way to retry. Team monitors logs.
    return NextResponse.json({ success: true })
  }
}