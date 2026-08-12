// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/checkout/bundle/route.ts
// PURPOSE:   Multi-feature checkout for organiser Services tab.
//            Supports two preset bundles (Essential, Signature) that
//            auto-populate feature selections, and custom combinations.
//            Routes to Stripe (EUR/GBP/USD) or Paystack (NGN) by region.
//            Payment record stores comma-separated feature keys.
//            featureUnlocker handles all activations on webhook.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY:  Claude Sonnet 4.6 · July 2026
// UPDATED:   AI20 · Claude Opus 4.6 · 11 August 2026
//            — Paystack routing added for NG/GH/KE zones
//            — Essential + Signature preset key resolution added
//            — capsule_extend_3mo key support added
//            — FEATURE_LABELS updated: Digital Capsule Publication brand term
//            — Plain English errors throughout
//            — Stripe null-guarded (only loads when STRIPE_SECRET_KEY present)
//            — processor variable bug fixed (was referencing undefined var)
//            — try/catch brace structure corrected
// VERSION:   AI20v2.11.98
// DATE:      11 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse }    from 'next/server'
import { createClient }                 from '@supabase/supabase-js'
import Stripe                           from 'stripe'
import { detectRegionFromHeaders }      from '@/lib/payments/regionDetector'
import { getRegionalPrice }             from '@/lib/payments/priceFetcher'
import { createPaystackBundleCheckout } from '@/lib/payments/adapters/PaystackAdapter'

// ═══ SECTION 1 — Clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Stripe is optional — only initialised when key is present.
// At NGN-only launch, STRIPE_SECRET_KEY is not set.
// Build will not fail if key is absent.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })
  : null

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Feature label map ═══
// "Digital Capsule Publication" is the brand term — never abbreviated.

const FEATURE_LABELS: Record<string, string> = {
  audio_tributes:     'Voice Tributes',
  video_tributes:     'Video Tributes',
  ways_to_honour:     'Gift of Honour',
  publication:        'Digital Capsule Publication',
  guest_management:   'Guest Management & Seating',
  attire:             'Fabric & Attire Coordination',
  community_stories:  'Community Memories & Stories',
  extended_validity:  'Extended Validity',
  access_codes:       'Access Code System',
  additional_phase:   'Additional Event Phase',
  capsule_extend_3mo: 'Capsule Extension — 3 Months',
  capsule_activation: 'Capsule Activation',
}

// ═══ SECTION 3 — Preset compositions ═══
// Preset buttons in ServicesTab send preset_id — resolved here.
// Single source of truth for preset contents.

const PRESET_FEATURES: Record<string, string[]> = {
  essential: [
    'publication',
    'audio_tributes',
    'video_tributes',
    'capsule_extend_3mo',
  ],
  signature: [
    'publication',
    'audio_tributes',
    'video_tributes',
    'access_codes',
    'ways_to_honour',
    'additional_phase',
    'capsule_extend_3mo',
  ],
}

// ═══ SECTION 4 — Currency helpers ═══

function toStripeCurrency(currency: string): string {
  const map: Record<string, string> = {
    EUR: 'eur', GBP: 'gbp', USD: 'usd', CAD: 'cad',
    NGN: 'ngn', GHS: 'ghs', KES: 'kes',
  }
  return map[currency] ?? 'eur'
}

function toStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}

function isAfricanZone(zone: string): boolean {
  return ['NG', 'GH', 'KE'].includes(zone)
}

// ═══ SECTION 5 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id,
      capsule_slug,
      feature_ids,
      preset_id,
      organiser_email,
      recipient_name,
      recipient_email,
      book_mode,
      gift_deliver_at,
      source,
    } = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug are required.' },
        { status: 400 }
      )
    }

    // Resolve feature list — preset takes precedence over custom selection
    let resolvedFeatureIds: string[]
    if (preset_id && PRESET_FEATURES[preset_id]) {
      resolvedFeatureIds = PRESET_FEATURES[preset_id]
    } else if (feature_ids?.length) {
      resolvedFeatureIds = feature_ids as string[]
    } else {
      return NextResponse.json(
        { error: 'Either preset_id (essential or signature) or feature_ids array is required.' },
        { status: 400 }
      )
    }

    // ── Look up organiser email if not provided ────────────────────────────────
    let email = organiser_email?.trim() || ''
    if (!email) {
      const { data: cap } = await db
        .from('capsules')
        .select('organiser_email, honouree_name')
        .eq('id', capsule_id)
        .maybeSingle()
      email = cap?.organiser_email ?? ''
    }

    // ── Detect region ─────────────────────────────────────────────────────────
    const zone        = detectRegionFromHeaders(req as unknown as Request) ?? 'ROW'
    const usePaystack = isAfricanZone(zone)

    // ── Fetch prices for all features ─────────────────────────────────────────
    const priceResults = await Promise.allSettled(
      resolvedFeatureIds.map((id: string) => getRegionalPrice(id, zone))
    )

    const validFeatureIds:    string[] = []
    const validFeatureLabels: string[] = []
    let   totalAmount                   = 0
    let   resolvedCurrency              = usePaystack ? 'NGN' : 'EUR'
    const lineItems: any[]              = []

    for (let i = 0; i < resolvedFeatureIds.length; i++) {
      const result = priceResults[i]
      if (result.status === 'rejected' || !result.value) {
        console.warn(`[checkout/bundle] No published price for: ${resolvedFeatureIds[i]} in zone ${zone} — skipped`)
        continue
      }

      const price          = result.value
      const stripeAmount   = toStripeAmount(price.amount)
      const stripeCurrency = toStripeCurrency(price.currency)

      if (!stripeCurrency || stripeAmount <= 0) {
        console.warn(`[checkout/bundle] Invalid price for ${resolvedFeatureIds[i]}`)
        continue
      }

      validFeatureIds.push(resolvedFeatureIds[i])
      validFeatureLabels.push(FEATURE_LABELS[resolvedFeatureIds[i]] ?? resolvedFeatureIds[i])
      totalAmount      += price.amount
      resolvedCurrency  = price.currency

      lineItems.push({
        price_data: {
          currency:     stripeCurrency,
          unit_amount:  stripeAmount,
          product_data: {
            name:        `LegacyCapsule — ${FEATURE_LABELS[resolvedFeatureIds[i]] ?? resolvedFeatureIds[i]}`,
            description: `For capsule: ${capsule_slug}`,
          },
        },
        quantity: 1,
      })
    }

    if (validFeatureIds.length === 0) {
      return NextResponse.json(
        { error: 'No published prices found for the selected features. Please try again.' },
        { status: 400 }
      )
    }

    // ── Create payment record ─────────────────────────────────────────────────
    const packageTier = ['capsule_activation', ...validFeatureIds].join(',')

    const { data: payment, error: paymentError } = await db
      .from('payments')
      .insert({
        capsule_id,
        processor:    usePaystack ? 'paystack' : 'stripe',
        amount:       totalAmount,
        currency:     resolvedCurrency,
        package_tier: packageTier,
        status:       'pending',
        region:       zone,
        metadata: {
          book_mode:       book_mode ?? 'own',
          preset_id:       preset_id ?? null,
          recipient_name:  recipient_name ?? null,
          recipient_email: recipient_email ?? null,
          feature_ids:     validFeatureIds,
          feature_count:   validFeatureIds.length,
        },
      })
      .select('id')
      .single()

    if (paymentError || !payment) {
      throw new Error(`Failed to create payment record: ${paymentError?.message}`)
    }

    const successUrl = `${APP_URL}/manage/${capsule_slug}?payment=success`
    const cancelUrl  = source === 'dashboard'
      ? `${APP_URL}/manage/${capsule_slug}?tab=services&payment=cancelled`
      : `${APP_URL}/book?payment=cancelled&slug=${capsule_slug}&pid=${payment.id}`

    // ── PAYSTACK PATH — NGN, NG/GH/KE zones ──────────────────────────────────
    if (usePaystack) {
      const totalKobo = Math.round(totalAmount * 100)

      const result = await createPaystackBundleCheckout({
        payment_id:      payment.id,
        capsule_id,
        capsule_slug,
        organiser_email: email,
        feature_ids:     validFeatureIds,
        feature_labels:  validFeatureLabels,
        total_kobo:      totalKobo,
        success_url:     successUrl,
        cancel_url:      cancelUrl,
        honouree_name:   body.honouree_name ?? capsule_slug,
      })

      return NextResponse.json({
        checkout_url:  result.checkout_url,
        payment_id:    payment.id,
        amount:        totalAmount,
        currency:      resolvedCurrency,
        processor:     'paystack',
        feature_count: validFeatureIds.length,
      })
    }

    // ── STRIPE PATH — EUR/GBP/USD, all other zones ────────────────────────────
    // Stripe is optional at launch — only available when STRIPE_SECRET_KEY is set.
    if (!stripe) {
      return NextResponse.json(
        { error: 'International payments are not yet available. Please contact us to complete your order.' },
        { status: 503 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode:           'payment',
      customer_email: email || undefined,
      line_items:     lineItems,
      metadata: {
        payment_id:      payment.id,
        capsule_id,
        capsule_slug,
        preset_id:       preset_id ?? '',
        book_mode:       book_mode ?? 'own',
        recipient_email: recipient_email ?? '',
        gift_deliver_at: gift_deliver_at ?? '',
        feature_ids:     validFeatureIds.join(','),
        feature_count:   String(validFeatureIds.length),
      },
      success_url: successUrl,
      cancel_url:  cancelUrl,
    })

    if (!session.url) throw new Error('Stripe did not return a session URL.')

    return NextResponse.json({
      checkout_url:  session.url,
      payment_id:    payment.id,
      amount:        totalAmount,
      currency:      resolvedCurrency,
      processor:     'stripe',
      feature_count: validFeatureIds.length,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[checkout/bundle]', message)
    return NextResponse.json(
      { error: 'Something went wrong processing your order. Please try again.' },
      { status: 500 }
    )
  }
}