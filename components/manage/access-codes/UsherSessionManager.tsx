'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/UsherSessionManager.tsx
// PURPOSE: Generate and manage temporary usher PINs.
//          Organiser creates a PIN → gives it to usher → usher enters on checkin page.
//          PIN shown once on generation — never again.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Types & tokens
// ─────────────────────────────────────────────────────────────────────────────

interface Session {
  id: string; label: string; expires_at: string; is_active: boolean; created_at: string
}

const gold = '#E2C36B', goldMuted = 'rgba(226,195,107,0.55)', cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)', textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.28)'
const inp: React.CSSProperties = { width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)', color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Component
// ─────────────────────────────────────────────────────────────────────────────

export function UsherSessionManager({ capsuleId, capsuleSlug }: { capsuleId: string; capsuleSlug: string }) {
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [label,     setLabel]     = useState('')
  const [hours,     setHours]     = useState('12')
  const [newPin,    setNewPin]    = useState<string | null>(null)
  const [creating,  setCreating]  = useState(false)
  const [loading,   setLoading]   = useState(true)

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'

  useEffect(() => {
    fetch(`/api/usher/session?capsule_id=${capsuleId}`)
      .then(r => r.json()).then(d => setSessions(d.sessions ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [capsuleId])

  const handleCreate = async () => {
    if (!label.trim()) return
    setCreating(true); setNewPin(null)
    try {
      const res  = await fetch('/api/usher/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId, label: label.trim(), expires_hours: Number(hours) }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewPin(data.pin)
        setSessions(prev => [data.session, ...prev])
        setLabel('')
      }
    } catch {}
    setCreating(false)
  }

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/usher/session?id=${id}`, { method: 'DELETE' })
    setSessions(prev => prev.map(s => s.id === id ? { ...s, is_active: false } : s))
  }

  const checkinUrl = `${APP_URL}/manage/${capsuleSlug}/checkin`

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        Generate a PIN for each usher. They enter the PIN on the check-in page to gain scan access without seeing your full dashboard.
      </p>

      {/* ── Checkin URL ── */}
      <div style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid rgba(226,195,107,0.15)`, background: 'rgba(226,195,107,0.04)', marginBottom: '14px' }}>
        <p style={{ fontSize: '9px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 4px' }}>Check-in page URL (share with ushers)</p>
        <p style={{ fontSize: '11px', color: gold, fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' as const }}>{checkinUrl}</p>
      </div>

      {/* ── New PIN flash ── */}
      {newPin && (
        <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.07)', marginBottom: '14px', textAlign: 'center' as const }}>
          <p style={{ fontSize: '10px', color: 'rgba(134,239,172,0.7)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 6px' }}>Share this PIN with your usher — shown once only</p>
          <p style={{ fontSize: '36px', fontWeight: 800, color: 'rgba(134,239,172,0.9)', fontFamily: 'monospace', letterSpacing: '0.4em', margin: '0 0 6px' }}>{newPin}</p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>After leaving this screen, this PIN cannot be retrieved. Generate a new one if needed.</p>
        </div>
      )}

      {/* ── Create session form ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input style={{ ...inp, flex: 2 }} placeholder="Usher label (e.g. Main Gate, VIP Entrance)" value={label} onChange={e => setLabel(e.target.value)} />
        <select style={{ ...inp, flex: 1 }} value={hours} onChange={e => setHours(e.target.value)}>
          <option value="6">6 hrs</option>
          <option value="12">12 hrs</option>
          <option value="24">24 hrs</option>
        </select>
        <button onClick={handleCreate} disabled={creating || !label.trim()}
          style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '12px', fontWeight: 700, cursor: label.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, opacity: creating ? 0.7 : 1 }}>
          {creating ? '…' : 'Generate PIN'}
        </button>
      </div>

      {/* ── Session list ── */}
      {!loading && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
          {sessions.map(s => {
            const expired = new Date(s.expires_at) < new Date()
            return (
              <div key={s.id} style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${s.is_active && !expired ? cardBorder : 'rgba(255,255,255,0.04)'}`, background: cardBg, display: 'flex', alignItems: 'center', gap: '10px', opacity: !s.is_active || expired ? 0.5 : 1 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: textPrimary }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>
                    {s.is_active && !expired ? `Expires ${new Date(s.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : expired ? 'Expired' : 'Deactivated'}
                  </p>
                </div>
                {s.is_active && !expired && (
                  <button onClick={() => handleDeactivate(s.id)}
                    style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>
                    Deactivate
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
