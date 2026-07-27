// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/portal/circle/[token]/page.tsx
// PURPOSE:   Circle Leader portal page. Token-authenticated via
//            honouree_portal_tokens (role='circle_leader'). Shows the leader's
//            circle guests with inline RSVP status toggles and a scoped
//            ActivityFeed. Read-only capsule activity strip at the bottom.
//            External-facing — designed for non-technical users on mobile.
// BUILT BY:  AI15 (Claude Opus 4.6) · 26 July 2026
// VERSION:   v2.9.0
// DEPENDS ON:
//   - GET /api/circles/portal?token=X (validates token, returns circle + guests)
//   - POST /api/rsvp/update (circle leader RSVP override)
//   - ActivityFeed component (with circleId filter)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback, use } from 'react'
import ActivityFeed from '@/components/manage/guests/ActivityFeed'

// ═══ SECTION 1 — Types ═══

interface PortalData {
  circle_name:   string
  leader_name:   string
  capsule_id:    string
  circle_id:     string
  capsule_title: string
  honouree_name: string
  guests: PortalGuest[]
  tribute_count: number
}

interface PortalGuest {
  id:           string
  name:         string
  email:        string | null
  rsvp_status:  string
  household_size: number
  additional_guests: number
  dietary_requirements: string | null
  rsvp_responded_at: string | null
}

type PageStatus = 'loading' | 'valid' | 'expired' | 'invalid'

// ═══ SECTION 2 — Design tokens ═══

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const greenBg       = 'rgba(74,222,128,0.08)'
const greenText     = 'rgba(134,239,172,0.9)'
const redBg         = 'rgba(248,113,113,0.08)'
const redText       = 'rgba(248,113,113,0.8)'
const amberText     = 'rgba(251,191,36,0.8)'

// ═══ SECTION 3 — StatusBadge sub-component ═══

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    confirmed:   { bg: greenBg,  color: greenText, label: 'Confirmed' },
    declined:    { bg: redBg,    color: redText,    label: 'Declined' },
    pending:     { bg: 'rgba(251,191,36,0.08)', color: amberText, label: 'Pending' },
    no_response: { bg: 'rgba(255,255,255,0.03)', color: textFaint, label: 'No Response' },
  }
  const c = config[status] ?? config.no_response
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, padding: '3px 10px',
      borderRadius: '20px', background: c.bg, color: c.color,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {c.label}
    </span>
  )
}

// ═══ SECTION 4 — RSVPToggle sub-component ═══

function RSVPToggle({
  guest, token, onUpdated,
}: {
  guest:     PortalGuest
  token:     string
  onUpdated: (guestId: string, newStatus: string) => void
}) {
  const [updating, setUpdating] = useState(false)

  const handleToggle = async (newStatus: 'confirmed' | 'declined') => {
    if (guest.rsvp_status === newStatus) return
    setUpdating(true)
    try {
      const res = await fetch('/api/rsvp/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          guest_id: guest.id,
          status: newStatus,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update')
      }
      onUpdated(guest.id, newStatus)
    } catch (err) {
      console.error('[Portal] RSVP update failed:', err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        onClick={() => handleToggle('confirmed')}
        disabled={updating}
        style={{
          padding: '6px 12px', borderRadius: '8px', border: 'none',
          background: guest.rsvp_status === 'confirmed'
            ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
          color: guest.rsvp_status === 'confirmed' ? greenText : textFaint,
          fontSize: '10px', fontWeight: 700, cursor: 'pointer',
          opacity: updating ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        ✓ Confirm
      </button>
      <button
        onClick={() => handleToggle('declined')}
        disabled={updating}
        style={{
          padding: '6px 12px', borderRadius: '8px', border: 'none',
          background: guest.rsvp_status === 'declined'
            ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
          color: guest.rsvp_status === 'declined' ? redText : textFaint,
          fontSize: '10px', fontWeight: 700, cursor: 'pointer',
          opacity: updating ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        ✗ Decline
      </button>
    </div>
  )
}

// ═══ SECTION 5 — GuestRow sub-component ═══

function GuestRow({
  guest, token, onUpdated,
}: {
  guest:     PortalGuest
  token:     string
  onUpdated: (guestId: string, newStatus: string) => void
}) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: '12px',
      background: cardBg, border: `1px solid ${cardBorder}`,
      marginBottom: '8px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '8px',
        marginBottom: '8px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: textPrimary,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {guest.name}
          </p>
          {guest.email && (
            <p style={{ fontSize: '10px', color: textFaint, margin: '2px 0 0' }}>
              {guest.email}
            </p>
          )}
        </div>
        <StatusBadge status={guest.rsvp_status} />
      </div>

      <RSVPToggle guest={guest} token={token} onUpdated={onUpdated} />

      {/* Dietary / additional info */}
      {(guest.additional_guests > 0 || guest.dietary_requirements) && (
        <div style={{
          marginTop: '8px', paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', gap: '12px', flexWrap: 'wrap',
        }}>
          {guest.additional_guests > 0 && (
            <span style={{ fontSize: '10px', color: textFaint }}>
              +{guest.additional_guests} additional guest{guest.additional_guests !== 1 ? 's' : ''}
            </span>
          )}
          {guest.dietary_requirements && (
            <span style={{ fontSize: '10px', color: textFaint }}>
              Dietary: {guest.dietary_requirements}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 6 — Main Portal Page ═══

interface PageProps {
  params: Promise<{ token: string }>
}

export default function CircleLeaderPortal({ params }: PageProps) {
  const { token } = use(params)

  const [status,  setStatus]  = useState<PageStatus>('loading')
  const [portal,  setPortal]  = useState<PortalData | null>(null)
  const [guests,  setGuests]  = useState<PortalGuest[]>([])
  const [showActivity, setShowActivity] = useState(false)

  // ── 6.1 Validate token and load portal data ──────────────────────────────

  const loadPortal = useCallback(async () => {
    try {
      const res  = await fetch(`/api/circles/portal?token=${encodeURIComponent(token)}`)
      const data = await res.json()

      if (res.status === 403) {
        setStatus('expired')
        return
      }
      if (!res.ok || !data.portal) {
        setStatus('invalid')
        return
      }

      setPortal(data.portal)
      setGuests(data.portal.guests ?? [])
      setStatus('valid')
    } catch {
      setStatus('invalid')
    }
  }, [token])

  useEffect(() => { loadPortal() }, [loadPortal])

  // ── 6.2 Handle RSVP update from toggle ────────────────────────────────────

  const handleGuestUpdated = (guestId: string, newStatus: string) => {
    setGuests(prev =>
      prev.map(g => g.id === guestId
        ? { ...g, rsvp_status: newStatus, rsvp_responded_at: new Date().toISOString() }
        : g
      )
    )
  }

  // ── 6.3 RSVP counts from local state ──────────────────────────────────────

  const confirmed = guests.filter(g => g.rsvp_status === 'confirmed').length
  const declined  = guests.filter(g => g.rsvp_status === 'declined').length
  const pending   = guests.filter(g => g.rsvp_status === 'pending' || g.rsvp_status === 'no_response').length

  // ── 6.4 Render — loading ──────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <main style={{
        minHeight: '100vh', background: '#0f0a1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <p style={{ fontSize: '13px', color: textFaint }}>Verifying your portal link…</p>
      </main>
    )
  }

  // ── 6.5 Render — expired ──────────────────────────────────────────────────

  if (status === 'expired') {
    return (
      <main style={{
        minHeight: '100vh', background: '#0f0a1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <p style={{ fontSize: '40px', margin: '0 0 16px' }}>⏳</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px', fontWeight: 700, color: gold, margin: '0 0 10px',
          }}>
            Portal Link Expired
          </h1>
          <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.65 }}>
            This portal link is no longer active. Please ask the event organiser to send you a new one.
          </p>
        </div>
      </main>
    )
  }

  // ── 6.6 Render — invalid ──────────────────────────────────────────────────

  if (status === 'invalid' || !portal) {
    return (
      <main style={{
        minHeight: '100vh', background: '#0f0a1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <p style={{ fontSize: '40px', margin: '0 0 16px' }}>🔒</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px', fontWeight: 700, color: gold, margin: '0 0 10px',
          }}>
            Link Not Recognised
          </h1>
          <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.65 }}>
            This portal link could not be verified. Please check the link or contact the event organiser.
          </p>
        </div>
      </main>
    )
  }

  // ── 6.7 Render — valid portal ─────────────────────────────────────────────

  return (
    <main style={{
      minHeight: '100vh', background: '#0f0a1e',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Gold accent line ── */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(to right, transparent, #E2C36B, transparent)',
      }} />

      {/* ── Header ── */}
      <div style={{
        maxWidth: '480px', margin: '0 auto',
        padding: '28px 20px 0',
      }}>
        <p style={{
          fontSize: '9px', fontWeight: 700, color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.14em',
          margin: '0 0 6px',
        }}>
          Circle Leader Portal
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px', fontWeight: 700, color: gold,
          margin: '0 0 4px',
        }}>
          {portal.circle_name}
        </h1>
        <p style={{ fontSize: '12px', color: textFaint, margin: '0 0 4px' }}>
          {portal.leader_name} · {portal.honouree_name}
        </p>
        <p style={{ fontSize: '11px', color: textFaint, margin: '0 0 20px', fontStyle: 'italic' }}>
          {portal.capsule_title}
        </p>

        {/* ── Quick stats ── */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '20px',
        }}>
          {[
            { label: 'Confirmed', value: confirmed, color: greenText },
            { label: 'Declined',  value: declined,  color: redText },
            { label: 'Awaiting',  value: pending,    color: amberText },
            { label: 'Total',     value: guests.length, color: gold },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center', padding: '8px 4px',
              borderRadius: '10px', background: cardBg,
              border: `1px solid ${cardBorder}`,
            }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: s.color }}>
                {s.value}
              </p>
              <p style={{
                margin: '2px 0 0', fontSize: '8px', fontWeight: 600,
                color: textFaint, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Guest list ── */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontSize: '9px', fontWeight: 700, color: goldMuted,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: '0 0 10px',
          }}>
            Your Guests ({guests.length})
          </p>

          {guests.length === 0 ? (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              borderRadius: '12px', border: `1px dashed ${cardBorder}`,
            }}>
              <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
                No guests assigned to your circle yet.
              </p>
            </div>
          ) : (
            guests.map(g => (
              <GuestRow
                key={g.id}
                guest={g}
                token={token}
                onUpdated={handleGuestUpdated}
              />
            ))
          )}
        </div>

        {/* ── Activity section (toggle) ── */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowActivity(!showActivity)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: `1px solid ${cardBorder}`, background: cardBg,
              color: goldMuted, fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>◈ Activity for this circle</span>
            <span style={{ fontSize: '10px' }}>{showActivity ? '▲' : '▼'}</span>
          </button>

          {showActivity && (
            <div style={{
              marginTop: '12px', padding: '16px',
              borderRadius: '12px', background: cardBg,
              border: `1px solid ${cardBorder}`,
            }}>
              <ActivityFeed
                capsuleId={portal.capsule_id}
                circleId={portal.circle_id}
              />
            </div>
          )}
        </div>

        {/* ── Capsule activity strip (read-only) ── */}
        {portal.tribute_count > 0 && (
          <div style={{
            padding: '14px 16px', borderRadius: '12px',
            background: 'rgba(226,195,107,0.04)',
            border: `1px solid rgba(226,195,107,0.08)`,
            marginBottom: '24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
              <span style={{ color: gold, fontWeight: 700 }}>{portal.tribute_count}</span>
              {' '}tribute{portal.tribute_count !== 1 ? 's' : ''} received for {portal.honouree_name}
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 0 32px', textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <p style={{ fontSize: '9px', color: textFaint, margin: 0, letterSpacing: '0.08em' }}>
            Powered by LegacyCapsule
          </p>
        </div>
      </div>
    </main>
  )
}
