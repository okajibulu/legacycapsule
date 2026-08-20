// ============================================================
// FILE PATH: components/display/StoryPhotosCard.tsx
// PURPOSE:   Renders an approved story with optional photo(s).
//            Auto-layout based on photo count:
//              0 photos → typography-only card
//              1 photo  → story + single photo
//              2–3 photos → story + photo strip (hero + supporting)
//              4+ photos → uses first 3 only
//            Organiser never manually selects layout.
//            Duration controlled by event_display_config.
// ARCHITECTURE: EDS — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useEffect, useState } from 'react'

// ═══ SECTION 2 — Types ═══

export interface StoryPhotosCardData {
  id: string
  contributor_name: string
  relationship: string | null
  city: string | null
  ip_country: string | null
  tribute_text: string // story text
  photos: Array<{ image_url: string; caption: string | null }>
}

interface StoryPhotosCardProps {
  data: StoryPhotosCardData
  durationSecs: number   // caller passes correct duration based on photo count
  onComplete: () => void
  theme?: string
}

// ═══ SECTION 3 — Layout Sub-components ═══

function StoryText({ data }: { data: StoryPhotosCardData }) {
  const location = [data.city, data.ip_country].filter(Boolean).join(', ')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
        color: '#D4AE2A',
        margin: '0 0 0.4rem',
        fontWeight: 'normal',
      }}>
        {data.contributor_name}
      </h2>
      <p style={{
        fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: 'clamp(0.9rem, 1.6vw, 1.1rem)',
        color: '#F5F3EE',
        opacity: 0.65,
        margin: '0 0 1.5rem',
        fontStyle: 'italic',
      }}>
        {[data.relationship, location].filter(Boolean).join(' · ')}
      </p>
      <div style={{ width: '40px', height: '1px', background: '#D4AE2A', marginBottom: '1.5rem', opacity: 0.6 }} />
      <p style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(1rem, 1.9vw, 1.4rem)',
        color: '#F5F3EE',
        lineHeight: 1.85,
        margin: 0,
      }}>
        {data.tribute_text}
      </p>
    </div>
  )
}

// ═══ SECTION 4 — Main Component ═══

export default function StoryPhotosCard({
  data,
  durationSecs,
  onComplete,
  theme = 'default',
}: StoryPhotosCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fadeIn = setTimeout(() => setVisible(true), 50)
    const advance = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 600)
    }, durationSecs * 1000)
    return () => { clearTimeout(fadeIn); clearTimeout(advance) }
  }, [durationSecs, onComplete])

  // Use maximum 3 photos
  const photos = data.photos.slice(0, 3)
  const photoCount = photos.length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0D0820 0%, #1a0f35 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 4rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        zIndex: 10,
        gap: '3rem',
      }}
    >
      {/* ── No photos: full-width typography ── */}
      {photoCount === 0 && (
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <StoryText data={data} />
        </div>
      )}

      {/* ── 1 photo: story left, photo right ── */}
      {photoCount === 1 && (
        <>
          <div style={{ flex: 1, maxWidth: '55%' }}>
            <StoryText data={data} />
          </div>
          <div style={{ flex: 1, maxWidth: '42%', display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[0].image_url}
              alt={photos[0].caption || ''}
              style={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          </div>
        </>
      )}

      {/* ── 2–3 photos: story left, photo strip right ── */}
      {photoCount >= 2 && (
        <>
          <div style={{ flex: 1, maxWidth: '50%' }}>
            <StoryText data={data} />
          </div>
          <div style={{ flex: 1, maxWidth: '46%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Hero photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[0].image_url}
              alt={photos[0].caption || ''}
              style={{
                width: '100%',
                height: '55%',
                objectFit: 'cover',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            />
            {/* Supporting photos */}
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
              {photos.slice(1).map((photo, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={photo.image_url}
                  alt={photo.caption || ''}
                  style={{
                    flex: 1,
                    objectFit: 'cover',
                    borderRadius: '4px',
                    minWidth: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Gold ornament bottom */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#D4AE2A',
        fontSize: '0.9rem',
        opacity: 0.4,
        letterSpacing: '0.3rem',
      }}>
        ✦
      </div>
    </div>
  )
}
