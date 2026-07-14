/**
 * ============================================================
 * FILE PATH: components/manage/EventPhasesSection.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Event Phases — inline management for Services tab
 * Used inside: app/manage/[slug]/page.tsx ServicesTab
 *
 * Sub-sections:
 *   1. Types & style tokens
 *   2. PhaseCard — display/edit individual phase
 *   3. AddPhaseForm — create new phase
 *   4. Main component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types & style tokens
// ============================================================

import { useState, useEffect } from 'react'

interface Phase {
  id: string
  name: string
  event_date: string | null
  location: string | null
  sort_order: number
  programme: any
  capture_window_closes_at: string | null
  qr_token: string
}

interface Props {
  capsuleId: string
  capsuleSlug: string
}

const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.12)'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'

// ============================================================
// SECTION 2 — PhaseCard
// ============================================================

function PhaseCard({ phase, slug, onEdit, onDelete }: {
  phase: Phase; slug: string; onEdit: () => void; onDelete: () => void
}) {
  const captureOpen = !phase.capture_window_closes_at ||
    new Date(phase.capture_window_closes_at) > new Date()
  const isToday = phase.event_date === new Date().toISOString().split('T')[0]

  const qrData   = phase.qr_token ? `${APP_URL}/api/qr/${phase.qr_token}` : `${APP_URL}/for/${slug}/story/${phase.id}`
  const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&bgcolor=0f0a1e&color=D4AE2A&margin=8`

  return (
    <div style={{ padding: '14px 16px', borderRadius: '12px', border: `1px solid ${isToday ? gold : cardBorder}`, background: isToday ? 'rgba(226,195,107,0.05)' : cardBg, marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: gold, margin: 0 }}>{phase.name}</p>
            {isToday && <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', letterSpacing: '0.08em' }}>TODAY</span>}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '6px' }}>
            {phase.event_date && <span style={{ fontSize: '11px', color: textFaint }}>📅 {new Date(phase.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
            {phase.location && <span style={{ fontSize: '11px', color: textFaint }}>📍 {phase.location}</span>}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: captureOpen ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${captureOpen ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`, color: captureOpen ? 'rgba(134,239,172,0.8)' : textFaint }}>
              {captureOpen ? 'Capturing' : 'Closed'}
            </span>
            <a href={`/for/${slug}/story/${phase.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: goldMuted, textDecoration: 'underline' }}>View page ↗</a>
          </div>
        </div>
        {/* QR code */}
        <div style={{ flexShrink: 0, textAlign: 'center' as const }}>
          <img src={qrUrl} alt="Phase QR" width={60} height={60} style={{ borderRadius: '6px' }} />
          <p style={{ fontSize: '8px', color: textFaint, margin: '3px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Scan</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        <button onClick={onEdit} style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${goldFaint}`, background: 'rgba(226,195,107,0.06)', color: goldMuted, cursor: 'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>Remove</button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 3 — AddPhaseForm
// ============================================================

function AddPhaseForm({ capsuleId, onAdded, onCancel }: {
  capsuleId: string; onAdded: () => void; onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [captureCloses, setCaptureCloses] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true); setError('')
    const res = await fetch('/api/phases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id: capsuleId,
        name: name.trim(),
        event_date: date || undefined,
        location: location.trim() || undefined,
        programme: summary.trim() ? { summary: summary.trim() } : undefined,
        capture_window_closes_at: captureCloses || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.error === 'phase_limit_reached') {
        setError(data.message)
      } else {
        setError('Failed to create phase. Please try again.')
      }
      setSaving(false)
      return
    }
    setSaving(false)
    onAdded()
  }

  return (
    <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>
      <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>New Event Phase</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp} placeholder="Phase name (e.g. Traditional Ceremony, White Wedding) *" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Event date</label>
            <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Capture closes</label>
            <input type="datetime-local" style={{ ...inp, fontSize: '12px' }} value={captureCloses} onChange={e => setCaptureCloses(e.target.value)} />
          </div>
        </div>
        <input style={inp} placeholder="Venue / Location" value={location} onChange={e => setLocation(e.target.value)} />
        <textarea style={{ ...inp, resize: 'none' as const, lineHeight: 1.6 }} rows={2} placeholder="Programme summary (dress code, notes for guests…)" value={summary} onChange={e => setSummary(e.target.value)} />
        {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: '8px 20px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add Phase'}
          </button>
          <button onClick={onCancel} style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 4 — Main component
// ============================================================

export default function EventPhasesSection({ capsuleId, capsuleSlug }: Props) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPhases = async () => {
    const res = await fetch(`/api/phases?capsule_id=${capsuleId}`)
    const data = await res.json()
    setPhases(data.phases ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPhases() }, [capsuleId])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this phase?')) return
    await fetch(`/api/phases?id=${id}`, { method: 'DELETE' })
    fetchPhases()
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        Event phases capture distinct moments of your event — from the traditional ceremony to the reception. Each phase gets its own QR code for D-Day photo capture. Every capsule includes 2 phases.
      </p>

      {loading ? (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '16px 0' }}>Loading phases…</p>
      ) : (
        <>
          {phases.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              slug={capsuleSlug}
              onEdit={() => {/* TODO: inline edit in v2 */}}
              onDelete={() => handleDelete(phase.id)}
            />
          ))}

          {adding ? (
            <AddPhaseForm
              capsuleId={capsuleId}
              onAdded={() => { setAdding(false); fetchPhases() }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              disabled={phases.length >= 2}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px',
                border: `1px dashed ${phases.length >= 2 ? 'rgba(255,255,255,0.06)' : 'rgba(226,195,107,0.2)'}`,
                background: 'transparent',
                color: phases.length >= 2 ? textFaint : goldMuted,
                fontSize: '12px', fontWeight: 600, cursor: phases.length >= 2 ? 'not-allowed' : 'pointer',
              }}
            >
              {phases.length >= 2
                ? `✦ Phase limit reached — unlock Additional Phase from Services`
                : `+ Add Event Phase (${phases.length}/2 used)`
              }
            </button>
          )}
        </>
      )}
    </div>
  )
}
