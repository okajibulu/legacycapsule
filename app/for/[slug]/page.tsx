/* =========================================================
   app/for/[slug]/page.tsx — SERVER COMPONENT
   Fetches capsule, contributions, profile sections,
   featured photos. Resolves theme. Passes all to client.
========================================================= */

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { resolveTheme } from '@/lib/themeConfig'
import TributeWallClient from '@/components/TributeWallClient'
import CapsuleBottomNav from '@/components/CapsuleBottomNav'

/* =========================================================
   GENERATE METADATA
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

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
  const ogImageUrl = `${appUrl}/api/og/${slug}`
return {
  title: `${data.honouree_name} · LegacyCapsule`,

  description: data.event_tag
    ? `Add your voice to this ${data.event_tag.toLowerCase()} and help preserve the memories, stories and tributes that matter most.`
    : `Add your voice and help preserve the memories, stories and tributes that matter most.`,

  openGraph: {
    title: `${data.honouree_name} · LegacyCapsule`,

    description: data.event_tag
      ? `Add your voice to this ${data.event_tag.toLowerCase()} and help preserve the memories, stories and tributes that matter most.`
      : `Add your voice and help preserve the memories, stories and tributes that matter most.`,

    url: `https://itslegacycapsule.com/for/${slug}`,

    siteName: 'LegacyCapsule',

    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${data.honouree_name} · LegacyCapsule`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    images: [ogImageUrl],
  },
}
}

/* =========================================================
   PAGE COMPONENT  xxxxxxx
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

  // Fetch capsule first — need id for other queries
  const { data: capsule, error: capsuleError } = await supabase
    .from('capsules')
    .select(
      'id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, theme, hero_image_url, organiser_email, free_tier_expires_at, created_at, approved_contrib_count, components, hero_image_position, hero_image_zoom, hero_image_fit, hero_panel_size, hero_full_bleed'
    )
    .eq('slug', slug)
    .single()

  if (capsuleError || !capsule) notFound()

  if (capsule.page_state === 'suspended') {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f0a1e' }}>
        <p style={{ color: 'rgba(226,195,107,0.5)', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          This capsule is currently unavailable.
        </p>
      </main>
    )
  }

  // Parallel fetch — contributions, sections, photos
  const [contribRes, profileRes, featuredRes, supportRes] = await Promise.all([
    supabase
      .from('contributions')
      .select(
        'id, contributor_name, city, country, ip_country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at'
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

supabase
      .from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .is('deleted_at', null)
.order('sort_order', { ascending: true }),
  ])

   // Fetch phase count for bottom nav
  const { count: phaseCount } = await supabase
    .from('capsule_phases')
    .select('id', { count: 'exact' })
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)

  // Resolve theme — auto from event type, or manual override
  const themeKey = resolveTheme(capsule.theme, capsule.event_type)
  return (
    <>
      <TributeWallClient
        capsule={capsule}
        initialContributions={contribRes.data ?? []}
        profileSections={profileRes.data ?? []}
        featuredPhotos={featuredRes.data ?? []}
        supportAccounts={supportRes.data ?? []}
        themeKey={themeKey}
      />
      <CapsuleBottomNav
        slug={slug}
        currentPage="tribute"
        components={capsule.components ?? []}
        contributorCount={capsule.approved_contrib_count ?? 0}
        hasPhases={(phaseCount ?? 0) > 0}
        themeKey={themeKey}
      />
    </>
  )
}
