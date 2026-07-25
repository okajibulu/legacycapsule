// FILE: app/api/email/gift-schedule/route.ts
// PURPOSE: Schedules a gift capsule notification email via Resend scheduledAt.
//          Called by Stripe webhook when book_mode === 'gift' AND gift_deliver_at is set.
//          For immediate delivery, the webhook calls gift-notification directly.
//          Uses Resend scheduled send -- no Vercel cron required.
// ARCHITECTURE: LC04 Payment Engine - LC05 Engagement Engine
// BUILT BY: AI13 - Claude Opus 4.6 - 22 July 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'

// ============================================================
// SECTION 1 -- Clients
// ============================================================

const db      = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend  = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ============================================================
// SECTION 2 -- POST handler
// Body: { capsule_id, capsule_slug, recipient_email, gift_deliver_at, organiser_email }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, capsule_slug, recipient_email, gift_deliver_at, organiser_email } = await req.json()

    if (!capsule_id || !capsule_slug || !recipient_email || !gift_deliver_at) {
      return NextResponse.json({ error: 'capsule_id, capsule_slug, recipient_email and gift_deliver_at required' }, { status: 400 })
    }

    // Validate delivery time is in the future (minimum 30 minutes)
    const deliverAt   = new Date(gift_deliver_at)
    const minDelivery = new Date(Date.now() + 30 * 60 * 1000)
    if (deliverAt < minDelivery) {
      return NextResponse.json({ error: 'Delivery time must be at least 30 minutes in the future' }, { status: 400 })
    }

    // Fetch capsule details
    const { data: capsule } = await db
      .from('capsules')
      .select('honouree_name, event_type, event_tag, organiser_email')
      .eq('id', capsule_id)
      .single()

    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })

    const capsuleUrl = `${APP_URL}/for/${capsule_slug}`
    const manageUrl  = `${APP_URL}/manage/${capsule_slug}`
    const occasion   = capsule.event_tag ?? capsule.event_type ?? 'a special occasion'
    const orgEmail   = organiser_email ?? capsule.organiser_email

    // Store scheduled delivery details on capsule
    await db
      .from('capsules')
      .update({
        gift_deliver_at:       deliverAt.toISOString(),
        gift_delivered:        false,
        gift_recipient_email:  recipient_email,
      })
      .eq('id', capsule_id)

    // Schedule recipient email via Resend scheduledAt
    const { data: scheduledEmail, error: scheduleError } = await resend.emails.send({
      from:        'LegacyCapsule <memories@itslegacycapsule.com>',
      to:          recipient_email,
      subject:     `A LegacyCapsule has been created in honour of ${capsule.honouree_name}`,
      scheduledAt: deliverAt.toISOString(),
      html:        recipientEmailHtml({ honoureeName: capsule.honouree_name, occasion, capsuleUrl, manageUrl }),
    })

    if (scheduleError) {
      console.error('[gift-schedule] Resend schedule error:', scheduleError)
      return NextResponse.json({ error: 'Failed to schedule gift notification' }, { status: 500 })
    }

    // Store the Resend email ID so it can be cancelled/rescheduled later
    if (scheduledEmail?.id) {
      await db
        .from('capsules')
        .update({ gift_resend_id: scheduledEmail.id })
        .eq('id', capsule_id)
    }

    // Send immediate confirmation to organiser
    if (orgEmail) {
      const deliveryDateFormatted = deliverAt.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const deliveryTimeFormatted = deliverAt.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })

      await resend.emails.send({
        from:    'LegacyCapsule <events@itslegacycapsule.com>',
        to:      orgEmail,
        subject: `Your gift capsule delivery is scheduled -- ${capsule.honouree_name}`,
        html:    organiserScheduleConfirmHtml({
          honoureeName:   capsule.honouree_name,
          recipientEmail: recipient_email,
          deliveryDate:   deliveryDateFormatted,
          deliveryTime:   deliveryTimeFormatted,
          capsuleUrl,
          manageUrl,
        }),
      })
    }

    return NextResponse.json({ ok: true, scheduled_at: deliverAt.toISOString() })

  } catch (err) {
    console.error('[gift-schedule]', err)
    return NextResponse.json({ error: 'Failed to schedule gift delivery' }, { status: 500 })
  }
}

// ============================================================
// SECTION 3 -- Recipient email template (same as gift-notification)
// ============================================================

function recipientEmailHtml(d: { honoureeName: string; occasion: string; capsuleUrl: string; manageUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
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
      </td></tr>
      <tr><td style="padding:0 44px 36px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="padding-right:12px;">
              <a href="${d.manageUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0d3a;font-family:Arial,sans-serif;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;letter-spacing:0.04em;">Open Your Dashboard &#8594;</a>
            </td>
            <td>
              <a href="${d.capsuleUrl}" style="display:inline-block;padding:14px 28px;background:rgba(226,195,107,0.1);color:#E2C36B;font-family:Arial,sans-serif;font-weight:600;font-size:13px;text-decoration:none;border-radius:8px;border:1px solid rgba(226,195,107,0.3);letter-spacing:0.04em;">View Tribute Wall &#8594;</a>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 44px 32px;">
        <p style="margin:0;font-family:'Georgia',serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.35);text-align:center;line-height:1.7;">"Events end. Legacies don't."</p>
      </td></tr>
      <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:16px 44px 20px;text-align:center;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:0.16em;text-transform:uppercase;">LEGACYCAPSULE &middot; VALNEX, UNIPESSOAL LDA &middot; REVOWORLDTECH</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ============================================================
// SECTION 4 -- Organiser schedule confirmation email
// ============================================================

function organiserScheduleConfirmHtml(d: {
  honoureeName:   string
  recipientEmail: string
  deliveryDate:   string
  deliveryTime:   string
  capsuleUrl:     string
  manageUrl:      string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
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
            <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.95);margin:0;line-height:1.3;">Your gift delivery is scheduled.</h1>
          </td></tr>
          <tr><td align="center" style="padding-bottom:24px;">
            <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.8;margin:0;max-width:380px;">
              The capsule for <strong style="color:rgba(255,255,255,0.85);">${d.honoureeName}</strong> has been prepared. We will deliver it to <strong style="color:rgba(255,255,255,0.85);">${d.recipientEmail}</strong> at the time you chose.
            </p>
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Scheduled Delivery</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#E2C36B;">${d.deliveryDate}</p>
                <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.45);">${d.deliveryTime}</p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding-bottom:20px;">
            <a href="${d.manageUrl}" style="display:inline-block;padding:14px 40px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.75));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">Open My Dashboard &#8594;</a>
          </td></tr>
          <tr><td align="center">
            <p style="font-size:11px;color:rgba(255,255,255,0.28);line-height:1.7;margin:0;">
              You can reschedule or send immediately from your dashboard at any time before delivery.<br/>
              Thank you for choosing LegacyCapsule to carry this gift.
            </p>
          </td></tr>
        </table>
        <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
      </td></tr>
      <tr><td align="center" style="padding-top:24px;">
        <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.8;">LegacyCapsule &middot; RevoWorldTech &middot; Valnex, Unipessoal LDA</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}