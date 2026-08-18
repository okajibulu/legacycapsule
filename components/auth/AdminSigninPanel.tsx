'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/auth/AdminSigninPanel.tsx
// PURPOSE:   Inline password login panel for FR Full Access and Co-admin.
//            Used on the /signin page and manage dashboard unauthenticated screen.
//            Flow:
//              1. Admin enters email + password
//              2. System validates credentials and returns list of accessible capsules
//              3. If one capsule: go directly to dashboard
//              4. If multiple: show selection list — admin picks which to enter
//            No capsule URL field — the system finds their capsules automatically.
//            ECS: warm, plain English, no jargon.
// ARCHITECTURE: CA-SPEC-001.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.17
// DATE:      17 August 2026
// PROPS:
//   capsuleSlug — optional. If provided (manage dashboard context), used directly
//                 after validation instead of showing capsule list.
//   onBack      — callback to retract panel and show magic link form
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.10)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.18)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '14px', padding: '12px 16px',
  borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${cardBorder}`, color: textPrimary,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 2 — Types ═══

interface CapsuleAccess {
  capsule_id:    string
  capsule_slug:  string
  honouree_name: string
  event_type:    string
  event_tag:     string | null
  account_type:  string
  account_id:    string
}

// ═══ SECTION 3 — Account type label ═══

function accountLabel(type: string): string {
  if (type === 'family_rep_full_access') return 'Family Rep Full Access'
  if (type === 'coadmin') return 'Co-admin'
  return type
}

function accountBadgeColour(type: string): string {
  if (type === 'family_rep_full_access') return 'rgba(134,239,172,0.8)'
  return 'rgba(196,181,253,0.8)'
}

// ═══ SECTION 4 — Props ═══

interface AdminSigninPanelProps {
  capsuleSlug?: string   // if provided, skip capsule selection
  onBack:       () => void
}

// ═══ SECTION 5 — Component ═══

export default function AdminSigninPanel({ capsuleSlug, onBack }: AdminSigninPanelProps) {
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [signing,    setSigning]    = useState(false)
  const [error,      setError]      = useState('')
  const [capsules,   setCapsules]   = useState<CapsuleAccess[]>([])
  const [selecting,  setSelecting]  = useState(false)  // capsule list visible
  const [redirecting, setRedirecting] = useState(false)

  const canSubmit = email.includes('@') && password.length >= 6

  // ── Step 1 — Validate credentials, get capsule list ──────────────────────
  const handleSignIn = async () => {
    if (!canSubmit || signing) return
    setSigning(true); setError('')

    try {
      const res  = await fetch('/api/team/capsules', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    email.trim().toLowerCase(),
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSigning(false)
        return
      }

      const capsuleList: CapsuleAccess[] = data.capsules ?? []

      // If capsule slug already known (manage dashboard context) — go directly
      if (capsuleSlug) {
        await enterCapsule(capsuleSlug, capsuleList)
        return
      }

      // If only one capsule — skip selection, go directly
      if (capsuleList.length === 1) {
        await enterCapsule(capsuleList[0].capsule_slug, capsuleList)
        return
      }

      // Multiple capsules — show selection list
      setCapsules(capsuleList)
      setSelecting(true)
      setSigning(false)

    } catch {
      setError('Something went wrong. Please try again.')
      setSigning(false)
    }
  }

  // ── Step 2 — Enter a specific capsule (set session cookie) ───────────────
  const enterCapsule = async (slug: string, capsuleList?: CapsuleAccess[]) => {
    setRedirecting(true)

    try {
      const res = await fetch('/api/team/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        email.trim().toLowerCase(),
          password,
          capsule_slug: slug,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setRedirecting(false)
        setSigning(false)
        return
      }

      // Session cookie set — redirect to manage dashboard
      window.location.href = `/manage/${slug}`

    } catch {
      setError('Something went wrong. Please try again.')
      setRedirecting(false)
      setSigning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) handleSignIn()
  }

  // ── Capsule selection screen ──────────────────────────────────────────────
  if (selecting) {
    return (
      <div style={{ animation: 'slideIn 0.2s ease' }}>
        <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
          Choose a capsule
        </p>
        <p style={{ fontSize: '12px', color: textFaint, marginBottom: '18px', lineHeight: 1.6 }}>
          You have access to {capsules.length} capsules. Which one would you like to manage?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {capsules.map(cap => (
            <button
              key={cap.capsule_id}
              onClick={() => enterCapsule(cap.capsule_slug)}
              disabled={redirecting}
              style={{
                padding: '14px 16px', borderRadius: '12px', textAlign: 'left' as const,
                border: `1px solid ${cardBorder}`, background: cardBg,
                cursor: redirecting ? 'not-allowed' : 'pointer',
                opacity: redirecting ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cap.honouree_name}
                  </p>
                  {cap.event_tag && (
                    <p style={{ fontSize: '11px', color: textFaint, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cap.event_tag}
                    </p>
                  )}
                </div>
                <span style={{
                  flexShrink: 0,
                  fontSize: '9px', fontWeight: 700,
                  padding: '3px 8px', borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${accountBadgeColour(cap.account_type)}33`,
                  color: accountBadgeColour(cap.account_type),
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                }}>
                  {accountLabel(cap.account_type)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>
        )}

        <button
          onClick={() => { setSelecting(false); setSigning(false) }}
          style={{
            background: 'none', border: 'none', color: textFaint,
            fontSize: '12px', cursor: 'pointer', padding: '4px 0',
          }}
        >
          ← Back to sign in
        </button>
      </div>
    )
  }

  // ── Credentials screen ────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'slideIn 0.2s ease' }}>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ── Back link ── */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: goldMuted,
          fontSize: '12px', cursor: 'pointer', padding: '0 0 18px',
          display: 'block', letterSpacing: '0.03em',
        }}
      >
        ← Use a sign-in code instead
      </button>

      {/* ── Header ── */}
      <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 4px' }}>
        Admin Sign In
      </p>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, margin: '0 0 20px' }}>
        For coordinators and family team members with a password.
      </p>

      {/* ── Fields ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>

        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            style={inp}
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            autoFocus
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
              Password
            </label>
            <button
              onClick={() => setShowPass(p => !p)}
              style={{ fontSize: '10px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showPass ? 'text' : 'password'}
            style={inp}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '14px', lineHeight: 1.6 }}>
          {error}
        </p>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleSignIn}
        disabled={!canSubmit || signing}
        style={{
          width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
          background: canSubmit
            ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
            : 'rgba(255,255,255,0.05)',
          color:    canSubmit ? '#1a0845' : textFaint,
          fontSize: '14px', fontWeight: 700,
          cursor:   canSubmit && !signing ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {signing ? 'Checking credentials…' : 'Sign In →'}
      </button>

      {/* ── Forgot password ── */}
      <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center', marginTop: '14px', lineHeight: 1.65 }}>
        Forgot your password? Ask the organiser to resend your invite link — it will let you set a new one.
      </p>
    </div>
  )
}
