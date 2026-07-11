// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/checkout/bundle/route.ts
// PURPOSE: Single Stripe checkout session for multiple feature purchases.
//          Used by Book a Capsule journey (Screen 3 services selector).
//          Creates one Stripe session with multiple line items.
//          Payment record stores comma-separated feature keys.
//          featureUnlocker handles all activations on webhook.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { detectRegion } from '@/lib/payments/regionDetector'
import { getRegionalPrice } from '@/lib/payments/priceFetcher'

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
  ways_to_honour:    'Expression of Honour',
  publication:       'Digital Publication',
  guest_management:  'Guest Management',
  attire:            'Fabric & Attire',
  community_stories: 'Community Stories',
  extended_validity: 'Extended Validity',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Route handler
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
    if (!capsule_id || !capsule_slug || !feature_ids?.length || !organiser_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Detect region ─────────────────────────────────────────────────────────
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
    const zone = await detectRegion(ip) ?? 'ROW'

    // ── Fetch prices for all selected features ────────────────────────────────
    const priceResults = await Promise.allSettled(
      feature_ids.map((id: string) => getRegionalPrice(id, zone))
    )

    const lineItems: Array<{ price_data: { currency: string; unit_amount: number; product_data: { name: string; description: string } }; quantity: number }> = [] as any
    const validFeatureIds: string[] = []
    let totalAmount = 0
    let currency = ''
    let stripeAmount = 0

    for (let i = 0; i < feature_ids.length; i++) {
      const result = priceResults[i]
      if (result.status === 'rejected') {
        console.warn(`[checkout/bundle] Skipped unpublished feature: ${feature_ids[i]}`)
        continue
      }
      const price = result.value
      validFeatureIds.push(feature_ids[i])
      totalAmount += price.amount
      currency = price.currency
      stripeAmount += price.amount_for_stripe

      lineItems.push({
        price_data: {
          currency: price.stripe_currency,
          unit_amount: price.amount_for_stripe,
          product_data: {
            name: `LegacyCapsule — ${FEATURE_LABELS[feature_ids[i]] ?? feature_ids[i]}`,
            description: `Premium feature for ${capsule_slug}`,
          },
        },
        quantity: 1,
      })
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No published prices found for selected features' }, { status: 400 })
    }

    // ── Include capsule_activation in package_tier for featureUnlocker ────────
    const packageTier = ['capsule_activation', ...validFeatureIds].join(',')

    // ── Create payment record ─────────────────────────────────────────────────
    const { data: payment, error: paymentError } = await db
      .from('payments')
      .insert({
        capsule_id,
        processor: 'stripe',
        amount: totalAmount,
        currency,
        package_tier: packageTier,
        status: 'pending',
        region: zone,
        metadata: {
          book_mode: book_mode ?? 'own',
          recipient_name: recipient_name ?? null,
          recipient_email: recipient_email ?? null,
          feature_count: validFeatureIds.length,
        },
      })
      .select('id')
      .single()

    if (paymentError || !payment) {
      throw new Error(`Failed to create payment record: ${paymentError?.message}`)
    }

    // ── Create Stripe checkout session ────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: organiser_email,
      line_items: lineItems,
      metadata: {
        payment_id: payment.id,
        capsule_id,
        capsule_slug,
        book_mode: book_mode ?? 'own',
        recipient_email: recipient_email ?? '',
      },
      success_url: `${APP_URL}/manage/${capsule_slug}?payment=success`,
      cancel_url: `${APP_URL}/book?payment=cancelled&slug=${capsule_slug}&pid=${payment.id}`,
    })

    if (!session.url) throw new Error('Stripe did not return a session URL')

    return NextResponse.json({
      checkout_url: session.url,
      payment_id: payment.id,
      amount: totalAmount,
      currency,
      feature_count: validFeatureIds.length,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[checkout/bundle]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
