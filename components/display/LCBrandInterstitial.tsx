// ============================================================
// FILE PATH: components/display/LCBrandInterstitial.tsx
// PURPOSE:   LegacyCapsule brand slide shown at configurable
//            intervals. Brief, dignified, never intrusive.
//            Default 6 seconds. Deep purple + gold identity.
// ARCHITECTURE: EDS — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

import { useEffect, useState } from 'react'

interface LCBrandInterstitialProps {
  durationSecs: number
  onComplete: () => void
}

export default function LCBrandInterstitial({
  durationSecs,
  onComplete,
}: LCBrandInterstitialProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fadeIn = setTimeout(() => setVisible(true), 50)
    const advance = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 600)
    }, durationSecs * 1000)
    return () => { clearTimeout(fadeIn); clearTimeout(advance) }
  }, [durationSecs, onComplete])

  return (
    <div style={{
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
      gap: '1rem',
    }}>
      <div style={{
        color: '#D4AE2A',
        fontSize: '2rem',
        letterSpacing: '0.5rem',
      }}>
        ✦
      </div>

      <h1 style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
        color: '#F5F3EE',
        margin: 0,
        fontWeight: 'normal',
        letterSpacing: '0.15em',
      }}>
        LegacyCapsule
      </h1>

      <p style={{
        fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: 'clamp(0.9rem, 1.6vw, 1.2rem)',
        color: '#D4AE2A',
        margin: 0,
        opacity: 0.85,
        letterSpacing: '0.08em',
        fontStyle: 'italic',
      }}>
        Preserving the voices that matter most
      </p>

      <p style={{
        fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: 'clamp(0.75rem, 1.2vw, 0.95rem)',
        color: '#F5F3EE',
        margin: '0.5rem 0 0',
        opacity: 0.4,
        letterSpacing: '0.05em',
      }}>
        itslegacycapsule.com
      </p>
    </div>
  )
}
