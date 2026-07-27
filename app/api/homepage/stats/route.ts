// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/homepage/stats/route.ts
// PURPOSE:   Returns live platform stats for homepage social proof strip
//            and featured capsules for the showcase section.
//            Qualification is config-driven from RW-Ecosystem platform_config.
//            Uses a single efficient query — no per-capsule await loops.
// BUILT BY:  AI13 · Claude Sonnet 4.6 · 22 July 2026
// UPDATED:   AI15 · Claude Sonnet 4.6 · 27 July 2026
//   — Replaced per-capsule sequential loop with single SQL-level qualification
//   — Admin override (featured_on_homepage=true) fetched directly, no loop
//   — Auto-qualification via subquery counts — no sequential awaits
//   — showcase_qualified_at used as permanent showcase pass (expiry-proof)
//   — RW-Ecosystem env vars: NEXT_PUBLIC_RW_ECOSYSTEM_URL + RW_ECOSYSTEM_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ═══ SECTION 1 — Supabase clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ecosystem = createClient(
  process.env.NEXT_PUBLIC_RW_ECOSYSTEM_URL!,
  process.env.RW_ECOSYSTEM_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — GET handler ═══

export async function GET() {
  try {

    // ── 2.1 Read qualification config + platform stats in parallel ───────────

    console.log('[homepage/stats] ecosystem URL present:', !!process.env.NEXT_PUBLIC_RW_ECOSYSTEM_URL)
    console.log('[homepage/stats] ecosystem key present:', !!process.env.RW_ECOSYSTEM_SERVICE_ROLE_KEY)

    const [configRes, tributeRes, capsuleRes] = await Promise.all([

      ecosystem
        .from('platform_config')
        .select('config_key, value')
        .eq('product_key', 'legacycapsule')
        .in('config_key', [
          'showcase_min_tributes',
          'showcase_require_story',
          'showcase_require_phase',
        ]),

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
    ])

    // ── 2.2 Parse config values ───────────────────────────────────────────────

    console.log('[homepage/stats] configRes:', JSON.stringify(configRes))

    const configMap: Record<string, string> = {}
    for (const row of configRes.data ?? []) configMap[row.config_key] = row.value

    const minTributes  = parseInt(configMap['showcase_min_tributes'] ?? '15', 10)
    const requireStory = configMap['showcase_require_story'] === 'true'
    const requirePhase = configMap['showcase_require_phase'] === 'true'

    // ── 2.3 Fetch admin-flagged capsules directly (no qualification needed) ───
    // featured_on_homepage = true is the admin override — always shown.
    // Also includes capsules that previously auto-qualified (showcase_qualified_at set).
    // This is expiry-proof: page_state is NOT filtered so past capsules stay visible.

    const { data: adminFeatured, error: adminErr } = await db
      .from('capsules')
      .select('id, slug, honouree_name, event_type, event_tag, event_date, hero_image_url, approved_contrib_count, city')
      .eq('featured_on_homepage', true)
      .eq('showcase_opted_out', false)
      .is('deleted_at', null)
      .order('showcase_qualified_at', { ascending: false })
      .limit(10)

    console.log('[homepage/stats] adminFeatured:', JSON.stringify(adminFeatured), 'adminErr:', JSON.stringify(adminErr))

    const adminList = adminFeatured ?? []

    // ── 2.4 Auto-qualification: find additional qualifying capsules ───────────
    // Only runs if we have fewer than 10 admin-featured capsules.
    // Fetches candidates and counts contributions in a single query per capsule
    // using RPC or fallback to a batch count approach.

    let autoQualified: any[] = []

    if (adminList.length < 10) {
      // Fetch candidates: past events, active, not opted out, not already featured
      const adminIds = adminList.map(c => c.id)

      const { data: candidates } = await db
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag, event_date, hero_image_url, approved_contrib_count, city')
        .eq('page_state', 'active')
        .eq('showcase_opted_out', false)
        .eq('featured_on_homepage', false)
        .is('deleted_at', null)
        .not('event_date', 'is', null)
        .lte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(30)

      const pool = (candidates ?? []).filter(c => !adminIds.includes(c.id))

      // Batch fetch tribute counts for all candidates in one query
      const poolIds = pool.map(c => c.id)

      if (poolIds.length > 0) {
        const [tributeCounts, storyCounts, phaseCounts] = await Promise.all([

          // Tribute counts (excluding community_story type)
          db
            .from('contributions')
            .select('capsule_id')
            .in('capsule_id', poolIds)
            .eq('status', 'approved')
            .neq('contribution_type', 'community_story')
            .is('deleted_at', null),

          // Community story counts (only needed if requireStory)
          requireStory
            ? db
                .from('contributions')
                .select('capsule_id')
                .in('capsule_id', poolIds)
                .eq('status', 'approved')
                .eq('contribution_type', 'community_story')
                .is('deleted_at', null)
            : Promise.resolve({ data: [] }),

          // Phase activity counts (only needed if requirePhase)
          requirePhase
            ? db
                .from('gallery_items')
                .select('capsule_id')
                .in('capsule_id', poolIds)
                .not('phase_id', 'is', null)
                .is('deleted_at', null)
            : Promise.resolve({ data: [] }),
        ])

        // Build count maps
        const tributeMap: Record<string, number> = {}
        for (const row of tributeCounts.data ?? []) {
          tributeMap[row.capsule_id] = (tributeMap[row.capsule_id] ?? 0) + 1
        }

        const storyMap: Record<string, number> = {}
        for (const row of (storyCounts as any).data ?? []) {
          storyMap[row.capsule_id] = (storyMap[row.capsule_id] ?? 0) + 1
        }

        const phaseMap: Record<string, number> = {}
        for (const row of (phaseCounts as any).data ?? []) {
          phaseMap[row.capsule_id] = (phaseMap[row.capsule_id] ?? 0) + 1
        }

        // Filter candidates against qualification criteria
        const newlyQualifying = pool.filter(c => {
          if ((tributeMap[c.id] ?? 0) < minTributes) return false
          if (requireStory && (storyMap[c.id] ?? 0) < 1) return false
          if (requirePhase && (phaseMap[c.id] ?? 0) < 1) return false
          return true
        })

        // Auto-flag newly qualifying capsules (non-blocking)
        if (newlyQualifying.length > 0) {
          ;(async () => {
            try {
              await db
                .from('capsules')
                .update({
                  featured_on_homepage:  true,
                  showcase_qualified_at: new Date().toISOString(),
                })
                .in('id', newlyQualifying.map(c => c.id))
            } catch (err) {
              console.warn('[homepage/stats] auto-flag failed:', err)
            }
          })()
        }

        autoQualified = newlyQualifying
      }
    }

    // ── 2.5 Merge admin + auto-qualified, deduplicate, cap at 10 ─────────────

    const seen  = new Set<string>()
    const merged: any[] = []

    for (const c of [...adminList, ...autoQualified]) {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        merged.push(c)
      }
      if (merged.length >= 10) break
    }

    // ── 2.6 Format stats ──────────────────────────────────────────────────────

    const tributeCount     = tributeRes.count ?? 0
    const tributeFormatted = tributeCount >= 1000
      ? `${(tributeCount / 1000).toFixed(1)}k+`
      : String(tributeCount)

    const capsuleCount = capsuleRes.count ?? 0

    return NextResponse.json({
      stats: {
        tributes: tributeFormatted,
        capsules: String(capsuleCount),
      },
      featured: merged.map(c => ({
        slug:           c.slug,
        honouree_name:  c.honouree_name,
        event_type:     c.event_type,
        event_tag:      c.event_tag  ?? null,
        event_date:     c.event_date,
        hero_image_url: c.hero_image_url ?? null,
        tribute_count:  c.approved_contrib_count ?? 0,
        city:           c.city ?? null,
      })),
    })

  } catch (err) {
    console.error('[homepage/stats]', err)
    // Safe defaults — homepage must never break
    return NextResponse.json({
      stats:    { tributes: '0', capsules: '0' },
      featured: [],
    })
  }
}