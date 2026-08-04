// ============================================================
// FILE PATH: components/capsule/EventMomentsClient.tsx
// PURPOSE:   Guest-facing Event Moments gallery.
//            "I Was There" photo presence record per programme item.
//            Photo-only — no tribute form, no caption field.
//            Upload CTA routes to D-Day page (phase-tagged).
//            Window-aware: upload CTA hidden after 6am next day.
//            Infinite scroll for guest photos (page by 20).
//            Two sections: In The Room / Official Photography.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.8
// DATE:      1 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports & types ═══

import { useState, useCallback, useRef }  from 'react'
import { getThemeConfig }                 from '@/lib/themeConfig'
import type { ThemeKey }                  from '@/lib/themeConfig'
import Link                               from 'next/link'

interface GalleryPhoto {
  id:                string
  image_url:         string
  uploaded_by_name:  string | null
  created_at:        string
  display_order:     number | null
}

interface PhaseNav {
  id:   string
  name: string
}

interface EventMomentsClientProps {
  capsule: {
    id:            string
    slug:          string
    honouree_name: string
    event_type:    string
    event_tag:     string | null
  }
  phase: {
    id:                string
    name:              string
    event_date:        string | null
    location:          string | null
    sort_order:        number
    programme_summary: string
    programme_items:   Array<{ time: string; description: string }>
  }
  phaseIndex:            number
  prevPhase:             PhaseNav | null
  nextPhase:             PhaseNav | null
  allPhases:             PhaseNav[]
  initialGuestPhotos:    GalleryPhoto[]
  initialOfficialPhotos: GalleryPhoto[]
  totalGuestCount:       number
  windowOpen:            boolean
  themeKey:              ThemeKey
}

// ═══ SECTION 2 — Date formatting helpers ═══

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function isToday(eventDate: string | null): boolean {
  if (!eventDate) return false
  return eventDate === new Date().toISOString().split('T')[0]
}

// ═══ SECTION 3 — PhotoCard sub-component ═══

function PhotoCard({ photo, t }: { photo: GalleryPhoto; t: ReturnType<typeof getThemeConfig> }) {
  const [loaded, setLoaded] = useState(false)
  const initials = photo.uploaded_by_name ?? 'Guest'
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{
      position:     'relative',
      borderRadius: '12px',
      overflow:     'hidden',
      background:   'rgba(255,255,255,0.04)',
      aspectRatio:  '1',
    }}>
      {/* Skeleton */}
      {!loaded && (
        <div style={{
          position:   'absolute', inset: 0,
          background: 'rgba(255,255,255,0.04)',
          animation:  'pulse 1.5s ease-in-out infinite',
        }} />
      )}

      <img
        src={photo.image_url}
        alt={`${photo.uploaded_by_name ?? 'Guest'} was here`}
        onLoad={() => setLoaded(true)}
        style={{
          width:      '100%',
          height:     '100%',
          objectFit:  'cover',
          display:    loaded ? 'block' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Name overlay */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        padding:    '20px 8px 8px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
      }}>
        <p style={{
          margin:        0,
          fontSize:      '11px',
          fontWeight:    600,
          color:         '#fff',
          letterSpacing: '0.02em',
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
        }}>
          {photo.uploaded_by_name ?? 'Guest'}
        </p>
      </div>
    </div>
  )
}

// ═══ SECTION 4 — Section heading sub-component ═══

function SectionHeading({ label, count, t }: {
  label: string
  count: number
  t:     ReturnType<typeof getThemeConfig>
}) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      padding:        '0 0 12px',
      borderBottom:   `1px solid ${t.accentFaint}`,
      marginBottom:   '16px',
    }}>
      <p style={{
        margin:        0,
        fontSize:      '10px',
        fontWeight:    700,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color:         t.accentMuted,
      }}>
        {label}
      </p>
      <span style={{
        fontSize:   '10px',
        color:      t.textFaint,
        fontWeight: 400,
      }}>
        · {count} {count === 1 ? 'photo' : 'photos'}
      </span>
    </div>
  )
}

// ═══ SECTION 5 — Main component ═══

export default function EventMomentsClient({
  capsule,
  phase,
  phaseIndex,
  prevPhase,
  nextPhase,
  allPhases,
  initialGuestPhotos,
  initialOfficialPhotos,
  totalGuestCount,
  windowOpen,
  themeKey,
}: EventMomentsClientProps) {
  const t = getThemeConfig(themeKey)

  // ── State ──────────────────────────────────────────────────────────
  const [guestPhotos, setGuestPhotos]   = useState<GalleryPhoto[]>(initialGuestPhotos)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(initialGuestPhotos.length === 20)
  const [page, setPage]                 = useState(1)
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const today        = isToday(phase.event_date)
  const ddayUrl      = `/for/${capsule.slug}/dday?phase=${phase.id}`
  const shareUrl     = typeof window !== 'undefined'
    ? window.location.href
    : `https://itslegacycapsule.com/for/${capsule.slug}/story/${phase.id}`

  // ── Load more photos (infinite scroll) ────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const res  = await fetch(`/api/event-moments/${phase.id}?page=${nextPage}`)
      const data = await res.json()
      if (data.ok) {
        setGuestPhotos(prev => [...prev, ...data.guest_photos])
        setHasMore(data.pagination.has_more)
        setPage(nextPage)
      }
    } catch (e) {
      console.error('[EventMomentsClient] loadMore error:', e)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, phase.id])

  // ── Share handlers ─────────────────────────────────────────────────
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `${capsule.honouree_name} — "${phase.name}": see who was there and add your photo: ${shareUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:  '100vh',
      background: t.pageBg,
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: '100px',
    }}>

      {/* ── TOP NAV ── */}
      <div style={{
        background:       'rgba(15,10,30,0.96)',
        borderBottom:     `1px solid ${t.accentFaint}`,
        padding:          '12px 16px',
        position:         'sticky',
        top:              0,
        zIndex:           40,
        backdropFilter:   'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth:   '720px',
          margin:     '0 auto',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href={`/for/${capsule.slug}/story`}
            style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none' }}>
            ← Event Story
          </Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            {prevPhase && (
              <Link href={`/for/${capsule.slug}/story/${prevPhase.id}`}
                style={{ fontSize: '11px', color: t.textFaint, textDecoration: 'none' }}>
                ‹ Prev
              </Link>
            )}
            {nextPhase && (
              <Link href={`/for/${capsule.slug}/story/${nextPhase.id}`}
                style={{ fontSize: '11px', color: t.accentMuted, textDecoration: 'none' }}>
                Next ›
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── PHASE HEADER ── */}
      <div style={{ padding: '28px 20px 20px', maxWidth: '720px', margin: '0 auto' }}>

        {/* Phase number + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width:          '44px',
            height:         '44px',
            borderRadius:   '50%',
            background:     today
              ? `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`
              : 'rgba(255,255,255,0.06)',
            border:         `1px solid ${t.accentFaint}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}>
            <span style={{
              fontSize:   '14px',
              fontWeight: 800,
              color:      today ? '#1a0845' : t.accentMuted,
            }}>
              {(phaseIndex + 1).toString().padStart(2, '0')}
            </span>
          </div>

          <div>
            <h1 style={{
              fontFamily:  "'Playfair Display', Georgia, serif",
              fontSize:    'clamp(20px, 5vw, 26px)',
              fontWeight:  800,
              color:       '#ffffff',
              margin:      0,
              lineHeight:  1.2,
            }}>
              {phase.name}
            </h1>
            <p style={{ fontSize: '11px', color: t.textFaint, margin: '3px 0 0' }}>
              {capsule.honouree_name}
              {capsule.event_tag ? ` · ${capsule.event_tag}` : ''}
            </p>
          </div>
        </div>

        {/* Date + location */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
          {phase.event_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📅</span>
              <span style={{
                fontSize:   '12px',
                color:      today ? t.accentPrimary : t.accentMuted,
                fontWeight: today ? 700 : 400,
              }}>
                {today
                  ? `Today — ${formatDate(phase.event_date)}`
                  : formatDate(phase.event_date)}
              </span>
            </div>
          )}
          {phase.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📍</span>
              <span style={{ fontSize: '12px', color: t.textFaint }}>
                {phase.location}
              </span>
            </div>
          )}
        </div>

        {/* Programme summary */}
        {phase.programme_summary && (
          <p style={{
            fontSize:   '13px',
            color:      t.textFaint,
            lineHeight: 1.7,
            marginTop:  '10px',
            fontStyle:  'italic',
            padding:    '12px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border:     `1px solid ${t.accentFaint}`,
          }}>
            {phase.programme_summary}
          </p>
        )}

        {/* Programme items */}
        {phase.programme_items.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{
              fontSize:      '10px',
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color:         t.accentMuted,
              marginBottom:  '10px',
            }}>
              Programme
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {phase.programme_items.map((item, i) => (
                <div key={i} style={{
                  display:      'flex',
                  gap:          '12px',
                  padding:      '8px 12px',
                  borderRadius: '8px',
                  background:   'rgba(255,255,255,0.02)',
                  border:       `1px solid ${t.accentFaint}`,
                }}>
                  {item.time && (
                    <span style={{
                      fontSize:   '11px',
                      fontWeight: 700,
                      color:      t.accentPrimary,
                      flexShrink: 0,
                      minWidth:   '50px',
                    }}>
                      {item.time}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: t.textFaint, lineHeight: 1.5 }}>
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── GOLD DIVIDER ── */}
      <div style={{
        height:     '1px',
        background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)`,
        margin:     '0 0 24px',
      }} />

      {/* ── I WAS THERE CTA ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px 24px' }}>
        {windowOpen ? (
          <div style={{
            borderRadius: '16px',
            border:       `1px solid ${today ? t.accentPrimary : t.accentFaint}`,
            background:   today
              ? 'rgba(226,195,107,0.06)'
              : 'rgba(255,255,255,0.02)',
            padding:      '20px',
            textAlign:    'center',
            boxShadow:    today ? `0 0 24px rgba(226,195,107,0.08)` : 'none',
          }}>
            {today && (
              <p style={{
                fontSize:      '10px',
                fontWeight:    800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color:         t.accentPrimary,
                marginBottom:  '8px',
              }}>
                Happening Now
              </p>
            )}
            <p style={{
              fontSize:     '13px',
              color:        t.textMuted,
              lineHeight:   1.65,
              marginBottom: '16px',
            }}>
              {today
                ? 'You are part of this moment. Add your photo and be part of the record forever.'
                : 'Were you there? Add your photo to be part of this record.'}
            </p>
            <Link
              href={ddayUrl}
              style={{
                display:        'inline-block',
                padding:        '13px 32px',
                borderRadius:   '28px',
                background:     `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
                color:          '#1a0845',
                fontSize:       '14px',
                fontWeight:     700,
                textDecoration: 'none',
                letterSpacing:  '0.04em',
              }}>
              ✦ I Was There — Add My Photo
            </Link>
          </div>
        ) : (
          <div style={{
            padding:    '14px 20px',
            borderRadius: '12px',
            border:     `1px solid ${t.accentFaint}`,
            background: 'rgba(255,255,255,0.01)',
            textAlign:  'center',
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: t.textFaint, fontStyle: 'italic' }}>
              This moment is now preserved.
            </p>
          </div>
        )}
      </div>

      {/* ── LIVE COUNTER ── */}
      {totalGuestCount > 0 && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: t.accentMuted, fontWeight: 600 }}>
            {totalGuestCount} {totalGuestCount === 1 ? 'person was' : 'people were'} here for this moment
          </p>
        </div>
      )}

      {/* ── GUEST PHOTOS — IN THE ROOM ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
        {guestPhotos.length > 0 ? (
          <>
            <SectionHeading label="In The Room" count={totalGuestCount} t={t} />
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 '8px',
              marginBottom:        '24px',
            }}>
              {guestPhotos.map(photo => (
                <div key={photo.id} onClick={() => setLightboxPhoto(photo)} style={{ cursor: 'pointer' }}>
                  <PhotoCard photo={photo} t={t} />
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div ref={loaderRef} style={{ textAlign: 'center', paddingBottom: '16px' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding:      '10px 28px',
                    borderRadius: '20px',
                    border:       `1px solid ${t.accentFaint}`,
                    background:   'transparent',
                    color:        t.accentMuted,
                    fontSize:     '12px',
                    fontWeight:   600,
                    cursor:       loadingMore ? 'not-allowed' : 'pointer',
                    opacity:      loadingMore ? 0.5 : 1,
                  }}>
                  {loadingMore ? 'Loading…' : 'Load more photos'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign:    'center',
            padding:      '32px 20px',
            borderRadius: '14px',
            border:       `1px solid ${t.accentFaint}`,
            background:   'rgba(255,255,255,0.01)',
            marginBottom: '24px',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: t.textMuted }}>
              No photos yet for this moment.
            </p>
            {windowOpen && (
              <p style={{ margin: 0, fontSize: '12px', color: t.textFaint }}>
                Be the first to add yours.
              </p>
            )}
          </div>
        )}

        {/* ── OFFICIAL PHOTOGRAPHY ── */}
        {initialOfficialPhotos.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <SectionHeading
              label="Official Photography"
              count={initialOfficialPhotos.length}
              t={t}
            />
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 '8px',
            }}>
              {initialOfficialPhotos.map(photo => (
                <div key={photo.id} onClick={() => setLightboxPhoto(photo)} style={{ cursor: 'pointer' }}>
                  <PhotoCard photo={photo} t={t} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SHARE THIS MOMENT ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px 24px' }}>
        <div style={{
          padding:      '16px',
          borderRadius: '12px',
          border:       `1px solid ${t.accentFaint}`,
          background:   'rgba(255,255,255,0.02)',
        }}>
          <p style={{
            margin:        '0 0 12px',
            fontSize:      '11px',
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color:         t.accentMuted,
          }}>
            Help grow this record
          </p>
          <p style={{
            margin:     '0 0 14px',
            fontSize:   '12px',
            color:      t.textFaint,
            lineHeight: 1.6,
          }}>
            Share this page — every person who adds their photo makes this record more complete.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopyLink}
              style={{
                flex:         1,
                padding:      '10px',
                borderRadius: '10px',
                border:       `1px solid ${t.accentFaint}`,
                background:   'rgba(255,255,255,0.03)',
                color:        t.accentMuted,
                fontSize:     '12px',
                fontWeight:   600,
                cursor:       'pointer',
              }}>
              🔗 Copy Link
            </button>
            <button
              onClick={handleWhatsApp}
              style={{
                flex:         1,
                padding:      '10px',
                borderRadius: '10px',
                border:       '1px solid rgba(74,222,128,0.2)',
                background:   'rgba(74,222,128,0.04)',
                color:        'rgba(134,239,172,0.85)',
                fontSize:     '12px',
                fontWeight:   600,
                cursor:       'pointer',
              }}>
              💬 WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ── PHASE NAVIGATION ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {prevPhase && (
            <Link href={`/for/${capsule.slug}/story/${prevPhase.id}`} style={{
              padding:        '10px 20px',
              borderRadius:   '24px',
              textDecoration: 'none',
              border:         `1px solid ${t.accentFaint}`,
              color:          t.accentMuted,
              fontSize:       '12px',
              fontWeight:     600,
            }}>
              ← {prevPhase.name}
            </Link>
          )}
          <Link href={`/for/${capsule.slug}/story`} style={{
            padding:        '10px 20px',
            borderRadius:   '24px',
            textDecoration: 'none',
            border:         `1px solid ${t.accentFaint}`,
            color:          t.textFaint,
            fontSize:       '12px',
            fontWeight:     600,
          }}>
            All Phases
          </Link>
          {nextPhase && (
            <Link href={`/for/${capsule.slug}/story/${nextPhase.id}`} style={{
              padding:        '10px 20px',
              borderRadius:   '24px',
              textDecoration: 'none',
              border:         `1px solid ${t.accentFaint}`,
              color:          t.accentPrimary,
              fontSize:       '12px',
              fontWeight:     600,
            }}>
              {nextPhase.name} →
            </Link>
          )}
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position:        'fixed',
            inset:           0,
            zIndex:          100,
            background:      'rgba(0,0,0,0.92)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         '20px',
            flexDirection:   'column',
            gap:             '12px',
          }}>
          <img
            src={lightboxPhoto.image_url}
            alt={lightboxPhoto.uploaded_by_name ?? 'Official Photography'}
            style={{
              maxWidth:     '100%',
              maxHeight:    '80vh',
              borderRadius: '12px',
              objectFit:    'contain',
            }}
          />
          <p style={{
            margin:     0,
            fontSize:   '13px',
            color:      'rgba(255,255,255,0.7)',
            fontWeight: 600,
          }}>
            {lightboxPhoto.uploaded_by_name ?? 'Official Photography'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            Tap anywhere to close
          </p>
        </div>
      )}

    </div>
  )
}