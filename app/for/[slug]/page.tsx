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
import ActivePremiumsStrip from '@/components/ActivePremiumsStrip'

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
    .select('honouree_name, event_tag, hero_image_url, cover_attributes')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Tribute Wall · LegacyCapsule' }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
  
  // 1. Build authoritative parameters matching our Edge OG Engine specifications
  const ogTitle = data.honouree_name || 'A Living Story'
  const ogSubtitle = data.event_tag || 'Legacy Capsule'
  const layoutMode = data.cover_attributes?.mode || 'publication' // Fallback to premium publication cover template
  
  // 2. Stringify the custom cover attributes payload safely to convey quotes/accents
  const coverAttributesStr   = JSON.stringify(data.cover_attributes ?? {})
  const coverAttributesParam = coverAttributesStr !== '{}' && coverAttributesStr !== 'null'
    ? encodeURIComponent(coverAttributesStr)
    : ''

  // 3. Assemble stable OG image URL — no timestamp cache-buster
  // WhatsApp and social platforms cache by URL — a changing URL breaks preview display
  let ogImageUrl = `${appUrl}/api/og/${slug}`
  
   

  const eventContext = data.event_tag ?? null
  const ogPageTitle = eventContext
    ? `${data.honouree_name} — ${eventContext}`
    : data.honouree_name
  const ogDescription = eventContext
    ? `${eventContext} — Add your voice and help preserve the memories and stories that matter most.`
    : `A tribute collection for ${data.honouree_name}. Add your voice and help build a permanent record.`

  return {
    title: `${ogPageTitle} · LegacyCapsule`,
    description: ogDescription,
    openGraph: {
      title: `${ogPageTitle} · LegacyCapsule`,
      description: ogDescription,
      url: `${appUrl}/for/${slug}`,
      siteName: 'LegacyCapsule',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${ogPageTitle} · LegacyCapsule`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ogPageTitle} · LegacyCapsule`,
      description: ogDescription,
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
  const { data: latestVoice } = await supabase
  .from('contributions')
  .select('created_at')
  .eq('capsule_id', capsule.id)
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
  
  const [contribRes, profileRes, featuredRes, supportRes] = await Promise.all([
    supabase
      .from('contributions')
      .select(
        'id, contributor_name, city, country, ip_country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at'
      )
      .eq('capsule_id', capsule.id)
      .in('status', ['approved', 'pending_review', 'pending'])
      .is('deleted_at', null)
      .is('story_topic_id', null)
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
  const { data: phasesData } = await supabase
    .from('capsule_phases')
    .select('id, name')
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
  const phaseCount = phasesData?.length ?? 0

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
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 8px' }}>
        <ActivePremiumsStrip slug={slug} components={capsule.components ?? []} />
      </div>

      <CapsuleBottomNav
        slug={slug}
        currentPage="tribute"
        components={capsule.components ?? []}
        contributorCount={capsule.approved_contrib_count ?? 0}
        hasPhases={(phaseCount ?? 0) > 0}
        themeKey={themeKey}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportRes.data ?? []}
        phases={phasesData ?? []}
         latestVoiceAt={latestVoice?.created_at ?? null}
        latestHighlightAt={latestVoice?.created_at ?? null}       
      />
    </>
  )
}
