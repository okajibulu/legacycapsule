'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftCoordinatorDashboard.tsx
// PURPOSE:    Coordinator-scoped gift collection dashboard
//             Shows: own block stats, guest list with entitlements, delivery status
//             Coordinator sees ONLY their assigned block — no other blocks visible
// SPEC:       GCS-SPEC-001-AMD-001 Section 1.6 + AMD-002 Phase 6 Step 22
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.23
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'

const REFRESH_INTERVAL_MS = 30_000


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface CredentialRow {
  id:               string
  guest_name:       string
  guest_category:   string | null
  numeric_code:     string
  collection_status: string
  delivery_sent_at: string | null
  unable_to_collect: boolean
  is_blocked:       boolean
  entitlements:     {
    id:                string
    quantity_entitled: number
    quantity_collected: number
    item_name:         string
  }[]
}

interface GiftCoordinatorDashboardProps {
  capsuleId:   string
  accountId:   string
  accountName: string
}


// ═══ SECTION 2 — Status badge ═══════════════════════════════════════════════════

function StatusBadge({ status, unable, blocked }: {
  status:  string
  unable:  boolean
  blocked: boolean
}) {
  if (blocked)                    return <span className="text-xs text-red-400 bg-red-400/10 rounded px-2 py-0.5">Blocked</span>
  if (unable)                     return <span className="text-xs text-white/40 bg-white/5 rounded px-2 py-0.5">Unable</span>
  if (status === 'collected')     return <span className="text-xs text-emerald-400 bg-emerald-400/10 rounded px-2 py-0.5">Collected</span>
  if (status === 'partial')       return <span className="text-xs text-amber-400 bg-amber-400/10 rounded px-2 py-0.5">Partial</span>
  return <span className="text-xs text-white/30 bg-white/5 rounded px-2 py-0.5">Pending</span>
}


// ═══ SECTION 3 — Credential row ════════════════════════════════════════════════

function CredentialRow({
  cred,
  onSend,
  sending,
}: {
  cred:    CredentialRow
  onSend:  (id: string) => void
  sending: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const isSending = sending === cred.id

  return (
    <div className="border-b border-white/5 last:border-0">
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Code */}
        <span className="text-[#E2C36B] font-mono font-bold text-sm shrink-0 w-10 text-center">
          {cred.numeric_code}
        </span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{cred.guest_name}</p>
          {cred.guest_category && (
            <p className="text-white/30 text-xs">{cred.guest_category}</p>
          )}
        </div>

        {/* Delivery indicator */}
        <span className={`text-xs shrink-0 ${cred.delivery_sent_at ? 'text-emerald-400/60' : 'text-white/20'}`}>
          {cred.delivery_sent_at ? '✓ Sent' : 'Not sent'}
        </span>

        {/* Status */}
        <StatusBadge
          status={cred.collection_status}
          unable={cred.unable_to_collect}
          blocked={cred.is_blocked}
        />

        {/* Chevron */}
        <svg className={`w-4 h-4 text-white/20 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3 bg-white/[0.02] space-y-2 border-t border-white/5">

          {/* Entitlements */}
          {cred.entitlements.length > 0 && (
            <div className="pt-2">
              <p className="text-white/30 text-xs mb-1.5">Gift entitlements:</p>
              {cred.entitlements.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-white/60">{e.item_name}</span>
                  <span className="text-white/40">
                    {e.quantity_collected}/{e.quantity_entitled} collected
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Send credential button */}
          {!cred.delivery_sent_at && !cred.is_blocked && cred.collection_status === 'uncollected' && (
            <button
              onClick={e => { e.stopPropagation(); onSend(cred.id) }}
              disabled={isSending}
              className="w-full mt-1 py-2 text-xs border border-[#E2C36B]/30 text-[#E2C36B]
                         rounded-lg hover:bg-[#E2C36B]/10 disabled:opacity-40 transition-colors"
            >
              {isSending ? 'Sending…' : 'Send Credential by Email'}
            </button>
          )}
          {cred.delivery_sent_at && (
            <button
              onClick={e => { e.stopPropagation(); onSend(cred.id) }}
              disabled={isSending}
              className="w-full mt-1 py-1.5 text-xs border border-white/10 text-white/30
                         rounded-lg hover:text-white/50 disabled:opacity-40 transition-colors"
            >
              {isSending ? 'Sending…' : 'Resend Credential'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}


// ═══ SECTION 4 — Guest list ══════════════════════════════════════════════════════

function GuestList({
  credentials,
  onSend,
  sending,
}: {
  credentials: CredentialRow[]
  onSend:      (id: string) => void
  sending:     string | null
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'collected' | 'issues'>('all')

  const filtered = credentials.filter(c => {
    if (filter === 'pending')   return c.collection_status === 'uncollected' && !c.unable_to_collect
    if (filter === 'collected') return c.collection_status === 'collected'
    if (filter === 'issues')    return c.unable_to_collect || c.is_blocked || c.collection_status === 'partial'
    return true
  })

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
          {(['all', 'pending', 'collected', 'issues'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors capitalize ${
                filter === f ? 'bg-[#E2C36B] text-[#0a061a] font-semibold' : 'text-white/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <p className="text-center text-white/30 text-sm py-8">No guests in this view</p>
      ) : (
        <div>
          {filtered.map(cred => (
            <CredentialRow key={cred.id} cred={cred} onSend={onSend} sending={sending} />
          ))}
        </div>
      )}
    </div>
  )
}


// ═══ SECTION 5 — Main component ════════════════════════════════════════════════

export default function GiftCoordinatorDashboard({
  capsuleId,
  accountId,
  accountName,
}: GiftCoordinatorDashboardProps) {
  const [credentials, setCredentials] = useState<CredentialRow[]>([])
  const [blockInfo,   setBlockInfo]   = useState<{ block_name: string; range_start: number; range_end: number; codes_issued: number; codes_collected: number } | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [sending,     setSending]     = useState<string | null>(null)


  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      // Fetch metrics (coordinator scope)
      const metricsRes = await fetch(`/api/gift/metrics?capsule_id=${capsuleId}&scope=coordinator`)
      const metricsData = await metricsRes.json()

      if (metricsData.coordinator_block) {
        setBlockInfo(metricsData.coordinator_block)
      }

      // Fetch credentials for this coordinator
      const credsRes  = await fetch(`/api/gift/credentials?capsule_id=${capsuleId}&coordinator_id=${accountId}`)
      const credsData = await credsRes.json()

      setCredentials(credsData.credentials ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [capsuleId, accountId])

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(() => loadDashboard(true), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadDashboard])


  async function handleSend(credentialId: string) {
    try {
      setSending(credentialId)
      await fetch('/api/gift/credential/deliver', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    capsuleId,
          credential_id: credentialId,
          is_resend:     credentials.find(c => c.id === credentialId)?.delivery_sent_at != null,
        }),
      })
      setCredentials(prev => prev.map(c =>
        c.id === credentialId ? { ...c, delivery_sent_at: new Date().toISOString() } : c
      ))
    } catch {
      // Silent — UI remains usable
    } finally {
      setSending(null)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-7 h-7 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={() => loadDashboard()} className="text-[#E2C36B] text-sm hover:underline">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Block header */}
      {blockInfo && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
          <p className="text-white/40 text-xs tracking-wider uppercase mb-1">Your Block</p>
          <p className="text-white font-semibold text-lg">{blockInfo.block_name}</p>
          <p className="text-white/40 text-sm mt-0.5">
            Codes {String(blockInfo.range_start).padStart(3, '0')} — {String(blockInfo.range_end).padStart(3, '0')}
          </p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-white/5 text-sm">
            <div>
              <p className="text-white font-semibold">{blockInfo.codes_issued}</p>
              <p className="text-white/30 text-xs">Issued</p>
            </div>
            <div>
              <p className="text-emerald-400 font-semibold">{blockInfo.codes_collected}</p>
              <p className="text-white/30 text-xs">Collected</p>
            </div>
            <div>
              <p className="text-white/60 font-semibold">{blockInfo.codes_issued - blockInfo.codes_collected}</p>
              <p className="text-white/30 text-xs">Outstanding</p>
            </div>
          </div>
        </div>
      )}

      {/* Guest list */}
      {credentials.length > 0 ? (
        <GuestList credentials={credentials} onSend={handleSend} sending={sending} />
      ) : (
        <div className="text-center py-10 text-white/30 text-sm">
          No guest credentials in your block yet.
        </div>
      )}

    </div>
  )
}
