/* =========================================================
   FILE PATH: app/for/[slug]/legacy/page.tsx
   PURPOSE:   Highlights / Legacy page for a capsule.
              Shows stats, publication, and media highlights.
   UPDATED:   AI25 · Claude Sonnet 4.6 · 25 August 2026
              — Top Contributors section added (gallery photos)
              — Gallery photo count added to stats
              — Gallery awareness CTA added at bottom
========================================================= */

import { createClient }    from '@supabase/supabase-js'
import { notFound }        from 'next/navigation'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import CapsuleBottomNav    from '@/components/CapsuleBottomNav'
import ActivePremiumsStrip from '@/components/ActivePremiumsStrip'

// ═══ SECTION 1 — Metadata ═══

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db.from('capsules').select('honouree_name, event_tag, event_type').eq('slug', slug).maybeSingle()
  if (!data) return { title: 'Highlights · LegacyCapsule' }
  return {
    title: `Highlights — ${data.honouree_name} | LegacyCapsule`,
    description: `Highlights and legacy record for ${data.honouree_name}'s LegacyCapsule.`,
  }
}

// ═══ SECTION 2 — StatCard component ═══

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color: string
}) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: '14px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(226,195,107,0.10)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <div>
        <p style={{ fontSize: '22px', fontWeight: 800, color, margin: '0 0 1px', lineHeight: 1 }}>
          {value.toLocaleString()}
        </p>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

// ═══ SECTION 3 — Page component ═══

export default async function LegacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // ── Fetch capsule ──────────────────────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, page_state, theme, components, lifecycle_state, contribution_tier, approved_contrib_count')
    .eq('slug', slug)
    .maybeSingle()

  if (!capsule) notFound()
  if (capsule.page_state === 'suspended') notFound()

  const themeKey = resolveTheme(capsule.theme, capsule.event_type)
  const t        = getThemeConfig(themeKey)

  // ── Parallel fetch ─────────────────────────────────────────────────
  const [
    storiesRes,
    phasesRes,
    galleryCountRes,
    galleryRowsRes,
    supportRes,
  ] = await Promise.all([
    db.from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule.id)
      .not('story_topic_id', 'is', null)
      .is('deleted_at', null),

    db.from('capsule_phases')
      .select('id, name')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null),

    db.from('contributor_gallery_photos')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule.id)
      .eq('status', 'visible'),

    db.from('contributor_gallery_photos')
      .select('contributor_name, contributor_email')
      .eq('capsule_id', capsule.id)
      .eq('status', 'visible'),

    db.from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
  ])

  const approvedCount  = capsule.approved_contrib_count ?? 0
  const storiesCount   = storiesRes.count  ?? 0
  const phasesCount    = phasesRes.data?.length ?? 0
  const galleryCount   = galleryCountRes.count ?? 0
  const supportAccounts = supportRes.data ?? []

  // ── Top Contributors — aggregate by email, top 3 by photo count ────
  const contribMap: Record<string, { name: string; count: number }> = {}
  for (const row of galleryRowsRes.data ?? []) {
    const key = row.contributor_email
    if (!contribMap[key]) contribMap[key] = { name: row.contributor_name, count: 0 }
    contribMap[key].count++
  }
  const topContributors = Object.values(contribMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const medals = ['🥇', '🥈', '🥉']

  // ═══ SECTION 4 — Render ═══

  return (
    <div
      id="top"
      style={{
        minHeight:  '100vh',
        background: t.pageBg,
        fontFamily: "'DM Sans', sans-serif",
        overflowX:  'hidden',
      }}
    >
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px 120px' }}>

        {/* ── Page heading ─────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accentMuted, margin: '0 0 8px' }}>
            Highlights
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255,255,255,0.92)', margin: '0 0 4px', fontFamily: "Georgia, 'Playfair Display', serif" }}>
            {capsule.honouree_name}
          </h1>
          <p style={{ fontSize: '12px', color: t.textFaint, margin: 0 }}>
            {capsule.event_tag ?? capsule.event_type}
          </p>
        </div>

        {/* ── Top Contributors ──────────────────────────────────── */}
        {topContributors.length > 0 && (
          <div style={{
            padding: '14px 16px', borderRadius: '14px', marginBottom: '16px',
            background: 'rgba(226,195,107,0.04)',
            border: '1px solid rgba(226,195,107,0.12)',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accentMuted, margin: '0 0 12px' }}>
              Top Photo Contributors
            </p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {topContributors.map((c, i) => (
                <div key={c.name + i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{medals[i]}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.88)', margin: '0 0 1px' }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: '10px', color: t.textFaint, margin: 0 }}>
                      {c.count} photo{c.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats grid ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '28px' }}>
          <StatCard label="Voices"        value={approvedCount} icon="🎙" color="rgba(226,195,107,0.9)" />
          <StatCard label="Stories"       value={storiesCount}  icon="📖" color="rgba(167,139,250,0.8)" />
          {phasesCount > 0 && (
            <StatCard label="Event Phases" value={phasesCount}  icon="📅" color="rgba(94,234,212,0.8)" />
          )}
          {galleryCount > 0 && (
            <StatCard label="Gallery Photos" value={galleryCount} icon="📷" color="rgba(226,195,107,0.8)" />
          )}
        </div>

        {/* ── Publication placeholder / future content ─────────── */}
        <div style={{
          padding: '24px', borderRadius: '16px', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(226,195,107,0.08)',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>✦</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>
            The Publication
          </p>
          <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.7, margin: 0 }}>
            When the organiser is ready, a curated keepsake publication will be generated and shared with every contributor — a permanent record of this occasion.
          </p>
        </div>

        {/* ── Gallery awareness CTA ─────────────────────────────── */}
        <div style={{
          padding: '14px 16px', borderRadius: '14px',
          background: 'rgba(226,195,107,0.04)',
          border: '1px solid rgba(226,195,107,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: t.accentMuted, margin: '0 0 3px' }}>
              📷 Have photos from this event?
            </p>
            <p style={{ fontSize: '11px', color: t.textFaint, margin: 0, lineHeight: 1.6 }}>
              Add them to the Contributor Gallery — they may be included in the final publication.
            </p>
          </div>
          <a
            href={`/for/${slug}/profile#lc-contributor-gallery`}
            style={{
              padding: '8px 16px', borderRadius: '10px', flexShrink: 0,
              background: `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`,
              color: '#1a0845', fontSize: '11px', fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Add Photos →
          </a>
        </div>

      </div>

      {/* ── Active premiums strip ─────────────────────────────── */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 8px' }}>
        <ActivePremiumsStrip slug={slug} components={capsule.components ?? []} />
      </div>

      {/* ── Bottom nav ───────────────────────────────────────── */}
      <CapsuleBottomNav
        slug={slug}
        currentPage="legacy"
        components={capsule.components ?? []}
        contributorCount={(capsule.approved_contrib_count ?? 0) + galleryCount}
        hasPhases={phasesCount > 0}
        themeKey={themeKey}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportAccounts}
        phases={phasesRes.data ?? []}
      />
    </div>
  )
}
