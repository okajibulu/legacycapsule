// ============================================================
// FILE PATH: components/display/VideoReelBrandOpening.tsx
// PURPOSE:   LC-branded opening screen for video reel.
//            ZERO network dependency during playback —
//            all content loaded from props, no API calls,
//            no CDN fetch, system font stack only.
//            Blocker Test 5 compliance: renders without WiFi.
// ARCHITECTURE: EDS / EDSVR P0 — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useEffect, useState } from 'react'

// ═══ SECTION 2 — Types ═══

interface VideoReelBrandOpeningProps {
  honoureeName: string
  eventType: string      // used for tagline selection
  theme?: string
  durationSecs?: number  // default 5
  onComplete: () => void
}

// ═══ SECTION 3 — Tagline Map ═══
// All copy derived from event type — never hardcoded "tribute" outside memorials

const TAGLINES: Record<string, string> = {
  memorial: 'A tribute to a life beautifully lived',
  retirement: 'Celebrating a remarkable career',
  birthday: 'Voices of love and celebration',
  wedding: 'Blessings for the journey ahead',
  anniversary: 'Celebrating a love that endures',
  graduation: 'Voices of pride and encouragement',
  chieftaincy: 'Words of honour and recognition',
  ordination: 'Messages of faith and blessing',
  thanksgiving: 'Voices of gratitude and joy',
  award: 'Words of recognition and pride',
  default: 'Voices gathered with love',
}

function getTagline(eventType: string): string {
  return TAGLINES[eventType] ?? TAGLINES.default
}

// ═══ SECTION 4 — Component ═══

export default function VideoReelBrandOpening({
  honoureeName,
  eventType,
  theme = 'default',
  durationSecs = 5,
  onComplete,
}: VideoReelBrandOpeningProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'leaving'>('entering')

  useEffect(() => {
    // Fade in
    const enterTimer = setTimeout(() => setPhase('visible'), 100)

    // Begin fade out before onComplete
    const leaveTimer = setTimeout(() => setPhase('leaving'), (durationSecs - 0.7) * 1000)

    // Call onComplete after full fade
    const completeTimer = setTimeout(onComplete, durationSecs * 1000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(leaveTimer)
      clearTimeout(completeTimer)
    }
  }, [durationSecs, onComplete])

  const tagline = getTagline(eventType)

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
        gap: '1.5rem',
        opacity: phase === 'visible' ? 1 : 0,
        transition: 'opacity 0.7s ease',
        zIndex: 20,
        // System font stack only — no external font dependency
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
      }}
    >
      {/* Gold ornament */}
      <div style={{ color: '#D4AE2A', fontSize: '1.5rem', letterSpacing: '0.8rem', opacity: 0.8 }}>
        ✦ ─── ✦ ─── ✦
      </div>

      {/* LegacyCapsule wordmark */}
      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.4rem)',
        color: '#D4AE2A',
        margin: 0,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        fontFamily: 'Georgia, "Times New Roman", serif',
        opacity: 0.9,
      }}>
        LegacyCapsule
      </p>

      {/* Presents line */}
      <p style={{
        fontSize: 'clamp(0.8rem, 1.4vw, 1rem)',
        color: '#F5F3EE',
        margin: '-0.5rem 0 0.5rem',
        letterSpacing: '0.15em',
        opacity: 0.6,
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontStyle: 'italic',
      }}>
        presents
      </p>

      {/* Honouree name */}
      <h1 style={{
        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
        color: '#F5F3EE',
        margin: 0,
        fontWeight: 'normal',
        letterSpacing: '0.05em',
        textAlign: 'center',
        maxWidth: '80vw',
        lineHeight: 1.2,
      }}>
        {honoureeName}
      </h1>

      {/* Tagline */}
      <p style={{
        fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
        color: '#D4AE2A',
        margin: '0.5rem 0 0',
        fontStyle: 'italic',
        letterSpacing: '0.05em',
        textAlign: 'center',
        opacity: 0.85,
      }}>
        {tagline}
      </p>

      {/* Bottom ornament */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        color: '#F5F3EE',
        fontSize: '0.75rem',
        letterSpacing: '0.2em',
        opacity: 0.3,
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
      }}>
        itslegacycapsule.com
      </div>
    </div>
  )
}
