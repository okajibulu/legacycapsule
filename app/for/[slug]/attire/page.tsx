/**
 * ============================================================
 * FILE PATH: app/for/[slug]/attire/page.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Public Attire Showcase & Ordering Page
 * Guests view attire items, place orders, and report payments.
 *
 * Server component — fetches data at render time.
 * Client island: AttireOrderForm for interactive ordering.
 *
 * Sub-sections:
 *   1. Server data fetching + metadata
 *   2. AttireOrderForm client component
 *   3. PaymentReportForm client component
 *   4. Main page render
 * ============================================================
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import { getEventTypeLabel, getEventTypeEmoji } from '@/lib/eventLabels'
import AttireClientIsland from './AttireClientIsland'

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
  if (!data) return { title: 'Attire | LegacyCapsule' }
  return {
    title: `Fabric & Attire — ${data.honouree_name} | LegacyCapsule`,
    description: `View and order event attire for ${data.event_tag ?? getEventTypeLabel(data.event_type)}.`,
  }
}

export default async function AttirePublicPage({ params }: PageProps) {
  const { slug } = await params

  // ── Fetch capsule ─────────────────────────────────────
  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, event_date, theme, hero_image_url, page_state, components')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !capsule) return notFound()
  if (capsule.page_state === 'draft') return notFound()

  // ── Check attire module is activated ──────────────────
  const components = capsule.components ?? []
  if (!components.includes('attire')) {
    return notFound()
  }

  // ── Fetch variants ────────────────────────────────────
  const { data: variants } = await adminClient
    .from('attire_variants')
    .select('id, name, description, price_per_unit, unit_type, image_url, cutoff_date, sort_order')
    .eq('capsule_id', capsule.id)
    .is('deleted_at', null)
    .order('sort_order')

  const themeKey = resolveTheme(capsule.theme, capsule.event_type)
  const t = getThemeConfig(themeKey)
  const eventLabel = getEventTypeLabel(capsule.event_type)
  const eventEmoji = getEventTypeEmoji(capsule.event_type)

  return (
    <div style={{ minHeight: '100vh', background: t.pageBg, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── TOP NAV ── */}
      <div style={{ background: 'rgba(15,10,30,0.96)', borderBottom: `1px solid ${t.accentFaint}`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: t.textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </a>
          <a href={`/for/${slug}`} style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none' }}>← Tribute Room</a>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <div style={{ padding: '40px 20px 28px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ fontSize: '26px', marginBottom: '8px' }}>{eventEmoji}</p>
        <p style={{ fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.24em', color: t.accentMuted, marginBottom: '10px' }}>Fabric & Attire</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '8px' }}>
          {capsule.honouree_name}
        </h1>
        {capsule.event_tag && <p style={{ fontSize: '13px', color: t.accentPrimary, fontWeight: 500 }}>{capsule.event_tag}</p>}
      </div>

      {/* ── Gold rule ── */}
      <div style={{ height: '2px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* Empty state */}
        {(!variants || variants.length === 0) && (
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '28px', marginBottom: '12px' }}>👗</p>
            <p style={{ fontSize: '15px', color: t.textMuted, lineHeight: 1.75, fontFamily: "'Playfair Display', serif" }}>
              The attire showcase is being prepared.<br />Please check back soon.
            </p>
          </div>
        )}

        {/* Variant cards + ordering — client island */}
        {variants && variants.length > 0 && (
          <AttireClientIsland
            capsuleId={capsule.id}
            capsuleSlug={slug}
            honoureeName={capsule.honouree_name}
            variants={variants}
            themeKey={themeKey}
          />
        )}

        {/* ── Bottom navigation ── */}
        <div style={{ paddingTop: '28px', borderTop: `1px solid ${t.accentFaint}`, display: 'flex', flexWrap: 'wrap' as const, gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
          <a href={`/for/${slug}`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentMuted, fontSize: '13px', fontWeight: 600 }}>← Tribute Room</a>
          <a href={`/for/${slug}/profile`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentPrimary, fontSize: '13px', fontWeight: 600 }}>View Profile →</a>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${t.accentFaint}`, padding: '28px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', color: t.textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.14)', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Events end. Legacies continue.</p>
      </footer>
    </div>
  )
}
