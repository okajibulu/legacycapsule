// FILE: app/api/capsule/orders/route.ts
// PURPOSE: Returns payment order history for a capsule.
//          Used by the Order History panel in the manage dashboard Settings tab.
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
//   -- Summary now groups by currency (no longer sums across mixed currencies)
//   -- expires_at added to select query for expiry display in panel

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// SECTION 1 -- Feature labels
// ============================================================

const FEATURE_LABELS: Record<string, string> = {
  capsule_activation:        'Capsule Activation',
  audio_tributes:            'Voice Tributes',
  video_tributes:            'Video Tributes',
  ways_to_honour:            'Gifting',
  expression_of_honour:      'Gifting',
  guest_management:          'Guest Management & Seating',
  attire:                    'Fabric & Attire Coordination',
  publication:               'Digital Publication',
  community_stories:         'Community Memories & Stories',
  extended_validity:         'Extended Validity',
  additional_phase:          'Additional Event Phase',
  access_codes:              'Access Code System',
  access_code_system:        'Access Code System',
  family_rep_portal:         'Family Rep Portal',
  capacity_pack_growth:      'Growth Pack (+250 guests)',
  capacity_pack_celebration: 'Celebration Pack (+750 guests)',
  capacity_pack_grand:       'Grand Event Pack (+2,000 guests)',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '\u20a6',
  GBP: '\u00a3',
  USD: '$',
  EUR: '\u20ac',
}

// ============================================================
// SECTION 2 -- GET handler
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const capsule_id = req.nextUrl.searchParams.get('capsule_id')
    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    const { data: payments, error } = await db
      .from('payments')
      .select('id, processor, amount, currency, status, paid_at, created_at, package_tier, metadata, region, expires_at')
      .eq('capsule_id', capsule_id)
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })

    if (error) throw error

    const orders = (payments ?? []).map(p => {
      const tierKeys: string[] = (p.package_tier ?? '').split(',').map((k: string) => k.trim()).filter(Boolean)
      const metaIds: string[]  = Array.isArray(p.metadata?.feature_ids) ? p.metadata.feature_ids : []
      const allKeys            = [...new Set([...tierKeys, ...metaIds])]
      const featureKeys        = allKeys.filter(k => k !== 'capsule_activation')
      const features           = featureKeys.map(k => FEATURE_LABELS[k] ?? k)

      const currency = p.currency ?? 'EUR'
      const symbol   = CURRENCY_SYMBOLS[currency] ?? '\u20ac'
      // Amount is stored in minor units by Stripe -- divide by 100
      // Exception: amounts already in display units from historical records
      // will be caught by the panel's formatAmount helper
      const amount   = Number(p.amount ?? 0)

      return {
        id:         p.id,
        processor:  p.processor,
        amount,
        symbol,
        currency,
        status:     p.status,
        paid_at:    p.paid_at,
        created_at: p.created_at,
        expires_at: p.expires_at ?? null,
        features,
        region:     p.region ?? null,
      }
    })

    // -- Summary: group by currency -- never mix currencies in one total ------
    const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'succeeded')

    const byCurrency: Record<string, { total: number; symbol: string; count: number }> = {}
    for (const o of paidOrders) {
      if (!byCurrency[o.currency]) {
        byCurrency[o.currency] = { total: 0, symbol: o.symbol, count: 0 }
      }
      byCurrency[o.currency].total += o.amount
      byCurrency[o.currency].count += 1
    }

    // Return the primary currency summary (largest spend) and all others
    const currencyEntries = Object.entries(byCurrency).sort((a, b) => b[1].total - a[1].total)
    const primary = currencyEntries[0]

    return NextResponse.json({
      orders,
      summary: primary ? {
        total_orders:      orders.length,
        total_paid:        primary[1].total,
        currency:          primary[0],
        symbol:            primary[1].symbol,
        all_currencies:    currencyEntries.map(([currency, data]) => ({
          currency,
          symbol:      data.symbol,
          total_paid:  data.total,
          order_count: data.count,
        })),
      } : {
        total_orders:   0,
        total_paid:     0,
        currency:       'EUR',
        symbol:         '\u20ac',
        all_currencies: [],
      },
    })

  } catch (e: any) {
    console.error('[capsule/orders]', e)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}
