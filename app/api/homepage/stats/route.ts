// FILE: app/api/homepage/stats/route.ts
// PURPOSE: Returns live platform stats for homepage social proof strip
//          and featured capsules for the showcase section.
//          Called client-side from homepage useEffect.
// BUILT BY: AI13 - Claude Opus 4.6 - 22 July 2026

import { NextResponse }  from 'next/server'
import { createClient }  from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// SECTION 1 -- GET handler
// ============================================================

export async function GET() {
  try {
    // Run all queries in parallel
    const [tributeRes, capsuleRes, showcaseRes] = await Promise.all([

      // Total approved tributes across all capsules
      db
        .from('contributions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('deleted_at', null),

      // Total active capsules
      db
        .from('capsules')
        .select('id', { count: 'exact', head: true })
        .eq('page_state', 'active')
        .is('deleted_at', null),

      // Featured capsules for showcase (max 10)
      db
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag, event_date, hero_image_url, approved_contrib_count, city')
        .eq('featured_on_homepage', true)
        .eq('showcase_opted_out', false)
        .eq('page_state', 'active')
        .not('event_date', 'is', null)
        .order('event_date', { ascending: false })
        .limit(10),
    ])

    // Format tribute count
    const tributeCount = tributeRes.count ?? 0
    const tributeFormatted = tributeCount >= 1000
      ? `${(tributeCount / 1000).toFixed(1)}k+`
      : String(tributeCount)

    // Format capsule count
    const capsuleCount = capsuleRes.count ?? 0

    return NextResponse.json({
      stats: {
        tributes: tributeFormatted,
        capsules: String(capsuleCount),
      },
      featured: (showcaseRes.data ?? []).map(c => ({
        slug:          c.slug,
        honouree_name: c.honouree_name,
        event_type:    c.event_type,
        event_tag:     c.event_tag ?? null,
        event_date:    c.event_date,
        hero_image_url: c.hero_image_url ?? null,
        tribute_count: c.approved_contrib_count ?? 0,
        city:          c.city ?? null,
      })),
    })

  } catch (err) {
    console.error('[homepage/stats]', err)
    // Return safe defaults -- never break the homepage
    return NextResponse.json({
      stats:    { tributes: '0', capsules: '0' },
      featured: [],
    })
  }
}