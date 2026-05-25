'use client'
/* =========================================================
   components/HeroPositionPicker.tsx — v5
   Full drag in all modes.
   Fit Width: drag vertically. Fit Height: drag horizontally.
   Custom: drag in both axes + zoom slider.
   Default: Fit Height, centred.
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

  // Background size based on mode
  const bgSize = fitMode === 'width' ? '100% auto'
    : fitMode === 'height' ? 'auto 100%'
    : `${zoom}%`

  const positionString = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`

  // When switching fit mode, reset to sensible defaults
  const handleFitChange = (mode: FitMode) => {
    setFitMode(mode)
    if (mode === 'width') { setPosX(50); setPosY(50) }   // centre both
    if (mode === 'height') { setPosX(50); setPosY(50) }  // centre both
    if (mode === 'custom') { setPosX(50); setPosY(50) }  // centre both
  }

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startDrag.current = { mouseX: clientX, mouseY: clientY, posX, posY }
    setDragging(true)
  }, [posX, posY])

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!startDrag.current || !containerRef.current) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = containerRef.current.getBoundingClientRect()

    const dx = ((startDrag.current.mouseX - clientX) / rect.width) * 80
    const dy = ((startDrag.current.mouseY - clientY) / rect.height) * 80

    // In Fit Width — only vertical drag is meaningful
    // In Fit Height — only horizontal drag is meaningful  
    // In Custom — both axes
    const newX = fitMode === 'width'
      ? startDrag.current.posX  // locked
      : Math.max(0, Math.min(100, startDrag.current.posX + dx))

    const newY = fitMode === 'height'
      ? startDrag.current.posY  // locked
      : Math.max(0, Math.min(100, startDrag.current.posY + dy))

    setPosX(newX)
    setPosY(newY)
  }, [fitMode])

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
    flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px',
    fontWeight: active ? 700 : 400,
    border: `1px solid ${active ? t.accentPrimary : t.accentFaint}`,
    background: active ? t.accentFaint : 'transparent',
    color: active ? t.accentPrimary : t.textFaint,
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' as const,
  })

  const dragHint = fitMode === 'width' ? '↕ Drag to move up/down'
    : fitMode === 'height' ? '↔ Drag to move left/right'
    : '✥ Drag to reposition'

  return (
    <div style={{ borderRadius: '14px', padding: '14px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}` }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Adjust Photo</p>
        <button onClick={onDone} style={{ fontSize: '20px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

      {/* Fit mode */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Display Mode</p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          <button onClick={() => handleFitChange('width')} style={btnStyle(fitMode === 'width')}>Fit Width</button>
          <button onClick={() => handleFitChange('height')} style={btnStyle(fitMode === 'height')}>Fit Height</button>
          <button onClick={() => handleFitChange('custom')} style={btnStyle(fitMode === 'custom')}>Custom</button>
        </div>
        <p style={{ fontSize: '10px', color: t.textFaint, fontStyle: 'italic' }}>
          {fitMode === 'width' ? 'Fills width — drag to move up/down · best for landscape photos'
            : fitMode === 'height' ? 'Fills height — drag to move left/right · best for portrait photos'
            : 'Full control — drag in any direction, use zoom slider'}
        </p>
      </div>

      {/* Drag preview */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          height: '160px', borderRadius: '10px', overflow: 'hidden',
          marginBottom: '14px', border: `1px solid ${t.accentFaint}`,
          cursor: dragging ? 'grabbing' : 'grab',
          position: 'relative', userSelect: 'none',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: bgSize,
          backgroundPosition: positionString,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000',
          transition: dragging ? 'none' : 'background-position 0.1s ease, background-size 0.25s ease',
        }}
      >
        {!dragging && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            padding: '4px 10px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', fontSize: '10px', color: 'rgba(255,255,255,0.75)',
            whiteSpace: 'nowrap', pointerEvents: 'none', letterSpacing: '0.04em',
          }}>{dragHint}</div>
        )}
      </div>

      {/* Zoom — custom mode only */}
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
            <span style={{ fontSize: '9px', color: t.textFaint }}>Show full photo</span>
            <span style={{ fontSize: '9px', color: t.textFaint }}>Close up</span>
          </div>
        </div>
      )}

      {/* Reset + Apply */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => { handleFitChange(fitMode) }} style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '12px', border: `1px solid ${t.accentFaint}`, background: 'transparent', color: t.textFaint, cursor: 'pointer' }}>Reset</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', borderRadius: '10px', background: saving ? 'rgba(226,195,107,0.15)' : `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`, color: saving ? 'rgba(226,195,107,0.4)' : '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.04em' }}>
          {saving ? 'Saving…' : '✓ Apply'}
        </button>
      </div>
    </div>
  )
}
