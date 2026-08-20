// ============================================================
// FILE PATH: components/display/VoiceCard.tsx
// PURPOSE:   Renders a single approved voice/tribute in the
//            display scroll. Event-type-aware language.
//            Used in both Offline HTML and Live display.
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

export interface VoiceCardData {
  id: string
  contributor_name: string
  relationship: string | null
  city: string | null
  ip_country: string | null
  tribute_text: string
  thumbnail_url: string | null
}

interface VoiceCardProps {
  data: VoiceCardData
  durationSecs: number
  onComplete: () => void
  theme?: string
}

// ═══ SECTION 3 — Component ═══

export default function VoiceCard({
  data,
  durationSecs,
  onComplete,
  theme = 'default',
}: VoiceCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    const fadeIn = setTimeout(() => setVisible(true), 50)

    // Advance after duration
    const advance = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 600) // wait for fade-out
    }, durationSecs * 1000)

    return () => {
      clearTimeout(fadeIn)
      clearTimeout(advance)
    }
  }, [durationSecs, onComplete])

  const location = [data.city, data.ip_country].filter(Boolean).join(', ')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0D0820 0%, #1a0f35 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        zIndex: 10,
      }}
    >
      {/* Gold ornament top */}
      <div style={{
        position: 'absolute',
        top: '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#D4AE2A',
        fontSize: '1.5rem',
        letterSpacing: '0.5rem',
      }}>
        ✦ ─────── ✦
      </div>

      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Contributor photo */}
        {data.thumbnail_url && (
          <div style={{
            position: 'absolute',
            top: '-1rem',
            right: '-1rem',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #D4AE2A',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.thumbnail_url}
              alt={data.contributor_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Contributor name */}
        <h1 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: '#D4AE2A',
          margin: '0 0 0.5rem',
          fontWeight: 'normal',
          letterSpacing: '0.05em',
        }}>
          {data.contributor_name}
        </h1>

        {/* Relationship + location */}
        <p style={{
          fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#F5F3EE',
          opacity: 0.7,
          margin: '0 0 2.5rem',
          fontStyle: 'italic',
        }}>
          {[data.relationship, location].filter(Boolean).join(' · ')}
        </p>

        {/* Gold rule */}
        <div style={{
          width: '60px',
          height: '1px',
          background: '#D4AE2A',
          margin: '0 auto 2.5rem',
          opacity: 0.6,
        }} />

        {/* Tribute text */}
        <p style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(1.1rem, 2.2vw, 1.6rem)',
          color: '#F5F3EE',
          lineHeight: 1.8,
          margin: 0,
          textAlign: 'center',
        }}>
          {data.tribute_text}
        </p>
      </div>

      {/* Gold ornament bottom */}
      <div style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#D4AE2A',
        fontSize: '1rem',
        letterSpacing: '0.3rem',
        opacity: 0.5,
      }}>
        ✦
      </div>
    </div>
  )
}
