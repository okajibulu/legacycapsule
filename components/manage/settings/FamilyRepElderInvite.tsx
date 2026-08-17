'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/FamilyRepElderInvite.tsx
// PURPOSE:   Form to invite a new Family Rep Elder.
//            Submits to /api/team/invite with account_type: family_rep_elder.
//            Shown in the Team sub-tab inside Settings.
//            ECS: warm, plain English — never "role", never "user".
// ARCHITECTURE: CA-SPEC-001 — Step 5.
//               Works alongside existing FamilyRepSection (legacy flow untouched).
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// PROPS:
//   capsuleId    — capsule UUID
//   capsuleSlug  — capsule slug for portal URL generation
//   honoureeName — shown in contextual copy
//   onInvited    — callback after successful invite (parent refreshes list)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold      = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.12)'
const goldMuted = 'rgba(226,195,107,0.55)'
const cardBg    = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 2 — Props ═══

interface FamilyRepElderInviteProps {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  onInvited:    () => void
}

// ═══ SECTION 3 — Component ═══

export default function FamilyRepElderInvite({
  capsuleId,
  capsuleSlug,
  honoureeName,
  onInvited,
}: FamilyRepElderInviteProps) {
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const canSend = name.trim().length > 1 && email.includes('@')

  const handleSend = async () => {
    if (!canSend || sending) return
    setSending(true); setError('')

    try {
      const res = await fetch('/api/team/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:   capsuleId,
          capsule_slug: capsuleSlug,
          account_type: 'family_rep_elder',
          name:         name.trim(),
          email:        email.trim(),
          created_by:   'organiser',
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSending(false)
        return
      }

      setSent(true)
      setTimeout(() => {
        setSent(false); setName(''); setEmail(''); setOpen(false)
        onInvited()
      }, 2500)

    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  // ── Collapsed state ─────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          border: `1px dashed rgba(226,195,107,0.25)`,
          background: 'transparent', color: goldMuted,
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        + Invite a Family Representative
      </button>
    )
  }

  // ── Open form ────────────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: '12px', border: `1px solid rgba(226,195,107,0.2)`,
      background: 'rgba(226,195,107,0.03)', padding: '16px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Invite a Family Representative
      </p>

      {/* ECS contextual guidance */}
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, marginBottom: '14px' }}>
        A Family Representative gets private access to read tributes, respond on behalf of the family, and view acknowledgements. They will receive a personal link by email — no password needed.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their Name</label>
          <input
            style={inp}
            placeholder="Full name of the family representative"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their Email</label>
          <input
            type="email"
            style={inp}
            placeholder="Their email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>
          {error}
        </p>
      )}

      {sent ? (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: 0 }}>
            ✓ An invitation has been sent to {name}. They'll receive an email with everything they need to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              background: canSend ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))` : 'rgba(255,255,255,0.04)',
              color: canSend ? '#1a0845' : textFaint,
              fontSize: '13px', fontWeight: 700,
              cursor: canSend && !sending ? 'pointer' : 'not-allowed',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Sending invite…' : 'Send Portal Access →'}
          </button>
          <button
            onClick={() => { setOpen(false); setName(''); setEmail(''); setError('') }}
            style={{
              padding: '10px 16px', borderRadius: '10px', border: `1px solid ${cardBorder}`,
              background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
