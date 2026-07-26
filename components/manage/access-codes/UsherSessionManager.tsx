'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/UsherSessionManager.tsx
// PURPOSE: Generate and manage temporary usher PINs for event-day check-in.
//          Organiser creates a labelled PIN → gives it to an usher → usher
//          enters the PIN at the check-in page to access the scan interface
//          without seeing the full organiser dashboard.
//          PINs are shown once on generation and cannot be retrieved.
//          Copy buttons for both the check-in URL and PIN.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 7 — Metrics + Usher Verification
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// REPLACES: Previous version by AI11 (Claude Sonnet 4.6)
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect } from 'react'

interface Session {
  id:         string
  label:      string
  expires_at: string
  is_active:  boolean
  created_at: string
}

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textFaint    = 'rgba(255,255,255,0.28)'
const successColor = 'rgba(134,239,172,0.8)'

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Copy helper ═══

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: create textarea, select, copy
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      style={{
        fontSize: '10px', padding: '4px 10px',
        borderRadius: '6px',
        border: `1px solid ${copied ? 'rgba(134,239,172,0.3)' : cardBorder}`,
        background: copied ? 'rgba(134,239,172,0.06)' : 'transparent',
        color: copied ? successColor : goldMuted,
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied' : `Copy ${label}`}
    </button>
  )
}

// ═══ SECTION 4 — Component ═══

export function UsherSessionManager({ capsuleId, capsuleSlug }: {
  capsuleId:   string
  capsuleSlug: string
}) {

  // ── 4.1 State ──────────────────────────────────────────────────────────────

  const [sessions,  setSessions]  = useState<Session[]>([])
  const [label,     setLabel]     = useState('')
  const [hours,     setHours]     = useState('12')
  const [newPin,    setNewPin]    = useState<string | null>(null)
  const [creating,  setCreating]  = useState(false)
  const [loading,   setLoading]   = useState(true)

  const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
  const checkinUrl = `${APP_URL}/manage/${capsuleSlug}/checkin`

  // ── 4.2 Fetch existing sessions on mount ───────────────────────────────────

  useEffect(() => {
    fetch(`/api/usher/session?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capsuleId])

  // ── 4.3 Create usher session ───────────────────────────────────────────────

  const handleCreate = async () => {
    if (!label.trim()) return
    setCreating(true)
    setNewPin(null)

    try {
      const res  = await fetch('/api/usher/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    capsuleId,
          label:         label.trim(),
          expires_hours: Number(hours),
        }),
      })
      const data = await res.json()
      if (res.ok && data.pin) {
        setNewPin(data.pin)
        setSessions(prev => [data.session, ...prev])
        setLabel('')
      }
    } catch {}
    setCreating(false)
  }

  // ── 4.4 Deactivate session ─────────────────────────────────────────────────

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this usher session? The usher will be logged out immediately.')) return
    try {
      await fetch(`/api/usher/session?id=${id}`, { method: 'DELETE' })
      setSessions(prev =>
        prev.map(s => s.id === id ? { ...s, is_active: false } : s)
      )
    } catch {}
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  const activeSessions = sessions.filter(s =>
    s.is_active && new Date(s.expires_at) > new Date()
  )

  // ═══ SECTION 5 — Render ═══

  return (
    <div>

      {/* ── 5.1 How it works — flow explanation ──────────────────────────── */}

      <div style={{
        padding: '12px 14px', borderRadius: '10px',
        background: 'rgba(226,195,107,0.03)',
        border: '1px solid rgba(226,195,107,0.08)',
        marginBottom: '16px',
      }}>
        <p style={{
          fontSize: '10px', color: goldMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          margin: '0 0 6px', fontWeight: 600,
        }}>
          How usher check-in works
        </p>
        <div style={{
          fontSize: '11px', color: textFaint,
          lineHeight: 1.7,
        }}>
          <p style={{ margin: '0 0 4px' }}>
            <strong style={{ color: goldMuted }}>1.</strong> Generate a PIN below and give it to your usher
          </p>
          <p style={{ margin: '0 0 4px' }}>
            <strong style={{ color: goldMuted }}>2.</strong> Share the check-in page link (or QR) with them
          </p>
          <p style={{ margin: '0 0 4px' }}>
            <strong style={{ color: goldMuted }}>3.</strong> Usher opens the link on their phone, enters the PIN
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: goldMuted }}>4.</strong> They can now scan guest codes — without accessing your dashboard
          </p>
        </div>
      </div>

      {/* ── 5.2 Check-in URL ─────────────────────────────────────────────── */}

      <div style={{
        padding: '10px 14px', borderRadius: '10px',
        border: '1px solid rgba(226,195,107,0.15)',
        background: 'rgba(226,195,107,0.04)',
        marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '9px', color: goldMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            margin: '0 0 4px',
          }}>
            Check-in page URL
          </p>
          <p style={{
            fontSize: '11px', color: gold,
            fontFamily: 'monospace',
            margin: 0, wordBreak: 'break-all' as const,
          }}>
            {checkinUrl}
          </p>
        </div>
        <CopyButton text={checkinUrl} label="URL" />
      </div>

      {/* ── 5.3 New PIN display (shown once after generation) ─────────── */}

      {newPin && (
        <div style={{
          padding: '18px 14px', borderRadius: '12px',
          border: '1px solid rgba(74,222,128,0.3)',
          background: 'rgba(74,222,128,0.06)',
          marginBottom: '14px', textAlign: 'center' as const,
        }}>
          <p style={{
            fontSize: '10px', color: 'rgba(134,239,172,0.7)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            margin: '0 0 8px',
          }}>
            Share this PIN with your usher — shown once only
          </p>
          <p style={{
            fontSize: '40px', fontWeight: 800,
            color: 'rgba(134,239,172,0.95)',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '0.4em',
            margin: '0 0 10px',
          }}>
            {newPin}
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px',
          }}>
            <CopyButton text={newPin} label="PIN" />
            <CopyButton text={`Check-in PIN: ${newPin}\nPage: ${checkinUrl}`} label="PIN + URL" />
          </div>
          <p style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.25)',
            margin: '10px 0 0', lineHeight: 1.5,
          }}>
            After leaving this screen, this PIN cannot be retrieved.
            Generate a new one if needed.
          </p>
        </div>
      )}

      {/* ── 5.4 Create session form ───────────────────────────────────────── */}

      <div style={{
        display: 'flex', gap: '8px', marginBottom: '14px',
      }}>
        <input
          style={{ ...inputStyle, flex: 2 }}
          placeholder="Usher label (e.g. Main Gate)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && label.trim()) handleCreate() }}
          maxLength={40}
        />
        <select
          style={{ ...inputStyle, flex: 1 }}
          value={hours}
          onChange={e => setHours(e.target.value)}
        >
          <option value="4">4 hrs</option>
          <option value="6">6 hrs</option>
          <option value="12">12 hrs</option>
          <option value="24">24 hrs</option>
        </select>
        <button
          onClick={handleCreate}
          disabled={creating || !label.trim()}
          style={{
            padding: '10px 16px', borderRadius: '10px', border: 'none',
            background: !label.trim()
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
            color: !label.trim() ? textFaint : '#1a0845',
            fontSize: '12px', fontWeight: 700,
            cursor: !label.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0, opacity: creating ? 0.7 : 1,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {creating ? '…' : 'Generate PIN'}
        </button>
      </div>

      {/* ── 5.5 Active sessions count ─────────────────────────────────────── */}

      {!loading && sessions.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '10px',
        }}>
          <p style={{
            fontSize: '10px', color: goldMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', margin: 0,
          }}>
            Usher Sessions
          </p>
          {activeSessions.length > 0 && (
            <span style={{
              fontSize: '9px', padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(134,239,172,0.08)',
              border: '1px solid rgba(134,239,172,0.2)',
              color: successColor, fontWeight: 700,
            }}>
              {activeSessions.length} active
            </span>
          )}
        </div>
      )}

      {/* ── 5.6 Session list ──────────────────────────────────────────────── */}

      {!loading && sessions.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column' as const,
          gap: '6px',
        }}>
          {sessions.map(s => {
            const expired    = new Date(s.expires_at) < new Date()
            const isActive   = s.is_active && !expired

            return (
              <div key={s.id} style={{
                padding: '10px 14px', borderRadius: '10px',
                border: `1px solid ${isActive ? cardBorder : 'rgba(255,255,255,0.04)'}`,
                background: cardBg,
                display: 'flex', alignItems: 'center', gap: '10px',
                opacity: isActive ? 1 : 0.45,
              }}>
                {/* Status dot */}
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: isActive
                    ? 'rgba(134,239,172,0.8)'
                    : expired
                    ? 'rgba(248,113,113,0.5)'
                    : 'rgba(255,255,255,0.15)',
                  flexShrink: 0,
                }} />

                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: '0 0 2px', fontSize: '13px',
                    fontWeight: 600, color: textPrimary,
                  }}>
                    {s.label}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '10px', color: textFaint,
                  }}>
                    {isActive
                      ? `Active — expires ${new Date(s.expires_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit', minute: '2-digit',
                        })}`
                      : expired
                      ? 'Expired'
                      : 'Deactivated'}
                  </p>
                </div>

                {isActive && (
                  <button
                    onClick={() => handleDeactivate(s.id)}
                    style={{
                      fontSize: '10px', padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(248,113,113,0.2)',
                      background: 'transparent',
                      color: 'rgba(248,113,113,0.55)',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── 5.7 Empty state ───────────────────────────────────────────────── */}

      {!loading && sessions.length === 0 && (
        <div style={{
          padding: '20px', textAlign: 'center' as const,
          borderRadius: '10px',
          border: '1px dashed rgba(226,195,107,0.12)',
        }}>
          <p style={{
            fontSize: '12px', color: textFaint, margin: 0,
          }}>
            No usher sessions created yet. Generate a PIN above to get started.
          </p>
        </div>
      )}
    </div>
  )
}
