// ============================================================
// FILE PATH: components/display/QRInterstitial.tsx
// PURPOSE:   Full-screen QR code interstitial shown at
//            configurable intervals during display scroll.
//            Invites new guests to scan and participate.
//            QR never interrupts a Story card mid-display.
// ARCHITECTURE: EDS — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRInterstitialProps {
  capsuleUrl: string       // full URL e.g. https://itslegacycapsule.com/for/slug
  honoureeName: string
  durationSecs: number
  onComplete: () => void
}

export default function QRInterstitial({
  capsuleUrl,
  honoureeName,
  durationSecs,
  onComplete,
}: QRInterstitialProps) {
  const [visible, setVisible] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(capsuleUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0D0820', light: '#F5F3EE' },
    }).then(setQrDataUrl).catch(console.error)
  }, [capsuleUrl])

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
      background: 'linear-gradient(135deg, #0D0820 0%, #1a0f35 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
      zIndex: 10,
      gap: '2rem',
    }}>
      <p style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
        color: '#F5F3EE',
        margin: 0,
        textAlign: 'center',
        maxWidth: '600px',
        lineHeight: 1.5,
      }}>
        SCAN TO SHARE YOUR WISHES FOR {honoureeName.toUpperCase()}
      </p>

      {qrDataUrl && (
        <div style={{
          background: '#F5F3EE',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '3px solid #D4AE2A',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR Code" style={{ display: 'block', width: '280px', height: '280px' }} />
        </div>
      )}

      <p style={{
        fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
        color: '#D4AE2A',
        margin: 0,
        opacity: 0.8,
        letterSpacing: '0.05em',
      }}>
        {capsuleUrl}
      </p>

      <p style={{
        fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: 'clamp(0.8rem, 1.3vw, 1rem)',
        color: '#F5F3EE',
        margin: 0,
        opacity: 0.5,
        fontStyle: 'italic',
      }}>
        Your voice will appear on this screen
      </p>
    </div>
  )
}
