'use client'
/* =========================================================
   components/HeroPositionPicker.tsx — v6
   Full image control panel:
   - Fit Width / Fit Height / Custom (with drag + zoom)
   - Height presets: Compact / Standard / Cinematic
   - Full Bleed toggle: removes margin + border radius
========================================================= */
import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  capsuleId: string
  imageUrl: string
  currentPosition: string
  currentZoom?: number
  currentFit?: string
  currentSize?: string
  currentBleed?: boolean
  onSettingsChange: (settings: {
    pos: string; zoom: number; fit: string
    size: string; bleed: boolean
  }) => void
  onDone: () => void
  t: {
    accentPrimary: string; accentFaint: string; accentMuted: string
    cardBg: string; cardBorder: string; textMuted: string; textFaint: string
    inputBg: string; inputBorder: string
  }
}

type FitMode = 'width' | 'height' | 'custom'
type SizeMode = 'compact' | 'standard' | 'cinematic'

const SIZE_OPTIONS: { id: SizeMode; label: string; height: string }[] = [
  { id: 'compact',   label: 'Compact',   height: '180px' },
  { id: 'standard',  label: 'Standard',  height: '260px' },
  { id: 'cinematic', label: 'Cinematic', height: '380px' },
]

export default function HeroPositionPicker({
  capsuleId, imageUrl, currentPosition, currentZoom = 150,
  currentFit = 'height', currentSize = 'standard', currentBleed = false,
  onSettingsChange, onDone, t,
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
  const [size, setSize] = useState<SizeMode>((currentSize as SizeMode) || 'standard')
  const [bleed, setBleed] = useState(currentBleed || false)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
  const parsed = parsePos(currentPosition)

  setPosX(parsed.x)
  setPosY(parsed.y)

  setFitMode((currentFit as FitMode) || 'height')
  setZoom(currentZoom || 150)
  setSize((currentSize as SizeMode) || 'standard')
  setBleed(currentBleed || false)
}, [
  currentPosition,
  currentZoom,
  currentFit,
  currentSize,
  currentBleed,
])
  const containerRef = useRef<HTMLDivElement>(null)
  const startDrag = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)

  const bgSize = fitMode === 'width' ? '100% auto' : fitMode === 'height' ? 'auto 100%' : `${zoom}%`
  const positionString = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`

  const handleFitChange = (mode: FitMode) => {
    setFitMode(mode); setPosX(50); setPosY(50)
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
    const newX = fitMode === 'width' ? startDrag.current.posX : Math.max(0, Math.min(100, startDrag.current.posX + dx))
    const newY = fitMode === 'height' ? startDrag.current.posY : Math.max(0, Math.min(100, startDrag.current.posY + dy))
    setPosX(newX); setPosY(newY)
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
        hero_panel_size: size,
        hero_full_bleed: bleed,
      }).eq('id', capsuleId)
      onSettingsChange({ pos: positionString, zoom, fit: fitMode, size, bleed })
      onDone()
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '7px 4px', borderRadius: '8px', fontSize: '11px',
    fontWeight: active ? 700 : 400,
    border: `1px solid ${active ? t.accentPrimary : t.accentFaint}`,
    background: active ? t.accentFaint : 'transparent',
    color: active ? t.accentPrimary : t.textFaint,
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' as const,
  })

  const dragHint = fitMode === 'width' ? '↕ Drag up/down'
    : fitMode === 'height' ? '↔ Drag left/right'
    : '✥ Drag to reposition'

  return (
    <div style={{ borderRadius: '14px', padding: '14px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}` }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Photo Settings</p>
        <button onClick={onDone} style={{ fontSize: '20px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

      {/* ── SECTION 1: Display Mode ── */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>Display Mode</p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
          <button onClick={() => handleFitChange('width')} style={btnStyle(fitMode === 'width')}>Fit Width</button>
          <button onClick={() => handleFitChange('height')} style={btnStyle(fitMode === 'height')}>Fit Height</button>
          <button onClick={() => handleFitChange('custom')} style={btnStyle(fitMode === 'custom')}>Custom</button>
        </div>
        <p style={{ fontSize: '10px', color: t.textFaint, fontStyle: 'italic' }}>
          {fitMode === 'width' ? 'Fills width — drag up/down · landscape photos'
            : fitMode === 'height' ? 'Fills height — drag left/right · portrait photos'
            : 'Full control — drag any direction + zoom'}
        </p>
      </div>

      {/* ── SECTION 2: Drag preview ── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          height: '130px', borderRadius: '10px', overflow: 'hidden',
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
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', padding: '3px 9px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', fontSize: '10px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{dragHint}</div>
        )}
      </div>

      {/* ── SECTION 3: Zoom (custom only) ── */}
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
        </div>
      )}

      {/* ── SECTION 4: Panel Height ── */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '10px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>Panel Height</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SIZE_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSize(opt.id)} style={btnStyle(size === opt.id)}>{opt.label}</button>
          ))}
        </div>
        <p style={{ fontSize: '10px', color: t.textFaint, marginTop: '5px', fontStyle: 'italic' }}>
          {size === 'compact' ? 'Leaves more room for tributes'
            : size === 'standard' ? 'Balanced — photo + tributes'
            : 'Full dramatic backdrop — cinematic feel'}
        </p>
      </div>

      {/* ── SECTION 5: Full Bleed ── */}
      <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.accentFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: bleed ? t.accentPrimary : t.textFaint, marginBottom: '2px' }}>Full Bleed</p>
          <p style={{ fontSize: '10px', color: t.textFaint, fontStyle: 'italic' }}>Photo extends edge-to-edge — cinematic editorial look</p>
        </div>
        <button onClick={() => setBleed(b => !b)} style={{
          width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
          background: bleed ? `rgba(226,195,107,0.7)` : 'rgba(255,255,255,0.1)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
        }}>
          <div style={{ position: 'absolute', top: '3px', left: bleed ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
        </button>
      </div>

      {/* ── Reset + Apply ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => { handleFitChange('height'); setSize('standard'); setBleed(false); setZoom(150) }} style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '12px', border: `1px solid ${t.accentFaint}`, background: 'transparent', color: t.textFaint, cursor: 'pointer' }}>Reset</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', borderRadius: '10px', background: saving ? 'rgba(226,195,107,0.15)' : `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`, color: saving ? 'rgba(226,195,107,0.4)' : '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.04em' }}>
          {saving ? 'Saving…' : '✓ Apply'}
        </button>
      </div>
    </div>
  )
}
