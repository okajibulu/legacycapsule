/* =========================================================
   FILE PATH: app/for/[slug]/profile/page.tsx
   PURPOSE:   Public "About" page for a capsule.
              Displays profile sections, featured photos,
              gallery, event phases, and contributor gallery.
   UPDATED:   AI25 · Claude Sonnet 4.6 · 25 August 2026
              — Event phase boxes made clickable
              — Contributor Gallery wired in
              — Tab label updated to "About"
              — Metadata updated
========================================================= */

import { createClient }         from '@supabase/supabase-js'
import { notFound }             from 'next/navigation'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import CapsuleBottomNav         from '@/components/CapsuleBottomNav'
import ActivePremiumsStrip      from '@/components/ActivePremiumsStrip'
import SectionTextClamp         from '@/components/SectionTextClamp'
import ContributorGallery       from '@/components/ContributorGallery'

// ═══ SECTION 1 — Metadata ═══

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db.from('capsules').select('honouree_name, event_tag, event_type').eq('slug', slug).maybeSingle()
  if (!data) return { title: 'About · LegacyCapsule' }
  const label = data.event_tag ?? data.event_type ?? 'Event'
  return {
    title: `About ${data.honouree_name} — ${label} | LegacyCapsule`,
    description: `${label} — photos, biography and memories on LegacyCapsule.`,
  }
}

// ═══ SECTION 2 — Helpers ═══

function getEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    memorial:    'Memorial',
    retirement:  'Retirement',
    wedding:     'Wedding',
    birthday:    'Birthday',
    ordination:  'Ordination',
    graduation:  'Graduation',
    chieftaincy: 'Chieftaincy',
    other:       'Celebration',
  }
  return map[type] ?? 'Event'
}

function getSectionLabel(type: string, customTitle?: string | null): string {
  if (customTitle) return customTitle
  const map: Record<string, string> = {
    biography:    'Biography',
    quote:        'A Word From',
    achievements: 'Achievements',
    timeline:     'Timeline',
    legacy:       'Legacy',
    appreciation: 'Appreciation',
    custom:       'Note',
  }
  return map[type] ?? 'Section'
}

// ═══ SECTION 3 — Page component ═══

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // ── Fetch capsule ──────────────────────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, theme, hero_image_url, components, lifecycle_state, contribution_tier, approved_contrib_count')
    .eq('slug', slug)
    .maybeSingle()

  if (!capsule) notFound()
  if (capsule.page_state === 'suspended') notFound()

  const themeKey = resolveTheme(capsule.theme, capsule.event_type)
  const t        = getThemeConfig(themeKey)

  // ── Parallel fetch ─────────────────────────────────────────────────
  const [sectionsRes, featuredRes, galleryRes, phasesRes, supportRes] = await Promise.all([
    db.from('capsule_profile_sections')
      .select('id, section_type, custom_title, content, sort_order, is_active')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    db.from('capsule_featured_photos')
      .select('id, image_url, caption, sort_order, is_hero')
      .eq('capsule_id', capsule.id)
      .order('sort_order', { ascending: true }),

    db.from('capsule_gallery_sections')
      .select('id, title, sort_order, gallery_photos(id, image_url, caption, sort_order)')
      .eq('capsule_id', capsule.id)
      .order('sort_order', { ascending: true }),

    db.from('capsule_phases')
      .select('id, name, event_date, sort_order')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),

    db.from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
  ])

  const profileSections = sectionsRes.data ?? []
  const featuredPhotos  = featuredRes.data  ?? []
  const gallerySections = galleryRes.data   ?? []
  const phases          = phasesRes.data    ?? []
  const supportAccounts = supportRes.data   ?? []

  // ── Phase photo counts ─────────────────────────────────────────────
  const phasesWithCounts = await Promise.all(
    phases.map(async phase => {
      const { count } = await db
        .from('gallery_items')
        .select('id', { count: 'exact', head: true })
        .eq('phase_id', phase.id)
        .in('source', ['dday', 'contributor_gallery'])
        .eq('is_official_photography', false)
        .eq('approved', true)
      return { ...phase, photo_count: count ?? 0 }
    })
  )

  // ── Gallery photo count for highlights ────────────────────────────
  const { count: rawGalleryCount } = await db
    .from('contributor_gallery_photos')
    .select('id', { count: 'exact', head: true })
    .eq('capsule_id', capsule.id)
    .eq('status', 'visible')
  const galleryCount = rawGalleryCount ?? 0

  const hasContent = profileSections.length > 0 || featuredPhotos.length > 0 || gallerySections.length > 0

  // ── Shared style helpers ───────────────────────────────────────────
  const sectionHeadingStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px',
  }
  const ruleStyle: React.CSSProperties = {
    flex: 1, height: '1px',
    background: `linear-gradient(to right, transparent, ${t.accentFaint})`,
  }
  const ruleRightStyle: React.CSSProperties = {
    flex: 1, height: '1px',
    background: `linear-gradient(to left, transparent, ${t.accentFaint})`,
  }
  const headingLabelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: t.accentMuted, whiteSpace: 'nowrap',
  }
  const bodyTextStyle: React.CSSProperties = {
    fontSize: '13px', color: t.textFaint, lineHeight: 1.85, margin: 0,
  }

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
      {/* Hover style for phase links — CSS only (server component safe) */}
      <style>{`.lc-phase-link:hover { background: rgba(226,195,107,0.06) !important; border-color: rgba(226,195,107,0.3) !important; }`}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 120px' }}>

        {/* ── Hero image (if set) ───────────────────────────────── */}
        {capsule.hero_image_url && (
          <div style={{ width: '100%', height: '220px', borderRadius: '0 0 20px 20px', overflow: 'hidden', marginBottom: '24px' }}>
            <img
              src={capsule.hero_image_url}
              alt={capsule.honouree_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
        )}

        {/* ── Honouree name + title ─────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: capsule.hero_image_url ? '0 0 28px' : '32px 0 28px' }}>
          {capsule.honouree_title && (
            <p style={{ fontSize: '11px', color: t.accentMuted, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px', fontWeight: 700 }}>
              {capsule.honouree_title}
            </p>
          )}
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: '0 0 4px', fontFamily: "Georgia, 'Playfair Display', serif" }}>
            {capsule.honouree_name}
          </h1>
          {(capsule.event_tag ?? getEventTypeLabel(capsule.event_type)) && (
            <p style={{ fontSize: '12px', color: t.textFaint, margin: 0 }}>
              {capsule.event_tag ?? getEventTypeLabel(capsule.event_type)}
            </p>
          )}
        </div>

        {/* ── Featured photos ───────────────────────────────────── */}
        {featuredPhotos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>Photos</h2>
              <div style={ruleRightStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {featuredPhotos.map(photo => (
                <div key={photo.id} style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${t.accentFaint}` }}>
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? capsule.honouree_name}
                    style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '400px' }}
                  />
                  {photo.caption && (
                    <p style={{ fontSize: '11px', color: t.textFaint, fontStyle: 'italic', padding: '10px 14px', margin: 0 }}>
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Profile sections ──────────────────────────────────── */}
        {profileSections.map(section => (
          <div key={section.id} style={{ marginBottom: '28px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>{getSectionLabel(section.section_type, section.custom_title)}</h2>
              <div style={ruleRightStyle} />
            </div>
            <SectionTextClamp
              content={section.content}
              isQuote={section.section_type === 'quote'}
              bodyTextStyle={bodyTextStyle}
            />
          </div>
        ))}

        {/* ── Gallery sections ──────────────────────────────────── */}
        {gallerySections.map((gs: any) => (
          <div key={gs.id} style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>{gs.title ?? 'Gallery'}</h2>
              <div style={ruleRightStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {(gs.gallery_photos ?? [])
                .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((photo: any) => (
                  <div key={photo.id} style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${t.accentFaint}`, aspectRatio: '1' }}>
                    <img
                      src={photo.image_url}
                      alt={photo.caption ?? ''}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}


        {/* ── Event Phases ──────────────────────────────────────── */}
        {phasesWithCounts.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>Event Phases</h2>
              <div style={ruleRightStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {phasesWithCounts.map(phase => (
                <a
                  key={phase.id}
                  href={`/for/${slug}/story/${phase.id}`}
                  className="lc-phase-link"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '12px 16px',
                    borderRadius:   '12px',
                    background:     'rgba(255,255,255,0.04)',
                    border:         `1px solid ${t.accentFaint}`,
                    textDecoration: 'none',
                    cursor:         'pointer',
                    transition:     'background 0.15s, border-color 0.15s',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 2px' }}>
                      {phase.name}
                    </p>
                    {phase.event_date && (
                      <p style={{ fontSize: '11px', color: t.textFaint, margin: 0 }}>
                        {new Date(phase.event_date).toLocaleDateString('en-GB', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {phase.photo_count > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: t.accentMuted }}>
                        📸 {phase.photo_count} photo{phase.photo_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span style={{ fontSize: '14px', color: t.accentMuted }}>→</span>
                  </div>
                </a>
              ))}
              <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.65, margin: '4px 0 0' }}>
                On event day, guests can share their own photos and memories from each phase. Scan the QR code at the venue or visit the tribute wall link.
              </p>
            </div>
          </div>
        )}


        {/* ── Contributor Gallery — CG-SPEC-001 ────────────────── */}
        <div id="lc-contributor-gallery" style={{ marginBottom: '32px' }}>
          <div style={sectionHeadingStyle}>
            <div style={ruleStyle} />
            <h2 style={headingLabelStyle}>Contributor Gallery</h2>
            <div style={ruleRightStyle} />
          </div>
          <ContributorGallery
            capsuleId={capsule.id}
            honoureeName={capsule.honouree_name}
            themeKey={themeKey}
          />
        </div>
        
        {/* ── Empty state ───────────────────────────────────────── */}
        {!hasContent && phasesWithCounts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '13px', color: t.textFaint, lineHeight: 1.65 }}>
              The organiser has not added profile content yet.
            </p>
          </div>
        )}

      </div>

      {/* ── Active premiums strip ─────────────────────────────── */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 8px' }}>
        <ActivePremiumsStrip slug={slug} components={capsule.components ?? []} />
      </div>

      {/* ── Bottom nav ────────────────────────────────────────── */}
      <CapsuleBottomNav
        slug={slug}
        currentPage="profile"
        components={capsule.components ?? []}
        contributorCount={(capsule.approved_contrib_count ?? 0) + galleryCount}
        hasPhases={phases.length > 0}
        themeKey={themeKey}
        capsuleId={capsule.id}
        honourName={capsule.honouree_name}
        eventType={capsule.event_type}
        supportAccounts={supportAccounts}
        phases={phases}
      />
    </div>
  )
}
