/**
 * ============================================================
 * FILE PATH: components/HonoureeRevealPanel.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Experience 5 — Subject Reveal. Organiser presses one button
 * to send the honouree/subject their Capsule reveal email.
 *
 * Usage: Import into manage/[slug]/page.tsx Settings tab.
 *
 * Sub-sections:
 *   1. Types & props
 *   2. Main component
 *   3. Email input
 *   4. Confirmation flow
 *   5. Sent state
 * ============================================================
 */

'use client'

import { useState } from 'react'

// ============================================================
// SECTION 1 — Types & props
// ============================================================

interface HonoureeRevealPanelProps {
  capsuleId: string
  honoureeName: string
  honoureeEmail: string | null
  revealSentAt: string | null
  /** Style tokens matching manage page aesthetic */
  gold: string
  goldMuted: string
  goldFaint: string
  textPrimary: string
  textSecondary: string
  textFaint: string
  cardBorder: string
  inp: React.CSSProperties
}

// ============================================================
// SECTION 2 — Main component
// ============================================================

export default function HonoureeRevealPanel({
  capsuleId,
  honoureeName,
  honoureeEmail,
  revealSentAt,
  gold,
  goldMuted,
  goldFaint,
  textPrimary,
  textSecondary,
  textFaint,
  cardBorder,
  inp,
}: HonoureeRevealPanelProps) {
  const [email, setEmail] = useState(honoureeEmail ?? '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(!!revealSentAt)
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const firstName = honoureeName.split(' ')[0]

  // ============================================================
  // SECTION 3 — Send handler
  // ============================================================

  const handleReveal = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/capsule/honouree-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id: capsuleId,
          honouree_email: email.trim().toLowerCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSending(false)
        setConfirm(false)
        return
      }

      setSent(true)
      setMsg(`Reveal sent. ${firstName} has been notified.`)
      setConfirm(false)
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setSending(false)
  }

  // ============================================================
  // SECTION 4 — Sent state
  // ============================================================

  if (sent) {
    return (
      <div style={{
        borderRadius: '12px',
        border: `1px solid rgba(226,195,107,0.2)`,
        background: 'rgba(226,195,107,0.05)',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>✦</span>
          <p style={{ fontSize: '13px', fontWeight: 700, color: gold, margin: 0 }}>
            Reveal sent
          </p>
        </div>
        <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, margin: 0 }}>
          {msg || `${firstName} has received their Capsule reveal email. They now have private access to view all tributes and memories gathered in their honour.`}
        </p>
        {revealSentAt && (
          <p style={{ fontSize: '10px', color: textFaint, marginTop: '8px', fontStyle: 'italic' }}>
            First sent: {new Date(revealSentAt).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </p>
        )}
      </div>
    )
  }

  // ============================================================
  // SECTION 5 — Input + confirmation flow
  // ============================================================

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        When you are ready, send {firstName} their Capsule — all the voices, all the
        memories, all gathered for them. Choose the moment that feels right.
      </p>

      {/* Email input */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const,
          letterSpacing: '0.1em', display: 'block', marginBottom: '5px',
        }}>
          {firstName}&apos;s email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="their@email.com"
          style={inp}
        />
      </div>

      {/* Error message */}
      {error && (
        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>
          {error}
        </p>
      )}

      {/* Confirmation flow */}
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          disabled={!email.includes('@')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: email.includes('@')
              ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
              : 'rgba(255,255,255,0.04)',
            border: email.includes('@') ? 'none' : `1px solid ${cardBorder}`,
            color: email.includes('@') ? '#1a0845' : textFaint,
            fontSize: '13px',
            fontWeight: 700,
            cursor: email.includes('@') ? 'pointer' : 'not-allowed',
            letterSpacing: '0.04em',
          }}
        >
          ✦ Send the Reveal
        </button>
      ) : (
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          border: `1px solid rgba(226,195,107,0.25)`,
          background: 'rgba(226,195,107,0.05)',
        }}>
          <p style={{
            fontSize: '12px', color: textSecondary, textAlign: 'center',
            lineHeight: 1.65, marginBottom: '12px',
          }}>
            This will send {firstName} their Capsule reveal to <strong style={{ color: textPrimary }}>{email}</strong>.
            They will receive a private link to view all tributes. Ready?
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReveal}
              disabled={sending}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
                color: '#1a0845', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? 'Sending…' : 'Yes, send it'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              disabled={sending}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                background: 'transparent',
                border: `1px solid ${cardBorder}`,
                color: textFaint, fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Privacy note */}
      <p style={{ fontSize: '10px', color: textFaint, marginTop: '10px', lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>
        The reveal link is private and expires after 6 months. You can resend it any time from the Family Representative section above.
      </p>
    </div>
  )
}
