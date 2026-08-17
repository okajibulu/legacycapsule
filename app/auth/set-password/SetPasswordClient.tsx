'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/auth/set-password/SetPasswordClient.tsx
// PURPOSE:   Client-side UI for the set-password page.
//            Warm, simple, non-technical. Never mentions bcrypt, tokens, hashes.
//            One field, one button. Confirmation field prevents typos.
//            ECS: "You're in" energy — this is an exciting moment of access.
// ARCHITECTURE: CA-SPEC-001 — Step 8.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const bg          = '#0f0a1e'
const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.18)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '15px', padding: '13px 16px',
  borderRadius: '12px', background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${cardBorder}`, color: textPrimary,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box', letterSpacing: '0.02em',
}

// ═══ SECTION 2 — Props ═══

interface Props {
  token:        string
  accountType:  'family_rep_full_access' | 'coadmin'
  capsuleSlug:  string
  honoureeName: string
  accountName:  string
  accountEmail: string
}

// ═══ SECTION 3 — Component ═══

export default function SetPasswordClient({
  token, accountType, capsuleSlug, honoureeName, accountName, accountEmail,
}: Props) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [showPass,  setShowPass]  = useState(false)

  const firstName  = accountName.split(' ')[0]
  const isFRFA     = accountType === 'family_rep_full_access'

  const roleLabel  = isFRFA
    ? 'Family Rep Full Access'
    : 'Co-admin'

  const redirectUrl = isFRFA
    ? `/manage/${capsuleSlug}`
    : `/manage/${capsuleSlug}/coadmin`

  // Validation
  const passwordOk    = password.length >= 8
  const passwordMatch = password === confirm
  const canSubmit     = passwordOk && passwordMatch && !saving

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true); setError('')

    try {
      const res = await fetch('/api/team/set-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password, account_type: accountType }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSaving(false)
        return
      }

      setDone(true)
      // Brief celebration moment then redirect
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 1800)

    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: bg,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus { border-color: rgba(226,195,107,0.55) !important; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.4s ease' }}>

        {/* ── Brand ── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: gold }}>
            LEGACY<span style={{ color: textFaint }}>CAPSULE</span>
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: '20px', overflow: 'hidden',
        }}>
          {/* Gold top bar */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #E2C36B, transparent)' }} />

          <div style={{ padding: '32px 28px 36px' }}>

            {done ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
                <p style={{ fontSize: '32px', marginBottom: '16px' }}>✦</p>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '22px', fontWeight: 700,
                  color: textPrimary, margin: '0 0 10px', lineHeight: 1.35,
                }}>
                  You're all set, {firstName}.
                </h1>
                <p style={{ fontSize: '14px', color: goldMuted, lineHeight: 1.7, margin: '0 0 24px' }}>
                  Taking you to {honoureeName}'s capsule now…
                </p>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: `2px solid ${goldFaint}`, borderTopColor: gold,
                  animation: 'spin 0.8s linear infinite', margin: '0 auto',
                }} />
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div style={{ marginBottom: '28px' }}>
                  <p style={{
                    fontSize: '10px', fontWeight: 700, color: goldMuted,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    margin: '0 0 12px',
                  }}>
                    {roleLabel}
                  </p>
                  <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '22px', fontWeight: 700,
                    color: textPrimary, margin: '0 0 8px', lineHeight: 1.35,
                  }}>
                    Welcome, {firstName}.
                  </h1>
                  <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.7, margin: 0 }}>
                    You've been given access to{' '}
                    <strong style={{ color: goldMuted }}>{honoureeName}</strong>'s capsule.
                    Create a password to get started — you'll use it every time you sign in.
                  </p>
                </div>

                {/* ── Email (read-only — context) ── */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontSize: '10px', color: goldMuted,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: '6px',
                  }}>
                    Your email
                  </p>
                  <div style={{
                    padding: '11px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '13px', color: textFaint,
                  }}>
                    {accountEmail}
                  </div>
                </div>

                {/* ── Password field ── */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Create a password
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
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                  />
                  {/* Strength hint — only shows when typing */}
                  {password.length > 0 && password.length < 8 && (
                    <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.7)', marginTop: '5px' }}>
                      A little longer — at least 8 characters
                    </p>
                  )}
                  {password.length >= 8 && (
                    <p style={{ fontSize: '11px', color: 'rgba(134,239,172,0.7)', marginTop: '5px' }}>
                      ✓ Good
                    </p>
                  )}
                </div>

                {/* ── Confirm field ── */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
                    Confirm password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    style={{
                      ...inp,
                      borderColor: confirm.length > 0 && !passwordMatch
                        ? 'rgba(248,113,113,0.4)'
                        : cardBorder,
                    }}
                    placeholder="Same password again"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                  {confirm.length > 0 && !passwordMatch && (
                    <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.7)', marginTop: '5px' }}>
                      These don't match yet
                    </p>
                  )}
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
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: '12px', border: 'none',
                    background: canSubmit
                      ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
                      : 'rgba(255,255,255,0.05)',
                    color: canSubmit ? '#1a0845' : textFaint,
                    fontSize: '15px', fontWeight: 700,
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'Setting up your access…' : 'Create my password →'}
                </button>

                {/* ── Reassurance ── */}
                <p style={{
                  fontSize: '11px', color: textFaint,
                  textAlign: 'center', marginTop: '16px', lineHeight: 1.65,
                }}>
                  This link is personal and has been sent to you directly.
                  Your access is private to this capsule only.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <p style={{
          fontSize: '10px', color: 'rgba(255,255,255,0.12)',
          textAlign: 'center', marginTop: '24px', letterSpacing: '0.08em',
        }}>
          VALNEX, UNIPESSOAL LDA · RevoWorldTech
        </p>
      </div>
    </div>
  )
}
