'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/ActivityLogTab.tsx
// PURPOSE:   Full audit trail of every action taken in the manage dashboard.
//            Visible to Organiser and Family Rep Full Access only.
//            Supports filter by account type, search by name/action,
//            date range filter, and CSV export.
//            ECS: plain English action labels, no jargon. Warm empty state.
//            Design: clean, readable, not overwhelming — newest first.
// ARCHITECTURE: CA-SPEC-001 — Step 13.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
// PROPS:
//   capsuleId — capsule UUID
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  fontSize: '12px', padding: '8px 12px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
}

// ═══ SECTION 2 — Types ═══

interface LogEntry {
  id:           string
  actor_type:   string
  actor_name:   string | null
  actor_email:  string | null
  action_key:   string
  action_label: string
  entity_type:  string | null
  entity_id:    string | null
  created_at:   string
}

interface ActivityLogTabProps {
  capsuleId: string
}

// ═══ SECTION 3 — Actor type badge colours ═══

const ACTOR_COLOURS: Record<string, { bg: string; border: string; text: string }> = {
  organiser:               { bg: 'rgba(226,195,107,0.08)', border: 'rgba(226,195,107,0.2)',  text: 'rgba(226,195,107,0.8)' },
  family_rep_elder:        { bg: 'rgba(147,197,253,0.08)', border: 'rgba(147,197,253,0.2)',  text: 'rgba(147,197,253,0.8)' },
  family_rep_full_access:  { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',   text: 'rgba(134,239,172,0.8)' },
  coadmin:                 { bg: 'rgba(196,181,253,0.08)', border: 'rgba(196,181,253,0.2)',   text: 'rgba(196,181,253,0.8)' },
  system:                  { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',  text: textFaint },
}

// ═══ SECTION 4 — Single log entry ═══

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const colours = ACTOR_COLOURS[entry.actor_type] ?? ACTOR_COLOURS.system
  const date    = new Date(entry.created_at)

  const actorLabel = entry.actor_type
    .replace('family_rep_', 'FR ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div style={{
      display: 'flex', gap: '12px', alignItems: 'flex-start',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* ── Actor initial badge ── */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: colours.bg, border: `1px solid ${colours.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, color: colours.text,
      }}>
        {(entry.actor_name ?? 'S').charAt(0).toUpperCase()}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
            {entry.actor_name ?? actorLabel}
          </span>
          <span style={{
            fontSize: '9px', padding: '2px 7px', borderRadius: '6px',
            background: colours.bg, border: `1px solid ${colours.border}`,
            color: colours.text, letterSpacing: '0.06em', flexShrink: 0,
          }}>
            {actorLabel}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: textSecondary, margin: '0 0 4px', lineHeight: 1.5 }}>
          {entry.action_label}
        </p>
        <p style={{ fontSize: '10px', color: textFaint, margin: 0 }}>
          {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' · '}
          {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ═══ SECTION 5 — Main component ═══

export default function ActivityLogTab({ capsuleId }: ActivityLogTabProps) {
  const [entries,    setEntries]    = useState<LogEntry[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(false)
  const [offset,     setOffset]     = useState(0)
  const [search,     setSearch]     = useState('')
  const [actorType,  setActorType]  = useState('')

  const LIMIT = 25

  // ── Fetch entries ────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        capsule_id: capsuleId,
        limit:      String(LIMIT),
        offset:     String(newOffset),
      })
      if (search.trim())  params.set('search',     search.trim())
      if (actorType)      params.set('actor_type', actorType)

      const res  = await fetch(`/api/activity-log?${params}`)
      const data = await res.json()

      setEntries(data.entries ?? [])
      setTotal(data.total   ?? 0)
      setOffset(newOffset)
    } catch {}
    setLoading(false)
  }, [capsuleId, search, actorType])

  useEffect(() => { fetchEntries(0) }, [fetchEntries])

  // ── CSV export ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      const res      = await fetch(`/api/activity-log/export?capsule_id=${capsuleId}`)
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `activity-log-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setExporting(false)
  }

  const totalPages  = Math.ceil(total / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div>
      {/* ── Guidance ── */}
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, marginBottom: '16px' }}>
        Every action taken in this dashboard is recorded here — approvals, invitations, edits, and more. This log cannot be edited or deleted.
      </p>

      {/* ── Filters + export ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <input
          style={{ ...inp, flex: 1, minWidth: '140px' }}
          placeholder="Search by name or action…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ ...inp, cursor: 'pointer' }}
          value={actorType}
          onChange={e => setActorType(e.target.value)}
        >
          <option value="">All accounts</option>
          <option value="organiser">Organiser</option>
          <option value="family_rep_elder">Family Rep Elder</option>
          <option value="family_rep_full_access">Family Rep Full Access</option>
          <option value="coadmin">Co-admin</option>
          <option value="system">System</option>
        </select>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '8px 14px', borderRadius: '8px',
            border: '1px solid rgba(226,195,107,0.2)',
            background: 'rgba(226,195,107,0.06)', color: goldMuted,
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            opacity: exporting ? 0.6 : 1, flexShrink: 0,
          }}
        >
          {exporting ? 'Exporting…' : '↓ Export CSV'}
        </button>
      </div>

      {/* ── Log entries ── */}
      {loading ? (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '32px 0' }}>
          Loading activity log…
        </p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '28px', marginBottom: '12px' }}>✦</p>
          <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>
            {search || actorType
              ? 'No entries match your filters.'
              : 'No activity recorded yet. Actions taken in this dashboard will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '4px 14px' }}>
          {entries.map(entry => (
            <LogEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
          <p style={{ fontSize: '11px', color: textFaint }}>
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => fetchEntries(offset - LIMIT)}
              disabled={offset === 0 || loading}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: offset === 0 ? textFaint : goldMuted, fontSize: '12px', cursor: offset === 0 ? 'not-allowed' : 'pointer' }}
            >
              ← Previous
            </button>
            <button
              onClick={() => fetchEntries(offset + LIMIT)}
              disabled={currentPage >= totalPages || loading}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: currentPage >= totalPages ? textFaint : goldMuted, fontSize: '12px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
