// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/webhooks/paystack/route.ts
// PURPOSE: Paystack webhook handler. Mirrors Stripe webhook handler pattern.
//          Verifies signature → confirms payment → unlocks features.
//          Primary event: charge.success
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { verifyPaystackSignature, verifyPaystackTransaction } from '@/lib/payments/adapters/PaystackAdapter'
import { confirmPayment }                                      from '@/lib/payments/PaymentService'
import { unlockCapsuleFeatures }                               from '@/lib/payments/featureUnlocker'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Config
// Paystack sends raw JSON — no special body parsing needed
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody  = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  // ── Verify signature ──────────────────────────────────────────────────────
  let event
  try {
    event = verifyPaystackSignature(rawBody, signature)
  } catch (err) {
    console.error('[paystack webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[paystack webhook] Event received: ${event.event}`)

  // ── Handle events ─────────────────────────────────────────────────────────
  try {
    switch (event.event) {

      // ── charge.success — primary payment confirmation ─────────────────────
      case 'charge.success': {
        const { reference, metadata, status } = event.data

        if (status !== 'success') {
          console.warn(`[paystack webhook] charge.success but status is: ${status}`)
          break
        }

        // Extract payment_id from metadata or from reference (lc_<payment_id>)
        const payment_id = metadata?.payment_id ?? reference.replace('lc_', '')

        if (!payment_id) {
          console.error('[paystack webhook] No payment_id found in event')
          break
        }

        // Verify transaction independently — never trust webhook data alone
        let verified
        try {
          verified = await verifyPaystackTransaction(reference)
        } catch (verifyErr) {
          console.error('[paystack webhook] Transaction verification failed:', verifyErr)
          break
        }

        if (verified.status !== 'success') {
          console.warn(`[paystack webhook] Verification returned status: ${verified.status}`)
          break
        }

        // Step 1: confirm payment in our DB
        await confirmPayment(
          payment_id,
          reference,              // processor_ref
          'charge.success',       // webhook_event
        )

        // Step 2: unlock purchased features on capsule
        await unlockCapsuleFeatures(payment_id)

        // Step 3: gift notification if applicable
        const capsule_slug    = metadata?.capsule_slug ?? verified.metadata?.capsule_slug
        const recipient_email = metadata?.recipient_email ?? verified.metadata?.recipient_email
        const book_mode       = metadata?.book_mode ?? verified.metadata?.book_mode
        const capsule_id      = metadata?.capsule_id ?? verified.metadata?.capsule_id

        if (book_mode === 'gift' && recipient_email && capsule_slug) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/gift-notification`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ recipient_email, capsule_slug, capsule_id }),
            })
          } catch (giftErr) {
            console.error('[paystack webhook] Gift notification failed:', giftErr)
          }
        }

        console.log(`[paystack webhook] Payment confirmed and features unlocked — payment ${payment_id}`)
        break
      }

      // ── transfer.failed — payment reversal (future use) ───────────────────
      case 'transfer.failed': {
        console.warn('[paystack webhook] Transfer failed event received — no action taken')
        break
      }

      default:
        console.log(`[paystack webhook] Unhandled event: ${event.event}`)
    }
  } catch (err) {
    console.error('[paystack webhook] Handler error:', err)
    // Return 200 regardless — Paystack retries on non-200 responses
    // and we don't want infinite retries for handler bugs
  }

  // Always return 200 — Paystack expects this
  return NextResponse.json({ received: true })
}
