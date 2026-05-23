'use client'

/* =========================================================
   /signin — Premium Sign In Page
   Magic link authentication via Supabase Auth.
   Sends a login link to the organiser's email.
   Handles: organiser, planner, family rep, reseller — all roles.
========================================================= */

import { useState } from 'react'
import Link from 'next/link'
import { getAuthClient } from '@/lib/supabaseAuth'

const pageBg = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)'
const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%',
  fontSize: '14px',
  padding: '14px 18px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary,
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
  textAlign: 'center' as const,
}

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    if (!email.includes('@')) return
    setSending(true)
    setError('')

    try {
      const supabase = getAuthClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        setSending(false)
        return
      }

      // Also store in localStorage for backward compatibility
      localStorage.setItem('lc_visitor_email', email.trim().toLowerCase())
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '40px', display: 'block' }}>
        <span style={{
          fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em',
          background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LEGACY</span>
        <span style={{
          fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em',
          color: textFaint, marginLeft: '0.1em',
        }}>CAPSULE</span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${goldFaint}`,
        borderRadius: '24px',
        padding: '36px 28px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Gold top rule */}
        <div style={{
          position: 'absolute', top: 0, left: '32px', right: '32px', height: '1px',
          background: `linear-gradient(to right, transparent, rgba(226,195,107,0.5), transparent)`,
        }} />

        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          margin: '0 auto 24px',
          background: goldFaint,
          border: `1px solid rgba(226,195,107,0.22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', lineHeight: 1,
          boxShadow: '0 0 24px rgba(226,195,107,0.1)',
        }}>
          ◈
        </div>

        {sent ? (
          /* ── SENT STATE ── */
          <>
            {/* Envelope */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              margin: '0 auto 20px',
              background: goldFaint,
              border: `1px solid rgba(226,195,107,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', lineHeight: 1,
              boxShadow: '0 0 32px rgba(226,195,107,0.12)',
            }}>
              ✉
            </div>

            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: 700,
              color: textPrimary, marginBottom: '12px',
            }}>
              Check your inbox
            </h2>

            <p style={{
              fontSize: '14px', color: textSecondary,
              lineHeight: 1.7, marginBottom: '8px',
            }}>
              We sent a sign-in link to
            </p>
            <p style={{
              fontSize: '14px', fontWeight: 600,
              color: gold, marginBottom: '24px',
            }}>
              {email}
            </p>

            <p style={{
              fontSize: '12px', color: textFaint,
              lineHeight: 1.65,
            }}>
              Click the link in the email to access your capsule dashboard.
              The link expires in 1 hour.
            </p>

            <div style={{
              height: '1px', margin: '24px 0',
              background: `linear-gradient(to right, transparent, ${goldFaint}, transparent)`,
            }} />

            <button
              onClick={() => { setSent(false); setEmail(''); }}
              style={{
                fontSize: '12px', color: goldMuted,
                background: 'none', border: 'none',
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          /* ── INPUT STATE ── */
          <>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '22px', fontWeight: 700,
              color: textPrimary, marginBottom: '10px',
            }}>
              Sign In
            </h2>

            <p style={{
              fontSize: '14px', color: textSecondary,
              lineHeight: 1.65, marginBottom: '28px',
            }}>
              Enter the email you used to create your capsule.
              We'll send you a secure sign-in link.
            </p>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && email.includes('@') && handleSignIn()}
              style={inp}
              autoFocus
              autoComplete="email"
            />

            {error && (
              <p style={{
                fontSize: '12px', color: 'rgba(248,113,113,0.8)',
                marginTop: '10px',
              }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSignIn}
              disabled={!email.includes('@') || sending}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: 'none',
                cursor: !email.includes('@') || sending ? 'not-allowed' : 'pointer',
                background: !email.includes('@') || sending
                  ? 'rgba(226,195,107,0.12)'
                  : `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
                color: !email.includes('@') || sending
                  ? 'rgba(226,195,107,0.4)'
                  : '#1a0845',
                boxShadow: !email.includes('@') || sending
                  ? 'none'
                  : '0 4px 24px rgba(226,195,107,0.25)',
                transition: 'all 0.2s',
              }}
            >
              {sending ? 'Sending…' : 'Send Sign-In Link'}
            </button>

            <div style={{
              height: '1px', margin: '24px 0',
              background: `linear-gradient(to right, transparent, ${goldFaint}, transparent)`,
            }} />

            <p style={{
              fontSize: '12px', color: textFaint,
              lineHeight: 1.65,
            }}>
              Don't have a capsule yet?{' '}
              <Link href="/book" style={{
                color: goldMuted,
                textDecoration: 'none',
              }}>
                Create one free →
              </Link>
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <p style={{
        marginTop: '36px',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.12)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        VALNEX, UNIPESSOAL LDA · RevoWorldTech
      </p>
    </div>
  )
}
