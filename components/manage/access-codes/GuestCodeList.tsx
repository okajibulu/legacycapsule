'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/GuestCodeList.tsx
// PURPOSE: Display and manage all generated access codes for a capsule.
//          Features: name search, filter by status, per-code send/resend/revoke,
//          bulk send all, real-time status updates after actions, regeneration
//          warning flow when codes have already been sent.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 4 — GuestCodeList Rebuild
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// REPLACES: Previous version by AI11 (Claude Sonnet 4.6)
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect, useMemo } from 'react'

interface Props {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  eventTag:     string | null
}

interface AccessCode {
  id:               string
  guest_id:         string | null
  guest_name:       string
  guest_email:      string | null
  participant_type: string
  numeric_code:     string
  status:           string
  use_count:        number
  section_name:     string | null
}

type FilterKey = 'all' | 'unsent' | 'sent' | 'used' | 'revoked'

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textFaint    = 'rgba(255,255,255,0.28)'
const successColor = 'rgba(134,239,172,0.8)'
const errorColor   = 'rgba(248,113,113,0.8)'
const warnColor    = 'rgba(251,191,36,0.85)'

// ═══ SECTION 3 — Status and tier display maps ═══

const STATUS_COLOR: Record<string, string> = {
  generated: 'rgba(255,255,255,0.35)',
  sent:      'rgba(147,197,253,0.85)',
  delivered: 'rgba(134,239,172,0.85)',
  used:      'rgba(74,222,128,0.95)',
  expired:   'rgba(255,255,255,0.2)',
  revoked:   'rgba(248,113,113,0.7)',
}

const STATUS_LABEL: Record<string, string> = {
  generated: 'NOT SENT',
  sent:      'SENT',
  delivered: 'DELIVERED',
  used:      'CHECKED IN',
  expired:   'EXPIRED',
  revoked:   'REVOKED',
}

const TIER_LABEL: Record<string, string> = {
  vvip:           'VVIP',
  vip:            'VIP',
  general:        'Guest',
  reception_only: 'Reception',
  staff:          'Staff',
  media:          'Media',
  vendor:         'Vendor',
}

// Tier accent colours — used for left-border treatment on code rows
const TIER_ACCENT: Record<string, string> = {
  vvip:           'rgba(251,191,36,0.5)',
  vip:            'rgba(192,132,252,0.5)',
  general:        'rgba(226,195,107,0.25)',
  reception_only: 'rgba(147,197,253,0.35)',
  staff:          'rgba(134,239,172,0.35)',
  media:          'rgba(249,168,212,0.35)',
  vendor:         'rgba(253,186,116,0.35)',
}

// ═══ SECTION 4 — Summary stat card ═══

function StatCard({ label, value, accent }: {
  label:  string
  value:  number
  accent?: boolean
}) {
  return (
    <div style={{
      flex: 1, minWidth: '60px',
      padding: '10px 8px', borderRadius: '10px',
      background: accent ? 'rgba(226,195,107,0.07)' : cardBg,
      border: `1px solid ${accent ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.05)'}`,
      textAlign: 'center' as const,
    }}>
      <div style={{
        fontSize: '20px', fontWeight: 800,
        color: accent ? gold : textPrimary,
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '8px', color: textFaint,
        marginTop: '3px', textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
      }}>
        {label}
      </div>
    </div>
  )
}

// ═══ SECTION 5 — Main component ═══

export default function GuestCodeList({
  capsuleId, capsuleSlug, honoureeName, eventTag,
}: Props) {

  // ── 5.1 State ──────────────────────────────────────────────────────────────

  const [codes,         setCodes]         = useState<AccessCode[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState<FilterKey>('all')
  const [sendingAll,    setSendingAll]    = useState(false)
  const [sendingId,     setSendingId]     = useState<string | null>(null)
  const [revokingId,    setRevokingId]    = useState<string | null>(null)
  const [msg,           setMsg]           = useState('')
  const [error,         setError]         = useState('')
  const [warnPayload,   setWarnPayload]   = useState<{
    sent_count: number; message: string
  } | null>(null)

  // ── 5.2 Fetch codes on mount ───────────────────────────────────────────────

  const fetchCodes = async () => {
    try {
      const res  = await fetch(`/api/access-codes/list?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (data.codes) setCodes(data.codes)
    } catch {
      setError('Could not load access codes. Please refresh.')
    }
    setLoading(false)
  }

  useEffect(() => { fetchCodes() }, [capsuleId])

  // ── 5.3 Computed values ────────────────────────────────────────────────────

  const withEmail  = useMemo(() => codes.filter(c => c.guest_email).length, [codes])
  const unsent     = useMemo(() => codes.filter(c => c.status === 'generated').length, [codes])
  const sent       = useMemo(() => codes.filter(c => c.status === 'sent' || c.status === 'delivered').length, [codes])
  const checkedIn  = useMemo(() => codes.filter(c => c.status === 'used').length, [codes])
  const revoked    = useMemo(() => codes.filter(c => c.status === 'revoked').length, [codes])

  // Search + filter applied together
  const filtered = useMemo(() => {
    let result = codes

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(c => {
        if (filter === 'unsent')  return c.status === 'generated'
        if (filter === 'sent')    return c.status === 'sent' || c.status === 'delivered'
        if (filter === 'used')    return c.status === 'used'
        if (filter === 'revoked') return c.status === 'revoked'
        return true
      })
    }

    // Apply name search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.guest_name.toLowerCase().includes(q) ||
        c.numeric_code.includes(q) ||
        c.guest_email?.toLowerCase().includes(q)
      )
    }

    return result
  }, [codes, filter, search])

  // ── 5.4 Flash message helper ───────────────────────────────────────────────

  const flash = (text: string, isError = false) => {
    if (isError) { setError(text); setTimeout(() => setError(''), 5000) }
    else         { setMsg(text);   setTimeout(() => setMsg(''), 4000)   }
  }

  // ── 5.5 Send all codes ─────────────────────────────────────────────────────

  const handleSendAll = async () => {
    setSendingAll(true); setError(''); setMsg(''); setWarnPayload(null)
    try {
      const res  = await fetch('/api/access-codes/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:   capsuleId,
          capsule_slug: capsuleSlug,
          honouree_name: honoureeName,
          event_tag:    eventTag,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash(
        `✓ Sent to ${data.sent} guest${data.sent !== 1 ? 's' : ''}.`
        + (data.skipped > 0 ? ` ${data.skipped} skipped (no email address).` : '')
      )
      await fetchCodes()   // refresh status badges
    } catch (e: any) {
      flash(e.message || 'Send failed. Please try again.', true)
    }
    setSendingAll(false)
  }

  // ── 5.6 Send or resend individual code ────────────────────────────────────

  const handleSendOne = async (code: AccessCode) => {
    if (!code.guest_email) {
      flash('This guest has no email address on record.', true)
      return
    }
    setSendingId(code.id); setError(''); setMsg('')
    try {
      const res  = await fetch('/api/access-codes/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    capsuleId,
          capsule_slug:  capsuleSlug,
          honouree_name: honoureeName,
          event_tag:     eventTag,
          guest_ids:     [code.guest_id],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCodes(prev =>
        prev.map(c => c.id === code.id ? { ...c, status: 'sent' } : c)
      )
      flash(`✓ Code sent to ${code.guest_name}.`)
    } catch (e: any) {
      flash(e.message || 'Send failed.', true)
    }
    setSendingId(null)
  }

  // ── 5.7 Revoke a code ─────────────────────────────────────────────────────

  const handleRevoke = async (code: AccessCode) => {
    if (!window.confirm(
      `Revoke access for ${code.guest_name}?\n\n`
      + `Their code will stop working immediately. `
      + `You can generate a new code for them individually from the guest list.`
    )) return

    setRevokingId(code.id); setError('')
    try {
      const res = await fetch('/api/access-codes/revoke', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ access_code_id: code.id }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Revoke failed')
      }
      setCodes(prev =>
        prev.map(c => c.id === code.id ? { ...c, status: 'revoked' } : c)
      )
    } catch (e: any) {
      flash(e.message || 'Revoke failed. Please try again.', true)
    }
    setRevokingId(null)
  }

  // ═══ SECTION 6 — Render ═══

  if (loading) {
    return (
      <p style={{ fontSize: '12px', color: textFaint, padding: '16px 0', textAlign: 'center' as const }}>
        Loading access codes…
      </p>
    )
  }

  if (codes.length === 0) {
    return (
      <div style={{
        padding: '24px 16px', borderRadius: '12px',
        border: '1px dashed rgba(226,195,107,0.15)',
        textAlign: 'center' as const,
      }}>
        <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
          No access codes generated yet.
        </p>
      </div>
    )
  }

  return (
    <div>

      {/* ── 6.1 Summary stats ─────────────────────────────────────────────── */}

      <div style={{
        display: 'flex', gap: '6px', marginBottom: '14px',
        flexWrap: 'wrap' as const,
      }}>
        <StatCard label="Total"      value={codes.length} />
        <StatCard label="With Email" value={withEmail} />
        <StatCard label="Unsent"     value={unsent}    accent={unsent > 0} />
        <StatCard label="Sent"       value={sent}      accent={sent > 0} />
        <StatCard label="Checked In" value={checkedIn} accent={checkedIn > 0} />
        {revoked > 0 && <StatCard label="Revoked" value={revoked} />}
      </div>

      {/* ── 6.2 Regeneration warning banner ───────────────────────────────── */}

      {warnPayload && (
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          border: '1px solid rgba(251,191,36,0.3)',
          background: 'rgba(251,191,36,0.05)',
          marginBottom: '12px',
        }}>
          <p style={{
            fontSize: '12px', color: warnColor,
            margin: '0 0 10px', lineHeight: 1.7,
          }}>
            ⚠ {warnPayload.message}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setWarnPayload(null)}
              style={{
                padding: '7px 16px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: textFaint,
                fontSize: '11px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setWarnPayload(null)
                // Caller handles the confirm_regenerate flow
              }}
              style={{
                padding: '7px 16px', borderRadius: '8px',
                border: '1px solid rgba(251,191,36,0.3)',
                background: 'rgba(251,191,36,0.08)',
                color: warnColor, fontSize: '11px',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Understood — proceed
            </button>
          </div>
        </div>
      )}

      {/* ── 6.3 Bulk send action ──────────────────────────────────────────── */}

      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={handleSendAll}
          disabled={sendingAll || withEmail === 0}
          style={{
            width: '100%', padding: '10px',
            borderRadius: '10px', border: 'none',
            background: withEmail === 0
              ? 'rgba(255,255,255,0.04)'
              : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
            color: withEmail === 0 ? textFaint : '#1a0845',
            fontSize: '12px', fontWeight: 700,
            cursor: withEmail === 0 ? 'not-allowed' : 'pointer',
            opacity: sendingAll ? 0.7 : 1,
            letterSpacing: '0.04em',
          }}
        >
          {sendingAll
            ? 'Sending…'
            : unsent > 0
            ? `Send Codes to ${unsent} Unsent Guest${unsent !== 1 ? 's' : ''}`
            : `Resend All Codes (${withEmail} with email)`}
        </button>
        {withEmail === 0 && (
          <p style={{
            fontSize: '10px', color: textFaint,
            margin: '4px 0 0', textAlign: 'center' as const,
          }}>
            No guests have email addresses — codes can be printed instead
          </p>
        )}
      </div>

      {/* ── 6.4 Status messages ───────────────────────────────────────────── */}

      {msg && (
        <p style={{
          fontSize: '12px', color: successColor,
          marginBottom: '10px', lineHeight: 1.5,
        }}>
          {msg}
        </p>
      )}
      {error && (
        <p style={{
          fontSize: '12px', color: errorColor,
          marginBottom: '10px', lineHeight: 1.5,
        }}>
          {error}
        </p>
      )}

      {/* ── 6.5 Search and filter bar ─────────────────────────────────────── */}

      <div style={{ marginBottom: '10px' }}>
        {/* Name search */}
        <input
          type="search"
          placeholder="Search by name, code, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', fontSize: '12px',
            padding: '9px 12px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: textPrimary, outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box' as const,
            marginBottom: '8px',
          }}
        />

        {/* Status filter tabs */}
        <div style={{
          display: 'flex', gap: '4px', flexWrap: 'wrap' as const,
        }}>
          {([
            { key: 'all',     label: `All (${codes.length})` },
            { key: 'unsent',  label: `Unsent (${unsent})` },
            { key: 'sent',    label: `Sent (${sent})` },
            { key: 'used',    label: `In (${checkedIn})` },
            { key: 'revoked', label: `Revoked (${revoked})` },
          ] as { key: FilterKey; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                border: `1px solid ${filter === f.key
                  ? 'rgba(226,195,107,0.45)'
                  : cardBorder}`,
                background: filter === f.key
                  ? 'rgba(226,195,107,0.1)'
                  : 'transparent',
                color: filter === f.key ? gold : textFaint,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 6.6 Search empty state ────────────────────────────────────────── */}

      {filtered.length === 0 && (
        <p style={{
          fontSize: '12px', color: textFaint,
          textAlign: 'center' as const, padding: '20px 0',
        }}>
          No codes match your search or filter.
        </p>
      )}

      {/* ── 6.7 Code list ─────────────────────────────────────────────────── */}

      <div style={{
        display: 'flex', flexDirection: 'column' as const, gap: '5px',
      }}>
        {filtered.map(code => {
          const isRevoked  = code.status === 'revoked'
          const isUsed     = code.status === 'used'
          const isSending  = sendingId  === code.id
          const isRevoking = revokingId === code.id
          const tierAccent = TIER_ACCENT[code.participant_type] ?? cardBorder

          return (
            <div
              key={code.id}
              style={{
                padding: '10px 12px', borderRadius: '10px',
                border: `1px solid ${isRevoked ? 'rgba(248,113,113,0.15)' : cardBorder}`,
                background: cardBg,
                display: 'flex', alignItems: 'center', gap: '10px',
                opacity: isRevoked ? 0.45 : 1,
                borderLeft: `3px solid ${isRevoked ? 'rgba(248,113,113,0.3)' : tierAccent}`,
              }}
            >
              {/* ── Guest info ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '6px', marginBottom: '3px',
                }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 600, color: textPrimary,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {code.guest_name}
                  </span>
                  <span style={{
                    fontSize: '8px', color: goldMuted,
                    fontWeight: 700, flexShrink: 0,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                  }}>
                    {TIER_LABEL[code.participant_type] ?? code.participant_type}
                  </span>
                </div>

                <div style={{
                  display: 'flex', gap: '8px', alignItems: 'center',
                  flexWrap: 'wrap' as const,
                }}>
                  {/* Numeric code */}
                  <span style={{
                    fontSize: '12px', fontWeight: 700, color: gold,
                    fontFamily: 'monospace', letterSpacing: '0.22em',
                  }}>
                    {code.numeric_code}
                  </span>

                  {/* Status */}
                  <span style={{
                    fontSize: '8px', fontWeight: 700,
                    color: STATUS_COLOR[code.status] ?? textFaint,
                    letterSpacing: '0.08em',
                  }}>
                    {STATUS_LABEL[code.status] ?? code.status.toUpperCase()}
                  </span>

                  {/* Check-in count */}
                  {code.use_count > 0 && (
                    <span style={{ fontSize: '9px', color: textFaint }}>
                      × {code.use_count}
                    </span>
                  )}

                  {/* Section */}
                  {code.section_name && (
                    <span style={{ fontSize: '9px', color: textFaint }}>
                      {code.section_name}
                    </span>
                  )}

                  {/* No email warning */}
                  {!code.guest_email && (
                    <span style={{
                      fontSize: '8px',
                      color: 'rgba(248,191,113,0.55)',
                    }}>
                      no email
                    </span>
                  )}
                </div>
              </div>

              {/* ── Per-code action buttons ── */}
              {!isRevoked && (
                <div style={{
                  display: 'flex', gap: '4px', flexShrink: 0,
                }}>
                  {/* Send / Resend */}
                  {code.guest_email && (
                    <button
                      onClick={() => handleSendOne(code)}
                      disabled={isSending}
                      title={code.status === 'generated' ? 'Send code by email' : 'Resend code by email'}
                      style={{
                        fontSize: '10px', padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(147,197,253,0.2)',
                        background: 'transparent',
                        color: isSending ? textFaint : 'rgba(147,197,253,0.7)',
                        cursor: isSending ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {isSending
                        ? '…'
                        : code.status === 'generated'
                        ? 'Send'
                        : 'Resend'}
                    </button>
                  )}

                  {/* Revoke — not shown for already checked-in guests */}
                  {!isUsed && (
                    <button
                      onClick={() => handleRevoke(code)}
                      disabled={isRevoking}
                      title="Revoke this guest's access code"
                      style={{
                        fontSize: '10px', padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(248,113,113,0.18)',
                        background: 'transparent',
                        color: isRevoking ? textFaint : 'rgba(248,113,113,0.55)',
                        cursor: isRevoking ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isRevoking ? '…' : 'Revoke'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── 6.8 List footer — total shown ─────────────────────────────────── */}

      {filtered.length > 0 && (
        <p style={{
          fontSize: '10px', color: textFaint,
          textAlign: 'center' as const,
          margin: '12px 0 0',
        }}>
          Showing {filtered.length} of {codes.length} codes
        </p>
      )}
    </div>
  )
}
