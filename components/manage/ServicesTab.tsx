/**
 * ============================================================
 * FILE PATH: components/manage/ServicesTab.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 * Updated: Claude Sonnet 4.6 · July 2026
 *   — Two-column layout: service tabs left, price column right
 *   — Price column: checkbox + price per row, aligned to service cards
 *   — Selection and checkout live in the price column only
 *   — Add to Cart buttons removed from ServiceCard (cleaner)
 *   — Cart bar replaced by sticky price column footer
 * Updated: AI12 · Claude Opus 4.6 · 20 July 2026
 * Updated: AI15 · Claude Sonnet 4.6 · 26 July 2026
 *   — guest_management ServiceCard: externalLink wired to /manage/[slug]/guests
 *   — Inline GuestManagementSection + TableManagementSection removed
 *   — Unused imports removed (GuestManagementSection, TableManagementSection)
 *   — event_tag added to capsule interface
 *   — honoureeName and eventTag props passed to GuestManagementSection
 *   — Voice Tributes detail: corrected to 60 seconds (was 30)
 *   — Video Tributes detail: corrected to 60 seconds (was 30)
 *   — Access Card Printing coming_soon removed — ticket generation
 *     now lives inside Guest Management section (M6.6 built)
 *   — access_codes added to priceRows and as a ServiceCard
 *   — Access Codes ServiceCard renders GuestManagementSection
 *     (which contains codes, ushers, metrics)
 *
 * Sub-sections:
 *   1. Types + imports
 *   2. ServiceCard — expandable service card (no cart buttons)
 *   3. ExportsSection — inline exports
 *   3B. LiveWallSection — display URL + QR
 *   4. PriceColumn — checkbox + price aligned to service rows
 *   5. Main ServicesTab component
 * ============================================================
 */

'use client'

// ═══ SECTION 1 — Types + imports ═══

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

import EventPhasesSection from '@/components/manage/EventPhasesSection'

interface Contribution {
  id: string; contributor_name: string; city: string; country: string
  relationship: string | null; tribute_text: string; email: string | null
  status: string; created_at: string
  include_in_publication?: boolean; include_in_programme_export?: boolean
}

interface ServicesTabProps {
  capsule: {
    id: string; slug: string; honouree_name: string; event_tag: string | null
    tier: string | null; components: string[]
  }
  approvedContributions: Contribution[]
  supabase: any
onUpgrade:      () => void
  onToggleFlag?:  (id: string, field: string, current: boolean) => void
  eohEditor?: React.ReactNode
}

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'

// ═══ SECTION 2 — ServiceCard ═══

interface ServiceCardProps {
  id: string
  title: string
  description: string
  icon: string
  status: 'active' | 'locked' | 'coming_soon' | 'always_on'
  externalLink?: string
  children?: React.ReactNode
  price?: { amount: number; symbol: string } | null
  detailSummary?: string
  detailPoints?: string[]
  learnMoreUrl?: string
  onHeightChange?: (id: string, height: number) => void
}

function ServiceCard({
  id, title, description, icon, status, externalLink, children,
  price, detailSummary, detailPoints, learnMoreUrl, onHeightChange,
}: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const isInteractive = status === 'active' || status === 'always_on'
  const isLocked      = status === 'locked'
  const isExpandable  = (isInteractive && !!children && !externalLink) || (isLocked && !!detailSummary)

  useEffect(() => {
    if (!cardRef.current || !onHeightChange) return
    const observer = new ResizeObserver(() => {
      onHeightChange(id, cardRef.current?.offsetHeight ?? 0)
    })
    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [id, onHeightChange])

  return (
    <div
      ref={cardRef}
      style={{
        borderRadius: '14px',
        border: `1px solid ${isInteractive ? cardBorder : 'rgba(255,255,255,0.05)'}`,
        background: isInteractive ? cardBg : 'rgba(255,255,255,0.01)',
        marginBottom: '10px',
        overflow: 'hidden',
        opacity: status === 'coming_soon' ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* ── Card header ── */}
      <div
        onClick={() => { if (isExpandable) setExpanded(e => !e) }}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: isExpandable ? 'pointer' : 'default' }}
      >
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isInteractive ? goldFaint : 'rgba(255,255,255,0.04)', border: `1px solid ${isInteractive ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: isInteractive ? textPrimary : textFaint, margin: 0 }}>{title}</p>
          <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{description}</p>
        </div>

        <div style={{ flexShrink: 0 }}>
          {(status === 'always_on' || status === 'active') && isExpandable && (
            <span style={{ fontSize: '10px', color: goldMuted }}>{expanded ? '▲' : '▼'}</span>
          )}
          {status === 'active' && externalLink && (
            <Link href={externalLink} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: goldFaint, border: `1px solid rgba(226,195,107,0.25)`, color: gold, textDecoration: 'none' }}>Open →</Link>
          )}
          {status === 'locked' && isExpandable && (
            <span style={{ fontSize: '10px', color: textFaint }}>{expanded ? '▲' : '▼'}</span>
          )}
          {status === 'locked' && !isExpandable && (
            <span style={{ fontSize: '10px', color: textFaint }}>🔒</span>
          )}
          {status === 'coming_soon' && (
            <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', color: textFaint, letterSpacing: '0.08em' }}>Soon</span>
          )}
        </div>
      </div>

      {/* ── Expanded — active service ── */}
      {expanded && children && !isLocked && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid rgba(255,255,255,0.04)`, paddingTop: '14px' }}>
          {children}
        </div>
      )}

      {/* ── Expanded — locked service detail ── */}
      {expanded && isLocked && detailSummary && (
        <div style={{ padding: '14px 16px 16px', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, margin: '0 0 12px' }}>
            {detailSummary}
          </p>
          {detailPoints && detailPoints.length > 0 && (
            <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {detailPoints.slice(0, 4).map((point, i) => (
                <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: gold, fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: '11px', color: textFaint, lineHeight: 1.6 }}>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {learnMoreUrl && (
            <Link
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: textFaint, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
            >
              Find out more
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 3 — ExportsSection ═══

function ExportsSection({ contributions, slug, onToggleFlag }: { contributions: Contribution[]; slug: string; onToggleFlag?: (id: string, field: string, current: boolean) => void }) {
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedProg, setCopiedProg] = useState(false)

  const programmeContribs = contributions.filter(c => c.include_in_programme_export === true)

  function formatTributes(list: Contribution[]): string {
    return list.map(c => {
      const location = [c.city, c.country].filter(Boolean).join(', ')
      const rel = c.relationship ? ` · ${c.relationship}` : ''
      return ['---', c.contributor_name + (location ? `\n${location}${rel}` : rel ? `\n${rel}` : ''), '', c.tribute_text].join('\n')
    }).join('\n\n') + '\n\n---'
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(formatTributes(contributions))
    setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2500)
  }

  const handleCopyProgramme = async () => {
    if (programmeContribs.length === 0) return
    await navigator.clipboard.writeText(formatTributes(programmeContribs))
    setCopiedProg(true); setTimeout(() => setCopiedProg(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Voice curation flags ── */}
      {contributions.length > 0 && onToggleFlag && (
        <div>
          <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 600 }}>
            Curate Voices for Export
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '12px' }}>
            {contributions.map(c => (
              <div key={c.id} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{c.contributor_name}</span>
                  {c.relationship && <span style={{ fontSize: '10px', color: textFaint }}>({c.relationship})</span>}
                  <span style={{ fontSize: '10px', color: textFaint, marginLeft: 'auto', whiteSpace: 'nowrap' as const }}>{new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                </div>
                <p style={{ fontSize: '11px', color: textSecondary, lineHeight: 1.5, margin: '0 0 8px' }}>{c.tribute_text.length > 120 ? c.tribute_text.slice(0, 120) + '…' : c.tribute_text}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  <button
                    onClick={() => onToggleFlag(c.id, 'include_in_publication', (c as any).include_in_publication ?? true)}
                    style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${(c as any).include_in_publication !== false ? 'rgba(74,222,128,0.28)' : 'rgba(255,255,255,0.08)'}`, background: (c as any).include_in_publication !== false ? 'rgba(74,222,128,0.07)' : 'transparent', color: (c as any).include_in_publication !== false ? 'rgba(134,239,172,0.9)' : textFaint }}>
                    {(c as any).include_in_publication !== false ? '✓' : '✗'} Publication
                  </button>
                  <button
                    onClick={() => onToggleFlag(c.id, 'include_in_programme_export', (c as any).include_in_programme_export ?? false)}
                    style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${(c as any).include_in_programme_export ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.08)'}`, background: (c as any).include_in_programme_export ? goldFaint : 'transparent', color: (c as any).include_in_programme_export ? gold : textFaint }}>
                    {(c as any).include_in_programme_export ? '✓' : '✗'} Programme Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleCopyAll} disabled={contributions.length === 0} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: copiedAll ? 'rgba(74,222,128,0.08)' : cardBg, color: copiedAll ? 'rgba(134,239,172,0.9)' : textPrimary, fontSize: '12px', fontWeight: 700, cursor: contributions.length === 0 ? 'not-allowed' : 'pointer', opacity: contributions.length === 0 ? 0.4 : 1 }}>
        {copiedAll ? '✓ Copied' : `Copy All Tributes (${contributions.length})`}
      </button>
      <button onClick={handleCopyProgramme} disabled={programmeContribs.length === 0} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${programmeContribs.length > 0 ? 'rgba(226,195,107,0.28)' : cardBorder}`, background: copiedProg ? 'rgba(74,222,128,0.08)' : programmeContribs.length > 0 ? goldFaint : 'transparent', color: copiedProg ? 'rgba(134,239,172,0.9)' : programmeContribs.length > 0 ? gold : textFaint, fontSize: '12px', fontWeight: 700, cursor: programmeContribs.length === 0 ? 'not-allowed' : 'pointer', opacity: programmeContribs.length === 0 ? 0.4 : 1 }}>
        {copiedProg ? '✓ Copied' : `Copy Programme Export (${programmeContribs.length})`}
      </button>
      {programmeContribs.length === 0 && (
        <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center' as const, fontStyle: 'italic' }}>Mark voices for Programme Export in the Programme Exports section above.</p>
      )}
    </div>
  )
}

// ═══ SECTION 3B — LiveWallSection ═══

function LiveWallSection({ capsuleSlug }: { capsuleSlug: string }) {
  const [copied, setCopied] = useState(false)
  const APP_URL    = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
  const displayUrl = `${APP_URL}/for/${capsuleSlug}/display`
  const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(displayUrl)}&bgcolor=0f0a1e&color=E2C36B&margin=8`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '16px' }}>
        Open the Live Wall on your venue screen or projector. Approved tributes appear in real time as guests submit them. Share the QR code or URL with your AV team before the event.
      </p>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, textAlign: 'center' as const }}>
          <img src={qrUrl} alt="Live Wall QR" width={80} height={80} style={{ borderRadius: '8px', display: 'block' }} />
          <p style={{ fontSize: '8px', color: textFaint, margin: '4px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Scan to open</p>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '9px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 6px' }}>Display URL</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', wordBreak: 'break-all' as const, margin: '0 0 10px', lineHeight: 1.5 }}>{displayUrl}</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleCopy}
              style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.2)`, background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(226,195,107,0.06)', color: copied ? 'rgba(134,239,172,0.9)' : goldMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              {copied ? '✓ Copied' : '🔗 Copy URL'}
            </button>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '11px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const, display: 'block' }}>
              Preview ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 4 — PriceColumn ═══

interface PriceRow {
  id:     string
  label:  string
  status: 'active' | 'locked' | 'coming_soon'
  price?: { amount: number; symbol: string } | null
}

function PriceColumn({
  rows, cart, onToggle, onCheckout, onSendLink, unlocking, cardHeights,
}: {
  rows:        PriceRow[]
  cart:        string[]
  onToggle:    (id: string) => void
  onCheckout:  () => void
  onSendLink:  () => void
  unlocking:   string | null
  cardHeights?: Record<string, number>
}) {
  const cartRows  = rows.filter(r => cart.includes(r.id))
  const cartTotal = cartRows.reduce((sum, r) => sum + (r.price?.amount ?? 0), 0)
  const symbol    = cartRows.find(r => r.price?.symbol)?.price?.symbol ?? ''

  return (
    <div style={{
      width: '72px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '10px',
    }}>
      {rows.map(row => {
        const isActive     = row.status === 'active'
        const isComingSoon = row.status === 'coming_soon'
        const inCart       = cart.includes(row.id)

        return (
          <div
            key={row.id}
            style={{
              height: cardHeights?.[row.id] ? `${cardHeights[row.id]}px` : '66px',
              minHeight: '52px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'height 0.2s ease',
            }}
          >
            {isActive ? (
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(134,239,172,0.9)' }}>✓</span>
              </div>
            ) : isComingSoon ? (
              <div style={{ width: '22px', height: '22px' }} />
            ) : (
              <>
                <button
                  onClick={() => onToggle(row.id)}
                  style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    border: `1px solid ${inCart ? 'rgba(226,195,107,0.6)' : 'rgba(255,255,255,0.15)'}`,
                    background: inCart ? 'rgba(226,195,107,0.15)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  title={inCart ? `Remove ${row.label}` : `Add ${row.label}`}
                >
                  {inCart && <span style={{ fontSize: '12px', color: gold, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </button>
                {row.price ? (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: inCart ? gold : 'rgba(255,255,255,0.25)', letterSpacing: '0.02em', textAlign: 'center' as const, lineHeight: 1.2 }}>
                    {row.price.symbol}{row.price.amount.toLocaleString()}
                  </span>
                ) : (
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.12)' }}>—</span>
                )}
              </>
            )}
          </div>
        )
      })}

      <div style={{ width: '100%', height: '1px', background: 'rgba(226,195,107,0.12)', margin: '4px 0' }} />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' }}>
        {cartTotal > 0 ? (
          <div style={{ textAlign: 'center' as const }}>
            <p style={{ margin: 0, fontSize: '8px', color: textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Total</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 800, color: gold }}>{symbol}{cartTotal.toLocaleString()}</p>
          </div>
        ) : (
          <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.12)', textAlign: 'center' as const, letterSpacing: '0.06em' }}>SELECT</p>
        )}

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || unlocking === 'cart'}
          style={{
            width: '100%', padding: '8px 4px', borderRadius: '8px', border: 'none',
            background: cart.length > 0 ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.05)',
            color: cart.length > 0 ? '#1a0845' : 'rgba(255,255,255,0.15)',
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em',
            cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase' as const,
            transition: 'all 0.2s',
          }}
        >
          {unlocking === 'cart' ? '…' : cart.length > 0 ? 'PAY →' : 'Cart'}
        </button>

        {cart.length > 0 && (
          <button
            onClick={onSendLink}
            style={{
              width: '100%', padding: '6px 4px', borderRadius: '8px',
              border: '1px solid rgba(226,195,107,0.2)',
              background: 'transparent',
              color: 'rgba(226,195,107,0.55)',
              fontSize: '8px', fontWeight: 700, letterSpacing: '0.06em',
              cursor: 'pointer', textTransform: 'uppercase' as const,
              transition: 'all 0.2s', lineHeight: 1.3,
            }}
            title="Send a payment link to someone who will pay on your behalf"
          >
            ✉ SEND LINK
          </button>
        )}
      </div>
    </div>
  )
}

// ═══ SECTION 5 — Main ServicesTab component ═══

export default function ServicesTab({ capsule, approvedContributions, supabase, onUpgrade, eohEditor, onToggleFlag }: ServicesTabProps) {
  const [phases, setPhases] = useState<any[]>([])
  const [unlocking,     setUnlocking]     = useState<string | null>(null)
  const [featurePrices, setFeaturePrices] = useState<Record<string, { amount: number; symbol: string } | null>>({})
  const [cart,          setCart]          = useState<string[]>([])
  const [cardHeights,   setCardHeights]   = useState<Record<string, number>>({})
  const [capacityAlert, setCapacityAlert] = useState<'none'|'friendly'|'recommend'|'strong'|'grace'>('none')
  const [recommendedPack, setRecommendedPack] = useState<string|null>(null)
  const [showSendModal,  setShowSendModal]  = useState(false)
  const [sendName,       setSendName]       = useState('')
  const [sendEmail,      setSendEmail]      = useState('')
  const [sending,        setSending]        = useState(false)
  const [sendResult,     setSendResult]     = useState<'success'|'error'|null>(null)

  const components = capsule.components ?? []

  // ── Price fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const FEATURE_KEYS = [
      'audio_tributes', 'video_tributes', 'ways_to_honour',
      'publication', 'guest_management', 'attire',
      'community_stories', 'extended_validity',
      'access_codes', 'additional_phase',
    ]
    fetch(`/api/regional-prices?features=${FEATURE_KEYS.join(',')}`)
      .then(r => r.json())
      .then(d => { if (d.features) setFeaturePrices(d.features) })
      .catch(() => {})
  }, [])

  // ── Card height tracking for price column alignment ─────────────────────────
  const handleHeightChange = (id: string, height: number) => {
    setCardHeights(prev => {
      if (prev[id] === height) return prev
      return { ...prev, [id]: height }
    })
  }

  // ── Send payment link to third party ────────────────────────────────────────
  const handleSendLink = async () => {
    if (!sendName.trim() || !sendEmail.includes('@') || cart.length === 0) return
    setSending(true); setSendResult(null)
    try {
      const res  = await fetch('/api/checkout/send-payment-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:   capsule.id,
          capsule_slug: capsule.slug,
          feature_ids:  cart,
          payer_name:   sendName.trim(),
          payer_email:  sendEmail.trim().toLowerCase(),
          honouree_name: capsule.honouree_name,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSendResult('success')
      setSendName(''); setSendEmail('')
      setTimeout(() => { setShowSendModal(false); setSendResult(null) }, 2500)
    } catch {
      setSendResult('error')
    }
    setSending(false)
  }

  // ── Fetch capacity alert level ────────────────────────────────────────────
  useEffect(() => {
    if (!capsule.id) return
    fetch(`/api/guests/capacity?capsule_id=${capsule.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.alert_level) setCapacityAlert(d.alert_level)
        if (d.recommended_pack) setRecommendedPack(d.recommended_pack)
      })
      .catch(() => {})
  }, [capsule.id])

  const toggleCart = (featureId: string) => {
    if (components.includes(featureId)) return
    setCart(prev => prev.includes(featureId)
      ? prev.filter(f => f !== featureId)
      : [...prev, featureId]
    )
  }

  const handleCartCheckout = async () => {
    if (cart.length === 0) return
    setUnlocking('cart')
    try {
      const res  = await fetch('/api/checkout/bundle', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id:      capsule.id,
          capsule_slug:    capsule.slug,
          feature_ids:     cart,
          organiser_email: '',
          book_mode:       'own',
          source:          'dashboard',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkout_url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.checkout_url
    } catch (err) {
      console.error('[ServicesTab] Cart checkout failed:', err)
      setUnlocking(null)
      onUpgrade()
    }
  }

  // ── Whether both guest services are active ───────────────────────────────
  // Guest Management and Access Codes are separate purchases.
  // When guest_management is active, the ServiceCard expands to show
  // TableManagement + GuestManagementSection (which contains the
  // Codes, Ushers and Metrics tabs when access_codes is also active).
  const guestMgmtActive = components.includes('guest_management')
  const accessCodesActive = components.includes('access_codes')

  // ── Price column rows — same order as ServiceCards ───────────────────────
  const priceRows: PriceRow[] = [
    {
      id:     'guest_management',
      label:  'Guest Management',
      status: guestMgmtActive ? 'active' : 'locked',
      price:  featurePrices['guest_management'],
    },
    {
      id:     'access_codes',
      label:  'Access Codes',
      status: accessCodesActive ? 'active' : 'locked',
      price:  featurePrices['access_codes'],
    },
    {
      id:     'ways_to_honour',
      label:  'Gift of Honour',
      status: components.includes('ways_to_honour') ? 'active' : 'locked',
      price:  featurePrices['ways_to_honour'],
    },
    {
      id:     'publication',
      label:  'Publication',
      status: components.includes('publication') ? 'active' : 'locked',
      price:  featurePrices['publication'],
    },
    {
      id:     'attire',
      label:  'Fabric & Attire',
      status: components.includes('attire') ? 'active' : 'locked',
      price:  featurePrices['attire'],
    },
    {
      id:     'audio_tributes',
      label:  'Voice Tributes',
      status: components.includes('audio_tributes') ? 'active' : 'locked',
      price:  featurePrices['audio_tributes'],
    },
    {
      id:     'video_tributes',
      label:  'Video Tributes',
      status: components.includes('video_tributes') ? 'active' : 'locked',
      price:  featurePrices['video_tributes'],
    },
  ]

  return (
    <div>

      {/* ════════════════════════════════════════════
          FULL WIDTH — Always-on cards (no price column)
      ════════════════════════════════════════════ */}
      <div style={{ marginBottom: '4px' }}>

        {/* Programme Exports */}
        <ServiceCard
          id="exports"
          title="Programme Exports"
          description="Export tributes and Community Stories to clipboard"
          icon="⬇"
          status="always_on"
        >
          <ExportsSection contributions={approvedContributions} slug={capsule.slug} onToggleFlag={onToggleFlag} />
        </ServiceCard>

        {/* Event Phases */}
        <ServiceCard
          id="phases"
          title="Event Phases"
          description="Manage ceremony phases · QR codes · D-Day capture"
          icon="◈"
          status="always_on"
        >
          <EventPhasesSection capsuleId={capsule.id} capsuleSlug={capsule.slug} />
        </ServiceCard>

        {/* D-Day Live Wall — shown here with Event Phases, not at bottom */}
        <ServiceCard
          id="live_wall"
          title="D-Day Live Wall"
          description="Full-screen real-time tribute display for your venue screen or projector"
          icon="◇"
          status="always_on"
        >
          <LiveWallSection capsuleSlug={capsule.slug} />
        </ServiceCard>

      </div>

      {/* ════════════════════════════════════════════
          TWO-COLUMN — Purchasable services + price column
      ════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Guest Management — priceRows[0] ── */}
          <ServiceCard
            id="guests"
            onHeightChange={handleHeightChange}
            title="Guest Management & Seating"
            description="Guest list · RSVP · Table assignment · Seating"
            icon="◉"
            status={guestMgmtActive ? 'active' : 'locked'}
            externalLink={guestMgmtActive ? `/manage/${capsule.slug}/guests` : undefined}
            price={featurePrices['guest_management']}
            detailSummary="Everyone at your event in one place — guests, family, VIPs, vendors, media. Collect RSVPs, manage seating, and know exactly who is expected and where they'll be."
            detailPoints={[
              'Full participant registry — guests, VIPs, vendors, media, volunteers',
              'RSVP tracking with event-type-aware segments (Bride\'s / Groom\'s guests etc)',
              'Table and seating assignment',
              'VIP and VVIP protocol — PA contacts, entourage, arrival protocol notes',
            ]}
            learnMoreUrl="/help?section=guest_management&ref=dashboard"
          />

          {/* ── Access Codes — priceRows[1] ── */}
          <ServiceCard
            id="access_codes"
            onHeightChange={handleHeightChange}
            title="Access Code System"
            description="Personal entry codes · Usher check-in · Live arrivals"
            icon="🔐"
            status={accessCodesActive ? 'active' : 'locked'}
            externalLink={accessCodesActive ? `/manage/${capsule.slug}/access` : undefined}
            price={featurePrices['access_codes']}
            detailSummary="Give every guest a personal entry code. Your team checks guests in on the day with a simple scan on any phone. When a VIP arrives, you know immediately."
            detailPoints={[
              'Unique QR and numeric code per guest',
              'Auto-email codes directly to guests — one click to send all',
              'Print access passes for guests who prefer a physical card',
              'Live arrivals dashboard with VVIP outstanding list',
            ]}
            learnMoreUrl="/help?section=access_codes&ref=dashboard"
          />

          {/* ── Gift of Honour — priceRows[2] ── */}
          <ServiceCard
            id="eoh"
            onHeightChange={handleHeightChange}
            title="Gift of Honour"
            description="A dignified channel for guests to express financial support — private, tasteful"
            icon="✦"
            status={components.includes('ways_to_honour') ? 'active' : 'locked'}
            price={featurePrices['ways_to_honour']}
            detailSummary="A dignified, private channel for guests to send financial support — bank details presented tastefully on your tribute wall. No transaction fees, no fund handling."
            detailPoints={[
              'Full privacy — amounts never shown publicly',
              'Multiple payment channels and currencies supported',
              'Daily digest email to family representative',
              'No transaction fees — LegacyCapsule handles no funds',
            ]}
            learnMoreUrl="/help?section=ways_to_honour&ref=dashboard"
          >
            {eohEditor}
          </ServiceCard>

          {/* ── Digital Publication — priceRows[3] ── */}
          <ServiceCard
            id="publication"
            onHeightChange={handleHeightChange}
            title="Digital Publication"
            description="Curated commemorative PDF — arrange, preview, generate"
            icon="◎"
            status={components.includes('publication') ? 'active' : 'locked'}
            externalLink={`/manage/${capsule.slug}/publication`}
            price={featurePrices['publication']}
            detailSummary="Every tribute compiled into a beautifully designed keepsake PDF — arranged by you, distributed to all contributors in one click. A permanent record designed to be kept."
            detailPoints={[
              'Drag-and-drop arrangement in Publication Editor',
              'Five professional design themes',
              'One-click distribution to all contributors',
              'Permanent download link for every recipient',
            ]}
            learnMoreUrl="/help?section=publication&ref=dashboard"
          />

          {/* ── Fabric & Attire — priceRows[4] ── */}
          <ServiceCard
            id="attire"
            onHeightChange={handleHeightChange}
            title="Fabric & Attire"
            description="Showcase, orders, payments, dispatch lifecycle"
            icon="◐"
            status={components.includes('attire') ? 'active' : 'locked'}
            externalLink={`/manage/${capsule.slug}/attire`}
            price={featurePrices['attire']}
            detailSummary="Complete dress code coordination — showcase fabric options, collect orders, track payments, manage collection. Designed for Aso-Ebi and coordinated event attire."
            detailPoints={[
              'Showcase fabric options with photos and pricing',
              'Order and payment tracking per guest',
              'Collection management — VIP exceptions surfaced separately',
              'Guest-facing attire page on your tribute wall',
            ]}
            learnMoreUrl="/help?section=attire&ref=dashboard"
          />

          {/* ── Voice Tributes — priceRows[5] ── */}
          <ServiceCard
            id="audio_tributes"
            onHeightChange={handleHeightChange}
            title="Voice Tributes"
            description="Contributors record personal audio messages"
            icon="🎙"
            status={components.includes('audio_tributes') ? 'active' : 'locked'}
            price={featurePrices['audio_tributes']}
            detailSummary="Contributors record personal audio messages directly from their phone — no app needed. The sound of a familiar voice carries meaning that text alone cannot."
            detailPoints={[
              'Works on any smartphone with a microphone',
              'Up to 60 seconds per recording',
              'Plays inline in the tribute card — no download needed',
              'Same moderation queue as written tributes',
            ]}
            learnMoreUrl="/help?section=audio_tributes&ref=dashboard"
          />

          {/* ── Video Tributes — priceRows[6] ── */}
          <ServiceCard
            id="video_tributes"
            onHeightChange={handleHeightChange}
            title="Video Tributes"
            description="Contributors upload short video messages"
            icon="🎬"
            status={components.includes('video_tributes') ? 'active' : 'locked'}
            price={featurePrices['video_tributes']}
            detailSummary="Contributors upload short video messages that play directly in their tribute card. A face, a voice, an expression — the most personal tribute of all."
            detailPoints={[
              'Record on phone camera, upload directly',
              'Up to 60 seconds per video',
              'Plays inline in tribute card — no external links',
              'Works on any device, no app required',
            ]}
            learnMoreUrl="/help?section=video_tributes&ref=dashboard"
          />

        </div>

        {/* ── RIGHT: Price column ── */}
        <div style={{ position: 'sticky' as const, top: '80px', alignSelf: 'flex-start' }}>
          <PriceColumn
            rows={priceRows}
            cart={cart}
            onToggle={toggleCart}
            onCheckout={handleCartCheckout}
            onSendLink={() => setShowSendModal(true)}
            unlocking={unlocking}
            cardHeights={cardHeights}
          />
        </div>

      </div>

      {/* ── Send Payment Link modal ── */}
      {showSendModal && (
        <div style={{ position: 'fixed' as const, inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(10,0,20,0.75)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '380px', borderRadius: '16px', background: 'linear-gradient(160deg,#1a0845,#120630)', border: '1px solid rgba(226,195,107,0.25)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ height: '2px', background: 'linear-gradient(to right,transparent,#E2C36B,transparent)' }} />
            <div style={{ padding: '20px 20px 24px' }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', fontWeight: 700, color: '#E2C36B', margin: '0 0 6px' }}>
                Send a Payment Link
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>
                Know someone who wants to contribute to your capsule services? Send them a personalised payment link — they pay directly, and the services activate on your capsule instantly.
              </p>

              {/* Selected services summary */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(226,195,107,0.06)', border: '1px solid rgba(226,195,107,0.12)', marginBottom: '16px' }}>
                <p style={{ fontSize: '9px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 6px' }}>Services in this link</p>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
                  {cart.map(id => {
                    const row = priceRows.find(r => r.id === id)
                    return <span key={id} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.2)', color: 'rgba(226,195,107,0.75)' }}>{row?.label ?? id}</span>
                  })}
                </div>
              </div>

              {sendResult === 'success' ? (
                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' as const }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: '0 0 4px' }}>✓ Payment link sent</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>They'll receive an email with the payment button shortly.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '9px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their name</label>
                    <input style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.2)', color: 'rgba(255,255,255,0.92)', fontSize: '13px', outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' as const }} placeholder="Who is paying?" value={sendName} onChange={e => setSendName(e.target.value)} maxLength={80} autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: '9px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their email</label>
                    <input type="email" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.2)', color: 'rgba(255,255,255,0.92)', fontSize: '13px', outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' as const }} placeholder="Where should we send the link?" value={sendEmail} onChange={e => setSendEmail(e.target.value)} maxLength={120} />
                  </div>
                  {sendResult === 'error' && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', margin: 0 }}>Something went wrong. Please try again.</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={handleSendLink} disabled={sending || !sendName.trim() || !sendEmail.includes('@')} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: sendName.trim() && sendEmail.includes('@') ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.06)', color: sendName.trim() && sendEmail.includes('@') ? '#1a0845' : 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                      {sending ? 'Sending…' : '✉ Send Payment Link'}
                    </button>
                    <button onClick={() => { setShowSendModal(false); setSendName(''); setSendEmail(''); setSendResult(null) }} style={{ padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          FULL WIDTH — Always-on operational cards
      ════════════════════════════════════════════ */}
      <div style={{ marginTop: '4px' }}>

        {/* ── Capacity Pack section — shown when alert is active ── */}
        {capacityAlert !== 'none' && (
          <div id="capacity-packs" style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${capacityAlert === 'grace' || capacityAlert === 'strong' ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.2)'}`, background: capacityAlert === 'grace' || capacityAlert === 'strong' ? 'rgba(248,113,113,0.05)' : 'rgba(251,191,36,0.05)', marginBottom: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: capacityAlert === 'grace' || capacityAlert === 'strong' ? 'rgba(248,113,113,0.8)' : 'rgba(251,191,36,0.8)', marginBottom: '6px' }}>
              {capacityAlert === 'grace' ? 'Guest limit exceeded' : 'Guest capacity'}
            </p>
            <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '12px' }}>
              {capacityAlert === 'grace'    ? "You've exceeded your guest allocation. Add a capacity pack to continue adding guests."
              : capacityAlert === 'strong'  ? 'Almost at your guest limit. Add a pack before you reach it.'
              : capacityAlert === 'recommend' ? "You're approaching your guest limit. Adding a pack now keeps things smooth."
              : 'Your event is growing. Consider adding a capacity pack ahead of time.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
              {['capacity_pack_growth', 'capacity_pack_celebration', 'capacity_pack_grand'].map(packKey => {
                const price    = featurePrices[packKey]
                const isInCart = cart.includes(packKey)
                const isActive = capsule.components.includes(packKey)
                const labels: Record<string, string> = {
                  capacity_pack_growth:      'Growth Pack — +250 guests',
                  capacity_pack_celebration: 'Celebration Pack — +750 guests',
                  capacity_pack_grand:       'Grand Event Pack — +2,000 guests',
                }
                return (
                  <div key={packKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${isInCart ? 'rgba(226,195,107,0.45)' : 'rgba(255,255,255,0.07)'}`, background: isInCart ? goldFaint : 'rgba(255,255,255,0.03)', cursor: isActive ? 'default' : 'pointer' }}
                    onClick={() => !isActive && toggleCart(packKey)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isActive && (
                        <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${isInCart ? gold : 'rgba(255,255,255,0.18)'}`, background: isInCart ? 'rgba(226,195,107,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isInCart && <span style={{ fontSize: '10px', color: gold, fontWeight: 800 }}>✓</span>}
                        </div>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isActive ? textFaint : textSecondary }}>
                        {labels[packKey]}
                        {recommendedPack === packKey && !isActive && <span style={{ marginLeft: '6px', fontSize: '9px', color: gold, fontWeight: 700 }}>Recommended</span>}
                      </span>
                    </div>
                    {isActive ? (
                      <span style={{ fontSize: '10px', color: 'rgba(134,239,172,0.8)', fontWeight: 700 }}>✓ Active</span>
                    ) : price ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isInCart ? gold : textFaint }}>{price.symbol}{price.amount.toLocaleString()}</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )}

{/* D-Day Live Wall moved to top always-on section with Event Phases */}

      </div>

    </div>
  )
}
