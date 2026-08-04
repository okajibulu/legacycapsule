// ============================================================
// FILE PATH: app/for/[slug]/story/[phaseId]/page.tsx
// PURPOSE:   Event Moments gallery page — per programme item.
//            Photo-only "I Was There" presence record.
//            Replaces wrongly-conceived tribute submission room.
//            QR codes land here. Gallery always visible.
//            Upload CTA routes to /for/[slug]/dday?phase=[id]
//            during D-Day window only.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.8
// DATE:      1 August 2026
// ============================================================

import { notFound }                    from 'next/navigation'
import { createClient }                from '@supabase/supabase-js'
import { resolveTheme }                from '@/lib/themeConfig'
import CapsuleBottomNav                from '@/components/CapsuleBottomNav'
import EventMomentsClient              from '@/components/capsule/EventMomentsClient'

// ═══ SECTION 1 — Supabase client ═══

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}

// ═══ SECTION 2 — Types ═══

interface PageProps {
  params: Promise<{ slug: string; phaseId: string }>
}

// ═══ SECTION 3 — Window check ═══
// 6am event day → 6am next day

function isWindowOpen(eventDate: string | null): boolean {
  if (!eventDate) return false
  const now   = new Date()
  const open  = new Date(eventDate)
  open.setHours(6, 0, 0, 0)
  const close = new Date(open)
  close.setDate(close.getDate() + 1)
  return now >= open && now < close
}

// ═══ SECTION 4 — Metadata ═══

export async function generateMetadata({ params }: PageProps) {
  const { slug, phaseId } = await params

  const { data: phase } = await getDb()
    .from('capsule_phases')
    .select('name')
    .eq('id', phaseId)
    .maybeSingle()

  const { data: capsule } = await getDb()
    .from('capsules')
    .select('honouree_name')
    .eq('slug', slug)
    .maybeSingle()

  if (!phase || !capsule) return { title: 'Event Moment | LegacyCapsule' }

  return {
    title: `${phase.name} — ${capsule.honouree_name} | LegacyCapsule`,
    description: `See who was there for ${phase.name} — ${capsule.honouree_name}'s event moment.`,
  }
}

// ═══ SECTION 5 — Page component ═══

export default async function EventMomentPage({ params }: PageProps) {
  const { slug, phaseId } = await params

  // ── Fetch capsule ──────────────────────────────────────────────────
  const { data: capsule, error: capErr } = await getDb()
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, theme, components, page_state, approved_contrib_count')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (capErr || !capsule) return notFound()
  if (capsule.page_state === 'draft' || capsule.page_state === 'suspended') return notFound()

  // ── Fetch this phase ───────────────────────────────────────────────
  const { data: phase, error: phaseErr } = await getDb()
    .from('capsule_phases')
    .select('id, capsule_id, name, event_date, location, sort_order, programme')
    .eq('id', phaseId)
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (phaseErr || !phase) return notFound()

  // ── Fetch all phases for prev/next navigation ──────────────────────
  const { data: allPhases } = await getDb()
    .from('capsule_phases')
    .select('id, name, sort_order')
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  // ── Fetch initial photos (first 20 guest + all official) ───────────
  const [guestRes, officialRes, guestCountRes] = await Promise.all([
    getDb()
      .from('gallery_items')
      .select('id, image_url, contributor_name, created_at, display_order')
      .eq('phase_id', phaseId)
      .eq('source', 'dday')
      .eq('is_official_photography', false)
      .eq('approved', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20),

    getDb()
      .from('gallery_items')
      .select('id, image_url, contributor_name, created_at, display_order')
      .eq('phase_id', phaseId)
      .eq('source', 'dday')
      .eq('is_official_photography', true)
      .order('display_order', { ascending: true }),

    getDb()
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('phase_id', phaseId)
      .eq('source', 'dday')
      .eq('is_official_photography', false)
      .eq('approved', true),
  ])

  // ── Fetch support accounts for Premiums panel ──────────────────────
  const { data: supportAccounts } = await getDb()
    .from('capsule_support_accounts')
    .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
    .eq('capsule_id', capsule.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const themeKey   = resolveTheme(capsule.theme, capsule.event_type)
  const windowOpen = isWindowOpen(phase.event_date)

  const phaseIndex = (allPhases ?? []).findIndex(p => p.id === phaseId)
  const prevPhase  = phaseIndex > 0 ? (allPhases ?? [])[phaseIndex - 1] : null
  const nextPhase  = phaseIndex < (allPhases ?? []).length - 1
    ? (allPhases ?? [])[phaseIndex + 1]
    : null

  // Parse programme
  const programme     = phase.programme as any
  const programmeItems: Array<{ time: string; description: string }> =
    programme?.items ?? []
  const programmeSummary: string = programme?.summary ?? ''

  return (
    <>
      <EventMomentsClient
        capsule={{
          id:            capsule.id,
          slug:          capsule.slug,
          honouree_name: capsule.honouree_name,
          event_type:    capsule.event_type,
          event_tag:     capsule.event_tag ?? null,
        }}
        phase={{
          id:         phase.id,
          name:       phase.name,
          event_date: phase.event_date ?? null,
          location:   phase.location   ?? null,
          sort_order: phase.sort_order,
          programme_summary: programmeSummary,
          programme_items:   programmeItems,
        }}
        phaseIndex={phaseIndex}
        prevPhase={prevPhase}
        nextPhase={nextPhase}
        allPhases={allPhases ?? []}
        initialGuestPhotos={guestRes.data ?? []}
        initialOfficialPhotos={officialRes.data ?? []}
        totalGuestCount={guestCountRes.count ?? 0}
        windowOpen={windowOpen}
        themeKey={themeKey}
      />

      <CapsuleBottomNav
        slug={slug}
        currentPage="none"
        components={capsule.components ?? []}
        contributorCount={capsule.approved_contrib_count ?? 0}
        hasPhases={true}
        themeKey={themeKey}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportAccounts ?? []}
      />
    </>
  )
}