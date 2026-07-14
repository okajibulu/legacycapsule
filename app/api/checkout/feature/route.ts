// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/checkout/feature/route.ts
// PURPOSE: Stripe Checkout for individual feature purchases.
//          Distinct from /api/checkout which handles base tier purchases.
//          Each feature maps to a price key in lc_pricing.
//          On payment: webhook → confirmPayment → unlockCapsuleFeatures →
//          component added to capsule.components → UI updates on next load.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { initiateFeatureCheckout } from '@/lib/payments/PaymentService'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Feature → price key map
// Maps the component/feature ID (used in capsule.components and UI) to the
// price key used in lc_pricing table. Keep in sync with featureUnlocker.ts.
// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_PRICE_KEYS: Record<string, string> = {
  audio_tributes:    'audio_tributes',
  video_tributes:    'video_tributes',
  ways_to_honour:    'ways_to_honour',
  expression_of_honour:    'ways_to_honour',
  publication:       'publication',
  guest_management:  'guest_management',
  attire:            'attire',
  community_stories: 'community_stories',
  access_codes:      'access_codes',
  additional_phase:  'additional_phase',
  extended_validity: 'extended_validity',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, capsule_slug, feature_id, organiser_email } = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!capsule_id || !capsule_slug || !feature_id || !organiser_email) {
      return NextResponse.json(
        { error: 'Missing required fields: capsule_id, capsule_slug, feature_id, organiser_email' },
        { status: 400 }
      )
    }

    const price_key = FEATURE_PRICE_KEYS[feature_id]
    if (!price_key) {
      return NextResponse.json(
        { error: `Unknown feature: ${feature_id}` },
        { status: 400 }
      )
    }

    // ── Get client IP for regional pricing ────────────────────────────────────
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '0.0.0.0'

    // ── Initiate feature checkout ─────────────────────────────────────────────
    const result = await initiateFeatureCheckout({
      capsule_id,
      capsule_slug,
      feature_id,
      price_key,
      organiser_email,
      ip,
    })

    return NextResponse.json(result)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[/api/checkout/feature]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
