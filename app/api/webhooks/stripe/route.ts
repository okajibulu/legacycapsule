// ─────────────────────────────────────────────────────────────────────────────
// app/api/webhooks/stripe/route.ts
// Stripe sends signed events here after payment events.
// CRITICAL: Never trust the success URL redirect — only this webhook confirms
// a real payment. Signature verification is mandatory and runs first.
// Raw body parsing required — body parsers corrupt the Stripe signature.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature }   from '@/lib/payments/adapters/StripeAdapter'
import { confirmPayment, failPayment } from '@/lib/payments/PaymentService'
import { unlockCapsuleFeatures }   from '@/lib/payments/featureUnlocker'


// ── POST /api/webhooks/stripe ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── READ RAW BODY ────────────────────────────────────────────────────────
  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // ── VERIFY SIGNATURE ─────────────────────────────────────────────────────
  let event
  try {
    event = verifyWebhookSignature(payload, signature)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signature failure'
    console.error('[stripe webhook] Signature verification failed:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── ROUTE BY EVENT TYPE ───────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── PAYMENT CONFIRMED ───────────────────────────────────────────────
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

        console.log(`[stripe webhook] Payment confirmed and features unlocked — payment ${payment_id}`)
        break
      }

      // ── PAYMENT FAILED ──────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const intent     = event.data.object as unknown as Record<string, unknown>
        const metadata   = (intent.metadata as Record<string, string>) ?? {}
        const payment_id = metadata.payment_id

        if (!payment_id) break

        const reason = (intent.last_payment_error as Record<string, string> | undefined)?.message ?? 'Payment failed'
        await failPayment(payment_id, reason)

        console.log(`[stripe webhook] Payment failed — payment ${payment_id}: ${reason}`)
        break
      }

      // ── SUBSCRIPTION EVENTS (Phase 2 — stubs) ──────────────────────────
      // Add full handlers here in Phase 2 when subscription products go live.
      case 'customer.subscription.created':
      case 'invoice.paid':
      case 'customer.subscription.deleted': {
        console.log(`[stripe webhook] Subscription event received — ${event.type} (Phase 2 handler pending)`)
        break
      }

      default:
        // Log unhandled events — useful for debugging, not an error
        console.log(`[stripe webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Handler error'
    console.error('[stripe webhook] Handler error:', msg)
    // Return 200 to Stripe even on handler error — prevents Stripe retrying
    // indefinitely. Internal error should be investigated separately.
    return NextResponse.json({ received: true, warning: msg })
  }

  return NextResponse.json({ received: true })
}
