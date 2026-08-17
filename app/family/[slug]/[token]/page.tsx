// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/family/[slug]/[token]/page.tsx
// PURPOSE:   Family Rep Elder portal — server component.
//            Token-gated. First visit: validates invite token → sets 30-day cookie.
//            Subsequent visits: validates cookie (fast path).
//            Fetches all data the Elder needs and passes to client component.
//            Falls back gracefully if token is invalid or expired.
//            THIS IS SEPARATE from /for/[slug]/honouree which remains unchanged.
// ARCHITECTURE: CA-SPEC-001 — Step 6.
//               Auth: lib/familyRepAuth.ts (capsule_accounts based).
//               ECS: participation language applied throughout.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }         from '@supabase/supabase-js'
import { notFound, redirect }   from 'next/navigation'
import { checkFamilyRepAuth }   from '@/lib/familyRepAuth'
import FamilyRepElderPortalClient from '@/components/family/FamilyRepElderPortalClient'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Page component ═══

export default async function FamilyRepElderPortalPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params

  // ── Auth gate ─────────────────────────────────────────────────────────────
  // token in URL = first visit (invite link click)
  // cookie only = returning visitor
  const auth = await checkFamilyRepAuth(slug, token)

  if (!auth.valid) {
    // Show a graceful access error — not a 404
    // Redirect to tribute wall with an error hint
    redirect(`/for/${slug}?portal_error=1`)
  }

  const capsuleId = auth.capsuleId!

  // ── Fetch capsule ─────────────────────────────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, hero_image_url, theme, organiser_email, components')
    .eq('id', capsuleId)
    .eq('slug', slug)
    .maybeSingle()

  if (!capsule) notFound()

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [
    contributionsRes,
    storiesRes,
    supportAccountsRes,
    acknowledgementsRes,
    appreciationRes,
  ] = await Promise.all([

    // Approved contributions (voices) — with existing responses
    db.from('contributions')
      .select('id, contributor_name, city, country, ip_country, relationship, tribute_text, thumbnail_url, audio_url, video_url, created_at, status, email, tribute_responses(response_text, responded_by)')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .is('story_topic_id', null)   // voices only — stories fetched separately
      .order('created_at', { ascending: false }),

    // Community stories (contributions with story_topic_id)
    db.from('contributions')
      .select('id, contributor_name, relationship, tribute_text, status, created_at, story_topic_id, community_story_topics(topic_name)')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .not('story_topic_id', 'is', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    // Ways to Honour accounts
    db.from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
      .eq('capsule_id', capsuleId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),

    // Support acknowledgements
    db.from('support_acknowledgements')
      .select('id, supporter_name, supporter_email, created_at, support_account_id')
      .eq('capsule_id', capsuleId)
      .order('created_at', { ascending: false }),

    // Family Appreciation section (if exists)
    db.from('capsule_profile_sections')
      .select('id, content')
      .eq('capsule_id', capsuleId)
      .eq('section_type', 'appreciation')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  return (
    <FamilyRepElderPortalClient
      capsule={capsule}
      contributions={contributionsRes.data ?? []}
      stories={(storiesRes.data ?? []).map((s: any) => ({
        id:               s.id,
        contributor_name: s.contributor_name,
        relationship:     s.relationship,
        story_text:       s.tribute_text,
        status:           s.status,
        created_at:       s.created_at,
        topic_id:         s.story_topic_id,
        topic_name:       s.community_story_topics?.topic_name ?? null,
      }))}
      supportAccounts={supportAccountsRes.data ?? []}
      acknowledgements={acknowledgementsRes.data ?? []}
      appreciation={appreciationRes.data ?? null}
      elderName={auth.name ?? 'Family Representative'}
      elderId={auth.accountId!}
    />
  )
}
