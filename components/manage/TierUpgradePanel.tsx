'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/TierUpgradePanel.tsx
// PURPOSE:   Manage dashboard panel showing contribution tier status and
//            upgrade prompts at 60/80/95/100% of voice ceiling.
//            ECS: tone is celebratory at lower levels, urgent only near full.
//            Never alarming — always frames growth as success.
//            Reads from /api/capsule/limits — same source as LimitsBar.
// ARCHITECTURE: LC04 Payment Engine — Sprint 3.
// BUILT BY:  AI20 · Claude Opus 4.6
// VERSION:   AI20v2.12.01
// DATE:      13 August 2026
// PROPS: capsuleId, capsuleSlug, honoureeName
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ═══ SECTION 1 — Types ═══

interface TierData {
  is_free_tier:      boolean
  contribution_tier: string
  voice_ceiling:     number | null
  wall_status:       'open' | 'warning_60' | 'warning_80' | 'warning_95' | 'full'
  voices: {
    combined: { used: number; limit: number | null; pct: number | null }
    tributes: { used: number; limit: number | null }
    stories:  { used: number; limit: number | null }
  }
}

// ═══ SECTION 2 — Tier label helper ═══

const TIER_LABELS: Record<string, string> = {
  free:             'Free',
  foundation_150v:  'Foundation-150V',
  growing_350v:     'Growing-350V',
  flourishing_700v: 'Flourishing-700V',
  grand_1500v:      'Grand-1500V',
  estate_v:         'Estate-∞V',
}

const NEXT_TIER: Record<string, string | null> = {
  free:             'foundation_150v',
  foundation_150v:  'growing_350v',
  growing_350v:     'flourishing_700v',
  flourishing_700v: 'grand_1500v',
  grand_1500v:      'estate_v',
  estate_v:         null,
}

const NEXT_TIER_PRICE_KEY: Record<string, string | null> = {
  free:             'capsule_activation_base',
  foundation_150v:  'contribution_tier_growing_350v',
  growing_350v:     'contribution_tier_flourishing_700v',
  flourishing_700v: 'contribution_tier_grand_1500v',
  grand_1500v:      'contribution_tier_estate_v',
  estate_v:         null,
}

// ═══ SECTION 3 — Main component ═══

interface TierUpgradePanelProps {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
}

export default function TierUpgradePanel({
  capsuleId,
  capsuleSlug,
  honoureeName,
}: TierUpgradePanelProps) {
  const [data,    setData]    = useState<TierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    fetch(`/api/capsule/limits?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capsuleId])

  if (loading) return null

  // Only show when wall_status is not 'open' — hidden when all is well
  // Exception: always show if wall is full
  if (!data) return null
  if (data.wall_status === 'open' && !data.is_free_tier) return null

  const {
    contribution_tier,
    voice_ceiling,
    wall_status,
    voices,
  } = data

  const tierLabel     = TIER_LABELS[contribution_tier] ?? contribution_tier
  const nextTier      = NEXT_TIER[contribution_tier]
  const nextTierLabel = nextTier ? TIER_LABELS[nextTier] : null
  const priceKey      = NEXT_TIER_PRICE_KEY[contribution_tier]
  const voicesUsed    = voices.combined.used
  const tributesUsed  = voices.tributes.used
  const storiesUsed   = voices.stories.used
  const ceiling       = voice_ceiling
  const remaining     = ceiling !== null ? Math.max(0, ceiling - voicesUsed) : null
  const pct           = voices.combined.pct ?? 0

  // ── Tone varies by wall status ────────────────────────────────────────────
  const isFull      = wall_status === 'full'
  const isNear      = wall_status === 'warning_95'
  const isWarning   = wall_status === 'warning_80'
  const isGrowing   = wall_status === 'warning_60' || data.is_free_tier

  const borderColour = isFull || isNear
    ? 'rgba(248,113,113,0.3)'
    : isWarning
    ? 'rgba(251,191,36,0.3)'
    : 'rgba(226,195,107,0.2)'

  const bgColour = isFull || isNear
    ? 'rgba(248,113,113,0.04)'
    : isWarning
    ? 'rgba(251,191,36,0.04)'
    : 'rgba(226,195,107,0.03)'

  const barColour = isFull
    ? 'rgba(248,113,113,0.8)'
    : isNear
    ? 'rgba(251,191,36,0.8)'
    : isWarning
    ? 'rgba(251,191,36,0.6)'
    : 'rgba(134,239,172,0.7)'

  // ── Headline and body copy — ECS: frame growth as success ─────────────────
  const headline = isFull
    ? `${honoureeName}'s capsule has reached its current capacity`
    : isNear
    ? `${honoureeName}'s capsule is almost full — ${remaining} voices remaining`
    : isWarning
    ? `${honoureeName}'s capsule is thriving — time to expand`
    : `${honoureeName}'s capsule is growing beautifully`

  const body = isFull
    ? `New contributions are paused until you upgrade. ${voicesUsed} voices received — ${tributesUsed} tributes · ${storiesUsed} stories. Upgrade to re-open the wall immediately.`
    : isNear
    ? `${voicesUsed} of ${ceiling} voices received (${tributesUsed} tributes · ${storiesUsed} stories). Upgrade now to keep the wall open as more people arrive.`
    : isWarning
    ? `${voicesUsed} of ${ceiling} voices received (${tributesUsed} tributes · ${storiesUsed} stories). Expanding your capacity now means no interruption when more voices arrive.`
    : `${voicesUsed} of ${ceiling ?? '—'} voices so far (${tributesUsed} tributes · ${storiesUsed} stories). When the time feels right, the next level is ready.`

  const ctaLabel = isFull
    ? `Upgrade to ${nextTierLabel ?? 'next tier'} — Re-open now`
    : isNear
    ? `Expand to ${nextTierLabel ?? 'next tier'} →`
    : `See ${nextTierLabel ?? 'next tier'} →`

  const handleUpgrade = async () => {
    if (!priceKey || upgrading) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/checkout/bundle', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id:   capsuleId,
          capsule_slug: capsuleSlug,
          feature_ids:  [priceKey],
          source:       'dashboard',
        }),
      })
      const d = await res.json()
      if (d.checkout_url) window.location.href = d.checkout_url
    } catch {
      setUpgrading(false)
    }
  }

  // ═══ SECTION 4 — Render ═══

  return (
    <div style={{
      borderRadius: '14px',
      border: `1px solid ${borderColour}`,
      background: bgColour,
      padding: '16px 18px',
      marginBottom: '16px',
    }}>
      {/* ── Tier badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(226,195,107,0.55)' }}>
            {tierLabel}
          </span>
          {ceiling === null && (
            <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.2)', color: 'rgba(134,239,172,0.8)' }}>
              Unlimited
            </span>
          )}
        </div>
        {ceiling !== null && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: isFull ? 'rgba(248,113,113,0.8)' : isNear ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.5)' }}>
            {voicesUsed} / {ceiling}
          </span>
        )}
      </div>

      {/* ── Progress bar ── */}
      {ceiling !== null && (
        <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: '3px', background: barColour, transition: 'width 0.4s ease' }} />
        </div>
      )}

      {/* ── Headline ── */}
      <p style={{ fontSize: '12px', fontWeight: 700, color: isFull ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.85)', marginBottom: '6px', lineHeight: 1.4 }}>
        {headline}
      </p>

      {/* ── Body ── */}
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: nextTierLabel ? '14px' : 0 }}>
        {body}
      </p>

      {/* ── CTA ── */}
      {nextTierLabel && priceKey && (
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: isFull || isNear
              ? 'linear-gradient(135deg,#E2C36B,#C9A84E)'
              : 'rgba(226,195,107,0.1)',
            color: isFull || isNear ? '#1a0845' : 'rgba(226,195,107,0.85)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: upgrading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
            opacity: upgrading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {upgrading ? 'Preparing checkout…' : ctaLabel}
        </button>
      )}

      {/* ── Estate — no further upgrade needed ── */}
      {!nextTierLabel && ceiling === null && (
        <p style={{ fontSize: '10px', color: 'rgba(134,239,172,0.6)', textAlign: 'center' as const, fontStyle: 'italic' }}>
          Estate-∞V — unlimited voices. No further upgrade needed.
        </p>
      )}
    </div>
  )
}
