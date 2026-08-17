'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/AdminLoginPanel.tsx
// PURPOSE:   Inline password login panel for FR Full Access and Co-admin.
//            Triggered by "Sign in with password →" button on the manage
//            dashboard unauthenticated screen.
//            Slides over (covers) the magic link section — can retract to
//            reveal the magic link option again.
//            On successful login: reloads the page so the server-side
//            session cookie is picked up.
//            ECS: warm, simple, no technical language.
// ARCHITECTURE: CA-SPEC-001 — Step 15a.
//               Calls /api/team/verify → session cookie set → page reload.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.15
// DATE:      16 August 2026
// PROPS:
//   capsuleSlug  — needed for /api/team/verify
//   honoureeName — shown in contextual copy
//   onBack       — callback to retract panel and show magic link again
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBorder  = 'rgba(226,195,107,0.18)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '15px', padding: '13px 16px',
  borderRadius: '12px', background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${cardBorder}`, color: textPrimary,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 2 — Props ═══

interface AdminLoginPanelProps {
  capsuleSlug:  string
  honoureeName: string
  onBack:       () => void
}

// ═══ SECTION 3 — Component ═══

export default function AdminLoginPanel({
  capsuleSlug,
  honoureeName,
  onBack,
}: AdminLoginPanelProps) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [signing,  setSigning]  = useState(false)
  const [error,    setError]    = useState('')

  const canSubmit = email.includes('@') && password.length >= 8

  const handleSignIn = async () => {
    if (!canSubmit || signing) return
    setSigning(true); setError('')

    try {
      const res = await fetch('/api/team/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        email.trim().toLowerCase(),
          password,
          capsule_slug: capsuleSlug,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSigning(false)
        return
      }

      // Session cookie set server-side — reload to pick it up
      window.location.reload()

    } catch {
      setError('Something went wrong. Please try again.')
      setSigning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) handleSignIn()
  }

  return (
    <div style={{
      width: '100%', maxWidth: '320px',
      animation: 'slideIn 0.2s ease',
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Back link ── */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: goldMuted,
          fontSize: '12px', cursor: 'pointer', padding: '0 0 20px',
          display: 'flex', alignItems: 'center', gap: '6px',
          letterSpacing: '0.03em',
        }}
      >
        ← Use a magic link instead
      </button>

      {/* ── Header ── */}
      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '20px', fontWeight: 700,
        color: textPrimary, margin: '0 0 6px', lineHeight: 1.35,
      }}>
        Welcome back
      </p>
      <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.7, margin: '0 0 24px' }}>
        Sign in to manage <strong style={{ color: goldMuted }}>{honoureeName}</strong>'s capsule.
      </p>

      {/* ── Email ── */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          fontSize: '10px', color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          display: 'block', marginBottom: '6px',
        }}>
          Email
        </label>
        <input
          type="email"
          style={inp}
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="email"
        />
      </div>

      {/* ── Password ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{
            fontSize: '10px', color: goldMuted,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
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
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="current-password"
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <p style={{
          fontSize: '12px', color: 'rgba(248,113,113,0.8)',
          marginBottom: '14px', lineHeight: 1.6,
        }}>
          {error}
        </p>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleSignIn}
        disabled={!canSubmit || signing}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: canSubmit
            ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
            : 'rgba(255,255,255,0.05)',
          color:    canSubmit ? '#1a0845' : textFaint,
          fontSize: '15px', fontWeight: 700,
          cursor:   canSubmit && !signing ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {signing ? 'Signing in…' : 'Sign In →'}
      </button>

      {/* ── Forgot password — no self-service at launch ── */}
      <p style={{
        fontSize: '11px', color: textFaint,
        textAlign: 'center', marginTop: '16px', lineHeight: 1.65,
      }}>
        Forgot your password? Ask the organiser to resend your invite link — it will let you set a new one.
      </p>
    </div>
  )
}
