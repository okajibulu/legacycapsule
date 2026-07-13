'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessMetricsDashboard.tsx
// PURPOSE: Live event arrival metrics dashboard. Auto-refreshes every 15 seconds.
//          Shows total arrivals, tier breakdown, outstanding VVIPs, arrival trend.
//          Step 8 of LC-ACCESS-001 component build.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports & types
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'

interface Metrics {
  total_expected:     number
  total_arrived:      number
  arrival_percentage: number
  vvip_expected:      number
  vvip_arrived:       number
  vip_expected:       number
  vip_arrived:        number
  general_expected:   number
  general_arrived:    number
  vendor_expected:    number
  vendor_arrived:     number
  capacity:           number | null
  fill_percentage:    number | null
  outstanding_vvip:   { name: string; special_note: string | null }[]
  arrival_trend:      { window_start: string; count: number }[]
  recent_arrivals:    { name: string; tier: string; arrived_at: string }[]
  invalid_attempts:   number
  manual_overrides:   number
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const gold = '#E2C36B', goldMuted = 'rgba(226,195,107,0.55)', cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)', textPrimary = 'rgba(255,255,255,0.92)', textFaint = 'rgba(255,255,255,0.28)'

const TIER_COLOR: Record<string, string> = {
  vvip: '#F5D97A', vip: '#E2C36B', general: 'rgba(255,255,255,0.55)',
  reception_only: 'rgba(139,159,212,0.8)', staff: 'rgba(126,200,164,0.8)',
  media: 'rgba(180,160,216,0.8)', vendor: 'rgba(255,255,255,0.35)',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Component
// ─────────────────────────────────────────────────────────────────────────────

export function AccessMetricsDashboard({ capsuleId }: { capsuleId: string }) {
  const [metrics,   setMetrics]   = useState<Metrics | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res  = await fetch(`/api/access-codes/metrics?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (res.ok) { setMetrics(data); setLastFetch(new Date()) }
    } catch {}
    setLoading(false)
  }, [capsuleId])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 15000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  if (loading) return <p style={{ fontSize: '12px', color: textFaint, padding: '12px 0' }}>Loading live metrics…</p>
  if (!metrics) return <p style={{ fontSize: '12px', color: textFaint }}>No data yet.</p>

  return (
    <div>
      {/* ── Last updated ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0 }}>Live Arrivals Dashboard</p>
        <p style={{ fontSize: '9px', color: textFaint, margin: 0 }}>
          {lastFetch ? `Updated ${lastFetch.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''} · Refreshes every 15s
        </p>
      </div>

      {/* ── Main counter ── */}
      <div style={{ padding: '20px', borderRadius: '14px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.05)', textAlign: 'center' as const, marginBottom: '14px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.14em' }}>Arrived</p>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '48px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{metrics.total_arrived}</span>
          <span style={{ fontSize: '20px', color: textFaint }}>/ {metrics.total_expected}</span>
        </div>
        <div style={{ marginTop: '12px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(metrics.arrival_percentage, 100)}%`, background: 'linear-gradient(90deg,#E2C36B,#C8A84A)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '11px', color: textFaint }}>{metrics.arrival_percentage}% of expected guests</p>
        {metrics.capacity && <p style={{ margin: '4px 0 0', fontSize: '10px', color: textFaint }}>{metrics.fill_percentage}% venue capacity</p>}
      </div>

      {/* ── Tier breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: 'VVIP', arrived: metrics.vvip_arrived, expected: metrics.vvip_expected, tier: 'vvip' },
          { label: 'VIP',  arrived: metrics.vip_arrived,  expected: metrics.vip_expected,  tier: 'vip'  },
          { label: 'General', arrived: metrics.general_arrived, expected: metrics.general_expected, tier: 'general' },
          { label: 'Vendor', arrived: metrics.vendor_arrived, expected: metrics.vendor_expected, tier: 'vendor' },
        ].map(t => (
          <div key={t.label} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${t.arrived > 0 ? 'rgba(226,195,107,0.15)' : 'rgba(255,255,255,0.05)'}`, background: cardBg }}>
            <p style={{ margin: '0 0 6px', fontSize: '10px', color: TIER_COLOR[t.tier], fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{t.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: textPrimary }}>{t.arrived}</span>
              <span style={{ fontSize: '12px', color: textFaint }}>/ {t.expected}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Outstanding VVIPs ── */}
      {metrics.outstanding_vvip.length > 0 && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(245,217,122,0.3)', background: 'rgba(245,217,122,0.06)', marginBottom: '14px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#F5D97A', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Outstanding VVIPs ({metrics.outstanding_vvip.length})</p>
          {metrics.outstanding_vvip.map((v, i) => (
            <div key={i} style={{ marginBottom: i < metrics.outstanding_vvip.length - 1 ? '6px' : 0 }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#F5D97A', fontWeight: 600 }}>{v.name}</p>
              {v.special_note && <p style={{ margin: '1px 0 0', fontSize: '10px', color: textFaint }}>{v.special_note}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Recent arrivals ── */}
      {metrics.recent_arrivals.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '8px' }}>Recent Arrivals</p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
            {metrics.recent_arrivals.map((a, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid rgba(255,255,255,0.04)`, background: cardBg, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: TIER_COLOR[a.tier] ?? textFaint, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: textPrimary }}>{a.name}</p>
                  <p style={{ margin: 0, fontSize: '9px', color: textFaint }}>{new Date(a.arrived_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Anomaly indicators ── */}
      {(metrics.invalid_attempts > 0 || metrics.manual_overrides > 0) && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          {metrics.invalid_attempts > 0 && (
            <div style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.05)', textAlign: 'center' as const }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'rgba(248,113,113,0.8)' }}>{metrics.invalid_attempts}</p>
              <p style={{ margin: 0, fontSize: '9px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Invalid Attempts</p>
            </div>
          )}
          {metrics.manual_overrides > 0 && (
            <div style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.15)`, background: cardBg, textAlign: 'center' as const }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: goldMuted }}>{metrics.manual_overrides}</p>
              <p style={{ margin: 0, fontSize: '9px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Manual Overrides</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
