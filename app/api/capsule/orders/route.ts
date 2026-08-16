// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/orders/route.ts
// PURPOSE:   Returns payment history for a capsule.
//            Called by OrderHistoryPanel on the manage dashboard Settings tab.
//            Returns orders with feature labels, amounts, dates, status.
//            Reads from payments table — source of truth for all transactions.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY:  AI20 · Claude Sonnet 4.6
// VERSION:   AI20v2.12.06
// DATE:      15 August 2026
//
// GET /api/capsule/orders?capsule_id=xxx
//
// Response:
// {
//   orders: [{
//     id, processor, amount, symbol, currency, status,
//     paid_at, created_at, expires_at, features, region
//   }],
//   summary: { total_orders, total_paid, currency, symbol }
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Feature label map ═══
// Maps pricing keys to human-readable labels for display.
// These are shown as chips on each order card.

const FEATURE_LABELS: Record<string, string> = {
  capsule_activation_base:            'Capsule Activation',
  publication:                        'Digital Capsule Publication',
  audio_tributes:                     'Voice Tributes',
  video_tributes:                     'Video Tributes',
  ways_to_honour:                     'Gift of Honour',
  access_codes:                       'Access Code System',
  guest_management:                   'Guest Management',
  attire:                             'Fabric & Attire',
  additional_phase:                   'Additional Event Phase',
  capsule_extend_6mo:                 'Validity Extension — 6 Months',
  capsule_extend_3mo:                 'Validity Extension — 3 Months',
  capsule_reactivation_admin:         'Reactivation Admin Fee',
  extended_validity:                  'Extended Validity',
  contribution_tier_growing_350v:     'Growing-350V',
  contribution_tier_flourishing_700v: 'Flourishing-700V',
  contribution_tier_grand_1500v:      'Grand-1500V',
  contribution_tier_estate_v:         'Estate-∞V',
  access_code_extended_400g:          'Extended-400G',
  access_code_large_800g:             'Large-800G',
  access_code_grand_2000g:            'Grand-2000G',
  access_code_estate_g:               'Estate-∞G',
  essential_preset:                   'Essential Package',
  signature_preset:                   'Signature Package',
  capacity_pack_growth:               'Capacity Pack — Growth',
  capacity_pack_celebration:          'Capacity Pack — Celebration',
  capacity_pack_grand:                'Capacity Pack — Grand',
  // Legacy keys
  full_platform_base:                 'Full Platform',
  capture_preserve_base:              'Capture & Preserve',
  save_the_date:                      'Save the Date',
  table_management:                   'Table Management',
  white_label:                        'White Label Branding',
  custom_domain:                      'Custom Domain',
}

// ═══ SECTION 3 — Currency symbol map ═══

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦', EUR: '€', GBP: '£', USD: '$', GHS: 'GH₵', KES: 'KSh',
}

// ═══ SECTION 4 — Parse features from payment record ═══
// package_tier is comma-separated keys, e.g. "capsule_activation,publication,audio_tributes"
// metadata.feature_ids is an array (preferred when present)

function parseFeatureLabels(payment: Record<string, unknown>): string[] {
  const metadata = payment.metadata as Record<string, unknown> | null

  // Prefer metadata.feature_ids (set by bundle route)
  if (Array.isArray(metadata?.feature_ids) && metadata.feature_ids.length > 0) {
    return (metadata.feature_ids as string[])
      .map(k => FEATURE_LABELS[k] ?? k)
      .filter(Boolean)
  }

  // Fall back to package_tier string
  const tier = (payment.package_tier as string) ?? ''
  if (!tier) return []

  return tier
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .map(k => FEATURE_LABELS[k] ?? k)
}

// ═══ SECTION 5 — GET handler ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')

  if (!capsule_id) {
    return NextResponse.json(
      { error: 'capsule_id is required.' },
      { status: 400 }
    )
  }

  try {
    // ── Fetch payments for this capsule ───────────────────────────────────────
    const { data: payments, error } = await db
      .from('payments')
      .select('id, processor, amount, currency, status, package_tier, metadata, region, created_at, paid_at')
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[capsule/orders]', error)
      return NextResponse.json(
        { error: 'Something went wrong loading your order history. Please try again.' },
        { status: 500 }
      )
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ orders: [], summary: null })
    }

    // ── Filter to meaningful orders only ──────────────────────────────────────
    // succeeded / paid = confirmed transactions — always show
    // pending = show only if created within last 24 hours (may still complete)
    // Everything else (failed, cancelled, abandoned) = exclude
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const meaningfulPayments = payments.filter(p => {
      if (p.status === 'succeeded' || p.status === 'paid') return true
      if (p.status === 'pending' && p.created_at > cutoff) return true
      return false
    })

    if (meaningfulPayments.length === 0) {
      return NextResponse.json({ orders: [], summary: null })
    }

    // ── Format orders ─────────────────────────────────────────────────────────
    const orders = meaningfulPayments.map(p => ({
      id:         p.id,
      processor:  p.processor ?? 'unknown',
      amount:     p.amount ?? 0,
      currency:   p.currency ?? 'NGN',
      symbol:     CURRENCY_SYMBOLS[p.currency ?? 'NGN'] ?? p.currency ?? '',
      status:     p.status ?? 'pending',
      paid_at:    p.paid_at   ?? null,
      created_at: p.created_at,
      expires_at: null,   // column not on payments table — capsule expiry is on capsules.expires_at
      features:   parseFeatureLabels(p),
      region:     p.region ?? null,
    }))

    // ── Summary — succeeded/paid orders only ──────────────────────────────────
    const paidOrders    = orders.filter(o => o.status === 'succeeded' || o.status === 'paid')
    const totalPaid     = paidOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0)
    const primaryCurr   = orders[0]?.currency ?? 'NGN'
    const primarySymbol = CURRENCY_SYMBOLS[primaryCurr] ?? primaryCurr

    const summary = {
      total_orders: paidOrders.length,   // only count confirmed paid orders
      total_paid:   totalPaid,
      currency:     primaryCurr,
      symbol:       primarySymbol,
    }

    return NextResponse.json({ orders, summary })

  } catch (err) {
    console.error('[capsule/orders]', err)
    return NextResponse.json(
      { error: 'Something went wrong loading your order history. Please try again.' },
      { status: 500 }
    )
  }
}
