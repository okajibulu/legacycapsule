// FILE: app/api/webhooks/stripe/route.ts
// PURPOSE: Handles Stripe payment events. Signature verification mandatory.
//          Raw body parsing required -- body parsers corrupt the Stripe signature.
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
//   -- Step 3 added: payment confirmation email to organiser after unlock
//   -- Warm thank-you tone in confirmation email

import { NextRequest, NextResponse }      from 'next/server'
import { verifyWebhookSignature }         from '@/lib/payments/adapters/StripeAdapter'
import { confirmPayment, failPayment }    from '@/lib/payments/PaymentService'
import { unlockCapsuleFeatures }          from '@/lib/payments/featureUnlocker'
import { createClient }                   from '@supabase/supabase-js'
import { Resend }                         from 'resend'

const db     = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ============================================================
// SECTION 1 -- Feature labels for confirmation email
// ============================================================

const FEATURE_LABELS: Record<string, string> = {
  audio_tributes:            'Voice Tributes',
  video_tributes:            'Video Tributes',
  ways_to_honour:            'Gifting',
  expression_of_honour:      'Gifting',
  guest_management:          'Guest Management & Seating',
  attire:                    'Fabric & Attire Coordination',
  publication:               'Digital Publication',
  community_stories:         'Community Memories & Stories',
  extended_validity:         'Extended Validity',
  additional_phase:          'Additional Event Phase',
  access_codes:              'Access Code System',
  access_code_system:        'Access Code System',
  capacity_pack_growth:      'Growth Pack (+250 guests)',
  capacity_pack_celebration: 'Celebration Pack (+750 guests)',
  capacity_pack_grand:       'Grand Event Pack (+2,000 guests)',
}

// ============================================================
// SECTION 2 -- Payment confirmation email
// ============================================================

async function sendPaymentConfirmationEmail(payment_id: string, featureIds: string[]): Promise<void> {
  try {
    // Fetch payment + capsule details
    const { data: payment } = await db
      .from('payments')
      .select('capsule_id, amount, currency, organiser_email')
      .eq('id', payment_id)
      .single()

    if (!payment?.capsule_id) return

    const { data: capsule } = await db
      .from('capsules')
      .select('honouree_name, slug, organiser_email')
      .eq('id', payment.capsule_id)
      .single()

    if (!capsule) return

    const recipientEmail = payment.organiser_email ?? capsule.organiser_email
    if (!recipientEmail) return

    const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '\u20a6', GBP: '\u00a3', USD: '$', EUR: '\u20ac' }
    const symbol     = CURRENCY_SYMBOLS[payment.currency] ?? '\u20ac'
    const amountMajor = Number(payment.amount ?? 0) / 100
    const amountStr   = amountMajor % 1 === 0
      ? amountMajor.toLocaleString()
      : amountMajor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const activeFeatures = featureIds
      .filter(k => k !== 'capsule_activation')
      .map(k => FEATURE_LABELS[k] ?? k)

    const featureItems = activeFeatures.map(f =>
      `<tr><td style="padding:7px 0;border-bottom:1px solid rgba(226,195,107,0.08);font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.75);">&#10022; &nbsp;${f}</td></tr>`
    ).join('')

    const manageUrl = `${APP_URL}/manage/${capsule.slug}`

    await resend.emails.send({
      from:    'LegacyCapsule <events@itslegacycapsule.com>',
      to:      recipientEmail,
      subject: `Payment confirmed -- ${capsule.honouree_name}'s LegacyCapsule`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Payment Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

      <!-- Brand -->
      <tr><td align="center" style="padding-bottom:28px;">
        <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">

        <!-- Gold top bar -->
        <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px;">

          <!-- Icon -->
          <tr><td align="center" style="padding-bottom:16px;">
            <p style="margin:0;font-size:28px;color:#E2C36B;">&#10022;</p>
          </td></tr>

          <!-- Thank you headline -->
          <tr><td align="center" style="padding-bottom:10px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.95);margin:0;line-height:1.3;">
              Thank you so much.
            </h1>
          </td></tr>

          <!-- Subheading -->
          <tr><td align="center" style="padding-bottom:20px;">
            <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;max-width:380px;">
              Your payment for <strong style="color:rgba(255,255,255,0.85);">${capsule.honouree_name}</strong>'s LegacyCapsule has been confirmed and your services are now active. We are genuinely grateful for your trust in us to help preserve this moment.
            </p>
          </td></tr>

          <!-- Amount confirmed -->
          <tr><td style="padding-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Amount Paid</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#E2C36B;">${symbol}${amountStr} <span style="font-size:13px;font-weight:400;color:rgba(226,195,107,0.5);">${payment.currency}</span></p>
              </td></tr>
            </table>
          </td></tr>

          ${activeFeatures.length > 0 ? `
          <!-- Services activated -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(226,195,107,0.1);border-radius:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Now Active on Your Capsule</p>
                <table width="100%" cellpadding="0" cellspacing="0">${featureItems}</table>
              </td></tr>
            </table>
          </td></tr>` : ''}

          <!-- CTA -->
          <tr><td align="center" style="padding-bottom:20px;">
            <a href="${manageUrl}" style="display:inline-block;padding:14px 40px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.75));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
              Open My Dashboard &#8594;
            </a>
          </td></tr>

          <!-- Closing warmth -->
          <tr><td align="center">
            <p style="font-size:12px;color:rgba(255,255,255,0.28);line-height:1.7;margin:0;font-style:italic;">
              We look forward to helping you create something lasting.<br/>
              The LegacyCapsule Team
            </p>
          </td></tr>

        </table>

        <!-- Gold bottom bar -->
        <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

      </td></tr>

      <!-- Footer -->
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
</html>`,
    })
  } catch (emailErr) {
    // Non-blocking -- log but never fail the webhook over an email
    console.error('[stripe webhook] Payment confirmation email failed:', emailErr)
  }
}

// ============================================================
// SECTION 3 -- POST handler
// ============================================================

export async function POST(req: NextRequest) {
  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = verifyWebhookSignature(payload, signature)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signature failure'
    console.error('[stripe webhook] Signature verification failed:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session    = event.data.object as unknown as Record<string, unknown>
        const metadata   = (session.metadata as Record<string, string>) ?? {}
        const payment_id = metadata.payment_id

        if (!payment_id) {
          console.error('[stripe webhook] No payment_id in session metadata')
          break
        }

        // Step 1: mark payment as succeeded
        await confirmPayment(
          payment_id,
          session.id as string,
          event.type,
          session.id as string,
          session.payment_intent as string | undefined,
        )

        // Step 2: unlock purchased features on capsule
        await unlockCapsuleFeatures(payment_id)

        // Step 3: send payment confirmation email to organiser
        const featureIds: string[] = metadata.feature_ids
          ? metadata.feature_ids.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (metadata.package_tier ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)

        await sendPaymentConfirmationEmail(payment_id, featureIds)

        // Step 4: send gift notification if this was a gift booking
        if (metadata.book_mode === 'gift' && metadata.recipient_email && metadata.capsule_slug) {
          try {
            await fetch(`${APP_URL}/api/email/gift-notification`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                recipient_email: metadata.recipient_email,
                capsule_slug:    metadata.capsule_slug,
                capsule_id:      metadata.capsule_id,
                organiser_email: metadata.organiser_email,
              }),
            })
          } catch (giftErr) {
            console.error('[stripe webhook] Gift notification failed:', giftErr)
          }
        }

        console.log(`[stripe webhook] Payment confirmed and features unlocked -- payment ${payment_id}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const intent     = event.data.object as unknown as Record<string, unknown>
        const metadata   = (intent.metadata as Record<string, string>) ?? {}
        const payment_id = metadata.payment_id
        if (!payment_id) break
        const reason = (intent.last_payment_error as Record<string, string> | undefined)?.message ?? 'Payment failed'
        await failPayment(payment_id, reason)
        console.log(`[stripe webhook] Payment failed -- payment ${payment_id}: ${reason}`)
        break
      }

      case 'customer.subscription.created':
      case 'invoice.paid':
      case 'customer.subscription.deleted': {
        console.log(`[stripe webhook] Subscription event received -- ${event.type} (Phase 2 handler pending)`)
        break
      }

      default:
        console.log(`[stripe webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Handler error'
    console.error('[stripe webhook] Handler error:', msg)
    return NextResponse.json({ received: true, warning: msg })
  }

  return NextResponse.json({ received: true })
}
