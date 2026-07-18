// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/checkout/bundle/route.ts
// PURPOSE: Single Stripe checkout session for multiple feature purchases.
//          Used by Book a Capsule journey (Screen 3 services selector).
//          Creates one Stripe session with multiple line items.
//          Payment record stores comma-separated feature keys.
//          featureUnlocker handles all activations on webhook.
// UPDATED: Claude Sonnet 4.6 · July 2026
//   — Fixed: price.stripe_currency → derived from price.currency
//   — Fixed: price.amount_for_stripe → computed from price.amount + currency
//   — Fixed: ways_to_honour label updated to Gift of Honour
//   — Added: access_codes, additional_phase to FEATURE_LABELS
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import Stripe                        from 'stripe'
import { detectRegion }              from '@/lib/payments/regionDetector'
import { getRegionalPrice }          from '@/lib/payments/priceFetcher'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Clients
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Feature label map (for Stripe line item display)
// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  audio_tributes:    'Voice Tributes',
  video_tributes:    'Video Tributes',
  ways_to_honour:    'Gift of Honour',
  publication:       'Digital Publication',
  guest_management:  'Guest Management & Seating',
  attire:            'Fabric & Attire',
  community_stories: 'Community Memories & Stories',
  extended_validity: 'Extended Validity',
  access_codes:      'Access Code System',
  additional_phase:  'Additional Event Phase',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Currency helpers
// Stripe requires amounts in minor units (cents/kobo) for most currencies.
// NGN is NOT a zero-decimal currency — amounts in kobo (x100).
// ─────────────────────────────────────────────────────────────────────────────

/** Map RegionalPrice currency to Stripe currency code (lowercase) */
function toStripeCurrency(currency: string): string {
  const map: Record<string, string> = {
    EUR: 'eur', GBP: 'gbp', USD: 'usd', CAD: 'cad',
    NGN: 'ngn', GHS: 'ghs', KES: 'kes',
  }
  return map[currency] ?? 'eur'
}

/** Convert display amount to Stripe minor units */
function toStripeAmount(amount: number, currency: string): number {
  // All currencies here use 2 decimal places (minor unit = 1/100)
  return Math.round(amount * 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id,
      capsule_slug,
      feature_ids,
      organiser_email,
      recipient_name,
      recipient_email,
      book_mode,
    } = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!capsule_id || !capsule_slug || !feature_ids?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // organiser_email can be empty string — look it up from capsule if missing
    let email = organiser_email?.trim() || ''
    if (!email) {
      const { data: cap } = await db
        .from('capsules')
        .select('organiser_email')
        .eq('id', capsule_id)
        .maybeSingle()
      email = cap?.organiser_email ?? ''
    }

    // ── Detect region ─────────────────────────────────────────────────────────
    const forwarded = req.headers.get('x-forwarded-for')
    const ip        = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
    const zone      = await detectRegion(ip) ?? 'ROW'

    // ── Fetch prices for all selected features ────────────────────────────────
    const priceResults = await Promise.allSettled(
      (feature_ids as string[]).map((id: string) => getRegionalPrice(id, zone))
    )

const lineItems: any[] = []    
const validFeatureIds: string[] = []
    let totalAmount  = 0
    let resolvedCurrency = 'EUR'

    for (let i = 0; i < feature_ids.length; i++) {
      const result = priceResults[i]

      if (result.status === 'rejected' || !result.value) {
        console.warn(`[checkout/bundle] Skipped — no published price for: ${feature_ids[i]}`)
        continue
      }

      const price          = result.value  // { amount, currency, symbol, region }
      const stripeCurrency = toStripeCurrency(price.currency)
      const stripeAmount   = toStripeAmount(price.amount, price.currency)

      if (!stripeCurrency || stripeAmount <= 0) {
        console.warn(`[checkout/bundle] Invalid price for ${feature_ids[i]}: currency=${price.currency} amount=${price.amount}`)
        continue
      }

      validFeatureIds.push(feature_ids[i])
      totalAmount      += price.amount
      resolvedCurrency  = price.currency

      lineItems.push({
        price_data: {
          currency:     stripeCurrency,
          unit_amount:  stripeAmount,
          product_data: {
            name:        `LegacyCapsule — ${FEATURE_LABELS[feature_ids[i]] ?? feature_ids[i]}`,
            description: `Premium feature for ${capsule_slug}`,
          },
        },
        quantity: 1,
      })
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No published prices found for selected features' },
        { status: 400 }
      )
    }

    // ── Create payment record ─────────────────────────────────────────────────
    const packageTier = ['capsule_activation', ...validFeatureIds].join(',')

    const { data: payment, error: paymentError } = await db
      .from('payments')
      .insert({
        capsule_id,
        processor:    'stripe',
        amount:       totalAmount,
        currency:     resolvedCurrency,
        package_tier: packageTier,
        status:       'pending',
        region:       zone,
        metadata: {
          book_mode:       book_mode ?? 'own',
          recipient_name:  recipient_name ?? null,
          recipient_email: recipient_email ?? null,
          feature_count:   validFeatureIds.length,
        },
      })
      .select('id')
      .single()

    if (paymentError || !payment) {
      throw new Error(`Failed to create payment record: ${paymentError?.message}`)
    }

    // ── Create Stripe checkout session ────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode:           'payment',
      customer_email: email || undefined,
      line_items:     lineItems,
      metadata: {
        payment_id:      payment.id,
        capsule_id,
        capsule_slug,
        book_mode:       book_mode ?? 'own',
        recipient_email: recipient_email ?? '',
      },
      success_url: `${APP_URL}/manage/${capsule_slug}?payment=success`,
      cancel_url:  `${APP_URL}/book?payment=cancelled&slug=${capsule_slug}&pid=${payment.id}`,
    })

    if (!session.url) throw new Error('Stripe did not return a session URL')

    return NextResponse.json({
      checkout_url:  session.url,
      payment_id:    payment.id,
      amount:        totalAmount,
      currency:      resolvedCurrency,
      feature_count: validFeatureIds.length,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[checkout/bundle]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
