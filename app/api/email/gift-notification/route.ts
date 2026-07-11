// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/email/gift-notification/route.ts
// PURPOSE: Sends capsule access email to the gift recipient after payment.
//          Called by Stripe webhook after checkout.session.completed
//          when book_mode === 'gift'.
// ARCHITECTURE: LC04 Payment Engine · LC05 Engagement Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Clients
// ─────────────────────────────────────────────────────────────────────────────

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { recipient_email, capsule_slug, capsule_id } = await req.json()

    if (!recipient_email || !capsule_slug) {
      return NextResponse.json({ error: 'recipient_email and capsule_slug required' }, { status: 400 })
    }

    // ── Fetch capsule details ─────────────────────────────────────────────────
    const { data: capsule } = await adminClient
      .from('capsules')
      .select('honouree_name, event_type, event_tag, organiser_email')
      .eq('id', capsule_id)
      .single()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    const capsuleUrl = `${APP_URL}/for/${capsule_slug}`
    const manageUrl = `${APP_URL}/manage/${capsule_slug}`
    const occasion = capsule.event_tag ?? capsule.event_type ?? 'a special occasion'

    // ── Send gift notification email ──────────────────────────────────────────
    await resend.emails.send({
      from: 'LegacyCapsule <memories@itslegacycapsule.com>',
      to: recipient_email,
      subject: `A LegacyCapsule has been created in honour of ${capsule.honouree_name}`,
      html: giftNotificationHtml({
        honoureeName: capsule.honouree_name,
        occasion,
        capsuleUrl,
        manageUrl,
        capsuleSlug: capsule_slug,
      }),
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[gift-notification]', err)
    return NextResponse.json({ error: 'Failed to send gift notification' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Gift notification email template
// Premium, personal, never transactional in tone.
// The recipient has received something meaningful — the email should feel that way.
// ─────────────────────────────────────────────────────────────────────────────

function giftNotificationHtml(d: {
  honoureeName: string
  occasion: string
  capsuleUrl: string
  manageUrl: string
  capsuleSlug: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A LegacyCapsule has been prepared for you</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <!-- Gold top rule -->
          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:44px 44px 8px;text-align:center;">
              <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">LEGACYCAPSULE</p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;">A gift has arrived</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

          <!-- Main message -->
          <tr>
            <td style="padding:32px 44px 28px;text-align:center;">
              <h1 style="margin:0 0 16px;font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">
                A capsule has been prepared<br/>in honour of <span style="color:#E2C36B;">${d.honoureeName}</span>
              </h1>
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">
                Someone who cares about this occasion has created a LegacyCapsule for <strong style="color:rgba(255,255,255,0.9);">${d.occasion}</strong> — and placed it in your hands to share, manage and preserve.
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">
                The tribute wall is live. Voices from friends and family are already beginning to arrive.
              </p>
            </td>
          </tr>

          <!-- CTAs -->
          <tr>
            <td style="padding:0 44px 36px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${d.manageUrl}"
                      style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0d3a;font-family:Arial,sans-serif;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;letter-spacing:0.04em;">
                      Open Your Dashboard →
                    </a>
                  </td>
                  <td>
                    <a href="${d.capsuleUrl}"
                      style="display:inline-block;padding:14px 28px;background:rgba(226,195,107,0.1);color:#E2C36B;font-family:Arial,sans-serif;font-weight:600;font-size:13px;text-decoration:none;border-radius:8px;border:1px solid rgba(226,195,107,0.3);letter-spacing:0.04em;">
                      View Tribute Wall →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What to do next -->
          <tr>
            <td style="padding:0 44px 32px;">
              <div style="background:rgba(226,195,107,0.05);border-left:3px solid rgba(226,195,107,0.4);border-radius:0 8px 8px 0;padding:16px 20px;">
                <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(226,195,107,0.6);">What happens next</p>
                <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">
                  ✦ Share your capsule link with friends and family to gather tributes.
                </p>
                <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">
                  ✦ Review and approve tributes from your dashboard before they appear on the wall.
                </p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">
                  ✦ At the close of your event, a beautifully compiled publication will be ready to share with everyone who contributed.
                </p>
              </div>
            </td>
          </tr>

          <!-- Quote -->
          <tr>
            <td style="padding:0 44px 32px;">
              <p style="margin:0;font-family:'Georgia',serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.35);text-align:center;line-height:1.7;">
                "Events end. Legacies don't."
              </p>
            </td>
          </tr>

          <!-- Gold bottom rule -->
          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 44px 20px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">
                LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
              </p>
              <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);">
                This capsule was created as a gift. Your link: itslegacycapsule.com/for/${d.capsuleSlug}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
