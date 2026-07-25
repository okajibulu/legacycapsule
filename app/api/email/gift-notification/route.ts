// FILE: app/api/email/gift-notification/route.ts
// PURPOSE: Sends capsule access email to the gift recipient after payment.
//          Also sends a warm organiser confirmation (separate from recipient email).
//          Called by Stripe webhook after checkout.session.completed
//          when book_mode === 'gift'.
// ARCHITECTURE: LC04 Payment Engine - LC05 Engagement Engine
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
//   -- Organiser confirmation email added (was missing -- B3)
//   -- Raw capsule URL removed from recipient email footer
//   -- organiser_email param accepted from webhook caller
//   -- Unicode replaced with HTML entities

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'

// ============================================================
// SECTION 1 -- Clients
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend  = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ============================================================
// SECTION 2 -- Route handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const { recipient_email, capsule_slug, capsule_id, organiser_email } = await req.json()

    if (!recipient_email || !capsule_slug) {
      return NextResponse.json({ error: 'recipient_email and capsule_slug required' }, { status: 400 })
    }

    // Fetch capsule details
    const { data: capsule } = await adminClient
      .from('capsules')
      .select('honouree_name, event_type, event_tag, organiser_email')
      .eq('id', capsule_id)
      .single()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    const capsuleUrl  = `${APP_URL}/for/${capsule_slug}`
    const manageUrl   = `${APP_URL}/manage/${capsule_slug}`
    const occasion    = capsule.event_tag ?? capsule.event_type ?? 'a special occasion'
    const orgEmail    = organiser_email ?? capsule.organiser_email

    // -- Send to recipient (the person receiving the gift capsule) ------------
    await resend.emails.send({
      from:    'LegacyCapsule <memories@itslegacycapsule.com>',
      to:      recipient_email,
      subject: `A LegacyCapsule has been created in honour of ${capsule.honouree_name}`,
      html:    recipientEmailHtml({ honoureeName: capsule.honouree_name, occasion, capsuleUrl, manageUrl }),
    })

    // -- Send confirmation to organiser (the gift giver) ----------------------
    if (orgEmail && orgEmail !== recipient_email) {
      await resend.emails.send({
        from:    'LegacyCapsule <events@itslegacycapsule.com>',
        to:      orgEmail,
        subject: `Your gift capsule for ${capsule.honouree_name} has been sent`,
        html:    organiserConfirmEmailHtml({ honoureeName: capsule.honouree_name, occasion, capsuleUrl, manageUrl }),
      })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[gift-notification]', err)
    return NextResponse.json({ error: 'Failed to send gift notification' }, { status: 500 })
  }
}

// ============================================================
// SECTION 3 -- Recipient email template
// The person who has received the gift capsule.
// ============================================================

function recipientEmailHtml(d: {
  honoureeName: string
  occasion:     string
  capsuleUrl:   string
  manageUrl:    string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>A LegacyCapsule has been prepared for you</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

      <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

      <tr><td style="padding:44px 44px 8px;text-align:center;">
        <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(226,195,107,0.6);">LEGACYCAPSULE</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;">A gift has arrived</p>
      </td></tr>

      <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

      <tr><td style="padding:32px 44px 28px;text-align:center;">
        <h1 style="margin:0 0 16px;font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">
          A capsule has been prepared<br/>in honour of <span style="color:#E2C36B;">${d.honoureeName}</span>
        </h1>
        <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">
          Someone who cares deeply has created a LegacyCapsule for <strong style="color:rgba(255,255,255,0.9);">${d.occasion}</strong> &mdash; and placed it in your hands to share, manage and preserve.
        </p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">
          The tribute wall is live. Voices from friends and family are already beginning to arrive.
        </p>
      </td></tr>

      <tr><td style="padding:0 44px 36px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="padding-right:12px;">
              <a href="${d.manageUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0d3a;font-family:Arial,sans-serif;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;letter-spacing:0.04em;">
                Open Your Dashboard &#8594;
              </a>
            </td>
            <td>
              <a href="${d.capsuleUrl}" style="display:inline-block;padding:14px 28px;background:rgba(226,195,107,0.1);color:#E2C36B;font-family:Arial,sans-serif;font-weight:600;font-size:13px;text-decoration:none;border-radius:8px;border:1px solid rgba(226,195,107,0.3);letter-spacing:0.04em;">
                View Tribute Wall &#8594;
              </a>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 44px 32px;">
        <div style="background:rgba(226,195,107,0.05);border-left:3px solid rgba(226,195,107,0.4);border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(226,195,107,0.6);">What happens next</p>
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">&#10022; &nbsp;Share your capsule link with friends and family to gather tributes.</p>
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">&#10022; &nbsp;Review and approve tributes from your dashboard before they go live.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">&#10022; &nbsp;A beautifully compiled publication will be ready to share at the close of your event.</p>
        </div>
      </td></tr>

      <tr><td style="padding:0 44px 32px;">
        <p style="margin:0;font-family:'Georgia',serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.35);text-align:center;line-height:1.7;">
          "Events end. Legacies don't."
        </p>
      </td></tr>

      <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

      <tr><td style="padding:16px 44px 20px;text-align:center;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:0.16em;text-transform:uppercase;">
          LEGACYCAPSULE &middot; VALNEX, UNIPESSOAL LDA &middot; REVOWORLDTECH
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ============================================================
// SECTION 4 -- Organiser confirmation email template
// The person who gifted the capsule -- warm, grateful, reassuring.
// ============================================================

function organiserConfirmEmailHtml(d: {
  honoureeName: string
  occasion:     string
  capsuleUrl:   string
  manageUrl:    string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your gift capsule has been sent</title>
</head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

      <tr><td align="center" style="padding-bottom:28px;">
        <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
      </td></tr>

      <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">

        <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px;">

          <tr><td align="center" style="padding-bottom:16px;">
            <p style="margin:0;font-size:28px;color:#E2C36B;">&#10022;</p>
          </td></tr>

          <tr><td align="center" style="padding-bottom:10px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.95);margin:0;line-height:1.3;">
              What a beautiful thing you have done.
            </h1>
          </td></tr>

          <tr><td align="center" style="padding-bottom:24px;">
            <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.8;margin:0;max-width:380px;">
              Your gift capsule for <strong style="color:rgba(255,255,255,0.85);">${d.honoureeName}</strong> has been delivered. The recipient now has access to their tribute wall and dashboard. Voices from friends and family will begin to gather there in their honour.
            </p>
          </td></tr>

          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Capsule for</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#E2C36B;">${d.honoureeName}</p>
                <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);">${d.occasion}</p>
              </td></tr>
            </table>
          </td></tr>

          <tr><td align="center" style="padding-bottom:20px;">
            <a href="${d.capsuleUrl}" style="display:inline-block;padding:14px 40px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.75));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
              View the Tribute Wall &#8594;
            </a>
          </td></tr>

          <tr><td align="center">
            <p style="font-size:12px;color:rgba(255,255,255,0.28);line-height:1.7;margin:0;font-style:italic;">
              Thank you for choosing LegacyCapsule to carry this gift.<br/>
              The LegacyCapsule Team
            </p>
          </td></tr>

        </table>

        <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

      </td></tr>

      <tr><td align="center" style="padding-top:24px;">
        <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.8;">
          LegacyCapsule &middot; RevoWorldTech &middot; Valnex, Unipessoal LDA<br/>
          <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.35);text-decoration:none;">itslegacycapsule.com</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}