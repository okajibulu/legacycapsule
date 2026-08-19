'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftFRFAConsole.tsx
// PURPOSE:    Organiser / FRFA live collection dashboard
//             — Summary bar (issued, collected %, partial, outstanding, unable)
//             — Per-item inventory breakdown
//             — Per-block coordinator breakdown
//             — Stand overview strip (active sessions, dispatched counts)
//             — Recent collections feed
//             — Alert panel (unable, partial, blocked, over-subscribed)
//             Auto-refreshes every 30 seconds.
// SPEC:       GCS-SPEC-001 Part Eight + AMD-002 Phase 6 Steps 23–24
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.23
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'

const REFRESH_INTERVAL_MS = 30_000


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface Summary {
  total_issued:      number
  total_collected:   number
  total_partial:     number
  total_outstanding: number
  total_unable:      number
  total_blocked:     number
  pct_complete:      number
}

interface ItemBreakdown {
  id:             string
  item_name:      string
  category:       string | null
  qty_in_stock:   number
  qty_allocated:  number
  qty_collected:  number
  qty_exceptions: number
  qty_outstanding: number
  is_active:      boolean
}

interface BlockBreakdown {
  id:               string
  block_name:       string
  range_start:      number
  range_end:        number
  coordinator_name: string | null
  codes_issued:     number
  codes_collected:  number
  codes_outstanding: number
  codes_unable:     number
}

interface FeedEvent {
  id:          string
  event_type:  string
  actor_name:  string | null
  guest_name:  string | null
  stand_name:  string | null
  quantity:    number | null
  created_at:  string
}

interface StandSession {
  id:               string
  stand_name:       string
  staff_name:       string
  status:           string
  dispatched_count: number
  failed_count:     number
  session_start:    string
}

interface AlertCred {
  id:           string
  guest_name:   string
  numeric_code: string
  collection_status: string
  unable_reason: string | null
  block_reason:  string | null
}

interface MetricsData {
  summary:        Summary
  item_breakdown: ItemBreakdown[]
  block_breakdown: BlockBreakdown[]
  recent_feed:    FeedEvent[]
  stand_overview: StandSession[]
  alerts: {
    unable:          AlertCred[]
    partial:         AlertCred[]
    blocked:         AlertCred[]
    over_subscribed: { id: string; item_name: string; qty_in_stock: number; qty_allocated: number }[]
  } | null
  generated_at: string
}

interface GiftFRFAConsoleProps {
  capsuleId: string
}


// ═══ SECTION 2 — Summary stat card ═════════════════════════════════════════════

function StatCard({ label, value, sub, accent }: {
  label:  string
  value:  string | number
  sub?:   string
  accent?: 'gold' | 'green' | 'amber' | 'red'
}) {
  const valueColor = {
    gold:  'text-[#E2C36B]',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red:   'text-red-400',
  }[accent ?? 'gold'] ?? 'text-[#E2C36B]'

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <p className={`${valueColor} font-bold text-2xl leading-none`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
      <p className="text-white/40 text-xs mt-1.5">{label}</p>
    </div>
  )
}


// ═══ SECTION 3 — Summary bar ════════════════════════════════════════════════════

function SummaryBar({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      <StatCard label="Issued"      value={summary.total_issued} />
      <StatCard label="Collected"   value={summary.total_collected} sub={`${summary.pct_complete}%`} accent="green" />
      <StatCard label="Partial"     value={summary.total_partial}   accent="amber" />
      <StatCard label="Outstanding" value={summary.total_outstanding} />
      <StatCard label="Unable"      value={summary.total_unable}     accent="amber" />
      <StatCard label="Blocked"     value={summary.total_blocked}    accent="red" />
    </div>
  )
}


// ═══ SECTION 4 — Inventory breakdown table ══════════════════════════════════════

function InventoryTable({ items }: { items: ItemBreakdown[] }) {
  if (!items.length) return null
  const active = items.filter(i => i.is_active)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/5">
        <h3 className="text-white font-semibold text-sm">Gift Inventory</h3>
      </div>
      <div className="divide-y divide-white/5">
        {active.map(item => {
          const allocPct = item.qty_in_stock > 0
            ? Math.round((item.qty_allocated / item.qty_in_stock) * 100) : 0
          const collectPct = item.qty_in_stock > 0
            ? Math.round((item.qty_collected / item.qty_in_stock) * 100) : 0
          const isOver = item.qty_allocated > item.qty_in_stock

          return (
            <div key={item.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.item_name}</p>
                  {item.category && <p className="text-white/30 text-xs">{item.category}</p>}
                </div>
                <div className="text-right shrink-0 text-xs text-white/40 space-y-0.5">
                  <p><span className="text-white/60">{item.qty_collected}</span> / {item.qty_allocated} collected</p>
                  {item.qty_exceptions > 0 && <p className="text-amber-400">{item.qty_exceptions} exceptions</p>}
                  {isOver && <p className="text-red-400">⚠ Over-allocated</p>}
                </div>
              </div>
              {/* Stacked bar */}
              <div className="h-1.5 w-full rounded-full bg-white/10 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-[#E2C36B]/30 rounded-full"
                     style={{ width: `${Math.min(allocPct, 100)}%` }} />
                <div className="absolute left-0 top-0 h-full bg-[#E2C36B] rounded-full"
                     style={{ width: `${Math.min(collectPct, 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ═══ SECTION 5 — Block breakdown ════════════════════════════════════════════════

function BlockBreakdownTable({ blocks }: { blocks: BlockBreakdown[] }) {
  const assigned = blocks.filter(b => !b.coordinator_name)

  if (!blocks.length) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/5">
        <h3 className="text-white font-semibold text-sm">Coordinator Blocks</h3>
      </div>
      <div className="divide-y divide-white/5">
        {blocks.filter(b => b.coordinator_name).map(block => {
          const pct = block.codes_issued > 0
            ? Math.round((block.codes_collected / block.codes_issued) * 100) : 0
          return (
            <div key={block.id} className="px-5 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{block.block_name}</p>
                <p className="text-white/30 text-xs">
                  {block.coordinator_name} · {block.range_start}–{block.range_end}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-semibold">
                  {block.codes_collected}<span className="text-white/30 font-normal">/{block.codes_issued}</span>
                </p>
                <p className="text-white/30 text-xs">{pct}% done</p>
              </div>
              {block.codes_unable > 0 && (
                <span className="text-amber-400 text-xs bg-amber-400/10 rounded px-2 py-0.5 shrink-0">
                  {block.codes_unable} unable
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ═══ SECTION 6 — Stand overview strip ══════════════════════════════════════════

function StandOverviewStrip({ sessions }: { sessions: StandSession[] }) {
  if (!sessions.length) return null

  return (
    <div className="space-y-2">
      <h3 className="text-white/50 text-xs tracking-wider uppercase px-1">Active Stands</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sessions.map(s => (
          <div key={s.id} className={`shrink-0 rounded-xl border px-4 py-3 min-w-36 ${
            s.status === 'active'    ? 'border-emerald-500/20 bg-emerald-500/5' :
            s.status === 'suspended' ? 'border-amber-500/20  bg-amber-500/5'   :
            'border-white/10 bg-white/5 opacity-60'
          }`}>
            <p className="text-white font-medium text-sm truncate">{s.stand_name}</p>
            <p className="text-white/40 text-xs">{s.staff_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[#E2C36B] font-bold text-lg leading-none">{s.dispatched_count}</span>
              <span className="text-white/30 text-xs">dispatched</span>
            </div>
            {s.failed_count > 0 && (
              <p className="text-amber-400/70 text-xs mt-0.5">{s.failed_count} failed attempts</p>
            )}
            {s.status !== 'active' && (
              <p className={`text-xs mt-1 capitalize ${s.status === 'suspended' ? 'text-amber-400' : 'text-white/30'}`}>
                {s.status}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


// ═══ SECTION 7 — Recent collections feed ═══════════════════════════════════════

function CollectionsFeed({ events }: { events: FeedEvent[] }) {
  if (!events.length) return null

  function eventLabel(type: string) {
    switch (type) {
      case 'COLLECTION_COMPLETED': return { text: 'Collected',         color: 'text-emerald-400' }
      case 'PARTIAL_COLLECTION':   return { text: 'Partial',           color: 'text-amber-400'   }
      case 'UNABLE_TO_COLLECT':    return { text: 'Unable to collect', color: 'text-white/40'     }
      case 'ORGANISER_OVERRIDE':   return { text: 'Override',          color: 'text-[#E2C36B]'   }
      default:                     return { text: type,                color: 'text-white/40'     }
    }
  }

  function relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/5">
        <h3 className="text-white font-semibold text-sm">Recent Collections</h3>
      </div>
      <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
        {events.map(e => {
          const label = eventLabel(e.event_type)
          return (
            <div key={e.id} className="px-5 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{e.guest_name ?? '—'}</p>
                {e.stand_name && <p className="text-white/30 text-xs">{e.stand_name}</p>}
              </div>
              <span className={`${label.color} text-xs shrink-0`}>{label.text}</span>
              <span className="text-white/20 text-xs shrink-0">{relativeTime(e.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ═══ SECTION 8 — Alert panel ════════════════════════════════════════════════════

function AlertPanel({ alerts }: { alerts: NonNullable<MetricsData['alerts']> }) {
  const totalAlerts = alerts.unable.length + alerts.partial.length + alerts.blocked.length + alerts.over_subscribed.length
  if (!totalAlerts) return null

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-amber-500/10">
        <h3 className="text-amber-300 font-semibold text-sm">
          {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''} Requiring Attention
        </h3>
      </div>
      <div className="px-5 py-3.5 space-y-3">
        {alerts.over_subscribed.length > 0 && (
          <div>
            <p className="text-red-400 text-xs font-semibold mb-1">Over-allocated inventory:</p>
            {alerts.over_subscribed.map(i => (
              <p key={i.id} className="text-red-300/70 text-xs">
                "{i.item_name}" — {i.qty_allocated} allocated of {i.qty_in_stock} in stock
              </p>
            ))}
          </div>
        )}
        {alerts.unable.length > 0 && (
          <div>
            <p className="text-amber-400 text-xs font-semibold mb-1">Unable to collect ({alerts.unable.length}):</p>
            {alerts.unable.slice(0, 5).map(c => (
              <p key={c.id} className="text-amber-300/60 text-xs">
                {c.guest_name} · Code {c.numeric_code} · {c.unable_reason ?? '—'}
              </p>
            ))}
            {alerts.unable.length > 5 && (
              <p className="text-amber-300/40 text-xs">…and {alerts.unable.length - 5} more</p>
            )}
          </div>
        )}
        {alerts.partial.length > 0 && (
          <div>
            <p className="text-amber-400 text-xs font-semibold mb-1">Partially collected ({alerts.partial.length}):</p>
            {alerts.partial.slice(0, 5).map(c => (
              <p key={c.id} className="text-white/50 text-xs">{c.guest_name} · Code {c.numeric_code}</p>
            ))}
          </div>
        )}
        {alerts.blocked.length > 0 && (
          <div>
            <p className="text-red-400 text-xs font-semibold mb-1">Blocked codes ({alerts.blocked.length}):</p>
            {alerts.blocked.slice(0, 5).map(c => (
              <p key={c.id} className="text-red-300/60 text-xs">
                {c.guest_name} · Code {c.numeric_code} · {c.block_reason ?? '—'}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ═══ SECTION 9 — Main component ════════════════════════════════════════════════

export default function GiftFRFAConsole({ capsuleId }: GiftFRFAConsoleProps) {
  const [data,         setData]         = useState<MetricsData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [lastRefresh,  setLastRefresh]  = useState<Date | null>(null)
  const [refreshing,   setRefreshing]   = useState(false)

  const loadMetrics = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const res  = await fetch(`/api/gift/metrics?capsule_id=${capsuleId}&scope=organiser`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load metrics')
      setData(json)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [capsuleId])

  // Initial load + 30-second auto-refresh
  useEffect(() => {
    loadMetrics()
    const interval = setInterval(() => loadMetrics(true), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadMetrics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={() => loadMetrics()} className="text-[#E2C36B] text-sm hover:underline">Try again</button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-5">

      {/* Header + refresh indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">Collection Console</h2>
        <div className="flex items-center gap-2">
          {refreshing && (
            <div className="w-4 h-4 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
          )}
          <p className="text-white/25 text-xs">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
          <button
            onClick={() => loadMetrics(true)}
            className="text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <SummaryBar summary={data.summary} />

      {data.stand_overview.length > 0 && (
        <StandOverviewStrip sessions={data.stand_overview} />
      )}

      {data.alerts && <AlertPanel alerts={data.alerts} />}

      <InventoryTable items={data.item_breakdown} />

      <BlockBreakdownTable blocks={data.block_breakdown} />

      <CollectionsFeed events={data.recent_feed} />

    </div>
  )
}
