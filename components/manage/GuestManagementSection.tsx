/**
 * ============================================================
 * FILE PATH: components/manage/GuestManagementSection.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 * Updated: Claude Sonnet 4.6 · July 2026
 *   — Added Access Code System tabs (Setup, Codes, Ushers, Live Metrics)
 *   — Guest Management and Access Codes now share one expanded card
 *   — Both are gated behind guest_management component
 *
 * Sub-sections:
 *   1. Types & style constants
 *   2. GuestRow — individual guest with access code
 *   3. AddGuestForm — create guest
 *   4. GuestStats — summary counts
 *   5. Main component with tabbed sections
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types & style constants
// ============================================================

import { useState, useEffect } from 'react'
import AccessCodeSetup       from '@/components/manage/access-codes/AccessCodeSetup'
import { UsherSessionManager }    from '@/components/manage/access-codes/UsherSessionManager'
import { AccessMetricsDashboard } from '@/components/manage/access-codes/AccessMetricsDashboard'

interface Guest {
  id: string; name: string; phone: string | null; email: string | null
  tier: string; invited_phases: string[]; access_code: string
  rsvp_status: string; dietary_requirements: string | null
  table_id: string | null; checked_in_at: string | null; created_at: string
}

interface Table {
  id: string; name: string; capacity: number; tier_designation: string | null; guest_count: number
}

interface Props {
  capsuleId:   string
  capsuleSlug: string
  tables:      Table[]
  phases:      Array<{ id: string; name: string }>
}

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

const TIER_COLORS: Record<string, string> = {
  VVIP: '#F5D97A', VIP: '#E2C36B', General: 'rgba(255,255,255,0.55)',
  'Reception Only': 'rgba(139,159,212,0.8)', Staff: 'rgba(126,200,164,0.8)',
  Media: 'rgba(180,160,216,0.8)', Vendor: 'rgba(255,255,255,0.35)',
}

const TIER_OPTIONS = ['VVIP', 'VIP', 'General', 'Reception Only', 'Staff', 'Media', 'Vendor']
const RSVP_OPTIONS = ['pending', 'confirmed', 'declined', 'no_response']

type InnerTab = 'guests' | 'codes' | 'ushers' | 'metrics'

// ============================================================
// SECTION 2 — GuestRow
// ============================================================

function GuestRow({ g, tables, phases, onUpdate, onDelete }: {
  g: Guest; tables: Table[]; phases: Array<{id: string; name: string}>
  onUpdate: (id: string, updates: any) => void; onDelete: (id: string) => void
}) {
  const [expanded,       setExpanded]       = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)

  const table      = tables.find(t => t.id === g.table_id)
  const tierColor  = TIER_COLORS[g.tier] ?? textFaint
  const isCheckedIn = !!g.checked_in_at

  const handleCheckin = async () => {
    setCheckinLoading(true)
    if (isCheckedIn) {
      await fetch(`/api/guests/checkin?guest_id=${g.id}`, { method: 'DELETE' })
      onUpdate(g.id, { checked_in_at: null })
    } else {
      const res  = await fetch('/api/guests/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: g.id.split('-')[0], access_code: g.access_code }),
      })
      const data = await res.json()
      if (data.ok) onUpdate(g.id, { checked_in_at: data.guest?.checked_in_at })
    }
    setCheckinLoading(false)
  }

  return (
    <div style={{ borderRadius: '10px', border: `1px solid ${isCheckedIn ? 'rgba(74,222,128,0.2)' : cardBorder}`, background: cardBg, marginBottom: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: tierColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{g.name}</p>
            <span style={{ fontSize: '9px', color: tierColor, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0 }}>{g.tier}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: gold, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{g.access_code}</span>
            {table && <span style={{ fontSize: '10px', color: textFaint }}>Table: {table.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
          {isCheckedIn && <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(134,239,172,0.8)', fontWeight: 700 }}>✓ In</span>}
          <span style={{ fontSize: '10px', color: textFaint }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '10px 14px 14px', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>RSVP</label>
              <select style={{ ...inp, fontSize: '12px' }} value={g.rsvp_status} onChange={e => onUpdate(g.id, { rsvp_status: e.target.value })}>
                {RSVP_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Table</label>
              <select style={{ ...inp, fontSize: '12px' }} value={g.table_id ?? ''} onChange={e => onUpdate(g.id, { table_id: e.target.value || null })}>
                <option value="">No table</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.guest_count}/{t.capacity})</option>)}
              </select>
            </div>
          </div>

          {g.dietary_requirements && <p style={{ fontSize: '11px', color: textFaint, marginBottom: '8px' }}>🍽 {g.dietary_requirements}</p>}
          {g.email && <p style={{ fontSize: '11px', color: textFaint, marginBottom: '4px' }}>✉ {g.email}</p>}
          {g.phone && <p style={{ fontSize: '11px', color: textFaint, marginBottom: '8px' }}>📞 {g.phone}</p>}

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleCheckin} disabled={checkinLoading}
              style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${isCheckedIn ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.25)'}`, background: isCheckedIn ? 'rgba(248,113,113,0.05)' : 'rgba(74,222,128,0.07)', color: isCheckedIn ? 'rgba(248,113,113,0.7)' : 'rgba(134,239,172,0.8)', cursor: 'pointer' }}>
              {checkinLoading ? '…' : isCheckedIn ? 'Undo Check-in' : '✓ Check In'}
            </button>
            <button onClick={() => onDelete(g.id)}
              style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.15)', background: 'transparent', color: 'rgba(248,113,113,0.5)', cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SECTION 3 — AddGuestForm
// ============================================================

function AddGuestForm({ capsuleId, tables, phases, onAdded, onCancel }: {
  capsuleId: string; tables: Table[]; phases: Array<{id: string; name: string}>
  onAdded: () => void; onCancel: () => void
}) {
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')
  const [tier,    setTier]    = useState('General')
  const [tableId, setTableId] = useState('')
  const [dietary, setDietary] = useState('')
  const [saving,  setSaving]  = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id: capsuleId, name: name.trim(),
        phone: phone.trim() || undefined, email: email.trim() || undefined,
        tier, table_id: tableId || undefined,
        dietary_requirements: dietary.trim() || undefined,
      }),
    })
    setSaving(false); onAdded()
  }

  return (
    <div style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>
      <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>Add Guest</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp} placeholder="Full name *" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={{ ...inp, flex: 1 }} placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <input type="email" style={{ ...inp, flex: 1 }} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select style={{ ...inp, flex: 1 }} value={tier} onChange={e => setTier(e.target.value)}>
            {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {tables.length > 0 && (
            <select style={{ ...inp, flex: 1 }} value={tableId} onChange={e => setTableId(e.target.value)}>
              <option value="">No table</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.guest_count}/{t.capacity})</option>)}
            </select>
          )}
        </div>
        <input style={inp} placeholder="Dietary requirements (optional)" value={dietary} onChange={e => setDietary(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{ padding: '8px 20px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add Guest'}
          </button>
          <button onClick={onCancel}
            style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '12px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 4 — GuestStats
// ============================================================

function GuestStats({ guests }: { guests: Guest[] }) {
  const total     = guests.length
  const confirmed = guests.filter(g => g.rsvp_status === 'confirmed').length
  const checkedIn = guests.filter(g => g.checked_in_at).length
  const vvip      = guests.filter(g => g.tier === 'VVIP').length

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
      {[
        { label: 'Total',     value: total },
        { label: 'Confirmed', value: confirmed },
        { label: 'Checked In', value: checkedIn, accent: true },
        { label: 'VVIP',     value: vvip },
      ].map(s => (
        <div key={s.label} style={{ flex: 1, minWidth: '60px', padding: '10px 8px', borderRadius: '10px', background: s.accent ? 'rgba(226,195,107,0.07)' : cardBg, border: `1px solid ${s.accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' as const }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: s.accent ? gold : textPrimary, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
          <div style={{ fontSize: '8px', color: textFaint, marginTop: '2px', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// SECTION 5 — Main component
// ============================================================

export default function GuestManagementSection({ capsuleId, capsuleSlug, tables, phases }: Props) {
  const [guests,  setGuests]  = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)
  const [filter,  setFilter]  = useState<'all' | string>('all')
  const [tab,     setTab]     = useState<InnerTab>('guests')
  const [codesGenerated, setCodesGenerated] = useState(false)

  const fetchGuests = async () => {
    const res  = await fetch(`/api/guests?capsule_id=${capsuleId}`)
    const data = await res.json()
    setGuests(data.guests ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchGuests() }, [capsuleId])

  const handleUpdate = async (id: string, updates: any) => {
    await fetch('/api/guests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    fetchGuests()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this guest?')) return
    await fetch(`/api/guests?id=${id}`, { method: 'DELETE' })
    fetchGuests()
  }

  const filtered = filter === 'all' ? guests : guests.filter(g => g.tier === filter)

  // ── Inner tab bar ────────────────────────────────────────────────────────
  const TABS: { key: InnerTab; label: string }[] = [
    { key: 'guests',  label: 'Guest List' },
    { key: 'codes',   label: 'Access Codes' },
    { key: 'ushers',  label: 'Ushers' },
    { key: 'metrics', label: 'Live Metrics' },
  ]

  return (
    <div>
      {/* ── Inner tab navigation ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px', border: `1px solid ${tab === t.key ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.06)'}`, background: tab === t.key ? goldFaint : 'transparent', color: tab === t.key ? gold : textFaint, cursor: 'pointer', fontWeight: tab === t.key ? 700 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Guest List tab ── */}
      {tab === 'guests' && (
        <div>
          <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
            Manage your guest list. Each guest receives a unique access code. Tap a guest to manage their table assignment, RSVP and check-in status.
          </p>

          {loading ? (
            <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center' as const, padding: '16px 0' }}>Loading guests…</p>
          ) : (
            <>
              <GuestStats guests={guests} />

              {guests.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                  {['all', ...TIER_OPTIONS.filter(t => guests.some(g => g.tier === t))].map(tier => (
                    <button key={tier} onClick={() => setFilter(tier)}
                      style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${filter === tier ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: filter === tier ? goldFaint : 'transparent', color: filter === tier ? gold : textFaint, cursor: 'pointer' }}>
                      {tier === 'all' ? `All (${guests.length})` : tier}
                    </button>
                  ))}
                </div>
              )}

              {filtered.map(g => (
                <GuestRow key={g.id} g={g} tables={tables} phases={phases} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}

              {adding ? (
                <AddGuestForm capsuleId={capsuleId} tables={tables} phases={phases} onAdded={() => { setAdding(false); fetchGuests() }} onCancel={() => setAdding(false)} />
              ) : (
                <button onClick={() => setAdding(true)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                  + Add Guest
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Access Codes tab ── */}
      {tab === 'codes' && (
        <div>
          <AccessCodeSetup
            capsuleId={capsuleId}
            guestCount={guests.length}
            onActivated={() => setCodesGenerated(true)}
          />
        </div>
      )}

      {/* ── Ushers tab ── */}
      {tab === 'ushers' && (
        <UsherSessionManager capsuleId={capsuleId} capsuleSlug={capsuleSlug} />
      )}

      {/* ── Live Metrics tab ── */}
      {tab === 'metrics' && (
        <AccessMetricsDashboard capsuleId={capsuleId} />
      )}
    </div>
  )
}
