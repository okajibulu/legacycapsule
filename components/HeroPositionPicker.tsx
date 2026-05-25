'use client'
/* =========================================================
   components/HeroPositionPicker.tsx — v4
   Fit Width / Fit Height presets + custom pan+zoom.
   Default: Fit Height (best for portrait photos).
========================================================= */
import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  capsuleId: string
  imageUrl: string
  currentPosition: string
  currentZoom?: number
  currentFit?: string
  onPositionChange: (pos: string, zoom: number, fit: string) => void
  onDone: () => void
  t: {
    accentPrimary: string; accentFaint: string; accentMuted: string
    cardBg: string; cardBorder: string; textMuted: string; textFaint: string
    inputBg: string; inputBorder: string
  }
}

type FitMode = 'width' | 'height' | 'custom'

const FIT_OPTIONS: { id: FitMode; label: string; desc: string; size: string }[] = [
  { id: 'width',  label: 'Fit Width',  desc: 'Best for landscape / group photos', size: '100% auto' },
  { id: 'height', label: 'Fit Height', desc: 'Best for portrait / face photos',   size: 'auto 100%' },
  { id: 'custom', label: 'Custom',     desc: 'Zoom and drag to position',          size: ''          },
]

export default function HeroPositionPicker({
  capsuleId, imageUrl, currentPosition, currentZoom = 150,
  currentFit = 'height', onPositionChange, onDone, t,
}: Props) {
  const parsePos = (pos: string) => {
    const parts = pos?.split(' ')
    if (parts?.length === 2) {
      const x = parseFloat(parts[0]); const y = parseFloat(parts[1])
      if (!isNaN(x) && !isNaN(y)) return { x, y }
    }
    return { x: 50, y: 50 }
  }

  const initial = parsePos(currentPosition)
  const [fitMode, setFitMode] = useState<FitMode>((currentFit as FitMode) || 'height')
  const [posX, setPosX] = useState(initial.x)
  const [posY, setPosY] = useState(initial.y)
  const [zoom, setZoom] = useState(currentZoom || 150)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startDrag = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)

  // Compute background-size from fit mode
  const bgSize = fitMode === 'width' ? '100% auto'
    : fitMode === 'height' ? 'auto 100%'
    : `${zoom}%`

  const positionString = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (fitMode !== 'custom') return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startDrag.current = { mouseX: clientX, mouseY: clientY, posX, posY }
    setDragging(true)
  }, [posX, posY, fitMode])

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!startDrag.current || !containerRef.current) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((startDrag.current.mouseX - clientX) / rect.width) * 100
    const dy = ((startDrag.current.mouseY - clientY) / rect.height) * 100
    const sensitivity = zoom / 100
    setPosX(prev => Math.max(0, Math.min(100, startDrag.current!.posX + dx * sensitivity)))
    setPosY(prev => Math.max(0, Math.min(100, startDrag.current!.posY + dy * sensitivity)))
  }, [zoom])

  const handleUp = useCallback(() => { startDrag.current = null; setDragging(false) }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      window.addEventListener('touchmove', handleMove, { passive: false })
      window.addEventListener('touchend', handleUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [dragging, handleMove, handleUp])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await supabase.from('capsules').update({
        hero_image_position: positionString,
        hero_image_zoom: zoom,
        hero_image_fit: fitMode,
      }).eq('id', capsuleId)
      onPositionChange(positionString, zoom, fitMode)
      onDone()
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: active ? 700 : 400,
    border: `1px solid ${active ? t.accentPrimary : t.accentFaint}`,
    background: active ? t.accentFaint : 'transparent',
    color: active ? t.accentPrimary : t.textFaint,
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' as const,
  })

  return (
    <div style={{ borderRadius: '14px', padding: '14px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Adjust Photo</p>
        <button onClick={onDone} style={{ fontSize: '20px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

      {/* Fit mode selector */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Display Mode</p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          {FIT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setFitMode(opt.id)} style={btnStyle(fitMode === opt.id)}>
              {opt.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '10px', color: t.textFaint, fontStyle: 'italic' }}>
          {FIT_OPTIONS.find(o => o.id === fitMode)?.desc}
        </p>
      </div>

      {/* Live preview */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          height: '160px', borderRadius: '10px', overflow: 'hidden',
          marginBottom: '14px', border: `1px solid ${t.accentFaint}`,
          cursor: fitMode === 'custom' ? (dragging ? 'grabbing' : 'grab') : 'default',
          position: 'relative', userSelect: 'none',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: bgSize,
          backgroundPosition: positionString,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000',
          transition: dragging ? 'none' : 'background-position 0.1s ease, background-size 0.2s ease',
        }}
      >
        {fitMode === 'custom' && !dragging && (
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', padding: '4px 10px', borderRadius: '10px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', fontSize: '10px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', pointerEvents: 'none', letterSpacing: '0.04em' }}>
            ✥ Drag to reposition
          </div>
        )}
      </div>

      {/* Custom zoom — only shown in custom mode */}
      {fitMode === 'custom' && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Zoom</label>
            <span style={{ fontSize: '11px', color: t.accentMuted, fontWeight: 600 }}>{zoom}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: t.textFaint }}>−</span>
            <input type="range" min={100} max={300} step={5} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1, accentColor: t.accentPrimary, cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', color: t.textFaint }}>+</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '9px', color: t.textFaint }}>Full photo</span>
            <span style={{ fontSize: '9px', color: t.textFaint }}>Close up</span>
          </div>
        </div>
      )}

      {/* Pan buttons for fit modes — simple nudge when not in custom */}
      {fitMode !== 'custom' && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Vertical Focus</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ label: 'Top', y: 0 }, { label: 'Centre', y: 50 }, { label: 'Bottom', y: 100 }].map(opt => (
              <button key={opt.label} onClick={() => setPosY(opt.y)} style={btnStyle(Math.abs(posY - opt.y) < 10)}>{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Reset + Apply */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => { setFitMode('height'); setPosX(50); setPosY(50); setZoom(150) }} style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '12px', border: `1px solid ${t.accentFaint}`, background: 'transparent', color: t.textFaint, cursor: 'pointer' }}>Reset</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', borderRadius: '10px', background: saving ? 'rgba(226,195,107,0.15)' : `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`, color: saving ? 'rgba(226,195,107,0.4)' : '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.04em' }}>
          {saving ? 'Saving…' : '✓ Apply'}
        </button>
      </div>
    </div>
  )
}
