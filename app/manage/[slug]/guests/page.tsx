// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/manage/[slug]/guests/page.tsx
// PURPOSE:   Guest Management dedicated page. Auth-gated (lc_visitor_email +
//            organiser check). Component-gated (guest_management in capsule
//            components). Renders GuestModule orchestrator.
//            Same structural pattern as app/manage/[slug]/access/page.tsx.
// BUILT BY:  AI15 (Claude Sonnet 4.6) · 26 July 2026
// VERSION:   v2.9.0
// ─────────────────────────────────────────────────────────────────────────────

import { cookies }       from 'next/headers'
import { redirect }      from 'next/navigation'
import { createClient }  from '@supabase/supabase-js'
import GuestModule       from '@/components/manage/guests/GuestModule'

// ═══ SECTION 1 — Supabase server client ═══

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Page props ═══

interface PageProps {
  params: Promise<{ slug: string }>
}

// ═══ SECTION 3 — Server component ═══

export default async function GuestsPage({ params }: PageProps) {

  // ── 3.1 Await params (Next.js 16 requirement) ────────────────────────────

  const { slug } = await params

  // ── 3.2 Read visitor session cookie ──────────────────────────────────────

  const cookieStore = await cookies()
  const visitorEmail = cookieStore.get('lc_visitor_email')?.value

  if (!visitorEmail) {
    redirect(`/manage/${slug}?reason=session_expired`)
  }

  // ── 3.3 Load capsule + verify organiser ──────────────────────────────────

  const { data: capsule, error: capsuleErr } = await supabase
    .from('capsules')
    .select('id, slug, title, honouree_name, event_tag, tier, organiser_email, components, status')
    .eq('slug', slug)
    .single()

  if (capsuleErr || !capsule) {
    redirect('/manage?reason=not_found')
  }

  if (capsule.organiser_email !== visitorEmail) {
    redirect(`/manage/${slug}?reason=unauthorised`)
  }

  // ── 3.4 Component gate — guest_management must be active ─────────────────

  const components: string[] = Array.isArray(capsule.components)
    ? capsule.components
    : []

  if (!components.includes('guest_management')) {
    redirect(`/manage/${slug}/services?reason=not_activated`)
  }

  // ── 3.5 Render orchestrator ───────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--color-canvas)]">
      <GuestModule capsule={capsule} />
    </main>
  )
}

// ═══ SECTION 4 — Page metadata ═══

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  return {
    title: `Guest Management — LegacyCapsule`,
    robots: 'noindex, nofollow',
  }
}
