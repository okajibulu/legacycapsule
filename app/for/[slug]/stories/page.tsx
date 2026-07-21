// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/stories/page.tsx
// PURPOSE: Community Memories & Stories room — public server component
// Route: /for/[slug]/stories
// UPDATED: Claude Sonnet 4.6 · July 2026
//   — Fixed: event_name → honouree_name, tagline → event_tag (schema alignment)
//   — Renamed: Community Stories → Community Memories & Stories (UI only)
//   — Added: CapsuleBottomNav, admin_response field
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }            from '@supabase/supabase-js'
import { notFound }                from 'next/navigation'
import CommunityStoriesClient      from '@/components/CommunityStoriesClient'
import CapsuleBottomNav            from '@/components/CapsuleBottomNav'
import PublicationSubscribePanel   from '@/components/capsule/PublicationSubscribePanel'

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
}

export interface CommunityStory {
  id:               string
  story_topic_id:   string
  contributor_name: string
  tribute_text:     string
  relationship:     string | null
  city:             string | null
  country:          string | null
  thumbnail_url:    string | null
  admin_response:   string | null
  created_at:       string
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
    title: capsule ? `Community Memories & Stories — ${capsule.honouree_name}` : 'Community Memories & Stories',
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
    .select('id, slug, honouree_name, event_type, event_tag, components, page_state')
    .eq('slug', slug)
    .single()

  if (capsuleError || !capsule) return notFound()
  if (capsule.page_state !== 'active') return notFound()

  // ── Check Community Stories is activated ──────────────────────────────────
  const components: string[] = capsule.components ?? []
  // Community Stories is free and always accessible — no component guard needed

  // ── Fetch active topics ───────────────────────────────────────────────────
  const { data: topicsRaw } = await supabase
    .from('community_story_topics')
    .select('id, topic_name, topic_source, status, display_order')
    .eq('capsule_id', capsule.id)
    .eq('status', 'active')
    .order('display_order', { ascending: true })

  // ── Fetch approved community stories ─────────────────────────────────────
  const { data: storiesRaw } = await supabase
    .from('contributions')
    .select('id, story_topic_id, contributor_name, tribute_text, relationship, city, country, thumbnail_url, admin_response, created_at')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .not('story_topic_id', 'is', null)
    .order('created_at', { ascending: false })

  const stories: CommunityStory[] = storiesRaw ?? []

  // ── Enrich topics with story counts ──────────────────────────────────────
  const topicsWithCounts: StoryTopic[] = (topicsRaw ?? []).map(t => ({
    ...t,
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

  // ── Fetch EOH accounts if Gift of Honour is active ───────────────────────
  let eohAccounts: { method_label: string; account_holder: string; reference_guide: string | null }[] = []
  if (components.includes('ways_to_honour')) {
    const { data: accounts } = await supabase
      .from('capsule_support_accounts')
      .select('method_label, account_holder, reference_guide')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
    eohAccounts = accounts ?? []
  }

  return (
    <>
      <CommunityStoriesClient
        capsule={capsuleInfo}
        topics={topicsWithCounts}
        stories={stories}
        eohAccounts={eohAccounts}
      />
      {/* ── Publication subscribe panel ── */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 8px' }}>
        <PublicationSubscribePanel
          capsuleId={capsule.id}
          honoureeName={capsule.honouree_name}
        />
      </div>
      {(() => {
        const themeKey = 'classic' as any
        return (
          <CapsuleBottomNav
            slug={slug}
            currentPage="memories"
            components={components}
            contributorCount={stories.length}
            hasPhases={false}
            themeKey={themeKey}
          />
        )
      })()}
    </>
  )
}
