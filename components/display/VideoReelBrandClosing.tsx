// ============================================================
// FILE PATH: components/display/VideoReelBrandClosing.tsx
// PURPOSE:   LC-branded closing screen for video reel.
//            ZERO network dependency — all content from props.
//            Same system font constraint as Opening.
//            Warm, dignified close after tribute videos.
// ARCHITECTURE: EDS / EDSVR P0 — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useEffect, useState } from 'react'

// ═══ SECTION 2 — Types ═══

interface VideoReelBrandClosingProps {
  honoureeName: string
  eventType: string
  theme?: string
  durationSecs?: number  // default 6
  onComplete: () => void
}

// ═══ SECTION 3 — Closing Copy Map ═══

const CLOSING_LINES: Record<string, string> = {
  memorial: 'Forever remembered. Forever loved.',
  retirement: 'A legacy of excellence, well earned.',
  birthday: 'May this day be the beginning of more beautiful years.',
  wedding: 'Wishing you a lifetime of love and joy.',
  anniversary: 'Here is to the years ahead, as beautiful as those behind.',
  graduation: 'The world is ready for what you bring to it.',
  chieftaincy: 'May this honour mark a new chapter of service.',
  ordination: 'May your path be one of purpose and peace.',
  thanksgiving: 'Every voice here is a gift of gratitude.',
  award: 'Recognition well deserved. Congratulations.',
  default: 'Every voice here was gathered with love.',
}

function getClosingLine(eventType: string): string {
  return CLOSING_LINES[eventType] ?? CLOSING_LINES.default
}

// ═══ SECTION 4 — Component ═══

export default function VideoReelBrandClosing({
  honoureeName,
  eventType,
  theme = 'default',
  durationSecs = 6,
  onComplete,
}: VideoReelBrandClosingProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'leaving'>('entering')

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('visible'), 100)
    const leaveTimer = setTimeout(() => setPhase('leaving'), (durationSecs - 0.7) * 1000)
    const completeTimer = setTimeout(onComplete, durationSecs * 1000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(leaveTimer)
      clearTimeout(completeTimer)
    }
  }, [durationSecs, onComplete])

  const closingLine = getClosingLine(eventType)

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
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
      }}
    >
      {/* Closing line */}
      <p style={{
        fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)',
        color: '#D4AE2A',
        margin: 0,
        fontStyle: 'italic',
        textAlign: 'center',
        maxWidth: '70vw',
        lineHeight: 1.5,
        opacity: 0.9,
      }}>
        {closingLine}
      </p>

      {/* Ornament divider */}
      <div style={{ color: '#D4AE2A', fontSize: '1.2rem', letterSpacing: '0.6rem', opacity: 0.5 }}>
        ✦ ─── ✦
      </div>

      {/* Honouree name */}
      <h2 style={{
        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
        color: '#F5F3EE',
        margin: 0,
        fontWeight: 'normal',
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        {honoureeName}
      </h2>

      {/* Preserved by line */}
      <p style={{
        fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)',
        color: '#F5F3EE',
        margin: '0.5rem 0 0',
        opacity: 0.5,
        letterSpacing: '0.1em',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
      }}>
        This record was preserved by LegacyCapsule
      </p>

      {/* Bottom branding */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
      }}>
        <p style={{
          fontSize: '0.8rem',
          color: '#D4AE2A',
          margin: 0,
          letterSpacing: '0.2em',
          opacity: 0.7,
          fontFamily: 'Georgia, serif',
        }}>
          LegacyCapsule
        </p>
        <p style={{
          fontSize: '0.7rem',
          color: '#F5F3EE',
          margin: 0,
          letterSpacing: '0.1em',
          opacity: 0.3,
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
        }}>
          itslegacycapsule.com · VALNEX, UNIPESSOAL LDA · RevoWorldTech
        </p>
      </div>
    </div>
  )
}
