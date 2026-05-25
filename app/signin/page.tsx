'use client'

/* =========================================================
   /signin — 4-Character OTP Sign In
   Sends a branded 4-char code via Resend.
   User enters code in same browser window.
   No magic links. No device switching.
========================================================= */

import { useState } from 'react'
import Link from 'next/link'

const pageBg = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)'
const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '15px', padding: '14px 18px',
  borderRadius: '12px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)', color: textPrimary,
  outline: 'none', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const, textAlign: 'center' as const,
  letterSpacing: '0.04em',
}

const codeInp: React.CSSProperties = {
  ...inp,
  fontSize: '32px', fontWeight: 800, letterSpacing: '0.5em',
  fontFamily: "'Courier New', monospace",
  padding: '18px', textTransform: 'uppercase' as const,
  color: gold,
}

export default function SignInPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(false)

  const handleSendCode = async () => {
    if (!email.includes('@')) return
    setSending(true); setError('')
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send code. Please try again.')
        setSending(false); return
      }
      setStep('code')
      // Store email in localStorage for backward compat
      localStorage.setItem('lc_visitor_email', email.trim().toLowerCase())
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  const handleVerifyCode = async () => {
    if (code.trim().length < 4) return
    setVerifying(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setError(data.error ?? 'Incorrect code. Please try again.')
        setVerifying(false); return
      }

      // Store email in localStorage
      localStorage.setItem('lc_visitor_email', email.trim().toLowerCase())

      // If we got real Supabase session tokens, set them in the browser
      // This makes the session persist across all pages without re-auth
      if (data.accessToken && data.refreshToken) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          await supabaseClient.auth.setSession({
            access_token: data.accessToken,
            refresh_token: data.refreshToken,
          })
        } catch (sessionErr) {
          console.error('Session set error:', sessionErr)
          // Non-fatal — localStorage fallback works
        }
      }

      // Navigate to dashboard
      window.location.href = data.redirect ?? '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown) return
    setResendCooldown(true); setError(''); setCode('')
    await handleSendCode()
    setTimeout(() => setResendCooldown(false), 30000)
  }

  return (
    <div style={{
      minHeight: '100vh', background: pageBg,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '40px' }}>
        <span style={{
          fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em',
          background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LEGACY</span>
        <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${goldFaint}`, borderRadius: '24px',
        padding: '36px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '32px', right: '32px', height: '1px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.5), transparent)` }} />

        {step === 'email' ? (
          <>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 20px', background: goldFaint, border: `1px solid rgba(226,195,107,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>◈</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: textPrimary, marginBottom: '10px' }}>Sign In</h2>
            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.65, marginBottom: '28px' }}>
              Enter your email. We'll send a 4-character code to sign you in — no link to click, no device switching.
            </p>
            <input
              type="email" placeholder="you@example.com"
              value={email} onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && email.includes('@') && handleSendCode()}
              style={inp} autoFocus autoComplete="email"
            />
            {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.85)', marginTop: '10px' }}>{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={!email.includes('@') || sending}
              style={{
                width: '100%', marginTop: '14px', padding: '14px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', border: 'none',
                cursor: !email.includes('@') || sending ? 'not-allowed' : 'pointer',
                background: !email.includes('@') || sending ? 'rgba(226,195,107,0.12)' : `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
                color: !email.includes('@') || sending ? 'rgba(226,195,107,0.4)' : '#1a0845',
                boxShadow: !email.includes('@') || sending ? 'none' : '0 4px 24px rgba(226,195,107,0.25)',
                transition: 'all 0.2s',
              }}
            >{sending ? 'Sending…' : 'Send Sign-In Code'}</button>
            <div style={{ height: '1px', margin: '24px 0', background: `linear-gradient(to right, transparent, ${goldFaint}, transparent)` }} />
            <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65 }}>
              No account yet?{' '}
              <Link href="/book" style={{ color: goldMuted, textDecoration: 'none' }}>Create a capsule free →</Link>
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '36px', marginBottom: '16px', lineHeight: 1 }}>✉</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Check your email</h2>
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.65, marginBottom: '6px' }}>We sent a 4-character code to</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: gold, marginBottom: '28px' }}>{email}</p>

            <input
              type="text" placeholder="A B C D"
              value={code}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)
                setCode(val); setError('')
              }}
              onKeyDown={e => e.key === 'Enter' && code.length === 4 && handleVerifyCode()}
              style={codeInp} autoFocus autoComplete="off" maxLength={4}
            />
            {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.85)', marginTop: '10px' }}>{error}</p>}
            <button
              onClick={handleVerifyCode}
              disabled={code.length < 4 || verifying}
              style={{
                width: '100%', marginTop: '14px', padding: '14px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', border: 'none',
                cursor: code.length < 4 || verifying ? 'not-allowed' : 'pointer',
                background: code.length < 4 || verifying ? 'rgba(226,195,107,0.12)' : `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
                color: code.length < 4 || verifying ? 'rgba(226,195,107,0.4)' : '#1a0845',
                boxShadow: code.length < 4 || verifying ? 'none' : '0 4px 24px rgba(226,195,107,0.25)',
                transition: 'all 0.2s',
              }}
            >{verifying ? 'Verifying…' : 'Sign In'}</button>

            <div style={{ height: '1px', margin: '20px 0', background: `linear-gradient(to right, transparent, ${goldFaint}, transparent)` }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => { setStep('email'); setCode(''); setError('') }} style={{ fontSize: '12px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer' }}>← Different email</button>
              <button onClick={handleResend} disabled={resendCooldown} style={{ fontSize: '12px', color: resendCooldown ? textFaint : goldMuted, background: 'none', border: 'none', cursor: resendCooldown ? 'default' : 'pointer' }}>
                {resendCooldown ? 'Code sent' : 'Resend code'}
              </button>
            </div>

            <p style={{ fontSize: '11px', color: textFaint, marginTop: '16px', lineHeight: 1.6 }}>
              Code expires in 15 minutes. Check your spam folder if it doesn't arrive.
            </p>
          </>
        )}
      </div>

      <p style={{ marginTop: '32px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        VALNEX, UNIPESSOAL LDA · RevoWorldTech
      </p>
    </div>
  )
}
