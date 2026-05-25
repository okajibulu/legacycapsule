'use client'
/* =========================================================
   components/HeroPositionPicker.tsx — v3
   Proper pan + zoom image positioning tool.
   Drag to pan. Slider to zoom.
   Saves background-position percentage + background-size.
   No canvas needed — pure CSS background manipulation.
========================================================= */
import { useState, useRef, useCallback, useEffect } from 'react'

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

export default function HeroPositionPicker({
  capsuleId, imageUrl, currentPosition, currentZoom = 150,
  onPositionChange, onDone, t,
}: Props) {
  // Parse saved position percentages or default to center
  const parsePos = (pos: string) => {
    const parts = pos?.split(' ')
    if (parts?.length === 2) {
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])
      if (!isNaN(x) && !isNaN(y)) return { x, y }
    }
    return { x: 50, y: 50 }
  }

  const initial = parsePos(currentPosition)
  const [posX, setPosX] = useState(initial.x) // 0-100%
  const [posY, setPosY] = useState(initial.y) // 0-100%
  const [zoom, setZoom] = useState(currentZoom || 150)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startDrag = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)

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

    // How much did we move as a percentage of container
    const dx = ((startDrag.current.mouseX - clientX) / rect.width) * 100
    const dy = ((startDrag.current.mouseY - clientY) / rect.height) * 100

    // Sensitivity scales with zoom — more zoomed in = more sensitive drag
    const sensitivity = zoom / 100

    const newX = Math.max(0, Math.min(100, startDrag.current.posX + dx * sensitivity))
    const newY = Math.max(0, Math.min(100, startDrag.current.posY + dy * sensitivity))
    setPosX(newX)
    setPosY(newY)
  }, [zoom])

  const handleUp = useCallback(() => {
    startDrag.current = null
    setDragging(false)
  }, [])

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

  const positionString = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`

  const handleSave = async () => {
    setSaving(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.from('capsules')
        .update({ hero_image_position: positionString, hero_image_zoom: zoom })
        .eq('id', capsuleId)
      onPositionChange(positionString, zoom)
      onDone()
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  return (
    <div style={{ borderRadius: '14px', padding: '14px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Adjust Photo
        </p>
        <button onClick={onDone} style={{ fontSize: '20px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

      {/* Drag preview */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          height: '160px',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '14px',
          border: `1px solid ${t.accentFaint}`,
          cursor: dragging ? 'grabbing' : 'grab',
          position: 'relative',
          userSelect: 'none',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${zoom}%`,
          backgroundPosition: positionString,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000',
          transition: dragging ? 'none' : 'background-position 0.1s ease',
        }}
      >
        {/* Drag hint overlay */}
        {!dragging && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 10px', borderRadius: '10px',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            fontSize: '10px', color: 'rgba(255,255,255,0.7)',
            whiteSpace: 'nowrap', pointerEvents: 'none',
            letterSpacing: '0.04em',
          }}>
            ✥ Drag to reposition
          </div>
        )}
      </div>

      {/* Zoom slider */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Zoom</label>
          <span style={{ fontSize: '11px', color: t.accentMuted, fontWeight: 600 }}>{zoom}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: t.textFaint }}>−</span>
          <input
            type="range" min={100} max={300} step={5} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: t.accentPrimary, cursor: 'pointer', height: '4px' }}
          />
          <span style={{ fontSize: '13px', color: t.textFaint }}>+</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '9px', color: t.textFaint }}>Full photo</span>
          <span style={{ fontSize: '9px', color: t.textFaint }}>Close up</span>
        </div>
      </div>

      {/* Reset + Done */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => { setPosX(50); setPosY(50); setZoom(150) }} style={{
          padding: '9px 14px', borderRadius: '10px', fontSize: '12px',
          border: `1px solid ${t.accentFaint}`, background: 'transparent',
          color: t.textFaint, cursor: 'pointer',
        }}>Reset</button>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: '9px', borderRadius: '10px',
          background: saving ? 'rgba(226,195,107,0.15)' : `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`,
          color: saving ? 'rgba(226,195,107,0.4)' : '#1a0845',
          fontSize: '13px', fontWeight: 700, border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
        }}>
          {saving ? 'Saving…' : '✓ Apply'}
        </button>
      </div>
    </div>
  )
}
