'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/CoadminInvite.tsx
// PURPOSE:   Form to invite a new Co-admin with scoped permissions.
//            Uses PermissionPicker to select which sections they can access.
//            Submits to /api/team/invite with account_type: coadmin.
//            ECS: warm, plain English. "Coordinator" not "Co-admin" in copy.
//            Explains what each permission means before granting it.
// ARCHITECTURE: CA-SPEC-001 — Step 11.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
// PROPS:
//   capsuleId    — capsule UUID
//   capsuleSlug  — for portal URL construction
//   honoureeName — shown in contextual copy
//   onInvited    — callback after successful invite
// ─────────────────────────────────────────────────────────────────────────────

import { useState }      from 'react'
import PermissionPicker  from './PermissionPicker'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 2 — Props ═══

interface CoadminInviteProps {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  onInvited:    () => void
}

// ═══ SECTION 3 — Component ═══

export default function CoadminInvite({
  capsuleId,
  capsuleSlug,
  honoureeName,
  onInvited,
}: CoadminInviteProps) {
  const [open,        setOpen]        = useState(false)
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [sending,     setSending]     = useState(false)
  const [sent,        setSent]        = useState(false)
  const [error,       setError]       = useState('')

  const canSend = name.trim().length > 1 && email.includes('@') && permissions.length > 0

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
          account_type: 'coadmin',
          name:         name.trim(),
          email:        email.trim(),
          permissions,
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
        setSent(false); setName(''); setEmail('')
        setPermissions([]); setOpen(false)
        onInvited()
      }, 2500)

    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          border: '1px dashed rgba(226,195,107,0.25)',
          background: 'transparent', color: goldMuted,
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        + Invite a Coordinator
      </button>
    )
  }

  // ── Open form ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: '12px', border: '1px solid rgba(226,195,107,0.2)',
      background: 'rgba(226,195,107,0.03)', padding: '16px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Invite a Coordinator
      </p>

      {/* ── ECS guidance ── */}
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, marginBottom: '16px' }}>
        Coordinators get access only to the sections you choose. They receive a personal link to set up their own login and access their assigned area.
      </p>

      {/* ── Name + email ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their Name</label>
          <input style={inp} placeholder="Full name of the coordinator" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their Email</label>
          <input type="email" style={inp} placeholder="Their email address" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>

      {/* ── Permission picker ── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
          What can they access?
        </p>
        <PermissionPicker selected={permissions} onChange={setPermissions} />
      </div>

      {/* ── Validation hint ── */}
      {permissions.length === 0 && name.trim() && email.includes('@') && (
        <p style={{ fontSize: '11px', color: textFaint, marginBottom: '10px', fontStyle: 'italic' }}>
          Select at least one area before sending.
        </p>
      )}

      {error && (
        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>
      )}

      {sent ? (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
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
            {sending ? 'Sending invite…' : 'Send Invite →'}
          </button>
          <button
            onClick={() => { setOpen(false); setName(''); setEmail(''); setPermissions([]); setError('') }}
            style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
