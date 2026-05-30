/**
 * ============================================================
 * LEGACYCAPSULE — app/for/[slug]/profile/page.tsx
 * → app/for/[slug]/profile/page.tsx
 * ============================================================
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
import {
  getWaysToHonourLabel,
  getGiftAcknowledgeLabel,
  getEventTypeLabel,
  getEventTypeEmoji,
} from '@/lib/eventLabels'
import WaysToHonourCard from '@/components/honouree/WaysToHonourCard'
import SectionReactions from '@/components/SectionReactions'
import GalleryLightbox from '@/components/GalleryLightbox'
import SectionTextClamp from '@/components/SectionTextClamp'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function maskAccountNumber(full: string | null): string {
  if (!full || full.length < 4) return '••••'
  return `••••${full.slice(-4)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return dateStr }
}

interface PageProps { params: Promise<{ slug: string }> }

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

  const [profileRes, featuredRes, galleryRes, supportRes] = await Promise.all([
    adminClient.from('capsule_profile_sections').select('id, section_type, custom_title, content, sort_order, is_active').eq('capsule_id', capsule.id).eq('is_active', true).not('content', 'is', null).order('sort_order'),
    adminClient.from('capsule_featured_photos').select('id, image_url, caption, sort_order').eq('capsule_id', capsule.id).order('sort_order'),
    // Include section_title for editable gallery section names
    adminClient.from('capsule_gallery').select('id, image_url, caption, description, sort_order, section_index, section_title').eq('capsule_id', capsule.id).order('section_index').order('sort_order'),
    adminClient.from('capsule_support_accounts').select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, sort_order, relationship_to_honouree').eq('capsule_id', capsule.id).eq('is_active', true).is('deleted_at', null).order('sort_order'),
  ])

  // Milestones
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
  const featuredPhotos = featuredRes.data ?? []
  const galleryPhotos = galleryRes.data ?? []
  const supportAccounts = (supportRes.data ?? []).map((acc: any) => ({ ...acc, account_number: maskAccountNumber(acc.account_number) }))
  const hasWaysToHonour = supportAccounts.length > 0

  const themeKey = resolveTheme(capsule.theme, capsule.event_type)
  const t = getThemeConfig(themeKey)

  const eventLabel = getEventTypeLabel(capsule.event_type)
  const eventEmoji = getEventTypeEmoji(capsule.event_type)
  const waysLabel = getWaysToHonourLabel(capsule.event_type, capsule.honouree_name)
  const resolvedHero = capsule.hero_image_url ?? '/honouree.jpg'

  function getSectionTitle(section: { section_type: string; custom_title: string | null }): string {
    if (section.custom_title) return section.custom_title
    const labels: Record<string, string> = {
      biography: 'Biography', intro: 'Introduction', occasion: 'About the Occasion',
      quote: 'Featured Quote', message: "Organiser's Message", timeline: 'Timeline',
      achievements: 'Achievements', family: 'Family', legacy: 'Legacy',
    }
    return labels[section.section_type] ?? section.section_type.replace(/_/g, ' ')
  }

  // EOH ceremonial message
  function getEOHMessage(eventType: string): string {
    const type = eventType?.toLowerCase() ?? ''
    if (type.includes('memorial') || type.includes('funeral'))
      return 'The family is deeply grateful for every expression of love, remembrance and honour shared during this time.'
    return 'Presence, prayers, goodwill and every expression of honour shared on this occasion are sincerely appreciated.'
  }

  const hasContent = profileSections.length > 0 || featuredPhotos.length > 0 || galleryPhotos.length > 0 || hasWaysToHonour || milestones.length > 0

  const sectionHeadingStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }
  const ruleStyle: React.CSSProperties = { flex: 1, height: '1px', background: `linear-gradient(to right, ${t.accentFaint}, transparent)` }
  const ruleRightStyle: React.CSSProperties = { flex: 1, height: '1px', background: `linear-gradient(to left, ${t.accentFaint}, transparent)` }
  const headingLabelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.22em', color: t.accentMuted, margin: 0, whiteSpace: 'nowrap' as const }
  const cardStyle: React.CSSProperties = { background: 'rgba(255,253,248,0.93)', borderRadius: '14px', padding: '22px 24px', border: `1px solid ${t.accentFaint}`, boxShadow: '0 4px 24px rgba(0,0,0,0.28)' }
  const bodyTextStyle: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px', color: '#1C1014', lineHeight: 1.85, whiteSpace: 'pre-wrap' as const, margin: 0 }

  return (
    <div style={{ minHeight: '100vh', background: t.pageBg, fontFamily: "'DM Sans', sans-serif" }}>

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
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginBottom: '10px', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>{capsule.honouree_name}</h1>
          {capsule.event_tag && <p style={{ fontSize: '14px', color: t.accentPrimary, marginBottom: '6px', fontWeight: 500 }}>{capsule.event_tag}</p>}
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

        {/* Profile text sections — with 6-line clamp */}
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
                  <GalleryLightbox
                    src={photo.image_url}
                    caption={photo.caption ?? ''}
                    alt={`Photo of ${capsule.honouree_name}`}
                    aspectRatio="4/3"
                  />
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

        {/* Gallery — vertical stack, description below photo, lightbox + comments */}
        {galleryPhotos.length > 0 && (() => {
          const maxSection = Math.max(...galleryPhotos.map((p: any) => p.section_index ?? 0))
          return Array.from({ length: maxSection + 1 }, (_, si) => {
            const sectionPhotos = galleryPhotos.filter((p: any) => (p.section_index ?? 0) === si)
            if (sectionPhotos.length === 0) return null

            // Use section_title from DB if set, fallback to Gallery N
            const sectionTitle = sectionPhotos[0]?.section_title
              ?? (maxSection > 0 ? `Gallery ${si + 1}` : 'Gallery')

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
                      {/* Photo — full width, clickable */}
                      <GalleryLightbox
                        src={photo.image_url}
                        caption={photo.description || photo.caption || ''}
                        alt={`Gallery photo`}
                        photoId={photo.id}
                        capsuleId={capsule.id}
                      />
                      {/* Description below — only if exists */}
                      {(photo.description || photo.caption) && (
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.accentFaint}` }}>
                          <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.75, fontStyle: 'italic', margin: 0 }}>
                            {photo.description || photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        })()}

        {/* Expression of Honour */}
        {hasWaysToHonour && (
          <div style={{ marginBottom: '32px' }}>
            {/* Zone A — Ceremonial header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)`, marginBottom: '20px' }} />
              <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', background: 'rgba(226,195,107,0.08)', border: '1px solid rgba(226,195,107,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 24px rgba(226,195,107,0.12)' }}>✦</div>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: t.accentMuted, marginBottom: '8px' }}>Expression of Honour</p>
              <p style={{ fontSize: '13px', color: t.textFaint, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto', fontStyle: 'italic' }}>
                {getEOHMessage(capsule.event_type)}
              </p>
              <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.2), transparent)`, marginTop: '20px' }} />
            </div>

            {/* Zone B — Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {supportAccounts.map((account: any) => (
                <WaysToHonourCard
                  key={account.id}
                  account={account}
                  capsuleId={capsule.id}
                  acknowledgeLabel={getGiftAcknowledgeLabel(capsule.event_type)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasContent && (
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '28px', marginBottom: '16px' }}>{eventEmoji}</p>
            <p style={{ fontSize: '15px', color: t.textMuted, lineHeight: 1.75, fontFamily: "'Playfair Display', serif" }}>A life and legacy worth honouring.<br />More details coming soon.</p>
          </div>
        )}

        {/* Bottom navigation */}
        <div style={{ paddingTop: '32px', borderTop: `1px solid ${t.accentFaint}`, display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
          <a href={`/for/${slug}`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', border: `1px solid ${t.accentFaint}`, color: t.accentMuted, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.03)' }}>← Tribute Wall</a>
          <a href={`/for/${slug}`} style={{ padding: '10px 22px', borderRadius: '24px', textDecoration: 'none', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>Leave a Tribute ✦</a>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${t.accentFaint}`, padding: '28px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', color: t.textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.14)', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Events end. Legacies continue.</p>
        <p style={{ marginTop: '10px' }}><a href="/book" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textDecoration: 'none' }}>Planning your own event? Start here →</a></p>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await adminClient.from('capsules').select('honouree_name, event_tag, event_type').eq('slug', slug).maybeSingle()
  if (!data) return { title: 'Profile | LegacyCapsule' }
  return {
    title: `${data.honouree_name} — ${data.event_tag ?? getEventTypeLabel(data.event_type)} | LegacyCapsule`,
    description: `${data.event_tag ?? getEventTypeLabel(data.event_type)} — a LegacyCapsule tribute collection.`,
  }
}
