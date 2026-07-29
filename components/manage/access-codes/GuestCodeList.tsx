'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/GuestCodeList.tsx
// PURPOSE: Guest and code management panel for the Access Code System.
//          Two modes:
//            · Pre-generation: shows full guest roster with tier, email status,
//              and a prominent generate action. Guidance for missing emails.
//            · Post-generation: shows all codes regardless of email status,
//              per-code send/resend/revoke, bulk send, search and filter.
//          Clickable guest names open inline edit panel (name, tier, email, phone).
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: AI14 · Claude Opus 4.6 · 29 July 2026
// REPLACES: Previous version — hid guests without email, no guidance
// VERSION: v2.10.5
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect, useMemo, useCallback } from 'react'

interface Props {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  eventTag:     string | null
  onCodesGenerated?: (count: number) => void
}

interface Guest {
  id:           string
  name:         string
  email:        string | null
  phone:        string | null
  tier:         string
  rsvp_status:  string
  access_code:  string | null
}

interface AccessCode {
  id:               string
  guest_id:         string | null
  guest_name:       string
  guest_email:      string | null
  participant_type: string
  numeric_code:     string
  status:           string
  use_count:        number
  section_name:     string | null
}

type FilterKey = 'all' | 'unsent' | 'sent' | 'used' | 'revoked'

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint    = 'rgba(255,255,255,0.28)'
const successColor = 'rgba(134,239,172,0.8)'
const errorColor   = 'rgba(248,113,113,0.8)'
const warnColor    = 'rgba(251,191,36,0.85)'

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '9px 12px',
  borderRadius: '9px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Status and tier maps ═══

const STATUS_COLOR: Record<string, string> = {
  generated: 'rgba(255,255,255,0.35)',
  sent:      'rgba(147,197,253,0.85)',
  delivered: 'rgba(134,239,172,0.85)',
  used:      'rgba(74,222,128,0.95)',
  expired:   'rgba(255,255,255,0.2)',
  revoked:   'rgba(248,113,113,0.7)',
}

const STATUS_LABEL: Record<string, string> = {
  generated: 'NOT SENT',
  sent:      'SENT',
  delivered: 'DELIVERED',
  used:      'CHECKED IN',
  expired:   'EXPIRED',
  revoked:   'REVOKED',
}

const TIER_LABEL: Record<string, string> = {
  vvip:           'VVIP',
  vip:            'VIP',
  general:        'Guest',
  reception_only: 'Reception',
  staff:          'Staff',
  media:          'Media',
  vendor:         'Vendor',
}

const TIER_ACCENT: Record<string, string> = {
  vvip:           'rgba(251,191,36,0.5)',
  vip:            'rgba(192,132,252,0.5)',
  general:        'rgba(226,195,107,0.25)',
  reception_only: 'rgba(147,197,253,0.35)',
  staff:          'rgba(134,239,172,0.35)',
  media:          'rgba(249,168,212,0.35)',
  vendor:         'rgba(253,186,116,0.35)',
}

const GUEST_TIERS = ['General', 'VIP', 'VVIP', 'Reception Only', 'Staff', 'Media', 'Vendor']

// ═══ SECTION 4 — StatCard sub-component ═══

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{
      flex: 1, minWidth: '60px', padding: '10px 8px', borderRadius: '10px',
      background: accent ? 'rgba(226,195,107,0.07)' : cardBg,
      border: `1px solid ${accent ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.05)'}`,
      textAlign: 'center' as const,
    }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: accent ? gold : textPrimary, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '8px', color: textFaint, marginTop: '3px', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}

// ═══ SECTION 5 — GuestEditPanel sub-component ═══

function GuestEditPanel({ guest, onClose, onSaved }: {
  guest:   Guest
  onClose: () => void
  onSaved: () => void
}) {
  const [name,  setName]  = useState(guest.name)
  const [email, setEmail] = useState(guest.email ?? '')
  const [phone, setPhone] = useState(guest.phone ?? '')
  const [tier,  setTier]  = useState(guest.tier)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/guests', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:    guest.id,
          name:  name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          tier,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Save failed')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed' as const, inset: 0, zIndex: 60,
      background: 'rgba(8,2,20,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '540px',
        background: 'linear-gradient(160deg,#1a0845,#120630)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 20px 36px',
        maxHeight: '90vh', overflowY: 'auto' as const,
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.12em', fontWeight: 600 }}>
              Edit Guest
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>
              {guest.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>

          <div>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Full Name *
            </label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Guest name" />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Email Address
            </label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="For sending codes digitally" />
            {!email && (
              <p style={{ fontSize: '10px', color: warnColor, margin: '4px 0 0', lineHeight: 1.5 }}>
                Without an email, this guest's code can only be delivered as a printed access card.
              </p>
            )}
          </div>

          <div>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Phone Number
            </label>
            <input type="tel" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Guest Tier
            </label>
            <select style={{ ...inputStyle, background: '#1a0845' }} value={tier} onChange={e => setTier(e.target.value)}>
              {GUEST_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p style={{ fontSize: '10px', color: textFaint, margin: '4px 0 0', lineHeight: 1.5 }}>
              Tier affects the access level shown to ushers and the max-uses on the code.
            </p>
          </div>

          {error && <p style={{ fontSize: '12px', color: errorColor, margin: 0 }}>{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px', borderRadius: '10px', border: 'none',
              background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#E2C36B,#C8A84A)',
              color: saving ? textFaint : '#1a0845',
              fontSize: '13px', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 6 — Main component ═══

export default function GuestCodeList({
  capsuleId, capsuleSlug, honoureeName, eventTag, onCodesGenerated,
}: Props) {

  // ── 6.1 State ──────────────────────────────────────────────────────────────

  const [guests,       setGuests]       = useState<Guest[]>([])
  const [codes,        setCodes]        = useState<AccessCode[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState<FilterKey>('all')
  const [generating,   setGenerating]   = useState(false)
  const [genError,     setGenError]     = useState('')
  const [genMsg,       setGenMsg]       = useState('')
  const [sendingAll,   setSendingAll]   = useState(false)
  const [sendingId,    setSendingId]    = useState<string | null>(null)
  const [revokingId,   setRevokingId]   = useState<string | null>(null)
  const [editGuest,    setEditGuest]    = useState<Guest | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [msg,          setMsg]          = useState('')
  const [error,        setError]        = useState('')

  // ── 6.2 Fetch guests and codes ─────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [guestRes, codeRes] = await Promise.all([
        fetch(`/api/guests?capsule_id=${capsuleId}`),
        fetch(`/api/access-codes/list?capsule_id=${capsuleId}`),
      ])
      const [guestData, codeData] = await Promise.all([
        guestRes.json(),
        codeRes.json(),
      ])
      if (guestData.guests) setGuests(guestData.guests)
      if (codeData.codes)   setCodes(codeData.codes)
    } catch {
      setError('Could not load guest data. Please refresh.')
    }
    setLoading(false)
  }, [capsuleId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── 6.3 Computed values ────────────────────────────────────────────────────

  const codesExist   = codes.length > 0
  const withEmail    = useMemo(() => guests.filter(g => g.email).length, [guests])
  const withoutEmail = useMemo(() => guests.filter(g => !g.email).length, [guests])
  const unsent       = useMemo(() => codes.filter(c => c.status === 'generated').length, [codes])
  const sent         = useMemo(() => codes.filter(c => c.status === 'sent' || c.status === 'delivered').length, [codes])
  const checkedIn    = useMemo(() => codes.filter(c => c.status === 'used').length, [codes])
  const revoked      = useMemo(() => codes.filter(c => c.status === 'revoked').length, [codes])

  // Build a map of guest_id → code for the roster view
  const codeByGuestId = useMemo(() => {
    const map: Record<string, AccessCode> = {}
    codes.forEach(c => { if (c.guest_id) map[c.guest_id] = c })
    return map
  }, [codes])

  // Filtered codes for the code list view
  const filteredCodes = useMemo(() => {
    let result = codes
    if (filter !== 'all') {
      result = result.filter(c => {
        if (filter === 'unsent')  return c.status === 'generated'
        if (filter === 'sent')    return c.status === 'sent' || c.status === 'delivered'
        if (filter === 'used')    return c.status === 'used'
        if (filter === 'revoked') return c.status === 'revoked'
        return true
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.guest_name.toLowerCase().includes(q) ||
        c.numeric_code.includes(q) ||
        c.guest_email?.toLowerCase().includes(q)
      )
    }
    return result
  }, [codes, filter, search])

  // ── 6.4 Flash helpers ──────────────────────────────────────────────────────

  const flash = (text: string, isError = false) => {
    if (isError) { setError(text);   setTimeout(() => setError(''), 5000) }
    else         { setMsg(text);     setTimeout(() => setMsg(''), 4000)   }
  }

  // ── 6.5 Generate all codes ─────────────────────────────────────────────────

  const handleGenerateAll = async () => {
    setGenerating(true); setGenError(''); setGenMsg('')
    try {
      const res  = await fetch('/api/access-codes/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId, scope: 'all' }),
      })
      const data = await res.json()
      if (res.status === 409 && data.warning) {
        setGenError(data.error)
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGenMsg(`✓ ${data.generated} access codes generated.${data.config_defaulted ? ' Using free seating defaults — configure your hall in Setup if needed.' : ''}`)
      await fetchData()
      onCodesGenerated?.(data.generated)
    } catch (e: any) {
      setGenError(e.message || 'Something went wrong. Please try again.')
    }
    setGenerating(false)
  }

  // ── 6.6 Generate code for one guest ───────────────────────────────────────

  const handleGenerateOne = async (guestId: string) => {
    setGeneratingId(guestId); setError('')
    try {
      const res  = await fetch('/api/access-codes/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId, scope: 'selected', guest_ids: [guestId] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      flash('Code generated.')
      await fetchData()
    } catch (e: any) {
      flash(e.message || 'Could not generate code.', true)
    }
    setGeneratingId(null)
  }

  // ── 6.7 Send all unsent codes ─────────────────────────────────────────────

  const handleSendAll = async () => {
    setSendingAll(true); setError(''); setMsg('')
    try {
      const res  = await fetch('/api/access-codes/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    capsuleId,
          capsule_slug:  capsuleSlug,
          honouree_name: honoureeName,
          event_tag:     eventTag,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash(`✓ Sent to ${data.sent} guest${data.sent !== 1 ? 's' : ''}.${data.skipped > 0 ? ` ${data.skipped} skipped (no email).` : ''}`)
      await fetchData()
    } catch (e: any) {
      flash(e.message || 'Send failed. Please try again.', true)
    }
    setSendingAll(false)
  }

  // ── 6.8 Send / resend one code ────────────────────────────────────────────

  const handleSendOne = async (code: AccessCode) => {
    if (!code.guest_email) {
      flash('This guest has no email address. Add one by clicking their name.', true)
      return
    }
    setSendingId(code.id); setError('')
    try {
      const res  = await fetch('/api/access-codes/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    capsuleId,
          capsule_slug:  capsuleSlug,
          honouree_name: honoureeName,
          event_tag:     eventTag,
          guest_ids:     [code.guest_id],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, status: 'sent' } : c))
      flash(`✓ Code sent to ${code.guest_name}.`)
    } catch (e: any) {
      flash(e.message || 'Send failed.', true)
    }
    setSendingId(null)
  }

  // ── 6.9 Revoke a code ─────────────────────────────────────────────────────

  const handleRevoke = async (code: AccessCode) => {
    if (!window.confirm(
      `Revoke access for ${code.guest_name}?\n\nTheir code will stop working immediately.`
    )) return
    setRevokingId(code.id)
    try {
      const res = await fetch('/api/access-codes/revoke', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ access_code_id: code.id }),
      })
      if (!res.ok) throw new Error('Revoke failed')
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, status: 'revoked' } : c))
    } catch (e: any) {
      flash(e.message || 'Revoke failed.', true)
    }
    setRevokingId(null)
  }

  // ═══ SECTION 7 — Render ═══

  if (loading) {
    return (
      <p style={{ fontSize: '12px', color: textFaint, padding: '16px 0', textAlign: 'center' as const }}>
        Loading guests and codes…
      </p>
    )
  }

  return (
    <div>

      {/* ── 7.1 Email guidance banner (shown when guests have no email) ──────── */}

      {guests.length > 0 && withoutEmail > 0 && (
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          background: 'rgba(251,191,36,0.05)',
          border: '1px solid rgba(251,191,36,0.2)',
          marginBottom: '16px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>📧</span>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 600, color: warnColor }}>
              {withoutEmail} guest{withoutEmail !== 1 ? 's have' : ' has'} no email address
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: textFaint, lineHeight: 1.6 }}>
              Codes can only be sent digitally to guests with an email address.
              For guests without email, print their access card and hand it to them at the event.
              Tap any guest name to add their email.
            </p>
          </div>
        </div>
      )}

      {/* ── 7.2 PRE-GENERATION: Guest roster ─────────────────────────────────── */}

      {!codesExist && (
        <div style={{
          borderRadius: '12px',
          border: '1px solid rgba(226,195,107,0.15)',
          background: cardBg, marginBottom: '16px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                {guests.length} Guest{guests.length !== 1 ? 's' : ''} Ready for Codes
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '10px', color: textFaint }}>
                {withEmail} with email · {withoutEmail} without email
              </p>
            </div>
          </div>

          {/* Guest list */}
          {guests.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' as const }}>
              <p style={{ fontSize: '13px', color: textFaint, margin: '0 0 12px' }}>
                No guests added yet.
              </p>
              <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.6, margin: 0 }}>
                Add guests using the bulk import in the Setup tab, or through Guest Management if activated.
              </p>
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {guests.map(guest => (
                <div
                  key={guest.id}
                  style={{
                    padding: '10px 12px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '4px',
                    borderLeft: `3px solid ${TIER_ACCENT[guest.tier?.toLowerCase?.() ?? 'general'] ?? cardBorder}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => setEditGuest(guest)}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer', textAlign: 'left' as const,
                        display: 'block', width: '100%',
                      }}
                    >
                      <p style={{
                        margin: 0, fontSize: '13px', fontWeight: 600,
                        color: gold, textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}>
                        {guest.name}
                      </p>
                    </button>
                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: textFaint }}>
                      {TIER_LABEL[guest.tier?.toLowerCase?.() ?? ''] ?? guest.tier}
                      {guest.email
                        ? <span style={{ color: successColor }}> · {guest.email}</span>
                        : <span style={{ color: warnColor }}> · no email — tap name to add</span>
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generate action */}
          {guests.length > 0 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
              {genMsg && <p style={{ fontSize: '12px', color: successColor, margin: '0 0 10px' }}>{genMsg}</p>}
              {genError && <p style={{ fontSize: '12px', color: errorColor, margin: '0 0 10px', lineHeight: 1.5 }}>{genError}</p>}
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '10px', border: 'none',
                  background: generating
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg,#E2C36B,#C8A84A)',
                  color: generating ? textFaint : '#1a0845',
                  fontSize: '13px', fontWeight: 700,
                  cursor: generating ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {generating ? 'Generating…' : `Generate Codes for All ${guests.length} Guests`}
              </button>
              <p style={{ fontSize: '10px', color: textFaint, textAlign: 'center' as const, margin: '6px 0 0', lineHeight: 1.5 }}>
                Each guest gets a unique QR code and 6-digit number.
                Codes without email addresses can be printed as access cards.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 7.3 POST-GENERATION: Code management ─────────────────────────────── */}

      {codesExist && (
        <div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
            <StatCard label="Total"      value={codes.length} />
            <StatCard label="With Email" value={withEmail} />
            <StatCard label="Unsent"     value={unsent}    accent={unsent > 0} />
            <StatCard label="Sent"       value={sent}      accent={sent > 0} />
            <StatCard label="In"         value={checkedIn} accent={checkedIn > 0} />
          </div>

          {/* Bulk send */}
          <button
            onClick={handleSendAll}
            disabled={sendingAll || withEmail === 0}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              border: 'none', marginBottom: '6px',
              background: withEmail === 0
                ? 'rgba(255,255,255,0.04)'
                : 'linear-gradient(135deg,#E2C36B,#C8A84A)',
              color: withEmail === 0 ? textFaint : '#1a0845',
              fontSize: '12px', fontWeight: 700,
              cursor: withEmail === 0 ? 'not-allowed' : 'pointer',
              opacity: sendingAll ? 0.7 : 1,
            }}
          >
            {sendingAll
              ? 'Sending…'
              : withEmail === 0
              ? 'No email addresses — print access cards instead'
              : unsent > 0
              ? `Send Codes to ${unsent} Unsent Guest${unsent !== 1 ? 's' : ''}`
              : `Resend All Codes (${withEmail} with email)`}
          </button>

          {/* Regenerate */}
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            style={{
              width: '100%', padding: '9px', borderRadius: '10px',
              border: `1px solid rgba(226,195,107,0.2)`,
              background: 'transparent', color: goldMuted,
              fontSize: '11px', fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer',
              marginBottom: '14px',
            }}
          >
            {generating ? 'Regenerating…' : 'Regenerate All Codes'}
          </button>

          {/* Messages */}
          {msg   && <p style={{ fontSize: '12px', color: successColor, marginBottom: '10px' }}>{msg}</p>}
          {error && <p style={{ fontSize: '12px', color: errorColor,   marginBottom: '10px' }}>{error}</p>}
          {genMsg   && <p style={{ fontSize: '12px', color: successColor, marginBottom: '10px' }}>{genMsg}</p>}
          {genError && <p style={{ fontSize: '12px', color: errorColor,   marginBottom: '10px', lineHeight: 1.5 }}>{genError}</p>}

          {/* Search */}
          <input
            type="search"
            placeholder="Search by name, code, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: '8px' }}
          />

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginBottom: '12px' }}>
            {([
              { key: 'all',     label: `All (${codes.length})` },
              { key: 'unsent',  label: `Unsent (${unsent})` },
              { key: 'sent',    label: `Sent (${sent})` },
              { key: 'used',    label: `In (${checkedIn})` },
              { key: 'revoked', label: `Revoked (${revoked})` },
            ] as { key: FilterKey; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                border: `1px solid ${filter === f.key ? 'rgba(226,195,107,0.45)' : cardBorder}`,
                background: filter === f.key ? 'rgba(226,195,107,0.1)' : 'transparent',
                color: filter === f.key ? gold : textFaint, cursor: 'pointer',
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Code list — ALL guests shown, email status clear per row */}
          {filteredCodes.length === 0 ? (
            <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center' as const, padding: '16px 0' }}>
              No codes match your search or filter.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px' }}>
              {filteredCodes.map(code => {
                const isRevoked  = code.status === 'revoked'
                const isUsed     = code.status === 'used'
                const isSending  = sendingId  === code.id
                const isRevoking = revokingId === code.id
                const tierKey    = code.participant_type
                const tierAccent = TIER_ACCENT[tierKey] ?? cardBorder

                // Find corresponding guest for edit access
                const guest = guests.find(g => g.id === code.guest_id)

                return (
                  <div key={code.id} style={{
                    padding: '10px 12px', borderRadius: '10px',
                    border: `1px solid ${isRevoked ? 'rgba(248,113,113,0.15)' : cardBorder}`,
                    background: cardBg,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    opacity: isRevoked ? 0.45 : 1,
                    borderLeft: `3px solid ${isRevoked ? 'rgba(248,113,113,0.3)' : tierAccent}`,
                  }}>
                    {/* Guest info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        {/* Clickable guest name */}
                        <button
                          onClick={() => guest && setEditGuest(guest)}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            cursor: guest ? 'pointer' : 'default',
                            fontSize: '13px', fontWeight: 600,
                            color: guest ? gold : textPrimary,
                            textDecoration: guest ? 'underline' : 'none',
                            textUnderlineOffset: '2px',
                          }}
                        >
                          {code.guest_name}
                        </button>
                        <span style={{
                          fontSize: '8px', color: goldMuted,
                          fontWeight: 700, flexShrink: 0,
                          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                        }}>
                          {TIER_LABEL[tierKey] ?? tierKey}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, color: gold,
                          fontFamily: 'monospace', letterSpacing: '0.22em',
                        }}>
                          {code.numeric_code}
                        </span>
                        <span style={{
                          fontSize: '8px', fontWeight: 700,
                          color: STATUS_COLOR[code.status] ?? textFaint,
                          letterSpacing: '0.08em',
                        }}>
                          {STATUS_LABEL[code.status] ?? code.status.toUpperCase()}
                        </span>
                        {code.use_count > 0 && (
                          <span style={{ fontSize: '9px', color: textFaint }}>× {code.use_count}</span>
                        )}
                        {code.section_name && (
                          <span style={{ fontSize: '9px', color: textFaint }}>{code.section_name}</span>
                        )}
                        {/* Clear email status — always shown */}
                        {code.guest_email
                          ? <span style={{ fontSize: '8px', color: 'rgba(134,239,172,0.6)' }}>📧</span>
                          : <span style={{ fontSize: '9px', color: warnColor }}>no email</span>
                        }
                      </div>
                    </div>

                    {/* Actions */}
                    {!isRevoked && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {code.guest_email ? (
                          <button
                            onClick={() => handleSendOne(code)}
                            disabled={isSending}
                            title={code.status === 'generated' ? 'Send code by email' : 'Resend code'}
                            style={{
                              fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                              border: '1px solid rgba(147,197,253,0.2)',
                              background: 'transparent',
                              color: isSending ? textFaint : 'rgba(147,197,253,0.7)',
                              cursor: isSending ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap' as const,
                            }}
                          >
                            {isSending ? '…' : code.status === 'generated' ? 'Send' : 'Resend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => guest && setEditGuest(guest)}
                            title="Add email to send code"
                            style={{
                              fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                              border: `1px solid rgba(251,191,36,0.2)`,
                              background: 'transparent', color: warnColor,
                              cursor: 'pointer', whiteSpace: 'nowrap' as const,
                            }}
                          >
                            + Email
                          </button>
                        )}
                        {!isUsed && (
                          <button
                            onClick={() => handleRevoke(code)}
                            disabled={isRevoking}
                            style={{
                              fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                              border: '1px solid rgba(248,113,113,0.18)',
                              background: 'transparent',
                              color: isRevoking ? textFaint : 'rgba(248,113,113,0.55)',
                              cursor: isRevoking ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isRevoking ? '…' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Roster for guests without codes */}
          {guests.filter(g => !codeByGuestId[g.id]).length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 600 }}>
                Guests Without Codes
              </p>
              {guests.filter(g => !codeByGuestId[g.id]).map(guest => (
                <div key={guest.id} style={{
                  padding: '10px 12px', borderRadius: '9px',
                  border: `1px solid ${cardBorder}`, background: cardBg,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  marginBottom: '5px',
                }}>
                  <div style={{ flex: 1 }}>
                    <button
                      onClick={() => setEditGuest(guest)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: gold, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                        {guest.name}
                      </p>
                    </button>
                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: textFaint }}>
                      {TIER_LABEL[guest.tier?.toLowerCase?.() ?? ''] ?? guest.tier}
                      {!guest.email && <span style={{ color: warnColor }}> · no email</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateOne(guest.id)}
                    disabled={generatingId === guest.id}
                    style={{
                      fontSize: '10px', padding: '5px 12px', borderRadius: '7px',
                      border: 'none',
                      background: generatingId === guest.id
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg,#E2C36B,#C8A84A)',
                      color: generatingId === guest.id ? textFaint : '#1a0845',
                      fontWeight: 700, cursor: generatingId === guest.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {generatingId === guest.id ? '…' : 'Generate Code'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer count */}
          {filteredCodes.length > 0 && (
            <p style={{ fontSize: '10px', color: textFaint, textAlign: 'center' as const, margin: '12px 0 0' }}>
              Showing {filteredCodes.length} of {codes.length} codes
            </p>
          )}
        </div>
      )}

      {/* ── 7.4 Guest edit panel ──────────────────────────────────────────────── */}

      {editGuest && (
        <GuestEditPanel
          guest={editGuest}
          onClose={() => setEditGuest(null)}
          onSaved={() => { setEditGuest(null); fetchData() }}
        />
      )}
    </div>
  )
}
