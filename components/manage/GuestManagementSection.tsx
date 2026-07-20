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
 * Updated: AI12 · Claude Opus 4.6 · 20 July 2026
 *   — Gap 1 fix: GuestCodeList now rendered in Codes tab below setup
 *   — Gap 2 fix: Three-scope code generation selector added
 *     (Everyone / Confirmed only / Choose individually)
 *   — M6.6: Ticket/access card generation added to Codes tab
 *   — Scope choice drives both generate API call and label copy
 *   — Dead fetchCodes function removed from GuestCodeList import
 *   — Guest List tab description updated for organiser mental model
 *
 * Sub-sections:
 *   1. Types & style constants
 *   2. GuestRow — individual guest with access code
 *   3. AddGuestForm — create guest
 *   4. GuestStats — summary counts
 *   5. ScopeSelector — three-option code generation scope picker
 *   6. TicketPrintView — printable ticket/access card layout
 *   7. Main component with tabbed sections
 * ============================================================
 */

'use client'

// ═══ SECTION 1 — Types & style constants ═══

import { useState, useEffect, useRef } from 'react'
import AccessCodeSetup                from '@/components/manage/access-codes/AccessCodeSetup'
import GuestCodeList                  from '@/components/manage/access-codes/GuestCodeList'
import { UsherSessionManager }        from '@/components/manage/access-codes/UsherSessionManager'
import { AccessMetricsDashboard }     from '@/components/manage/access-codes/AccessMetricsDashboard'

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
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  eventTag:     string | null
  tables:       Table[]
  phases:       Array<{ id: string; name: string }>
}

type GenerateScope = 'all' | 'confirmed' | 'selected'
type InnerTab = 'guests' | 'codes' | 'ushers' | 'metrics'

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

// ═══ SECTION 2 — GuestRow ═══

function GuestRow({ g, tables, phases, onUpdate, onDelete, selectable, selected, onSelect }: {
  g: Guest; tables: Table[]; phases: Array<{id: string; name: string}>
  onUpdate: (id: string, updates: any) => void; onDelete: (id: string) => void
  selectable?: boolean; selected?: boolean; onSelect?: (id: string) => void
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
    <div style={{ borderRadius: '10px', border: `1px solid ${selected ? 'rgba(226,195,107,0.45)' : isCheckedIn ? 'rgba(74,222,128,0.2)' : cardBorder}`, background: selected ? 'rgba(226,195,107,0.05)' : cardBg, marginBottom: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Selection checkbox — only when selectable */}
        {selectable && (
          <div
            onClick={() => onSelect?.(g.id)}
            style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${selected ? gold : 'rgba(255,255,255,0.2)'}`, background: selected ? 'rgba(226,195,107,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {selected && <span style={{ fontSize: '10px', color: gold, fontWeight: 800 }}>✓</span>}
          </div>
        )}

        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => !selectable && setExpanded(e => !e)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '3px', height: '30px', borderRadius: '2px', background: tierColor, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{g.name}</p>
                <span style={{ fontSize: '9px', color: tierColor, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0 }}>{g.tier}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: gold, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{g.access_code || '—'}</span>
                {table && <span style={{ fontSize: '10px', color: textFaint }}>Table: {table.name}</span>}
                <span style={{ fontSize: '9px', color: g.rsvp_status === 'confirmed' ? 'rgba(134,239,172,0.7)' : textFaint, fontWeight: 600, textTransform: 'capitalize' as const }}>{g.rsvp_status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
          {isCheckedIn && <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(134,239,172,0.8)', fontWeight: 700 }}>✓ In</span>}
          {!selectable && <span style={{ fontSize: '10px', color: textFaint, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>

      {!selectable && expanded && (
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

// ═══ SECTION 3 — AddGuestForm ═══

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

// ═══ SECTION 4 — GuestStats ═══

function GuestStats({ guests }: { guests: Guest[] }) {
  const total     = guests.length
  const confirmed = guests.filter(g => g.rsvp_status === 'confirmed').length
  const checkedIn = guests.filter(g => g.checked_in_at).length
  const vvip      = guests.filter(g => g.tier === 'VVIP').length

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
      {[
        { label: 'Total',      value: total },
        { label: 'Confirmed',  value: confirmed },
        { label: 'Checked In', value: checkedIn, accent: checkedIn > 0 },
        { label: 'VVIP',       value: vvip },
      ].map(s => (
        <div key={s.label} style={{ flex: 1, minWidth: '60px', padding: '10px 8px', borderRadius: '10px', background: s.accent ? 'rgba(226,195,107,0.07)' : cardBg, border: `1px solid ${s.accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' as const }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: s.accent ? gold : textPrimary, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
          <div style={{ fontSize: '8px', color: textFaint, marginTop: '2px', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ═══ SECTION 5 — ScopeSelector ═══
// Three plain-language options for who receives codes.
// Drives both the generate API call and the send API call.

function ScopeSelector({
  scope, onChange, guests, selectedIds, onToggleId, totalGuests
}: {
  scope: GenerateScope
  onChange: (s: GenerateScope) => void
  guests: Guest[]
  selectedIds: string[]
  onToggleId: (id: string) => void
  totalGuests: number
}) {
  const confirmedCount = guests.filter(g => g.rsvp_status === 'confirmed').length

  const OPTIONS: { key: GenerateScope; label: string; desc: string; count: number }[] = [
    {
      key:   'all',
      label: 'Everyone on my guest list',
      desc:  `All ${totalGuests} guest${totalGuests !== 1 ? 's' : ''} receive a code`,
      count: totalGuests,
    },
    {
      key:   'confirmed',
      label: 'Only guests who confirmed they\'re coming',
      desc:  confirmedCount > 0
        ? `${confirmedCount} confirmed guest${confirmedCount !== 1 ? 's' : ''}`
        : 'No confirmed guests yet — update RSVPs in the Guest List tab',
      count: confirmedCount,
    },
    {
      key:   'selected',
      label: 'Specific guests I\'ll choose',
      desc:  selectedIds.length > 0
        ? `${selectedIds.length} guest${selectedIds.length !== 1 ? 's' : ''} selected below`
        : 'Tap guests below to select them',
      count: selectedIds.length,
    },
  ]

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '8px' }}>
        Who should receive access codes?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              textAlign: 'left' as const, padding: '11px 14px', borderRadius: '10px',
              border: `1px solid ${scope === opt.key ? 'rgba(226,195,107,0.5)' : cardBorder}`,
              background: scope === opt.key ? 'rgba(226,195,107,0.07)' : cardBg,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${scope === opt.key ? gold : 'rgba(255,255,255,0.2)'}`, background: scope === opt.key ? 'rgba(226,195,107,0.2)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {scope === opt.key && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: gold }} />}
              </div>
              <span style={{ fontSize: '13px', fontWeight: scope === opt.key ? 700 : 500, color: scope === opt.key ? textPrimary : 'rgba(255,255,255,0.65)' }}>{opt.label}</span>
            </div>
            <p style={{ margin: '0 0 0 22px', fontSize: '11px', color: opt.key === 'confirmed' && confirmedCount === 0 ? 'rgba(248,191,113,0.7)' : textFaint }}>{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Selection list — shown when scope is 'selected' */}
      {scope === 'selected' && guests.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ fontSize: '10px', color: textFaint, marginBottom: '8px' }}>
            Tap to select — {selectedIds.length} of {guests.length} chosen
          </p>
          <div style={{ maxHeight: '260px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
            {guests.map(g => (
              <div
                key={g.id}
                onClick={() => onToggleId(g.id)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${selectedIds.includes(g.id) ? 'rgba(226,195,107,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  background: selectedIds.includes(g.id) ? 'rgba(226,195,107,0.06)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
              >
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${selectedIds.includes(g.id) ? gold : 'rgba(255,255,255,0.2)'}`, background: selectedIds.includes(g.id) ? 'rgba(226,195,107,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedIds.includes(g.id) && <span style={{ fontSize: '9px', color: gold, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{g.name}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>{g.tier} · {g.rsvp_status.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 6 — TicketPrintView ═══
// Printable access card / ticket layout.
// Opens in a new print window with all guest tickets.
// Uses browser print-to-PDF (Puppeteer blocked on Vercel Hobby).

function buildTicketPrintHtml(d: {
  codes: Array<{ guest_name: string; numeric_code: string; tier: string; section_name?: string | null }>
  eventLabel: string
  honoureeName: string
  capsuleUrl: string
}) {
  const TIER_DISPLAY: Record<string, string> = {
    vvip: 'VVIP', vip: 'VIP', general: 'Guest',
    reception_only: 'Reception Guest', staff: 'Staff', media: 'Media', vendor: 'Vendor',
  }

  const tickets = d.codes.map(c => `
    <div class="ticket">
      <div class="ticket-gold-bar"></div>
      <div class="ticket-body">
        <div class="ticket-header">
          <p class="ticket-eyebrow">ACCESS PASS</p>
          <h2 class="ticket-event">${d.eventLabel}</h2>
          ${d.honoureeName ? `<p class="ticket-honouree">${d.honoureeName}</p>` : ''}
        </div>
        <div class="ticket-divider"></div>
        <div class="ticket-guest">
          <p class="ticket-guest-label">GUEST</p>
          <p class="ticket-guest-name">${c.guest_name}</p>
          <p class="ticket-tier">${TIER_DISPLAY[c.tier] ?? c.tier}${c.section_name ? ` · ${c.section_name}` : ''}</p>
        </div>
        <div class="ticket-divider"></div>
        <div class="ticket-code-section">
          <p class="ticket-code-label">ENTRY CODE</p>
          <p class="ticket-code">${c.numeric_code}</p>
          <p class="ticket-code-hint">Present this code or your QR email at the entrance</p>
        </div>
        <div class="ticket-divider"></div>
        <div class="ticket-footer">
          <p class="ticket-capsule-label">Event Capsule</p>
          <p class="ticket-capsule-url">${d.capsuleUrl}</p>
          <p class="ticket-tribute-hint">Leave your tribute and be part of the permanent record</p>
        </div>
      </div>
      <div class="ticket-gold-bar"></div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Access Passes — ${d.eventLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; background: #F5F3EE; padding: 20px; }
  h1.print-title { font-size: 14px; color: #888; text-align: center; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .ticket { background: #1a0d3a; border-radius: 12px; overflow: hidden; break-inside: avoid; }
  .ticket-gold-bar { height: 3px; background: linear-gradient(90deg, transparent, #E2C36B, transparent); }
  .ticket-body { padding: 18px 20px; }
  .ticket-header { text-align: center; margin-bottom: 12px; }
  .ticket-eyebrow { font-family: Arial, sans-serif; font-size: 8px; letter-spacing: 3px; color: rgba(226,195,107,0.5); text-transform: uppercase; margin-bottom: 4px; }
  .ticket-event { font-family: Georgia, serif; font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 2px; }
  .ticket-honouree { font-family: Arial, sans-serif; font-size: 11px; color: rgba(226,195,107,0.7); }
  .ticket-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(226,195,107,0.25), transparent); margin: 10px 0; }
  .ticket-guest { text-align: center; }
  .ticket-guest-label { font-family: Arial, sans-serif; font-size: 7px; letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 3px; }
  .ticket-guest-name { font-family: Georgia, serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 2px; }
  .ticket-tier { font-family: Arial, sans-serif; font-size: 10px; color: #E2C36B; font-weight: 600; }
  .ticket-code-section { text-align: center; }
  .ticket-code-label { font-family: Arial, sans-serif; font-size: 7px; letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 4px; }
  .ticket-code { font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; color: #E2C36B; letter-spacing: 0.35em; margin-bottom: 3px; }
  .ticket-code-hint { font-family: Arial, sans-serif; font-size: 9px; color: rgba(255,255,255,0.28); line-height: 1.5; }
  .ticket-footer { text-align: center; }
  .ticket-capsule-label { font-family: Arial, sans-serif; font-size: 7px; letter-spacing: 2px; color: rgba(255,255,255,0.25); text-transform: uppercase; margin-bottom: 2px; }
  .ticket-capsule-url { font-family: 'Courier New', monospace; font-size: 9px; color: rgba(226,195,107,0.55); margin-bottom: 2px; }
  .ticket-tribute-hint { font-family: Arial, sans-serif; font-size: 8px; color: rgba(255,255,255,0.2); }
  @media print {
    body { background: #fff; padding: 0; }
    h1.print-title { display: none; }
    .grid { gap: 8px; }
  }
</style>
</head>
<body>
<h1 class="print-title">Access Passes — ${d.eventLabel} · ${d.codes.length} guests</h1>
<div class="grid">${tickets}</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
}

// ═══ SECTION 7 — Main component ═══

export default function GuestManagementSection({
  capsuleId, capsuleSlug, honoureeName, eventTag, tables, phases
}: Props) {
  const [guests,         setGuests]         = useState<Guest[]>([])
  const [loading,        setLoading]        = useState(true)
  const [adding,         setAdding]         = useState(false)
  const [filter,         setFilter]         = useState<'all' | string>('all')
  const [tab,            setTab]            = useState<InnerTab>('guests')
  const [codesGenerated, setCodesGenerated] = useState(false)

  // ── Code generation scope state ──────────────────────────────────────────
  const [scope,       setScope]       = useState<GenerateScope>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [generating,  setGenerating]  = useState(false)
  const [genMsg,      setGenMsg]      = useState('')
  const [genError,    setGenError]    = useState('')

  // ── Ticket print state ───────────────────────────────────────────────────
  const [printingTickets, setPrintingTickets] = useState(false)
  const [ticketError,     setTicketError]     = useState('')

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'

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

  const handleToggleId = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // ── Scoped code generation ───────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true); setGenError(''); setGenMsg('')

    const payload: any = { capsule_id: capsuleId, scope }
    if (scope === 'selected') {
      if (selectedIds.length === 0) {
        setGenError('Please select at least one guest before generating.')
        setGenerating(false); return
      }
      payload.guest_ids = selectedIds
    }

    try {
      const res  = await fetch('/api/access-codes/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      const scopeLabel =
        scope === 'all'       ? `all ${data.generated} guests` :
        scope === 'confirmed' ? `${data.generated} confirmed guests` :
        `${data.generated} selected guests`

      setGenMsg(`✓ Codes generated for ${scopeLabel}.${data.errors > 0 ? ` ${data.errors} failed.` : ''}`)
      setCodesGenerated(true)
    } catch (e: any) {
      setGenError(e.message)
    }
    setGenerating(false)
  }

  // ── Ticket / access card print ───────────────────────────────────────────
  const handlePrintTickets = async () => {
    setPrintingTickets(true); setTicketError('')
    try {
      // Fetch current codes
      const res  = await fetch(`/api/access-codes/list?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (!res.ok || !data.codes || data.codes.length === 0) {
        throw new Error('No codes found. Generate codes first.')
      }

      const codesToPrint = scope === 'selected' && selectedIds.length > 0
        ? data.codes.filter((c: any) => selectedIds.includes(c.guest_id))
        : data.codes

      if (codesToPrint.length === 0) {
        throw new Error('No matching codes found for selected guests.')
      }

      const eventLabel  = eventTag ?? honoureeName ?? 'Your Event'
      const capsuleUrl  = `${APP_URL}/for/${capsuleSlug}`

      const html = buildTicketPrintHtml({
        codes:        codesToPrint,
        eventLabel,
        honoureeName: honoureeName ?? '',
        capsuleUrl,
      })

      const printWindow = window.open('', '_blank')
      if (!printWindow) throw new Error('Pop-up blocked. Please allow pop-ups for this page.')
      printWindow.document.write(html)
      printWindow.document.close()

    } catch (e: any) {
      setTicketError(e.message)
    }
    setPrintingTickets(false)
  }

  const filtered = filter === 'all' ? guests : guests.filter(g => g.tier === filter)

  // ── Inner tabs ───────────────────────────────────────────────────────────
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

      {/* ════════════════════════════════════════════
          GUEST LIST TAB
      ════════════════════════════════════════════ */}
      {tab === 'guests' && (
        <div>
          <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
            Everyone at your event in one place — guests, family, VIPs, vendors, media. Tap a guest to manage their table, RSVP status, and check-in.
          </p>

          {loading ? (
            <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center' as const, padding: '16px 0' }}>Loading guests…</p>
          ) : guests.length === 0 ? (
            <div style={{ padding: '24px', borderRadius: '12px', border: '1px dashed rgba(226,195,107,0.15)', textAlign: 'center' as const }}>
              <p style={{ fontSize: '13px', color: textFaint, margin: '0 0 6px' }}>No guests yet</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Add your first guest below — everyone at your event can be managed here</p>
            </div>
          ) : (
            <>
              <GuestStats guests={guests} />

              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                {['all', ...TIER_OPTIONS.filter(t => guests.some(g => g.tier === t))].map(tier => (
                  <button key={tier} onClick={() => setFilter(tier)}
                    style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${filter === tier ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: filter === tier ? goldFaint : 'transparent', color: filter === tier ? gold : textFaint, cursor: 'pointer' }}>
                    {tier === 'all' ? `All (${guests.length})` : tier}
                  </button>
                ))}
              </div>

              {filtered.map(g => (
                <GuestRow key={g.id} g={g} tables={tables} phases={phases} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </>
          )}

          {adding ? (
            <AddGuestForm capsuleId={capsuleId} tables={tables} phases={phases} onAdded={() => { setAdding(false); fetchGuests() }} onCancel={() => setAdding(false)} />
          ) : (
            <button onClick={() => setAdding(true)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
              + Add Guest
            </button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          ACCESS CODES TAB
      ════════════════════════════════════════════ */}
      {tab === 'codes' && (
        <div>
          {/* Hall setup */}
          <AccessCodeSetup
            capsuleId={capsuleId}
            guestCount={guests.length}
            onActivated={() => setCodesGenerated(true)}
          />

          {/* Divider */}
          {guests.length > 0 && (
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.2), transparent)', margin: '20px 0' }} />
          )}

          {/* Three-scope generation */}
          {guests.length > 0 && (
            <div>
              <ScopeSelector
                scope={scope}
                onChange={(s) => { setScope(s); setSelectedIds([]); setGenMsg(''); setGenError('') }}
                guests={guests}
                selectedIds={selectedIds}
                onToggleId={handleToggleId}
                totalGuests={guests.length}
              />

              {genMsg   && <p style={{ fontSize: '12px', color: 'rgba(134,239,172,0.8)', marginBottom: '10px' }}>{genMsg}</p>}
              {genError && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{genError}</p>}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={handleGenerate}
                  disabled={generating || guests.length === 0 || (scope === 'selected' && selectedIds.length === 0)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: generating ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: generating ? textFaint : '#1a0845', fontSize: '12px', fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
                  {generating
                    ? 'Generating…'
                    : scope === 'all'       ? `Generate Codes — All ${guests.length} Guests`
                    : scope === 'confirmed' ? `Generate Codes — Confirmed Guests`
                    : selectedIds.length > 0 ? `Generate Codes — ${selectedIds.length} Selected`
                    : 'Select guests first'}
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          {codesGenerated && (
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.2), transparent)', margin: '0 0 20px' }} />
          )}

          {/* Code list — visible once codes are generated */}
          {codesGenerated && (
            <div>
              <GuestCodeList
                capsuleId={capsuleId}
                capsuleSlug={capsuleSlug}
                honoureeName={honoureeName}
                eventTag={eventTag}
              />

              {/* Ticket / access card print */}
              <div style={{ marginTop: '20px', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(226,195,107,0.15)', background: 'rgba(226,195,107,0.04)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: goldMuted, marginBottom: '4px' }}>Access Passes</p>
                <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65, marginBottom: '12px' }}>
                  Print a physical access pass for each guest — shows their name, entry code, tier, and a link to the capsule. Useful for guests who prefer a card to an email.
                </p>
                {ticketError && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '8px' }}>{ticketError}</p>}
                <button
                  onClick={handlePrintTickets}
                  disabled={printingTickets}
                  style={{ padding: '9px 18px', borderRadius: '9px', border: `1px solid rgba(226,195,107,0.3)`, background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: printingTickets ? 0.6 : 1 }}>
                  {printingTickets ? 'Preparing…' : '🖨 Print Access Passes'}
                </button>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '8px', lineHeight: 1.6 }}>
                  Opens a print-ready page. Select Save as PDF in your print dialog to save a copy.
                  {scope === 'selected' && selectedIds.length > 0
                    ? ` Printing ${selectedIds.length} selected guest${selectedIds.length !== 1 ? 's' : ''}.`
                    : ' Printing all guests with codes.'}
                </p>
              </div>
            </div>
          )}

          {/* Empty state — no guests yet */}
          {guests.length === 0 && (
            <div style={{ padding: '20px', borderRadius: '10px', border: '1px dashed rgba(226,195,107,0.15)', textAlign: 'center' as const, marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: textFaint, margin: '0 0 4px' }}>Add guests first</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Go to the Guest List tab to add your guests, then come back here to generate codes</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          USHERS TAB
      ════════════════════════════════════════════ */}
      {tab === 'ushers' && (
        <UsherSessionManager capsuleId={capsuleId} capsuleSlug={capsuleSlug} />
      )}

      {/* ════════════════════════════════════════════
          LIVE METRICS TAB
      ════════════════════════════════════════════ */}
      {tab === 'metrics' && (
        <AccessMetricsDashboard capsuleId={capsuleId} />
      )}
    </div>
  )
}
