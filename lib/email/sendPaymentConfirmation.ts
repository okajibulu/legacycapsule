// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/email/sendPaymentConfirmation.ts
// PURPOSE:   Sends a payment confirmation email to the organiser after a
//            successful Stripe or Paystack payment. Includes order summary,
//            Founding Customer slot (if claimed), and dashboard CTA.
//            Non-blocking — webhook handlers should .catch() and continue.
// ARCHITECTURE: LC04 Payment Engine · LC_EMOTIONAL_COMMUNICATION_STANDARD.md
// BUILT BY:  AI31 · Claude Opus 4.6
// VERSION:   AI31v2.12.72
// DATE:      28 September 2026
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from 'resend'
import { SERVICE_DETAILS } from '@/lib/content/serviceDetails'

// ═══ SECTION 1 — Client ═══

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Types ═══

export interface PaymentConfirmationParams {
  organiserEmail:  string
  honoureeName:    string
  capsuleSlug:     string
  eventType:       string        // e.g. 'memorial', 'wedding', 'retirement'
  eventTag:        string        // human-readable tag e.g. 'Memorial & Funeral'
  packageTier:     string        // comma-separated pricing keys e.g. 'audio_tributes,publication'
  amount:          number        // in minor units (kobo/cents/pence)
  currency:        string        // e.g. 'NGN', 'GBP', 'USD'
  processor:       string        // 'stripe' | 'paystack'
  paymentId:       string
  promoSlot?:      number | null // Founding Customer slot number, if claimed
  promoLabel?:     string | null // e.g. 'Founding Customer Offer'
  discountPct?:    number | null // e.g. 40
}

// ═══ SECTION 3 — Helpers ═══

/** Convert currency code to display symbol */
function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    NGN: '₦', GBP: '£', USD: '$', CAD: 'CA$',
    GHS: '₵', KES: 'KSh', EUR: '€',
  }
  return map[currency.toUpperCase()] ?? currency + ' '
}

/** Convert minor-unit amount to display string (e.g. 450000 NGN → ₦4,500) */
function formatAmount(amount: number, currency: string): string {
  const zeroDecimal = ['JPY', 'KRW', 'VND']
  const major = zeroDecimal.includes(currency.toUpperCase())
    ? amount
    : amount / 100
  const symbol = currencySymbol(currency)
  // Format with thousand separators, strip trailing .00
  const formatted = major.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

/** Map pricing key to human-readable service name */
function serviceName(pricingKey: string): string {
  // Try exact match in SERVICE_DETAILS first
  const detail = SERVICE_DETAILS[pricingKey]
  if (detail) return detail.title

  // Handle capacity packs and special keys
  const labelMap: Record<string, string> = {
    honour_capsule:        'Honour Capsule',
    premier_capsule:       'Premier Capsule',
    growth_pack:           'Growth Pack',
    celebration_pack:      'Celebration Pack',
    grand_event_pack:      'Grand Event Pack',
    extended_validity_90:  'Extended Validity (90 days)',
  }
  return labelMap[pricingKey] ?? pricingKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Build the event-aware subject line */
function buildSubject(params: PaymentConfirmationParams): string {
  const eventPhrases: Record<string, string> = {
    memorial:      'memorial capsule',
    funeral:       'memorial capsule',
    wedding:       'wedding capsule',
    retirement:    'retirement capsule',
    birthday:      'birthday capsule',
    chieftaincy:   'chieftaincy capsule',
    graduation:    'graduation capsule',
    ordination:    'ordination capsule',
    thanksgiving:  'thanksgiving capsule',
    anniversary:   'anniversary capsule',
    conference:    'conference capsule',
    award:         'award ceremony capsule',
  }
  const phrase = eventPhrases[params.eventType?.toLowerCase()] ?? 'capsule'
  return `Payment confirmed — ${params.honoureeName}'s ${phrase} is ready`
}

// ═══ SECTION 4 — Email HTML builder ═══

function buildConfirmationHtml(params: PaymentConfirmationParams): string {
  const {
    honoureeName, capsuleSlug, packageTier, amount, currency,
    processor, paymentId, promoSlot, promoLabel, discountPct,
  } = params

  const dashboardUrl = `${APP_URL}/manage/${capsuleSlug}`
  const capsuleUrl   = `${APP_URL}/for/${capsuleSlug}`
  const amountStr    = formatAmount(amount, currency)

  // Build service line items
  const keys = packageTier.split(',').map(k => k.trim()).filter(Boolean)
  const serviceLines = keys.map(k => {
    const name = serviceName(k)
    return `<tr><td style="padding:6px 0;font-size:14px;color:#4a4a5e;line-height:1.6;">&bull; ${name}</td></tr>`
  }).join('\n')

  // Founding Customer badge row (conditional)
  const foundingBadge = (promoSlot && promoLabel)
    ? `
              <!-- Founding Customer badge -->
              <div style="margin:0 0 20px;padding:16px 20px;border-radius:12px;background:linear-gradient(135deg,rgba(212,174,42,0.12),rgba(212,174,42,0.06));border:1px solid rgba(212,174,42,0.25);text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.15em;color:#D4AE2A;text-transform:uppercase;">
                  ${promoLabel}
                </p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#2D1B69;font-family:Georgia,'Playfair Display',serif;">
                  Customer #${promoSlot}
                </p>
                ${discountPct ? `<p style="margin:4px 0 0;font-size:12px;color:#7a7a8e;">${discountPct}% founding discount applied</p>` : ''}
              </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Payment Confirmed — ${honoureeName}'s LegacyCapsule</title>
</head>
<body style="margin:0;padding:0;background:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Brand -->
        <tr><td align="center" style="padding-bottom:36px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
        </td></tr>

        <!-- Gold ornament -->
        <tr><td align="center" style="padding-bottom:20px;">
          <p style="margin:0;font-size:28px;color:#D4AE2A;">&#10022;</p>
        </td></tr>

        <!-- Headline -->
        <tr><td align="center" style="padding-bottom:32px;">
          <h1 style="margin:0 0 10px;font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#F5F3EE;line-height:1.35;">
            Payment Confirmed
          </h1>
          <p style="margin:0;font-size:14px;color:rgba(226,195,107,0.75);font-style:italic;">
            Everything is in place for ${honoureeName}'s capsule.
          </p>
        </td></tr>

        <!-- Card -->
        <tr><td style="padding:3px;border-radius:18px;background:linear-gradient(135deg,#D4AE2A,#B8960C,#D4AE2A);">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:16px;overflow:hidden;">
            <tr><td height="4" style="background:linear-gradient(90deg,#2D1B69,#D4AE2A,#2D1B69);font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:32px 36px 36px;">

              ${foundingBadge}

              <!-- Order Summary heading -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.15em;color:#9090a0;text-transform:uppercase;">
                Order Summary
              </p>

              <!-- Service line items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                ${serviceLines}
              </table>

              <!-- Total -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.4),transparent);margin:0 0 12px;"></div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="font-size:14px;font-weight:700;color:#2D1B69;">Total Paid</td>
                  <td align="right" style="font-size:16px;font-weight:700;color:#2D1B69;">${amountStr}</td>
                </tr>
              </table>

              <!-- Reference -->
              <p style="margin:0 0 24px;font-size:12px;color:#9090a0;">
                Payment ref: ${paymentId.slice(0, 8)}… &middot; via ${processor === 'paystack' ? 'Paystack' : 'Stripe'}
              </p>

              <!-- What's next -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.15em;color:#9090a0;text-transform:uppercase;">
                What happens next
              </p>
              <p style="margin:0 0 16px;font-size:14px;color:#4a4a5e;line-height:1.85;">
                Your services are already active. Share your capsule link with family and friends so they can leave tributes, upload photos, and be part of ${honoureeName}'s story.
              </p>

              <!-- Capsule link -->
              <p style="margin:0 0 24px;font-size:13px;color:#7a7a8e;">
                Capsule link: <a href="${capsuleUrl}" style="color:#2D1B69;text-decoration:underline;">${capsuleUrl}</a>
              </p>

              <!-- Gold rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 24px;"></div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${dashboardUrl}"
                   style="display:inline-block;padding:14px 40px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.05em;">
                  Go to Your Dashboard &rarr;
                </a>
              </div>

              <!-- Bottom rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 18px;"></div>

              <p style="margin:0;font-size:12px;color:#9090a0;text-align:center;line-height:1.7;">
                This email confirms your payment for ${honoureeName}'s LegacyCapsule.
                If you did not make this payment, please contact us at support@itslegacycapsule.com.
              </p>

            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.1em;text-transform:uppercase;">
            VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
          </p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.08);">itslegacycapsule.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ═══ SECTION 5 — Send function ═══

export async function sendPaymentConfirmation(params: PaymentConfirmationParams): Promise<void> {
  const subject = buildSubject(params)
  const html    = buildConfirmationHtml(params)

  const { error } = await resend.emails.send({
    from:    'LegacyCapsule <noreply@itslegacycapsule.com>',
    to:      params.organiserEmail,
    subject,
    html,
  })

  if (error) {
    console.error('[sendPaymentConfirmation] Resend error:', error)
    throw error
  }

  console.log(`[sendPaymentConfirmation] Confirmation sent to ${params.organiserEmail} for payment ${params.paymentId}`)
}
