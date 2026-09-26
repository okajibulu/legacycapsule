// app/api/promo/counter/route.ts
// LegacyCapsule — Launch Promo Counter (Public)
// AI29 · 25 September 2026
//
// ─── PURPOSE ───────────────────────────────────────────────────────────────
// Returns the live counter for the active introductory promo.
// Public endpoint — no auth required. Cached at edge for 60s to
// avoid hammering the DB on high-traffic homepage loads.
//
// Response: { active: true, label, claimed, limit, remaining, pct }
//         | { active: false }
// ───────────────────────────────────────────────────────────────────────────

import { NextResponse }      from 'next/server'
import { createClient }      from '@supabase/supabase-js'

// ── Supabase anon client (read-only public data) ──────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── GET /api/promo/counter ────────────────────────────────────────────────
export async function GET() {
  try {
    const { data: promo, error } = await supabase
      .from('lc_pricing_promotions')
      .select('id, label, orders_claimed, customer_limit, discount_pct, discount_type')
      .eq('is_active', true)
      .is('deleted_at', null)
      .lte('starts_at', new Date().toISOString())
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!promo) {
      return NextResponse.json(
        { active: false },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      )
    }

    const claimed   = promo.orders_claimed ?? 0
    const limit     = promo.customer_limit ?? null
    const remaining = limit !== null ? Math.max(0, limit - claimed) : null
    const pct       = limit !== null ? Math.round((claimed / limit) * 100) : null

    return NextResponse.json(
      {
        active:        true,
        label:         promo.label,
        claimed,
        limit,
        remaining,
        pct,
        discount_pct:  promo.discount_pct,
        discount_type: promo.discount_type,
        sold_out:      limit !== null && claimed >= limit,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (err) {
    console.error('[promo/counter] error:', err)
    // Fail silently — promo banner should not break the page
    return NextResponse.json(
      { active: false },
      { status: 200 }
    )
  }
}
