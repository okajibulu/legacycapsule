'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessCodeSetup.tsx
// PURPOSE: Hall configuration for the Access Code System.
//          Organiser selects venue layout, sets entry rules, configures
//          check-in timing. Every field has a contextual tooltip.
//          Config is auto-saved to localStorage as a draft and persisted
//          to event_access_config on explicit save.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// REPLACES: Previous version by AI11 (Claude Sonnet 4.6)
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect, useCallback } from 'react'

interface Props {
  capsuleId:   string
  guestCount:  number
  eventDate:   string | null
  onActivated: () => void   // called after config is saved — unlocks other tabs
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
  guidance_note_shown: boolean
  is_active:           boolean
}

const DEFAULT_CONFIG: Config = {
  hall_config:         'free_seating',
  capacity:            null,
  code_mode:           'single',
  allow_reentry:       false,
  checkin_opens_at:    null,
  checkin_closes_at:   null,
  show_table_on_scan:  true,
  show_tier_on_scan:   true,
  guidance_note_shown: false,
  is_active:           false,
}

// ═══ SECTION 2 — Design tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'
const errorColor  = 'rgba(248,113,113,0.8)'
const successColor = 'rgba(134,239,172,0.8)'

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Hall configuration options ═══

const HALL_CONFIGS = [
  {
    value: 'free_seating',
    label: 'Free Seating',
    desc:  'Guests sit wherever they like. No table assignment needed.',
    icon:  '◇',
    needsSections: false,
  },
  {
    value: 'numbered_tables',
    label: 'Numbered Tables',
    desc:  'Standard banquet layout. Tables numbered 1 to N, guests assigned to specific tables.',
    icon:  '▣',
    needsSections: true,
  },
  {
    value: 'named_tables',
    label: 'Named Tables',
    desc:  'Tables with custom names — "The Heritage Circle", "Royal Table", etc.',
    icon:  '❖',
    needsSections: true,
  },
  {
    value: 'group_sections',
    label: 'Group Sections',
    desc:  'Guests assigned to sections (Family, Friends, Colleagues). Free seating within each section.',
    icon:  '◈',
    needsSections: true,
  },
  {
    value: 'mixed_tier_zones',
    label: 'Mixed Tier Zones',
    desc:  'Separate zones by guest tier — VVIP Zone, VIP Zone, General Zone. Free seating within zones.',
    icon:  '◎',
    needsSections: true,
  },
]

// ═══ SECTION 4 — Tooltip content ═══
//
// Each field has a plain-language explanation.
// Written from the organiser's perspective — answers
// "What is this? Why should I care? What should I choose?"

const TIPS: Record<string, string> = {
  hall_config:
    'How are seats arranged at your venue? This determines how guests are assigned '
    + 'and what the usher sees on screen when scanning a code at the door.',

  capacity:
    'The total number of guests your venue can hold. This helps the live dashboard '
    + 'show fill rate on event day and alerts you when you are approaching capacity. '
    + 'Leave blank if you do not have a fixed limit.',

  code_mode:
    'Single code means each guest receives one entry code that covers all their '
    + 'confirmed phases. Separate codes means a different code is generated for each '
    + 'phase — useful when different phases have different entry times.',

  allow_reentry:
    'When turned on, a guest can leave the venue and re-enter using the same code. '
    + 'When off, each code works once at the door — after that, the usher sees '
    + '"Already checked in" and must override manually.',

  checkin_opens_at:
    'When your ushers can start scanning codes. Any code scanned before this time '
    + 'will be rejected with a "Check-in not open yet" message on the usher screen.',

  checkin_closes_at:
    'When check-in officially ends. Scanning still works after this time, but '
    + 'the dashboard marks those arrivals as late. Leave blank for no closing time.',

  show_table_on_scan:
    'When an usher scans a guest\'s code, show the table or section assignment '
    + 'on the scan result screen. Helps ushers direct guests to the right area.',

  show_tier_on_scan:
    'Show the guest\'s tier (VVIP, VIP, General, etc.) on the usher screen when '
    + 'their code is scanned. Useful if different tiers receive different treatment '
    + 'or enter through different doors.',
}

// ═══ SECTION 5 — FieldWithTip sub-component ═══

function FieldWithTip({ label, tipKey, error, children }: {
  label:     string
  tipKey:    string
  error?:    string
  children:  React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const tip = TIPS[tipKey]

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* ── Label row with tooltip trigger ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        marginBottom: '6px',
      }}>
        <label style={{
          fontSize: '10px', color: textFaint,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {label}
        </label>
        {tip && (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={`About ${label}`}
            style={{
              width: '16px', height: '16px', borderRadius: '50%',
              background: open ? 'rgba(226,195,107,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${open ? 'rgba(226,195,107,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: open ? gold : textFaint,
              fontSize: '9px', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, lineHeight: 1,
              transition: 'all 0.15s',
            }}
          >
            i
          </button>
        )}
      </div>

      {/* ── Tooltip panel ── */}
      {open && tip && (
        <p style={{
          fontSize: '11px', color: 'rgba(226,195,107,0.6)',
          margin: '0 0 8px', lineHeight: 1.7,
          padding: '8px 12px', borderRadius: '8px',
          background: 'rgba(226,195,107,0.04)',
          border: '1px solid rgba(226,195,107,0.08)',
        }}>
          {tip}
        </p>
      )}

      {/* ── Field content ── */}
      {children}

      {/* ── Validation error ── */}
      {error && (
        <p style={{
          fontSize: '11px', color: errorColor,
          margin: '4px 0 0', lineHeight: 1.5,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ═══ SECTION 6 — Toggle sub-component ═══

function Toggle({ checked, onChange, label, tipKey }: {
  checked:  boolean
  onChange: (val: boolean) => void
  label:    string
  tipKey:   string
}) {
  const [showTip, setShowTip] = useState(false)
  const tip = TIPS[tipKey]

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        {/* Toggle switch */}
        <div
          onClick={() => onChange(!checked)}
          role="switch"
          aria-checked={checked}
          style={{
            width: '36px', height: '20px', borderRadius: '10px',
            background: checked ? 'rgba(226,195,107,0.7)' : 'rgba(255,255,255,0.1)',
            position: 'relative', flexShrink: 0,
            transition: 'background 0.2s', cursor: 'pointer',
          }}
        >
          <div style={{
            position: 'absolute', top: '2px',
            left: checked ? '18px' : '2px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
          }} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: '12px', color: textFaint, flex: 1,
          cursor: 'pointer',
        }} onClick={() => onChange(!checked)}>
          {label}
        </span>

        {/* Tip trigger */}
        {tip && (
          <button
            type="button"
            onClick={() => setShowTip(o => !o)}
            aria-label={`About ${label}`}
            style={{
              width: '16px', height: '16px', borderRadius: '50%',
              background: showTip ? 'rgba(226,195,107,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${showTip ? 'rgba(226,195,107,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: showTip ? gold : textFaint,
              fontSize: '9px', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, lineHeight: 1, flexShrink: 0,
            }}
          >
            i
          </button>
        )}
      </div>

      {/* Tip panel */}
      {showTip && tip && (
        <p style={{
          fontSize: '11px', color: 'rgba(226,195,107,0.6)',
          margin: '6px 0 0 46px', lineHeight: 1.7,
          padding: '8px 12px', borderRadius: '8px',
          background: 'rgba(226,195,107,0.04)',
          border: '1px solid rgba(226,195,107,0.08)',
        }}>
          {tip}
        </p>
      )}
    </div>
  )
}

// ═══ SECTION 7 — Main component ═══

export default function AccessCodeSetup({ capsuleId, guestCount, eventDate, onActivated }: Props) {

  // ── 7.1 State ──────────────────────────────────────────────────────────────

  const [config,      setConfig]      = useState<Config>({ ...DEFAULT_CONFIG })
  const [configExists, setConfigExists] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [noteVisible, setNoteVisible] = useState(true)

  const LS_KEY = `lc_access_config_draft_${capsuleId}`

  const update = useCallback((key: keyof Config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next })
  }, [])

  // ── 7.2 Load config: server first, then localStorage draft ─────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/access-codes/config?capsule_id=${capsuleId}`)
        const data = await res.json()

        if (data.config?.id) {
          // Server config exists — use it, ignore any localStorage draft
          setConfig(data.config)
          setConfigExists(true)
          setNoteVisible(!data.config.guidance_note_shown)
          localStorage.removeItem(LS_KEY)    // clear stale draft
        } else {
          // No server config — check for a localStorage draft
          const draft = localStorage.getItem(LS_KEY)
          if (draft) {
            try {
              const parsed = JSON.parse(draft)
              setConfig(prev => ({ ...prev, ...parsed }))
            } catch { /* corrupt draft — ignore */ }
          }
        }
      } catch {
        // Offline or API error — try localStorage
        const draft = localStorage.getItem(LS_KEY)
        if (draft) {
          try { setConfig(prev => ({ ...prev, ...JSON.parse(draft) })) } catch {}
        }
      }
      setLoading(false)
    }

    load()
  }, [capsuleId, LS_KEY])

  // ── 7.3 Smart defaults (only for new configs) ─────────────────────────────

  useEffect(() => {
    if (loading || configExists) return

    // Suggest capacity based on current guest count
    if (config.capacity === null && guestCount > 0) {
      // Don't auto-fill — just show as placeholder hint
      // (handled in render via placeholder text)
    }
  }, [loading, configExists, guestCount, config.capacity])

  // ── 7.4 Persist draft to localStorage on every change ─────────────────────

  useEffect(() => {
    if (!loading && !configExists) {
      // Only persist drafts for NEW configs (not yet saved to server)
      localStorage.setItem(LS_KEY, JSON.stringify(config))
    }
  }, [config, loading, configExists, LS_KEY])

  // ── 7.5 Validation ────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    // Check-in window: close must be after open
    if (config.checkin_opens_at && config.checkin_closes_at) {
      if (new Date(config.checkin_opens_at) >= new Date(config.checkin_closes_at)) {
        errs.checkin = 'Check-in closing time must be after the opening time.'
      }
    }

    // Capacity vs guest count warning (soft — not blocking)
    if (config.capacity !== null && config.capacity > 0 && guestCount > config.capacity) {
      errs.capacity = `You have ${guestCount} guests but capacity is set to ${config.capacity}. Consider increasing.`
    }

    setErrors(errs)

    // Only block save on hard errors (checkin time ordering)
    return !errs.checkin
  }

  // ── 7.6 Save handler ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    setMsg('')

    try {
      const res = await fetch('/api/access-codes/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, capsule_id: capsuleId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setConfig(data.config)
      setConfigExists(true)
      localStorage.removeItem(LS_KEY)       // clear draft on successful save
      setMsg('Configuration saved successfully.')
      setTimeout(() => setMsg(''), 4000)
      onActivated()                          // unlock other tabs in the orchestrator

    } catch (e: any) {
      setErrors(prev => ({ ...prev, save: e.message }))
    }
    setSaving(false)
  }

  // ── 7.7 Guidance note dismissal ────────────────────────────────────────────

  const dismissGuidanceNote = async () => {
    setNoteVisible(false)
    // Persist dismissal to server if config exists
    if (configExists) {
      try {
        await fetch('/api/access-codes/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...config,
            capsule_id: capsuleId,
            guidance_note_shown: true,
          }),
        })
      } catch { /* non-critical — note just reappears next time */ }
    }
    update('guidance_note_shown', true)
  }

  // ═══ SECTION 8 — Render ═══

  if (loading) {
    return (
      <p style={{
        fontSize: '12px', color: textFaint,
        padding: '12px 0', textAlign: 'center',
      }}>
        Loading configuration…
      </p>
    )
  }

  const selectedHall = HALL_CONFIGS.find(h => h.value === config.hall_config)

  return (
    <div>

      {/* ── 8.1 Guidance note — access cards vs table cards ───────────────── */}

      {noteVisible && (
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          border: '1px solid rgba(248,191,113,0.25)',
          background: 'rgba(248,191,113,0.04)',
          marginBottom: '16px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{
            fontSize: '14px', flexShrink: 0, marginTop: '1px',
          }}>
            💡
          </span>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '12px', fontWeight: 600,
              color: 'rgba(248,191,113,0.9)', margin: '0 0 4px',
            }}>
              About access cards
            </p>
            <p style={{
              fontSize: '11px', color: 'rgba(248,191,113,0.7)',
              margin: 0, lineHeight: 1.7,
            }}>
              Access cards are typically collected at the entrance and
              may not be seen again by your guest. If guests need to
              submit tributes from their seats, generate table cards
              separately — they stay on the table throughout the event.
            </p>
          </div>
          <button
            onClick={dismissGuidanceNote}
            aria-label="Dismiss note"
            style={{
              background: 'none', border: 'none',
              color: 'rgba(248,191,113,0.4)', fontSize: '14px',
              cursor: 'pointer', flexShrink: 0, padding: '0 2px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── 8.2 Hall configuration selector ──────────────────────────────── */}

      <FieldWithTip label="Venue Layout" tipKey="hall_config">
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {HALL_CONFIGS.map(h => {
            const isSelected = config.hall_config === h.value

            return (
              <button
                key={h.value}
                type="button"
                onClick={() => update('hall_config', h.value)}
                style={{
                  textAlign: 'left', padding: '12px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${isSelected
                    ? 'rgba(226,195,107,0.5)'
                    : cardBorder}`,
                  background: isSelected
                    ? 'rgba(226,195,107,0.07)'
                    : cardBg,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: isSelected ? gold : textFaint,
                    width: '24px', textAlign: 'center',
                  }}>
                    {h.icon}
                  </span>
                  <div>
                    <p style={{
                      margin: 0, fontSize: '13px', fontWeight: 600,
                      color: isSelected ? gold : textPrimary,
                    }}>
                      {h.label}
                    </p>
                    <p style={{
                      margin: '2px 0 0', fontSize: '11px',
                      color: textFaint, lineHeight: 1.5,
                    }}>
                      {h.desc}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </FieldWithTip>

      {/* ── 8.3 Sections prompt (for non-free-seating configs) ────────────── */}

      {selectedHall?.needsSections && configExists && (
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          border: `1px solid ${goldFaint}`,
          background: 'rgba(226,195,107,0.03)',
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '14px' }}>📐</span>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '12px', fontWeight: 600, color: goldMuted,
              margin: '0 0 2px',
            }}>
              {selectedHall.label} selected
            </p>
            <p style={{
              fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.6,
            }}>
              Set up your {config.hall_config === 'numbered_tables' || config.hall_config === 'named_tables'
                ? 'tables'
                : config.hall_config === 'group_sections'
                ? 'sections'
                : 'zones'
              } in the section manager below. This determines where guests
              are assigned and what ushers see on scan.
            </p>
          </div>
        </div>
      )}

      {/* ── 8.4 Capacity and code mode ───────────────────────────────────── */}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', marginBottom: '0px',
      }}>
        <FieldWithTip label="Expected Capacity" tipKey="capacity" error={errors.capacity}>
          <input
            style={{
              ...inputStyle,
              borderColor: errors.capacity
                ? 'rgba(251,191,36,0.4)'
                : 'rgba(226,195,107,0.18)',
            }}
            type="number"
            min="1"
            placeholder={guestCount > 0 ? `e.g. ${guestCount}` : 'e.g. 250'}
            value={config.capacity ?? ''}
            onChange={e => update('capacity', e.target.value ? Number(e.target.value) : null)}
          />
          {!config.capacity && guestCount > 0 && (
            <p style={{
              fontSize: '10px', color: 'rgba(226,195,107,0.4)',
              margin: '4px 0 0',
            }}>
              You currently have {guestCount} guest{guestCount !== 1 ? 's' : ''} registered
            </p>
          )}
        </FieldWithTip>

        <FieldWithTip label="Code Mode" tipKey="code_mode">
          <select
            style={inputStyle}
            value={config.code_mode}
            onChange={e => update('code_mode', e.target.value)}
          >
            <option value="single">One code per guest</option>
            <option value="per_phase">Separate code per phase</option>
          </select>
        </FieldWithTip>
      </div>

      {/* ── 8.5 Check-in window ──────────────────────────────────────────── */}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', marginBottom: '0px',
      }}>
        <FieldWithTip
          label="Check-in Opens"
          tipKey="checkin_opens_at"
          error={errors.checkin}
        >
          <input
            style={{
              ...inputStyle,
              borderColor: errors.checkin
                ? 'rgba(248,113,113,0.4)'
                : 'rgba(226,195,107,0.18)',
            }}
            type="datetime-local"
            value={config.checkin_opens_at?.slice(0, 16) ?? ''}
            onChange={e => update('checkin_opens_at', e.target.value || null)}
          />
        </FieldWithTip>

        <FieldWithTip label="Check-in Closes" tipKey="checkin_closes_at">
          <input
            style={inputStyle}
            type="datetime-local"
            value={config.checkin_closes_at?.slice(0, 16) ?? ''}
            onChange={e => update('checkin_closes_at', e.target.value || null)}
          />
        </FieldWithTip>
      </div>

      {/* ── 8.6 Toggle options ───────────────────────────────────────────── */}

      <div style={{ marginBottom: '16px' }}>
        <Toggle
          checked={config.allow_reentry}
          onChange={v => update('allow_reentry', v)}
          label="Allow re-entry (multi-use codes)"
          tipKey="allow_reentry"
        />
        <Toggle
          checked={config.show_table_on_scan}
          onChange={v => update('show_table_on_scan', v)}
          label="Show table or section on usher scan"
          tipKey="show_table_on_scan"
        />
        <Toggle
          checked={config.show_tier_on_scan}
          onChange={v => update('show_tier_on_scan', v)}
          label="Show guest tier on usher scan"
          tipKey="show_tier_on_scan"
        />
      </div>

      {/* ── 8.7 Status messages ──────────────────────────────────────────── */}

      {msg && (
        <p style={{
          fontSize: '12px', color: successColor,
          marginBottom: '10px', lineHeight: 1.5,
        }}>
          {msg}
        </p>
      )}

      {errors.save && (
        <p style={{
          fontSize: '12px', color: errorColor,
          marginBottom: '10px', lineHeight: 1.5,
        }}>
          {errors.save}
        </p>
      )}

      {/* ── 8.8 Draft indicator ──────────────────────────────────────────── */}

      {!configExists && !loading && (
        <p style={{
          fontSize: '10px', color: 'rgba(226,195,107,0.35)',
          marginBottom: '8px', fontStyle: 'italic',
        }}>
          Draft saved locally — save to activate
        </p>
      )}

      {/* ── 8.9 Save button ──────────────────────────────────────────────── */}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '12px',
          borderRadius: '10px', border: 'none',
          background: saving
            ? 'rgba(255,255,255,0.06)'
            : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
          color: saving ? textFaint : '#1a0845',
          fontSize: '13px', fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          letterSpacing: '0.04em',
          transition: 'opacity 0.2s',
        }}
      >
        {saving
          ? 'Saving…'
          : configExists
          ? 'Update Configuration'
          : 'Save Configuration'}
      </button>
    </div>
  )
}
