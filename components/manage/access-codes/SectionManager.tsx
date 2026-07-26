'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/SectionManager.tsx
// PURPOSE: Create and manage venue sections, tables, or zones for the
//          Access Code System. Adapts UI based on the organiser's selected
//          hall configuration:
//            · numbered_tables  → batch table creator (Table 1…N)
//            · named_tables     → individual name input per table
//            · group_sections   → preset chips + custom name input
//            · mixed_tier_zones → auto-create zones from guest tiers
//            · free_seating     → renders nothing (no sections needed)
//          Self-contained: fetches config and sections internally.
//          CRUDs against /api/access-codes/sections and event_sections table.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect } from 'react'

interface Section {
  id:               string
  capsule_id:       string
  name:             string
  section_type:     string
  capacity:         number | null
  tier_restriction: string[]
  sort_order:       number
}

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textFaint    = 'rgba(255,255,255,0.28)'
const errorColor   = 'rgba(248,113,113,0.8)'
const successColor = 'rgba(134,239,172,0.8)'

const inputStyle: React.CSSProperties = {
  fontSize: '13px', padding: '9px 12px', borderRadius: '9px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Hall config metadata ═══
//
// Maps each hall layout to its display labels, DB section_type value,
// and a plain-language tip shown above the builder.

const HALL_META: Record<string, {
  label:       string
  itemLabel:   string
  sectionType: string
  tip:         string
}> = {
  numbered_tables: {
    label:       'Tables',
    itemLabel:   'table',
    sectionType: 'table',
    tip:         'Create your numbered tables. Each guest is assigned a table '
               + 'number that appears on their access card and the usher screen.',
  },
  named_tables: {
    label:       'Tables',
    itemLabel:   'table',
    sectionType: 'table',
    tip:         'Add tables by name. Guests see their assigned table name on '
               + 'their access card and when checked in by an usher.',
  },
  group_sections: {
    label:       'Sections',
    itemLabel:   'section',
    sectionType: 'section',
    tip:         'Group guests into sections. Use the presets or create your own. '
               + 'Ushers direct guests to the right area based on their section.',
  },
  mixed_tier_zones: {
    label:       'Zones',
    itemLabel:   'zone',
    sectionType: 'zone',
    tip:         'Create a dedicated zone for each guest tier. Zones are '
               + 'pre-named from the standard tiers — remove any you don\'t need.',
  },
}

// ═══ SECTION 4 — Presets and constants ═══

// Quick-add section names for group_sections
const SECTION_PRESETS = [
  'Family', 'Friends', 'Colleagues', 'Community',
  'Church', 'Alumni', 'Neighbours', 'Associates',
]

// Tier zone definitions for mixed_tier_zones
const TIER_ZONES = [
  { name: 'VVIP Zone',       tier: 'vvip' },
  { name: 'VIP Zone',        tier: 'vip' },
  { name: 'General Zone',    tier: 'general' },
  { name: 'Reception Zone',  tier: 'reception_only' },
  { name: 'Staff Area',      tier: 'staff' },
  { name: 'Media Area',      tier: 'media' },
  { name: 'Vendor Area',     tier: 'vendor' },
]

// ═══ SECTION 5 — Component ═══

export default function SectionManager({ capsuleId }: { capsuleId: string }) {

  // ── 5.1 State ──────────────────────────────────────────────────────────────

  const [hallConfig,    setHallConfig]    = useState<string>('')
  const [sections,      setSections]      = useState<Section[]>([])
  const [loading,       setLoading]       = useState(true)
  const [creating,      setCreating]      = useState(false)
  const [msg,           setMsg]           = useState('')
  const [error,         setError]         = useState('')

  // Input state for numbered tables
  const [tableCount,    setTableCount]    = useState<number>(10)
  const [seatsPerTable, setSeatsPerTable] = useState<number | null>(null)

  // Input state for named tables / group sections
  const [newName,       setNewName]       = useState('')

  // ── 5.2 Fetch config and sections on mount ─────────────────────────────────

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        // Get hall config from event_access_config
        const configRes  = await fetch(`/api/access-codes/config?capsule_id=${capsuleId}`)
        const configData = await configRes.json()
        if (cancelled) return

        const hc = configData.config?.hall_config ?? 'free_seating'
        setHallConfig(hc)

        // Free seating needs no sections — stop here
        if (hc === 'free_seating') { setLoading(false); return }

        // Get existing sections from event_sections
        const secRes  = await fetch(`/api/access-codes/sections?capsule_id=${capsuleId}`)
        const secData = await secRes.json()
        if (!cancelled && secData.sections) {
          setSections(
            secData.sections.sort((a: Section, b: Section) => a.sort_order - b.sort_order)
          )
        }
      } catch {
        // Silently handle — empty state will prompt creation
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [capsuleId])

  // ── 5.3 Helpers ────────────────────────────────────────────────────────────

  // Re-fetch sections list from server
  const fetchSections = async () => {
    try {
      const res  = await fetch(`/api/access-codes/sections?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (data.sections) {
        setSections(
          data.sections.sort((a: Section, b: Section) => a.sort_order - b.sort_order)
        )
      }
    } catch {}
  }

  // Flash a success message
  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  // ── 5.4 Create: numbered tables (batch) ────────────────────────────────────

  const createNumberedTables = async () => {
    if (tableCount < 1 || tableCount > 200) {
      setError('Enter a number between 1 and 200.')
      return
    }
    setCreating(true); setError(''); setMsg('')

    const startFrom = sections.length
    let created = 0

    try {
      for (let i = 0; i < tableCount; i++) {
        const res = await fetch('/api/access-codes/sections', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            capsule_id:       capsuleId,
            name:             `Table ${startFrom + i + 1}`,
            section_type:     'table',
            capacity:         seatsPerTable,
            tier_restriction: [],
            sort_order:       startFrom + i + 1,
          }),
        })
        if (res.ok) created++
      }
      flash(`${created} table${created !== 1 ? 's' : ''} created.`)
      await fetchSections()
    } catch (e: any) {
      setError(e.message || 'Failed to create tables.')
    }
    setCreating(false)
  }

  // ── 5.5 Create: single section/table by name ───────────────────────────────

  const createSingle = async (name: string, tierRestriction: string[] = []) => {
    if (!name.trim()) return
    setCreating(true); setError(''); setMsg('')

    const meta = HALL_META[hallConfig]

    try {
      const res = await fetch('/api/access-codes/sections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:       capsuleId,
          name:             name.trim(),
          section_type:     meta?.sectionType ?? 'section',
          capacity:         null,
          tier_restriction: tierRestriction,
          sort_order:       sections.length + 1,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Creation failed')
      }
      setNewName('')
      flash(`${(meta?.itemLabel ?? 'item').charAt(0).toUpperCase() + (meta?.itemLabel ?? 'item').slice(1)} added.`)
      await fetchSections()
    } catch (e: any) {
      setError(e.message)
    }
    setCreating(false)
  }

  // ── 5.6 Create: tier zones (batch) ─────────────────────────────────────────

  const createTierZones = async () => {
    setCreating(true); setError(''); setMsg('')
    let created = 0

    try {
      for (let i = 0; i < TIER_ZONES.length; i++) {
        const zone = TIER_ZONES[i]
        // Skip if a zone for this tier already exists
        if (sections.some(s => s.tier_restriction?.includes(zone.tier))) continue

        const res = await fetch('/api/access-codes/sections', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            capsule_id:       capsuleId,
            name:             zone.name,
            section_type:     'zone',
            capacity:         null,
            tier_restriction: [zone.tier],
            sort_order:       i + 1,
          }),
        })
        if (res.ok) created++
      }
      flash(`${created} zone${created !== 1 ? 's' : ''} created.`)
      await fetchSections()
    } catch (e: any) {
      setError(e.message || 'Failed to create zones.')
    }
    setCreating(false)
  }

  // ── 5.7 Delete section ─────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    const meta = HALL_META[hallConfig]
    const label = meta?.itemLabel ?? 'item'
    if (!window.confirm(
      `Remove "${name}"? Any guests assigned to this ${label} will need reassignment.`
    )) return

    try {
      await fetch('/api/access-codes/sections', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      setSections(prev => prev.filter(s => s.id !== id))
    } catch {
      setError(`Failed to remove ${label}.`)
    }
  }

  // ── 5.8 Update section capacity (on blur) ──────────────────────────────────

  const updateCapacity = async (id: string, capacity: number | null) => {
    try {
      await fetch('/api/access-codes/sections', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, capacity }),
      })
    } catch {
      // Silently handle — local state already updated
    }
  }

  // ═══ SECTION 6 — Render ═══

  // Don't render for free seating or unknown config
  if (hallConfig === 'free_seating' || hallConfig === '') return null
  if (loading) {
    return (
      <p style={{ fontSize: '12px', color: textFaint, padding: '12px 0' }}>
        Loading sections…
      </p>
    )
  }

  const meta = HALL_META[hallConfig]
  if (!meta) return null

  return (
    <div>

      {/* ── 6.1 Header ────────────────────────────────────────────────────── */}

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '6px',
      }}>
        <p style={{
          fontSize: '10px', color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          fontWeight: 600, margin: 0,
        }}>
          {meta.label}
        </p>
        <span style={{
          fontSize: '11px', color: textFaint,
        }}>
          ({sections.length} created)
        </span>
      </div>

      {/* ── 6.2 Tip ───────────────────────────────────────────────────────── */}

      <p style={{
        fontSize: '11px', color: textFaint,
        lineHeight: 1.65, marginBottom: '14px',
      }}>
        {meta.tip}
      </p>

      {/* ── 6.3 Messages ──────────────────────────────────────────────────── */}

      {msg && (
        <p style={{ fontSize: '12px', color: successColor, marginBottom: '10px' }}>
          {msg}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '12px', color: errorColor, marginBottom: '10px' }}>
          {error}
        </p>
      )}

      {/* ── 6.4 Creation controls ─────────────────────────────────────────── */}

      {/* ── NUMBERED TABLES — batch creator ── */}
      {hallConfig === 'numbered_tables' && sections.length === 0 && (
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '14px',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              fontSize: '10px', color: textFaint,
              display: 'block', marginBottom: '4px',
            }}>
              How many tables?
            </label>
            <input
              style={{ ...inputStyle, width: '100%' }}
              type="number" min="1" max="200"
              value={tableCount}
              onChange={e => setTableCount(Number(e.target.value))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              fontSize: '10px', color: textFaint,
              display: 'block', marginBottom: '4px',
            }}>
              Seats per table
            </label>
            <input
              style={{ ...inputStyle, width: '100%' }}
              type="number" min="1"
              placeholder="Optional"
              value={seatsPerTable ?? ''}
              onChange={e => setSeatsPerTable(
                e.target.value ? Number(e.target.value) : null
              )}
            />
          </div>
          <button
            onClick={createNumberedTables}
            disabled={creating}
            style={{
              padding: '9px 16px', borderRadius: '9px', border: 'none',
              background: creating
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
              color: creating ? textFaint : '#1a0845',
              fontSize: '12px', fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      {/* ── NAMED TABLES / GROUP SECTIONS — individual add ── */}
      {(hallConfig === 'named_tables' || hallConfig === 'group_sections') && (
        <div>
          {/* Preset chips for group_sections */}
          {hallConfig === 'group_sections' && (
            <div style={{
              display: 'flex', gap: '4px', flexWrap: 'wrap' as const,
              marginBottom: '10px',
            }}>
              {SECTION_PRESETS.map(preset => {
                const exists = sections.some(
                  s => s.name.toLowerCase() === preset.toLowerCase()
                )
                return (
                  <button
                    key={preset}
                    onClick={() => !exists && createSingle(preset)}
                    disabled={creating || exists}
                    style={{
                      padding: '5px 12px', borderRadius: '8px',
                      border: `1px solid ${exists
                        ? 'rgba(255,255,255,0.05)'
                        : cardBorder}`,
                      background: exists ? 'rgba(255,255,255,0.02)' : cardBg,
                      color: exists ? 'rgba(255,255,255,0.15)' : textFaint,
                      fontSize: '11px',
                      cursor: exists ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {exists ? '✓' : '+'} {preset}
                  </button>
                )
              })}
            </div>
          )}

          {/* Custom name input */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '14px',
          }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder={`Add a ${meta.itemLabel} name…`}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newName.trim()) createSingle(newName)
              }}
              maxLength={60}
            />
            <button
              onClick={() => createSingle(newName)}
              disabled={creating || !newName.trim()}
              style={{
                padding: '9px 16px', borderRadius: '9px', border: 'none',
                background: !newName.trim()
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
                color: !newName.trim() ? textFaint : '#1a0845',
                fontSize: '12px', fontWeight: 700,
                cursor: !newName.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* ── MIXED TIER ZONES — auto-create button ── */}
      {hallConfig === 'mixed_tier_zones' && sections.length === 0 && (
        <button
          onClick={createTierZones}
          disabled={creating}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            border: 'none',
            background: creating
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
            color: creating ? textFaint : '#1a0845',
            fontSize: '13px', fontWeight: 700,
            cursor: creating ? 'not-allowed' : 'pointer',
            marginBottom: '14px',
          }}
        >
          {creating ? 'Creating zones…' : 'Create Zones from Guest Tiers'}
        </button>
      )}

      {/* ── 6.5 Section list ──────────────────────────────────────────────── */}

      {sections.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column' as const, gap: '4px',
        }}>
          {sections.map(section => (
            <div
              key={section.id}
              style={{
                padding: '8px 12px', borderRadius: '9px',
                border: `1px solid ${cardBorder}`, background: cardBg,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {/* Name */}
              <span style={{
                fontSize: '12px', fontWeight: 600, color: textPrimary,
                flex: 1, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {section.name}
              </span>

              {/* Tier restriction badge */}
              {section.tier_restriction?.length > 0 && (
                <span style={{
                  fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                  background: goldFaint, color: goldMuted, fontWeight: 700,
                  textTransform: 'uppercase' as const, flexShrink: 0,
                }}>
                  {section.tier_restriction[0]}
                </span>
              )}

              {/* Capacity input */}
              <input
                style={{
                  ...inputStyle,
                  width: '58px', textAlign: 'center' as const,
                  padding: '5px 4px', fontSize: '11px',
                }}
                type="number" min="1"
                placeholder="Cap."
                value={section.capacity ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null
                  setSections(prev =>
                    prev.map(s => s.id === section.id
                      ? { ...s, capacity: val }
                      : s
                    )
                  )
                }}
                onBlur={e => {
                  const val = e.target.value ? Number(e.target.value) : null
                  updateCapacity(section.id, val)
                }}
              />

              {/* Delete */}
              <button
                onClick={() => handleDelete(section.id, section.name)}
                aria-label={`Remove ${section.name}`}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(248,113,113,0.4)', fontSize: '14px',
                  cursor: 'pointer', padding: '2px 6px', flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 6.6 Add more (for numbered tables after initial batch) ─────── */}

      {hallConfig === 'numbered_tables' && sections.length > 0 && (
        <button
          onClick={() => createSingle(`Table ${sections.length + 1}`)}
          disabled={creating}
          style={{
            marginTop: '8px', padding: '8px 14px', borderRadius: '8px',
            border: `1px solid ${cardBorder}`, background: 'transparent',
            color: goldMuted, fontSize: '11px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Another Table
        </button>
      )}

      {/* ── 6.7 Add more (for tier zones after initial creation) ──────── */}

      {hallConfig === 'mixed_tier_zones' && sections.length > 0 && sections.length < 7 && (
        <button
          onClick={createTierZones}
          disabled={creating}
          style={{
            marginTop: '8px', padding: '8px 14px', borderRadius: '8px',
            border: `1px solid ${cardBorder}`, background: 'transparent',
            color: goldMuted, fontSize: '11px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Missing Zones
        </button>
      )}

      {/* ── 6.8 Empty state (sections deleted) ────────────────────────── */}

      {sections.length === 0 && hallConfig !== 'numbered_tables' && hallConfig !== 'mixed_tier_zones' && (
        <div style={{
          padding: '20px', textAlign: 'center' as const,
          borderRadius: '10px',
          border: '1px dashed rgba(226,195,107,0.12)',
        }}>
          <p style={{
            fontSize: '12px', color: textFaint, margin: 0,
          }}>
            No {meta.label.toLowerCase()} created yet. Use the controls above to add them.
          </p>
        </div>
      )}
    </div>
  )
}
