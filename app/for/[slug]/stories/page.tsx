// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/stories/page.tsx
// PURPOSE: Community Memories & Stories room — public server component
// Route: /for/[slug]/stories
// UPDATED: AI14 · Claude Sonnet 4.6 · July 2026
//   — Added: category field to StoryTopic type and DB query
//   — Category-aware data passed to CommunityStoriesClient
// ARCHITECTURE: LC02 LC05
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }            from '@supabase/supabase-js'
import { notFound }                from 'next/navigation'
import { resolveTheme }            from '@/lib/themeConfig'
import CommunityStoriesClient      from '@/components/CommunityStoriesClient'
import CapsuleBottomNav            from '@/components/CapsuleBottomNav'
import ActivePremiumsStrip         from '@/components/ActivePremiumsStrip'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StoryTopic {
  id:            string
  topic_name:    string
  topic_source:  'system' | 'organiser' | 'community'
  status:        string
  display_order: number
  story_count:   number
  category:      string   // Added AI14 — groups topics into browsable categories
}

export interface CommunityStory {
  id:                    string
  story_topic_id:        string
  contributor_name:      string
  tribute_text:          string
  relationship:          string | null
  city:                  string | null
  country:               string | null
  thumbnail_url:         string | null
  admin_response:        string | null
  era:                   string | null
  relationship_category: string | null
  created_at:            string
}

export interface CapsuleInfo {
  id:            string
  slug:          string
  honouree_name: string
  event_type:    string
  event_tag:     string | null
  components:    string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: capsule } = await supabase
    .from('capsules')
    .select('honouree_name')
    .eq('slug', slug)
    .single()

  return {
    title: capsule
      ? `Community Stories — ${capsule.honouree_name}`
      : 'Community Stories',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function CommunityStoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── Fetch capsule ─────────────────────────────────────────────────────────
  const { data: capsule, error: capsuleError } = await supabase
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, theme, components, page_state')
    .eq('slug', slug)
    .single()

  if (capsuleError || !capsule) return notFound()
  if (capsule.page_state === 'suspended') return notFound()

  const components: string[] = capsule.components ?? []

  // ── Fetch active topics — now includes category ───────────────────────────
  const { data: topicsRaw } = await supabase
    .from('community_story_topics')
    .select('id, topic_name, topic_source, status, display_order, category')
    .eq('capsule_id', capsule.id)
    .eq('status', 'active')
    .order('display_order', { ascending: true })

  // ── Fetch approved community stories ─────────────────────────────────────
  const { data: storiesRaw } = await supabase
    .from('contributions')
    .select('id, story_topic_id, contributor_name, tribute_text, relationship, city, country, thumbnail_url, admin_response, era, relationship_category, created_at, community_story_topics(topic_name, category)')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .not('story_topic_id', 'is', null)
    .order('created_at', { ascending: false })

  const stories: CommunityStory[] = storiesRaw ?? []

  // ── Enrich topics with story counts and normalised category ───────────────
  const topicsWithCounts: StoryTopic[] = (topicsRaw ?? []).map(t => ({
    ...t,
    category:    t.category ?? 'General',
    story_count: stories.filter(s => s.story_topic_id === t.id).length,
  }))

  const capsuleInfo: CapsuleInfo = {
    id:            capsule.id,
    slug:          capsule.slug,
    honouree_name: capsule.honouree_name,
    event_type:    capsule.event_type,
    event_tag:     capsule.event_tag ?? null,
    components,
  }

  // ── Fetch support accounts + phases for Premiums panel ────────────────────
  const [{ data: supportAccounts }, { data: phasesData }] = await Promise.all([
    supabase
      .from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
    supabase
      .from('capsule_phases')
      .select('id, name')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
  ])


  // ── Fetch story photos ────────────────────────────────────────────────────
  const storyContribIds = stories.map(s => s.id)
  let storyPhotos: Record<string, any[]> = {}

  if (storyContribIds.length > 0) {
    const { data: photoRows } = await supabase
      .from('gallery_items')
      .select('id, contribution_id, storage_path')
      .in('contribution_id', storyContribIds)
      .eq('source', 'stories')

    if (photoRows) {
      for (const p of photoRows) {
        if (!p.contribution_id) continue
        if (!storyPhotos[p.contribution_id]) storyPhotos[p.contribution_id] = []
        storyPhotos[p.contribution_id].push(p)
      }
    }
  }
// ── Latest story timestamp for notification dot ───────────────────────────
  const latestStory = stories.length > 0 ? stories[0] : null

  // ── Latest voice timestamp for other tab dots ─────────────────────────────
  const { data: latestVoice } = await supabase
    .from('contributions')
    .select('created_at')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .is('story_topic_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasPublication = components.includes('publication')

  return (
    <>
      <CommunityStoriesClient
        capsule={capsuleInfo}
        topics={topicsWithCounts}
        stories={stories}
        storyPhotos={storyPhotos}
        hasPublication={hasPublication}
      />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 8px' }}>
        <ActivePremiumsStrip slug={slug} components={components} />
      </div>

      <CapsuleBottomNav
        slug={slug}
        currentPage="memories"
        components={components}
        contributorCount={stories.length}
        hasPhases={(phasesData?.length ?? 0) > 0}
        themeKey={resolveTheme(capsule.theme, capsule.event_type)}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportAccounts ?? []}
       phases={phasesData ?? []}
        latestVoiceAt={latestVoice?.created_at ?? null}
        latestMemoryAt={latestStory?.created_at ?? null}
        latestHighlightAt={latestVoice?.created_at ?? null}
  
  />
    </>
  )
}
