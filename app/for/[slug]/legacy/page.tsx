// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/legacy/page.tsx
// ROUTE: /for/[slug]/legacy
// PURPOSE: Legacy Room — Phase 2 of LC-PARTICIPATION-001
//          Public-facing community participation page.
//          Three-Room Model Room 3: View community participation + preservation.
//          ISR with 60s revalidation (E6). Reads pre-computed data only (D9).
// OWNER: AI7
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { resolveTheme } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'
import LegacyRoomClient from '@/components/LegacyRoomClient'
import type { Metadata } from 'next'

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

  // ── Fetch recent approved contributions (for activity feed) ───────────
  const { data: recentActivity } = await supabase
    .from('contributions')
    .select('id, contributor_name, city, country, created_at, thumbnail_url')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10)

  // ── Fetch organiser gallery (Featured Memories) ───────────────────────
  const { data: galleryPhotos } = await supabase
    .from('capsule_gallery')
    .select('id, image_url, description, sort_order, section_index')
    .eq('capsule_id', capsule.id)
    .order('section_index')
    .order('sort_order')

  // ── Resolve theme ─────────────────────────────────────────────────────
  const themeKey: ThemeKey = resolveTheme(
    (capsule.theme as ThemeKey | 'classic') ?? 'classic',
    capsule.event_type
  )

  // ── Determine builder visibility ──────────────────────────────────────
  const threshold = capsule.legacy_builder_activation_threshold ?? 10
  const attributedCount = summary?.attributed_contrib_count ?? 0
  const showBuilders = attributedCount >= threshold && (builders?.length ?? 0) > 0

  return (
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
      summary={summary ?? {
        contributor_count: 0,
        photo_count: 0,
        country_count: 0,
        share_count: 0,
        legacy_builder_count: 0,
        attributed_contrib_count: 0,
        last_activity_at: null,
      }}
      builders={showBuilders ? (builders ?? []) : []}
      showBuilders={showBuilders}
      recentActivity={recentActivity ?? []}
      galleryPhotos={galleryPhotos ?? []}
      themeKey={themeKey}
    />
  )
}
