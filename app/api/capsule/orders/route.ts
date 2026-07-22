// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/capsule/orders/route.ts
// PURPOSE: Returns payment order history for a capsule.
//          Used by the Order History panel in the manage dashboard Settings tab.
// BUILT BY: AI12 · Claude Opus 4.6 · 21 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Human-readable labels for feature keys
const FEATURE_LABELS: Record<string, string> = {
  capsule_activation:        'Capsule Activation',
  audio_tributes:            'Voice Tributes',
  video_tributes:            'Video Tributes',
  ways_to_honour:            'Gift of Honour',
  expression_of_honour:      'Gift of Honour',
  guest_management:          'Guest Management & Seating',
  attire:                    'Fabric & Attire Coordination',
  publication:               'Digital Publication',
  community_stories:         'Community Memories & Stories',
  extended_validity:         'Extended Validity',
  additional_phase:          'Additional Event Phase',
  access_codes:              'Access Code System',
  family_rep_portal:         'Family Rep Portal',
  capacity_pack_growth:      'Growth Pack (+250 guests)',
  capacity_pack_celebration: 'Celebration Pack (+750 guests)',
  capacity_pack_grand:       'Grand Event Pack (+2,000 guests)',
}

export async function GET(req: NextRequest) {
  try {
    const capsule_id = req.nextUrl.searchParams.get('capsule_id')
    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    const { data: payments, error } = await db
      .from('payments')
      .select('id, processor, amount, currency, status, paid_at, created_at, package_tier, metadata, region')
      .eq('capsule_id', capsule_id)
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })

    if (error) throw error

    const orders = (payments ?? []).map(p => {
      // Parse feature keys from package_tier (authoritative) or metadata.feature_ids
      const tierKeys: string[]    = (p.package_tier ?? '').split(',').map((k: string) => k.trim()).filter(Boolean)
      const metaIds: string[]     = Array.isArray(p.metadata?.feature_ids) ? p.metadata.feature_ids : []
      const allKeys               = [...new Set([...tierKeys, ...metaIds])]
      const featureKeys           = allKeys.filter(k => k !== 'capsule_activation')
      const features              = featureKeys.map(k => FEATURE_LABELS[k] ?? k)

      // Format amount — stored as display units (not minor units) based on existing DB records
      const symbol = p.currency === 'NGN' ? '₦' : p.currency === 'GBP' ? '£' : p.currency === 'USD' ? '$' : '€'
      const amount = Number(p.amount ?? 0)

      return {
        id:         p.id,
        processor:  p.processor,
        amount,
        symbol,
        currency:   p.currency,
        status:     p.status,
        paid_at:    p.paid_at,
        created_at: p.created_at,
        features,
        region:     p.region,
      }
    })

    // Summary stats
    const totalPaid = orders
      .filter(o => o.status === 'paid' || o.status === 'succeeded')
      .reduce((sum, o) => sum + o.amount, 0)

    const firstCurrency = orders[0]?.currency ?? 'EUR'
    const totalSymbol   = orders[0]?.symbol ?? '€'

    return NextResponse.json({
      orders,
      summary: {
        total_orders: orders.length,
        total_paid:   totalPaid,
        currency:     firstCurrency,
        symbol:       totalSymbol,
      },
    })

  } catch (e: any) {
    console.error('[capsule/orders]', e)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}
