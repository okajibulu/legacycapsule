// ============================================================
// FILE PATH: components/display/PhotoCard.tsx
// PURPOSE:   Renders a single event photo in the display scroll.
//            Handles portrait and landscape gracefully.
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

export interface PhotoCardData {
  id: string
  image_url: string
  caption: string | null
  uploaded_by_name?: string | null
}

interface PhotoCardProps {
  data: PhotoCardData
  durationSecs: number
  onComplete: () => void
  theme?: string
}

// ═══ SECTION 3 — Component ═══

export default function PhotoCard({
  data,
  durationSecs,
  onComplete,
  theme = 'default',
}: PhotoCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fadeIn = setTimeout(() => setVisible(true), 50)
    const advance = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 600)
    }, durationSecs * 1000)

    return () => {
      clearTimeout(fadeIn)
      clearTimeout(advance)
    }
  }, [durationSecs, onComplete])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0D0820',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        zIndex: 10,
      }}
    >
      {/* Photo — object-contain preserves aspect ratio */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 3rem 1rem',
        minHeight: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image_url}
          alt={data.caption || 'Event photo'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Caption strip */}
      {(data.caption || data.uploaded_by_name) && (
        <div style={{
          width: '100%',
          padding: '1rem 3rem 2rem',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {data.caption && (
            <p style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
              color: '#F5F3EE',
              margin: '0 0 0.4rem',
              fontStyle: 'italic',
            }}>
              {data.caption}
            </p>
          )}
          {data.uploaded_by_name && (
            <p style={{
              fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
              fontSize: 'clamp(0.85rem, 1.4vw, 1rem)',
              color: '#D4AE2A',
              margin: 0,
              opacity: 0.8,
            }}>
              {data.uploaded_by_name}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
