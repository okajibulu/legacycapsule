'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessCardPrint.tsx
// PURPOSE: Access card designer and print controller.
//          Implements ETH-AC-001 v1.1 AMD-001:
//            · QR code is PRIMARY entry credential — centred, large (40mm+)
//            · Serial number is administrative reference — corner, small (S/N: XXXX)
//            · Numeric code NOT shown on card face (internal only)
//            · Custom background image upload with dark overlay
//            · Custom logo upload (top position)
//            · 5 card themes
//            · Scope selector (all, unsent, by tier, individual)
//            · Printable guest arrival list (A4, 2 columns, paper backup)
//          Cards are 85mm × 54mm (standard credit-card size).
//          QR codes rendered via /api/qr/[token] route.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System (ETH-AC-001)
// BUILT BY: AI14 · Claude Opus 4.6 · 29 July 2026
// VERSION: v2.11.0
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useMemo, useRef, useCallback } from 'react'

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
  serial_number?:   number | null
}

interface Props {
  capsule:     CapsuleData
  codes:       AccessCode[]
  hallConfig:  string
  showSection: boolean
  showTier:    boolean
  onBack:      () => void
}

type ThemeKey = 'classic' | 'soft' | 'romantic' | 'vibrant' | 'spiritual'
type ScopeKey = 'all' | 'unsent' | 'tier' | 'individual'

// ═══ SECTION 2 — Design tokens (screen UI only) ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'
const warnColor   = 'rgba(251,191,36,0.85)'

const selectStyle: React.CSSProperties = {
  fontSize: '12px', padding: '8px 12px', borderRadius: '9px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  width: '100%', boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Card themes ═══

interface CardTheme {
  key:    ThemeKey
  label:  string
  desc:   string
  bg:     string
  accent: string
  text:   string
  sub:    string
  topBar: string
  qrBg:  string   // QR code panel background — ensures scannability
}

const THEMES: CardTheme[] = [
  {
    key:    'classic',
    label:  'Classic',
    desc:   'Deep navy with gold — timeless and authoritative',
    bg:     '#1a0d3a',
    accent: '#E2C36B',
    text:   '#FFFFFF',
    sub:    'rgba(226,195,107,0.65)',
    topBar: 'linear-gradient(90deg, transparent, #E2C36B, transparent)',
    qrBg:  'rgba(255,255,255,0.95)',
  },
  {
    key:    'soft',
    label:  'Soft',
    desc:   'Warm ivory with charcoal — clean and elegant',
    bg:     '#FAF7F2',
    accent: '#3D2B1F',
    text:   '#1A1208',
    sub:    'rgba(61,43,31,0.55)',
    topBar: 'linear-gradient(90deg, transparent, #C8A84A, transparent)',
    qrBg:  '#FFFFFF',
  },
  {
    key:    'romantic',
    label:  'Romantic',
    desc:   'Blush rose with burgundy — warm and celebratory',
    bg:     '#FDF0F0',
    accent: '#8B1A3C',
    text:   '#3D0A1A',
    sub:    'rgba(139,26,60,0.55)',
    topBar: 'linear-gradient(90deg, transparent, #C44569, transparent)',
    qrBg:  '#FFFFFF',
  },
  {
    key:    'vibrant',
    label:  'Vibrant',
    desc:   'Rich purple with gold — bold and celebratory',
    bg:     '#2D0060',
    accent: '#F0C060',
    text:   '#FFFFFF',
    sub:    'rgba(240,192,96,0.7)',
    topBar: 'linear-gradient(90deg, transparent, #F0C060, transparent)',
    qrBg:  'rgba(255,255,255,0.95)',
  },
  {
    key:    'spiritual',
    label:  'Spiritual',
    desc:   'Forest green with gold — serene and reverent',
    bg:     '#0D2818',
    accent: '#C8A84A',
    text:   '#FFFFFF',
    sub:    'rgba(200,168,74,0.65)',
    topBar: 'linear-gradient(90deg, transparent, #C8A84A, transparent)',
    qrBg:  'rgba(255,255,255,0.95)',
  },
]

// ═══ SECTION 4 — Tier labels ═══

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

// ═══ SECTION 5 — AccessCard sub-component ═══
//
// Per ETH-AC-001 AMD-001 R2:
//   · QR code is the PRIMARY entry credential — centred, large
//   · Serial number is administrative reference — bottom-right corner, small
//   · Numeric code NOT printed on card face
//
// Card layout (85mm × 54mm):
//   Top:    Branding (event name left, tier badge right)
//   Middle: Guest name + section
//   Bottom: QR code (large, centred) | S/N corner (bottom-right, small)

function AccessCard({ code, capsule, theme, showSection, showTier, eventLabel, customBg, customLogo }: {
  code:        AccessCode
  capsule:     CapsuleData
  theme:       CardTheme
  showSection: boolean
  showTier:    boolean
  eventLabel:  string
  customBg:    string | null
  customLogo:  string | null
}) {
  const qrToken  = encodeURIComponent(code.qr_payload)
  const tierText = TIER_LABEL[code.participant_type] ?? code.participant_type
  const serialDisplay = code.serial_number
    ? `S/N: ${String(code.serial_number).padStart(4, '0')}`
    : null

  return (
    <div
      className="access-card"
      style={{
        width:           '321px',
        height:          '204px',
        background:      customBg ? 'transparent' : theme.bg,
        backgroundImage: customBg ? `url(${customBg})` : 'none',
        backgroundSize:  'cover',
        backgroundPosition: 'center',
        borderRadius:    '10px',
        overflow:        'hidden',
        position:        'relative' as const,
        boxSizing:       'border-box' as const,
        fontFamily:      "'Georgia', 'Times New Roman', serif",
        flexShrink:      0,
        boxShadow:       '0 4px 24px rgba(0,0,0,0.35)',
        pageBreakInside: 'avoid' as const,
        breakInside:     'avoid' as const,
      }}
    >
      {/* Custom background dark overlay — ensures text readability */}
      {customBg && (
        <div style={{
          position: 'absolute' as const, inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 0,
        }} />
      )}

      {/* Top accent bar */}
      <div style={{
        height:   '3px',
        background: theme.topBar,
        position: 'relative' as const, zIndex: 1,
      }} />

      {/* Card body */}
      <div style={{
        padding:        '8px 12px 8px',
        height:         'calc(100% - 3px)',
        display:        'flex',
        flexDirection:  'column' as const,
        justifyContent: 'space-between',
        boxSizing:      'border-box' as const,
        position:       'relative' as const,
        zIndex:         1,
      }}>

        {/* ── Top row: logo/branding + tier ── */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Custom logo */}
            {customLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customLogo}
                alt="Event logo"
                style={{
                  height: '18px', width: 'auto',
                  maxWidth: '40px', objectFit: 'contain' as const,
                }}
              />
            )}
            <div>
              <p style={{
                margin:        0,
                fontSize:      '6px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color:         customBg ? 'rgba(255,255,255,0.6)' : theme.sub,
                fontFamily:    "'Arial', sans-serif",
              }}>
                {customLogo ? '' : 'Legacy Capsule'}
              </p>
              <p style={{
                margin:        customLogo ? 0 : '2px 0 0',
                fontSize:      '8px',
                color:         customBg ? '#FFFFFF' : theme.accent,
                fontWeight:    700,
                fontFamily:    "'Arial', sans-serif",
                letterSpacing: '0.04em',
                maxWidth:      '140px',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap' as const,
              }}>
                {eventLabel}
              </p>
            </div>
          </div>

          {/* Tier badge */}
          {showTier && (
            <div style={{
              padding:      '2px 7px',
              borderRadius: '4px',
              background:   customBg ? 'rgba(0,0,0,0.4)' : `${theme.accent}18`,
              border:       `1px solid ${customBg ? 'rgba(255,255,255,0.3)' : `${theme.accent}30`}`,
            }}>
              <span style={{
                fontSize:      '7px',
                fontWeight:    700,
                color:         customBg ? '#FFFFFF' : theme.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                fontFamily:    "'Arial', sans-serif",
              }}>
                {tierText}
              </span>
            </div>
          )}
        </div>

        {/* ── Middle: guest name + section ── */}
        <div>
          <p style={{
            margin:        0,
            fontSize:      '6px',
            color:         customBg ? 'rgba(255,255,255,0.6)' : theme.sub,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            marginBottom:  '2px',
            fontFamily:    "'Arial', sans-serif",
          }}>
            Access Pass
          </p>
          <p style={{
            margin:      0,
            fontSize:    '14px',
            fontWeight:  700,
            color:       customBg ? '#FFFFFF' : theme.text,
            lineHeight:  1.2,
            maxWidth:    '200px',
            overflow:    'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:  'nowrap' as const,
          }}>
            {code.guest_name}
          </p>
          {showSection && code.section_name && (
            <p style={{
              margin:     '2px 0 0',
              fontSize:   '8px',
              color:      customBg ? 'rgba(255,255,255,0.65)' : theme.sub,
              fontFamily: "'Arial', sans-serif",
            }}>
              {code.section_name}
            </p>
          )}
        </div>

        {/* ── Bottom: QR code centred (primary) + S/N corner ── */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'center',
          position:       'relative' as const,
        }}>
          {/* QR code — primary entry credential, centred, large */}
          <div style={{
            width:        '78px',
            height:       '78px',
            background:   theme.qrBg,
            borderRadius: '6px',
            padding:      '4px',
            boxSizing:    'border-box' as const,
            border:       `1px solid ${customBg ? 'rgba(255,255,255,0.3)' : `${theme.accent}20`}`,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${qrToken}`}
              alt={`QR code for ${code.guest_name}`}
              width={70}
              height={70}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>

          {/* S/N — administrative reference, bottom-right corner, small */}
          {serialDisplay && (
            <p style={{
              position:   'absolute' as const,
              bottom:     0,
              right:      0,
              margin:     0,
              fontSize:   '6px',
              color:      customBg ? 'rgba(255,255,255,0.4)' : `${theme.sub}`,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.05em',
              opacity:    0.7,
            }}>
              {serialDisplay}
            </p>
          )}
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position:   'absolute' as const,
        bottom:     0, left: 0, right: 0,
        height:     '2px',
        background: theme.topBar,
        zIndex:     1,
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
  const [customBgUrl,    setCustomBgUrl]    = useState<string | null>(null)
  const [customLogoUrl,  setCustomLogoUrl]  = useState<string | null>(null)
  const [bgWarning,      setBgWarning]      = useState('')
  const [logoWarning,    setLogoWarning]    = useState('')

  const bgInputRef   = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const selectedTheme = THEMES.find(t => t.key === theme) ?? THEMES[0]
  const eventLabel    = capsule.event_tag ?? capsule.honouree_name

  // ── 6.2 Compute visible codes ──────────────────────────────────────────────

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

  const presentTiers = useMemo(() => {
    const active = codes.filter(c => c.status !== 'revoked')
    return ALL_TIERS.filter(t => active.some(c => c.participant_type === t))
  }, [codes])

  // ── 6.3 Custom asset upload handlers ──────────────────────────────────────

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgWarning('')

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      if (img.width < 1000 || img.height < 600) {
        setBgWarning(`Image is ${img.width}×${img.height}px — may appear pixelated when printed. Minimum 1000×600px recommended.`)
      }
      setCustomBgUrl(url)
    }
    img.src = url
    e.target.value = ''
  }, [])

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoWarning('')

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        setLogoWarning(`Logo is ${img.width}×${img.height}px — minimum 200×200px recommended for sharp print.`)
      }
      setCustomLogoUrl(url)
    }
    img.src = url
    e.target.value = ''
  }, [])

  // ── 6.4 Print handler ──────────────────────────────────────────────────────

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 300)
  }

  // ── 6.5 Guest arrival list print ──────────────────────────────────────────
  //
  // Per ETH-AC-001 AMD-001 R4: printable A4 guest list with
  // Name | S/N | Tier | Time In | ✓ columns — paper backup for usher teams.

  const handlePrintArrivalList = () => {
    const html = buildArrivalListHtml(visibleCodes, eventLabel, capsule.honouree_name)
    const win  = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  // ═══ SECTION 7 — Render ═══

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Print CSS ─────────────────────────────────────────────────────── */}
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

      {/* ── 7.1 Header ────────────────────────────────────────────────────── */}

      <div className="no-print" style={{ padding: '16px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          marginBottom: '16px',
        }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: goldMuted,
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            padding: '6px 10px', borderRadius: '8px',
          }}>←</button>
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
              margin: '2px 0 0', fontFamily: "'Playfair Display', serif",
            }}>
              {capsule.honouree_name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrintArrivalList}
              style={{
                padding: '9px 14px', borderRadius: '10px',
                border: '1px solid rgba(226,195,107,0.2)',
                background: 'rgba(226,195,107,0.04)',
                color: goldMuted, fontSize: '11px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📋 Arrival List
            </button>
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
                letterSpacing: '0.04em', flexShrink: 0,
              }}
            >
              {printing ? 'Preparing…' : `Print ${visibleCodes.length} Card${visibleCodes.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {/* ── 7.2 Controls ──────────────────────────────────────────────── */}

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '10px', marginBottom: '16px',
        }}>
          <div>
            <label style={{
              fontSize: '10px', color: textFaint, display: 'block',
              marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Print Scope
            </label>
            <select value={scope} onChange={e => setScope(e.target.value as ScopeKey)} style={selectStyle}>
              <option value="all">All active ({codes.filter(c => c.status !== 'revoked').length})</option>
              <option value="unsent">Unsent only ({codes.filter(c => c.status === 'generated').length})</option>
              <option value="tier">By guest tier</option>
              <option value="individual">Single guest</option>
            </select>
          </div>

          {scope === 'tier' && (
            <div>
              <label style={{
                fontSize: '10px', color: textFaint, display: 'block',
                marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Select Tier
              </label>
              <select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} style={selectStyle}>
                {presentTiers.map(t => (
                  <option key={t} value={t}>
                    {TIER_LABEL[t]} ({codes.filter(c => c.participant_type === t && c.status !== 'revoked').length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'individual' && (
            <div>
              <label style={{
                fontSize: '10px', color: textFaint, display: 'block',
                marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Select Guest
              </label>
              <select value={selectedCodeId} onChange={e => setSelectedCodeId(e.target.value)} style={selectStyle}>
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

        {/* ── 7.3 Theme selector ────────────────────────────────────────── */}

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '10px', color: textFaint, display: 'block',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Card Theme
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
            {THEMES.map(t => (
              <button key={t.key} onClick={() => setTheme(t.key)} title={t.desc} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 12px', borderRadius: '9px',
                border: `1px solid ${theme === t.key ? 'rgba(226,195,107,0.5)' : cardBorder}`,
                background: theme === t.key ? goldFaint : cardBg,
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px',
                  background: t.bg, border: `2px solid ${t.accent}`, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '11px',
                  fontWeight: theme === t.key ? 700 : 400,
                  color: theme === t.key ? gold : textFaint,
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

        {/* ── 7.4 Custom assets ─────────────────────────────────────────── */}

        <div style={{
          padding: '14px 16px', borderRadius: '12px',
          border: `1px solid ${cardBorder}`, background: cardBg,
          marginBottom: '16px',
        }}>
          <p style={{
            fontSize: '10px', color: goldMuted,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: '0 0 12px', fontWeight: 600,
          }}>
            Custom Branding (optional)
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
            {/* Background image */}
            <div style={{ flex: 1, minWidth: '140px' }}>
              <p style={{
                fontSize: '10px', color: textFaint,
                margin: '0 0 6px',
              }}>
                Background Image
              </p>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleBgUpload}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => bgInputRef.current?.click()}
                  style={{
                    padding: '7px 12px', borderRadius: '8px',
                    border: '1px dashed rgba(226,195,107,0.2)',
                    background: 'transparent', color: goldMuted,
                    fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  {customBgUrl ? '✓ Uploaded' : '+ Upload'}
                </button>
                {customBgUrl && (
                  <button
                    onClick={() => { setCustomBgUrl(null); setBgWarning('') }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'rgba(248,113,113,0.6)', fontSize: '12px',
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {bgWarning && (
                <p style={{
                  fontSize: '9px', color: warnColor,
                  margin: '4px 0 0', lineHeight: 1.5,
                }}>
                  ⚠ {bgWarning}
                </p>
              )}
              <p style={{ fontSize: '9px', color: textFaint, margin: '4px 0 0' }}>
                Min 1000×600px · JPEG or PNG
              </p>
            </div>

            {/* Logo */}
            <div style={{ flex: 1, minWidth: '140px' }}>
              <p style={{
                fontSize: '10px', color: textFaint,
                margin: '0 0 6px',
              }}>
                Logo
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    padding: '7px 12px', borderRadius: '8px',
                    border: '1px dashed rgba(226,195,107,0.2)',
                    background: 'transparent', color: goldMuted,
                    fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  {customLogoUrl ? '✓ Uploaded' : '+ Upload'}
                </button>
                {customLogoUrl && (
                  <button
                    onClick={() => { setCustomLogoUrl(null); setLogoWarning('') }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'rgba(248,113,113,0.6)', fontSize: '12px',
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {logoWarning && (
                <p style={{
                  fontSize: '9px', color: warnColor,
                  margin: '4px 0 0', lineHeight: 1.5,
                }}>
                  ⚠ {logoWarning}
                </p>
              )}
              <p style={{ fontSize: '9px', color: textFaint, margin: '4px 0 0' }}>
                Min 200×200px · PNG with transparency preferred
              </p>
            </div>
          </div>
        </div>

        {/* ── 7.5 Print tip ─────────────────────────────────────────────── */}

        <div style={{
          padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(226,195,107,0.03)',
          border: '1px solid rgba(226,195,107,0.08)',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: goldMuted }}>Printing tip:</strong>{' '}
            Use A4 paper. In the print dialog, set margins to <em>None</em> or{' '}
            <em>Minimum</em> and enable <em>Background graphics</em> so card colours
            and custom backgrounds print correctly.
            The QR code is the primary entry credential — ensure it prints clearly.
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

      {/* ── 7.6 Card preview grid (also print region) ─────────────────────── */}

      <div id="access-card-print-region" style={{ padding: '0 16px 60px' }}>
        <div
          className="print-card-grid"
          style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '14px' }}
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
              customBg={customBgUrl}
              customLogo={customLogoUrl}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 8 — Guest arrival list HTML builder ═══
//
// Per ETH-AC-001 AMD-001 R4: A4, 2 columns, Name | S/N | Tier | Time In | ✓
// Opens in a new tab for printing. Paper backup for technology failure.

function buildArrivalListHtml(
  codes:        AccessCode[],
  eventLabel:   string,
  honoureeName: string
): string {
  const sorted = [...codes].sort((a, b) => a.guest_name.localeCompare(b.guest_name))

  const rows = sorted.map(c => {
    const sn   = c.serial_number ? String(c.serial_number).padStart(4, '0') : '—'
    const tier = TIER_LABEL[c.participant_type] ?? c.participant_type
    return `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;font-size:11px;">${c.guest_name}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;font-size:11px;text-align:center;font-family:monospace;">${sn}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;font-size:10px;color:#666;">${tier}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;width:60px;"></td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;text-align:center;width:24px;">□</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Guest Arrival List — ${eventLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    p.sub { font-size: 11px; color: #666; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead td { font-size: 10px; font-weight: 700; padding: 6px 8px;
               background: #f5f5f5; border-bottom: 2px solid #ccc;
               text-transform: uppercase; letter-spacing: 0.06em; }
    .walk-in-label { font-size: 11px; font-weight: 700; margin: 20px 0 6px; color: #555; }
    @media print {
      body { margin: 10mm; }
      h1 { font-size: 14px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${eventLabel}</h1>
  <p class="sub">Guest Arrival List · ${honoureeName} · Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  <p class="sub no-print" style="color:#c00;font-weight:700;">
    PAPER BACKUP — Use if technology fails. Tick □ and write arrival time for each guest.
  </p>

  <table>
    <thead>
      <tr>
        <td>Guest Name</td>
        <td style="text-align:center;">S/N</td>
        <td>Tier</td>
        <td>Time In</td>
        <td style="text-align:center;">✓</td>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="walk-in-label">Walk-In Arrivals (not pre-registered)</div>
  <table>
    <thead>
      <tr>
        <td>Name</td>
        <td>Tier</td>
        <td>Time In</td>
        <td>Admitted By</td>
        <td style="text-align:center;">✓</td>
      </tr>
    </thead>
    <tbody>
      ${Array.from({ length: 10 }).map(() => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;height:24px;"></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;"></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;"></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;"></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:center;">□</td>
        </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`
}
