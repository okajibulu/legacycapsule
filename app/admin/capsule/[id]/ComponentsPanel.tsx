'use client'
/* =========================================================
   app/admin/capsule/[id]/ComponentsPanel.tsx
   Toggle premium components on/off per capsule
   Updates capsules.components array in Supabase
========================================================= */
import { useState } from 'react'

const COMPONENTS = [
  { id: 'audio_tributes',    label: 'Voice Tributes',      desc: 'Contributors can record audio messages up to 2 minutes' },
  { id: 'video_tributes',    label: 'Video Tributes',       desc: 'Contributors can upload short video messages' },
  { id: 'ways_to_honour',   label: 'Ways to Honour',       desc: 'Bank transfer details and acknowledgement flow on profile page' },
  { id: 'family_rep_portal', label: 'Family Rep Portal',   desc: 'Token-gated private portal for family representative' },
  { id: 'extended_validity', label: 'Extended Validity',   desc: 'Capsule validity beyond the standard 90-day free window' },
  { id: 'publication',      label: 'Digital Publication',  desc: 'PDF keepsake publication compiled from all tributes' },
  { id: 'community_stories', label: 'Community Stories',  desc: 'Dedicated Stories room where contributors share memories organised by topic' },
  { id: 'guest_management',  label: 'Guest Management',   desc: 'Guest list, access codes, RSVP tracking, check-in and table seating' },
]

const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'
const textSecondary = 'rgba(255,255,255,0.55)'
const cardBg = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(226,195,107,0.1)'

export default function ComponentsPanel({ capsuleId, components }: {
  capsuleId: string
  components: string[]
}) {
  const [active, setActive] = useState<string[]>(components)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  const toggle = async (componentId: string) => {
    const isOn = active.includes(componentId)
    const updated = isOn
      ? active.filter(c => c !== componentId)
      : [...active, componentId]

    setSaving(componentId); setError('')

    try {
      const res = await fetch(`/api/admin/capsule/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId, components: updated }),
      })
      if (!res.ok) throw new Error('Failed')
      setActive(updated)
      setSaved(componentId)
      setTimeout(() => setSaved(null), 2000)
    } catch {
      setError(`Failed to update ${componentId}`)
    }
    setSaving(null)
  }

  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Premium Components</p>
          <p style={{ fontSize: '11px', color: textFaint, marginTop: '2px' }}>Toggle to activate or deactivate for this capsule</p>
        </div>
      </div>

      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {COMPONENTS.map(comp => {
          const isOn = active.includes(comp.id)
          const isSaving = saving === comp.id
          const justSaved = saved === comp.id

          return (
            <div
              key={comp.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '8px',
                background: isOn ? 'rgba(226,195,107,0.05)' : 'transparent',
                border: `1px solid ${isOn ? 'rgba(226,195,107,0.15)' : 'rgba(255,255,255,0.04)'}`,
                transition: 'all 0.2s',
              }}
            >
              {/* Toggle switch */}
              <button
                onClick={() => toggle(comp.id)}
                disabled={isSaving}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px', border: 'none',
                  background: isOn ? gold : 'rgba(255,255,255,0.12)',
                  cursor: isSaving ? 'wait' : 'pointer', flexShrink: 0,
                  position: 'relative', transition: 'background 0.2s',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: isOn ? '21px' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </button>

              {/* Label + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: isOn ? 600 : 400, color: isOn ? textPrimary : textSecondary }}>
                    {comp.label}
                  </span>
                  {justSaved && <span style={{ fontSize: '10px', color: 'rgba(134,239,172,0.8)' }}>✓ Saved</span>}
                  {isSaving && <span style={{ fontSize: '10px', color: textFaint }}>Saving…</span>}
                </div>
                <p style={{ fontSize: '11px', color: textFaint, margin: '1px 0 0', lineHeight: 1.5 }}>{comp.desc}</p>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: '9px', padding: '2px 8px', borderRadius: '8px', flexShrink: 0,
                background: isOn ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isOn ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
                color: isOn ? 'rgba(134,239,172,0.85)' : textFaint,
                fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              }}>
                {isOn ? 'Active' : 'Off'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
