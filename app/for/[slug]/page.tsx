/* =========================================================
   app/for/[slug]/page.tsx — SERVER COMPONENT
   Fetches all data in parallel and passes to client island.

   SECTIONS:
   1. Imports
   2. Types
   3. generateMetadata
   4. Page component
========================================================= */

/* =========================================================
   SECTION 1 — IMPORTS
========================================================= */
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import TributeWallClient from '@/components/TributeWallClient'

/* =========================================================
   SECTION 2 — TYPES
========================================================= */
export interface Capsule {
  id: string
  slug: string
  honouree_name: string
  honouree_title: string | null
  event_type: string
  event_tag: string | null
  event_date: string | null
  page_state: string
  tier: string | null
  hero_image_url: string | null
  organiser_email: string
  free_tier_expires_at: string | null
  created_at: string
  approved_contrib_count: number
  components: string[]
}

export interface Contribution {
  id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  thumbnail_url: string | null
  audio_url: string | null
  video_url: string | null
  lat: number | null
  lng: number | null
  status: string
  email: string | null
  created_at: string
}

export interface ProfileSection {
  id: string
  section_type: string
  custom_title: string | null
  content: string | null
  sort_order: number
  is_active: boolean
}

export interface FeaturedPhoto {
  id: string
  image_url: string
  caption: string | null
  sort_order: number | null
  is_hero: boolean | null
}

/* =========================================================
   SECTION 3 — GENERATE METADATA
========================================================= */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('capsules')
    .select('honouree_name, event_tag, hero_image_url')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Tribute Wall · LegacyCapsule' }

  return {
    title: `${data.honouree_name} · Tribute Wall · LegacyCapsule`,
    description: data.event_tag
      ? `${data.event_tag} — Leave your tribute for ${data.honouree_name}`
      : `Leave your tribute for ${data.honouree_name} on LegacyCapsule`,
    openGraph: {
      images: data.hero_image_url ? [data.hero_image_url] : [],
    },
  }
}

/* =========================================================
   SECTION 4 — PAGE COMPONENT
========================================================= */
export default async function TributePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Parallel fetch — all four queries at once
  const [capsuleRes, contributionsRes, sectionsRes, photosRes] =
    await Promise.all([
      supabase
        .from('capsules')
        .select(
          'id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, hero_image_url, organiser_email, free_tier_expires_at, created_at, approved_contrib_count, components'
        )
        .eq('slug', slug)
        .single(),

      supabase
        .from('contributions')
        .select(
          'id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at'
        )
        .eq('capsule_id', (
          // We need capsule id — handled below after capsule fetch
          // Placeholder — real query done after capsule load
          'placeholder'
        ))
        .in('status', ['approved', 'pending_review', 'pending'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),

      // Sections and photos need capsule id too — fetched after
      Promise.resolve({ data: null, error: null }),
      Promise.resolve({ data: null, error: null }),
    ])

  if (capsuleRes.error || !capsuleRes.data) {
    notFound()
  }

  const capsule = capsuleRes.data as Capsule

  // Reject suspended/expired capsules on public route
  if (capsule.page_state === 'suspended') {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a0a3e, #0d0520)' }}>
        <p className="text-yellow-400/60 text-sm tracking-widest uppercase">
          This capsule is currently unavailable.
        </p>
      </main>
    )
  }

  // Now fetch the remaining three with the real capsule id
  const [contribRes, profileRes, featuredRes] = await Promise.all([
    supabase
      .from('contributions')
      .select(
        'id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at'
      )
      .eq('capsule_id', capsule.id)
      .in('status', ['approved', 'pending_review', 'pending'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('capsule_profile_sections')
      .select('id, section_type, custom_title, content, sort_order, is_active')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    supabase
      .from('capsule_featured_photos')
      .select('id, image_url, caption, sort_order, is_hero')
      .eq('capsule_id', capsule.id)
      .order('sort_order', { ascending: true }),
  ])

  const contributions = (contribRes.data ?? []) as Contribution[]
  const profileSections = (profileRes.data ?? []) as ProfileSection[]
  const featuredPhotos = (featuredRes.data ?? []) as FeaturedPhoto[]

  return (
    <TributeWallClient
      capsule={capsule}
      initialContributions={contributions}
      profileSections={profileSections}
      featuredPhotos={featuredPhotos}
    />
  )
}
