'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/ServicesTab.tsx
// PURPOSE:   Organiser manage dashboard — Services tab.
//            Shows all purchasable services. Active services open their tools.
//            Locked services show detail and can be added to cart.
//            Coming Soon services are faded with "Soon" badge — no price entry.
//            Preset buttons (Essential / Signature) pre-fill cart selections.
//            LimitsBar shows live free tier counters at top of tab.
// ARCHITECTURE: LC04 Payment Engine — organiser dashboard services panel.
// BUILT BY:  AI11 · June 2026
// UPDATED:   AI20 · Claude Sonnet 4.6 · 11 August 2026
//            — coming_soon services: Guest Management, Fabric & Attire
//              (not ready for purchase — faded with Soon badge, no price row)
//            — Essential + Signature preset buttons added
//            — LimitsBar component added (free tier live counters)
//            — priceRows updated: coming_soon services excluded from price column
//            — Standard file header added
// VERSION:   AI20v2.11.99
// DATE:      11 August 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Types + imports ═══

import React, { useState, useEffect, useRef } from 'react'
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
  const isComingSoon  = status === 'coming_soon'
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
        opacity: isComingSoon ? 0.45 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* Card header */}
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
            <span style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', color: textFaint, letterSpacing: '0.1em', background: 'rgba(255,255,255,0.03)' }}>Soon</span>
          )}
        </div>
      </div>

      {/* Expanded — active */}
      {expanded && children && !isLocked && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid rgba(255,255,255,0.04)`, paddingTop: '14px' }}>
          {children}
        </div>
      )}

      {/* Expanded — locked detail */}
      {expanded && isLocked && detailSummary && (
        <div style={{ padding: '14px 16px 16px', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, margin: '0 0 12px' }}>{detailSummary}</p>
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
            <Link href={learnMoreUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: textFaint, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Find out more
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 3 — ExportsSection ═══

function ExportsSection({ contributions, slug, onToggleFlag }: {
  contributions: Contribution[]; slug: string
  onToggleFlag?: (id: string, field: string, current: boolean) => void
}) {
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
      {contributions.length > 0 && onToggleFlag && (
        <div>
          <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 600 }}>Curate Voices for Export</p>
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
                  <button onClick={() => onToggleFlag(c.id, 'include_in_publication', (c as any).include_in_publication ?? true)}
                    style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${(c as any).include_in_publication !== false ? 'rgba(74,222,128,0.28)' : 'rgba(255,255,255,0.08)'}`, background: (c as any).include_in_publication !== false ? 'rgba(74,222,128,0.07)' : 'transparent', color: (c as any).include_in_publication !== false ? 'rgba(134,239,172,0.9)' : textFaint }}>
                    {(c as any).include_in_publication !== false ? '✓' : '✗'} Publication
                  </button>
                  <button onClick={() => onToggleFlag(c.id, 'include_in_programme_export', (c as any).include_in_programme_export ?? false)}
                    style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${(c as any).include_in_programme_export ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.08)'}`, background: (c as any).include_in_programme_export ? goldFaint : 'transparent', color: (c as any).include_in_programme_export ? gold : textFaint }}>
                    {(c as any).include_in_programme_export ? '✓' : '✗'} Programme Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={handleCopyAll} disabled={contributions.length === 0}
        style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: copiedAll ? 'rgba(74,222,128,0.08)' : cardBg, color: copiedAll ? 'rgba(134,239,172,0.9)' : textPrimary, fontSize: '12px', fontWeight: 700, cursor: contributions.length === 0 ? 'not-allowed' : 'pointer', opacity: contributions.length === 0 ? 0.4 : 1 }}>
        {copiedAll ? '✓ Copied' : `Copy All Tributes (${contributions.length})`}
      </button>
      <button onClick={handleCopyProgramme} disabled={programmeContribs.length === 0}
        style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${programmeContribs.length > 0 ? 'rgba(226,195,107,0.28)' : cardBorder}`, background: copiedProg ? 'rgba(74,222,128,0.08)' : programmeContribs.length > 0 ? goldFaint : 'transparent', color: copiedProg ? 'rgba(134,239,172,0.9)' : programmeContribs.length > 0 ? gold : textFaint, fontSize: '12px', fontWeight: 700, cursor: programmeContribs.length === 0 ? 'not-allowed' : 'pointer', opacity: programmeContribs.length === 0 ? 0.4 : 1 }}>
        {copiedProg ? '✓ Copied' : `Copy Programme Export (${programmeContribs.length})`}
      </button>
      {programmeContribs.length === 0 && (
        <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center' as const, fontStyle: 'italic' }}>Mark voices for Programme Export above.</p>
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

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '16px' }}>
        Open the Live Wall on your venue screen or projector. Approved tributes appear in real time as guests submit them.
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
            <button onClick={async () => { await navigator.clipboard.writeText(displayUrl); setCopied(true); setTimeout(() => setCopied(false), 2500) }}
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

// ═══ SECTION 3C — LimitsBar ═══
// Live free tier resource counters — passive upsell by design.
// Amber at 80%, red at 100%. Only shown on free tier capsules.

interface LimitCounter {
  used: number; limit: number | null; unlimited: boolean; pct: number | null
}
interface CapsuleLimits {
  is_free_tier:   boolean
  tributes:       LimitCounter
  stories:        LimitCounter
  audio_tributes: LimitCounter
  video_tributes: LimitCounter
  event_moments:  { uploaded: number; displaying: number; limit: number | null; unlimited: boolean }
  days_remaining: { days: number | null; expires_at: string | null; pct: number | null; unlimited: boolean }
}

function LimitsBar({ capsuleId, onUpgrade }: { capsuleId: string; onUpgrade: () => void }) {
  const [limits,  setLimits]  = React.useState<CapsuleLimits | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch(`/api/capsule/limits?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setLimits(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capsuleId])

  if (loading || !limits || !limits.is_free_tier) return null

  const barColour = (pct: number | null) => {
    if (pct === null) return 'rgba(226,195,107,0.4)'
    if (pct >= 100)   return 'rgba(248,113,113,0.8)'
    if (pct >= 80)    return 'rgba(251,191,36,0.8)'
    return 'rgba(134,239,172,0.7)'
  }
  const textColour = (pct: number | null) => {
    if (pct === null) return 'rgba(255,255,255,0.4)'
    if (pct >= 100)   return 'rgba(248,113,113,0.9)'
    if (pct >= 80)    return 'rgba(251,191,36,0.9)'
    return 'rgba(255,255,255,0.6)'
  }

  const rows = [
    { label: 'Tributes',       used: limits.tributes.used,       limit: limits.tributes.limit,       pct: limits.tributes.pct,       unlimited: limits.tributes.unlimited },
    { label: 'Stories',        used: limits.stories.used,        limit: limits.stories.limit,        pct: limits.stories.pct,        unlimited: limits.stories.unlimited },
    { label: 'Voice Tributes', used: limits.audio_tributes.used, limit: limits.audio_tributes.limit, pct: limits.audio_tributes.pct, unlimited: limits.audio_tributes.unlimited },
    { label: 'Video Tributes', used: limits.video_tributes.used, limit: limits.video_tributes.limit, pct: limits.video_tributes.pct, unlimited: limits.video_tributes.unlimited },
  ]

  return (
    <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(226,195,107,0.15)', background: 'rgba(226,195,107,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(226,195,107,0.55)', margin: 0 }}>
          Free Plan — Capsule Limits
        </p>
        {limits.days_remaining.days !== null && (
          <p style={{ fontSize: '10px', color: limits.days_remaining.days < 14 ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.35)', margin: 0 }}>
            {limits.days_remaining.days > 0 ? `${limits.days_remaining.days} days remaining` : 'Expired'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px' }}>
        {rows.map(row => (
          <div key={row.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: textColour(row.pct) }}>
                {row.unlimited ? '∞' : `${row.used} / ${row.limit}`}
              </span>
            </div>
            {!row.unlimited && (
              <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, row.pct ?? 0)}%`, borderRadius: '2px', background: barColour(row.pct), transition: 'width 0.3s ease' }} />
              </div>
            )}
          </div>
        ))}

        {!limits.event_moments.unlimited && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Event Moments (displaying)</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: limits.event_moments.uploaded > (limits.event_moments.limit ?? 0) ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.6)' }}>
              {limits.event_moments.displaying} / {limits.event_moments.limit}
              {limits.event_moments.uploaded > (limits.event_moments.limit ?? 0) &&
                <span style={{ fontSize: '9px', color: 'rgba(251,191,36,0.6)', marginLeft: '4px' }}>({limits.event_moments.uploaded} stored)</span>
              }
            </span>
          </div>
        )}
      </div>

      <button onClick={onUpgrade}
        style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid rgba(226,195,107,0.3)', background: 'rgba(226,195,107,0.08)', color: 'rgba(226,195,107,0.85)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
        Upgrade to remove limits →
      </button>
    </div>
  )
}

// ═══ SECTION 4 — PriceColumn ═══
// Only purchasable (locked) services appear in the price column.
// coming_soon services are excluded — no checkbox, no price.

interface PriceRow {
  id:     string
  label:  string
  status: 'active' | 'locked' | 'coming_soon'
  price?: { amount: number; symbol: string } | null
}

// ═══ SECTION 5 — Main ServicesTab component ═══

export default function ServicesTab({ capsule, approvedContributions, supabase, onUpgrade, eohEditor, onToggleFlag }: ServicesTabProps) {
  const [unlocking,       setUnlocking]       = useState<string | null>(null)
  const [featurePrices,   setFeaturePrices]   = useState<Record<string, { amount: number; symbol: string } | null>>({})
  const [cart,            setCart]            = useState<string[]>([])
  const [cardHeights,     setCardHeights]     = useState<Record<string, number>>({})
  const [capacityAlert,   setCapacityAlert]   = useState<'none'|'friendly'|'recommend'|'strong'|'grace'>('none')
  const [recommendedPack, setRecommendedPack] = useState<string|null>(null)
  const [showSendModal,   setShowSendModal]   = useState(false)
  const [sendName,        setSendName]        = useState('')
  const [sendEmail,       setSendEmail]       = useState('')
  const [sending,         setSending]         = useState(false)
  const [sendResult,      setSendResult]      = useState<'success'|'error'|null>(null)

  const components = capsule.components ?? []

  // ── Price fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    const FEATURE_KEYS = [
      'audio_tributes', 'video_tributes', 'ways_to_honour',
      'publication', 'access_codes', 'additional_phase',
      // guest_management and attire excluded — coming_soon, no price needed yet
    ]
    fetch(`/api/regional-prices?features=${FEATURE_KEYS.join(',')}`)
      .then(r => r.json())
      .then(d => { if (d.features) setFeaturePrices(d.features) })
      .catch(() => {})
  }, [])

  // ── Card height tracking ────────────────────────────────────────────────────
  const handleHeightChange = (id: string, height: number) => {
    setCardHeights(prev => prev[id] === height ? prev : { ...prev, [id]: height })
  }

  // ── Capacity alert ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!capsule.id) return
    fetch(`/api/guests/capacity?capsule_id=${capsule.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.alert_level)    setCapacityAlert(d.alert_level)
        if (d.recommended_pack) setRecommendedPack(d.recommended_pack)
      })
      .catch(() => {})
  }, [capsule.id])

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const toggleCart = (featureId: string) => {
    if (components.includes(featureId)) return
    setCart(prev => prev.includes(featureId) ? prev.filter(f => f !== featureId) : [...prev, featureId])
  }

  const applyPreset = (presetId: 'essential' | 'signature') => {
    const presets: Record<string, string[]> = {
      essential: ['publication', 'audio_tributes', 'video_tributes', 'capsule_extend_3mo'],
      signature: ['publication', 'audio_tributes', 'video_tributes', 'access_codes', 'ways_to_honour', 'additional_phase', 'capsule_extend_3mo'],
    }
    // Only include features not already active on the capsule
    const toAdd = presets[presetId].filter(id => !components.includes(id))
    // Toggle: if all preset items already in cart, clear them; otherwise apply preset
    const allAlreadyInCart = toAdd.every(id => cart.includes(id))
    if (allAlreadyInCart) {
      setCart(prev => prev.filter(id => !toAdd.includes(id)))
    } else {
      setCart(toAdd)
    }
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

  const handleSendLink = async () => {
    if (!sendName.trim() || !sendEmail.includes('@') || cart.length === 0) return
    setSending(true); setSendResult(null)
    try {
      const res = await fetch('/api/checkout/send-payment-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id:    capsule.id,
          capsule_slug:  capsule.slug,
          feature_ids:   cart,
          payer_name:    sendName.trim(),
          payer_email:   sendEmail.trim().toLowerCase(),
          honouree_name: capsule.honouree_name,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSendResult('success')
      setSendName(''); setSendEmail('')
      setTimeout(() => { setShowSendModal(false); setSendResult(null) }, 2500)
    } catch { setSendResult('error') }
    setSending(false)
  }

  const accessCodesActive  = components.includes('access_codes')
  const eohActive          = components.includes('ways_to_honour')
  const publicationActive  = components.includes('publication')
  const audioActive        = components.includes('audio_tributes')
  const videoActive        = components.includes('video_tributes')

  // ── Price column rows ──────────────────────────────────────────────────────
  // RULE: coming_soon services are included for height alignment but get
  // no checkbox and no price. Organiser cannot add them to cart.
  const priceRows: PriceRow[] = [
    // coming_soon — Guest Management (not ready)
    { id: 'guest_management', label: 'Guest Management', status: 'coming_soon', price: null },
    { id: 'access_codes',     label: 'Access Codes',     status: accessCodesActive ? 'active' : 'locked', price: featurePrices['access_codes'] },
    { id: 'ways_to_honour',   label: 'Gift of Honour',   status: eohActive ? 'active' : 'locked',         price: featurePrices['ways_to_honour'] },
    { id: 'publication',      label: 'Publication',       status: publicationActive ? 'active' : 'locked', price: featurePrices['publication'] },
    // coming_soon — Fabric & Attire (spec incomplete)
    { id: 'attire',           label: 'Fabric & Attire',  status: 'coming_soon', price: null },
    { id: 'audio_tributes',   label: 'Voice Tributes',   status: audioActive ? 'active' : 'locked',       price: featurePrices['audio_tributes'] },
    { id: 'video_tributes',   label: 'Video Tributes',   status: videoActive ? 'active' : 'locked',       price: featurePrices['video_tributes'] },
  ]

  // Presets are available when publication is not yet active
  const showPresets = !publicationActive


  return (
    <div style={{ paddingBottom: cart.length > 0 ? '200px' : '16px' }}>

      {/* ── Page header ── */}
      {/* ECS: plain English, warm, no jargon. Tells organiser exactly what this page is for. */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(226,195,107,0.1)' }}>
        <p style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, margin: '0 0 6px', fontFamily: "'Playfair Display', serif" }}>
          Services & Add-ons
        </p>
        <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.7, margin: 0 }}>
          Your capsule comes with a set of tools already included at no charge. Below, you can add extra services
          that enhance your event — from a beautifully designed keepsake publication to voice and video tributes.
          Tap any service to learn more, then add what fits your occasion.
        </p>
      </div>

      {/* ── Limits bar — free tier only ── */}
      <LimitsBar capsuleId={capsule.id} onUpgrade={() => {}} />

      {/* ════ Always-on services — included with every capsule ════ */}
      <div style={{ marginBottom: '4px' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(226,195,107,0.4)', margin: '0 0 10px' }}>
          Included with your capsule — no charge
        </p>
        <ServiceCard id='exports' title='Programme Exports' description='Export tributes and Community Stories to clipboard' icon='⬇' status='always_on'>
          <ExportsSection contributions={approvedContributions} slug={capsule.slug} onToggleFlag={onToggleFlag} />
        </ServiceCard>
        <ServiceCard id='phases' title='Event Moments — D-Day Guest Capture' description='Manage programme phases · QR codes · Guest photo capture · Official photography' icon='◈' status='always_on'>
          <EventPhasesSection capsuleId={capsule.id} capsuleSlug={capsule.slug} />
        </ServiceCard>
        <ServiceCard id='live_wall' title='D-Day Live Wall' description='Full-screen real-time tribute display for your venue screen or projector' icon='◇' status='always_on'>
          <LiveWallSection capsuleSlug={capsule.slug} />
        </ServiceCard>
      </div>

      {/* ── Preset package buttons — sits directly above the add-ons they control ── */}
      {showPresets && (
        <div style={{ margin: '20px 0 12px', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(226,195,107,0.2)', background: 'rgba(226,195,107,0.04)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: textPrimary, margin: '0 0 4px' }}>
            Not sure what to pick?
          </p>
          <p style={{ fontSize: '11px', color: textSecondary, lineHeight: 1.65, margin: '0 0 12px' }}>
            Choose a ready-made package below — it will pre-select the right services for you. You can still adjust
            the selection before paying.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => applyPreset('essential')}
              style={{
                flex: 1, padding: '12px 10px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' as const,
                border: `1px solid ${cart.includes('publication') && !cart.includes('access_codes') ? 'rgba(226,195,107,0.7)' : 'rgba(226,195,107,0.2)'}`,
                background: cart.includes('publication') && !cart.includes('access_codes') ? 'rgba(226,195,107,0.1)' : 'rgba(255,255,255,0.02)',
              }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, margin: '0 0 2px' }}>Essential</p>
              <p style={{ fontSize: '9px', color: textFaint, margin: '0 0 6px' }}>Publication · Voice · Video</p>
              <p style={{ fontSize: '9px', fontWeight: 700, color: cart.includes('publication') && !cart.includes('access_codes') ? 'rgba(248,113,113,0.7)' : 'rgba(226,195,107,0.7)', margin: 0 }}>
                {cart.includes('publication') && !cart.includes('access_codes') ? '✕ Clear selection' : 'Select all →'}
              </p>
            </button>
            <button
              onClick={() => applyPreset('signature')}
              style={{
                flex: 1, padding: '12px 10px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' as const,
                border: `1px solid ${cart.includes('access_codes') && cart.includes('ways_to_honour') ? 'rgba(226,195,107,0.7)' : 'rgba(226,195,107,0.2)'}`,
                background: cart.includes('access_codes') && cart.includes('ways_to_honour') ? 'rgba(226,195,107,0.1)' : 'rgba(255,255,255,0.02)',
              }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, margin: '0 0 2px' }}>Signature</p>
              <p style={{ fontSize: '9px', color: textFaint, margin: '0 0 6px' }}>All Essential + Access · Honour</p>
              <p style={{ fontSize: '9px', fontWeight: 700, color: cart.includes('access_codes') && cart.includes('ways_to_honour') ? 'rgba(248,113,113,0.7)' : 'rgba(226,195,107,0.7)', margin: 0 }}>
                {cart.includes('access_codes') && cart.includes('ways_to_honour') ? '✕ Clear selection' : 'Select all →'}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ════ Purchasable add-ons ════ */}
      <div>
        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(226,195,107,0.4)', margin: '0 0 10px' }}>
          Add to your capsule
        </p>

        {/* Guest Management — coming_soon */}
        <ServiceCard id='guest_management' title='Guest Management & Seating' description='Guest list · RSVP · Table assignment · Seating' icon='◉' status='coming_soon' detailSummary='Full guest coordination — RSVPs, seating, VIP protocol. Coming soon.' />

        {/* Access Codes */}
        <ServiceCard id='access_codes' title='Access Code System' description='Personal entry codes · Usher check-in · Live arrivals' icon='🔐'
          status={accessCodesActive ? 'active' : 'locked'}
          externalLink={accessCodesActive ? `/manage/${capsule.slug}/access` : undefined}
          detailSummary='Give every guest a personal entry code. Ushers check guests in on any phone.'
          detailPoints={['Unique QR and numeric code per guest', 'Auto-email codes directly to guests', 'Print access passes for physical cards', 'Live arrivals dashboard with VVIP list']}>
          {!accessCodesActive && featurePrices['access_codes'] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: cart.includes('access_codes') ? gold : textSecondary }}>{featurePrices['access_codes'].symbol}{featurePrices['access_codes'].amount.toLocaleString()}</span>
              <button onClick={() => toggleCart('access_codes')} style={{ padding: '6px 16px', borderRadius: '8px', border: `1px solid ${cart.includes('access_codes') ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.15)'}`, background: cart.includes('access_codes') ? 'rgba(226,195,107,0.15)' : 'transparent', color: cart.includes('access_codes') ? gold : textFaint, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{cart.includes('access_codes') ? '✓ Added' : '+ Add'}</button>
            </div>
          )}
        </ServiceCard>

        {/* Gift of Honour */}
        <ServiceCard id='ways_to_honour' title='Gift of Honour' description='A dignified channel for guests to express financial support — private, tasteful' icon='✦'
          status={eohActive ? 'active' : 'locked'}
          detailSummary='A dignified, private channel for guests to send financial support. No transaction fees — LC handles no funds.'
          detailPoints={['Full privacy — amounts never shown publicly', 'Multiple payment channels supported', 'Daily digest email to family representative', 'No transaction fees — LC handles no funds']}>
          {eohEditor}
          {!eohActive && featurePrices['ways_to_honour'] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: cart.includes('ways_to_honour') ? gold : textSecondary }}>{featurePrices['ways_to_honour'].symbol}{featurePrices['ways_to_honour'].amount.toLocaleString()}</span>
              <button onClick={() => toggleCart('ways_to_honour')} style={{ padding: '6px 16px', borderRadius: '8px', border: `1px solid ${cart.includes('ways_to_honour') ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.15)'}`, background: cart.includes('ways_to_honour') ? 'rgba(226,195,107,0.15)' : 'transparent', color: cart.includes('ways_to_honour') ? gold : textFaint, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{cart.includes('ways_to_honour') ? '✓ Added' : '+ Add'}</button>
            </div>
          )}
        </ServiceCard>

        {/* Digital Capsule Publication */}
        <ServiceCard id='publication' title='Digital Capsule Publication' description='Curated commemorative PDF — arrange, preview, generate' icon='◎'
          status={publicationActive ? 'active' : 'locked'}
          externalLink={publicationActive ? `/manage/${capsule.slug}/publication` : undefined}
          detailSummary='Every tribute compiled into a beautifully designed keepsake PDF — arranged by you, distributed to all contributors in one click.'
          detailPoints={['Drag-and-drop arrangement in Publication Editor', 'Five professional design themes', 'One-click distribution to all contributors', 'Permanent download link for every recipient']}>
          {!publicationActive && featurePrices['publication'] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: cart.includes('publication') ? gold : textSecondary }}>{featurePrices['publication'].symbol}{featurePrices['publication'].amount.toLocaleString()}</span>
              <button onClick={() => toggleCart('publication')} style={{ padding: '6px 16px', borderRadius: '8px', border: `1px solid ${cart.includes('publication') ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.15)'}`, background: cart.includes('publication') ? 'rgba(226,195,107,0.15)' : 'transparent', color: cart.includes('publication') ? gold : textFaint, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{cart.includes('publication') ? '✓ Added' : '+ Add'}</button>
            </div>
          )}
        </ServiceCard>

        {/* Fabric & Attire — coming_soon */}
        <ServiceCard id='attire' title='Fabric & Attire' description='Showcase, orders, payments, dispatch lifecycle' icon='◐' status='coming_soon' detailSummary='Complete Aso-Ebi and dress code coordination — orders, payments, collection. Coming soon.' />

        {/* Voice Tributes */}
        <ServiceCard id='audio_tributes' title='Voice Tributes' description='Contributors record personal audio messages' icon='🎙'
          status={audioActive ? 'active' : 'locked'}
          detailSummary='Contributors record personal audio messages directly from their phone — no app needed.'
          detailPoints={['Works on any smartphone with a microphone', 'Up to 60 seconds per recording', 'Plays inline in tribute card', 'Same moderation queue as written tributes']}>
          {!audioActive && featurePrices['audio_tributes'] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: cart.includes('audio_tributes') ? gold : textSecondary }}>{featurePrices['audio_tributes'].symbol}{featurePrices['audio_tributes'].amount.toLocaleString()}</span>
              <button onClick={() => toggleCart('audio_tributes')} style={{ padding: '6px 16px', borderRadius: '8px', border: `1px solid ${cart.includes('audio_tributes') ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.15)'}`, background: cart.includes('audio_tributes') ? 'rgba(226,195,107,0.15)' : 'transparent', color: cart.includes('audio_tributes') ? gold : textFaint, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{cart.includes('audio_tributes') ? '✓ Added' : '+ Add'}</button>
            </div>
          )}
        </ServiceCard>

        {/* Video Tributes */}
        <ServiceCard id='video_tributes' title='Video Tributes' description='Contributors record or upload short video messages' icon='🎬'
          status={videoActive ? 'active' : 'locked'}
          detailSummary='Contributors record directly in the browser or upload a video file — plays inline in their tribute card.'
          detailPoints={['Record in browser or upload file', 'Up to 60 seconds per video', 'Plays inline in tribute card', 'Works on any device, no app required']}>
          {!videoActive && featurePrices['video_tributes'] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: cart.includes('video_tributes') ? gold : textSecondary }}>{featurePrices['video_tributes'].symbol}{featurePrices['video_tributes'].amount.toLocaleString()}</span>
              <button onClick={() => toggleCart('video_tributes')} style={{ padding: '6px 16px', borderRadius: '8px', border: `1px solid ${cart.includes('video_tributes') ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.15)'}`, background: cart.includes('video_tributes') ? 'rgba(226,195,107,0.15)' : 'transparent', color: cart.includes('video_tributes') ? gold : textFaint, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{cart.includes('video_tributes') ? '✓ Added' : '+ Add'}</button>
            </div>
          )}
        </ServiceCard>

      </div>

      {/* ════ Floating checkout bar ════ */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 50, padding: '12px 16px 12px', background: 'linear-gradient(to top, #0a0010 80%, transparent)', backdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto', borderRadius: '16px', border: '1px solid rgba(226,195,107,0.3)', background: 'linear-gradient(135deg, rgba(26,8,69,0.98), rgba(18,6,48,0.98))', padding: '14px 16px', boxShadow: '0 -4px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '12px' }}>
              {priceRows.filter(r => cart.includes(r.id)).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.25)' }}>
                  <span style={{ fontSize: '11px', color: gold, fontWeight: 600 }}>{r.label}</span>
                  {r.price && <span style={{ fontSize: '10px', color: goldMuted }}>{r.price.symbol}{r.price.amount.toLocaleString()}</span>}
                  <button onClick={() => toggleCart(r.id)} style={{ background: 'none', border: 'none', color: goldMuted, cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: 0, marginLeft: '2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '10px', color: textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Total</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: gold, lineHeight: 1.2 }}>
                  {priceRows.filter(r => cart.includes(r.id)).find(r => r.price?.symbol)?.price?.symbol ?? ''}
                  {priceRows.filter(r => cart.includes(r.id)).reduce((s, r) => s + (r.price?.amount ?? 0), 0).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setShowSendModal(true)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(226,195,107,0.25)', background: 'transparent', color: goldMuted, fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>✉ Link</button>
              <button onClick={handleCartCheckout} disabled={unlocking === 'cart'} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845', fontSize: '14px', fontWeight: 800, cursor: unlocking === 'cart' ? 'not-allowed' : 'pointer', letterSpacing: '0.04em', opacity: unlocking === 'cart' ? 0.7 : 1, flexShrink: 0 }}>
                {unlocking === 'cart' ? '…' : 'Pay →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Payment Link modal ── */}
      {showSendModal && (
        <div style={{ position: 'fixed' as const, inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(10,0,20,0.75)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '380px', borderRadius: '16px', background: 'linear-gradient(160deg,#1a0845,#120630)', border: '1px solid rgba(226,195,107,0.25)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ height: '2px', background: 'linear-gradient(to right,transparent,#E2C36B,transparent)' }} />
            <div style={{ padding: '20px 20px 24px' }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', fontWeight: 700, color: '#E2C36B', margin: '0 0 6px' }}>Send a Payment Link</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Send a personalised payment link — they pay directly, and the services activate on your capsule instantly.</p>
              {sendResult === 'success' ? (
                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' as const }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: '0 0 4px' }}>✓ Payment link sent</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>They'll receive an email with the payment button shortly.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '9px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their name</label>
                    <input style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.2)', color: 'rgba(255,255,255,0.92)', fontSize: '13px', outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' as const }} placeholder='Who is paying?' value={sendName} onChange={e => setSendName(e.target.value)} maxLength={80} autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: '9px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their email</label>
                    <input type='email' style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.2)', color: 'rgba(255,255,255,0.92)', fontSize: '13px', outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' as const }} placeholder='Where should we send the link?' value={sendEmail} onChange={e => setSendEmail(e.target.value)} maxLength={120} />
                  </div>
                  {sendResult === 'error' && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', margin: 0 }}>Something went wrong. Please try again.</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={handleSendLink} disabled={sending || !sendName.trim() || !sendEmail.includes('@')} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: sendName.trim() && sendEmail.includes('@') ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.06)', color: sendName.trim() && sendEmail.includes('@') ? '#1a0845' : 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? 'Sending…' : '✉ Send Payment Link'}</button>
                    <button onClick={() => { setShowSendModal(false); setSendName(''); setSendEmail(''); setSendResult(null) }} style={{ padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
