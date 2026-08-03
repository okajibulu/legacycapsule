/**
 * ============================================================
 * FILE PATH: app/for/[slug]/story/page.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Event Story Overview — public page listing all event phases
 * Server component. Reads from capsule_phases table.
 *
 * Sub-sections:
 *   1. Server data fetching + metadata
 *   2. Phase card rendering
 *   3. Empty state (no phases set up)
 *   4. Main page render
 * ============================================================
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import { getEventTypeLabel, getEventTypeEmoji } from '@/lib/eventLabels'
import Link from 'next/link'
import CapsuleBottomNav from '@/components/CapsuleBottomNav'

// ============================================================
// SECTION 1 — Server setup + data fetching
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const { data } = await adminClient
    .from('capsules')
    .select('honouree_name, event_tag, event_type')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return { title: 'Event Story | LegacyCapsule' }
  return {
    title: `Event Story — ${data.honouree_name} | LegacyCapsule`,
    description: `The story of ${data.event_tag ?? getEventTypeLabel(data.event_type)} for ${data.honouree_name}.`,
  }
}

export default async function EventStoryPage({ params }: PageProps) {
  const { slug } = await params

  // ── Fetch capsule ─────────────────────────────────────
  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, event_date, theme, hero_image_url, page_state, components, approved_contrib_count')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !capsule) return notFound()
  if (capsule.page_state === 'draft') return notFound()

  // ── Fetch phases ──────────────────────────────────────
  const { data: phases } = await adminClient
    .from('capsule_phases')
    .select('id, name, event_date, location, sort_order, programme, capture_window_closes_at, qr_token')
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
  const eventLabel = getEventTypeLabel(capsule.event_type)
  const eventEmoji = getEventTypeEmoji(capsule.event_type)

  function formatDate(d: string | null): string {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  function isWindowOpen(phase: any): boolean {
    if (!phase.capture_window_closes_at) return true
    return new Date(phase.capture_window_closes_at) > new Date()
  }

  function isDDay(phase: any): boolean {
    if (!phase.event_date) return false
    const today = new Date().toISOString().split('T')[0]
    return phase.event_date === today
  }

  return (
    <div style={{ minHeight: '100vh', background: t.pageBg, fontFamily: "'DM Sans', sans-serif", paddingBottom: '80px' }}>

      {/* ── TOP NAV ── */}
      <div style={{ background: 'rgba(15,10,30,0.96)', borderBottom: `1px solid ${t.accentFaint}`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: t.textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </Link>
          <Link href={`/for/${slug}`} style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none' }}>← The Voices</Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ padding: '36px 20px 24px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ fontSize: '24px', marginBottom: '8px' }}>{eventEmoji}</p>
        <p style={{ fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.24em', color: t.accentMuted, marginBottom: '8px' }}>Event Story</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '6px' }}>
          {capsule.honouree_name}
        </h1>
        {capsule.event_tag && (
          <p style={{ fontSize: '13px', color: t.accentPrimary, fontWeight: 500 }}>{capsule.event_tag}</p>
        )}
        {capsule.event_date && (
          <p style={{ fontSize: '11px', color: t.textFaint, marginTop: '4px' }}>{formatDate(capsule.event_date)}</p>
        )}
      </div>

      {/* ── Gold rule ── */}
      <div style={{ height: '2px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 24px' }}>

        {/* ── SECTION 2: Phase cards ── */}
        {phases && phases.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {phases.map((phase: any, idx: number) => {
              const open = isWindowOpen(phase)
              const today = isDDay(phase)

              return (
                <Link
                  key={phase.id}
                  href={`/for/${slug}/story/${phase.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    borderRadius: '16px',
                    border: `1px solid ${today ? t.accentPrimary : t.accentFaint}`,
                    background: today ? 'rgba(226,195,107,0.06)' : t.cardBg,
                    padding: '20px',
                    transition: 'all 0.2s',
                    boxShadow: today ? `0 0 20px rgba(226,195,107,0.12)` : '0 4px 16px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Phase number */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: today ? `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})` : 'rgba(255,255,255,0.06)', border: `1px solid ${t.accentFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: today ? '#1a0845' : t.accentMuted }}>{idx + 1}</span>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                            {phase.name}
                          </h3>
                          {phase.event_date && (
                            <p style={{ fontSize: '11px', color: t.accentMuted, margin: '3px 0 0' }}>
                              {formatDate(phase.event_date)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        {today && (
                          <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '6px', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845' }}>
                            Today
                          </span>
                        )}
                        {open ? (
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '6px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(134,239,172,0.8)' }}>
                            Capturing
                          </span>
                        ) : (
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: t.textFaint }}>
                            Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {phase.location && (
                      <p style={{ fontSize: '12px', color: t.textFaint, margin: '0 0 0 42px' }}>
                        📍 {phase.location}
                      </p>
                    )}

                    {/* Programme preview */}
                    {phase.programme?.summary && (
                      <p style={{ fontSize: '12px', color: t.textFaint, margin: '6px 0 0 42px', lineHeight: 1.6, fontStyle: 'italic' }}>
                        {phase.programme.summary}
                      </p>
                    )}

                    {/* Arrow */}
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: t.accentMuted }}>View phase →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* ── SECTION 3: Empty state ── */
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '28px', marginBottom: '12px' }}>{eventEmoji}</p>
            <p style={{ fontSize: '15px', color: t.textMuted, lineHeight: 1.75, fontFamily: "'Playfair Display', serif" }}>
              The event story is being prepared.<br />Check back closer to the event.
            </p>
          </div>
        )}

      </main>

      {/* ── BOTTOM NAV ── */}
      <CapsuleBottomNav
        slug={slug}
        currentPage="none"
        components={capsule.components ?? []}
        contributorCount={capsule.approved_contrib_count ?? 0}
        hasPhases={(phases?.length ?? 0) > 0}
        themeKey={themeKey}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportAccounts ?? []}
        phases={(phases ?? []).map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
