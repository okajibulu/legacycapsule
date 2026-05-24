'use client'
/* =========================================================
   components/HeroPositionPicker.tsx
   Shows after hero photo upload.
   Five position options — sets CSS object-position.
   Saves to capsules.hero_image_position via Supabase.
========================================================= */
import { useState } from 'react'

interface HeroPositionPickerProps {
  capsuleId: string
  imageUrl: string
  currentPosition: string
  onPositionChange: (pos: string) => void
  t: { accentPrimary: string; accentFaint: string; accentMuted: string; cardBg: string; cardBorder: string; textMuted: string; textFaint: string }
}

const POSITIONS = [
  { value: 'top',    label: 'Top',    icon: '↑' },
  { value: 'center', label: 'Centre', icon: '◎' },
  { value: 'bottom', label: 'Bottom', icon: '↓' },
  { value: '25% 50%', label: 'Left',  icon: '←' },
  { value: '75% 50%', label: 'Right', icon: '→' },
]

export default function HeroPositionPicker({ capsuleId, imageUrl, currentPosition, onPositionChange, t }: HeroPositionPickerProps) {
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(currentPosition || 'center')

  const handleSelect = async (pos: string) => {
    setSelected(pos)
    setSaving(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await supabase.from('capsules').update({ hero_image_position: pos }).eq('id', capsuleId)
      onPositionChange(pos)
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  return (
    <div style={{ marginTop: '10px', padding: '14px', borderRadius: '12px', background: t.cardBg, border: `1px solid ${t.accentFaint}` }}>
      <p style={{ fontSize: '11px', color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 700 }}>
        Photo Position
      </p>

      {/* Preview */}
      <div style={{ height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', border: `1px solid ${t.cardBorder}` }}>
        <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: selected, transition: 'object-position 0.3s ease' }} />
      </div>

      {/* Position buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {POSITIONS.map(pos => (
          <button
            key={pos.value}
            onClick={() => handleSelect(pos.value)}
            disabled={saving}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px',
              border: `1px solid ${selected === pos.value ? t.accentPrimary : t.accentFaint}`,
              background: selected === pos.value ? t.accentFaint : 'transparent',
              color: selected === pos.value ? t.accentPrimary : t.textFaint,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px', transition: 'all 0.15s',
              fontWeight: selected === pos.value ? 700 : 400,
            }}
          >
            <span style={{ fontSize: '14px' }}>{pos.icon}</span>
            <span>{pos.label}</span>
          </button>
        ))}
      </div>
      {saving && <p style={{ fontSize: '10px', color: t.accentMuted, marginTop: '6px', textAlign: 'center' }}>Saving…</p>}
    </div>
  )
}
