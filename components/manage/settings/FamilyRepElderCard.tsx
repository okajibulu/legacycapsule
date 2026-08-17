'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/FamilyRepElderCard.tsx
// PURPOSE:   Displays a single Family Rep Elder account in the Team tab.
//            Shows name, email, invite status, last active, and access actions.
//            Revoke action deactivates the account (is_active = false).
//            Resend action calls /api/team/resend.
//            ECS: "end access" not "delete", "hasn't visited yet" not "inactive".
// ARCHITECTURE: CA-SPEC-001 — Step 5.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// PROPS:
//   account  — capsule_accounts row
//   onRevoke — callback after revoke (parent refreshes)
//   onResend — callback after resend (parent refreshes)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold      = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const cardBg    = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textFaint     = 'rgba(255,255,255,0.28)'

// ═══ SECTION 2 — Types ═══

export interface FamilyRepElderAccount {
  id:              string
  name:            string
  email:           string
  invite_sent_at:  string | null
  invite_used_at:  string | null
  last_active_at:  string | null
  is_active:       boolean
}

interface FamilyRepElderCardProps {
  account:  FamilyRepElderAccount
  onRevoke: (id: string) => void
  onResend: (id: string, email: string, name: string) => void
}

// ═══ SECTION 3 — Component ═══

export default function FamilyRepElderCard({
  account,
  onRevoke,
  onResend,
}: FamilyRepElderCardProps) {
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [revoking,      setRevoking]      = useState(false)
  const [resending,     setResending]     = useState(false)
  const [resent,        setResent]        = useState(false)
  const [error,         setError]         = useState('')

  const formatDate = (s: string | null) => {
    if (!s) return null
    return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const hasAccessed = !!account.invite_used_at

  const handleRevoke = async () => {
    setRevoking(true); setError('')
    try {
      const res = await fetch('/api/team/revoke', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ account_id: account.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setRevoking(false); return }
      onRevoke(account.id)
    } catch {
      setError('Something went wrong. Please try again.')
      setRevoking(false)
    }
  }

  const handleResend = async () => {
    setResending(true); setError('')
    try {
      const res = await fetch('/api/team/resend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ account_id: account.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setResending(false); return }
      setResent(true)
      setTimeout(() => setResent(false), 2500)
      onResend(account.id, account.email, account.name)
    } catch {
      setError('Something went wrong.')
      setResending(false)
    }
  }

  return (
    <div style={{
      borderRadius: '12px', border: `1px solid ${cardBorder}`,
      background: cardBg, padding: '14px 16px', marginBottom: '8px',
    }}>

      {/* ── Top row — name + status badge ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {account.name}
          </p>
          <p style={{ fontSize: '11px', color: goldMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {account.email}
          </p>
        </div>
        <span style={{
          flexShrink: 0, marginLeft: '10px',
          fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '3px 9px', borderRadius: '8px',
          background: hasAccessed ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hasAccessed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`,
          color: hasAccessed ? 'rgba(134,239,172,0.8)' : textFaint,
        }}>
          {hasAccessed ? 'Active' : 'Pending'}
        </span>
      </div>

      {/* ── Activity row ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {account.invite_sent_at && (
          <span style={{ fontSize: '10px', color: textFaint }}>
            Invited: {formatDate(account.invite_sent_at)}
          </span>
        )}
        {hasAccessed ? (
          <span style={{ fontSize: '10px', color: textFaint }}>
            Last active: {formatDate(account.last_active_at) ?? 'recently'}
          </span>
        ) : (
          <span style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic' }}>
            Hasn't opened their portal yet
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      {error && (
        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '8px' }}>{error}</p>
      )}

      {confirmRevoke ? (
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)', marginBottom: '0' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', lineHeight: 1.6 }}>
            This will end {account.name}'s access immediately. Their past actions will remain on record.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.9)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: revoking ? 0.7 : 1 }}
            >
              {revoking ? 'Ending access…' : 'Yes, end access'}
            </button>
            <button
              onClick={() => setConfirmRevoke(false)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {resent ? (
            <span style={{ fontSize: '11px', color: 'rgba(134,239,172,0.8)', padding: '6px 0' }}>✓ New link sent to {account.email}</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.2)`, background: 'rgba(226,195,107,0.05)', color: goldMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: resending ? 0.6 : 1 }}
            >
              {resending ? '…' : hasAccessed ? 'Resend link' : 'Resend invite'}
            </button>
          )}
          <button
            onClick={() => setConfirmRevoke(true)}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.7)', fontSize: '11px', cursor: 'pointer' }}
          >
            End access
          </button>
        </div>
      )}
    </div>
  )
}
