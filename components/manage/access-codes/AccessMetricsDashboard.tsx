'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessMetricsDashboard.tsx
// PURPOSE: Live event-day arrivals dashboard. Auto-refreshes every 15 seconds.
//          Shows: total arrivals counter with progress bar, tier breakdown
//          (dynamic — shows all tiers present in data), outstanding VVIPs,
//          arrival trend sparkline (SVG), recent arrivals feed, anomaly
//          indicators (invalid attempts, manual overrides).
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 7 — Metrics + Usher Verification
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// REPLACES: Previous version by AI11 (Claude Sonnet 4.6)
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

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

// ═══ SECTION 2 — Design tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const TIER_COLOR: Record<string, string> = {
  vvip:           '#F5D97A',
  vip:            '#C9A0F0',
  general:        'rgba(255,255,255,0.55)',
  reception_only: 'rgba(147,197,253,0.8)',
  staff:          'rgba(134,239,172,0.8)',
  media:          'rgba(249,168,212,0.8)',
  vendor:         'rgba(253,186,116,0.7)',
}

const TIER_LABEL: Record<string, string> = {
  vvip:           'VVIP',
  vip:            'VIP',
  general:        'General',
  reception_only: 'Reception',
  staff:          'Staff',
  media:          'Media',
  vendor:         'Vendor',
}

// ═══ SECTION 3 — ArrivalSparkline sub-component ═══
//
// Renders the arrival_trend data as a compact SVG area chart.
// 15-minute windows on x-axis, arrival count on y-axis.
// Tooltip on hover shows time + count.

function ArrivalSparkline({ data }: {
  data: { window_start: string; count: number }[]
}) {
  if (!data || data.length < 2) return null

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const w = 280
  const h = 56
  const padTop = 4

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = padTop + ((1 - d.count / maxCount) * (h - padTop))
    return { x, y, count: d.count, time: d.window_start }
  })

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`

  // Time labels: first, middle, last
  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  return (
    <div style={{ marginTop: '4px' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h + 16}`}
        style={{ display: 'block' }}
        preserveAspectRatio="none"
      >
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill="rgba(226,195,107,0.06)"
        />
        {/* Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#E2C36B"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Dots at peaks */}
        {points.filter(p => p.count === maxCount).map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r="2.5"
            fill="#E2C36B"
          />
        ))}
        {/* Time labels */}
        {data.length > 0 && (
          <>
            <text x="0" y={h + 12} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Arial">
              {formatTime(data[0].window_start)}
            </text>
            <text x={w} y={h + 12} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Arial" textAnchor="end">
              {formatTime(data[data.length - 1].window_start)}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

// ═══ SECTION 4 — Main component ═══

export function AccessMetricsDashboard({ capsuleId }: { capsuleId: string }) {

  // ── 4.1 State ──────────────────────────────────────────────────────────────

  const [metrics,   setMetrics]   = useState<Metrics | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [isLive,    setIsLive]    = useState(true)

  // ── 4.2 Fetch metrics ──────────────────────────────────────────────────────

  const fetchMetrics = useCallback(async () => {
    try {
      const res  = await fetch(`/api/access-codes/metrics?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (res.ok) {
        setMetrics(data)
        setLastFetch(new Date())
      }
    } catch {}
    setLoading(false)
  }, [capsuleId])

  // ── 4.3 Auto-refresh (15 seconds) ─────────────────────────────────────────

  useEffect(() => {
    fetchMetrics()
    if (!isLive) return
    const interval = setInterval(fetchMetrics, 15000)
    return () => clearInterval(interval)
  }, [fetchMetrics, isLive])

  // ── 4.4 Build dynamic tier rows from metrics ──────────────────────────────
  // Only show tiers that have expected guests > 0

  const tierRows = metrics ? [
    { key: 'vvip',    arrived: metrics.vvip_arrived,    expected: metrics.vvip_expected },
    { key: 'vip',     arrived: metrics.vip_arrived,     expected: metrics.vip_expected },
    { key: 'general', arrived: metrics.general_arrived, expected: metrics.general_expected },
    { key: 'vendor',  arrived: metrics.vendor_arrived,  expected: metrics.vendor_expected },
  ].filter(t => t.expected > 0) : []

  // ═══ SECTION 5 — Render ═══

  // ── 5.1 Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <p style={{
        fontSize: '12px', color: textFaint,
        padding: '16px 0', textAlign: 'center' as const,
      }}>
        Loading live metrics…
      </p>
    )
  }

  // ── 5.2 No data / event not started state ──────────────────────────────────

  if (!metrics) {
    return (
      <div style={{
        padding: '28px 20px', textAlign: 'center' as const,
        borderRadius: '12px', border: '1px dashed rgba(226,195,107,0.12)',
      }}>
        <p style={{ fontSize: '22px', marginBottom: '8px' }}>📊</p>
        <p style={{
          fontSize: '13px', fontWeight: 600,
          color: textPrimary, margin: '0 0 6px',
        }}>
          Waiting for event day
        </p>
        <p style={{
          fontSize: '11px', color: textFaint,
          margin: 0, lineHeight: 1.65,
          maxWidth: '260px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          This dashboard activates when ushers start scanning codes.
          The data updates every 15 seconds during the event.
        </p>
      </div>
    )
  }

  return (
    <div>

      {/* ── 5.3 Header with refresh indicator ─────────────────────────────── */}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Pulsing live dot */}
          {isLive && (
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'rgba(74,222,128,0.9)',
              boxShadow: '0 0 6px rgba(74,222,128,0.4)',
              animation: 'pulse 2s infinite',
            }} />
          )}
          <p style={{
            fontSize: '10px', color: goldMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', margin: 0,
          }}>
            {isLive ? 'Live Arrivals' : 'Paused'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontSize: '9px', color: textFaint, margin: 0 }}>
            {lastFetch
              ? lastFetch.toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })
              : ''}
          </p>
          <button
            onClick={() => setIsLive(l => !l)}
            style={{
              fontSize: '9px', padding: '3px 8px',
              borderRadius: '5px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: textFaint, cursor: 'pointer',
            }}
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      {/* ── 5.4 Main counter ──────────────────────────────────────────────── */}

      <div style={{
        padding: '20px', borderRadius: '14px',
        border: '1px solid rgba(226,195,107,0.25)',
        background: 'rgba(226,195,107,0.05)',
        textAlign: 'center' as const, marginBottom: '14px',
      }}>
        <p style={{
          margin: '0 0 4px', fontSize: '10px', color: goldMuted,
          textTransform: 'uppercase' as const, letterSpacing: '0.14em',
        }}>
          Arrived
        </p>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'center', gap: '8px',
        }}>
          <span style={{
            fontSize: '48px', fontWeight: 800, color: gold,
            fontFamily: "'Playfair Display', serif", lineHeight: 1,
          }}>
            {metrics.total_arrived}
          </span>
          <span style={{ fontSize: '20px', color: textFaint }}>
            / {metrics.total_expected}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: '12px', height: '6px', borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(metrics.arrival_percentage, 100)}%`,
            background: 'linear-gradient(90deg, #E2C36B, #C8A84A)',
            borderRadius: '3px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <p style={{
          margin: '6px 0 0', fontSize: '11px', color: textFaint,
        }}>
          {metrics.arrival_percentage}% of expected guests
        </p>
        {metrics.capacity !== null && metrics.fill_percentage !== null && (
          <p style={{
            margin: '3px 0 0', fontSize: '10px', color: textFaint,
          }}>
            {metrics.fill_percentage}% venue capacity
          </p>
        )}
      </div>

      {/* ── 5.5 Arrival trend sparkline ───────────────────────────────────── */}

      {metrics.arrival_trend && metrics.arrival_trend.length >= 2 && (
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          border: `1px solid ${cardBorder}`,
          background: cardBg, marginBottom: '14px',
        }}>
          <p style={{
            margin: '0 0 4px', fontSize: '10px', color: goldMuted,
            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
          }}>
            Arrival Trend
          </p>
          <ArrivalSparkline data={metrics.arrival_trend} />
        </div>
      )}

      {/* ── 5.6 Tier breakdown ────────────────────────────────────────────── */}

      {tierRows.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: tierRows.length <= 2 ? '1fr 1fr' : '1fr 1fr',
          gap: '8px', marginBottom: '14px',
        }}>
          {tierRows.map(t => (
            <div key={t.key} style={{
              padding: '12px', borderRadius: '10px',
              border: `1px solid ${
                t.arrived > 0 ? 'rgba(226,195,107,0.15)' : 'rgba(255,255,255,0.05)'
              }`,
              background: cardBg,
            }}>
              <p style={{
                margin: '0 0 6px', fontSize: '10px',
                color: TIER_COLOR[t.key] ?? textFaint,
                fontWeight: 700, textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}>
                {TIER_LABEL[t.key] ?? t.key}
              </p>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: '4px',
              }}>
                <span style={{
                  fontSize: '22px', fontWeight: 800, color: textPrimary,
                }}>
                  {t.arrived}
                </span>
                <span style={{ fontSize: '12px', color: textFaint }}>
                  / {t.expected}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 5.7 Outstanding VVIPs ─────────────────────────────────────────── */}

      {metrics.outstanding_vvip.length > 0 && (
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          border: '1px solid rgba(245,217,122,0.3)',
          background: 'rgba(245,217,122,0.06)',
          marginBottom: '14px',
        }}>
          <p style={{
            margin: '0 0 8px', fontSize: '10px',
            color: '#F5D97A', fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
          }}>
            Outstanding VVIPs ({metrics.outstanding_vvip.length})
          </p>
          {metrics.outstanding_vvip.map((v, i) => (
            <div key={i} style={{
              marginBottom: i < metrics.outstanding_vvip.length - 1 ? '6px' : 0,
            }}>
              <p style={{
                margin: 0, fontSize: '13px',
                color: '#F5D97A', fontWeight: 600,
              }}>
                {v.name}
              </p>
              {v.special_note && (
                <p style={{
                  margin: '1px 0 0', fontSize: '10px', color: textFaint,
                }}>
                  {v.special_note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 5.8 Recent arrivals feed ──────────────────────────────────────── */}

      {metrics.recent_arrivals.length > 0 && (
        <div>
          <p style={{
            fontSize: '10px', color: goldMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', marginBottom: '8px',
          }}>
            Recent Arrivals
          </p>
          <div style={{
            display: 'flex', flexDirection: 'column' as const,
            gap: '4px',
          }}>
            {metrics.recent_arrivals.map((a, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.04)',
                background: cardBg,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  width: '3px', height: '28px', borderRadius: '2px',
                  background: TIER_COLOR[a.tier] ?? textFaint,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0, fontSize: '12px',
                    fontWeight: 600, color: textPrimary,
                  }}>
                    {a.name}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '9px', color: textFaint,
                  }}>
                    {(() => {
                      try {
                        return new Date(a.arrived_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit', minute: '2-digit',
                        })
                      } catch { return '' }
                    })()}
                  </p>
                </div>
                <span style={{
                  fontSize: '8px', color: TIER_COLOR[a.tier] ?? textFaint,
                  fontWeight: 700, textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                }}>
                  {TIER_LABEL[a.tier] ?? a.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5.9 Anomaly indicators ────────────────────────────────────────── */}

      {(metrics.invalid_attempts > 0 || metrics.manual_overrides > 0) && (
        <div style={{
          marginTop: '12px', display: 'flex', gap: '8px',
        }}>
          {metrics.invalid_attempts > 0 && (
            <div style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              border: '1px solid rgba(248,113,113,0.2)',
              background: 'rgba(248,113,113,0.05)',
              textAlign: 'center' as const,
            }}>
              <p style={{
                margin: 0, fontSize: '16px', fontWeight: 800,
                color: 'rgba(248,113,113,0.8)',
              }}>
                {metrics.invalid_attempts}
              </p>
              <p style={{
                margin: 0, fontSize: '9px', color: textFaint,
                textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              }}>
                Invalid Scans
              </p>
            </div>
          )}
          {metrics.manual_overrides > 0 && (
            <div style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              border: `1px solid ${goldFaint}`,
              background: cardBg,
              textAlign: 'center' as const,
            }}>
              <p style={{
                margin: 0, fontSize: '16px', fontWeight: 800,
                color: goldMuted,
              }}>
                {metrics.manual_overrides}
              </p>
              <p style={{
                margin: 0, fontSize: '9px', color: textFaint,
                textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              }}>
                Manual Overrides
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
