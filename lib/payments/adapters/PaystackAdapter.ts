// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/payments/adapters/PaystackAdapter.ts
// PURPOSE: Paystack-specific implementation. Mirrors StripeAdapter shape.
//          Never called directly by API routes — always via PaymentService.
//          Used for NG, GH, KE zones (African market).
//          Uses Paystack REST API directly — no SDK dependency.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Config
// ─────────────────────────────────────────────────────────────────────────────

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL   = 'https://api.paystack.co'

function paystackHeaders() {
  return {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type':  'application/json',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Types
// Mirrors StripeCheckoutParams / StripeCheckoutResult shape
// ─────────────────────────────────────────────────────────────────────────────

export interface PaystackCheckoutParams {
  payment_id:        string   // our internal payments.id — embedded in reference
  capsule_id:        string
  capsule_slug:      string
  tier:              string
  pricing_key:       string
  amount_for_stripe: number   // reused field — value is in smallest currency unit (kobo for NGN)
  stripe_currency:   string   // reused field — e.g. 'ngn', 'ghs'
  honouree_name:     string
  organiser_email:   string
  success_url:       string
  cancel_url:        string
}

export interface PaystackCheckoutResult {
  checkout_url: string
  reference:    string   // Paystack transaction reference
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Create checkout (initialize transaction)
// Paystack equivalent of Stripe's createCheckoutSession
// reference format: lc_<payment_id> — allows easy extraction in webhook
// ─────────────────────────────────────────────────────────────────────────────

export async function createPaystackCheckout(
  params: PaystackCheckoutParams
): Promise<PaystackCheckoutResult> {

  const reference = `lc_${params.payment_id}`
  const currency  = params.stripe_currency.toUpperCase() // Paystack expects uppercase

  const body = {
    email:        params.organiser_email,
    amount:       params.amount_for_stripe, // already in kobo/pesewas
    currency,
    reference,
    callback_url: params.success_url,
    metadata: {
      payment_id:    params.payment_id,
      capsule_id:    params.capsule_id,
      capsule_slug:  params.capsule_slug,
      tier:          params.tier,
      pricing_key:   params.pricing_key,
      honouree_name: params.honouree_name,
      cancel_url:    params.cancel_url,
    },
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method:  'POST',
    headers: paystackHeaders(),
    body:    JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(`Paystack initialization failed: ${data.message ?? 'Unknown error'}`)
  }

  return {
    checkout_url: data.data.authorization_url,
    reference:    data.data.reference,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Verify webhook signature
// Paystack signs webhooks with HMAC-SHA512
// Header: x-paystack-signature
// Must receive raw body string — never parsed JSON
// ─────────────────────────────────────────────────────────────────────────────

export interface PaystackWebhookEvent {
  event: string
  data:  {
    reference:  string
    status:     string
    amount:     number
    currency:   string
    metadata:   Record<string, string>
    paid_at:    string | null
    customer:   { email: string }
  }
}

export function verifyPaystackSignature(
  payload:   string,
  signature: string
): PaystackWebhookEvent {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex')

  if (hash !== signature) {
    throw new Error('Invalid Paystack webhook signature')
  }

  return JSON.parse(payload) as PaystackWebhookEvent
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Verify transaction (called after webhook to confirm status)
// ─────────────────────────────────────────────────────────────────────────────

export interface PaystackVerifyResult {
  status:    'success' | 'failed' | 'abandoned'
  reference: string
  amount:    number
  currency:  string
  metadata:  Record<string, string>
  paid_at:   string | null
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: paystackHeaders() }
  )

  const data = await res.json()

  if (!res.ok || !data.status) {
    throw new Error(`Paystack verify failed: ${data.message ?? 'Unknown error'}`)
  }

  return {
    status:    data.data.status,
    reference: data.data.reference,
    amount:    data.data.amount,
    currency:  data.data.currency,
    metadata:  data.data.metadata ?? {},
    paid_at:   data.data.paid_at ?? null,
  }
}
