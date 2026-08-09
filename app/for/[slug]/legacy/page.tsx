// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/legacy/page.tsx
// ROUTE: /for/[slug]/legacy
// PURPOSE: Legacy Room — Phase 2 of LC-PARTICIPATION-001
//          Public-facing community participation page.
//          Three-Room Model Room 3: View community participation + preservation.
//          ISR with 60s revalidation (E6). Reads pre-computed data only (D9).
// OWNER: AI7
// UPDATED: AI18 · 6 Aug 2026 — voice metrics computation, multi-source
//          activity feed, publication status, community stories + moments counts
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { resolveTheme } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'
import LegacyRoomClient from '@/components/LegacyRoomClient'
import type { Metadata } from 'next'
import CapsuleBottomNav from '@/components/CapsuleBottomNav'
import PublicationSubscribePanel  from '@/components/capsule/PublicationSubscribePanel'
import ActivePremiumsStrip        from '@/components/ActivePremiumsStrip'
import type { VoiceMetrics, ActivityItem } from '@/components/LegacyRoomClient'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — ISR config
// ─────────────────────────────────────────────────────────────────────────────

export const revalidate = 60 // 60s ISR per E6

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Supabase service client
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — OG metadata (E5)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params

  const { data: capsule } = await supabase
    .from('capsules')
    .select('honouree_name, event_type')
    .eq('slug', slug)
    .single()

  if (!capsule) return { title: 'Legacy Room — LegacyCapsule' }

  const { data: summary } = await supabase
    .from('capsule_participation_summary')
    .select('contributor_count, photo_count, country_count, share_count')
    .eq('capsule_id', (await supabase.from('capsules').select('id').eq('slug', slug).single()).data?.id)
    .single()

  const stats = summary
    ? `${summary.contributor_count} Tributes · ${summary.photo_count} Photos · ${summary.country_count} Countries`
    : 'A growing collection of voices'

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
  const ogImageUrl = `${appUrl}/api/og/${slug}`
  return {
    title: `${capsule.honouree_name} — Legacy Room · LegacyCapsule`,
    description: `${stats} — honouring ${capsule.honouree_name}. See how this collection is growing.`,
    openGraph: {
      title: `${capsule.honouree_name} — Legacy Room`,
      description: stats,
      url: `https://itslegacycapsule.com/for/${slug}/legacy`,
      siteName: 'LegacyCapsule',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${capsule.honouree_name} — LegacyCapsule` }],
    },
    twitter: { card: 'summary_large_image', images: [ogImageUrl] },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Server component
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 4B — Voice metrics computation ═══
// All computation server-side — raw tribute_text never sent to browser.

function computeVoiceMetrics(
  contribs: Array<{
    tribute_text: string | null
    relationship: string | null
    country: string | null
    created_at: string
    is_anonymous: boolean | null
    legacy_builder_consent: boolean | null
    email: string | null
    ip_country: string | null
  }>,
  attributionCount: number
): VoiceMetrics {
  if (contribs.length === 0) {
    return {
      total: 0, totalChars: 0, avgLength: 0, medianLength: 0,
      shortestLength: 0, longestLength: 0,
      over500: 0, over500Pct: 0, over1000: 0, over1000Pct: 0,
      distribution: [], mostActiveDay: null, spanDays: 0, avgPerDay: 0,
      topRelationships: [], distinctRelationships: 0,
      topCountries: [], continents: [], internationalPct: 0,
      singleCountries: 0, attributionCount: 0, attributionPct: 0,
      consentCount: 0, consentPct: 0, emailCount: 0, emailPct: 0,
      photoCount: 0, photoPct: 0, anonymousCount: 0,
    }
  }

  const lengths = contribs
    .map(c => (c.tribute_text ?? '').length)
    .filter(l => l > 0)
    .sort((a, b) => a - b)

  const total = contribs.length
  const totalChars = lengths.reduce((s, l) => s + l, 0)
  const avgLength = Math.round(totalChars / (lengths.length || 1))
  const mid = Math.floor(lengths.length / 2)
  const medianLength = lengths.length % 2 === 0
    ? Math.round((lengths[mid - 1] + lengths[mid]) / 2)
    : lengths[mid]
  const shortestLength = lengths[0] ?? 0
  const longestLength = lengths[lengths.length - 1] ?? 0
  const over500 = lengths.filter(l => l > 500).length
  const over500Pct = Math.round((over500 / total) * 10) / 10
  const over1000 = lengths.filter(l => l > 1000).length
  const over1000Pct = Math.round((over1000 / total) * 10) / 10

  // Distribution buckets
  const buckets = [
    { label: 'Under 100',       min: 0,    max: 99   },
    { label: '100–300',         min: 100,  max: 300  },
    { label: '301–500',         min: 301,  max: 500  },
    { label: '501–750',         min: 501,  max: 750  },
    { label: '751–1,000',       min: 751,  max: 1000 },
    { label: '1,001–1,500',     min: 1001, max: 1500 },
    { label: '1,501–2,000',     min: 1501, max: 2000 },
    { label: 'Over 2,000',      min: 2001, max: Infinity },
  ]
  const distribution = buckets.map(b => ({
    label: b.label,
    count: lengths.filter(l => l >= b.min && l <= b.max).length,
    pct: 0,
  }))
  distribution.forEach(d => { d.pct = Math.round((d.count / total) * 100) })

  // Time intelligence
  const dates = contribs.map(c => new Date(c.created_at))
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]
  const spanDays = firstDate && lastDate
    ? Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / 86400000))
    : 1
  const avgPerDay = Math.round((total / spanDays) * 10) / 10

  // Most active day
  const dayCounts: Record<string, number> = {}
  contribs.forEach(c => {
    const day = new Date(c.created_at).toISOString().slice(0, 10)
    dayCounts[day] = (dayCounts[day] ?? 0) + 1
  })
  const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]
  const mostActiveDay = topDay
    ? {
        date: new Date(topDay[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        count: topDay[1],
      }
    : null

  // Relationship intelligence
  const relCounts: Record<string, number> = {}
  contribs.forEach(c => {
    const r = c.relationship?.trim()
    if (r) relCounts[r] = (relCounts[r] ?? 0) + 1
  })
  const topRelationships = Object.entries(relCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }))
  const distinctRelationships = Object.keys(relCounts).length

  // Geographic intelligence
  const countryCounts: Record<string, number> = {}
  contribs.forEach(c => {
    const co = c.country?.trim() || c.ip_country?.trim()
    if (co) countryCounts[co] = (countryCounts[co] ?? 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
  const topCountry = topCountries[0]
  const internationalCount = topCountry
    ? total - (countryCounts[topCountry.name] ?? 0)
    : 0
  const internationalPct = Math.round((internationalCount / total) * 100)
  const singleCountries = Object.values(countryCounts).filter(c => c === 1).length

  // Continent mapping (simplified)
  const CONTINENT_MAP: Record<string, string> = {
    Nigeria: 'Africa', Ghana: 'Africa', Kenya: 'Africa', Uganda: 'Africa',
    'South Africa': 'Africa', Cameroon: 'Africa', Senegal: 'Africa',
    Ethiopia: 'Africa', Tanzania: 'Africa', Rwanda: 'Africa',
    'United Kingdom': 'Europe', Germany: 'Europe', France: 'Europe',
    Netherlands: 'Europe', Ireland: 'Europe', Sweden: 'Europe',
    Norway: 'Europe', Denmark: 'Europe', Finland: 'Europe',
    'United States': 'Americas', Canada: 'Americas', Brazil: 'Americas',
    Mexico: 'Americas', 'United States of America': 'Americas',
    Australia: 'Asia-Pacific', 'New Zealand': 'Asia-Pacific',
    Singapore: 'Asia-Pacific', Malaysia: 'Asia-Pacific', India: 'Asia-Pacific',
    China: 'Asia-Pacific', Japan: 'Asia-Pacific',
    'Saudi Arabia': 'Middle East', UAE: 'Middle East',
    'United Arab Emirates': 'Middle East',
  }
  const continentCounts: Record<string, number> = {}
  Object.entries(countryCounts).forEach(([country, count]) => {
    const continent = CONTINENT_MAP[country] ?? 'Other'
    continentCounts[continent] = (continentCounts[continent] ?? 0) + count
  })
  const continents = Object.entries(continentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  // Engagement metrics
  const consentCount = contribs.filter(c => c.legacy_builder_consent).length
  const consentPct = Math.round((consentCount / total) * 100)
  const emailCount = contribs.filter(c => c.email?.trim()).length
  const emailPct = Math.round((emailCount / total) * 100)
  const anonymousCount = contribs.filter(c => c.is_anonymous).length
  const attributionPct = Math.round((attributionCount / total) * 100)

  return {
    total, totalChars, avgLength, medianLength,
    shortestLength, longestLength,
    over500, over500Pct, over1000, over1000Pct,
    distribution, mostActiveDay, spanDays, avgPerDay,
    topRelationships, distinctRelationships,
    topCountries, continents, internationalPct,
    singleCountries, attributionCount, attributionPct,
    consentCount, consentPct, emailCount, emailPct,
    photoCount: 0, photoPct: 0, anonymousCount,
    // Note: photoCount computed live in page component — not from contribs
  }
}

export default async function LegacyRoomPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // ── Fetch capsule ──────────────────────────────────────────────────────
  const { data: capsule, error: capsuleError } = await supabase
    .from('capsules')
    .select(`
      id, slug, honouree_name, honouree_title, event_type, event_tag,
      hero_image_url, theme, components,
      legacy_builder_activation_threshold,
      hero_image_position, hero_image_zoom, hero_image_fit,
      hero_panel_size, hero_full_bleed
    `)
    .eq('slug', slug)
    .single()

  if (capsuleError || !capsule) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Capsule not found.</p>
      </div>
    )
  }

  // ── Fetch participation summary (D9 — pre-computed only) ──────────────
  const { data: summary } = await supabase
    .from('capsule_participation_summary')
    .select('*')
    .eq('capsule_id', capsule.id)
    .single()

  // ── Fetch legacy builders (top 5 with rank) ───────────────────────────
  const { data: builders } = await supabase
    .from('capsule_legacy_builders')
    .select('id, contributor_name, display_name, ref_count, recognition_tier, rank_position')
    .eq('capsule_id', capsule.id)
    .not('rank_position', 'is', null)
    .order('rank_position', { ascending: true })
    .limit(5)

  // ── Fetch all approved contributions for metrics ──────────────────────
  // Full text data needed for voice intelligence computation
  const { data: contribsForMetrics } = await supabase
    .from('contributions')
    .select('id, contributor_name, city, country, relationship, tribute_text, created_at, is_anonymous, legacy_builder_consent, email, thumbnail_url, ip_country')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // ── Fetch recent activity — Voices (last 3) ───────────────────────────
  const { data: recentVoices } = await supabase
    .from('contributions')
    .select('id, contributor_name, city, country, created_at, thumbnail_url')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(3)

  // ── Fetch recent activity — Community Stories (last 3) ────────────────
  const { data: recentStories } = await supabase
    .from('community_stories')
    .select('id, contributor_name, city, country, created_at')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(3)

  // ── Fetch recent activity — Event Moments / D-Day (last 3) ────────────
  const { data: recentMoments } = await supabase
    .from('gallery_items')
    .select('id, contributor_name, ip_country, created_at')
    .eq('capsule_id', capsule.id)
    .eq('source', 'dday')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(3)

  // ── Merge and sort activity feed — take top 3 overall ─────────────────
  const mergedActivity: ActivityItem[] = [
    ...(recentVoices ?? []).map(v => ({
      id: v.id, contributor_name: v.contributor_name,
      city: v.city ?? '', country: v.country ?? '',
      created_at: v.created_at, thumbnail_url: v.thumbnail_url ?? null,
      activity_type: 'voice' as const,
    })),
    ...(recentStories ?? []).map(s => ({
      id: s.id, contributor_name: s.contributor_name,
      city: s.city ?? '', country: s.country ?? '',
      created_at: s.created_at, thumbnail_url: null,
      activity_type: 'memory' as const,
    })),
    ...(recentMoments ?? []).map(m => ({
      id: m.id, contributor_name: m.contributor_name ?? 'Guest',
      city: '', country: m.ip_country ?? '',
      created_at: m.created_at, thumbnail_url: null,
      activity_type: 'moment' as const,
    })),
  ]
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 3)

  // ── Community stories count — from contributions with story_topic_id ──
  const { count: storiesCount } = await supabase
    .from('contributions')
    .select('id', { count: 'exact', head: true })
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .not('story_topic_id', 'is', null)
    .is('deleted_at', null)

  // ── Event moments count (D-Day guest captures) ────────────────────────
  const { count: momentsCount } = await supabase
    .from('gallery_items')
    .select('id', { count: 'exact', head: true })
    .eq('capsule_id', capsule.id)
    .eq('source', 'dday')
    .eq('approved', true)
    .is('deleted_at', null)

  // ── Total approved photos count (all sources) ─────────────────────────
  const { count: livePhotoCount } = await supabase
    .from('gallery_items')
    .select('id', { count: 'exact', head: true })
    .eq('capsule_id', capsule.id)
    .eq('approved', true)
    .is('deleted_at', null)

  // ── Attribution count ─────────────────────────────────────────────────
  const { count: attributionCount } = await supabase
    .from('contribution_attribution')
    .select('id', { count: 'exact', head: true })
    .eq('capsule_id', capsule.id)

  // ── Top Legacy Builder (by ref_count, excluding organiser) ────────────
  const { data: topBuilderRow } = await supabase
    .from('capsule_legacy_builders')
    .select('contributor_name, display_name, ref_count, recognition_tier')
    .eq('capsule_id', capsule.id)
    .order('ref_count', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Publication status ────────────────────────────────────────────────
  const { data: pubRow } = await supabase
    .from('publications')
    .select('version, generation_status, generated_at, family_preview_sent_at')
    .eq('capsule_id', capsule.id)
    .maybeSingle()

  // ── Distribution count (how many received pub) ────────────────────────
  const { count: pubSentCount } = await supabase
    .from('publication_subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('capsule_id', capsule.id)
    .not('sent_at', 'is', null)

  // ── Compute voice metrics server-side ─────────────────────────────────
  const contribs = contribsForMetrics ?? []
  const voiceMetrics: VoiceMetrics = computeVoiceMetrics(contribs, attributionCount ?? 0)

  // ── Fetch organiser gallery (Featured Memories) ───────────────────────
  const { data: galleryPhotos } = await supabase
    .from('capsule_gallery')
    .select('id, image_url, description, sort_order, section_index')
    .eq('capsule_id', capsule.id)
    .order('section_index')
    .order('sort_order')

  // ── Fetch phases with D-Day photo counts ────────────────────────────────
  let phases: Array<{ id: string; name: string; event_date: string | null; photo_count: number }> = []
  let phaseCount = 0
  try {
    const { data: pData } = await supabase
      .from('capsule_phases')
      .select('id, name, event_date')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
    if (pData && pData.length > 0) {
      phaseCount = pData.length
      const counts = await Promise.all(pData.map(async p => {
        const { count } = await supabase
          .from('gallery_items')
          .select('id', { count: 'exact', head: true })
          .eq('capsule_id', capsule.id)
          .eq('phase_id', p.id)
          .eq('source', 'dday')
          .eq('approved', true)
        return { ...p, photo_count: count ?? 0 }
      }))
      phases = counts
    }
} catch { phases = []; phaseCount = 0 }


  // ── Resolve theme ─────────────────────────────────────────────────────
  // ── Fetch support accounts for Premiums panel (EOH/Gifting) ──────────
  const { data: supportAccounts } = await supabase
    .from('capsule_support_accounts')
    .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
    .eq('capsule_id', capsule.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

const { data: latestVoice } = await supabase
  .from('contributions')
  .select('created_at')
  .eq('capsule_id', capsule.id)
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

  const themeKey: ThemeKey = resolveTheme(
    (capsule.theme as ThemeKey | 'classic') ?? 'classic',
    capsule.event_type
  )

  // ── Determine builder visibility ──────────────────────────────────────
  const threshold = capsule.legacy_builder_activation_threshold ?? 10
  const attributedCount = summary?.attributed_contrib_count ?? 0
  const showBuilders = attributedCount >= threshold && (builders?.length ?? 0) > 0

  return (
    <>
      <LegacyRoomClient
      capsule={{
        id: capsule.id,
        slug: capsule.slug,
        honouree_name: capsule.honouree_name,
        honouree_title: capsule.honouree_title,
        event_type: capsule.event_type,
        event_tag: capsule.event_tag,
        hero_image_url: capsule.hero_image_url,
        components: capsule.components ?? [],
        hero_image_position: capsule.hero_image_position,
        hero_image_zoom: capsule.hero_image_zoom,
        hero_image_fit: capsule.hero_image_fit,
        hero_panel_size: capsule.hero_panel_size,
        hero_full_bleed: capsule.hero_full_bleed,
      }}
      summary={{
        contributor_count: summary?.contributor_count ?? 0,
        photo_count: livePhotoCount ?? summary?.photo_count ?? 0,
        country_count: summary?.country_count ?? 0,
        share_count: summary?.share_count ?? 0,
        legacy_builder_count: summary?.legacy_builder_count ?? 0,
        attributed_contrib_count: summary?.attributed_contrib_count ?? 0,
        last_activity_at: summary?.last_activity_at ?? null,
      }}
      builders={showBuilders ? (builders ?? []) : []}
      showBuilders={showBuilders}
      recentActivity={mergedActivity}
      galleryPhotos={galleryPhotos ?? []}
      themeKey={themeKey}
      voiceMetrics={voiceMetrics}
      storiesCount={storiesCount ?? 0}
      momentsCount={momentsCount ?? 0}
      topBuilder={topBuilderRow ?? null}
      publicationStatus={
        pubRow
          ? {
              generationStatus: pubRow.generation_status ?? 'idle',
              version: pubRow.version ?? 1,
              generatedAt: pubRow.generated_at ?? null,
              sentCount: pubSentCount ?? 0,
            }
          : null
      }

      recentStories={(recentStories ?? []).map((s: any) => ({
          id:               s.id,
          contributor_name: s.contributor_name,
          story_text:       s.story_text,
          created_at:       s.created_at,
          topic_name:       s.community_story_topics?.topic_name ?? null,
        }))}

    />
    {/* ── Event Phases strip ── */}
    {phases.length > 0 && (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 24px', fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(226,195,107,0.55)', marginBottom: '10px' }}>
          Event Phases
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {phases.map(phase => (
            <div key={phase.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(226,195,107,0.12)' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', margin: '0 0 2px' }}>{phase.name}</p>
                {phase.event_date && (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {new Date(phase.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              {phase.photo_count > 0 ? (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(226,195,107,0.55)', flexShrink: 0 }}>
                  📸 {phase.photo_count} photo{phase.photo_count !== 1 ? 's' : ''}
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  Photos on event day
                </span>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '10px', lineHeight: 1.65 }}>
          On event day, guests can share their own photos and memories from each phase. Scan the QR code at the venue or visit the tribute wall link.
        </p>
      </div>
    )}

    {/* ── Publication subscribe panel ── */}
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 16px' }}>
      <PublicationSubscribePanel
        capsuleId={capsule.id}
        honoureeName={capsule.honouree_name}
      />
    </div>

    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 8px' }}>
      <ActivePremiumsStrip slug={slug} components={capsule.components ?? []} />
    </div>

    <CapsuleBottomNav
      slug={slug}
      currentPage="legacy"
      components={capsule.components ?? []}
      contributorCount={summary?.contributor_count ?? 0}
      hasPhases={(phaseCount ?? 0) > 0}
      themeKey={themeKey}
      capsuleId={capsule.id}
      honourName={capsule.honouree_name}
      eventType={capsule.event_type}
      supportAccounts={supportAccounts ?? []}
      phases={phases.map(p => ({ id: p.id, name: p.name }))}
      latestVoiceAt={latestVoice?.created_at ?? null}
latestHighlightAt={latestVoice?.created_at ?? null}
    />
    </>
  )
}
