'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/CoadminCard.tsx
// PURPOSE:   Displays a single Co-admin account in the Team tab.
//            Shows name, email, permission badges, invite/active status.
//            Allows organiser to edit permissions, resend invite, end access.
//            ECS: "end access" not "delete", warm confirmation language.
// ARCHITECTURE: CA-SPEC-001 — Step 11.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import PermissionPicker from './PermissionPicker'

// ═══ SECTION 1 — Theme ═══

const gold      = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const cardBg    = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

// ═══ SECTION 2 — Types ═══

export interface CoadminAccount {
  id:              string
  name:            string
  email:           string
  invite_sent_at:  string | null
  invite_used_at:  string | null
  last_active_at:  string | null
  is_active:       boolean
  permissions:     string[]
}

interface CoadminCardProps {
  account:   CoadminAccount
  onRevoke:  (id: string) => void
  onResend:  (id: string) => void
  onUpdated: (id: string) => void
}

// ═══ SECTION 3 — Component ═══

export default function CoadminCard({ account, onRevoke, onResend, onUpdated }: CoadminCardProps) {
  const [editingPerms,   setEditingPerms]   = useState(false)
  const [newPerms,       setNewPerms]       = useState<string[]>(account.permissions)
  const [confirmRevoke,  setConfirmRevoke]  = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [revoking,       setRevoking]       = useState(false)
  const [resending,      setResending]      = useState(false)
  const [resent,         setResent]         = useState(false)
  const [error,          setError]          = useState('')

  const hasAccessed = !!account.invite_used_at

  const formatDate = (s: string | null) => {
    if (!s) return null
    return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleSavePerms = async () => {
    if (newPerms.length === 0) { setError('Select at least one area.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/team/permissions', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ account_id: account.id, permissions: newPerms }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setSaving(false); return }
      setEditingPerms(false); onUpdated(account.id)
    } catch { setError('Something went wrong.') }
    setSaving(false)
  }

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
    } catch { setError('Something went wrong.') }
    setRevoking(false)
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
      setResent(true); setTimeout(() => setResent(false), 2500); onResend(account.id)
    } catch { setError('Something went wrong.') }
    setResending(false)
  }

  return (
    <div style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, padding: '14px 16px', marginBottom: '8px' }}>

      {/* ── Top row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.name}</p>
          <p style={{ fontSize: '11px', color: goldMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.email}</p>
        </div>
        <span style={{
          flexShrink: 0, marginLeft: '10px', fontSize: '9px', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '8px',
          background: hasAccessed ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hasAccessed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`,
          color: hasAccessed ? 'rgba(134,239,172,0.8)' : textFaint,
        }}>
          {hasAccessed ? 'Active' : 'Pending'}
        </span>
      </div>

      {/* ── Permission badges ── */}
      {!editingPerms && account.permissions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
          {account.permissions.map(p => (
            <span key={p} style={{
              fontSize: '9px', padding: '2px 8px', borderRadius: '6px',
              background: 'rgba(226,195,107,0.08)', border: '1px solid rgba(226,195,107,0.15)',
              color: goldMuted, letterSpacing: '0.06em',
            }}>
              {p.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* ── Activity ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {account.invite_sent_at && <span style={{ fontSize: '10px', color: textFaint }}>Invited: {formatDate(account.invite_sent_at)}</span>}
        {hasAccessed
          ? <span style={{ fontSize: '10px', color: textFaint }}>Last active: {formatDate(account.last_active_at)}</span>
          : <span style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic' }}>Hasn't set up access yet</span>
        }
      </div>

      {/* ── Edit permissions ── */}
      {editingPerms && (
        <div style={{ marginBottom: '12px' }}>
          <PermissionPicker selected={newPerms} onChange={setNewPerms} />
          {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              onClick={handleSavePerms}
              disabled={saving || newPerms.length === 0}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : 'Save permissions'}
            </button>
            <button onClick={() => { setEditingPerms(false); setNewPerms(account.permissions); setError('') }} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      {error && !editingPerms && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '8px' }}>{error}</p>}

      {confirmRevoke ? (
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', lineHeight: 1.6 }}>
            This will end {account.name}'s access immediately. Their past actions will remain on record.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRevoke} disabled={revoking} style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.9)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: revoking ? 0.7 : 1 }}>
              {revoking ? 'Ending access…' : 'Yes, end access'}
            </button>
            <button onClick={() => setConfirmRevoke(false)} style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {!editingPerms && (
            <button onClick={() => setEditingPerms(true)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(226,195,107,0.2)', background: 'rgba(226,195,107,0.05)', color: goldMuted, fontSize: '11px', cursor: 'pointer' }}>
              Edit access
            </button>
          )}
          {resent ? (
            <span style={{ fontSize: '11px', color: 'rgba(134,239,172,0.8)', padding: '6px 0' }}>✓ Link resent</span>
          ) : (
            <button onClick={handleResend} disabled={resending} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '11px', cursor: 'pointer', opacity: resending ? 0.6 : 1 }}>
              {resending ? '…' : 'Resend invite'}
            </button>
          )}
          <button onClick={() => setConfirmRevoke(true)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.7)', fontSize: '11px', cursor: 'pointer' }}>
            End access
          </button>
        </div>
      )}
    </div>
  )
}
