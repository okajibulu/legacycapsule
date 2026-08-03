// ============================================================
// FILE PATH: app/photographer/[token]/page.tsx
// PURPOSE:   Official Photography Portal — secure token-based
//            upload interface for designated photographers.
//            Shows phase info, existing uploads, cap status.
//            Multi-file upload with per-file progress.
//            No organiser account required.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.17
// DATE:      2 August 2026
// ============================================================

import { notFound }      from 'next/navigation'
import { createClient }  from '@supabase/supabase-js'
import PhotographerPortalClient from '@/components/capsule/PhotographerPortalClient'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params
  const { data: phase } = await db
    .from('capsule_phases')
    .select('name, capsule_id, photographer_token_expires_at')
    .eq('photographer_token', token)
    .is('deleted_at', null)
    .maybeSingle()

  if (!phase) return { title: 'Official Photography Portal · LegacyCapsule' }

  const { data: capsule } = await db
    .from('capsules')
    .select('honouree_name')
    .eq('id', phase.capsule_id)
    .maybeSingle()

  return {
    title: `${phase.name} — Official Photography · LegacyCapsule`,
    description: `Upload official photos for ${capsule?.honouree_name ?? 'this event'}.`,
  }
}

export default async function PhotographerPortalPage({ params }: PageProps) {
  const { token } = await params

  // ── Validate token ───────────────────────────────────────────────────
  const { data: phase } = await db
    .from('capsule_phases')
    .select('id, capsule_id, name, event_date, location, photographer_token_expires_at')
    .eq('photographer_token', token)
    .is('deleted_at', null)
    .maybeSingle()

  if (!phase) return notFound()

  // ── Check expiry ─────────────────────────────────────────────────────
  const expired = new Date(phase.photographer_token_expires_at!) < new Date()

  // ── Fetch capsule ─────────────────────────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('slug, honouree_name, event_tag, hero_image_url')
    .eq('id', phase.capsule_id)
    .maybeSingle()

  if (!capsule) return notFound()

  // ── Fetch existing official photos ────────────────────────────────────
  const { data: existingPhotos, count: photoCount } = await db
    .from('gallery_items')
    .select('id, image_url, created_at', { count: 'exact' })
    .eq('phase_id', phase.id)
    .eq('source', 'dday')
    .eq('is_official_photography', true)
    .order('created_at', { ascending: false })

  const CAP       = 30
  const uploaded  = photoCount ?? 0
  const remaining = Math.max(0, CAP - uploaded)

  return (
    <PhotographerPortalClient
      token={token}
      expired={expired}
      phase={{
        id:         phase.id,
        name:       phase.name,
        event_date: phase.event_date ?? null,
        location:   phase.location   ?? null,
      }}
      capsule={{
        slug:          capsule.slug,
        honouree_name: capsule.honouree_name,
        event_tag:     capsule.event_tag     ?? null,
        hero_image_url: capsule.hero_image_url ?? null,
      }}
      existingPhotos={existingPhotos ?? []}
      uploaded={uploaded}
      remaining={remaining}
      cap={CAP}
    />
  )
}