'use client'

/* =========================================================
   LEGACY ROOM CLIENT — LC-LEGACYROOM-001
   FILE: components/LegacyRoomClient.tsx

   Three-Room Model — Room 3: Community Participation & Preservation
   Theme-aware · 60s activity polling · Gallery lightbox
   Mobile-first · Premium ceremonial aesthetic

   Sections (per E3):
     1. Collection Overview — 4 stats from participation summary
     2. Legacy Builders — top 5 with tier badges (hidden below threshold)
     3. Recent Activity — last 10 approved events, 60s poll
     4. Gallery — Featured Memories (organiser curated)
     5. Publication Status — collection state + future download CTA

   OWNER: AI7 — Phase 2
========================================================= */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getThemeConfig } from '@/lib/themeConfig'
import type { ThemeKey, ThemeConfig } from '@/lib/themeConfig'

/* ── TYPES ── */
interface Capsule {
  id: string; slug: string; honouree_name: string; honouree_title: string | null
  event_type: string; event_tag: string | null; hero_image_url: string | null
  components: string[]
  hero_image_position: string | null; hero_image_zoom: number | null
  hero_image_fit: string | null; hero_panel_size: string | null
  hero_full_bleed: boolean | null
}

interface Summary {
  contributor_count: number; photo_count: number
  country_count: number; share_count: number
  legacy_builder_count: number; attributed_contrib_count: number
  last_activity_at: string | null
}

interface Builder {
  id: string; contributor_name: string; display_name: string
  ref_count: number; recognition_tier: string; rank_position: number | null
}

interface Activity {
  id: string; contributor_name: string; city: string; country: string
  created_at: string; thumbnail_url: string | null
}

interface GalleryPhoto {
  id: string; image_url: string; description: string | null
  sort_order: number | null; section_index: number | null
}

interface Props {
  capsule: Capsule; summary: Summary; builders: Builder[]
  showBuilders: boolean; recentActivity: Activity[]
  galleryPhotos: GalleryPhoto[]; themeKey: ThemeKey
}

/* ── TIER CONFIG ── */
const TIER_STYLES: Record<string, { label: string; badge: string; glow: string }> = {
  lead_legacy_builder: { label: 'Lead Legacy Builder', badge: '◆', glow: 'rgba(226,195,107,0.4)' },
  legacy_builder:      { label: 'Legacy Builder',      badge: '◇', glow: 'rgba(226,195,107,0.25)' },
  community_builder:   { label: 'Community Builder',   badge: '✦', glow: 'rgba(226,195,107,0.15)' },
}

/* =========================================================
   STAT CARD — single metric with label
========================================================= */
function StatCard({ value, label, accent, t }: {
  value: number; label: string; accent?: boolean; t: ThemeConfig
}) {
  return (
    <div style={{
      flex: 1, minWidth: '70px', padding: '16px 10px',
      borderRadius: '14px', textAlign: 'center',
      background: accent ? 'rgba(226,195,107,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        fontSize: '28px', fontWeight: 800, lineHeight: 1,
        fontFamily: "'Playfair Display', Georgia, serif",
        color: accent ? t.accentPrimary : t.textHeading,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '9px', color: t.textFaint, marginTop: '6px',
        textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600,
      }}>
        {label}
      </div>
    </div>
  )
}

/* =========================================================
   BUILDER CARD — single legacy builder row
========================================================= */
function BuilderCard({ builder, t }: { builder: Builder; t: ThemeConfig }) {
  const tier = TIER_STYLES[builder.recognition_tier] ?? TIER_STYLES.community_builder
  const isLead = builder.recognition_tier === 'lead_legacy_builder'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px', borderRadius: '14px',
      background: isLead ? 'rgba(226,195,107,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isLead ? 'rgba(226,195,107,0.22)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'all 0.3s ease',
    }}>
      {/* Rank badge */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isLead
          ? 'linear-gradient(135deg, rgba(226,195,107,0.2), rgba(226,195,107,0.08))'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isLead ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: `0 0 12px ${tier.glow}`,
        fontSize: '14px', color: t.accentPrimary,
      }}>
        {tier.badge}
      </div>

      {/* Name + tier */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '13px', fontWeight: 700,
          color: isLead ? t.accentPrimary : t.textHeading,
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {builder.display_name}
        </p>
        <p style={{
          fontSize: '9px', color: t.textFaint, margin: '2px 0 0',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {tier.label}
        </p>
      </div>

      {/* Ref count */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{
          fontSize: '16px', fontWeight: 800,
          fontFamily: "'Playfair Display', Georgia, serif",
          color: t.accentPrimary,
        }}>
          {builder.ref_count}
        </span>
        <p style={{
          fontSize: '8px', color: t.textFaint, margin: '2px 0 0',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          brought in
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   ACTIVITY ROW — single recent contribution
========================================================= */
function ActivityRow({ item, t }: { item: Activity; t: ThemeConfig }) {
  const timeAgo = getTimeAgo(item.created_at)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 0',
      borderBottom: `1px solid rgba(255,255,255,0.04)`,
    }}>
      {/* Thumbnail or initials */}
      {item.thumbnail_url ? (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden',
          flexShrink: 0, border: `1px solid rgba(226,195,107,0.15)`,
        }}>
          <img src={item.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(226,195,107,0.08)', border: `1px solid rgba(226,195,107,0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: t.accentMuted,
        }}>
          {item.contributor_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Name + location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '12px', fontWeight: 600, color: t.textHeading, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.contributor_name}
        </p>
        <p style={{ fontSize: '10px', color: t.textFaint, margin: '1px 0 0' }}>
          {[item.city, item.country].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Time ago */}
      <span style={{ fontSize: '10px', color: t.textFaint, flexShrink: 0 }}>
        {timeAgo}
      </span>
    </div>
  )
}

/* ── TIME AGO UTILITY ── */
function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(dateStr))
}

/* =========================================================
   GALLERY LIGHTBOX
========================================================= */
function GalleryLightbox({ photo, onClose, t }: {
  photo: GalleryPhoto; onClose: () => void; t: ThemeConfig
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(8,2,20,0.95)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          color: t.textFaint, background: 'none', border: 'none',
          fontSize: '24px', cursor: 'pointer', lineHeight: 1, zIndex: 2,
        }}
      >
        ×
      </button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '80vh' }}>
        <img
          src={photo.image_url}
          alt={photo.description ?? 'Gallery photo'}
          style={{
            maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px',
            objectFit: 'contain', boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
          }}
        />
        {photo.description && (
          <p style={{
            textAlign: 'center', fontSize: '12px', color: t.textMuted,
            marginTop: '12px', lineHeight: 1.6, maxWidth: '400px', margin: '12px auto 0',
          }}>
            {photo.description}
          </p>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   SECTION WRAPPER — consistent section spacing + dividers
========================================================= */
function Section({ title, subtitle, children, t }: {
  title: string; subtitle?: string; children: React.ReactNode; t: ThemeConfig
}) {
  return (
    <div style={{ padding: '0 16px', marginBottom: '24px' }}>
      {/* Gold divider */}
      <div style={{
        height: '1px', marginBottom: '16px',
        background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)`,
      }} />
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.22em', color: t.accentMuted, margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '11px', color: t.textFaint, margin: '4px 0 0', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function LegacyRoomClient({
  capsule, summary, builders, showBuilders, recentActivity, galleryPhotos, themeKey,
}: Props) {
  const t = getThemeConfig(themeKey)
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /* ── STATE ── */
  const [activity, setActivity] = useState<Activity[]>(recentActivity)
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null)

  /* ── DERIVED ── */
  const honourName = capsule.honouree_name
  const resolvedHero = capsule.hero_image_url ?? null
  const heroPosition = capsule.hero_image_position ?? '50% 50%'
  const heroZoom = capsule.hero_image_zoom ?? 150
  const heroFit = capsule.hero_image_fit ?? 'height'

  /* ── 60s ACTIVITY POLLING ── */
  const pollActivity = useCallback(async () => {
    try {
      const { data } = await supabaseClient
        .from('contributions')
        .select('id, contributor_name, city, country, created_at, thumbnail_url')
        .eq('capsule_id', capsule.id)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setActivity(data as Activity[])
    } catch {}
  }, [capsule.id])

  useEffect(() => {
    const iv = setInterval(pollActivity, 60_000)
    return () => clearInterval(iv)
  }, [pollActivity])

  /* ── BODY OVERFLOW LOCK ── */
  useEffect(() => {
    document.body.style.overflow = lightboxPhoto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxPhoto])

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <>
      {/* Lightbox */}
      {lightboxPhoto && <GalleryLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} t={t} />}

      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', background: t.pageBg }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

          {/* ── TOP BAR ── */}
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 16px 8px', gap: '12px',
          }}>
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{
                fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em',
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>LEGACY</span>
              <span style={{
                fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em',
                color: t.textFaint, marginLeft: '0.18em',
              }}>CAPSULE</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href={`/for/${capsule.slug}`} style={{
                fontSize: '11px', fontWeight: 600, color: t.accentMuted,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Tribute Room →
              </Link>
              <Link href={`/for/${capsule.slug}/profile`} style={{
                fontSize: '11px', fontWeight: 600, color: t.accentMuted,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Profile →
              </Link>
            </div>
          </div>

          {/* ── HERO HEADER ── */}
          <div style={{
            flexShrink: 0, position: 'relative', overflow: 'hidden',
            minHeight: '140px', margin: '0 12px', borderRadius: '20px',
          }}>
            {resolvedHero ? (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${resolvedHero})`,
                backgroundSize:
                  heroFit === 'width' ? '100% auto'
                  : heroFit === 'height' ? 'auto 100%'
                  : heroFit === 'custom' ? `${heroZoom}%`
                  : 'cover',
                backgroundPosition: heroPosition,
                backgroundRepeat: 'no-repeat', backgroundColor: '#000',
              }} />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(145deg, #0a0518 0%, #1a0d3a 45%, #2a1060 100%)',
              }}>
                <div style={{
                  position: 'absolute', width: '50%', height: '50%', borderRadius: '999px',
                  background: 'rgba(226,195,107,0.08)', filter: 'blur(80px)',
                  top: '-10%', right: '-5%',
                }} />
              </div>
            )}

            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)` }} />

            {/* Content */}
            <div style={{
              position: 'relative', zIndex: 1, padding: '28px 24px 24px', textAlign: 'center',
            }}>
              <p style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.3em',
                textTransform: 'uppercase', color: t.accentMuted, marginBottom: '8px',
              }}>
                Legacy Room
              </p>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(20px, 5.5vw, 28px)', fontWeight: 800,
                color: t.textHeading, lineHeight: 1.2,
                textShadow: '0 2px 16px rgba(0,0,0,0.8)', margin: '0 0 6px',
              }}>
                {honourName}
              </h1>
              {capsule.event_tag && (
                <p style={{
                  fontSize: '11px', color: t.accentMuted, letterSpacing: '0.18em',
                  textTransform: 'uppercase', margin: 0,
                }}>
                  {capsule.event_tag}
                </p>
              )}
              <p style={{
                fontSize: '10px', color: t.textFaint, marginTop: '10px',
                letterSpacing: '0.08em', lineHeight: 1.5,
              }}>
                A living record of how this community showed up
              </p>
            </div>
          </div>

          {/* ── SECTION 1: COLLECTION OVERVIEW ── */}
          <Section title="Collection Overview" t={t}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <StatCard value={summary.contributor_count} label="Voices Gathered" accent t={t} />
              <StatCard value={summary.photo_count} label="Memories Preserved" t={t} />
              <StatCard value={summary.country_count} label="Countries" t={t} />
              <StatCard value={summary.share_count} label="Times Shared" t={t} />
            </div>
          </Section>

          {/* ── SECTION 2: LEGACY BUILDERS ── */}
          {!showBuilders && (
            <div style={{ padding: '0 16px 8px' }}>
              <p style={{ fontSize: '11px', color: t.textFaint, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6 }}>
                When enough voices gather, those who helped bring others into this story will be recognised here.
              </p>
            </div>
          )}
          {showBuilders && (
            <Section
              title="Legacy Builders"
              subtitle="Helping more family and friends become part of this collection"
              t={t}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {builders.map(builder => (
                  <BuilderCard key={builder.id} builder={builder} t={t} />
                ))}
              </div>
            </Section>
          )}

          {/* ── SECTION 3: RECENT ACTIVITY ── */}
          {activity.length > 0 && (
            <Section title="Recently Joined This Record" t={t}>
              <div style={{
                borderRadius: '14px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.05)`,
                padding: '4px 14px',
              }}>
                {activity.map((item, idx) => (
                  <ActivityRow key={item.id} item={item} t={t} />
                ))}
              </div>
            </Section>
          )}

          {/* ── SECTION 4: GALLERY — FEATURED MEMORIES ── */}
          {galleryPhotos.length > 0 && (
            <Section title="Featured Memories" subtitle="Curated by the organiser" t={t}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px',
              }}>
                {galleryPhotos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    style={{
                      aspectRatio: '1', borderRadius: '10px', overflow: 'hidden',
                      cursor: 'pointer', position: 'relative',
                      border: `1px solid rgba(255,255,255,0.06)`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.description ?? ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Hover overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.15)',
                      opacity: 0, transition: 'opacity 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── SECTION 5: PUBLICATION STATUS ── */}
          <Section title="Publication Status" t={t}>
            <div style={{
              padding: '20px 18px', borderRadius: '14px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid rgba(255,255,255,0.06)`,
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>✦</div>
              <p style={{
                fontSize: '13px', fontWeight: 600, color: t.textHeading, margin: '0 0 6px',
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                A permanent record is being assembled
              </p>
              <p style={{
                fontSize: '11px', color: t.textFaint, lineHeight: 1.6, margin: 0,
                maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto',
              }}>
                Every voice gathered here will be preserved in a digital publication — a lasting record for generations to come.
              </p>
            </div>
          </Section>

          {/* ── PAGE NAVIGATION ── */}
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'center',
            padding: '8px 16px 20px', flexWrap: 'wrap',
          }}>
            <Link href={`/for/${capsule.slug}`} style={{
              padding: '10px 22px', borderRadius: '24px', textDecoration: 'none',
              border: `1px solid ${t.accentFaint}`, color: t.accentMuted,
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em',
              background: 'rgba(255,255,255,0.03)',
            }}>
              Tribute Room →
            </Link>
            <Link href={`/for/${capsule.slug}/profile`} style={{
              padding: '10px 22px', borderRadius: '24px', textDecoration: 'none',
              border: `1px solid ${t.accentFaint}`, color: t.accentMuted,
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em',
              background: 'rgba(255,255,255,0.03)',
            }}>
              View Profile →
            </Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
              padding: '10px 22px', borderRadius: '24px',
              border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.03)',
              color: t.accentMuted, fontSize: '13px', fontWeight: 600,
              letterSpacing: '0.04em', cursor: 'pointer',
            }}>
              ↑ Back to Top
            </button>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ padding: '20px 16px 24px', textAlign: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em',
              background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>LEGACY</span>
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em',
              color: t.textFaint, marginLeft: '0.18em',
            }}>CAPSULE</span>
            <p style={{
              fontSize: '9px', color: 'rgba(255,255,255,0.12)', marginTop: '6px',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              Events end. Legacies don't.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
