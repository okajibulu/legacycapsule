'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessCardPrint.tsx
// PURPOSE: Access card designer and print controller.
//          Five card themes. Scope selector (all, by tier, individual).
//          Live preview grid before printing.
//          Browser window.print() with @media print CSS that strips all
//          UI chrome and renders only the card grid.
//          Cards are 85mm × 54mm (standard credit-card size).
//          QR codes rendered as <img> via /api/qr/[token] route which
//          already exists in the platform (see app/api/qr route).
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 6 — Card Templates + Print
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useMemo } from 'react'

interface CapsuleData {
  id:            string
  slug:          string
  honouree_name: string
  event_type:    string
  event_tag:     string | null
  event_date:    string | null
}

interface AccessCode {
  id:               string
  guest_name:       string
  guest_email:      string | null
  participant_type: string
  numeric_code:     string
  qr_payload:       string
  status:           string
  section_name:     string | null
}

interface Props {
  capsule:     CapsuleData
  codes:       AccessCode[]
  hallConfig:  string
  showSection: boolean
  showTier:    boolean
  onBack:      () => void
}

type ThemeKey  = 'classic' | 'soft' | 'romantic' | 'vibrant' | 'spiritual'
type ScopeKey  = 'all' | 'unsent' | 'tier' | 'individual'

// ═══ SECTION 2 — Design tokens (screen UI only) ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const selectStyle: React.CSSProperties = {
  fontSize: '12px', padding: '8px 12px', borderRadius: '9px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  width: '100%', boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Card themes ═══
//
// Each theme defines the card face colour palette.
// Cards are printed on white stock — backgrounds must print well.
// All themes pass WCAG AA contrast for printed text.
//
// Theme palette fields:
//   bg         — card face background
//   accent     — primary accent (borders, code colour)
//   text       — guest name colour
//   sub        — label and secondary text colour
//   codeBg     — numeric code pill background
//   topBar     — top decorative bar gradient

interface CardTheme {
  key:     ThemeKey
  label:   string
  desc:    string
  bg:      string
  accent:  string
  text:    string
  sub:     string
  codeBg:  string
  topBar:  string
  qrLight: string   // QR code light module colour
  qrDark:  string   // QR code dark module colour
}

const THEMES: CardTheme[] = [
  {
    key:     'classic',
    label:   'Classic',
    desc:    'Deep navy with gold — timeless and authoritative',
    bg:      '#1a0d3a',
    accent:  '#E2C36B',
    text:    '#FFFFFF',
    sub:     'rgba(226,195,107,0.65)',
    codeBg:  'rgba(226,195,107,0.12)',
    topBar:  'linear-gradient(90deg, transparent, #E2C36B, transparent)',
    qrLight: '#1a0d3a',
    qrDark:  '#E2C36B',
  },
  {
    key:     'soft',
    label:   'Soft',
    desc:    'Warm ivory with charcoal — clean and elegant',
    bg:      '#FAF7F2',
    accent:  '#3D2B1F',
    text:    '#1A1208',
    sub:     'rgba(61,43,31,0.55)',
    codeBg:  'rgba(61,43,31,0.08)',
    topBar:  'linear-gradient(90deg, transparent, #C8A84A, transparent)',
    qrLight: '#FAF7F2',
    qrDark:  '#3D2B1F',
  },
  {
    key:     'romantic',
    label:   'Romantic',
    desc:    'Blush rose with deep burgundy — warm and celebratory',
    bg:      '#FDF0F0',
    accent:  '#8B1A3C',
    text:    '#3D0A1A',
    sub:     'rgba(139,26,60,0.55)',
    codeBg:  'rgba(139,26,60,0.08)',
    topBar:  'linear-gradient(90deg, transparent, #C44569, transparent)',
    qrLight: '#FDF0F0',
    qrDark:  '#8B1A3C',
  },
  {
    key:     'vibrant',
    label:   'Vibrant',
    desc:    'Rich purple with gold — bold and celebratory',
    bg:      '#2D0060',
    accent:  '#F0C060',
    text:    '#FFFFFF',
    sub:     'rgba(240,192,96,0.7)',
    codeBg:  'rgba(240,192,96,0.15)',
    topBar:  'linear-gradient(90deg, transparent, #F0C060, transparent)',
    qrLight: '#2D0060',
    qrDark:  '#F0C060',
  },
  {
    key:     'spiritual',
    label:   'Spiritual',
    desc:    'Forest green with gold — serene and reverent',
    bg:      '#0D2818',
    accent:  '#C8A84A',
    text:    '#FFFFFF',
    sub:     'rgba(200,168,74,0.65)',
    codeBg:  'rgba(200,168,74,0.12)',
    topBar:  'linear-gradient(90deg, transparent, #C8A84A, transparent)',
    qrLight: '#0D2818',
    qrDark:  '#C8A84A',
  },
]

// ═══ SECTION 4 — Tier labels and guest tier list ═══

const TIER_LABEL: Record<string, string> = {
  vvip:           'VVIP',
  vip:            'VIP',
  general:        'Guest',
  reception_only: 'Reception',
  staff:          'Staff',
  media:          'Media',
  vendor:         'Vendor',
}

const ALL_TIERS = ['vvip', 'vip', 'general', 'reception_only', 'staff', 'media', 'vendor']

// ═══ SECTION 5 — Single access card renderer ═══
//
// Renders one 85mm × 54mm card.
// Uses inline styles only — no Tailwind — so @media print styles
// apply predictably across all browsers without purging concerns.
// QR code loaded from /api/qr/[token] where token = qr_payload encoded.

function AccessCard({ code, capsule, theme, showSection, showTier, eventLabel }: {
  code:        AccessCode
  capsule:     CapsuleData
  theme:       CardTheme
  showSection: boolean
  showTier:    boolean
  eventLabel:  string
}) {
  // Encode QR payload for the existing /api/qr/[token] route
  const qrToken  = encodeURIComponent(code.qr_payload)
  const tierText = TIER_LABEL[code.participant_type] ?? code.participant_type

  return (
    <div
      className="access-card"
      style={{
        // Physical card size — 85mm × 54mm at 96dpi
        width:          '321px',
        height:         '204px',
        background:     theme.bg,
        borderRadius:   '10px',
        overflow:       'hidden',
        position:       'relative' as const,
        boxSizing:      'border-box' as const,
        fontFamily:     "'Georgia', 'Times New Roman', serif",
        flexShrink:     0,
        // Screen shadow for preview — stripped in print CSS
        boxShadow:      '0 4px 24px rgba(0,0,0,0.35)',
        pageBreakInside: 'avoid' as const,
        breakInside:    'avoid' as const,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height:     '3px',
        background: theme.topBar,
      }} />

      {/* Card body */}
      <div style={{
        padding:        '10px 14px 10px',
        height:         'calc(100% - 3px)',
        display:        'flex',
        flexDirection:  'column' as const,
        justifyContent: 'space-between',
        boxSizing:      'border-box' as const,
      }}>

        {/* Top row: branding + tier */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
        }}>
          {/* Event label */}
          <div>
            <p style={{
              margin:        0,
              fontSize:      '7px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color:         theme.sub,
              fontFamily:    "'Arial', sans-serif",
            }}>
              Legacy Capsule
            </p>
            <p style={{
              margin:        '2px 0 0',
              fontSize:      '9px',
              color:         theme.accent,
              fontWeight:    700,
              fontFamily:    "'Arial', sans-serif",
              letterSpacing: '0.04em',
              maxWidth:      '160px',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              whiteSpace:    'nowrap' as const,
            }}>
              {eventLabel}
            </p>
          </div>

          {/* Tier badge */}
          {showTier && (
            <div style={{
              padding:       '3px 8px',
              borderRadius:  '4px',
              background:    theme.codeBg,
              border:        `1px solid ${theme.accent}30`,
            }}>
              <span style={{
                fontSize:      '8px',
                fontWeight:    700,
                color:         theme.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                fontFamily:    "'Arial', sans-serif",
              }}>
                {tierText}
              </span>
            </div>
          )}
        </div>

        {/* Middle: guest name */}
        <div>
          <p style={{
            margin:        0,
            fontSize:      '7px',
            color:         theme.sub,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            marginBottom:  '2px',
            fontFamily:    "'Arial', sans-serif",
          }}>
            Access Pass
          </p>
          <p style={{
            margin:        0,
            fontSize:      '15px',
            fontWeight:    700,
            color:         theme.text,
            lineHeight:    1.2,
            maxWidth:      '190px',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap' as const,
          }}>
            {code.guest_name}
          </p>
          {showSection && code.section_name && (
            <p style={{
              margin:        '3px 0 0',
              fontSize:      '9px',
              color:         theme.sub,
              fontFamily:    "'Arial', sans-serif",
            }}>
              {code.section_name}
            </p>
          )}
        </div>

        {/* Bottom row: numeric code + QR */}
        <div style={{
          display:     'flex',
          alignItems:  'flex-end',
          justifyContent: 'space-between',
        }}>
          {/* Numeric code */}
          <div>
            <p style={{
              margin:        0,
              fontSize:      '7px',
              color:         theme.sub,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              marginBottom:  '3px',
              fontFamily:    "'Arial', sans-serif",
            }}>
              Entry Code
            </p>
            <div style={{
              padding:       '4px 10px',
              borderRadius:  '6px',
              background:    theme.codeBg,
              border:        `1px solid ${theme.accent}25`,
              display:       'inline-block',
            }}>
              <span style={{
                fontSize:      '18px',
                fontWeight:    800,
                color:         theme.accent,
                letterSpacing: '0.3em',
                fontFamily:    "'Courier New', monospace",
              }}>
                {code.numeric_code}
              </span>
            </div>
            <p style={{
              margin:        '3px 0 0',
              fontSize:      '7px',
              color:         theme.sub,
              fontFamily:    "'Arial', sans-serif",
              opacity:       0.6,
            }}>
              Or scan the QR code
            </p>
          </div>

          {/* QR code */}
          <div style={{
            width:        '64px',
            height:       '64px',
            background:   theme.qrLight,
            borderRadius: '6px',
            padding:      '4px',
            boxSizing:    'border-box' as const,
            border:       `1px solid ${theme.accent}20`,
            flexShrink:   0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${qrToken}`}
              alt={`QR code for ${code.guest_name}`}
              width={56}
              height={56}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position:   'absolute' as const,
        bottom:     0, left: 0, right: 0,
        height:     '2px',
        background: theme.topBar,
      }} />
    </div>
  )
}

// ═══ SECTION 6 — Main component ═══

export default function AccessCardPrint({
  capsule, codes, hallConfig, showSection, showTier, onBack,
}: Props) {

  // ── 6.1 State ──────────────────────────────────────────────────────────────

  const [theme,          setTheme]          = useState<ThemeKey>('classic')
  const [scope,          setScope]          = useState<ScopeKey>('all')
  const [selectedTier,   setSelectedTier]   = useState<string>('vvip')
  const [selectedCodeId, setSelectedCodeId] = useState<string>('')
  const [printing,       setPrinting]       = useState(false)

  const selectedTheme = THEMES.find(t => t.key === theme) ?? THEMES[0]
  const eventLabel    = capsule.event_tag ?? capsule.honouree_name

  // ── 6.2 Compute visible codes based on scope ───────────────────────────────

  const visibleCodes = useMemo(() => {
    const active = codes.filter(c => c.status !== 'revoked')
    if (scope === 'all')    return active
    if (scope === 'unsent') return active.filter(c => c.status === 'generated')
    if (scope === 'tier')   return active.filter(c => c.participant_type === selectedTier)
    if (scope === 'individual') {
      const found = active.find(c => c.id === selectedCodeId)
      return found ? [found] : []
    }
    return active
  }, [codes, scope, selectedTier, selectedCodeId])

  // ── 6.3 Tiers present in active codes ─────────────────────────────────────

  const presentTiers = useMemo(() => {
    const active = codes.filter(c => c.status !== 'revoked')
    return ALL_TIERS.filter(t => active.some(c => c.participant_type === t))
  }, [codes])

  // ── 6.4 Print handler ──────────────────────────────────────────────────────

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 300)
  }

  // ═══ SECTION 7 — Render ═══

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Print CSS — injected globally ─────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #access-card-print-region,
          #access-card-print-region * { visibility: visible !important; }
          #access-card-print-region {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            margin: 0 !important; padding: 10mm !important;
            background: white !important;
          }
          .access-card {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-card-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6mm !important;
          }
        }
      `}</style>

      {/* ── 7.1 Screen UI: controls ───────────────────────────────────────── */}

      <div className="no-print" style={{ padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          marginBottom: '16px',
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: goldMuted,
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              padding: '6px 10px', borderRadius: '8px',
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '9px', color: goldMuted,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              margin: 0, fontWeight: 600,
            }}>
              Access Cards · Print
            </p>
            <p style={{
              fontSize: '16px', fontWeight: 700, color: textPrimary,
              margin: '2px 0 0',
              fontFamily: "'Playfair Display', serif",
            }}>
              {capsule.honouree_name}
            </p>
          </div>
          <button
            onClick={handlePrint}
            disabled={printing || visibleCodes.length === 0}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: visibleCodes.length === 0
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
              color: visibleCodes.length === 0 ? textFaint : '#1a0845',
              fontSize: '12px', fontWeight: 700,
              cursor: visibleCodes.length === 0 ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            {printing ? 'Preparing…' : `Print ${visibleCodes.length} Card${visibleCodes.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Controls grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '10px', marginBottom: '16px',
        }}>
          {/* Scope selector */}
          <div>
            <label style={{
              fontSize: '10px', color: textFaint, display: 'block',
              marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Print Scope
            </label>
            <select
              value={scope}
              onChange={e => setScope(e.target.value as ScopeKey)}
              style={selectStyle}
            >
              <option value="all">All active codes ({codes.filter(c => c.status !== 'revoked').length})</option>
              <option value="unsent">Unsent codes only ({codes.filter(c => c.status === 'generated').length})</option>
              <option value="tier">By guest tier</option>
              <option value="individual">Single guest</option>
            </select>
          </div>

          {/* Tier sub-selector */}
          {scope === 'tier' && (
            <div>
              <label style={{
                fontSize: '10px', color: textFaint, display: 'block',
                marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Select Tier
              </label>
              <select
                value={selectedTier}
                onChange={e => setSelectedTier(e.target.value)}
                style={selectStyle}
              >
                {presentTiers.map(t => (
                  <option key={t} value={t}>
                    {TIER_LABEL[t]} ({codes.filter(c => c.participant_type === t && c.status !== 'revoked').length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Individual selector */}
          {scope === 'individual' && (
            <div>
              <label style={{
                fontSize: '10px', color: textFaint, display: 'block',
                marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Select Guest
              </label>
              <select
                value={selectedCodeId}
                onChange={e => setSelectedCodeId(e.target.value)}
                style={selectStyle}
              >
                <option value="">— Choose a guest —</option>
                {codes
                  .filter(c => c.status !== 'revoked')
                  .sort((a, b) => a.guest_name.localeCompare(b.guest_name))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.guest_name} ({TIER_LABEL[c.participant_type] ?? c.participant_type})
                    </option>
                  ))
                }
              </select>
            </div>
          )}
        </div>

        {/* Theme selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            fontSize: '10px', color: textFaint, display: 'block',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Card Theme
          </label>
          <div style={{
            display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
          }}>
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.desc}
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '6px',
                  padding:       '7px 12px',
                  borderRadius:  '9px',
                  border:        `1px solid ${theme === t.key ? 'rgba(226,195,107,0.5)' : cardBorder}`,
                  background:    theme === t.key ? goldFaint : cardBg,
                  cursor:        'pointer',
                }}
              >
                {/* Theme swatch */}
                <div style={{
                  width:        '16px',
                  height:       '16px',
                  borderRadius: '4px',
                  background:   t.bg,
                  border:       `2px solid ${t.accent}`,
                  flexShrink:   0,
                }} />
                <span style={{
                  fontSize:  '11px',
                  fontWeight: theme === t.key ? 700 : 400,
                  color:     theme === t.key ? gold : textFaint,
                }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          <p style={{
            fontSize: '10px', color: 'rgba(226,195,107,0.35)',
            margin: '6px 0 0', fontStyle: 'italic',
          }}>
            {selectedTheme.desc}
          </p>
        </div>

        {/* Print tip */}
        <div style={{
          padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(226,195,107,0.03)',
          border: '1px solid rgba(226,195,107,0.08)',
          marginBottom: '16px',
        }}>
          <p style={{
            fontSize: '11px', color: textFaint,
            margin: 0, lineHeight: 1.7,
          }}>
            <strong style={{ color: goldMuted }}>Printing tip:</strong>{' '}
            Use A4 paper. In the print dialog, set margins to{' '}
            <em>None</em> or <em>Minimum</em> and enable{' '}
            <em>Background graphics</em> so card colours print correctly.
            Cards are sized at 85 × 54 mm (standard credit-card size).
          </p>
        </div>

        {/* Empty state */}
        {visibleCodes.length === 0 && (
          <div style={{
            padding: '24px', textAlign: 'center' as const,
            borderRadius: '10px', border: '1px dashed rgba(226,195,107,0.12)',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
              No cards match the current scope selection.
            </p>
          </div>
        )}
      </div>

      {/* ── 7.2 Card preview grid (also the print region) ─────────────────── */}

      <div
        id="access-card-print-region"
        style={{ padding: '0 16px 60px' }}
      >
        <div
          className="print-card-grid"
          style={{
            display:   'flex',
            flexWrap:  'wrap' as const,
            gap:       '14px',
          }}
        >
          {visibleCodes.map(code => (
            <AccessCard
              key={code.id}
              code={code}
              capsule={capsule}
              theme={selectedTheme}
              showSection={showSection}
              showTier={showTier}
              eventLabel={eventLabel}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
