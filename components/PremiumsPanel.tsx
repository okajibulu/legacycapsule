'use client'

// FILE: components/PremiumsPanel.tsx
// PURPOSE: Bottom sheet panel for the Premiums tab in CapsuleBottomNav.
//          Shows all guest-facing premium services. Active ones are functional,
//          inactive ones are greyed with hover/tap tooltip.
//          Gifting (EOH) opens WaysToHonourSection inline.
//          All other active services navigate to their own page.
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
//   -- z-index raised to 60/61 (above submission panel at 50)

// ============================================================
// SECTION 1 -- Imports & types
// ============================================================

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import WaysToHonourSection from '@/components/WaysToHonourSection'

interface SupportAccount {
  id:                       string
  method_label:             string | null
  account_holder:           string | null
  bank_name:                string | null
  account_number:           string | null
  reference_guide:          string | null
  currency:                 string | null
  is_active:                boolean
  sort_order:               number
  relationship_to_honouree: string | null
}

 interface Props {
  slug:            string
  components:      string[]
  capsuleId:       string
  honourName:      string
  eventType:       string
  supportAccounts: SupportAccount[]
  onClose:         () => void
  phases?:         { id: string; name: string }[]
}

// ============================================================
// SECTION 2 -- Service definitions
// ============================================================

interface ServiceDef {
  key:     string
  label:   string
  icon:    string
  tooltip: string
  action:  'gifting' | 'navigate'
  href?:   (slug: string) => string
}

const PREMIUM_SERVICES: ServiceDef[] = [
  {
    key:     'ways_to_honour',
    label:   'Gifting',
    icon:    'checkmark',
    tooltip: 'Shared payment details so guests can express their honour',
    action:  'gifting',
  },
  {
    key:     'attire',
    label:   'Event Attire',
    icon:    'diamond',
    tooltip: 'Dress code, fabric and colour coordination for guests',
    action:  'navigate',
    href:    (s: string) => `/for/${s}/attire`,
  },
  {
    key:     'dday_capture',
    label:   'D-Day Captures',
    icon:    'circle',
    tooltip: 'Photo upload portal open on the event day',
    action:  'navigate',
    href:    (s: string) => `/for/${s}/dday`,
  },
  {
    key:     'live_wall',
    label:   'Live Wall',
    icon:    'square',
    tooltip: 'Fullscreen live tribute display for the venue',
    action:  'navigate',
    href:    (s: string) => `/for/${s}/display`,
  },
]

// ============================================================
// SECTION 3 -- Design tokens
// ============================================================

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.08)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const eohTheme = {
  accentPrimary: gold,
  accentMuted:   goldMuted,
  accentFaint:   goldFaint,
  cardBg:        'rgba(255,255,255,0.04)',
  cardBorder:    'rgba(226,195,107,0.14)',
  textHeading:   textPrimary,
  textBody:      'rgba(255,255,255,0.72)',
  textMuted:     'rgba(255,255,255,0.45)',
  textFaint:     textFaint,
  inputBg:       'rgba(255,255,255,0.08)',
  inputBorder:   'rgba(226,195,107,0.2)',
}

const browserSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================
// SECTION 4 -- ServiceButton sub-component
// ============================================================

function ServiceButton({ service, isActive, slug, onGifting }: {
  service:   ServiceDef
  isActive:  boolean
  slug:      string
  onGifting: () => void
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (!isActive) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setTooltipVisible(true); setTimeout(() => setTooltipVisible(false), 2200) }}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 600,
            cursor: 'default', textAlign: 'left' as const, opacity: 0.5,
          }}
        >
          <span style={{ width: '20px', textAlign: 'center' as const, fontSize: '14px', opacity: 0.4 }}>--</span>
          {service.label}
        </button>
        {tooltipVisible && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)', width: '240px',
            padding: '8px 12px', borderRadius: '10px',
            background: 'rgba(20,12,40,0.96)', border: '1px solid rgba(226,195,107,0.2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10, pointerEvents: 'none' as const,
          }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, textAlign: 'center' as const }}>
              {service.tooltip}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: goldMuted, fontWeight: 700, textAlign: 'center' as const, letterSpacing: '0.06em' }}>
              Not activated for this event
            </p>
          </div>
        )}
      </div>
    )
  }

  if (service.action === 'gifting') {
    return (
      <button
        onClick={onGifting}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', borderRadius: '12px',
          border: '1px solid rgba(226,195,107,0.25)', background: goldFaint,
          color: textPrimary, fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.15s',
        }}
      >
        <span style={{ width: '20px', textAlign: 'center' as const, color: gold, fontSize: '16px' }}>+</span>
        <span style={{ flex: 1 }}>{service.label}</span>
        <span style={{ fontSize: '11px', color: goldMuted }}>{'>'}</span>
      </button>
    )
  }

  return (
    <a
      href={service.href!(slug)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: '12px',
        border: '1px solid rgba(226,195,107,0.25)', background: goldFaint,
        color: textPrimary, fontSize: '14px', fontWeight: 600,
        cursor: 'pointer', textDecoration: 'none', transition: 'background 0.15s',
      }}
    >
      <span style={{ width: '20px', textAlign: 'center' as const, color: gold, fontSize: '16px' }}>*</span>
      <span style={{ flex: 1 }}>{service.label}</span>
      <span style={{ fontSize: '11px', color: goldMuted }}>{'>'}</span>
    </a>
  )
}

// ============================================================
// SECTION 5 -- Main panel component
// ============================================================

export default function PremiumsPanel({
  slug, components, capsuleId, honourName, eventType, supportAccounts, onClose, phases,
}: Props) {
  const [showGifting, setShowGifting] = useState(false)

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(8,2,20,0.7)', backdropFilter: 'blur(4px)',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        background: 'linear-gradient(160deg, #1a0845 0%, #120630 100%)',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(226,195,107,0.2)',
        padding: '0 0 max(24px, env(safe-area-inset-bottom))',
        maxHeight: '82vh', overflowY: 'auto' as const,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(226,195,107,0.2)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: goldMuted }}>
              Premium Services
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: textFaint, lineHeight: 1.4 }}>
              Available for this event
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '18px', cursor: 'pointer', padding: '4px 8px' }}>
            x
          </button>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.15), transparent)', margin: '0 20px 16px' }} />

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          {PREMIUM_SERVICES.map(service => (
            <ServiceButton
              key={service.key}
              service={service}
              isActive={(components ?? []).includes(service.key)}
              slug={slug}
              onGifting={() => setShowGifting(true)}
            />
          ))}
        </div>

        {showGifting && (components ?? []).includes('ways_to_honour') && (
          <div style={{ margin: '16px 16px 0', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(226,195,107,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: goldMuted }}>
                Gift of Honour
              </p>
              <button onClick={() => setShowGifting(false)} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '14px', cursor: 'pointer', padding: '2px 4px' }}>
                x
              </button>
            </div>
            <WaysToHonourSection
              accounts={supportAccounts}
              capsuleId={capsuleId}
              honourName={honourName}
              eventType={eventType}
              supabase={browserSupabase}
              t={eohTheme}
              isRepView={false}
            />
          </div>
        )}

{/* ── Event Moments ── */}
        {phases && phases.length > 0 && (
          <div style={{ margin: '8px 16px 0' }}>
            <div style={{
              padding:      '14px 16px',
              borderRadius: '12px',
              border:       '1px solid rgba(226,195,107,0.25)',
              background:   goldFaint,
            }}>
              <p style={{
                margin:        '0 0 10px',
                fontSize:      '10px',
                fontWeight:    800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                color:         goldMuted,
              }}>
                Event Moments
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>

{(phases ?? []).map((phase: { id: string; name: string }) => (
                  <a
                    key={phase.id}
                    href={`/for/${slug}/story/${phase.id}`}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      padding:        '10px 12px',
                      borderRadius:   '10px',
                      border:         '1px solid rgba(226,195,107,0.15)',
                      background:     'rgba(255,255,255,0.03)',
                      color:          textPrimary,
                      fontSize:       '13px',
                      fontWeight:     600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>📸 {phase.name}</span>
                    <span style={{ fontSize: '11px', color: goldMuted }}>›</span>
                  </a>
                ))}
             
              </div>
            </div>
          </div>
        )}

        <p style={{ margin: '16px 20px 0', fontSize: '10px', color: 'rgba(255,255,255,0.15)', textAlign: 'center' as const, lineHeight: 1.6 }}>
          Premium services are configured by the event organiser
        </p>
      </div>
    </>
  )
}
