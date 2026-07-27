// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/guests/ActivityFeed.tsx
// PURPOSE:   Renders event_action_log as a readable timeline. Shared between
//            the organiser Guest Management page and the Circle Leader portal.
//            Each entry: icon, actor name, action description, timestamp.
//            Paginated with "Load more" button.
// BUILT BY:  AI15 (Claude Opus 4.6) · 26 July 2026
// VERSION:   v2.9.0
// DEPENDS ON:
//   - GET /api/event-log?capsule_id=X&circle_id=Y&limit=N&offset=M
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'

// ═══ SECTION 1 — Types ═══

interface ActivityFeedProps {
  capsuleId:  string
  circleId?:  string   // When provided, filters to a single circle (portal use)
}

interface LogEntry {
  id:          string
  actor_type:  string
  actor_name:  string
  action:      string
  target_type: string | null
  target_name: string | null
  metadata:    Record<string, any> | null
  created_at:  string
}

// ═══ SECTION 2 — Design tokens ═══

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const greenText     = 'rgba(134,239,172,0.9)'
const redText       = 'rgba(248,113,113,0.8)'
const amberText     = 'rgba(251,191,36,0.8)'

// ═══ SECTION 3 — Action icon + description map ═══

interface ActionDisplay {
  icon:  string
  color: string
  label: (entry: LogEntry) => string
}

const ACTION_MAP: Record<string, ActionDisplay> = {
  guest_created:     { icon: '＋', color: greenText,   label: e => `added ${e.target_name ?? 'a guest'}` },
  guest_updated:     { icon: '✎',  color: goldMuted,   label: e => `updated ${e.target_name ?? 'a guest'}` },
  guest_deleted:     { icon: '✕',  color: redText,     label: e => `removed ${e.target_name ?? 'a guest'}` },
  rsvp_sent:         { icon: '✉',  color: goldMuted,   label: e => `sent RSVP invitation to ${e.target_name ?? 'guest'}` },
  rsvp_responded:    { icon: '✓',  color: greenText,   label: e => {
    const status = e.metadata?.status ?? 'responded'
    return `${e.target_name ?? 'Guest'} RSVP: ${status}`
  }},
  rsvp_updated:      { icon: '↻',  color: amberText,   label: e => {
    const prev = e.metadata?.previous_status
    const next = e.metadata?.new_status
    return prev && next
      ? `updated ${e.target_name ?? 'guest'} RSVP from ${prev} to ${next}`
      : `updated ${e.target_name ?? 'guest'} RSVP status`
  }},
  rsvp_reminder:     { icon: '⟳',  color: goldMuted,   label: e => `sent reminder to ${e.target_name ?? 'guest'}` },
  circle_created:    { icon: '◉',  color: greenText,   label: e => `created circle "${e.target_name ?? ''}"` },
  circle_updated:    { icon: '✎',  color: goldMuted,   label: e => `updated circle "${e.target_name ?? ''}"` },
  circle_deleted:    { icon: '✕',  color: redText,     label: e => `deleted circle "${e.target_name ?? ''}"` },
  portal_sent:       { icon: '🔗', color: gold,         label: e => `sent portal link for "${e.target_name ?? ''}"` },
  guest_assigned:    { icon: '→',  color: goldMuted,   label: e => `assigned ${e.target_name ?? 'guest'} to a circle` },
  config_updated:    { icon: '⚙',  color: textSecondary, label: () => 'updated RSVP settings' },
  invite_batch:      { icon: '✉',  color: gold,         label: e => {
    const count = e.metadata?.count
    return count ? `sent ${count} invitation${count !== 1 ? 's' : ''}` : 'sent batch invitations'
  }},
}

const DEFAULT_ACTION: ActionDisplay = {
  icon: '•', color: textFaint, label: e => e.action.replace(/_/g, ' '),
}

// ═══ SECTION 4 — Relative time formatter ═══

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60)    return 'just now'
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })
}

// ═══ SECTION 5 — Actor badge ═══

function ActorBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    organiser:     { bg: 'rgba(226,195,107,0.1)', color: gold,        label: 'Organiser' },
    circle_leader: { bg: 'rgba(147,130,220,0.1)', color: 'rgba(167,139,250,0.8)', label: 'Leader' },
    guest:         { bg: 'rgba(74,222,128,0.06)', color: greenText,   label: 'Guest' },
    system:        { bg: 'rgba(255,255,255,0.04)', color: textFaint,  label: 'System' },
  }
  const c = config[type] ?? config.system
  return (
    <span style={{
      fontSize: '8px', fontWeight: 700, padding: '2px 6px',
      borderRadius: '4px', background: c.bg, color: c.color,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {c.label}
    </span>
  )
}

// ═══ SECTION 6 — Main ActivityFeed component ═══

const PAGE_SIZE = 20

export default function ActivityFeed({ capsuleId, circleId }: ActivityFeedProps) {
  const [entries,  setEntries]  = useState<LogEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [loadMore, setLoadMore] = useState(false)
  const [hasMore,  setHasMore]  = useState(true)
  const [offset,   setOffset]   = useState(0)

  // ── 6.1 Fetch log entries ─────────────────────────────────────────────────

  const fetchEntries = useCallback(async (currentOffset: number, append: boolean) => {
    const isInitial = !append
    if (isInitial) setLoading(true)
    else setLoadMore(true)

    try {
      let url = `/api/event-log?capsule_id=${capsuleId}&limit=${PAGE_SIZE}&offset=${currentOffset}`
      if (circleId) url += `&circle_id=${circleId}`

      const res  = await fetch(url)
      const data = await res.json()
      const logs: LogEntry[] = data.logs ?? data.entries ?? []

      if (append) {
        setEntries(prev => [...prev, ...logs])
      } else {
        setEntries(logs)
      }

      setHasMore(logs.length === PAGE_SIZE)
      setOffset(currentOffset + logs.length)
    } catch (err) {
      console.warn('[ActivityFeed] Failed to fetch log:', err)
    } finally {
      setLoading(false)
      setLoadMore(false)
    }
  }, [capsuleId, circleId])

  useEffect(() => { fetchEntries(0, false) }, [fetchEntries])

  // ── 6.2 Load more handler ────────────────────────────────────────────────

  const handleLoadMore = () => {
    fetchEntries(offset, true)
  }

  // ── 6.3 Loading state ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: textFaint, fontSize: '12px' }}>
        Loading activity…
      </div>
    )
  }

  // ── 6.4 Empty state ──────────────────────────────────────────────────────

  if (entries.length === 0) {
    return (
      <div style={{
        padding: '40px 16px', textAlign: 'center',
        borderRadius: '14px', border: `1px dashed ${cardBorder}`,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <p style={{ fontSize: '14px', color: textSecondary, margin: '0 0 6px' }}>
          No activity yet
        </p>
        <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
          Actions like creating circles, sending invitations, and RSVP responses will appear here.
        </p>
      </div>
    )
  }

  // ── 6.5 Render timeline ───────────────────────────────────────────────────

  return (
    <div>
      <div style={{
        borderLeft: '2px solid rgba(226,195,107,0.08)',
        marginLeft: '10px',
        paddingLeft: '0',
      }}>
        {entries.map(entry => {
          const display = ACTION_MAP[entry.action] ?? DEFAULT_ACTION

          return (
            <div key={entry.id} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '10px 0 10px 16px',
              position: 'relative',
            }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: '-7px', top: '14px',
                width: '12px', height: '12px', borderRadius: '6px',
                background: 'rgba(15,10,30,1)',
                border: `2px solid ${display.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '7px', color: display.color,
              }}>
                {display.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  flexWrap: 'wrap', marginBottom: '2px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
                    {entry.actor_name}
                  </span>
                  <ActorBadge type={entry.actor_type} />
                </div>
                <p style={{
                  fontSize: '12px', color: textSecondary,
                  margin: '0 0 2px', lineHeight: 1.5,
                }}>
                  {display.label(entry)}
                </p>
                <p style={{
                  fontSize: '10px', color: textFaint, margin: 0,
                }}>
                  {timeAgo(entry.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Load more ── */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadMore}
            style={{
              padding: '8px 20px', borderRadius: '10px',
              border: `1px solid ${cardBorder}`,
              background: 'transparent', color: goldMuted,
              fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', opacity: loadMore ? 0.7 : 1,
            }}
          >
            {loadMore ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}

      {/* ── End indicator ── */}
      {!hasMore && entries.length > PAGE_SIZE && (
        <p style={{
          textAlign: 'center', fontSize: '10px', color: textFaint,
          margin: '12px 0 0', fontStyle: 'italic',
        }}>
          End of activity log
        </p>
      )}
    </div>
  )
}
