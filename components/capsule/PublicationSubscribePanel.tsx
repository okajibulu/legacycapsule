'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/capsule/PublicationSubscribePanel.tsx
// PURPOSE: Inline panel shown on the tribute wall (and other capsule rooms)
//          inviting guests to register their email to receive the publication.
//          Targets three personas:
//            1. Contributor who forgot their email at submission time
//            2. Attending guest who never visited the capsule digitally
//            3. Family member registering on behalf of someone else
//
//          Inserts into publication_subscribers via /api/publication/subscribe.
//          Deduplication handled server-side (unique index on capsule_id + email).
//
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Props ═══

interface Props {
  capsuleId:    string
  honoureeName: string
}

// ═══ SECTION 2 — Design tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.08)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.35)'
const inp: React.CSSProperties = {
  flex: 1, fontSize: '13px', padding: '11px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  minWidth: 0,
}

// ═══ SECTION 3 — Component ═══

export default function PublicationSubscribePanel({ capsuleId, honoureeName }: Props) {
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [expanded,  setExpanded]  = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !email.includes('@')) return
    setSubmitting(true); setError('')
    try {
      const res  = await fetch('/api/publication/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          name:       name.trim(),
          email:      email.trim().toLowerCase(),
          source:     'self',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 409 = already subscribed — treat as success
        if (res.status === 409) { setDone(true); return }
        throw new Error(data.error ?? 'Something went wrong')
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  // ── Collapsed state — teaser only ──────────────────────────────────────
  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          padding: '14px 18px', borderRadius: '14px',
          background: goldFaint, border: '1px solid rgba(226,195,107,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
          marginTop: '8px',
        }}
      >
        <span style={{ fontSize: '20px', flexShrink: 0 }}>✦</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: '0 0 2px' }}>
            Receive the keepsake publication
          </p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.5 }}>
            After the event, every tribute, story and photo is assembled into a permanent keepsake. Tap to register your email.
          </p>
        </div>
        <span style={{ fontSize: '12px', color: goldMuted, flexShrink: 0 }}>→</span>
      </div>
    )
  }

  // ── Expanded — done state ───────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ padding: '16px 18px', borderRadius: '14px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', marginTop: '8px', textAlign: 'center' as const }}>
        <p style={{ fontSize: '22px', margin: '0 0 8px' }}>✓</p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 4px' }}>You're on the list</p>
        <p style={{ fontSize: '12px', color: textFaint, margin: 0, lineHeight: 1.65 }}>
          We'll send the keepsake publication for {honoureeName}'s event to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</strong> when it's ready.
        </p>
      </div>
    )
  }

  // ── Expanded — form state ───────────────────────────────────────────────
  return (
    <div style={{ padding: '16px 18px', borderRadius: '14px', background: goldFaint, border: '1px solid rgba(226,195,107,0.15)', marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 3px' }}>
            Receive the keepsake publication
          </p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.5 }}>
            Every tribute, story, and photo — assembled and sent to you after the event.
          </p>
        </div>
        <button
          onClick={() => setExpanded(false)}
          style={{ background: 'none', border: 'none', color: textFaint, cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px', flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          style={inp}
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            style={inp}
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={120}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !email.includes('@')}
            style={{
              flexShrink: 0, padding: '11px 16px', borderRadius: '10px', border: 'none',
              background: name.trim() && email.includes('@')
                ? 'linear-gradient(135deg, #E2C36B, #C9A84E)'
                : 'rgba(255,255,255,0.06)',
              color: name.trim() && email.includes('@') ? '#1a0845' : textFaint,
              fontSize: '13px', fontWeight: 700,
              cursor: name.trim() && email.includes('@') ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? '…' : 'Register'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '8px' }}>{error}</p>
      )}

      <p style={{ fontSize: '10px', color: textFaint, marginTop: '10px', lineHeight: 1.5 }}>
        You'll receive one email when the publication is released — nothing else.
      </p>
    </div>
  )
}
