/**
 * ============================================================
 * FILE PATH: components/manage/ServicesTab.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Services Tab — replaces the Exports tab in the manage page.
 * Central hub for all premium add-on services.
 *
 * Services shown:
 *   - Programme Exports (always available — inline)
 *   - Expression of Honour / EOH (premium gate — inline)
 *   - Event Phases (always available — inline)
 *   - Guest Management + Tables (premium gate — inline)
 *   - Digital Publication (premium gate — external link)
 *   - Fabric & Attire (premium gate — external link)
 *   - Access Codes / Check-in (coming soon)
 *
 * Sub-sections:
 *   1. Types + imports
 *   2. ServiceCard — expandable service card with gateway
 *   3. ExportsSection — inline exports (was ExportsTab)
 *   4. Main ServicesTab component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types + imports
// ============================================================

import { useState, useEffect } from 'react'
import Link from 'next/link'
 
import EventPhasesSection from '@/components/manage/EventPhasesSection'
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
const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.12)'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

// ============================================================
// SECTION 2 — ServiceCard
// ============================================================

interface ServiceCardProps {
  id: string
  title: string
  description: string
  icon: string
  status: 'active' | 'locked' | 'coming_soon' | 'always_on'
  externalLink?: string
  children?: React.ReactNode
  onUnlock?: () => void
  price?: { amount: number; symbol: string } | null
  inCart?: boolean
  detailSummary?: string
  detailPoints?: string[]
  learnMoreUrl?: string
}

function ServiceCard({ id, title, description, icon, status, externalLink, children, onUnlock, price, detailSummary, detailPoints, learnMoreUrl, inCart }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isInteractive = status === 'active' || status === 'always_on'
  const isLocked = status === 'locked'
  const isExpandable = (isInteractive && !!children && !externalLink) || (isLocked && !!detailSummary)

  const handleClick = () => {
    if (isExpandable) setExpanded(e => !e)
  }

  return (
    <div style={{
      borderRadius: '14px',
      border: `1px solid ${status === 'active' || status === 'always_on' ? cardBorder : 'rgba(255,255,255,0.05)'}`,
      background: status === 'active' || status === 'always_on' ? cardBg : 'rgba(255,255,255,0.01)',
      marginBottom: '10px',
      overflow: 'hidden',
      opacity: status === 'coming_soon' ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      {/* Card header */}
      <div
        onClick={handleClick}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: isExpandable ? 'pointer' : 'default' }}
      >
        {/* Icon */}
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isInteractive ? goldFaint : 'rgba(255,255,255,0.04)', border: `1px solid ${isInteractive ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: isInteractive ? textPrimary : textFaint, margin: 0 }}>{title}</p>
          <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{description}</p>
        </div>

        {/* Right action */}
        <div style={{ flexShrink: 0 }}>
          {status === 'always_on' && isExpandable && (
            <span style={{ fontSize: '10px', color: goldMuted }}>{expanded ? '▲' : '▼'}</span>
          )}
          {status === 'active' && externalLink && (
            <Link href={externalLink} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: goldFaint, border: `1px solid rgba(226,195,107,0.25)`, color: gold, textDecoration: 'none' }}>Open →</Link>
          )}
          {status === 'active' && isExpandable && (
            <span style={{ fontSize: '10px', color: goldMuted }}>{expanded ? '▲' : '▼'}</span>
          )}
          {status === 'locked' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              {price && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: inCart ? 'rgba(134,239,172,0.9)' : gold }}>
                  {price.symbol}{price.amount.toLocaleString()}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={onUnlock} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${inCart ? 'rgba(134,239,172,0.35)' : 'rgba(226,195,107,0.2)'}`, background: inCart ? 'rgba(134,239,172,0.08)' : 'transparent', color: inCart ? 'rgba(134,239,172,0.9)' : goldMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {inCart ? '✓ In Cart' : '🔒 Add to Cart'}
                </button>
                {detailSummary && (
                  <span style={{ fontSize: '10px', color: goldMuted }}>{expanded ? '▲' : '▼'}</span>
                )}
              </div>
            </div>
          )}
          {status === 'coming_soon' && (
            <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', color: textFaint, letterSpacing: '0.08em' }}>Soon</span>
          )}
        </div>
      </div>

      {/* Expandable content — active services */}
      {expanded && children && !isLocked && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid rgba(255,255,255,0.04)`, paddingTop: '14px' }}>
          {children}
        </div>
      )}

      {/* Expandable detail panel — locked services */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
<button
                onClick={onUnlock}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: inCart ? 'rgba(134,239,172,0.08)' : `linear-gradient(135deg, rgba(226,195,107,0.2), rgba(226,195,107,0.1))`, border: `1px solid ${inCart ? 'rgba(134,239,172,0.35)' : 'rgba(226,195,107,0.3)'}`, color: inCart ? 'rgba(134,239,172,0.9)' : gold, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {inCart ? '✓ In Cart — Click to Remove' : '🛒 Add to Cart'}
              </button>
            {learnMoreUrl && (
              <Link
                href={learnMoreUrl}
                target="_blank"
                style={{ flexShrink: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: textFaint, fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Full details →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SECTION 3 — ExportsSection (was ExportsTab)
// ============================================================

function ExportsSection({ contributions, slug }: {
  contributions: Contribution[]; slug: string
}) {
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedProg, setCopiedProg] = useState(false)

  const programmeContribs = contributions.filter(c => c.include_in_programme_export === true)

  function formatTributes(list: Contribution[]): string {
    return list.map(c => {
      const location = [c.city, c.country].filter(Boolean).join(', ')
      const relationship = c.relationship ? ` · ${c.relationship}` : ''
      return ['---', c.contributor_name + (location ? `\n${location}${relationship}` : relationship ? `\n${relationship}` : ''), '', c.tribute_text].join('\n')
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
        <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center', fontStyle: 'italic' }}>
          Mark tributes for Programme Export in the Tributes tab.
        </p>
      )}
    </div>
  )
}

// ============================================================
// SECTION 4 — Main ServicesTab component
// ============================================================

export default function ServicesTab({ capsule, approvedContributions, supabase, onUpgrade, eohEditor }: ServicesTabProps) {
  const [tables, setTables] = useState<any[]>([])
  const [phases, setPhases] = useState<any[]>([])
  const [unlocking,    setUnlocking]    = useState<string | null>(null)
  const [featurePrices, setFeaturePrices] = useState<Record<string, { amount: number; symbol: string } | null>>({})
  const [cart,         setCart]         = useState<string[]>([])
  const components = capsule.components ?? []

  const toggleCart = (featureId: string) => {
    setCart(prev => prev.includes(featureId)
      ? prev.filter(f => f !== featureId)
      : [...prev, featureId]
    )
  }

  const cartTotal  = cart.reduce((sum, id) => sum + (featurePrices[id]?.amount ?? 0), 0)
  const cartSymbol = cart.length > 0 ? (featurePrices[cart.find(id => featurePrices[id]) ?? '']?.symbol ?? '') : ''

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

  const handleUnlock = async (featureId: string) => {
    setUnlocking(featureId)
    try {
      const res = await fetch('/api/checkout/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id: capsule.id,
          capsule_slug: capsule.slug,
          feature_id: featureId,
          organiser_email: '',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkout_url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.checkout_url
    } catch (err) {
      console.error('[ServicesTab] Unlock failed:', err)
      setUnlocking(null)
      onUpgrade()
    }
  }

  return (
    <div>

      {/* ── Programme Exports — always available ── */}
      <ServiceCard
        id="exports"
        title="Programme Exports"
        description="Unlocked with Digital Publication — export selected tributes and Community Stories to clipboard for printed programme booklets"
        icon="⬇"
        status="always_on"
      >
        <ExportsSection contributions={approvedContributions} slug={capsule.slug} />
      </ServiceCard>

      {/* ── Event Phases — always available (2 free) ── */}
      <ServiceCard
        id="phases"
        title="Event Phases"
        description="Manage ceremony phases · QR codes · D-Day capture"
        icon="◈"
        status="always_on"
      >
        <EventPhasesSection
          capsuleId={capsule.id}
          capsuleSlug={capsule.slug}
        />
      </ServiceCard>

      {/* ── Guest Management — gated ── */}
      <ServiceCard
        id="guests"
        title="Guest Management & Access Codes"
        description="Guest list · Unique access codes · Check-in tracking · Seating"
        icon="◉"
        status={components.includes('guest_management') ? 'active' : 'locked'}
        price={featurePrices['guest_management']}
        inCart={cart.includes('guest_management')}
        onUnlock={() => toggleCart('guest_management')}
        detailSummary="A complete guest coordination system — build your list, send access codes, track RSVPs, manage check-in on the day, and assign seating. All from your phone."
        detailPoints={['Unique QR access codes generated per guest', 'Real-time check-in dashboard on event day', 'Table management and seating assignment', 'Bulk invite sending to your entire guest list']}
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

      {/* ── Expression of Honour — gated ── */}
      <ServiceCard
        id="eoh"
        title="Gift of Honour"
        description="A dignified channel for guests to express financial support — private, tasteful"
        icon="✦"
        status={components.includes('ways_to_honour') ? 'active' : 'locked'}
        price={featurePrices['ways_to_honour']}
        inCart={cart.includes('ways_to_honour')}
        onUnlock={() => toggleCart('ways_to_honour')}
        detailSummary="A dignified, private channel for guests to send financial support — bank details presented tastefully on your tribute wall. A daily midnight digest keeps the family informed."
        detailPoints={['Full privacy — amounts never shown publicly', 'Multiple payment channels supported', 'Daily digest email to family representative at midnight', 'No transaction fees — LegacyCapsule handles no funds']}
        learnMoreUrl="/features/ways_to_honour"
      >
        {eohEditor}
      </ServiceCard>

      {/* ── Digital Publication — gated, external ── */}
      <ServiceCard
        id="publication"
        title="Digital Publication"
        description="Curated commemorative PDF — arrange, preview, generate"
        icon="◎"
        status={components.includes('publication') ? 'active' : 'locked'}
        externalLink={`/manage/${capsule.slug}/publication`}
        price={featurePrices['publication']}
        inCart={cart.includes('publication')}
        onUnlock={() => toggleCart('publication')}
        detailSummary="Every tribute compiled into a beautifully designed keepsake PDF — arranged by you, distributed to all contributors in one click. A permanent record designed to be kept."
        detailPoints={['Full drag-and-drop arrangement in Publication Editor', 'Five professional design themes', 'One-click distribution to all contributors', 'Permanent download link for every recipient']}
        learnMoreUrl="/features/publication"
      />

      {/* ── Fabric & Attire — gated, external ── */}
      <ServiceCard
        id="attire"
        title="Fabric & Attire"
        description="Showcase, orders, payments, dispatch lifecycle"
        icon="◐"
        status={components.includes('attire') ? 'active' : 'locked'}
        externalLink={`/manage/${capsule.slug}/attire`}
        price={featurePrices['attire']}
        inCart={cart.includes('attire')}
        onUnlock={() => toggleCart('attire')}
        detailSummary="Complete dress code coordination — showcase fabric options, collect orders, track payments, manage collection. Designed for Aso-Ebi and coordinated event attire."
        detailPoints={['Showcase multiple fabric options with photos and pricing', 'Order and payment tracking in one dashboard', 'Collection management and dispatch reminders', 'Guest-facing order page on your tribute wall']}
        learnMoreUrl="/features/attire"
      />

      {/* ── Voice Tributes — gated ── */}
      <ServiceCard
        id="audio_tributes"
        title="Voice Tributes"
        description="Contributors record personal audio messages"
        icon="🎙"
        status={components.includes('audio_tributes') ? 'active' : 'locked'}
        price={featurePrices['audio_tributes']}
        inCart={cart.includes('audio_tributes')}
        onUnlock={() => toggleCart('audio_tributes')}
        detailSummary="Contributors record personal audio messages directly from their phone — no app needed. The sound of a familiar voice carries meaning that text alone cannot."
        detailPoints={['Works on any smartphone or computer with a microphone', 'Up to 2 minutes per recording', 'Plays inline in the tribute card — no download required', 'Same moderation queue as written tributes']}
        learnMoreUrl="/features/audio_tributes"
      />

      {/* ── Video Tributes — gated ── */}
      <ServiceCard
        id="video_tributes"
        title="Video Tributes"
        description="Contributors upload short video messages"
        icon="🎬"
        status={components.includes('video_tributes') ? 'active' : 'locked'}
        price={featurePrices['video_tributes']}
        inCart={cart.includes('video_tributes')}
        onUnlock={() => toggleCart('video_tributes')}
        detailSummary="Contributors upload short video messages that play directly in their tribute card. A face, a voice, an expression — the most personal tribute of all."
        detailPoints={['Record on phone camera, upload directly in the form', 'Up to 60 seconds per video', 'Plays inline — no external links or redirects', 'Works on any device, no app required']}
        learnMoreUrl="/features/video_tributes"
      />

      {/* ── D-Day Live Wall — coming soon ── */}
      <ServiceCard
        id="live_wall"
        title="D-Day Live Wall"
        description="Real-time tribute display at your venue"
        icon="◇"
        status="coming_soon"
      />

      {/* ── Access Card Printing — coming soon ── */}
      <ServiceCard
        id="access_cards"
        title="Access Card Printing"
        description="Branded physical access cards with embedded QR codes"
        icon="▣"
        status="coming_soon"
      />

      {/* ── Cart summary bar ── */}
      {cart.length > 0 && (
        <div style={{ position: 'sticky', bottom: '72px', zIndex: 30, margin: '12px 0 0' }}>
          <div style={{ padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(134,239,172,0.3)', background: 'rgba(15,10,30,0.96)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
                {cart.length} service{cart.length !== 1 ? 's' : ''} selected
              </p>
              {cartTotal > 0 && (
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(134,239,172,0.8)' }}>
                  Total: {cartSymbol}{cartTotal.toLocaleString()}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setCart([])}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                Clear
              </button>
              <button onClick={handleCartCheckout} disabled={unlocking === 'cart'}
                style={{ fontSize: '12px', fontWeight: 700, padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', cursor: 'pointer', opacity: unlocking === 'cart' ? 0.7 : 1 }}>
                {unlocking === 'cart' ? 'Preparing…' : `Checkout →`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
