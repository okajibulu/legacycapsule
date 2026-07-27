// FILE: app/api/homepage/stats/route.ts
// PURPOSE: Returns live platform stats for homepage social proof strip
//          and featured capsules for the showcase section.
//          Called client-side from homepage useEffect.
// BUILT BY: AI13 - Claude Opus 4.6 - 22 July 2026

import { NextResponse }  from 'next/server'
import { createClient }  from '@supabase/supabase-js'

// ── RW-Ecosystem env vars: NEXT_PUBLIC_RW_ECOSYSTEM_URL + RW_ECOSYSTEM_SERVICE_ROLE_KEY ──

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// SECTION 1 -- GET handler
// ============================================================

export async function GET() {
  try {
    // ── Step 1: Read qualification config from RW-Ecosystem ──────────────
    const ecosystem = createClient(
      process.env.NEXT_PUBLIC_RW_ECOSYSTEM_URL!,
      process.env.RW_ECOSYSTEM_SERVICE_ROLE_KEY!
    )

    const { data: configRows } = await ecosystem
      .from('platform_config')
      .select('config_key, value')
      .eq('product_key', 'legacycapsule')
      .in('config_key', ['showcase_min_tributes', 'showcase_require_story', 'showcase_require_phase'])

    const configMap: Record<string, string> = {}
    for (const row of configRows ?? []) configMap[row.config_key] = row.value

    const minTributes    = parseInt(configMap['showcase_min_tributes']  ?? '15', 10)
    const requireStory   = configMap['showcase_require_story']  === 'true'
    const requirePhase   = configMap['showcase_require_phase']  === 'true'

    // ── Step 2: Run platform stats + candidate capsules in parallel ───────
    const [tributeRes, capsuleRes, candidateRes] = await Promise.all([

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

      // Candidate capsules: manually featured OR past event date + active
      db
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag, event_date, hero_image_url, approved_contrib_count, city, featured_on_homepage, showcase_opted_out')
        .eq('page_state', 'active')
        .eq('showcase_opted_out', false)
        .is('deleted_at', null)
        .not('event_date', 'is', null)
        .lte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(50),
    ])

    // ── Step 3: For each candidate, check qualification criteria ─────────
    const candidates = candidateRes.data ?? []
    const qualifiedIds: string[] = []

    for (const capsule of candidates) {
      // Admin manual override — always show if featured_on_homepage = true
      if (capsule.featured_on_homepage) {
        qualifiedIds.push(capsule.id)
        continue
      }

      // Check tribute count (tributes only — excludes community_story type)
      const { count: tributeCount } = await db
        .from('contributions')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsule.id)
        .eq('status', 'approved')
        .neq('contribution_type', 'community_story')
        .is('deleted_at', null)

      if ((tributeCount ?? 0) < minTributes) continue

      // Optional gate: community story
      if (requireStory) {
        const { count: storyCount } = await db
          .from('contributions')
          .select('id', { count: 'exact', head: true })
          .eq('capsule_id', capsule.id)
          .eq('contribution_type', 'community_story')
          .eq('status', 'approved')
          .is('deleted_at', null)

        if ((storyCount ?? 0) < 1) continue
      }

      // Optional gate: event phase with actual D-Day activity
      // (gallery items uploaded against a specific phase — proves the phase was used)
      if (requirePhase) {
        const { count: phaseActivityCount } = await db
          .from('gallery_items')
          .select('id', { count: 'exact', head: true })
          .eq('capsule_id', capsule.id)
          .not('phase_id', 'is', null)
          .is('deleted_at', null)

        if ((phaseActivityCount ?? 0) < 1) continue
      }

      qualifiedIds.push(capsule.id)
    }

    // ── Step 4: Auto-flag newly qualifying capsules ───────────────────────
    const newlyQualified = candidates.filter(
      c => qualifiedIds.includes(c.id) && !c.featured_on_homepage
    )
    if (newlyQualified.length > 0) {
      await db
        .from('capsules')
        .update({
          featured_on_homepage: true,
          showcase_qualified_at: new Date().toISOString(),
        })
        .in('id', newlyQualified.map(c => c.id))
    }

    // ── Step 5: Build featured list from qualified IDs (max 10) ──────────
    const featured = candidates
      .filter(c => qualifiedIds.includes(c.id))
      .slice(0, 10)

    // ── Step 6: Format stats ──────────────────────────────────────────────
    const tributeCount = tributeRes.count ?? 0
    const tributeFormatted = tributeCount >= 1000
      ? `${(tributeCount / 1000).toFixed(1)}k+`
      : String(tributeCount)

    const capsuleCount = capsuleRes.count ?? 0

    return NextResponse.json({
      stats: {
        tributes: tributeFormatted,
        capsules: String(capsuleCount),
      },
      featured: featured.map(c => ({
        slug:           c.slug,
        honouree_name:  c.honouree_name,
        event_type:     c.event_type,
        event_tag:      c.event_tag ?? null,
        event_date:     c.event_date,
        hero_image_url: c.hero_image_url ?? null,
        tribute_count:  c.approved_contrib_count ?? 0,
        city:           c.city ?? null,
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