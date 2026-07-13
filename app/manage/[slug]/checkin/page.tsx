'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/manage/[slug]/checkin/page.tsx
// PURPOSE: Standalone usher check-in interface. No navigation, no sidebar.
//          Full-screen, optimised for phone use at the venue entrance.
//          Usher enters PIN → gets scan interface → scans or types codes.
//          Step 9 of LC-ACCESS-001 component build.
//
// CRITICAL RULES:
//   - NO CapsuleBottomNav, NO manage sidebar, NO page navigation
//   - Full-screen only — this is a live event tool
//   - Must work on any phone browser
//   - Auto-clears result after 4 seconds ready for next scan
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useParams }                   from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Types
// ─────────────────────────────────────────────────────────────────────────────

interface UsherSession {
  session_id:    string
  session_label: string
  expires_at:    string
}

interface ScanResult {
  outcome:          string
  guest_name?:      string
  tier_display?:    string
  section_name?:    string
  special_note?:    string
  vendor_company?:  string
  is_vvip?:         boolean
  message?:         string
  first_checkin_at?: string
}

type Screen = 'pin' | 'scan' | 'walkin'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const pageBg      = '#0f0a1e'
const gold        = '#E2C36B'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.35)'

const OUTCOME_STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  admitted:      { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.4)',   color: 'rgba(134,239,172,0.95)', icon: '✓' },
  already_used:  { bg: 'rgba(248,191,113,0.10)', border: 'rgba(248,191,113,0.35)', color: 'rgba(248,191,113,0.9)',  icon: '⚑' },
  invalid:       { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.35)', color: 'rgba(248,113,113,0.9)',  icon: '✕' },
  not_yet_valid: { bg: 'rgba(147,197,253,0.10)', border: 'rgba(147,197,253,0.3)',  color: 'rgba(147,197,253,0.9)',  icon: '◷' },
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — PIN entry screen
// ─────────────────────────────────────────────────────────────────────────────

function PinEntry({ slug, onVerified }: { slug: string; onVerified: (session: UsherSession) => void }) {
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleVerify = async () => {
    if (pin.length < 6) return
    setLoading(true); setError('')

    // Get capsule_id from slug
    const capsuleRes = await fetch(`/api/capsule-by-slug?slug=${slug}`)
    const capsuleData = await capsuleRes.json()

    if (!capsuleData.capsule_id) { setError('Capsule not found'); setLoading(false); return }

    const res  = await fetch('/api/usher/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsule_id: capsuleData.capsule_id, pin }),
    })
    const data = await res.json()
    if (data.valid) {
      onVerified({ session_id: data.session_id, session_label: data.session_label, expires_at: data.expires_at })
    } else {
      setError(data.error ?? 'Invalid PIN')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>◉</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>Check-in</h1>
        <p style={{ fontSize: '13px', color: textFaint, margin: '0 0 28px' }}>Enter the PIN provided by the event organiser</p>
        <input
          type="number" inputMode="numeric" pattern="[0-9]*"
          value={pin} onChange={e => setPin(e.target.value.slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && pin.length === 6 && handleVerify()}
          placeholder="Enter 6-digit PIN"
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(226,195,107,0.25)'}`, background: 'rgba(255,255,255,0.06)', color: textPrimary, fontSize: '24px', fontFamily: 'monospace', letterSpacing: '0.4em', textAlign: 'center' as const, outline: 'none', boxSizing: 'border-box' as const }}
          autoFocus
        />
        {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginTop: '8px' }}>{error}</p>}
        <button onClick={handleVerify} disabled={loading || pin.length < 6}
          style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px', border: 'none', background: pin.length === 6 ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.05)', color: pin.length === 6 ? '#1a0845' : textFaint, fontSize: '15px', fontWeight: 700, cursor: pin.length === 6 ? 'pointer' : 'not-allowed' }}>
          {loading ? 'Verifying…' : 'Enter'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Scan / manual entry screen
// ─────────────────────────────────────────────────────────────────────────────

function ScanScreen({ capsuleId, session, onWalkIn }: {
  capsuleId: string; session: UsherSession; onWalkIn: () => void
}) {
  const [code,      setCode]      = useState('')
  const [result,    setResult]    = useState<ScanResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and auto-clear result
  useEffect(() => { inputRef.current?.focus() }, [result])
  useEffect(() => {
    if (result) {
      const t = setTimeout(() => { setResult(null); setCode(''); inputRef.current?.focus() }, 4000)
      return () => clearTimeout(t)
    }
  }, [result])

  const handleValidate = async (codeToValidate?: string) => {
    const c = (codeToValidate ?? code).trim()
    if (!c) return
    setLoading(true)
    try {
      const res  = await fetch('/api/access-codes/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, capsule_id: capsuleId, usher_session_id: session.session_id }),
      })
      const data = await res.json()
      setResult(data)
    } catch { setResult({ outcome: 'invalid', message: 'Network error — retry' }) }
    setLoading(false)
    setCode('')
  }

  const s = result ? (OUTCOME_STYLES[result.outcome] ?? OUTCOME_STYLES.invalid) : null

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column' as const }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: goldMuted, fontFamily: "'DM Sans', sans-serif" }}>{session.session_label}</p>
          <p style={{ margin: 0, fontSize: '9px', color: textFaint }}>
            Expires {new Date(session.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={onWalkIn}
          style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.25)`, background: 'transparent', color: goldMuted, cursor: 'pointer' }}>
          + Walk-in
        </button>
      </div>

      {/* ── Result card ── */}
      {result && s && (
        <div style={{ margin: '16px 20px 0', padding: '20px', borderRadius: '16px', border: `2px solid ${s.border}`, background: s.bg, textAlign: 'center' as const }}>
          <div style={{ fontSize: '48px', color: s.color, marginBottom: '8px', lineHeight: 1 }}>{s.icon}</div>
          {result.is_vvip && <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#F5D97A', marginBottom: '6px' }}>VVIP GUEST</div>}
          <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: textPrimary, fontFamily: "'DM Sans', sans-serif" }}>
            {result.guest_name ?? 'Unknown'}
          </p>
          {result.tier_display   && <p style={{ margin: '0 0 2px', fontSize: '14px', color: s.color, fontWeight: 600 }}>{result.tier_display}</p>}
          {result.section_name   && <p style={{ margin: '0 0 2px', fontSize: '13px', color: textFaint }}>{result.section_name}</p>}
          {result.special_note   && <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(248,191,113,0.8)', fontStyle: 'italic' }}>⚑ {result.special_note}</p>}
          {result.vendor_company && <p style={{ margin: '0 0 2px', fontSize: '11px', color: textFaint }}>Vendor: {result.vendor_company}</p>}
          {result.message && result.outcome !== 'admitted' && <p style={{ margin: '0', fontSize: '12px', color: s.color }}>{result.message}</p>}
          {result.first_checkin_at && (
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: textFaint }}>
              First checked in at {new Date(result.first_checkin_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}

      {/* ── Code input ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'flex-end', padding: '20px' }}>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={e => {
            const v = e.target.value.toUpperCase().replace(/[^A-Z0-9:]/g, '')
            setCode(v)
            // If QR payload detected (contains ':'), validate immediately
            if (v.includes(':') && v.split(':').length >= 3) handleValidate(v)
          }}
          onKeyDown={e => e.key === 'Enter' && handleValidate()}
          placeholder="Scan QR or type code"
          style={{ width: '100%', padding: '18px 20px', borderRadius: '14px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(255,255,255,0.06)', color: textPrimary, fontSize: '20px', fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'center' as const, outline: 'none', boxSizing: 'border-box' as const }}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
        />
        <p style={{ textAlign: 'center' as const, fontSize: '11px', color: textFaint, marginTop: '8px' }}>
          Point camera at QR code, or type the 6-digit number
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Walk-in form
// ─────────────────────────────────────────────────────────────────────────────

function WalkInFormScreen({ capsuleId, session, onBack }: {
  capsuleId: string; session: UsherSession; onBack: () => void
}) {
  const [name,    setName]    = useState('')
  const [tier,    setTier]    = useState('general')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ code: string } | null>(null)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const walkinRes = await fetch('/api/access-codes/walkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId, guest_name: name.trim(), participant_type: tier }),
      })
      const walkinData = await walkinRes.json()
      if (!walkinRes.ok) throw new Error(walkinData.error)

      // Auto check-in the walk-in guest
      await fetch('/api/access-codes/manual-checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_code_id: walkinData.code.id,
          capsule_id: capsuleId,
          usher_session_id: session.session_id,
          notes: 'Walk-in guest — admitted at door',
        }),
      })
      setResult({ code: walkinData.code.numeric_code })
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '48px', color: 'rgba(134,239,172,0.9)', marginBottom: '12px' }}>✓</div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, margin: '0 0 4px' }}>Walk-in Admitted</p>
        <p style={{ fontSize: '13px', color: textFaint, margin: '0 0 16px' }}>{name}</p>
        <p style={{ fontSize: '24px', fontFamily: 'monospace', color: gold, letterSpacing: '0.3em', margin: '0 0 24px' }}>{result.code}</p>
        <button onClick={onBack}
          style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
          Back to Scan
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column' as const }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '20px', cursor: 'pointer', padding: 0 }}>←</button>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textPrimary, fontFamily: "'DM Sans', sans-serif" }}>Register Walk-in Guest</p>
      </div>
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        <div>
          <label style={{ fontSize: '10px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Guest Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(226,195,107,0.22)', background: 'rgba(255,255,255,0.06)', color: textPrimary, fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const }}
            placeholder="Full name" autoFocus />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: 'rgba(226,195,107,0.55)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Guest Type</label>
          <select value={tier} onChange={e => setTier(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(226,195,107,0.22)', background: '#1a0845', color: textPrimary, fontSize: '14px', outline: 'none' }}>
            <option value="vvip">VVIP</option>
            <option value="vip">VIP</option>
            <option value="general">General</option>
            <option value="reception_only">Reception Only</option>
            <option value="staff">Staff</option>
            <option value="media">Media</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>
        {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', margin: 0 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading || !name.trim()}
          style={{ padding: '14px', borderRadius: '12px', border: 'none', background: name.trim() ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.05)', color: name.trim() ? '#1a0845' : textFaint, fontSize: '15px', fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', marginTop: '8px' }}>
          {loading ? 'Registering…' : 'Admit Guest'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Main page (no layout, no navigation)
// ─────────────────────────────────────────────────────────────────────────────

// Needed for resolve of goldMuted in ScanScreen
const goldMuted = 'rgba(226,195,107,0.55)'

export default function CheckinPage() {
  const params     = useParams() as { slug: string }
  const slug       = params.slug
  const [capsuleId,  setCapsuleId]  = useState<string | null>(null)
  const [session,    setSession]    = useState<UsherSession | null>(null)
  const [screen,     setScreen]     = useState<Screen>('pin')

  // Fetch capsule_id from slug on mount
  useEffect(() => {
    fetch(`/api/capsule-by-slug?slug=${slug}`)
      .then(r => r.json())
      .then(d => { if (d.capsule_id) setCapsuleId(d.capsule_id) })
      .catch(() => {})
  }, [slug])

  if (!capsuleId) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textFaint, fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
      </div>
    )
  }

  if (!session) return <PinEntry slug={slug} onVerified={s => { setSession(s); setScreen('scan') }} />

  if (screen === 'walkin') return <WalkInFormScreen capsuleId={capsuleId} session={session} onBack={() => setScreen('scan')} />

  return <ScanScreen capsuleId={capsuleId} session={session} onWalkIn={() => setScreen('walkin')} />
}
