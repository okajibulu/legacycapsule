'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/ContributorGalleryManager.tsx
// PURPOSE:   Admin moderation UI for the Contributor Gallery.
//            Shows all photos in grid. Admin can:
//            - Remove inappropriate photos (soft delete)
//            - Tick photos for publication inclusion (hard cap 30)
//            - Select multiple photos and batch move to an Event Phase
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.41
// DATE:      25 August 2026
// UPDATED:   AI25 · Claude Sonnet 4.6 · 25 August 2026
//            — Batch move to phase: select mode + floating action bar
//            — Per-photo move replaced with multi-select + single batch action
//            — Progress indicator during batch move
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ═══ SECTION 1 — Types ═══

interface GalleryPhoto {
  id:                     string
  contributor_name:       string
  contributor_email:      string
  storage_path:           string
  caption:                string | null
  created_at:             string
  include_in_publication: boolean
}

interface Phase {
  id:   string
  name: string
}

interface Props {
  capsuleId:  string
  actorEmail: string
  phases?:    Phase[]
}

// ═══ SECTION 2 — Theme tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET       = 'contributor-gallery'
const PUB_LIMIT    = 30

function getPublicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

// ═══ SECTION 3 — Batch move floating bar ═══

function BatchMoveBar({ selectedIds, phases, capsuleId, actorEmail, onDone, onCancel }: {
  selectedIds: string[]
  phases:      Phase[]
  capsuleId:   string
  actorEmail:  string
  onDone:      () => void
  onCancel:    () => void
}) {
  const [moving,    setMoving]    = useState(false)
  const [progress,  setProgress]  = useState('')
  const [error,     setError]     = useState('')
  const [phaseOpen, setPhaseOpen] = useState(false)

  const handleMove = async (phaseId: string, phaseName: string) => {
    setPhaseOpen(false)
    setMoving(true)
    setError('')

    let failed = 0
    for (let i = 0; i < selectedIds.length; i++) {
      setProgress(`Moving photo ${i + 1} of ${selectedIds.length} to ${phaseName}…`)
      try {
        const res = await fetch('/api/gallery/move-to-phase', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            photo_id:    selectedIds[i],
            capsule_id:  capsuleId,
            phase_id:    phaseId,
            actor_email: actorEmail,
          }),
        })
        if (!res.ok) failed++
      } catch { failed++ }
    }

    setMoving(false)
    setProgress('')

    if (failed > 0) {
      setError(`${failed} photo${failed > 1 ? 's' : ''} could not be moved. Please try again.`)
    } else {
      onDone()
    }
  }

  return (
    <div style={{
      position:      'fixed', bottom: '72px', left: 0, right: 0, zIndex: 60,
      padding:       '0 16px',
      pointerEvents: moving ? 'none' : 'auto',
    }}>
    <div style={{
      maxWidth:   '600px', margin: '0 auto',
      borderRadius: '14px', overflow: 'visible',
      border:     '1px solid rgba(226,195,107,0.35)',
      background: 'linear-gradient(135deg, #1a0845, #120630)',
      boxShadow:  '0 -4px 32px rgba(0,0,0,0.5)',
    }}>
        {/* Progress state */}
        {moving ? (
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(226,195,107,0.2)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: goldMuted, margin: 0 }}>{progress}</p>
          </div>
        ) : (
          <div style={{ padding: '12px 14px' }}>
            {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', margin: '0 0 8px' }}>{error}</p>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Count badge */}
              <div style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(226,195,107,0.12)', border: '1px solid rgba(226,195,107,0.25)', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: gold }}>
                  {selectedIds.length} selected
                </span>
              </div>

              <p style={{ fontSize: '11px', color: textFaint, margin: 0, flex: 1 }}>
                Move all to a phase at once
              </p>

              {/* Phase selector */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setPhaseOpen(o => !o)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px',
                    background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
                    color: '#1a0845', fontSize: '12px', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Move to Phase ▾
                </button>

                {phaseOpen && (
                  <div style={{
                    position:  'absolute', bottom: 'calc(100% + 6px)', right: 0,
                    minWidth:  '180px', zIndex: 70,
                    borderRadius: '10px', overflow: 'hidden',
                    background: '#1a0845', border: '1px solid rgba(226,195,107,0.3)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  }}>
                    <p style={{ fontSize: '9px', color: goldMuted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px 4px', margin: 0 }}>
                      Select phase
                    </p>
                    {phases.map(phase => (
                      <button
                        key={phase.id}
                        onClick={() => handleMove(phase.id, phase.name)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '9px 12px', fontSize: '12px', color: textPrimary,
                          background: 'transparent', border: 'none',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(226,195,107,0.08)' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
                      >
                        {phase.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setPhaseOpen(false)}
                      style={{
                        display: 'block', width: '100%', padding: '7px 12px',
                        fontSize: '11px', color: textFaint,
                        background: 'rgba(255,255,255,0.03)',
                        border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Exit selection mode */}
              <button
                onClick={onCancel}
                style={{
                  padding: '8px 12px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: textFaint, fontSize: '11px', cursor: 'pointer', flexShrink: 0,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ SECTION 4 — Main component ═══

export default function ContributorGalleryManager({ capsuleId, actorEmail, phases = [] }: Props) {
  const [photos,        setPhotos]        = useState<GalleryPhoto[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selectedCount, setSelectedCount] = useState(0)
  const [removing,      setRemoving]      = useState<string | null>(null)
  const [toggling,      setToggling]      = useState<string | null>(null)
  const [error,         setError]         = useState('')

  // ── Batch move state ──────────────────────────────────────────────────────
  const [selectMode,    setSelectMode]    = useState(false)
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())

  // ── Fetch photos ──────────────────────────────────────────────────────────
  const fetchPhotos = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('contributor_gallery_photos')
        .select('id, contributor_name, contributor_email, storage_path, caption, created_at, include_in_publication')
        .eq('capsule_id', capsuleId)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
      const list = data ?? []
      setPhotos(list)
      setSelectedCount(list.filter(p => p.include_in_publication).length)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchPhotos() }, [capsuleId])

  // ── Exit select mode ──────────────────────────────────────────────────────
  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  // ── Toggle photo selection ────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Select all / none ─────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(photos.map(p => p.id)))
    }
  }

  // ── Remove photo ──────────────────────────────────────────────────────────
  const handleRemove = async (photoId: string) => {
    setRemoving(photoId)
    setError('')
    try {
      const res = await fetch('/api/gallery/remove', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ photo_id: photoId, capsule_id: capsuleId, actor_email: actorEmail }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to remove.')
      } else {
        setPhotos(prev => {
          const photo = prev.find(p => p.id === photoId)
          if (photo?.include_in_publication) setSelectedCount(c => c - 1)
          return prev.filter(p => p.id !== photoId)
        })
      }
    } catch { setError('Something went wrong.') }
    setRemoving(null)
  }

  // ── Toggle publication ────────────────────────────────────────────────────
  const handleTogglePublication = async (photoId: string, currentValue: boolean) => {
    setToggling(photoId)
    setError('')
    try {
      const res = await fetch('/api/gallery/publication', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ photo_id: photoId, capsule_id: capsuleId, include: !currentValue }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update.')
      } else {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, include_in_publication: !currentValue } : p))
        setSelectedCount(data.selected_count ?? 0)
      }
    } catch { setError('Something went wrong.') }
    setToggling(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <p style={{ fontSize: '12px', color: textFaint }}>Loading gallery…</p>
  }

  const atLimit = selectedCount >= PUB_LIMIT

  return (
    <div style={{ paddingBottom: selectMode && selectedIds.size > 0 ? '80px' : '0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded by contributors
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Publication counter */}
          <div style={{
            padding: '4px 12px', borderRadius: '20px',
            background: atLimit ? 'rgba(248,113,113,0.08)' : 'rgba(226,195,107,0.06)',
            border: `1px solid ${atLimit ? 'rgba(248,113,113,0.25)' : 'rgba(226,195,107,0.2)'}`,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: atLimit ? 'rgba(248,113,113,0.85)' : gold }}>
              {selectedCount} / {PUB_LIMIT}
            </span>
            <span style={{ fontSize: '10px', color: textFaint, marginLeft: '6px' }}>for pub</span>
          </div>

          {/* Select mode toggle — only shown when phases exist */}
          {phases.length > 0 && photos.length > 0 && (
            <button
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              style={{
                fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '8px',
                border: `1px solid ${selectMode ? 'rgba(226,195,107,0.4)' : 'rgba(255,255,255,0.12)'}`,
                background: selectMode ? 'rgba(226,195,107,0.1)' : 'transparent',
                color: selectMode ? gold : textFaint, cursor: 'pointer',
              }}
            >
              {selectMode ? 'Cancel' : 'Select to Move'}
            </button>
          )}
        </div>
      </div>

      {/* Select all toggle — shown in select mode */}
      {selectMode && photos.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, margin: 0 }}>
            {selectedIds.size} of {photos.length} selected
          </p>
          <button
            onClick={toggleSelectAll}
            style={{ fontSize: '11px', color: goldMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
          >
            {selectedIds.size === photos.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      {/* Phase move hint — first time in select mode */}
      {selectMode && selectedIds.size === 0 && (
        <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65, marginBottom: '10px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(226,195,107,0.04)', borderLeft: '2px solid rgba(226,195,107,0.2)' }}>
          Tap photos to select them, then choose which phase to move them to.
        </p>
      )}

      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', marginBottom: '10px' }}>{error}</p>}

      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p style={{ fontSize: '12px', color: textFaint, fontStyle: 'italic' }}>
            No contributor photos yet. They will appear here as visitors upload them.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
          {photos.map(photo => {
            const isSelected     = photo.include_in_publication
            const isDisabled     = !isSelected && atLimit
            const isTogglingThis = toggling === photo.id
            const isRemovingThis = removing === photo.id
            const isBatchSelected = selectedIds.has(photo.id)

            return (
              <div
                key={photo.id}
                onClick={() => selectMode ? toggleSelect(photo.id) : undefined}
                style={{
                  borderRadius: '10px', overflow: 'hidden',
                  border: `1px solid ${
                    isBatchSelected
                      ? 'rgba(226,195,107,0.6)'
                      : isSelected
                        ? 'rgba(74,222,128,0.3)'
                        : cardBorder
                  }`,
                  background: isBatchSelected
                    ? 'rgba(226,195,107,0.08)'
                    : isSelected
                      ? 'rgba(74,222,128,0.04)'
                      : cardBg,
                  opacity: isRemovingThis ? 0.4 : 1,
                  transition: 'all 0.2s',
                  cursor: selectMode ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                {/* Batch selection indicator */}
                {selectMode && (
                  <div style={{
                    position: 'absolute', top: '6px', left: '6px', zIndex: 10,
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: isBatchSelected ? gold : 'rgba(0,0,0,0.6)',
                    border: `2px solid ${isBatchSelected ? gold : 'rgba(255,255,255,0.4)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: '#1a0845',
                    pointerEvents: 'none',
                  }}>
                    {isBatchSelected && '✓'}
                  </div>
                )}

                {/* Photo */}
                <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#0a0218', position: 'relative' }}>
                  <img
                    src={getPublicUrl(photo.storage_path)}
                    alt={photo.caption || photo.contributor_name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Publication checkbox — hidden in select mode */}
                  {!selectMode && (
                    <button
                      onClick={() => handleTogglePublication(photo.id, isSelected)}
                      disabled={isDisabled || isTogglingThis}
                      title={isDisabled
                        ? `Publication limit reached (${PUB_LIMIT}). Untick one to select another.`
                        : isSelected ? 'Remove from publication' : 'Add to publication'}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: isSelected ? 'rgba(74,222,128,0.85)' : 'rgba(0,0,0,0.6)',
                        border: `1px solid ${isSelected ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.2)'}`,
                        color: isSelected ? '#0a0218' : 'rgba(255,255,255,0.5)',
                        fontSize: '13px', fontWeight: 700,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: isDisabled ? 0.35 : 1,
                      }}
                    >
                      {isTogglingThis ? '…' : isSelected ? '✓' : ''}
                    </button>
                  )}
                </div>

                {/* Info + remove — hidden in select mode */}
                {!selectMode && (
                  <div style={{ padding: '6px 8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: textPrimary, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photo.contributor_name}
                    </p>
                    <button
                      onClick={() => handleRemove(photo.id)}
                      disabled={isRemovingThis}
                      style={{
                        width: '100%', fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                        border: '1px solid rgba(248,113,113,0.2)', background: 'transparent',
                        color: 'rgba(248,113,113,0.6)', cursor: 'pointer',
                      }}
                    >
                      {isRemovingThis ? '…' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Batch move floating bar — appears when photos selected in select mode */}
      {selectMode && selectedIds.size > 0 && phases.length > 0 && (
        <BatchMoveBar
          selectedIds={Array.from(selectedIds)}
          phases={phases}
          capsuleId={capsuleId}
          actorEmail={actorEmail}
          onDone={() => { exitSelectMode(); fetchPhotos() }}
          onCancel={exitSelectMode}
        />
      )}
    </div>
  )
}
