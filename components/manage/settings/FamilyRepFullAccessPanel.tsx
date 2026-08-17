'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/FamilyRepFullAccessPanel.tsx
// PURPOSE:   Shows the current Family Rep Full Access holder for a capsule,
//            or an invite form if no one has been given Full Access yet.
//            Full Access is the most capable account — can do everything
//            the organiser can do, plus respond to voices and acknowledgements.
//            Only one Full Access account per capsule.
//            ECS: respectful, warm, explains significance without being alarming.
// ARCHITECTURE: CA-SPEC-001 — Step 9.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// PROPS:
//   capsuleId    — capsule UUID
//   capsuleSlug  — for portal URL construction
//   honoureeName — shown in contextual copy
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 2 — Types ═══

interface FRFAAccount {
  id:             string
  name:           string
  email:          string
  invite_sent_at: string | null
  invite_used_at: string | null
  last_active_at: string | null
  is_active:      boolean
}

interface Props {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
}

// ═══ SECTION 3 — Component ═══

export default function FamilyRepFullAccessPanel({
  capsuleId,
  capsuleSlug,
  honoureeName,
}: Props) {
  const [account,  setAccount]  = useState<FRFAAccount | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [inviting, setInviting] = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')

  const formatDate = (s: string | null) => {
    if (!s) return null
    return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ── Fetch existing FRFA account ─────────────────────────────────────────
  const fetchAccount = async () => {
    try {
      const res = await fetch(`/api/team/accounts?capsule_id=${capsuleId}&type=family_rep_full_access`)
      const data = await res.json()
      setAccount(data.accounts?.[0] ?? null)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAccount() }, [capsuleId])

  // ── Send invite ─────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!name.trim() || !email.includes('@') || sending) return
    setSending(true); setError('')

    try {
      const res = await fetch('/api/team/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:   capsuleId,
          capsule_slug: capsuleSlug,
          account_type: 'family_rep_full_access',
          name:         name.trim(),
          email:        email.trim(),
          created_by:   'organiser',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setSending(false); return }
      setSent(true); fetchAccount()
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  if (loading) return <p style={{ fontSize: '12px', color: textFaint }}>Loading…</p>

  // ── FRFA account exists ─────────────────────────────────────────────────
  if (account) {
    const hasAccessed = !!account.invite_used_at
    return (
      <div>
        <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, marginBottom: '14px' }}>
          This person has full access to {honoureeName}'s capsule — including the ability to respond to voices and acknowledgements on behalf of the family.
        </p>
        <div style={{
          padding: '14px 16px', borderRadius: '12px',
          background: 'rgba(226,195,107,0.04)',
          border: `1px solid rgba(226,195,107,0.2)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 3px' }}>{account.name}</p>
              <p style={{ fontSize: '12px', color: goldMuted, margin: 0 }}>{account.email}</p>
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '8px', letterSpacing: '0.1em', textTransform: 'uppercase',
              background: hasAccessed ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${hasAccessed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`,
              color: hasAccessed ? 'rgba(134,239,172,0.8)' : textFaint,
            }}>
              {hasAccessed ? 'Active' : 'Pending'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {account.invite_sent_at && (
              <span style={{ fontSize: '10px', color: textFaint }}>Invited: {formatDate(account.invite_sent_at)}</span>
            )}
            {hasAccessed
              ? <span style={{ fontSize: '10px', color: textFaint }}>Last active: {formatDate(account.last_active_at)}</span>
              : <span style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic' }}>Hasn't set up access yet</span>
            }
          </div>
        </div>
        <p style={{ fontSize: '11px', color: textFaint, marginTop: '10px', lineHeight: 1.65, fontStyle: 'italic' }}>
          Only one person can hold Full Access at a time. To change who this is, revoke the current access first from the activity panel.
        </p>
      </div>
    )
  }

  // ── No FRFA yet — invite form ───────────────────────────────────────────
  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, marginBottom: '16px' }}>
        Family Rep Full Access gives someone the ability to manage the capsule the way you do — respond to voices, set the Family Appreciation, and oversee contributions — without accessing billing or account settings. It is designed for the most trusted family lead or co-organiser.
      </p>

      {/* ── Tip box ── */}
      <div style={{
        padding: '12px 14px', borderRadius: '10px', marginBottom: '20px',
        background: goldFaint, border: `1px solid rgba(226,195,107,0.2)`,
      }}>
        <p style={{ fontSize: '11px', color: goldMuted, lineHeight: 1.7, margin: 0 }}>
          ✦ <strong>Who should get Full Access?</strong> Typically the lead family contact — the person who will be greeting guests, reading tributes, and responding to acknowledgements on the day. They get their own login and see the same dashboard you do.
        </p>
      </div>

      {!inviting ? (
        <button
          onClick={() => setInviting(true)}
          style={{
            width: '100%', padding: '11px', borderRadius: '10px',
            border: `1px dashed rgba(226,195,107,0.25)`,
            background: 'transparent', color: goldMuted,
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          + Invite a Family Rep Full Access
        </button>
      ) : sent ? (
        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: '0 0 4px' }}>
            ✓ Invitation sent to {name}
          </p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
            They'll receive an email with a link to set up their password and access the dashboard.
          </p>
        </div>
      ) : (
        <div style={{ borderRadius: '12px', border: `1px solid rgba(226,195,107,0.2)`, background: 'rgba(226,195,107,0.03)', padding: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
            Invite Family Rep Full Access
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their Name</label>
              <input style={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Their Email</label>
              <input type="email" style={inp} placeholder="Their email address" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleInvite}
              disabled={!name.trim() || !email.includes('@') || sending}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: name.trim() && email.includes('@')
                  ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
                  : 'rgba(255,255,255,0.04)',
                color: name.trim() && email.includes('@') ? '#1a0845' : textFaint,
                fontSize: '13px', fontWeight: 700,
                cursor: name.trim() && email.includes('@') && !sending ? 'pointer' : 'not-allowed',
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? 'Sending…' : 'Send Invite →'}
            </button>
            <button
              onClick={() => { setInviting(false); setName(''); setEmail(''); setError('') }}
              style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
