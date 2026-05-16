// ─────────────────────────────────────────────────────────────────────────────
// app/api/checkout/route.ts
// Called by booking flow Screen 4 when user selects a paid tier.
// Returns: { checkout_url, payment_id, amount, currency }
// Client immediately redirects to checkout_url.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { initiateCheckout } from '@/lib/payments/PaymentService'

// ── POST /api/checkout ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── PARSE REQUEST ───────────────────────────────────────────────────────
    const body = await req.json()
    const {
      capsule_id,
      capsule_slug,
      tier,
      pricing_keys,    // array — e.g. ['full_platform_base']
      honouree_name,
      organiser_email,
      reseller_code,
      community_id,
    } = body

    // ── VALIDATION ──────────────────────────────────────────────────────────
    if (!capsule_id || !capsule_slug || !tier || !pricing_keys?.length || !organiser_email) {
      return NextResponse.json(
        { error: 'Missing required fields: capsule_id, capsule_slug, tier, pricing_keys, organiser_email' },
        { status: 400 }
      )
    }

    if (!['honour', 'premier'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be honour or premier.' },
        { status: 400 }
      )
    }

    // ── GET CLIENT IP for regional pricing ─────────────────────────────────
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '0.0.0.0'

    // ── INITIATE CHECKOUT via PaymentService ───────────────────────────────
    const result = await initiateCheckout({
      capsule_id,
      capsule_slug,
      tier,
      pricing_keys,
      honouree_name:   honouree_name ?? 'your honouree',
      organiser_email,
      reseller_code,
      community_id,
      ip,
    })

    return NextResponse.json(result)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[/api/checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}