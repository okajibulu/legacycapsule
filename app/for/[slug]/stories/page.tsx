// FILE: app/for/[slug]/stories/page.tsx
// Purpose: Community Stories room — public page
// Route: /for/[slug]/stories
// Type: Server Component
// AI10 · June 2026

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import CommunityStoriesClient from '@/components/CommunityStoriesClient'

// ── SECTION: Types ───────────────────────────────────────────

export interface StoryTopic {
  id: string
  topic_name: string
  topic_source: 'system' | 'organiser' | 'community'
  status: string
  display_order: number
  story_count: number
}

export interface CommunityStory {
  id: string
  story_topic_id: string
  contributor_name: string
  tribute_text: string
  relationship: string | null
  city: string | null
  country: string | null
  thumbnail_url: string | null
  created_at: string
}

export interface CapsuleInfo {
  id: string
  slug: string
  event_name: string
  event_type: string
  tagline: string | null
  components: string[]
}

// ── SECTION: Metadata ────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: capsule } = await supabase
    .from('capsules')
    .select('event_name')
    .eq('slug', slug)
    .single()

  return {
    title: capsule ? `Community Stories — ${capsule.event_name}` : 'Community Stories',
  }
}

// ── SECTION: Page ────────────────────────────────────────────

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

  // ── Fetch capsule ──────────────────────────────────────────
  const { data: capsule, error: capsuleError } = await supabase
    .from('capsules')
    .select('id, slug, event_name, event_type, tagline, components, page_state')
    .eq('slug', slug)
    .single()

  if (capsuleError || !capsule) return notFound()
  if (capsule.page_state !== 'active') return notFound()

  // ── Check Community Stories is activated ──────────────────
  const components: string[] = capsule.components ?? []
  if (!components.includes('community_stories')) return notFound()

  // ── Fetch active topics with story counts ─────────────────
  const { data: topicsRaw } = await supabase
    .from('community_story_topics')
    .select('id, topic_name, topic_source, status, display_order')
    .eq('capsule_id', capsule.id)
    .eq('status', 'active')
    .order('display_order', { ascending: true })

  // ── Fetch all approved community stories ──────────────────
  const { data: storiesRaw } = await supabase
    .from('contributions')
    .select('id, story_topic_id, contributor_name, tribute_text, relationship, city, country, thumbnail_url, created_at')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .not('story_topic_id', 'is', null)
    .order('created_at', { ascending: false })

  const stories: CommunityStory[] = storiesRaw ?? []

  // ── Enrich topics with story counts, filter to topics with stories ──
  const topicsWithCounts: StoryTopic[] = (topicsRaw ?? [])
    .map(t => ({
      ...t,
      story_count: stories.filter(s => s.story_topic_id === t.id).length,
    }))
    .filter(t => t.story_count > 0)

  const capsuleInfo: CapsuleInfo = {
    id: capsule.id,
    slug: capsule.slug,
    event_name: capsule.event_name,
    event_type: capsule.event_type,
    tagline: capsule.tagline,
    components,
  }

  return (
    <CommunityStoriesClient
      capsule={capsuleInfo}
      topics={topicsWithCounts}
      stories={stories}
    />
  )
}
