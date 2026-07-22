'use client'

// -----------------------------------------------------------------------------
// FILE: components/ActivePremiumsStrip.tsx
// PURPOSE: Inline awareness strip -- shows active guest-facing premium services
//          with direct navigation links. Appears on tribute wall, memories,
//          profile, and highlights pages when at least one premium is active.
//          Inactive services are not shown here -- discovery lives in Premiums tab.
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// SECTION 1 -- Imports & types
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  slug:       string
  components: string[]
}

// -----------------------------------------------------------------------------
// SECTION 2 -- Service definitions (guest-facing premiums only)
// -----------------------------------------------------------------------------

interface PremiumService {
  key:   string
  label: string
  href:  (slug: string) => string
}

const GUEST_PREMIUMS: PremiumService[] = [
  { key: 'ways_to_honour', label: 'Gifting',       href: s => `/for/${s}#premiums`    },
  { key: 'attire',         label: 'Event Attire',  href: s => `/for/${s}/attire`      },
  { key: 'dday_capture',   label: 'D-Day',         href: s => `/for/${s}/dday`        },
  { key: 'live_wall',      label: 'Live Wall',     href: s => `/for/${s}/display`     },
]

// -----------------------------------------------------------------------------
// SECTION 3 -- Component
// -----------------------------------------------------------------------------

export default function ActivePremiumsStrip({ slug, components }: Props) {
  const [glowPhase, setGlowPhase] = useState(0)
  const [mounted,   setMounted]   = useState(false)

  // -- Active services only ---------------------------------------------
  const active = GUEST_PREMIUMS.filter(s => components.includes(s.key))
  if (active.length === 0) return null

  // -- Glow animation via JS interval (no CSS keyframes needed) ---------
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setMounted(true)
    let frame = 0
    const id = setInterval(() => {
      frame = (frame + 1) % 100
      setGlowPhase(frame)
    }, 40) // ~25fps -- smooth but cheap
    return () => clearInterval(id)
  }, [])

  // Sine-wave opacity for glow pulse: 0.18 ? 0.42
  const glowOpacity = mounted
    ? 0.18 + 0.24 * Math.sin((glowPhase / 100) * Math.PI * 2) * 0.5 + 0.12
    : 0.22

  return (
    <div style={{
      margin: '0 0 16px',
      borderRadius: '14px',
      border: '1px solid rgba(226,195,107,0.22)',
      background: 'rgba(226,195,107,0.05)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* -- Dynamic glow layer -- */}
      <div style={{
        position:     'absolute',
        inset:        0,
        borderRadius: '14px',
        pointerEvents: 'none',
        boxShadow:    `0 0 28px rgba(226,195,107,${glowOpacity.toFixed(3)}) inset, 0 0 12px rgba(226,195,107,${(glowOpacity * 0.5).toFixed(3)})`,
        transition:   'box-shadow 0.04s linear',
      }} />

      {/* -- Content -- */}
      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>

        {/* -- Label -- */}
        <span style={{
          fontSize:      '9px',
          fontWeight:    800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
          color:         'rgba(226,195,107,0.5)',
          flexShrink:    0,
          whiteSpace:    'nowrap' as const,
        }}>
          * Also available
        </span>

        {/* -- Divider -- */}
        <div style={{ width: '1px', height: '14px', background: 'rgba(226,195,107,0.15)', flexShrink: 0 }} />

        {/* -- Service pills -- */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {active.map(service => (
            <Link
              key={service.key}
              href={service.href(slug)}
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           '4px',
                padding:       '4px 12px',
                borderRadius:  '20px',
                border:        '1px solid rgba(226,195,107,0.28)',
                background:    'rgba(226,195,107,0.07)',
                color:         'rgba(226,195,107,0.85)',
                fontSize:      '11px',
                fontWeight:    600,
                textDecoration: 'none',
                letterSpacing: '0.02em',
                whiteSpace:    'nowrap' as const,
                transition:    'background 0.15s, border-color 0.15s',
              }}
            >
              {service.label}
              <span style={{ fontSize: '9px', opacity: 0.6 }}>?</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
