// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/manage/[slug]/phases/[phaseId]/print/page.tsx
// PURPOSE:   Server component — print-ready QR code page for an Event Moment phase.
//            Reads slug and phaseId from params (awaited — Next.js 16 pattern).
//            Fetches capsule and phase data server-side.
//            Builds the QR URL pointing to /for/[slug]/dday?phase=[phaseId]
//            so guests land on the Event Moments upload page for that phase.
//            Passes all data as props to PhaseQRPrintClient (client component).
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.17
// DATE:      17 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { notFound }     from 'next/navigation'
import PhaseQRPrintClient from '@/components/manage/PhaseQRPrintClient'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Server page ═══

export default async function PhaseQRPrintPage({
  params,
}: {
  params: Promise<{ slug: string; phaseId: string }>
}) {
  // ── Next.js 16 — params must be awaited ───────────────────────────────
  const { slug, phaseId } = await params

  // ── Fetch capsule ─────────────────────────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('id, honouree_name, event_tag, slug')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (!capsule) notFound()

  // ── Fetch phase ───────────────────────────────────────────────────────
  const { data: phase } = await db
    .from('capsule_phases')
    .select('id, name, event_date')
    .eq('id', phaseId)
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!phase) notFound()

  // ── Build URLs ────────────────────────────────────────────────────────
  // QR points to D-Day upload page pre-selected to this phase
  const ddayUrl = `${APP_URL}/for/${slug}/dday?phase=${phaseId}`
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ddayUrl)}&bgcolor=ffffff&color=1a0845&margin=16`

  return (
    <PhaseQRPrintClient
      phaseName={phase.name}
      eventDate={phase.event_date ?? null}
      location={null}
      programmeSummary={null}
      honoureeName={capsule.honouree_name}
      eventTag={capsule.event_tag ?? null}
      capsuleSlug={slug}
      phaseId={phaseId}
      qrUrl={qrUrl}
      ddayUrl={ddayUrl}
    />
  )
}
