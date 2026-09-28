// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/webhooks/paystack/route.ts
// PURPOSE:   Receives and processes Paystack webhook events.
//            Verifies HMAC-SHA512 signature before any processing.
//            On charge.success: verifies transaction server-side,
//            confirms payment record, calls featureUnlocker.
//            On charge.failure: marks payment failed.
//            All other events: acknowledged and ignored.
// ARCHITECTURE: LC04 Payment Engine — Paystack webhook handler.
//               Mirrors Stripe webhook handler pattern.
//               Raw body must be read before JSON parsing — required for
//               HMAC signature verification.
// BUILT BY:  AI20 · Claude Opus 4.6
// UPDATED:   AI29 · Claude Opus 4.6 · 25 September 2026
//   — Promo slot claim added after unlockCapsuleFeatures()
//     Fetches organiser_email via payments→capsules join (not in Paystack payload)
//     Atomic DB claim via tryClaimPromoSlot() — non-fatal, never blocks activation
// UPDATED:   AI31 · Claude Opus 4.6 · 28 September 2026
//   — Payment confirmation email sent after promo claim (fire-and-forget)
//     Fetches capsule + payment fields for email content
//     Uses sendPaymentConfirmation() from lib/email/
// UPDATED:   AI20 · Claude Opus 4.6 · 11 August 2026
// VERSION:   AI31v2.12.73
// DATE:      28 September 2026
//
// SETUP REQUIRED:
//   1. Register https://itslegacycapsule.com/api/webhooks/paystack in
//      Paystack dashboard → Settings → Webhooks
//   2. Copy the webhook secret Paystack generates
//   3. Add to .env: PAYSTACK_WEBHOOK_SECRET=whsec_...
//   Events to subscribe: charge.success, charge.dispute.create,
//   transfer.success, transfer.failed (future)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import {
  verifyPaystackWebhookSignature,
  verifyPaystackTransaction,
} from '@/lib/payments/adapters/PaystackAdapter'
import { unlockCapsuleFeatures }     from '@/lib/payments/featureUnlocker'
import { tryClaimPromoSlot }        from '@/lib/payments/promoClaim'
import { confirmPayment, failPayment } from '@/lib/payments/PaymentService'
import { sendPaymentConfirmation } from '@/lib/email/sendPaymentConfirmation'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route config ═══
// Must disable body parsing — raw body required for HMAC verification.

export const dynamic = 'force-dynamic'

// ═══ SECTION 3 — POST handler ═══

export async function POST(req: NextRequest) {
  // ── Read raw body for signature verification ──────────────────────────────
  const rawBody  = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  // ── Verify signature ──────────────────────────────────────────────────────
  // Reject immediately if signature is missing or invalid.
  // Prevents spoofed webhooks from activating paid features.
  if (!signature) {
    console.warn('[paystack-webhook] Missing x-paystack-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const isValid = verifyPaystackWebhookSignature(rawBody, signature)
  if (!isValid) {
    console.warn('[paystack-webhook] Invalid signature — rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── Parse event ───────────────────────────────────────────────────────────
  let event: { event: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const eventType = event.event
  const data      = event.data as Record<string, unknown>

  console.log(`[paystack-webhook] Received: ${eventType}`)

  // ── Route by event type ───────────────────────────────────────────────────
  try {
    switch (eventType) {

      // ── Charge success ────────────────────────────────────────────────────
      case 'charge.success': {
        const reference = data.reference as string
        if (!reference) {
          console.error('[paystack-webhook] charge.success missing reference')
          break
        }

        // Extract payment_id from reference (format: lc_{payment_id})
        const payment_id = reference.startsWith('lc_')
          ? reference.slice(3)
          : null

        if (!payment_id) {
          console.error('[paystack-webhook] Could not extract payment_id from reference:', reference)
          break
        }

        // Server-side verification — never trust webhook payload amount alone
        let verified
        try {
          verified = await verifyPaystackTransaction(reference)
        } catch (verifyErr) {
          console.error('[paystack-webhook] Transaction verification failed:', verifyErr)
          // Return 200 so Paystack doesn't retry — log for manual investigation
          break
        }

        if (verified.status !== 'success') {
          console.warn(`[paystack-webhook] Transaction ${reference} status: ${verified.status} — skipping`)
          break
        }

        // Confirm payment record
        await confirmPayment(
          payment_id,
          reference,
          eventType,
        )

        // Unlock capsule features
        await unlockCapsuleFeatures(payment_id)

        // Promo slot claim + confirmation email
        // Fetch payment + capsule data needed for both (not in Paystack payload)
        let promoResult: { claimed?: boolean | null; slot?: number; promo_label?: string; discount_pct?: number } = {}
        let capsuleData: { organiser_email?: string; honouree_name?: string; event_type?: string; event_tag?: string; slug?: string } = {}
        let paymentData: { capsule_id?: string; amount?: number; currency?: string; package_tier?: string } = {}

        try {
          const { data: pmtRow } = await db
            .from('payments')
            .select('capsule_id, amount, currency, package_tier')
            .eq('id', payment_id)
            .maybeSingle()
          if (pmtRow) {
            paymentData = pmtRow
            if (pmtRow.capsule_id) {
              const { data: cap } = await db
                .from('capsules')
                .select('organiser_email, honouree_name, event_type, event_tag, slug')
                .eq('id', pmtRow.capsule_id)
                .maybeSingle()
              if (cap) {
                capsuleData = cap
                if (cap.organiser_email) {
                  promoResult = await tryClaimPromoSlot(
                    cap.organiser_email,
                    pmtRow.capsule_id,
                    payment_id
                  )
                }
              }
            }
          }
        } catch (promoErr) {
          console.error('[paystack-webhook] promo claim error (non-fatal):', promoErr)
        }

        // Send payment confirmation email — fire-and-forget
        if (capsuleData.organiser_email && capsuleData.slug) {
          sendPaymentConfirmation({
            organiserEmail: capsuleData.organiser_email,
            honoureeName:   capsuleData.honouree_name ?? 'your honouree',
            capsuleSlug:    capsuleData.slug,
            eventType:      capsuleData.event_type ?? '',
            eventTag:       capsuleData.event_tag ?? '',
            packageTier:    paymentData.package_tier ?? '',
            amount:         paymentData.amount ?? 0,
            currency:       paymentData.currency ?? 'NGN',
            processor:      'paystack',
            paymentId:      payment_id,
            promoSlot:      promoResult.claimed === true ? (promoResult.slot ?? null) : null,
            promoLabel:     promoResult.claimed === true ? (promoResult.promo_label ?? null) : null,
            discountPct:    promoResult.claimed === true ? (promoResult.discount_pct ?? null) : null,
          }).catch(emailErr => {
            console.error('[paystack-webhook] confirmation email error (non-fatal):', emailErr)
          })
        }

        console.log(`[paystack-webhook] Payment ${payment_id} confirmed + features unlocked`)
        break
      }

      // ── Charge failure ────────────────────────────────────────────────────
      case 'charge.failed': {
        const reference = data.reference as string
        const payment_id = reference?.startsWith('lc_') ? reference.slice(3) : null

        if (payment_id) {
          const gateway_response = (data.gateway_response as string) ?? 'Payment failed'
          await failPayment(payment_id, gateway_response)
          console.log(`[paystack-webhook] Payment ${payment_id} marked failed: ${gateway_response}`)
        }
        break
      }

      // ── Subscription events (future) ──────────────────────────────────────
      case 'subscription.create':
      case 'subscription.disable':
      case 'invoice.payment_failed':
        console.log(`[paystack-webhook] Subscription event noted (not yet handled): ${eventType}`)
        break

      // ── All other events — acknowledge and ignore ─────────────────────────
      default:
        console.log(`[paystack-webhook] Unhandled event type: ${eventType} — acknowledged`)
        break
    }
  } catch (err) {
    console.error('[paystack-webhook] Processing error:', err)
    // Return 200 — Paystack will retry on 5xx. We log for manual investigation.
    // Retrying a partially-processed event is worse than a missed one.
  }

  // Always return 200 to Paystack — prevents aggressive retries
  return NextResponse.json({ received: true })
}

// ═══ SECTION 4 — GET guard ═══

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Webhook endpoint — POST only.' },
    { status: 405 }
  )
}

