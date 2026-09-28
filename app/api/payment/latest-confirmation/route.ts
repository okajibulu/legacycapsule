// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/payment/latest-confirmation/route.ts
// PURPOSE:   Returns the latest succeeded payment for a capsule, including
//            Founding Customer promo claim data if applicable.
//            Called by ManagePageClient when ?payment=success is detected.
// ARCHITECTURE: LC04 Payment Engine — post-payment confirmation display
// BUILT BY:  AI31 · Claude Opus 4.6
// VERSION:   AI31v2.12.74
// DATE:      28 September 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — GET handler ═══

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  // Fetch capsule ID from slug
  const { data: capsule } = await db
    .from('capsules')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!capsule) {
    return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
  }

  // Fetch latest succeeded payment for this capsule
  const { data: payment } = await db
    .from('payments')
    .select('id, amount, currency, package_tier, paid_at, processor')
    .eq('capsule_id', capsule.id)
    .eq('status', 'succeeded')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ found: false })
  }

  // Check if this payment has a promo claim
  let promoSlot: number | null = null
  let promoLabel: string | null = null

  const { data: claim } = await db
    .from('lc_promo_claims')
    .select('id, promo_id')
    .eq('payment_id', payment.id)
    .maybeSingle()

  if (claim?.promo_id) {
    // Fetch slot number (count of claims for this promo up to and including this one)
    const { count } = await db
      .from('lc_promo_claims')
      .select('id', { count: 'exact', head: true })
      .eq('promo_id', claim.promo_id)
      .lte('claimed_at', (
        await db.from('lc_promo_claims').select('claimed_at').eq('id', claim.id).single()
      ).data?.claimed_at ?? new Date().toISOString())

    promoSlot = count ?? null

    // Fetch promo label
    const { data: promo } = await db
      .from('lc_pricing_promotions')
      .select('label')
      .eq('id', claim.promo_id)
      .maybeSingle()

    promoLabel = promo?.label ?? null
  }

  return NextResponse.json({
    found:       true,
    amount:      payment.amount,
    currency:    payment.currency,
    packageTier: payment.package_tier,
    paidAt:      payment.paid_at,
    processor:   payment.processor,
    promoSlot,
    promoLabel,
  })
}
