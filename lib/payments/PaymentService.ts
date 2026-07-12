// -----------------------------------------------------------------------------
// lib/payments/PaymentService.ts
// Unified payment orchestrator. All API routes call this, never an adapter
// directly. Handles: region detection, price fetching, payment record creation,
// processor routing, and payment status updates.
//
// Route map (current):
//   Public tribute wall:  /for/[slug]
//   Organiser manage:     /manage/[slug]
//   Submit:               /for/[slug]/submit
//
// Phase 1: Stripe only.
// Phase 2: add 'paystack' case to createCheckout() for NG/GH/KE zones.
// -----------------------------------------------------------------------------

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
import { createClient }          from '@supabase/supabase-js'
import { detectRegion }          from './regionDetector'
import { getPrices, getRegionalPrice, convertToRegionalAmount, PriceRecord } from './priceFetcher'
import { createCheckoutSession } from './adapters/StripeAdapter'

// ─── DB CLIENT (server-only) ──────────────────────────────────────────────────
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── REGIONAL HELPERS ─────────────────────────────────────────────────────────
function getCurrencyForRegion(zone: string): string {
  const map: Record<string, string> = {
    UK: 'GBP', US: 'USD', CA: 'CAD',
    NG: 'NGN', GH: 'GHS', KE: 'KES',
  }
  return map[zone] ?? 'EUR'
}

function getCurrencySymbol(zone: string): string {
  const map: Record<string, string> = {
    UK: '£', US: '$', CA: 'CA$',
    NG: '₦', GH: '₵', KE: 'KSh',
  }
  return map[zone] ?? '€'
}

// Stripe requires amount in smallest currency unit (cents/kobo/pence)
// NGN is not a zero-decimal currency — use kobo (× 100)
function toStripeAmount(amount: number, currency: string): number {
  const zeroDecimal = ['JPY', 'KRW', 'VND']
  return zeroDecimal.includes(currency) ? amount : Math.round(amount * 100)
}

function toStripeCurrency(currency: string): string {
  return currency.toLowerCase()
}

interface RegionalPriceResult {
  amount:            number
  currency:          string
  symbol:            string
  amount_for_stripe: number
  stripe_currency:   string
}

function buildRegionalPrice(record: PriceRecord, zone: string): RegionalPriceResult {
  const amount   = convertToRegionalAmount(record, zone)
  const currency = getCurrencyForRegion(zone)
  return {
    amount,
    currency,
    symbol:            getCurrencySymbol(zone),
    amount_for_stripe: toStripeAmount(amount, currency),
    stripe_currency:   toStripeCurrency(currency),
  }
}

// ─── PROCESSOR ROUTING ────────────────────────────────────────────────────────
// Phase 1: all zones → Stripe.
// Phase 2: NG, GH, KE → Paystack. Uncomment when PaystackAdapter is ready.
function getProcessorForZone(zone_key: string): 'stripe' /* | 'paystack' */ {
  // const africanZones = ['NG', 'GH', 'KE']
  // if (africanZones.includes(zone_key)) return 'paystack'
  return 'stripe'
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface InitiateCheckoutParams {
  capsule_id:      string
  capsule_slug:    string
  tier:            'honour' | 'premier'
  pricing_keys:    string[]
  honouree_name:   string
  organiser_email: string
  reseller_code?:  string
  community_id?:   string
  ip:              string
}

export interface CheckoutResult {
  checkout_url: string
  payment_id:   string
  processor:    string
  amount:       number
  currency:     string
}

// ─── INITIATE CHECKOUT ────────────────────────────────────────────────────────
export async function initiateCheckout(
  params: InitiateCheckoutParams
): Promise<CheckoutResult> {

  // Step 1: detect region from IP
  const zone_key  = await detectRegion(params.ip)
  const processor = getProcessorForZone(zone_key)

  // Step 2: fetch all regional prices
  const priceRecords = await getPrices(params.pricing_keys)
  if (!priceRecords.length) {
    throw new Error(`No prices found for keys: ${params.pricing_keys.join(', ')}`)
  }

  const primary = buildRegionalPrice(priceRecords[0], zone_key)

  // Step 3: create payment record BEFORE redirecting — allows recovery of
  // abandoned checkouts without duplicate capsule creation
  const { data: paymentRecord, error: insertError } = await db
    .from('payments')
    .insert({
      capsule_id:    params.capsule_id,
      community_id:  params.community_id ?? null,
      processor,
      amount:        primary.amount,
      currency:      primary.currency,
      package_tier:  params.pricing_keys.join(','),
      status:        'pending',
      region:        zone_key,
      reseller_code: params.reseller_code ?? null,
    })
    .select('id')
    .single()

  if (insertError || !paymentRecord) {
    throw new Error(`Failed to create payment record: ${insertError?.message}`)
  }

  // Step 4: route to processor adapter
  if (processor === 'stripe') {
    const result = await createCheckoutSession({
      payment_id:        paymentRecord.id,
      capsule_id:        params.capsule_id,
      capsule_slug:      params.capsule_slug,
      tier:              params.tier,
      pricing_key:       params.pricing_keys[0],
      amount_for_stripe: primary.amount_for_stripe,
      stripe_currency:   primary.stripe_currency,
      honouree_name:     params.honouree_name,
      organiser_email:   params.organiser_email,
      success_url: `${APP_URL}/manage/${params.capsule_slug}?payment=success`,
      cancel_url:  `${APP_URL}/book?payment=cancelled&slug=${params.capsule_slug}&pid=${paymentRecord.id}`,
    })

    return {
      checkout_url: result.checkout_url,
      payment_id:   paymentRecord.id,
      processor:    'stripe',
      amount:       primary.amount,
      currency:     primary.currency,
    }
  }

  throw new Error(`No adapter configured for processor: ${processor}`)
}

// ─── CONFIRM PAYMENT ─────────────────────────────────────────────────────────
// Called by webhook handler after signature verified.
// Updates payment record to succeeded. featureUnlocker then sets page_state: active.
export async function confirmPayment(
  payment_id:              string,
  processor_ref:           string,
  webhook_event:           string,
  stripe_session_id?:      string,
  stripe_payment_intent?:  string
): Promise<void> {
  const { error } = await db
    .from('payments')
    .update({
      status:                'succeeded',
      processor_ref,
      webhook_event,
      stripe_session_id:     stripe_session_id ?? null,
      stripe_payment_intent: stripe_payment_intent ?? null,
      paid_at:               new Date().toISOString(),
      updated_at:            new Date().toISOString(),
    })
    .eq('id', payment_id)

  if (error) {
    throw new Error(`Failed to confirm payment ${payment_id}: ${error.message}`)
  }
}

// ─── INITIATE FEATURE CHECKOUT ───────────────────────────────────────────────
// For individual feature purchases (audio_tributes, publication, etc.).
// Distinct from initiateCheckout which handles base tier capsule creation.
// On success: webhook → unlockCapsuleFeatures → component added to capsule.

export interface InitiateFeatureCheckoutParams {
  capsule_id:      string
  capsule_slug:    string
  feature_id:      string
  price_key:       string
  organiser_email: string
  ip:              string
}

export async function initiateFeatureCheckout(
  params: InitiateFeatureCheckoutParams
): Promise<CheckoutResult> {

  const zone_key    = await detectRegion(params.ip)
  const processor   = getProcessorForZone(zone_key)

  const priceRecord = await getRegionalPrice(params.price_key, zone_key)
  if (!priceRecord) {
    throw new Error(`Price not found for key: ${params.price_key}`)
  }

  const primary = {
    amount:            priceRecord.amount,
    currency:          priceRecord.currency,
    symbol:            priceRecord.symbol,
    amount_for_stripe: toStripeAmount(priceRecord.amount, priceRecord.currency),
    stripe_currency:   toStripeCurrency(priceRecord.currency),
  }

  const { data: paymentRecord, error: insertError } = await db
    .from('payments')
    .insert({
      capsule_id:    params.capsule_id,
      processor,
      amount:        primary.amount,
      currency:      primary.currency,
      package_tier:  params.price_key,
      status:        'pending',
      region:        zone_key,
    })
    .select('id')
    .single()

  if (insertError || !paymentRecord) {
    throw new Error(`Failed to create feature payment record: ${insertError?.message}`)
  }

  if (processor === 'stripe') {
    const result = await createCheckoutSession({
      payment_id:        paymentRecord.id,
      capsule_id:        params.capsule_id,
      capsule_slug:      params.capsule_slug,
      tier:              'feature' as any,
      pricing_key:       params.price_key,
      amount_for_stripe: primary.amount_for_stripe,
      stripe_currency:   primary.stripe_currency,
      honouree_name:     params.feature_id,
      organiser_email:   params.organiser_email,
      success_url: `${APP_URL}/manage/${params.capsule_slug}?payment=success&feature=${params.feature_id}`,
      cancel_url:  `${APP_URL}/manage/${params.capsule_slug}?payment=cancelled`,
    })

    return {
      checkout_url: result.checkout_url,
      payment_id:   paymentRecord.id,
      processor:    'stripe',
      amount:       primary.amount,
      currency:     primary.currency,
    }
  }

  throw new Error(`No adapter configured for processor: ${processor}`)
}

// ─── FAIL PAYMENT ─────────────────────────────────────────────────────────────
// Called by webhook on payment_intent.payment_failed.
export async function failPayment(
  payment_id: string,
  reason:     string
): Promise<void> {
  await db
    .from('payments')
    .update({
      status:     'failed',
      metadata:   { failure_reason: reason },
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment_id)
}
