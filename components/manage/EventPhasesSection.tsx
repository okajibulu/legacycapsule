/**
 * ============================================================
 * FILE PATH: components/manage/EventPhasesSection.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 * Updated:  AI16 · Claude Opus 4.6 · 2 August 2026
 *   — Edit phase inline (was TODO stub)
 *   — Manage Photos button per phase (opens EventMomentsManager)
 *   — QR print page link per phase
 *   — QR size increased to 140×140
 *   — Description updated for Event Moments terminology
 *   — Photographer token generation per phase
// UPDATED:   AI23 · Claude Sonnet 4.6 · 18 August 2026
//   — Capture closes field removed (duration fixed at 24hrs from 6am WAT)
//   — Add button text updated: Event Moment count display
// 
 *
 * Sub-sections:
 *   1. Types & style tokens
 *   2. PhaseCard — display/edit/manage individual phase
 *   3. EditPhaseForm — inline edit
 *   4. AddPhaseForm — create new phase
 *   5. Main component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types & style tokens
// ============================================================

import { useState, useEffect } from 'react'
import EventMomentsManager from '@/components/manage/EventMomentsManager'

interface Phase {
  id:                            string
  name:                          string
  event_date:                    string | null
  location:                      string | null
  sort_order:                    number
  programme:                     any
  capture_window_closes_at:      string | null
  qr_token:                      string
  photographer_token?:           string | null
  photographer_token_expires_at?: string | null
}

interface Props {
  capsuleId:   string
  capsuleSlug: string
}

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ============================================================
// SECTION 2 — PhaseCard
// ============================================================

function PhaseCard({ phase, slug, capsuleId, onEdit, onDelete, onRefresh }: {
  phase:      Phase
  slug:       string
  capsuleId:  string
  onEdit:     () => void
  onDelete:   () => void
  onRefresh:  () => void
}) {
  const captureOpen = !phase.capture_window_closes_at ||
    new Date(phase.capture_window_closes_at) > new Date()
  const isToday = phase.event_date === new Date().toISOString().split('T')[0]

  const [showPhotos,      setShowPhotos]      = useState(false)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [tokenUrl,        setTokenUrl]        = useState<string | null>(
    phase.photographer_token && phase.photographer_token_expires_at &&
    new Date(phase.photographer_token_expires_at) > new Date()
      ? `${APP_URL}/photographer/${phase.photographer_token}`
      : null
  )
  const [tokenCopied,  setTokenCopied]  = useState(false)
  const [revokingToken, setRevokingToken] = useState(false)

  const qrData    = phase.qr_token
    ? `${APP_URL}/api/qr/${phase.qr_token}`
    : `${APP_URL}/for/${slug}/dday?phase=${phase.id}`
  const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=0f0a1e&color=D4AE2A&margin=10`
  const printUrl  = `/manage/${slug}/phases/${phase.id}/print`

  // ── Generate photographer token ────────────────────────────
  const handleGenerateToken = async () => {
    setGeneratingToken(true)
    try {
      const res  = await fetch('/api/photographer/token/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase_id: phase.id, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (data.ok) {
        setTokenUrl(data.portal_url)
        onRefresh()
      }
    } catch (e) {
      console.error('[EventPhasesSection] token generate error:', e)
    } finally {
      setGeneratingToken(false)
    }
  }

  // ── Revoke photographer token ──────────────────────────────
  const handleRevokeToken = async () => {
    if (!window.confirm('Revoke this photographer link? They will no longer be able to upload.')) return
    setRevokingToken(true)
    try {
      const res = await fetch('/api/photographer/token/revoke', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase_id: phase.id, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (data.ok) {
        setTokenUrl(null)
        onRefresh()
      }
    } catch (e) {
      console.error('[EventPhasesSection] token revoke error:', e)
    } finally {
      setRevokingToken(false)
    }
  }

  // ── Copy photographer link ─────────────────────────────────
  const handleCopyToken = () => {
    if (!tokenUrl) return
    navigator.clipboard.writeText(tokenUrl).catch(() => {
      const el = document.createElement('textarea')
      el.value = tokenUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2500)
  }

  return (
    <div style={{
      borderRadius: '14px',
      border:       `1px solid ${isToday ? gold : cardBorder}`,
      background:   isToday ? 'rgba(226,195,107,0.05)' : cardBg,
      marginBottom: '12px',
      overflow:     'hidden',
    }}>

      {/* ── Phase header ── */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

          {/* Phase info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: gold, margin: 0 }}>{phase.name}</p>
              {isToday && (
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', letterSpacing: '0.08em' }}>
                  TODAY
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {phase.event_date && (
                <span style={{ fontSize: '11px', color: textFaint }}>
                  📅 {new Date(phase.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
              {phase.location && (
                <span style={{ fontSize: '11px', color: textFaint }}>📍 {phase.location}</span>
              )}
            </div>

            {/* Status + links */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontSize:   '9px',
                fontWeight: 700,
                padding:    '2px 7px',
                borderRadius: '5px',
                background: captureOpen ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${captureOpen ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
                color:      captureOpen ? 'rgba(134,239,172,0.8)' : textFaint,
              }}>
                {captureOpen ? 'Capturing' : 'Closed'}
              </span>
              <a
                href={`/for/${slug}/story/${phase.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '10px', color: goldMuted, textDecoration: 'underline' }}>
                View gallery ↗
              </a>
            </div>
          </div>

          {/* QR code + print link */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <img src={qrUrl} alt="Phase QR" width={80} height={80} style={{ borderRadius: '8px', display: 'block' }} />
            <a
              href={printUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'block',
                marginTop:      '4px',
                fontSize:       '9px',
                color:          goldMuted,
                textDecoration: 'underline',
                textAlign:      'center',
                letterSpacing:  '0.06em',
                textTransform:  'uppercase',
              }}>
              Print QR ↗
            </a>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPhotos(p => !p)}
            style={{
              fontSize:     '11px',
              padding:      '6px 14px',
              borderRadius: '8px',
              border:       `1px solid ${gold}`,
              background:   showPhotos ? 'rgba(226,195,107,0.12)' : 'transparent',
              color:        gold,
              cursor:       'pointer',
              fontWeight:   600,
            }}>
            📸 {showPhotos ? 'Hide Photos' : 'Manage Photos'}
          </button>
          <button
            onClick={onEdit}
            style={{
              fontSize:     '11px',
              padding:      '6px 14px',
              borderRadius: '8px',
              border:       `1px solid ${goldFaint}`,
              background:   'rgba(226,195,107,0.06)',
              color:        goldMuted,
              cursor:       'pointer',
            }}>
            Edit Phase
          </button>
          <button
            onClick={onDelete}
            style={{
              fontSize:     '11px',
              padding:      '6px 14px',
              borderRadius: '8px',
              border:       '1px solid rgba(248,113,113,0.2)',
              background:   'transparent',
              color:        'rgba(248,113,113,0.6)',
              cursor:       'pointer',
            }}>
            Remove
          </button>
        </div>

        {/* ── Photographer token ── */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${goldFaint}` }}>
          <p style={{
            margin:        '0 0 8px',
            fontSize:      '10px',
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color:         goldMuted,
          }}>
            Official Photography Portal
          </p>
          {tokenUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                padding:      '8px 12px',
                borderRadius: '8px',
                background:   'rgba(255,255,255,0.04)',
                border:       `1px solid ${goldFaint}`,
                fontSize:     '11px',
                color:        textSecondary,
                wordBreak:    'break-all',
              }}>
                {tokenUrl}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleCopyToken}
                  style={{
                    fontSize:     '11px',
                    padding:      '6px 14px',
                    borderRadius: '8px',
                    border:       `1px solid ${goldFaint}`,
                    background:   tokenCopied ? 'rgba(74,222,128,0.08)' : 'rgba(226,195,107,0.06)',
                    color:        tokenCopied ? 'rgba(134,239,172,0.8)' : goldMuted,
                    cursor:       'pointer',
                    fontWeight:   600,
                  }}>
                  {tokenCopied ? '✓ Copied' : 'Copy Link'}
                </button>
                <button
                  onClick={handleRevokeToken}
                  disabled={revokingToken}
                  style={{
                    fontSize:     '11px',
                    padding:      '6px 14px',
                    borderRadius: '8px',
                    border:       '1px solid rgba(248,113,113,0.2)',
                    background:   'transparent',
                    color:        'rgba(248,113,113,0.6)',
                    cursor:       revokingToken ? 'not-allowed' : 'pointer',
                    opacity:      revokingToken ? 0.5 : 1,
                  }}>
                  {revokingToken ? 'Revoking…' : 'Revoke Link'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: textFaint, lineHeight: 1.6 }}>
                Generate a secure link to share with your photographer. They can upload official photos without needing your account access.
              </p>
              <button
                onClick={handleGenerateToken}
                disabled={generatingToken}
                style={{
                  fontSize:     '11px',
                  padding:      '6px 16px',
                  borderRadius: '8px',
                  border:       `1px solid ${goldFaint}`,
                  background:   'rgba(226,195,107,0.06)',
                  color:        goldMuted,
                  cursor:       generatingToken ? 'not-allowed' : 'pointer',
                  fontWeight:   600,
                  opacity:      generatingToken ? 0.5 : 1,
                }}>
                {generatingToken ? 'Generating…' : '+ Generate Photographer Link'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Photo management panel (inline) ── */}
      {showPhotos && (
        <div style={{
          borderTop:  `1px solid ${cardBorder}`,
          background: 'rgba(0,0,0,0.2)',
          padding:    '16px',
        }}>
          <EventMomentsManager
            capsuleId={capsuleId}
            capsuleSlug={slug}
            phases={[{ id: phase.id, name: phase.name, event_date: phase.event_date, sort_order: phase.sort_order }]}
            gold={gold}
            goldMuted={goldMuted}
            textPrimary={textPrimary}
            textFaint={textFaint}
            cardBg={cardBg}
            accentFaint={goldFaint}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================
// SECTION 3 — EditPhaseForm
// ============================================================

function EditPhaseForm({ phase, capsuleId, onSaved, onCancel }: {
  phase:     Phase
  capsuleId: string
  onSaved:   () => void
  onCancel:  () => void
}) {
  const prog = phase.programme as any
  const [name,           setName]          = useState(phase.name)
  const [date,           setDate]          = useState(phase.event_date ?? '')
  const [location,       setLocation]      = useState(phase.location ?? '')
  const [summary,        setSummary]       = useState(prog?.summary ?? '')

  const [saving,         setSaving]        = useState(false)
  const [error,          setError]         = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/phases`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:                      phase.id,
          name:                    name.trim(),
          event_date:              date || null,
          location:                location.trim() || null,
          programme:               summary.trim() ? { summary: summary.trim(), items: prog?.items ?? [] } : prog,

        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save. Please try again.')
        return
      }
      onSaved()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>
      <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Edit Phase</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp} placeholder="Phase name *" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Event date</label>
            <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <input style={inp} placeholder="Venue / Location" value={location} onChange={e => setLocation(e.target.value)} />
        <textarea
          style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
          rows={2}
          placeholder="Programme summary"
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
        {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{ padding: '8px 20px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '12px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 4 — AddPhaseForm
// ============================================================

function AddPhaseForm({ capsuleId, onAdded, onCancel }: {
  capsuleId: string
  onAdded:   () => void
  onCancel:  () => void
}) {
  const [name,          setName]          = useState('')
  const [date,          setDate]          = useState('')
  const [location,      setLocation]      = useState('')
  const [summary,       setSummary]       = useState('')

  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/phases', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:              capsuleId,
          name:                    name.trim(),
          event_date:              date || undefined,
          location:                location.trim() || undefined,
          programme:               summary.trim() ? { summary: summary.trim() } : undefined,

        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'phase_limit_reached'
          ? data.message
          : 'Failed to create phase. Please try again.')
        return
      }
      onAdded()
    } catch {
      setError('Failed to create phase. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>
      <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>New Event Phase</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp} placeholder="Phase name (e.g. Inaugural Lecture, Reception Party) *" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Event date</label>
            <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <input style={inp} placeholder="Venue / Location" value={location} onChange={e => setLocation(e.target.value)} />
        <textarea
          style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
          rows={2}
          placeholder="Programme summary (dress code, notes for guests…)"
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
        {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{ padding: '8px 20px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add Phase'}
          </button>
          <button
            onClick={onCancel}
            style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '12px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 5 — Main component
// ============================================================

export default function EventPhasesSection({ capsuleId, capsuleSlug }: Props) {
  const [phases,      setPhases]      = useState<Phase[]>([])
  const [adding,      setAdding]      = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [phaseLimit,  setPhaseLimit]  = useState(10)

  const fetchPhases = async () => {
    try {
      const res  = await fetch(`/api/phases?capsule_id=${capsuleId}`)
      const data = await res.json()
      setPhases(data.phases ?? [])
    } catch (e) {
      console.error('[EventPhasesSection] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPhases() }, [capsuleId])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this phase? This cannot be undone.')) return
    await fetch(`/api/phases?id=${id}`, { method: 'DELETE' })
    fetchPhases()
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '16px' }}>
        Each event phase gets its own QR code for guest photo capture on the day.
        After the event, use "Manage Photos" to curate guest uploads, add official
        photography, and prepare content for the digital publication.
      </p>

      {loading ? (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '16px 0' }}>
          Loading phases…
        </p>
      ) : (
        <>
          {phases.map(phase => (
            editingId === phase.id ? (
              <EditPhaseForm
                key={phase.id}
                phase={phase}
                capsuleId={capsuleId}
                onSaved={() => { setEditingId(null); fetchPhases() }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <PhaseCard
                key={phase.id}
                phase={phase}
                slug={capsuleSlug}
                capsuleId={capsuleId}
                onEdit={() => setEditingId(phase.id)}
                onDelete={() => handleDelete(phase.id)}
                onRefresh={fetchPhases}
              />
            )
          ))}

          {adding ? (
            <AddPhaseForm
              capsuleId={capsuleId}
              onAdded={() => { setAdding(false); fetchPhases() }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            phases.length < phaseLimit && (
              <button
                onClick={() => setAdding(true)}
                style={{
                  width:        '100%',
                  padding:      '10px',
                  borderRadius: '10px',
                  border:       '1px dashed rgba(226,195,107,0.2)',
                  background:   'transparent',
                  color:        goldMuted,
                  fontSize:     '12px',
                  fontWeight:   600,
                  cursor:       'pointer',
                }}>
                {`+ Add Event Phase`}
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 400, color: goldMuted, marginTop: '2px' }}>
                  {phases.length} of {phaseLimit} Event {phaseLimit === 1 ? 'Phase' : 'Phases'} used
                </span>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 400, color: goldMuted, marginTop: '2px' }}>
                  {phases.length} of {phaseLimit} Event {phaseLimit === 1 ? 'Moment' : 'Moments'} used
                </span>
              </button>
            )
          )}
        </>
      )}
    </div>
  )
}