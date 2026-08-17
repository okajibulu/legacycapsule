'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/PermissionPicker.tsx
// PURPOSE:   Renders the co-admin permission list as labelled checkboxes.
//            Fetches from /api/team/platform-services (RW-Ecosystem Supabase).
//            New services added to platform_services automatically appear here
//            without any code change — the list is fully data-driven.
//            ECS: plain English labels, helpful descriptions, no jargon.
// ARCHITECTURE: CA-SPEC-001 — Step 10.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
// PROPS:
//   selected   — array of currently selected permission keys
//   onChange   — callback with updated array of keys
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint   = 'rgba(255,255,255,0.28)'

// ═══ SECTION 2 — Types ═══

interface PlatformService {
  key:          string
  display_name: string
  description:  string | null
  sort_order:   number
}

interface PermissionPickerProps {
  selected: string[]
  onChange: (keys: string[]) => void
}

// ═══ SECTION 3 — Component ═══

export default function PermissionPicker({ selected, onChange }: PermissionPickerProps) {
  const [services, setServices] = useState<PlatformService[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // ── Fetch permission list from RW-Ecosystem ─────────────────────────────
  useEffect(() => {
    fetch('/api/team/platform-services')
      .then(r => r.json())
      .then(data => {
        if (data.services) setServices(data.services)
        else setError('Could not load the permission list.')
      })
      .catch(() => setError('Could not load the permission list.'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key))
    } else {
      onChange([...selected, key])
    }
  }

  const selectAll  = () => onChange(services.map(s => s.key))
  const clearAll   = () => onChange([])

  if (loading) {
    return (
      <div style={{ padding: '16px 0' }}>
        <p style={{ fontSize: '12px', color: textFaint, fontStyle: 'italic' }}>
          Loading available permissions…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
        <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', margin: 0 }}>{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Header + bulk actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.6 }}>
          Tick the areas this person should be able to manage. They will only see what you grant them.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
          <button
            onClick={selectAll}
            style={{ fontSize: '10px', color: goldMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Select all
          </button>
          <button
            onClick={clearAll}
            style={{ fontSize: '10px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Permission list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {services.map(service => {
          const isSelected = selected.includes(service.key)
          return (
            <button
              key={service.key}
              onClick={() => toggle(service.key)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                border: `1px solid ${isSelected ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.06)'}`,
                background: isSelected ? goldFaint : cardBg,
                textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              {/* ── Checkbox ── */}
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                marginTop: '1px',
                border: `1.5px solid ${isSelected ? gold : 'rgba(255,255,255,0.2)'}`,
                background: isSelected ? gold : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#1a0845" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* ── Label + description ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px', fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? textPrimary : textSecondary,
                  margin: '0 0 2px', lineHeight: 1.4,
                }}>
                  {service.display_name}
                </p>
                {service.description && (
                  <p style={{
                    fontSize: '11px', color: textFaint,
                    margin: 0, lineHeight: 1.6,
                  }}>
                    {service.description}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Selection summary ── */}
      {selected.length > 0 && (
        <p style={{
          fontSize: '11px', color: goldMuted, marginTop: '10px',
          fontStyle: 'italic',
        }}>
          {selected.length} {selected.length === 1 ? 'area' : 'areas'} selected
        </p>
      )}
    </div>
  )
}
