'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/auth/AdminSigninPanel.tsx
// PURPOSE:   Inline password login panel for FR Full Access and Co-admin.
//            Used on the /signin page where no capsule slug is in the URL.
//            User enters email, password, and capsule link (from which we
//            extract the slug). System calls /api/team/verify → session cookie.
//            Slides in when "Admin Login" is clicked. Retractable.
//            ECS: warm, plain English, no jargon.
// ARCHITECTURE: CA-SPEC-001 — Step 15a extension.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.16
// DATE:      17 August 2026
// PROPS:
//   onBack — callback to retract panel and show magic link form again
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBorder  = 'rgba(226,195,107,0.18)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '14px', padding: '12px 16px',
  borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${cardBorder}`, color: textPrimary,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 2 — Slug extractor ═══
// Accepts full URL or just the slug.
// itslegacycapsule.com/for/my-event → my-event
// itslegacycapsule.com/manage/my-event → my-event
// my-event → my-event

function extractSlug(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  // Try to extract from URL
  try {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const parsed = new URL(url)
    const parts  = parsed.pathname.split('/').filter(Boolean)
    // /for/[slug] or /manage/[slug]
    if (parts.length >= 2 && ['for', 'manage', 'family'].includes(parts[0])) {
      return parts[1]
    }
    // Just a path segment
    if (parts.length === 1) return parts[0]
  } catch {
    // Not a URL — treat as raw slug
  }

  // Raw slug — strip spaces and special chars
  return trimmed.replace(/[^a-z0-9-]/g, '') || null
}

// ═══ SECTION 3 — Component ═══

interface AdminSigninPanelProps {
  onBack: () => void
}

export default function AdminSigninPanel({ onBack }: AdminSigninPanelProps) {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [capsuleInput, setCapsuleInput] = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [signing,      setSigning]      = useState(false)
  const [error,        setError]        = useState('')

  const slug      = extractSlug(capsuleInput)
  const canSubmit = email.includes('@') && password.length >= 6 && !!slug

  const handleSignIn = async () => {
    if (!canSubmit || signing) return
    setSigning(true); setError('')

    try {
      const res  = await fetch('/api/team/verify', {
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
        setSigning(false)
        return
      }

      // Session cookie set — redirect to manage dashboard
      window.location.href = `/manage/${slug}`

    } catch {
      setError('Something went wrong. Please try again.')
      setSigning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) handleSignIn()
  }

  return (
    <div style={{ animation: 'slideIn 0.2s ease' }}>
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
          display: 'block', letterSpacing: '0.03em',
        }}
      >
        ← Use a sign-in code instead
      </button>

      {/* ── Header ── */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, margin: '0 0 6px' }}>
        Admin Sign In
      </h2>
      <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.7, margin: '0 0 22px' }}>
        For coordinators and family team members with a password.
      </p>

      {/* ── Fields ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

        {/* Email */}
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

        {/* Password */}
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

        {/* Capsule link */}
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>
            Your capsule link
          </label>
          <input
            style={inp}
            placeholder="itslegacycapsule.com/for/your-event"
            value={capsuleInput}
            onChange={e => setCapsuleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <p style={{ fontSize: '11px', color: textFaint, marginTop: '5px', lineHeight: 1.5 }}>
            The link to the event you were invited to manage.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '14px', lineHeight: 1.6 }}>
          {error}
        </p>
      )}

      {/* Submit */}
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
        {signing ? 'Signing in…' : 'Sign In →'}
      </button>

      {/* Forgot password */}
      <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center', marginTop: '16px', lineHeight: 1.65 }}>
        Forgot your password? Ask the organiser to resend your invite link — it will let you set a new one.
      </p>
    </div>
  )
}
