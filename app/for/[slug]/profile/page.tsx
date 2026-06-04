/**
 * ============================================================
 * app/for/[slug]/profile/page.tsx
 *
 * Changes v1.2.6 (AI6):
 *   - T2: Expression of Honour section removed entirely.
 *     EOH lives only on the tribute wall going forward.
 *     Removed: supportRes query, supportAccounts, hasWaysToHonour,
 *     maskAccountNumber, WaysToHonourCard import,
 *     getWaysToHonourLabel, getGiftAcknowledgeLabel imports.
 * ============================================================
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import { getEventTypeLabel, getEventTypeEmoji } from '@/lib/eventLabels'
import SectionReactions from '@/components/SectionReactions'
import GalleryLightbox from '@/components/GalleryLightbox'
import SectionTextClamp from '@/components/SectionTextClamp'

/* ── Client setup ──────────────────────────────────────── */
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ── Helpers ───────────────────────────────────────────── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

interface PageProps { params: Promise<{ slug: string }> }

/* ── generateMetadata ──────────────────────────────────── */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const { data } = await adminClient
    .from('capsules')
    .select('honouree_name, event_tag, event_type')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return { title: 'Profile | LegacyCapsule' }
  const ogImageUrl = `https://itslegacycapsule.com/api/og/${slug}`
  return {
    title: `${data.honouree_name} — ${data.event_tag ?? getEventTypeLabel(data.event_type)} | LegacyCapsule`,
    description: `${data.event_tag ?? getEventTypeLabel(data.event_type)} — a LegacyCapsule tribute collection.`,
    openGraph: {
      title: `${data.honouree_name} — ${data.event_tag ?? getEventTypeLabel(data.event_type)}`,
      description: `A LegacyCapsule tribute collection.`,
      url: `https://itslegacycapsule.com/for/${slug}/profile`,
      siteName: 'LegacyCapsule',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${data.honouree_name} — LegacyCapsule` }],
    },
    twitter: { card: 'summary_large_image', images: [ogImageUrl] },
  }
}

/* ── ProfilePage ───────────────────────────────────────── */
export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params

  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, theme, hero_image_url')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !capsule) return notFound()
  if (capsule.page_state === 'draft') return notFound()

  const [profileRes, featuredRes, galleryRes] = await Promise.all([
    adminClient
      .from('capsule_profile_sections')
      .select('id, section_type, custom_title, content, sort_order, is_active')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .not('content', 'is', null)
      .order('sort_order'),

    adminClient
      .from('capsule_featured_photos')
      .select('id, image_url, caption, sort_order')
      .eq('capsule_id', capsule.id)
      .order('sort_order'),

    adminClient
      .from('capsule_gallery')
      .select('id, image_url, caption, description, sort_order, section_index, section_title')
      .eq('capsule_id', capsule.id)
      .order('section_index')
      .order('sort_order'),
  ])

  // Participation summary — for conditional Legacy Room nav link
  let contributorCount = 0
  try {
    const { data: summaryData } = await adminClient
      .from('capsule_participation_summary')
      .select('contributor_count')
      .eq('capsule_id', capsule.id)
      .single()
    contributorCount = summaryData?.contributor_count ?? 0
  } catch {}

  // Milestones — optional table, graceful fallback
  let milestones: any[] = []
  try {
    const { data: mData } = await adminClient
      .from('capsule_milestones')
      .select('id, title, date, description, sort_order')
      .eq('capsule_id', capsule.id)
      .order('sort_order')
      .limit(20)
    milestones = mData ?? []
  } catch { milestones = [] }

  const profileSections = profileRes.data ?? []
  const featuredPhotos  = featuredRes.data ?? []
  const galleryPhotos   = galleryRes.data ?? []

  const hasContent = (
    profileSections.length > 0 ||
    featuredPhotos.length > 0 ||
    galleryPhotos.length > 0 ||
    milestones.length > 0
  )

  const themeKey    = resolveTheme(capsule.theme, capsule.event_type)
  const t           = getThemeConfig(themeKey)
  const eventLabel  = getEventTypeLabel(capsule.event_type)
  const eventEmoji  = getEventTypeEmoji(capsule.event_type)
  const resolvedHero = capsule.hero_image_url ?? '/honouree.jpg'

  /* ── Style tokens ── */
  const sectionHeadingStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }
  const ruleStyle: React.CSSProperties = { flex: 1, height: '1px', background: `linear-gradient(to right, ${t.accentFaint}, transparent)` }
  const ruleRightStyle: React.CSSProperties = { flex: 1, height: '1px', background: `linear-gradient(to left, ${t.accentFaint}, transparent)` }
  const headingLabelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.22em', color: t.accentMuted, margin: 0, whiteSpace: 'nowrap' as const }
  const cardStyle: React.CSSProperties = { background: 'rgba(255,253,248,0.93)', borderRadius: '14px', padding: '22px 24px', border: `1px solid ${t.accentFaint}`, boxShadow: '0 4px 24px rgba(0,0,0,0.28)' }
  const bodyTextStyle: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px', color: '#1C1014', lineHeight: 1.85, whiteSpace: 'pre-wrap' as const, margin: 0 }

  function getSectionTitle(section: { section_type: string; custom_title: string | null }): string {
    if (section.custom_title) return section.custom_title
    const labels: Record<string, string> = {
      biography: 'Biography', intro: 'Introduction', occasion: 'About the Occasion',
      quote: 'Featured Quote', message: "Organiser's Message", timeline: 'Timeline',
      achievements: 'Achievements', family: 'Family', legacy: 'Legacy',
    }
    return labels[section.section_type] ?? section.section_type.replace(/_/g, ' ')
  }

  return (
<div id="top" style={{ minHeight: '100vh', background: t.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* TOP NAV */}
      <div style={{ background: 'rgba(15,10,30,0.96)', borderBottom: `1px solid ${t.accentFaint}`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: t.textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href={`/for/${slug}`} style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none', letterSpacing: '0.04em' }}>← Tribute Wall</a>
            <a href={`/manage/${slug}`} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.28)', color: '#E2C36B', textDecoration: 'none', letterSpacing: '0.04em' }}>⚙ Manage</a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resolvedHero})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: t.heroOverlay }} />
        <div style={{ position: 'absolute', inset: 0, background: t.heroGlow }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '720px', margin: '0 auto', padding: '48px 20px 36px', textAlign: 'center' }}>
          <p style={{ fontSize: '26px', marginBottom: '10px', lineHeight: 1 }}>{eventEmoji}</p>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.24em', color: t.accentMuted, marginBottom: '12px' }}>{eventLabel}</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginBottom: '10px', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            {capsule.honouree_name}
          </h1>
          {capsule.event_tag  && <p style={{ fontSize: '14px', color: t.accentPrimary, marginBottom: '6px', fontWeight: 500 }}>{capsule.event_tag}</p>}
          {capsule.event_date && <p style={{ fontSize: '12px', color: t.textFaint }}>{formatDate(capsule.event_date)}</p>}
        </div>
      </div>

      {/* Gold rule */}
      <div style={{ height: '2px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />

      {/* LEAVE TRIBUTE CTA */}
      <div style={{ background: 'rgba(0,0,0,0.15)', borderBottom: `1px solid ${t.accentFaint}`, padding: '14px 20px', textAlign: 'center' }}>
        <a href={`/for/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '24px', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
          ✦ Leave a tribute
        </a>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 16px 60px' }}>

{/* Auto-composed occasion block — shows when no Introduction section exists */}
        {!profileSections.some((s: any) => s.section_type === 'intro' || s.section_type === 'introduction') && (
          <div style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>About This Occasion</h2>
              <div style={ruleRightStyle} />
            </div>
            <div style={cardStyle}>
              <p style={{ ...bodyTextStyle, fontStyle: 'italic', color: '#3a2a1e' }}>
                {(() => {
                  const type = capsule.event_type?.toLowerCase() ?? ''
                  const name = capsule.honouree_name
                  const tag = capsule.event_tag ? ` ${capsule.event_tag}.` : ''
                  const date = capsule.event_date ? ` ${formatDate(capsule.event_date)}.` : ''

                  if (type.includes('memorial') || type.includes('funeral'))
                    return `This capsule preserves the memory and legacy of ${name}.${tag}${date}`
                  if (type.includes('retirement'))
                    return `This capsule celebrates the retirement of ${name}.${tag}${date}`
                  if (type.includes('wedding'))
                    return `This capsule celebrates the union of ${name}.${tag}${date}`
                  if (type.includes('birthday'))
                    return `This capsule celebrates a milestone birthday for ${name}.${tag}${date}`
                  if (type.includes('graduation'))
                    return `This capsule honours the graduation of ${name}.${tag}${date}`
                  if (type.includes('chieftaincy'))
                    return `This capsule honours the installation of ${name}.${tag}${date}`
                  if (type.includes('ordination'))
                    return `This capsule celebrates the ordination of ${name}.${tag}${date}`
                  if (type.includes('anniversary'))
                    return `This capsule celebrates a milestone anniversary for ${name}.${tag}${date}`
                  if (type.includes('award'))
                    return `This capsule honours ${name} on the occasion of this award ceremony.${tag}${date}`
                  if (type.includes('thanksgiving'))
                    return `This capsule celebrates a thanksgiving service for ${name}.${tag}${date}`
                  if (type.includes('conference'))
                    return `This capsule captures the voices and contributions shared at ${name}.${tag}${date}`
                  return `This capsule honours ${name}.${tag}${date}`
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Profile text sections */}
        {profileSections.map((section: any) => (
          <div key={section.id} style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>{getSectionTitle(section)}</h2>
              <div style={ruleRightStyle} />
            </div>
            {section.section_type === 'quote' ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 32px' }}>
                <SectionTextClamp content={section.content} isQuote bodyTextStyle={bodyTextStyle} />
              </div>
            ) : (
              <div style={cardStyle}>
                <SectionTextClamp content={section.content} bodyTextStyle={bodyTextStyle} />
              </div>
            )}
            <SectionReactions sectionId={section.id} capsuleId={capsule.id} />
          </div>
        ))}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>Timeline</h2>
              <div style={ruleRightStyle} />
            </div>
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: `linear-gradient(to bottom, ${t.accentFaint}, transparent)` }} />
              {milestones.map((m: any) => (
                <div key={m.id} style={{ position: 'relative', marginBottom: '20px', paddingLeft: '16px' }}>
                  <div style={{ position: 'absolute', left: '-13px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: t.accentPrimary, border: `2px solid ${t.pageBg}` }} />
                  {m.date && <p style={{ fontSize: '10px', color: t.accentMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>{formatDate(m.date)}</p>}
                  <p style={{ fontSize: '14px', fontWeight: 600, color: t.textBody, marginBottom: '3px' }}>{m.title}</p>
                  {m.description && <p style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.65 }}>{m.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Photos */}
        {featuredPhotos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={sectionHeadingStyle}>
              <div style={ruleStyle} />
              <h2 style={headingLabelStyle}>Featured Photos</h2>
              <div style={ruleRightStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {featuredPhotos.map((photo: any) => (
                <div key={photo.id} style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${t.accentFaint}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <GalleryLightbox src={photo.image_url} caption={photo.caption ?? ''} alt={`Photo of ${capsule.honouree_name}`} aspectRatio="4/3" />
                  {photo.caption && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,253,248,0.95)' }}>
                      <p style={{ fontSize: '12px', color: '#5F5E5A', margin: 0 }}>{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {galleryPhotos.length > 0 && (() => {
          const maxSection = Math.max(...galleryPhotos.map((p: any) => p.section_index ?? 0))
          return Array.from({ length: maxSection + 1 }, (_, si) => {
            const sectionPhotos = galleryPhotos.filter((p: any) => (p.section_index ?? 0) === si)
            if (sectionPhotos.length === 0) return null
            const sectionTitle = sectionPhotos[0]?.section_title ?? (maxSection > 0 ? `Gallery ${si + 1}` : 'Gallery')
            return (
              <div key={si} style={{ marginBottom: '32px' }}>
                <div style={sectionHeadingStyle}>
                  <div style={ruleStyle} />
                  <h2 style={headingLabelStyle}>{sectionTitle}</h2>
                  <div style={ruleRightStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sectionPhotos.map((photo: any) => (
                    <div key={photo.id} style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${t.accentFaint}`, background: t.cardBg, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                      <GalleryLightbox src={photo.image_url} caption={photo.description || photo.caption || ''} alt="Gallery photo" photoId={photo.id} capsuleId={capsule.id} />
                      {(photo.description || photo.caption) && (
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.accentFaint}` }}>
                          <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.75, fontStyle: 'italic', margin: 0 }}>{photo.description || photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        })()}

        {/* Empty state */}
        {!hasContent && (
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '28px', marginBottom: '16px' }}>{eventEmoji}</p>
            <p style={{ fontSize: '15px', color: t.textMuted, lineHeight: 1.75, fontFamily: "'Playfair Display', serif" }}>
              A life and legacy worth honouring.<br />More details coming soon.
            </p>
          </div>
        )}

{/* Bottom navigation */}
        <div style={{ paddingTop: '32px', borderTop: `1px solid ${t.accentFaint}`, display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
          <a href={`/for/${slug}`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentMuted, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.03)' }}>← Tribute Wall</a>
          {contributorCount >= 1 && (
            <a href={`/for/${slug}/legacy`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentPrimary, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.03)' }}>Legacy Room →</a>
          )}
          <a href="#top" style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentMuted, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.03)' }}>↑ Back to Top</a>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${t.accentFaint}`, padding: '28px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', color: t.textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.14)', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Events end. Legacies continue.</p>
        <p style={{ marginTop: '10px' }}>
          <a href="/book" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textDecoration: 'none' }}>Planning your own event? Start here →</a>
        </p>
      </footer>
    </div>
  )
}
