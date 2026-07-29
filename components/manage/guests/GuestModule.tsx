// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/guests/GuestModule.tsx
// PURPOSE:   Guest Coordination orchestrator. Tabbed shell hosting
//            CircleManager, RSVPDashboard, and ActivityFeed.
//            Summary strip shows live RSVP counts across all tabs.
//            Same structural pattern as AccessCodeModule.tsx.
// BUILT BY:  AI15 (Claude Opus 4.6) · 26 July 2026
// VERSION:   v2.9.0
// REPLACES:  v2.9.0-stub (Sonnet placeholder)
// DEPENDS ON:
//   - CircleManager  (components/manage/guests/CircleManager.tsx)
//   - RSVPDashboard  (components/manage/guests/RSVPDashboard.tsx)
//   - ActivityFeed   (components/manage/guests/ActivityFeed.tsx)
//   - GET /api/guests?capsule_id=X (for summary counts)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CircleManager from '@/components/manage/guests/CircleManager'
import RSVPDashboard from '@/components/manage/guests/RSVPDashboard'
import ActivityFeed  from '@/components/manage/guests/ActivityFeed'

// ═══ SECTION 1 — Types ═══

interface CapsuleData {
  id:              string
  slug:            string
  title:           string
  honouree_name:   string
  event_tag:       string | null
  tier:            string | null
  organiser_email: string
  components:      string[]
  status:          string
}

interface GuestModuleProps {
  capsule: CapsuleData
}

type TabKey = 'circles' | 'rsvp' | 'activity'

interface RsvpCounts {
  confirmed:   number
  declined:    number
  pending:     number
  no_response: number
  total:       number
}

// ═══ SECTION 2 — Design tokens ═══

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'

// ═══ SECTION 3 — Tab definitions ═══

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'circles',  label: 'Circles',  icon: '◉' },
  { key: 'rsvp',     label: 'RSVP',     icon: '✉' },
  { key: 'activity', label: 'Activity', icon: '◈' },
]

// ═══ SECTION 4 — SummaryStrip sub-component ═══

function SummaryStrip({ counts, loading }: { counts: RsvpCounts; loading: boolean }) {
  const items = [
    { label: 'Confirmed',   value: counts.confirmed,   color: 'rgba(74,222,128,0.9)'  },
    { label: 'Declined',    value: counts.declined,     color: 'rgba(248,113,113,0.8)' },
    { label: 'Pending',     value: counts.pending,      color: 'rgba(251,191,36,0.8)'  },
    { label: 'No Response', value: counts.no_response,  color: 'rgba(255,255,255,0.25)' },
    { label: 'Total',       value: counts.total,        color: gold },
  ]

  return (
    <div style={{
      display: 'flex', gap: '6px', flexWrap: 'wrap',
      padding: '12px 16px', borderRadius: '12px',
      background: cardBg, border: `1px solid ${cardBorder}`,
    }}>
      {items.map(item => (
        <div key={item.label} style={{
          flex: '1 1 60px', minWidth: '60px', textAlign: 'center',
          padding: '6px 4px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <p style={{
            margin: 0, fontSize: '18px', fontWeight: 800,
            color: loading ? 'rgba(255,255,255,0.1)' : item.color,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'color 0.3s',
          }}>
            {loading ? '—' : item.value}
          </p>
          <p style={{
            margin: '2px 0 0', fontSize: '9px', fontWeight: 600,
            color: textFaint, letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ═══ SECTION 5 — Main GuestModule component ═══

export default function GuestModule({ capsule }: GuestModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('circles')
  const [counts, setCounts]       = useState<RsvpCounts>({
    confirmed: 0, declined: 0, pending: 0, no_response: 0, total: 0,
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // ── 5.1 Fetch RSVP summary counts ────────────────────────────────────────

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/guests?capsule_id=${capsule.id}&counts_only=true`)
      if (!res.ok) throw new Error('Failed to fetch counts')
      const data = await res.json()

      if (data.counts) {
        setCounts(data.counts)
      } else if (Array.isArray(data.guests)) {
        // Fallback: compute counts from guest array if API doesn't support counts_only
        const guests = data.guests.filter((g: any) => !g.deleted_at)
        setCounts({
          confirmed:   guests.filter((g: any) => g.rsvp_status === 'confirmed').length,
          declined:    guests.filter((g: any) => g.rsvp_status === 'declined').length,
          pending:     guests.filter((g: any) => g.rsvp_status === 'pending').length,
          no_response: guests.filter((g: any) => g.rsvp_status === 'no_response').length,
          total:       guests.length,
        })
      }
    } catch (err) {
      console.warn('[GuestModule] Failed to fetch RSVP counts:', err)
    } finally {
      setCountsLoading(false)
    }
  }, [capsule.id])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  // ── 5.2 Refresh counts when child components mutate data ──────────────────

  const handleDataChange = useCallback(() => {
    fetchCounts()
  }, [fetchCounts])

  // ── 5.3 Render ────────────────────────────────────────────────────────────

  return (
    <div style={{
      maxWidth: '860px', margin: '0 auto',
      padding: '24px 16px 60px',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href={`/manage/${capsule.slug}`}
          style={{
            fontSize: '12px', color: goldMuted, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}
        >
          ← Back to Services
        </Link>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px', fontWeight: 700, color: gold,
          margin: '10px 0 4px',
        }}>
          Guest Management
        </h1>
        <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
          {capsule.honouree_name}
          {capsule.event_tag ? ` · ${capsule.event_tag}` : ''}
        </p>
      </div>

      {/* ── Summary strip — always visible ── */}
      <div style={{ marginBottom: '16px' }}>
        <SummaryStrip counts={counts} loading={countsLoading} />
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '20px',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '12px 8px 10px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${gold}`
                  : '2px solid transparent',
                color: isActive ? gold : textFaint,
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: '14px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div>
        {activeTab === 'circles' && (
          <CircleManager
            capsuleId={capsule.id}
            capsuleSlug={capsule.slug}
            onDataChange={handleDataChange}
          />
        )}

        {activeTab === 'rsvp' && (
          <RSVPDashboard
            capsuleId={capsule.id}
            capsuleSlug={capsule.slug}
            honoureeName={capsule.honouree_name}
            eventTag={capsule.event_tag}
            counts={counts}
            onDataChange={handleDataChange}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed
            capsuleId={capsule.id}
          />
        )}
      </div>
    </div>
  )
}
