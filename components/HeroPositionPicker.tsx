'use client'
/* =========================================================
   components/HeroPositionPicker.tsx
   Zoom slider + vertical position for hero photo.
   Saves to capsules.hero_image_position and hero_image_zoom.
========================================================= */
import { useState } from 'react'

interface Props {
  capsuleId: string
  imageUrl: string
  currentPosition: string
  currentZoom?: number
  onPositionChange: (pos: string, zoom: number) => void
  onDone: () => void
  t: {
    accentPrimary: string; accentFaint: string; accentMuted: string
    cardBg: string; cardBorder: string; textMuted: string; textFaint: string
    inputBg: string; inputBorder: string
  }
}

const VALIGN = [
  { value: 'top',    label: 'Top'    },
  { value: 'center', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
]

export default function HeroPositionPicker({
  capsuleId, imageUrl, currentPosition, currentZoom = 100,
  onPositionChange, onDone, t,
}: Props) {
  const [position, setPosition] = useState(currentPosition || 'center')
  const [zoom, setZoom] = useState(currentZoom || 100)
  const [saving, setSaving] = useState(false)

  // Compute CSS for preview — zoom via transform scale
  const previewStyle = {
    width: '100%', height: '100%',
    objectFit: 'cover' as const,
    objectPosition: position,
    transform: `scale(${zoom / 100})`,
    transformOrigin: position === 'top' ? 'top center' : position === 'bottom' ? 'bottom center' : 'center',
    transition: 'all 0.2s ease',
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.from('capsules')
        .update({ hero_image_position: position, hero_image_zoom: zoom })
        .eq('id', capsuleId)
      onPositionChange(position, zoom)
      onDone()
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  return (
    <div style={{
      borderRadius: '14px', padding: '14px 16px',
      background: t.cardBg, border: `1px solid ${t.accentFaint}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Adjust Photo
        </p>
        <button onClick={onDone} style={{ fontSize: '18px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

      {/* Live preview */}
      <div style={{ height: '100px', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px', border: `1px solid ${t.accentFaint}`, background: '#000' }}>
        <img src={imageUrl} alt="Preview" style={previewStyle} />
      </div>

      {/* Zoom slider */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Zoom</label>
          <span style={{ fontSize: '11px', color: t.accentMuted, fontWeight: 600 }}>{zoom}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: t.textFaint }}>−</span>
          <input
            type="range" min={80} max={150} step={5} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: t.accentPrimary, cursor: 'pointer' }}
          />
          <span style={{ fontSize: '11px', color: t.textFaint }}>+</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '9px', color: t.textFaint }}>Show more</span>
          <span style={{ fontSize: '9px', color: t.textFaint }}>Zoom in</span>
        </div>
      </div>

      {/* Vertical position */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Vertical Focus</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {VALIGN.map(v => (
            <button key={v.value} onClick={() => setPosition(v.value)} style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '12px',
              border: `1px solid ${position === v.value ? t.accentPrimary : t.accentFaint}`,
              background: position === v.value ? t.accentFaint : 'transparent',
              color: position === v.value ? t.accentPrimary : t.textFaint,
              cursor: 'pointer', fontWeight: position === v.value ? 700 : 400,
              transition: 'all 0.15s',
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Done button */}
      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '10px', borderRadius: '10px',
        background: saving ? 'rgba(226,195,107,0.15)' : `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`,
        color: saving ? 'rgba(226,195,107,0.4)' : '#1a0845',
        fontSize: '13px', fontWeight: 700, border: 'none',
        cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
        transition: 'all 0.2s',
      }}>
        {saving ? 'Saving…' : '✓ Done — Apply Position'}
      </button>
    </div>
  )
}
