// components/promo/LaunchPromoBanner.tsx
// LegacyCapsule — Launch Promo Awareness Banner
// AI29 · Claude Opus 4.6 · 25 September 2026
//
// ─── BUILT BY ──────────────────────────────────────────────────────────────
// AI29 · Claude Opus 4.6 · 25 September 2026
// ─── UPDATE HISTORY ────────────────────────────────────────────────────────
// AI29 · 25 Sep 2026 · Initial build — promo counter banner + inline chip
//   Rewrote from Tailwind className to LC inline-style design system
// ───────────────────────────────────────────────────────────────────────────
//
// ─── PURPOSE ───────────────────────────────────────────────────────────────
// Reusable banner that fetches the live promo counter and renders
// a scarcity-aware awareness message. Slots into:
//   - Homepage (below hero)
//   - Booking flow (Screen 3 — services selector)
//   - ServicesTab (manage dashboard — above services list)
//
// Renders nothing if no promo is active or promo is sold out.
// Uses 60s cached API endpoint — no DB hit per render.
//
// ─── SECTIONS ──────────────────────────────────────────────────────────────
//   1. Types
//   2. Design tokens (matches LC gold/dark palette)
//   3. usePromoCounter hook
//   4. LaunchPromoBanner — full banner component
//   5. LaunchPromoInline — compact chip variant (ServicesTab heading)
// ───────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect, useState } from 'react'

// ── 1. Types ──────────────────────────────────────────────────────────────

interface PromoCounter {
  active:        boolean
  label?:        string
  claimed?:      number
  limit?:        number | null
  remaining?:    number | null
  pct?:          number | null
  discount_pct?: number | null
  sold_out?:     boolean
}

// ── 2. Design tokens ─────────────────────────────────────────────────────

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const goldBorder   = 'rgba(226,195,107,0.25)'
const goldBarBg    = 'rgba(226,195,107,0.15)'
const textOnDark   = 'rgba(255,255,255,0.90)'
const textSub      = 'rgba(255,255,255,0.60)'
const cardBg       = 'rgba(226,195,107,0.06)'

// ── 3. usePromoCounter hook ───────────────────────────────────────────────

function usePromoCounter() {
  const [promo,   setPromo]   = useState<PromoCounter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounter() {
      try {
        const res  = await fetch('/api/promo/counter')
        const data = await res.json()
        setPromo(data)
      } catch {
        setPromo({ active: false })
      } finally {
        setLoading(false)
      }
    }
    fetchCounter()
  }, [])

  return { promo, loading }
}

// ── 4. LaunchPromoBanner — full banner ────────────────────────────────────

type BannerContext = 'homepage' | 'booking' | 'services' | 'generic'

interface LaunchPromoBannerProps {
  context?:   BannerContext
  style?:     React.CSSProperties
}

export function LaunchPromoBanner({
  context = 'generic',
  style   = {},
}: LaunchPromoBannerProps) {
  const { promo, loading } = usePromoCounter()

  if (loading || !promo?.active || promo.sold_out) return null

  const claimed   = promo.claimed   ?? 0
  const limit     = promo.limit     ?? null
  const remaining = promo.remaining ?? null
  const discPct   = promo.discount_pct ?? 50

  const urgency =
    remaining !== null && remaining <= 5
      ? 'critical'
      : remaining !== null && remaining <= 15
      ? 'high'
      : 'normal'

  const headlines: Record<string, string> = {
    normal:   `🎉 Launch offer — ${discPct}% off for our first ${limit} customers`,
    high:     `⚡ Only ${remaining} launch spots left — ${discPct}% off everything`,
    critical: `🔥 ${remaining} spot${remaining === 1 ? '' : 's'} remaining — don't miss the launch price`,
  }

  const subCopy: Record<BannerContext, string> = {
    homepage: 'Create a capsule today and lock in your launch price before it\'s gone.',
    booking:  'This discount applies to everything in your order — applied automatically at checkout.',
    services: 'Launch pricing is active — all add-ons are at 50% off for you.',
    generic:  'Join our first families and get 50% off every feature.',
  }

  const barWidth = limit ? Math.min(100, Math.round((claimed / limit) * 100)) : 0

  return (
    <div
      style={{
        borderRadius:    '14px',
        border:          `1px solid ${goldBorder}`,
        background:      cardBg,
        padding:         '16px',
        ...style,
      }}
      role="region"
      aria-label="Launch pricing offer"
    >
      {/* ── Headline ── */}
      <p style={{
        fontSize:   '14px',
        fontWeight: 700,
        color:      gold,
        margin:     '0 0 4px',
        lineHeight: 1.4,
      }}>
        {headlines[urgency]}
      </p>

      {/* ── Sub-copy ── */}
      <p style={{
        fontSize:   '12px',
        color:      textSub,
        margin:     0,
        lineHeight: 1.6,
      }}>
        {subCopy[context]}
      </p>

      {/* ── Progress bar ── */}
      {limit !== null && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            fontSize:       '11px',
            color:          goldMuted,
            marginBottom:   '6px',
          }}>
            <span>{claimed} of {limit} launch spots claimed</span>
            {remaining !== null && (
              <span style={{ fontWeight: 700 }}>{remaining} remaining</span>
            )}
          </div>
          <div style={{
            height:       '6px',
            width:        '100%',
            borderRadius: '99px',
            background:   goldBarBg,
            overflow:     'hidden',
          }}>
            <div
              style={{
                height:       '6px',
                width:        `${barWidth}%`,
                borderRadius: '99px',
                background:   gold,
                transition:   'width 0.5s ease',
              }}
              role="progressbar"
              aria-valuenow={barWidth}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── 5. LaunchPromoInline — compact chip ───────────────────────────────────

interface LaunchPromoInlineProps {
  style?: React.CSSProperties
}

export function LaunchPromoInline({ style = {} }: LaunchPromoInlineProps) {
  const { promo, loading } = usePromoCounter()

  if (loading || !promo?.active || promo.sold_out) return null

  const remaining = promo.remaining ?? null
  const discPct   = promo.discount_pct ?? 50

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      borderRadius: '99px',
      background:   goldFaint,
      border:       `1px solid ${goldBorder}`,
      padding:      '2px 10px',
      fontSize:     '10px',
      fontWeight:   700,
      color:        goldMuted,
      letterSpacing:'0.04em',
      ...style,
    }}>
      <span>🏷️</span>
      <span>
        {discPct}% launch discount
        {remaining !== null && remaining <= 10 && ` · ${remaining} left`}
      </span>
    </span>
  )
}

export default LaunchPromoBanner
