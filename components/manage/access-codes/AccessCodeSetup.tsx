'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessCodeSetup.tsx
// PURPOSE: Hall configuration wizard. Step 2 of LC-ACCESS-001 component build.
//          Organiser selects hall type, capacity, code mode and check-in window.
//          Saves to event_access_config via /api/access-codes/config.
//          On activation: triggers code generation via /api/access-codes/generate.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports & types
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

interface Props {
  capsuleId:   string
  guestCount:  number
  onActivated: () => void
}

interface Config {
  id?:                 string
  hall_config:         string
  capacity:            number | null
  code_mode:           string
  allow_reentry:       boolean
  checkin_opens_at:    string | null
  checkin_closes_at:   string | null
  show_table_on_scan:  boolean
  show_tier_on_scan:   boolean
  is_active:           boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Hall config options
// ─────────────────────────────────────────────────────────────────────────────

const HALL_CONFIGS = [
  { value: 'free_seating',      label: 'Free Seating',       desc: 'No table assignment. Access code used for entry only.' },
  { value: 'numbered_tables',   label: 'Numbered Tables',    desc: 'Tables numbered 1–N. Each guest assigned a table number.' },
  { value: 'named_tables',      label: 'Named Tables',       desc: 'Tables with custom names (e.g. "Royal Table", "Garden View").' },
  { value: 'group_sections',    label: 'Group Sections',     desc: 'Guests assigned to sections (e.g. Family, Alumni, Friends).' },
  { value: 'mixed_tier_zones',  label: 'Mixed Tier Zones',   desc: 'Separate zones by guest tier — VVIP, VIP, General, etc.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AccessCodeSetup({ capsuleId, guestCount, onActivated }: Props) {
  const [config, setConfig] = useState<Config>({
    hall_config: 'free_seating', capacity: null, code_mode: 'single',
    allow_reentry: false, checkin_opens_at: null, checkin_closes_at: null,
    show_table_on_scan: true, show_tier_on_scan: true, is_active: false,
  })
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')

  // ── Fetch existing config on mount ─────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/access-codes/config?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capsuleId])

  const update = (k: keyof Config, v: any) => setConfig(prev => ({ ...prev, [k]: v }))

  // ── Save config ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setError(''); setMsg('')
    try {
      const res  = await fetch('/api/access-codes/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setConfig(data.config)
      setMsg('Configuration saved.')
      setTimeout(() => setMsg(''), 3000)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  // ── Generate codes ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (guestCount === 0) { setError('Add guests before generating codes.'); return }
    setGenerating(true); setError(''); setMsg('')
    try {
      const res  = await fetch('/api/access-codes/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setMsg(`✓ ${data.generated} codes generated. ${data.errors > 0 ? `${data.errors} failed.` : ''}`)
      onActivated()
    } catch (e: any) { setError(e.message) }
    setGenerating(false)
  }

  if (loading) return <p style={{ fontSize: '12px', color: textFaint, padding: '12px 0' }}>Loading…</p>

  const selectedHall = HALL_CONFIGS.find(h => h.value === config.hall_config)

  return (
    <div>
      {/* ── Notice about access cards vs table cards ── */}
      <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(248,191,113,0.25)', background: 'rgba(248,191,113,0.05)', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(248,191,113,0.8)', margin: 0, lineHeight: 1.7 }}>
          <strong>Note:</strong> Access cards are typically collected at the entrance and may not be seen again. Generate table cards separately so guests can submit tributes from their seats.
        </p>
      </div>

      {/* ── Hall configuration ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Hall Setup</label>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
          {HALL_CONFIGS.map(h => (
            <button key={h.value} onClick={() => update('hall_config', h.value)}
              style={{ textAlign: 'left' as const, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${config.hall_config === h.value ? 'rgba(226,195,107,0.5)' : cardBorder}`, background: config.hall_config === h.value ? 'rgba(226,195,107,0.07)' : cardBg, cursor: 'pointer' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: config.hall_config === h.value ? gold : textPrimary }}>{h.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: textFaint }}>{h.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Capacity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Expected capacity</label>
          <input style={inp} type="number" placeholder="e.g. 250" value={config.capacity ?? ''} onChange={e => update('capacity', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Code mode</label>
          <select style={inp} value={config.code_mode} onChange={e => update('code_mode', e.target.value)}>
            <option value="single">Single code per guest</option>
            <option value="per_phase">Separate code per phase</option>
          </select>
        </div>
      </div>

      {/* ── Check-in window ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Check-in opens</label>
          <input style={inp} type="datetime-local" value={config.checkin_opens_at?.slice(0, 16) ?? ''} onChange={e => update('checkin_opens_at', e.target.value || null)} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Check-in closes</label>
          <input style={inp} type="datetime-local" value={config.checkin_closes_at?.slice(0, 16) ?? ''} onChange={e => update('checkin_closes_at', e.target.value || null)} />
        </div>
      </div>

      {/* ── Toggle options ── */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'allow_reentry',      label: 'Allow re-entry (multi-use codes)' },
          { key: 'show_table_on_scan', label: 'Show table/section on usher scan screen' },
          { key: 'show_tier_on_scan',  label: 'Show guest tier on usher scan screen' },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div onClick={() => update(key as keyof Config, !config[key as keyof Config])}
              style={{ width: '36px', height: '20px', borderRadius: '10px', background: config[key as keyof Config] ? 'rgba(226,195,107,0.7)' : 'rgba(255,255,255,0.1)', position: 'relative' as const, flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer' }}>
              <div style={{ position: 'absolute' as const, top: '2px', left: config[key as keyof Config] ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: '12px', color: textFaint }}>{label}</span>
          </label>
        ))}
      </div>

      {/* ── Messages ── */}
      {msg   && <p style={{ fontSize: '12px', color: 'rgba(134,239,172,0.8)', marginBottom: '10px' }}>{msg}</p>}
      {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} disabled={saving}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid rgba(226,195,107,0.3)`, background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>
        <button onClick={handleGenerate} disabled={generating || guestCount === 0}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: guestCount === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #E2C36B, #C8A84A)', color: guestCount === 0 ? textFaint : '#1a0845', fontSize: '12px', fontWeight: 700, cursor: guestCount === 0 ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
          {generating ? 'Generating…' : `Generate Codes (${guestCount} guests)`}
        </button>
      </div>
    </div>
  )
}
