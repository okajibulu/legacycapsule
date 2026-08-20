// ============================================================
// FILE PATH: app/manage/[slug]/display/page.tsx
// PURPOSE:   EDS management page in the organiser dashboard.
//            Houses two sub-sections:
//              1. Video Reel (Output A) — upload, curate, play
//              2. Offline Display (Output B) — export HTML
//            Component gating bypassed via env flag for
//            Founder event pilot (EDS_BYPASS_GATE=true).
//            Proper gating wired in after pilot.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

// ═══ SECTION 1 — Imports ═══

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'
import VideoReelEditor from '@/components/manage/display/VideoReelEditor'
import DisplayExportPanel from '@/components/manage/display/DisplayExportPanel'

// ═══ SECTION 2 — Supabase Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 3 — Page Props ═══

interface PageProps {
  params: Promise<{ slug: string }>
}

// ═══ SECTION 4 — Page Component ═══

export default async function ManageDisplayPage({ params }: PageProps) {
  const { slug } = await params

  // ── 4a. Auth ──
  const auth = await checkManageAuth(slug)

  if (
    auth.accountType === 'coadmin' &&
    !auth.permissions.includes('event_display')
  ) {
    redirect(`/manage/${slug}`)
  }

  // ── 4b. Resolve capsule ──
  let capsuleId = auth.capsuleId
  let capsule: {
    id: string
    honouree_name: string
    event_type: string
    components: string[]
  } | null = null

  if (capsuleId) {
    const { data } = await db
      .from('capsules')
      .select('id, honouree_name, event_type, components')
      .eq('id', capsuleId)
      .maybeSingle()
    capsule = data
  } else {
    const { data } = await db
      .from('capsules')
      .select('id, honouree_name, event_type, components')
      .eq('slug', slug)
      .maybeSingle()
    capsule = data
    capsuleId = data?.id ?? null
  }

  if (!capsule || !capsuleId) {
    redirect(`/manage/${slug}`)
  }

  // ── 4c. Component gating ──
  // EDS_BYPASS_GATE=true bypasses for Founder event pilot.
  // When false: capsule must have event_display_offline component.
  const bypassGate = process.env.EDS_BYPASS_GATE === 'true'
  const hasOfflineAccess =
    bypassGate ||
    (Array.isArray(capsule.components) &&
      (capsule.components.includes('event_display_offline') ||
        capsule.components.includes('event_display_live')))

  if (!hasOfflineAccess) {
    redirect(`/manage/${slug}`)
  }

  // ═══ SECTION 5 — Render ═══

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#9ca3af',
          margin: '0 0 0.4rem',
        }}>
          Event Display
        </p>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 0.5rem',
          fontFamily: 'Georgia, serif',
        }}>
          Display Setup
        </h1>
        <p style={{
          fontSize: '0.9rem',
          color: '#6b7280',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Set up what plays on your event screen.
          Upload tribute videos for a branded reel, or export
          all tributes and stories as an offline display file.
        </p>
      </div>

      {/* ── Section divider ── */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, #D4AE2A 0%, transparent 100%)',
        opacity: 0.3,
        marginBottom: '2.5rem',
      }} />

      {/* ── Output A: Video Reel ── */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{
              background: '#0D0820',
              color: '#D4AE2A',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
            }}>
              Output A
            </span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Video Reel
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Upload tribute videos, choose the order, then play the full branded reel
            on your event screen. Downloads as a zip file you can open anywhere.
          </p>
        </div>

        <VideoReelEditor
          capsuleSlug={slug}
          capsuleId={capsuleId}
          honoureeName={capsule.honouree_name}
          eventType={capsule.event_type}
        />
      </section>

      {/* ── Divider ── */}
      <div style={{
        height: '1px',
        background: '#e5e7eb',
        margin: '0 0 3rem',
      }} />

      {/* ── Output B: Offline Display ── */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{
              background: '#0D0820',
              color: '#D4AE2A',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
            }}>
              Output B
            </span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Offline Display
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Export all tributes, stories, and event photos as a self-contained
            display file. Open it on any laptop — no internet needed.
            Plays beautifully on a large screen TV or projector.
          </p>
        </div>

        <DisplayExportPanel
          capsuleSlug={slug}
          capsuleId={capsuleId}
          honoureeName={capsule.honouree_name}
          eventType={capsule.event_type}
        />
      </section>

      {/* ── Help note ── */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        marginTop: '1rem',
      }}>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: '#374151' }}>On the day:</strong> Open the display file or zip in Chrome.
          Press <kbd style={{ background: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.75rem' }}>F11</kbd> for fullscreen.
          Connect your laptop to the TV or projector via HDMI before opening.
          Keep this page open on a second tab to make changes during the event.
        </p>
      </div>

    </div>
  )
}
