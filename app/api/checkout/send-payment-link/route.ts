// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/checkout/send-payment-link/route.ts
// PURPOSE: Generates a Stripe checkout session for selected services and sends
//          the checkout URL to a third party (friend, family, sponsor) via email.
//          The payer sees exactly what they're paying for and who it's for.
//          On payment success, services activate on the organiser's capsule.
// ARCHITECTURE: LC04 Payment Engine · FEAT-001 Third-party payment
// BUILT BY: AI12 · Claude Opus 4.6 · 21 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'

// ═══ SECTION 1 — Clients ═══

const db     = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Feature labels ═══

const FEATURE_LABELS: Record<string, string> = {
  audio_tributes:            'Voice Tributes',
  video_tributes:            'Video Tributes',
  ways_to_honour:            'Gift of Honour',
  guest_management:          'Guest Management & Seating',
  attire:                    'Fabric & Attire Coordination',
  publication:               'Digital Publication',
  community_stories:         'Community Memories & Stories',
  extended_validity:         'Extended Validity',
  additional_phase:          'Additional Event Phase',
  access_codes:              'Access Code System',
  capacity_pack_growth:      'Growth Pack (+250 guests)',
  capacity_pack_celebration: 'Celebration Pack (+750 guests)',
  capacity_pack_grand:       'Grand Event Pack (+2,000 guests)',
}

// ═══ SECTION 3 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const {
      capsule_id,
      capsule_slug,
      feature_ids,
      payer_name,
      payer_email,
      honouree_name,
    } = await req.json()

    if (!capsule_id || !capsule_slug || !feature_ids?.length || !payer_email || !payer_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Build checkout URL via bundle route ──────────────────────────────────
    const bundleRes = await fetch(`${APP_URL}/api/checkout/bundle`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id,
        capsule_slug,
        feature_ids,
        organiser_email: payer_email,
        book_mode:       'own',
      }),
    })

    const bundleData = await bundleRes.json()
    if (!bundleRes.ok || !bundleData.checkout_url) {
      throw new Error(bundleData.error ?? 'Failed to create checkout session')
    }

    const checkoutUrl = bundleData.checkout_url
    const amount      = bundleData.amount
    const currency    = bundleData.currency
    const symbol      = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
    const featureList = (feature_ids as string[]).map(k => FEATURE_LABELS[k] ?? k)

    // ── Send email to payer ──────────────────────────────────────────────────
    await resend.emails.send({
      from:    'LegacyCapsule <events@itslegacycapsule.com>',
      to:      payer_email,
      subject: `Payment request for ${honouree_name}'s LegacyCapsule`,
      html:    paymentLinkEmailHtml({
        payerName:    payer_name,
        honoureeName: honouree_name,
        featureList,
        amount,
        symbol,
        currency,
        checkoutUrl,
        capsuleUrl:   `${APP_URL}/for/${capsule_slug}`,
      }),
    })

    return NextResponse.json({ ok: true })

  } catch (e: any) {
    console.error('[checkout/send-payment-link]', e)
    return NextResponse.json({ error: e.message ?? 'Failed to send payment link' }, { status: 500 })
  }
}

// ═══ SECTION 4 — Email template ═══

function paymentLinkEmailHtml(d: {
  payerName:    string
  honoureeName: string
  featureList:  string[]
  amount:       number
  symbol:       string
  currency:     string
  checkoutUrl:  string
  capsuleUrl:   string
}) {
  const serviceItems = d.featureList.map(f =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.75);">✦ ${f}</td></tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

      <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

      <tr><td style="padding:36px 40px 8px;text-align:center;">
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">PAYMENT REQUEST</p>
        <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;">${d.honoureeName}'s LegacyCapsule</h1>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.45);">A payment has been requested on their behalf</p>
      </td></tr>

      <tr><td style="padding:20px 40px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.25),transparent);"></div></td></tr>

      <tr><td style="padding:20px 40px;">
        <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">
          Dear <strong style="color:#fff;">${d.payerName}</strong>,
        </p>
        <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.75;">
          You've been asked to complete a payment for services being added to <strong style="color:rgba(255,255,255,0.8);">${d.honoureeName}</strong>'s LegacyCapsule. 
          Once paid, the services will activate on the capsule immediately.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(226,195,107,0.5);">Services included</p>
            <table width="100%" cellpadding="0" cellspacing="0">${serviceItems}</table>
            <tr><td style="padding-top:12px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:800;color:#E2C36B;">${d.symbol}${d.amount.toLocaleString()} ${d.currency}</p>
            </td></tr>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 40px 36px;text-align:center;">
        <a href="${d.checkoutUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.06em;">
          Complete Payment →
        </a>
        <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);">
          This link is secure and goes directly to our payment provider.<br/>
          You can also view the capsule at <a href="${d.capsuleUrl}" style="color:rgba(226,195,107,0.45);">${d.capsuleUrl}</a>
        </p>
      </td></tr>

      <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>
      <tr><td style="padding:14px 40px 18px;text-align:center;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}
