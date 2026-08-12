// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/payments/adapters/PaystackAdapter.ts
// PURPOSE:   Paystack checkout adapter. Creates a Paystack payment session
//            and returns the authorisation URL for redirect.
//            Called by PaymentService when zone is NG/GH/KE.
//            Verifies webhooks via HMAC-SHA512 signature.
// ARCHITECTURE: LC04 Payment Engine — Paystack Phase.
//               Mirrors StripeAdapter interface so PaymentService
//               can route to either adapter without branching logic.
//               Currency: NGN only at launch (Naira business account).
//               Amounts: stored in kobo (NGN × 100) — Paystack requires kobo.
// BUILT BY:  AI20 · Claude Opus 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.97
// DATE:      11 August 2026
//
// ENV REQUIRED:
//   PAYSTACK_SECRET_KEY     — sk_test_... or sk_live_... (server-only, no NEXT_PUBLIC_)
//   PAYSTACK_PUBLIC_KEY     — pk_test_... or pk_live_... (safe for client)
//   PAYSTACK_WEBHOOK_SECRET — from Paystack dashboard → Webhooks (fill after URL registered)
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'

// ═══ SECTION 1 — Config ═══

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE   = 'https://api.paystack.co'

// ═══ SECTION 2 — Types ═══

export interface PaystackCheckoutParams {
  payment_id:        string
  capsule_id:        string
  capsule_slug:      string
  tier:              string
  pricing_key:       string
  amount_for_stripe: number   // reused field — stores kobo amount for Paystack
  stripe_currency:   string   // reused field — stores 'ngn' for Paystack
  honouree_name:     string
  organiser_email:   string
  success_url:       string
  cancel_url:        string
  // Optional multi-feature support
  feature_ids?:      string[]
  line_items?:       Array<{ label: string; amount_kobo: number }>
}

export interface PaystackCheckoutResult {
  checkout_url:    string
  reference:       string
  access_code:     string
}

// ═══ SECTION 3 — Amount helper ═══
// Paystack requires NGN amounts in kobo (integer, × 100).
// amount_for_stripe field already stores kobo — no conversion needed.
// Guard: ensure always integer.

function toKobo(nairaAmount: number): number {
  return Math.round(nairaAmount * 100)
}

// ═══ SECTION 4 — Initialise transaction ═══
// POSTs to Paystack /transaction/initialize.
// Returns authorization_url (redirect), access_code, reference.

export async function createPaystackCheckout(
  params: PaystackCheckoutParams
): Promise<PaystackCheckoutResult> {
  if (!PAYSTACK_SECRET) {
    throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables')
  }

  // Build metadata for webhook recovery
  const metadata = {
    payment_id:   params.payment_id,
    capsule_id:   params.capsule_id,
    capsule_slug: params.capsule_slug,
    tier:         params.tier,
    pricing_key:  params.pricing_key,
    feature_ids:  params.feature_ids?.join(',') ?? params.pricing_key,
    cancel_url:   params.cancel_url,
    custom_fields: [
      {
        display_name: 'Capsule',
        variable_name: 'capsule_slug',
        value: params.capsule_slug,
      },
      {
        display_name: 'Honouree',
        variable_name: 'honouree_name',
        value: params.honouree_name,
      },
    ],
  }

  // Amount in kobo — params.amount_for_stripe already holds kobo value
  // (computed by PaymentService toStripeAmount which does × 100 for NGN)
  const amountKobo = params.amount_for_stripe

  const body = {
    email:        params.organiser_email,
    amount:       amountKobo,
    currency:     'NGN',
    reference:    `lc_${params.payment_id}`,
    callback_url: params.success_url,
    metadata,
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || !data.status) {
    console.error('[PaystackAdapter] Initialize failed:', data)
    throw new Error(data.message ?? 'Paystack transaction initialization failed')
  }

  return {
    checkout_url: data.data.authorization_url,
    reference:    data.data.reference,
    access_code:  data.data.access_code,
  }
}

// ═══ SECTION 5 — Verify transaction ═══
// Called by webhook handler after signature check passes.
// Hits Paystack /transaction/verify/:reference to confirm payment.
// Never trust the webhook payload amount alone — always verify server-side.

export async function verifyPaystackTransaction(reference: string): Promise<{
  status:   'success' | 'failed' | 'abandoned' | 'pending'
  amount:   number   // kobo
  currency: string
  metadata: Record<string, unknown>
  channel:  string
  paid_at:  string | null
}> {
  if (!PAYSTACK_SECRET) {
    throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables')
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  })

  const data = await res.json()

  if (!res.ok || !data.status) {
    throw new Error(data.message ?? 'Paystack verification failed')
  }

  const tx = data.data
  return {
    status:   tx.status,
    amount:   tx.amount,     // kobo
    currency: tx.currency,
    metadata: tx.metadata ?? {},
    channel:  tx.channel ?? 'unknown',
    paid_at:  tx.paid_at ?? null,
  }
}

// ═══ SECTION 6 — Webhook signature verification ═══
// Paystack signs webhooks with HMAC-SHA512 using the secret key.
// Verify before processing — reject anything that fails.
// PAYSTACK_WEBHOOK_SECRET env var must be set after registering
// the webhook URL in Paystack dashboard.

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY!
  if (!secret) {
    console.error('[PaystackAdapter] No webhook secret configured')
    return false
  }
  const hash = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex')
  return hash === signature
}

// ═══ SECTION 7 — Bundle checkout (multi-feature) ═══
// Used by checkout/bundle/route.ts for multi-feature purchases.
// Paystack does not have native line items — we sum the total
// and pass individual feature labels in metadata only.

export interface PaystackBundleParams {
  payment_id:    string
  capsule_id:    string
  capsule_slug:  string
  organiser_email: string
  feature_ids:   string[]
  feature_labels: string[]
  total_kobo:    number
  success_url:   string
  cancel_url:    string
  honouree_name: string
}

export async function createPaystackBundleCheckout(
  params: PaystackBundleParams
): Promise<PaystackCheckoutResult> {
  if (!PAYSTACK_SECRET) {
    throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables')
  }

  const metadata = {
    payment_id:    params.payment_id,
    capsule_id:    params.capsule_id,
    capsule_slug:  params.capsule_slug,
    feature_ids:   params.feature_ids.join(','),
    feature_count: String(params.feature_ids.length),
    cancel_url:    params.cancel_url,
    custom_fields: [
      {
        display_name:  'Capsule',
        variable_name: 'capsule_slug',
        value:         params.capsule_slug,
      },
      {
        display_name:  'Honouree',
        variable_name: 'honouree_name',
        value:         params.honouree_name,
      },
      {
        display_name:  'Services',
        variable_name: 'features',
        value:         params.feature_labels.join(', '),
      },
    ],
  }

  const body = {
    email:        params.organiser_email,
    amount:       params.total_kobo,
    currency:     'NGN',
    reference:    `lc_${params.payment_id}`,
    callback_url: params.success_url,
    metadata,
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || !data.status) {
    console.error('[PaystackAdapter] Bundle initialize failed:', data)
    throw new Error(data.message ?? 'Paystack bundle checkout failed')
  }

  return {
    checkout_url: data.data.authorization_url,
    reference:    data.data.reference,
    access_code:  data.data.access_code,
  }
}