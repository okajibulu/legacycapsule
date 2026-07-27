// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/guests/CircleManager.tsx
// PURPOSE:   Circle CRUD management. Create/edit/delete circles, assign
//            leaders, show per-circle RSVP counts, send portal invitations,
//            and assign guests to circles via dropdown or bulk selection.
// BUILT BY:  AI15 (Claude Opus 4.6) · 26 July 2026
// VERSION:   v2.9.0
// DEPENDS ON:
//   - GET/POST/PUT/DELETE /api/circles
//   - POST /api/circles/portal
//   - GET /api/guests?capsule_id=X
//   - PUT /api/guests (circle_id assignment)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'

// ═══ SECTION 1 — Types ═══

interface CircleManagerProps {
  capsuleId:    string
  capsuleSlug:  string
  onDataChange: () => void
}

interface Circle {
  id:               string
  name:             string
  description:      string | null
  leader_name:      string | null
  leader_email:     string | null
  leader_phone:     string | null
  portal_token:     string | null
  portal_expires_at: string | null
  portal_sent_at:   string | null
  is_active:        boolean
  sort_order:       number
  rsvp_confirmed:   number
  rsvp_declined:    number
  rsvp_pending:     number
  rsvp_no_response: number
  guest_count:      number
}

interface Guest {
  id:          string
  name:        string
  email:       string | null
  circle_id:   string | null
  rsvp_status: string
}

interface CircleForm {
  name:         string
  description:  string
  leader_name:  string
  leader_email: string
  leader_phone: string
}

const EMPTY_FORM: CircleForm = {
  name: '', description: '', leader_name: '', leader_email: '', leader_phone: '',
}

// ═══ SECTION 2 — Design tokens ═══

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const greenBg       = 'rgba(74,222,128,0.08)'
const greenText     = 'rgba(134,239,172,0.9)'
const redBg         = 'rgba(248,113,113,0.08)'
const redText       = 'rgba(248,113,113,0.8)'
const amberText     = 'rgba(251,191,36,0.8)'

// ═══ SECTION 3 — RSVP status badge ═══

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    confirmed:   { bg: greenBg,  color: greenText, label: 'Confirmed' },
    declined:    { bg: redBg,    color: redText,    label: 'Declined' },
    pending:     { bg: 'rgba(251,191,36,0.08)', color: amberText, label: 'Pending' },
    no_response: { bg: 'rgba(255,255,255,0.03)', color: textFaint, label: 'No Response' },
  }
  const c = config[status] ?? config.no_response
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, padding: '2px 8px',
      borderRadius: '20px', background: c.bg, color: c.color,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {c.label}
    </span>
  )
}

// ═══ SECTION 4 — CircleFormPanel sub-component ═══

function CircleFormPanel({
  form, setForm, onSubmit, onCancel, saving, isEdit,
}: {
  form:     CircleForm
  setForm:  (f: CircleForm) => void
  onSubmit: () => void
  onCancel: () => void
  saving:   boolean
  isEdit:   boolean
}) {
  const fieldStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid rgba(226,195,107,0.2)`,
    color: textPrimary, fontSize: '13px',
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: '9px', color: goldMuted, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em', display: 'block', marginBottom: '5px', fontWeight: 700,
  }

  return (
    <div style={{
      padding: '20px', borderRadius: '14px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${cardBorder}`,
      marginBottom: '16px',
    }}>
      <p style={{
        fontSize: '13px', fontWeight: 700, color: textPrimary,
        margin: '0 0 16px',
      }}>
        {isEdit ? 'Edit Circle' : 'Create a New Circle'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Circle name */}
        <div>
          <label style={labelStyle}>Circle Name *</label>
          <input
            style={fieldStyle}
            placeholder="e.g. Family, University Friends, Church"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            maxLength={60}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <input
            style={fieldStyle}
            placeholder="Brief description (optional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            maxLength={120}
          />
        </div>

        {/* Leader details — row */}
        <div>
          <label style={labelStyle}>Circle Leader</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              style={{ ...fieldStyle, flex: '1 1 140px' }}
              placeholder="Leader name"
              value={form.leader_name}
              onChange={e => setForm({ ...form, leader_name: e.target.value })}
              maxLength={80}
            />
            <input
              style={{ ...fieldStyle, flex: '1 1 160px' }}
              placeholder="Leader email"
              type="email"
              value={form.leader_email}
              onChange={e => setForm({ ...form, leader_email: e.target.value })}
              maxLength={120}
            />
            <input
              style={{ ...fieldStyle, flex: '1 1 120px' }}
              placeholder="Phone (optional)"
              value={form.leader_phone}
              onChange={e => setForm({ ...form, leader_phone: e.target.value })}
              maxLength={30}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onSubmit}
            disabled={saving || !form.name.trim()}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: form.name.trim()
                ? 'linear-gradient(135deg,#E2C36B,#C8A84A)'
                : 'rgba(255,255,255,0.06)',
              color: form.name.trim() ? '#1a0845' : 'rgba(255,255,255,0.2)',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : isEdit ? 'Update Circle' : 'Create Circle'}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: textFaint,
              fontSize: '12px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 5 — CircleCard sub-component ═══

function CircleCard({
  circle, onEdit, onDelete, onSendPortal, onExpand, expanded, guests,
  onAssignGuest, assigning,
}: {
  circle:        Circle
  onEdit:        () => void
  onDelete:      () => void
  onSendPortal:  () => void
  onExpand:      () => void
  expanded:      boolean
  guests:        Guest[]
  onAssignGuest: (guestId: string) => void
  assigning:     string | null
}) {
  const total = circle.guest_count
  const portalSent = !!circle.portal_sent_at
  const portalExpired = circle.portal_expires_at
    ? new Date(circle.portal_expires_at) < new Date()
    : false

  return (
    <div style={{
      borderRadius: '14px', border: `1px solid ${cardBorder}`,
      background: cardBg, marginBottom: '10px', overflow: 'hidden',
    }}>
      {/* ── Card header ── */}
      <div
        onClick={onExpand}
        style={{
          padding: '14px 16px', display: 'flex',
          alignItems: 'center', gap: '12px',
          cursor: 'pointer',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: goldFaint, border: '1px solid rgba(226,195,107,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
        }}>
          ◉
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: textPrimary,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {circle.name}
          </p>
          <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>
            {circle.leader_name ?? 'No leader assigned'}
            {total > 0 && ` · ${total} guest${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* RSVP mini-counts */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          {circle.rsvp_confirmed > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: greenText }}>
              {circle.rsvp_confirmed}✓
            </span>
          )}
          {circle.rsvp_declined > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: redText }}>
              {circle.rsvp_declined}✗
            </span>
          )}
          {circle.rsvp_pending > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: amberText }}>
              {circle.rsvp_pending}?
            </span>
          )}
          <span style={{ fontSize: '10px', color: goldMuted }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div style={{
          padding: '0 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: '14px',
        }}>
          {/* Action buttons */}
          <div style={{
            display: 'flex', gap: '6px', flexWrap: 'wrap',
            marginBottom: '14px',
          }}>
            <button
              onClick={onEdit}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: `1px solid ${cardBorder}`, background: 'transparent',
                color: goldMuted, fontSize: '11px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={onSendPortal}
              disabled={!circle.leader_email}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none',
                background: circle.leader_email ? goldFaint : 'rgba(255,255,255,0.03)',
                color: circle.leader_email ? gold : textFaint,
                fontSize: '11px', fontWeight: 600,
                cursor: circle.leader_email ? 'pointer' : 'not-allowed',
              }}
            >
              {portalSent && !portalExpired ? 'Resend Portal' : 'Send Portal Link'}
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: '1px solid rgba(248,113,113,0.2)',
                background: 'transparent', color: redText,
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Delete
            </button>
          </div>

          {/* Portal status */}
          {portalSent && (
            <p style={{
              fontSize: '10px', color: portalExpired ? redText : greenText,
              margin: '0 0 12px', fontStyle: 'italic',
            }}>
              {portalExpired
                ? `Portal link expired — resend to ${circle.leader_email}`
                : `Portal sent to ${circle.leader_email} on ${new Date(circle.portal_sent_at!).toLocaleDateString()}`
              }
            </p>
          )}

          {/* Guest list within this circle */}
          {guests.length > 0 ? (
            <div>
              <p style={{
                fontSize: '9px', fontWeight: 700, color: goldMuted,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                margin: '0 0 8px',
              }}>
                Guests in this circle
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {guests.map(g => (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <span style={{ flex: 1, fontSize: '12px', color: textSecondary }}>
                      {g.name}
                    </span>
                    <StatusBadge status={g.rsvp_status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '11px', color: textFaint, fontStyle: 'italic' }}>
              No guests assigned to this circle yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 6 — UnassignedGuestRow sub-component ═══

function UnassignedGuestRow({
  guest, circles, onAssign, assigning,
}: {
  guest:     Guest
  circles:   Circle[]
  onAssign:  (guestId: string, circleId: string) => void
  assigning: string | null
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 10px', borderRadius: '8px',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <span style={{ flex: 1, fontSize: '12px', color: textSecondary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {guest.name}
      </span>
      <StatusBadge status={guest.rsvp_status} />
      <select
        disabled={assigning === guest.id}
        onChange={e => { if (e.target.value) onAssign(guest.id, e.target.value) }}
        defaultValue=""
        style={{
          padding: '5px 8px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid rgba(226,195,107,0.2)`,
          color: textSecondary, fontSize: '11px',
          outline: 'none', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          minWidth: '120px',
        }}
      >
        <option value="" disabled>Assign to…</option>
        {circles.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

// ═══ SECTION 7 — Main CircleManager component ═══

export default function CircleManager({ capsuleId, capsuleSlug, onDataChange }: CircleManagerProps) {
  const [circles,       setCircles]       = useState<Circle[]>([])
  const [allGuests,     setAllGuests]     = useState<Guest[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [form,          setForm]          = useState<CircleForm>(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [assigning,     setAssigning]     = useState<string | null>(null)
  const [portalSending, setPortalSending] = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ── 7.1 Show toast then auto-dismiss ──────────────────────────────────────

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── 7.2 Fetch circles ────────────────────────────────────────────────────

  const fetchCircles = useCallback(async () => {
    try {
      const res  = await fetch(`/api/circles?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (data.circles) setCircles(data.circles)
    } catch (err) {
      console.warn('[CircleManager] Failed to fetch circles:', err)
    }
  }, [capsuleId])

  // ── 7.3 Fetch all guests (for assignment panel) ──────────────────────────

  const fetchGuests = useCallback(async () => {
    try {
      const res  = await fetch(`/api/guests?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (data.guests) setAllGuests(data.guests.filter((g: Guest) => !(g as any).deleted_at))
    } catch (err) {
      console.warn('[CircleManager] Failed to fetch guests:', err)
    }
  }, [capsuleId])

  // ── 7.4 Initial load ─────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([fetchCircles(), fetchGuests()]).finally(() => setLoading(false))
  }, [fetchCircles, fetchGuests])

  // ── 7.5 Create or update circle ───────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const payload = {
      capsule_id:   capsuleId,
      name:         form.name.trim(),
      description:  form.description.trim() || null,
      leader_name:  form.leader_name.trim() || null,
      leader_email: form.leader_email.trim().toLowerCase() || null,
      leader_phone: form.leader_phone.trim() || null,
      ...(editingId ? { id: editingId } : {}),
    }

    try {
      const res = await fetch('/api/circles', {
        method:  editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }
      showToast('success', editingId ? 'Circle updated' : 'Circle created')
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await fetchCircles()
      onDataChange()
    } catch (err: any) {
      showToast('error', err.message ?? 'Failed to save circle')
    } finally {
      setSaving(false)
    }
  }

  // ── 7.6 Delete circle ────────────────────────────────────────────────────

  const handleDelete = async (circleId: string) => {
    try {
      const res = await fetch('/api/circles', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: circleId, capsule_id: capsuleId }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      showToast('success', 'Circle deleted')
      setDeleteConfirm(null)
      await Promise.all([fetchCircles(), fetchGuests()])
      onDataChange()
    } catch {
      showToast('error', 'Failed to delete circle')
    }
  }

  // ── 7.7 Send portal link ─────────────────────────────────────────────────

  const handleSendPortal = async (circleId: string) => {
    setPortalSending(circleId)
    try {
      const res = await fetch('/api/circles/portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ circle_id: circleId, capsule_id: capsuleId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to send')
      }
      showToast('success', 'Portal link sent to circle leader')
      await fetchCircles()
    } catch (err: any) {
      showToast('error', err.message ?? 'Failed to send portal link')
    } finally {
      setPortalSending(null)
    }
  }

  // ── 7.8 Assign guest to circle ───────────────────────────────────────────

  const handleAssignGuest = async (guestId: string, circleId: string) => {
    setAssigning(guestId)
    try {
      const res = await fetch('/api/guests', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:        guestId,
          capsule_id: capsuleId,
          circle_id: circleId,
        }),
      })
      if (!res.ok) throw new Error('Failed to assign')
      showToast('success', 'Guest assigned to circle')
      await Promise.all([fetchCircles(), fetchGuests()])
      onDataChange()
    } catch {
      showToast('error', 'Failed to assign guest')
    } finally {
      setAssigning(null)
    }
  }

  // ── 7.9 Start editing ────────────────────────────────────────────────────

  const startEdit = (circle: Circle) => {
    setEditingId(circle.id)
    setForm({
      name:         circle.name,
      description:  circle.description ?? '',
      leader_name:  circle.leader_name ?? '',
      leader_email: circle.leader_email ?? '',
      leader_phone: circle.leader_phone ?? '',
    })
    setShowForm(true)
  }

  // ── 7.10 Derived data ────────────────────────────────────────────────────

  const unassignedGuests = allGuests.filter(g => !g.circle_id)
  const guestsByCircle   = (circleId: string) =>
    allGuests.filter(g => g.circle_id === circleId)

  // ── 7.11 Loading state ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: textFaint, fontSize: '12px' }}>
        Loading circles…
      </div>
    )
  }

  // ── 7.12 Render ───────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 1000,
          padding: '10px 18px', borderRadius: '10px',
          background: toast.type === 'success' ? greenBg : redBg,
          border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toast.type === 'success' ? greenText : redText,
          fontSize: '12px', fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {toast.message}
        </div>
      )}

      {/* ── Top actions ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
      }}>
        <p style={{
          fontSize: '9px', fontWeight: 700, color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
        }}>
          {circles.length} circle{circles.length !== 1 ? 's' : ''}
          {unassignedGuests.length > 0 &&
            ` · ${unassignedGuests.length} unassigned guest${unassignedGuests.length !== 1 ? 's' : ''}`
          }
        </p>

        {!showForm && (
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#E2C36B,#C8A84A)',
              color: '#1a0845', fontSize: '11px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add Circle
          </button>
        )}
      </div>

      {/* ── Create / Edit form ── */}
      {showForm && (
        <CircleFormPanel
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
          saving={saving}
          isEdit={!!editingId}
        />
      )}

      {/* ── Circle list ── */}
      {circles.length === 0 && !showForm ? (
        <div style={{
          padding: '40px 16px', textAlign: 'center',
          borderRadius: '14px', border: `1px dashed ${cardBorder}`,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <p style={{ fontSize: '14px', color: textSecondary, margin: '0 0 6px' }}>
            No circles yet
          </p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
            Create circles to group your guests — Family, Friends, Colleagues, VIPs.
            Each circle can have a leader who manages RSVPs for their group.
          </p>
        </div>
      ) : (
        circles.map(circle => (
          <div key={circle.id}>
            {/* ── Delete confirmation ── */}
            {deleteConfirm === circle.id ? (
              <div style={{
                padding: '14px 16px', borderRadius: '14px',
                background: redBg, border: '1px solid rgba(248,113,113,0.25)',
                marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <p style={{ flex: 1, fontSize: '12px', color: redText, margin: 0 }}>
                  Delete &quot;{circle.name}&quot;? Guests in this circle will become unassigned.
                </p>
                <button
                  onClick={() => handleDelete(circle.id)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', border: 'none',
                    background: 'rgba(248,113,113,0.2)', color: redText,
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent', color: textFaint,
                    fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <CircleCard
                circle={circle}
                onEdit={() => startEdit(circle)}
                onDelete={() => setDeleteConfirm(circle.id)}
                onSendPortal={() => handleSendPortal(circle.id)}
                onExpand={() => setExpandedId(expandedId === circle.id ? null : circle.id)}
                expanded={expandedId === circle.id}
                guests={guestsByCircle(circle.id)}
                onAssignGuest={(gid) => handleAssignGuest(gid, circle.id)}
                assigning={assigning}
              />
            )}
          </div>
        ))
      )}

      {/* ── Unassigned guests panel ── */}
      {unassignedGuests.length > 0 && circles.length > 0 && (
        <div style={{
          marginTop: '20px', padding: '16px', borderRadius: '14px',
          border: `1px solid rgba(251,191,36,0.15)`,
          background: 'rgba(251,191,36,0.03)',
        }}>
          <p style={{
            fontSize: '9px', fontWeight: 700, color: amberText,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: '0 0 10px',
          }}>
            Unassigned guests ({unassignedGuests.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {unassignedGuests.map(g => (
              <UnassignedGuestRow
                key={g.id}
                guest={g}
                circles={circles}
                onAssign={handleAssignGuest}
                assigning={assigning}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
