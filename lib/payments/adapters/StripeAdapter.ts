// ─────────────────────────────────────────────────────────────────────────────
// StripeAdapter.ts
// Stripe-specific implementation. Translates PaymentService interface calls
// into Stripe API calls. Never called directly by API routes — always via
// PaymentService. Adding Paystack = adding PaystackAdapter.ts with same shape.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe'

// ── STRIPE CLIENT (server-only) ───────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ── TYPES ─────────────────────────────────────────────────────────────────────
export interface StripeCheckoutParams {
  payment_id:       string   // our internal payments.id — goes into metadata
  capsule_id:       string
  capsule_slug:     string
  tier:             string
  pricing_key:      string
  amount_for_stripe: number  // integer in cents (or base for zero-decimal)
  stripe_currency:  string   // lowercase: 'eur', 'gbp', 'ngn'
  honouree_name:    string
  organiser_email:  string
  success_url:      string
  cancel_url:       string
}

export interface StripeCheckoutResult {
  checkout_url: string
  session_id:   string
}

// ── CREATE CHECKOUT SESSION ───────────────────────────────────────────────────
// payment_method_types omitted intentionally — Stripe auto-presents
// Apple Pay and Google Pay when not specified. Card always available.
export async function createCheckoutSession(
  params: StripeCheckoutParams
): Promise<StripeCheckoutResult> {
  const tierLabel = params.tier === 'honour' ? 'Legacy Honour' : 'Legacy Premier'

  const session = await stripe.checkout.sessions.create({
    mode:           'payment',
    customer_email: params.organiser_email,
    line_items: [
      {
        price_data: {
          currency:     params.stripe_currency,
          unit_amount:  params.amount_for_stripe,
          product_data: {
            name:        `LegacyCapsule — ${tierLabel}`,
            description: `Memorial capsule for ${params.honouree_name}`,
          },
        },
        quantity: 1,
      },
    ],
    // ── METADATA — all fields needed by webhook ────────────────────────────
    // payment_id is the critical link — webhook uses this to update our DB
    metadata: {
      payment_id:   params.payment_id,
      capsule_id:   params.capsule_id,
      capsule_slug: params.capsule_slug,
      tier:         params.tier,
      pricing_key:  params.pricing_key,
    },
    success_url: params.success_url,
    cancel_url:  params.cancel_url,
  })

  if (!session.url) throw new Error('Stripe did not return a session URL')

  return {
    checkout_url: session.url,
    session_id:   session.id,
  }
}

// ── VERIFY WEBHOOK SIGNATURE ──────────────────────────────────────────────────
// Must receive raw body (string/Buffer) — never parsed JSON
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// ── CREATE SUBSCRIPTION (Phase 2) ────────────────────────────────────────────
// Stub included now so the adapter shape is complete. Activate in Phase 2.
export async function createSubscriptionSession(params: {
  customer_email: string
  stripe_price_id: string  // from STRIPE_PRICE_PLANNER_MONTHLY or STRIPE_PRICE_ARCHIVE_ANNUAL
  payment_id: string
  metadata: Record<string, string>
}): Promise<StripeCheckoutResult> {
  const customers = await stripe.customers.list({ email: params.customer_email, limit: 1 })
  const customer  = customers.data[0] ?? await stripe.customers.create({ email: params.customer_email })

  const session = await stripe.checkout.sessions.create({
    mode:     'subscription',
    customer: customer.id,
    line_items: [{ price: params.stripe_price_id, quantity: 1 }],
    metadata:   { payment_id: params.payment_id, ...params.metadata },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?sub=success`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  })

  if (!session.url) throw new Error('Stripe subscription session returned no URL')

  return { checkout_url: session.url, session_id: session.id }
}
