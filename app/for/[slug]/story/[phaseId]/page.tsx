/**
 * ============================================================
 * FILE PATH: app/for/[slug]/story/[phaseId]/page.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Event Phase Detail — individual phase story page
 * QR code scans land here. D-Day capture window active.
 *
 * Sub-sections:
 *   1. Server data fetching + metadata
 *   2. Phase header + programme
 *   3. D-Day capture CTA (when window is open)
 *   4. Phase contributions display
 *   5. Navigation
 * ============================================================
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import { getEventTypeLabel } from '@/lib/eventLabels'
import Link from 'next/link'
import CapsuleBottomNav from '@/components/CapsuleBottomNav'

// ============================================================
// SECTION 1 — Server setup + data fetching
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ slug: string; phaseId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, phaseId } = await params
  const { data: phase } = await adminClient
    .from('capsule_phases')
    .select('name')
    .eq('id', phaseId)
    .maybeSingle()

  const { data: capsule } = await adminClient
    .from('capsules')
    .select('honouree_name')
    .eq('slug', slug)
    .maybeSingle()

  if (!phase || !capsule) return { title: 'Event Phase | LegacyCapsule' }
  return {
    title: `${phase.name} — ${capsule.honouree_name} | LegacyCapsule`,
  }
}

export default async function EventPhasePage({ params }: PageProps) {
  const { slug, phaseId } = await params

  // ── Fetch capsule ─────────────────────────────────────
  const { data: capsule, error: capErr } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, theme, components, page_state, approved_contrib_count')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (capErr || !capsule) return notFound()
  if (capsule.page_state === 'draft') return notFound()

  // ── Fetch this phase ──────────────────────────────────
  const { data: phase, error: phaseErr } = await adminClient
    .from('capsule_phases')
    .select('id, capsule_id, name, event_date, location, sort_order, programme, capture_window_closes_at, qr_token')
    .eq('id', phaseId)
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (phaseErr || !phase) return notFound()

  // ── Fetch all phases (for nav) ────────────────────────
  const { data: allPhases } = await adminClient
    .from('capsule_phases')
    .select('id, name, sort_order')
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .order('sort_order')

  // Fetch support accounts for Premiums panel
  const { data: supportAccounts } = await adminClient
    .from('capsule_support_accounts')
    .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
    .eq('capsule_id', capsule.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const themeKey = resolveTheme(capsule.theme, capsule.event_type)
  const t = getThemeConfig(themeKey)

  const captureOpen = !phase.capture_window_closes_at ||
    new Date(phase.capture_window_closes_at) > new Date()

  const isToday = phase.event_date === new Date().toISOString().split('T')[0]

  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
  const phaseSubmitUrl = `${APP_URL}/for/${slug}?phase=${phase.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(phaseSubmitUrl)}&bgcolor=0f0a1e&color=D4AE2A&margin=10`

  function formatDate(d: string | null): string {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  // Parse programme — supports {summary, items: [{time, description}]}
  const programme = phase.programme as any
  const programmeItems: Array<{time: string; description: string}> =
    programme?.items ?? []
  const programmeSummary: string = programme?.summary ?? ''

  const phaseIndex = (allPhases ?? []).findIndex(p => p.id === phaseId)
  const prevPhase = phaseIndex > 0 ? (allPhases ?? [])[phaseIndex - 1] : null
  const nextPhase = phaseIndex < (allPhases ?? []).length - 1 ? (allPhases ?? [])[phaseIndex + 1] : null

  return (
    <div style={{ minHeight: '100vh', background: t.pageBg, fontFamily: "'DM Sans', sans-serif", paddingBottom: '80px' }}>

      {/* ── TOP NAV ── */}
      <div style={{ background: 'rgba(15,10,30,0.96)', borderBottom: `1px solid ${t.accentFaint}`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/for/${slug}/story`} style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none' }}>← Event Story</Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            {prevPhase && (
              <Link href={`/for/${slug}/story/${prevPhase.id}`} style={{ fontSize: '11px', color: t.textFaint, textDecoration: 'none' }}>‹ Prev</Link>
            )}
            {nextPhase && (
              <Link href={`/for/${slug}/story/${nextPhase.id}`} style={{ fontSize: '11px', color: t.accentMuted, textDecoration: 'none' }}>Next ›</Link>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Phase header ── */}
      <div style={{ padding: '32px 20px 20px', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {/* Phase number badge */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isToday ? `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})` : 'rgba(255,255,255,0.06)', border: `1px solid ${t.accentFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: isToday ? '#1a0845' : t.accentMuted }}>
              {(phaseIndex + 1).toString().padStart(2, '0')}
            </span>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
              {phase.name}
            </h1>
            <p style={{ fontSize: '11px', color: t.textFaint, margin: '3px 0 0' }}>
              {capsule.honouree_name}{capsule.event_tag ? ` · ${capsule.event_tag}` : ''}
            </p>
          </div>
        </div>

        {/* Date + location */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const, marginBottom: '6px' }}>
          {phase.event_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📅</span>
              <span style={{ fontSize: '12px', color: isToday ? t.accentPrimary : t.accentMuted, fontWeight: isToday ? 700 : 400 }}>
                {isToday ? `Today — ${formatDate(phase.event_date)}` : formatDate(phase.event_date)}
              </span>
            </div>
          )}
          {phase.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📍</span>
              <span style={{ fontSize: '12px', color: t.textFaint }}>{phase.location}</span>
            </div>
          )}
        </div>

        {/* Programme summary */}
        {programmeSummary && (
          <p style={{ fontSize: '13px', color: t.textFaint, lineHeight: 1.7, marginTop: '10px', fontStyle: 'italic', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.accentFaint}` }}>
            {programmeSummary}
          </p>
        )}

        {/* Programme items */}
        {programmeItems.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: t.accentMuted, marginBottom: '10px' }}>Programme</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {programmeItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.accentFaint}` }}>
                  {item.time && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: t.accentPrimary, flexShrink: 0, minWidth: '50px' }}>{item.time}</span>
                  )}
                  <span style={{ fontSize: '12px', color: t.textFaint, lineHeight: 1.5 }}>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Gold rule ── */}
      <div style={{ height: '2px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />

      {/* ── SECTION 3: D-Day Capture CTA ── */}
      {captureOpen && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 16px' }}>
          {isToday ? (
            <div style={{ borderRadius: '16px', border: `1px solid ${t.accentPrimary}`, background: 'rgba(226,195,107,0.06)', padding: '20px', textAlign: 'center', boxShadow: `0 0 24px rgba(226,195,107,0.08)` }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: t.accentPrimary, marginBottom: '10px' }}>
                This Phase is Happening Now
              </p>
              <p style={{ fontSize: '14px', color: t.textMuted, lineHeight: 1.7, marginBottom: '16px' }}>
                You are living this moment. Share it — your photo or message from today will be part of this story forever.
              </p>
              <Link href={`/for/${slug}?phase=${phase.id}`} style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '24px', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em' }}>
                Add Your Moment →
              </Link>
            </div>
          ) : (
            <div style={{ borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.7, marginBottom: '14px' }}>
                Share a memory or message for this phase.
              </p>
              <Link href={`/for/${slug}?phase=${phase.id}`} style={{ display: 'inline-block', padding: '10px 28px', borderRadius: '20px', border: `1px solid ${t.accentFaint}`, color: t.accentPrimary, fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Leave a Tribute →
              </Link>
            </div>
          )}

          {/* QR code — for projecting at venue */}
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={qrUrl}
              alt={`QR code for ${phase.name}`}
              width={80}
              height={80}
              style={{ borderRadius: '8px', flexShrink: 0 }}
            />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '4px' }}>Scan to Contribute</p>
              <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.6 }}>
                Display this QR code at the venue. Guests scan to add their photo or message to this phase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 4: Contributions placeholder ── */}
      {/* Phase contributions are tagged via ?phase= on the tribute wall */}
      {/* The main tribute wall at /for/[slug] shows all contributions */}
      {/* Phase-specific filtering is a Phase 3 enhancement */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px 16px' }}>
        <Link href={`/for/${slug}?phase=${phase.id}`} style={{ display: 'block', padding: '14px', borderRadius: '12px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, textDecoration: 'none', textAlign: 'center' as const }}>
          <p style={{ fontSize: '13px', color: t.accentPrimary, fontWeight: 600, margin: 0 }}>View All Tributes →</p>
          <p style={{ fontSize: '11px', color: t.textFaint, margin: '3px 0 0' }}>See the full tribute wall for this capsule</p>
        </Link>
      </div>

      {/* ── SECTION 5: Phase navigation ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {prevPhase && (
            <Link href={`/for/${slug}/story/${prevPhase.id}`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentMuted, fontSize: '13px', fontWeight: 600 }}>
              ← {prevPhase.name}
            </Link>
          )}
          <Link href={`/for/${slug}/story`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.textFaint, fontSize: '13px', fontWeight: 600 }}>
            All Phases
          </Link>
          {nextPhase && (
            <Link href={`/for/${slug}/story/${nextPhase.id}`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentPrimary, fontSize: '13px', fontWeight: 600 }}>
              {nextPhase.name} →
            </Link>
          )}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <CapsuleBottomNav
        slug={slug}
        currentPage="tribute"
        components={capsule.components ?? []}
        contributorCount={capsule.approved_contrib_count ?? 0}
        hasPhases={true}
        themeKey={themeKey}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportAccounts ?? []}
      />
    </div>
  )
}
