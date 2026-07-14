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
 *
 * Sub-sections:
 *   1. Types + imports
 *   2. ServiceCard — expandable service card (no cart buttons)
 *   3. ExportsSection — inline exports
 *   4. PriceColumn — checkbox + price aligned to service rows
 *   5. Main ServicesTab component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types + imports
// ============================================================

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

import EventPhasesSection    from '@/components/manage/EventPhasesSection'
import GuestManagementSection from '@/components/manage/GuestManagementSection'
import TableManagementSection from '@/components/manage/TableManagementSection'

interface Contribution {
  id: string; contributor_name: string; city: string; country: string
  relationship: string | null; tribute_text: string; email: string | null
  status: string; created_at: string
  include_in_publication?: boolean; include_in_programme_export?: boolean
}

interface ServicesTabProps {
  capsule: {
    id: string; slug: string; honouree_name: string; tier: string | null
    components: string[]
  }
  approvedContributions: Contribution[]
  supabase: any
  onUpgrade: () => void
  eohEditor?: React.ReactNode
}

// Style constants
const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint    = 'rgba(255,255,255,0.28)'

// ============================================================
// SECTION 2 — ServiceCard (no cart buttons — selection in PriceColumn)
// ============================================================

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

  // Report height changes to parent for price column alignment
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
              style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: textFaint, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
            >
              Full details →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// SECTION 3 — ExportsSection
// ============================================================

function ExportsSection({ contributions, slug }: { contributions: Contribution[]; slug: string }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button onClick={handleCopyAll} disabled={contributions.length === 0} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: copiedAll ? 'rgba(74,222,128,0.08)' : cardBg, color: copiedAll ? 'rgba(134,239,172,0.9)' : textPrimary, fontSize: '12px', fontWeight: 700, cursor: contributions.length === 0 ? 'not-allowed' : 'pointer', opacity: contributions.length === 0 ? 0.4 : 1 }}>
        {copiedAll ? '✓ Copied' : `Copy All Tributes (${contributions.length})`}
      </button>
      <button onClick={handleCopyProgramme} disabled={programmeContribs.length === 0} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${programmeContribs.length > 0 ? 'rgba(226,195,107,0.28)' : cardBorder}`, background: copiedProg ? 'rgba(74,222,128,0.08)' : programmeContribs.length > 0 ? goldFaint : 'transparent', color: copiedProg ? 'rgba(134,239,172,0.9)' : programmeContribs.length > 0 ? gold : textFaint, fontSize: '12px', fontWeight: 700, cursor: programmeContribs.length === 0 ? 'not-allowed' : 'pointer', opacity: programmeContribs.length === 0 ? 0.4 : 1 }}>
        {copiedProg ? '✓ Copied' : `Copy Programme Export (${programmeContribs.length})`}
      </button>
      {programmeContribs.length === 0 && (
        <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center' as const, fontStyle: 'italic' }}>Mark tributes for Programme Export in the Tributes tab.</p>
      )}
    </div>
  )
}

// ============================================================
// SECTION 3B — LiveWallSection
// ============================================================

function LiveWallSection({ capsuleSlug }: { capsuleSlug: string }) {
  const [copied, setCopied] = useState(false)
  const APP_URL   = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
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
        {/* QR code */}
        <div style={{ flexShrink: 0, textAlign: 'center' as const }}>
          <img src={qrUrl} alt="Live Wall QR" width={80} height={80} style={{ borderRadius: '8px', display: 'block' }} />
          <p style={{ fontSize: '8px', color: textFaint, margin: '4px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Scan to open</p>
        </div>

        {/* URL + actions */}
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

// ============================================================
// SECTION 4 — PriceColumn
// Sticky right panel. One row per purchasable service,
// in the same order as the left ServiceCards.
// Checkbox + price only — no service name repeated.
// ============================================================

interface PriceRow {
  id:        string
  label:     string   // short label for the total breakdown tooltip
  status:    'active' | 'locked' | 'coming_soon'
  price?:    { amount: number; symbol: string } | null
}

function PriceColumn({
  rows,
  cart,
  onToggle,
  onCheckout,
  unlocking,
}: {
  rows:       PriceRow[]
  cart:       string[]
  onToggle:   (id: string) => void
  onCheckout: () => void
  unlocking:  string | null
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
      {/* ── Price + checkbox rows ── */}
      {rows.map(row => {
        const isActive    = row.status === 'active'
        const isComingSoon = row.status === 'coming_soon'
        const inCart      = cart.includes(row.id)

        return (
          <div
            key={row.id}
            style={{
              height: '66px', // matches collapsed ServiceCard min-height
              width: '100%',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            {isActive ? (
              // Already activated — show green tick, no checkbox
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(134,239,172,0.9)' }}>✓</span>
              </div>
            ) : isComingSoon ? (
              // Coming soon — empty cell
              <div style={{ width: '22px', height: '22px' }} />
            ) : (
              // Locked — checkbox + price
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
                  title={inCart ? `Remove ${row.label} from selection` : `Add ${row.label} to selection`}
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

      {/* ── Divider ── */}
      <div style={{ width: '100%', height: '1px', background: 'rgba(226,195,107,0.12)', margin: '4px 0' }} />

      {/* ── Total + checkout ── */}
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
          {unlocking === 'cart' ? '…' : cart.length > 0 ? `GO →` : 'Cart'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 5 — Main ServicesTab component
// ============================================================

export default function ServicesTab({ capsule, approvedContributions, supabase, onUpgrade, eohEditor }: ServicesTabProps) {
  const [tables,       setTables]       = useState<any[]>([])
  const [phases,       setPhases]       = useState<any[]>([])
  const [unlocking,    setUnlocking]    = useState<string | null>(null)
  const [featurePrices, setFeaturePrices] = useState<Record<string, { amount: number; symbol: string } | null>>({})
  const [cart,         setCart]         = useState<string[]>([])

  const components = capsule.components ?? []

  // ── Price fetch ───────────────────────────────────────────────────────────
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

  const toggleCart = (featureId: string) => {
    // Only allow toggling locked (not yet purchased) services
    if (components.includes(featureId)) return
    setCart(prev => prev.includes(featureId)
      ? prev.filter(f => f !== featureId)
      : [...prev, featureId]
    )
  }

  const cartTotal  = cart.reduce((sum, id) => sum + (featurePrices[id]?.amount ?? 0), 0)

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

  // ── Price column rows — same order as ServiceCards below ─────────────────
  // Only paid add-ons appear here (not always_on, not coming_soon)
  const priceRows: PriceRow[] = [
    { id: 'guest_management', label: 'Guest Management', status: components.includes('guest_management') ? 'active' : 'locked', price: featurePrices['guest_management'] },
    { id: 'ways_to_honour',   label: 'Gift of Honour',   status: components.includes('ways_to_honour') ? 'active' : 'locked',   price: featurePrices['ways_to_honour'] },
    { id: 'publication',      label: 'Publication',       status: components.includes('publication') ? 'active' : 'locked',       price: featurePrices['publication'] },
    { id: 'attire',           label: 'Fabric & Attire',   status: components.includes('attire') ? 'active' : 'locked',           price: featurePrices['attire'] },
    { id: 'audio_tributes',   label: 'Voice Tributes',    status: components.includes('audio_tributes') ? 'active' : 'locked',   price: featurePrices['audio_tributes'] },
    { id: 'video_tributes',   label: 'Video Tributes',    status: components.includes('video_tributes') ? 'active' : 'locked',   price: featurePrices['video_tributes'] },
    { id: 'access_cards',     label: 'Access Cards',       status: 'coming_soon' },
  ]

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>

      {/* ── LEFT: Service cards ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Programme Exports — always on */}
        <ServiceCard
          id="exports"
          title="Programme Exports"
          description="Unlocked with Digital Publication — export tributes and Community Stories to clipboard"
          icon="⬇"
          status="always_on"
        >
          <ExportsSection contributions={approvedContributions} slug={capsule.slug} />
        </ServiceCard>

        {/* Event Phases — always on */}
        <ServiceCard
          id="phases"
          title="Event Phases"
          description="Manage ceremony phases · QR codes · D-Day capture"
          icon="◈"
          status="always_on"
        >
          <EventPhasesSection capsuleId={capsule.id} capsuleSlug={capsule.slug} />
        </ServiceCard>

        {/* Guest Management — priceRows[0] */}
        <ServiceCard
          id="guests"
          title="Guest Management & Seating"
          description="Guest list · Access codes · Check-in tracking · Seating"
          icon="◉"
          status={components.includes('guest_management') ? 'active' : 'locked'}
          price={featurePrices['guest_management']}
          detailSummary="A complete guest coordination system — guest list, unique QR access codes, RSVP tracking, table management, seating assignment, and check-in on event day."
          detailPoints={['Unique QR access codes per guest', 'Real-time check-in dashboard on event day', 'Table management and seating assignment', 'Printable table cards with context-aware QR']}
          learnMoreUrl="/features/guest_management"
        >
          {components.includes('guest_management') && (
            <>
              <TableManagementSection capsuleId={capsule.id} onTablesChange={setTables} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '12px 0' }} />
              <GuestManagementSection capsuleId={capsule.id} capsuleSlug={capsule.slug} tables={tables} phases={phases} />
            </>
          )}
        </ServiceCard>

        {/* Gift of Honour — priceRows[1] */}
        <ServiceCard
          id="eoh"
          title="Gift of Honour"
          description="A dignified channel for guests to express financial support — private, tasteful"
          icon="✦"
          status={components.includes('ways_to_honour') ? 'active' : 'locked'}
          price={featurePrices['ways_to_honour']}
          detailSummary="A dignified, private channel for guests to send financial support — bank details presented tastefully on your tribute wall. No transaction fees, no fund handling."
          detailPoints={['Full privacy — amounts never shown publicly', 'Multiple payment channels supported', 'Daily digest email to family representative', 'No transaction fees']}
          learnMoreUrl="/features/ways_to_honour"
        >
          {eohEditor}
        </ServiceCard>

        {/* Digital Publication — priceRows[2] */}
        <ServiceCard
          id="publication"
          title="Digital Publication"
          description="Curated commemorative PDF — arrange, preview, generate"
          icon="◎"
          status={components.includes('publication') ? 'active' : 'locked'}
          externalLink={`/manage/${capsule.slug}/publication`}
          price={featurePrices['publication']}
          detailSummary="Every tribute compiled into a beautifully designed keepsake PDF — arranged by you, distributed to all contributors in one click. A permanent record designed to be kept."
          detailPoints={['Drag-and-drop arrangement in Publication Editor', 'Five professional design themes', 'One-click distribution to all contributors', 'Permanent download link for every recipient']}
          learnMoreUrl="/features/publication"
        />

        {/* Fabric & Attire — priceRows[3] */}
        <ServiceCard
          id="attire"
          title="Fabric & Attire"
          description="Showcase, orders, payments, dispatch lifecycle"
          icon="◐"
          status={components.includes('attire') ? 'active' : 'locked'}
          externalLink={`/manage/${capsule.slug}/attire`}
          price={featurePrices['attire']}
          detailSummary="Complete dress code coordination — showcase fabric options, collect orders, track payments, manage collection. Designed for Aso-Ebi and coordinated event attire."
          detailPoints={['Showcase fabric options with photos and pricing', 'Order and payment tracking', 'Collection management and dispatch reminders', 'Guest-facing order page on your tribute wall']}
          learnMoreUrl="/features/attire"
        />

        {/* Voice Tributes — priceRows[4] */}
        <ServiceCard
          id="audio_tributes"
          title="Voice Tributes"
          description="Contributors record personal audio messages"
          icon="🎙"
          status={components.includes('audio_tributes') ? 'active' : 'locked'}
          price={featurePrices['audio_tributes']}
          detailSummary="Contributors record personal audio messages directly from their phone — no app needed. The sound of a familiar voice carries meaning that text alone cannot."
          detailPoints={['Works on any smartphone with a microphone', 'Up to 30 seconds per recording', 'Plays inline in the tribute card', 'Same moderation queue as written tributes']}
          learnMoreUrl="/features/audio_tributes"
        />

        {/* Video Tributes — priceRows[5] */}
        <ServiceCard
          id="video_tributes"
          title="Video Tributes"
          description="Contributors upload short video messages"
          icon="🎬"
          status={components.includes('video_tributes') ? 'active' : 'locked'}
          price={featurePrices['video_tributes']}
          detailSummary="Contributors upload short video messages that play directly in their tribute card. A face, a voice, an expression — the most personal tribute of all."
          detailPoints={['Record on phone camera, upload directly', 'Up to 30 seconds per video', 'Plays inline — no external links', 'Works on any device, no app required']}
          learnMoreUrl="/features/video_tributes"
        />

        {/* D-Day Live Wall — always on — display URL + QR */}
        <ServiceCard
          id="live_wall"
          title="D-Day Live Wall"
          description="Full-screen real-time tribute display for your venue screen or projector"
          icon="◇"
          status="always_on"
        >
          <LiveWallSection capsuleSlug={capsule.slug} />
        </ServiceCard>

        {/* Access Card Printing — priceRows[7] — coming soon */}
        <ServiceCard
          id="access_cards"
          title="Access Card Printing"
          description="Branded physical access cards with embedded QR codes"
          icon="▣"
          status="coming_soon"
        />
      </div>

      {/* ── RIGHT: Price column — aligned to paid service rows only ── */}
      {/* Offset top to align with Guest Management (first paid row, after 2 always-on cards) */}
      <div style={{ paddingTop: `${2 * 76}px`, position: 'sticky' as const, top: '80px', alignSelf: 'flex-start' }}>
        <PriceColumn
          rows={priceRows}
          cart={cart}
          onToggle={toggleCart}
          onCheckout={handleCartCheckout}
          unlocking={unlocking}
        />
      </div>

    </div>
  )
}
