'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/ContributorGalleryManager.tsx
// PURPOSE:   Admin moderation UI for the Contributor Gallery.
//            Shows all photos in grid. Admin can:
//            - Remove inappropriate photos (soft delete)
//            - Tick photos for publication inclusion (hard cap 30)
//            - Move photos to an Event Phase (Option B move — soft deletes
//              from gallery, inserts into gallery_items for the phase)
//            Displayed in the S/Profile tab of the manage dashboard.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.38
// DATE:      25 August 2026
// UPDATED:   AI25 · Claude Opus 4.6 · 25 August 2026
//            — Move to Phase capability added
//            — phases prop added
//            — MoveToPhasePanel inline selector per photo card
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

// ═══ SECTION 3 — Move to Phase panel ═══

function MoveToPhasePanel({ photo, phases, capsuleId, actorEmail, onMoved }: {
  photo:      GalleryPhoto
  phases:     Phase[]
  capsuleId:  string
  actorEmail: string
  onMoved:    () => void
}) {
  const [open,    setOpen]    = useState(false)
  const [moving,  setMoving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  if (phases.length === 0) return null

  const handleMove = async (phaseId: string, phaseName: string) => {
    setMoving(true)
    setError('')
    try {
      const res = await fetch('/api/gallery/move-to-phase', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          photo_id:    photo.id,
          capsule_id:  capsuleId,
          phase_id:    phaseId,
          actor_email: actorEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Move failed. Please try again.')
      } else {
        setSuccess(`Moved to ${phaseName}`)
        setTimeout(() => onMoved(), 1200)
      }
    } catch {
      setError('Something went wrong.')
    }
    setMoving(false)
  }

  if (success) {
    return (
      <p style={{ fontSize: '9px', color: 'rgba(134,239,172,0.8)', margin: '4px 0 0', fontWeight: 600 }}>
        checkmark {success}
      </p>
    )
  }

  return (
    <div style={{ marginTop: '4px', position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={moving}
        style={{
          fontSize: '9px', padding: '2px 8px', borderRadius: '4px',
          border: `1px solid rgba(226,195,107,0.25)`,
          background: open ? 'rgba(226,195,107,0.1)' : 'transparent',
          color: goldMuted, cursor: 'pointer', width: '100%',
          textAlign: 'left' as const,
        }}
      >
        {moving ? 'Moving...' : 'Move to Phase'}
      </button>

      {open && !moving && (
        <div style={{
          position:  'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex:    30, borderRadius: '8px',
          background: '#1a0845', border: `1px solid rgba(226,195,107,0.25)`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          <p style={{ fontSize: '9px', color: goldMuted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '6px 10px 4px', margin: 0 }}>
            Select phase
          </p>
          {phases.map(phase => (
            <button
              key={phase.id}
              onClick={() => { setOpen(false); handleMove(phase.id, phase.name) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left' as const,
                padding: '7px 10px', fontSize: '11px', color: textPrimary,
                background: 'transparent',
                border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {phase.name}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{
              display: 'block', width: '100%', padding: '6px 10px',
              fontSize: '10px', color: textFaint, background: 'rgba(255,255,255,0.03)',
              border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', margin: '3px 0 0' }}>
          {error}
        </p>
      )}
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

  // ── Fetch photos ──────────────────────────────────────────────────────
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

  // ── Remove photo ──────────────────────────────────────────────────────
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

  // ── Toggle publication ────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return <p style={{ fontSize: '12px', color: textFaint }}>Loading gallery...</p>
  }

  const atLimit = selectedCount >= PUB_LIMIT

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded by contributors
        </p>
        <div style={{
          padding: '4px 12px', borderRadius: '20px',
          background: atLimit ? 'rgba(248,113,113,0.08)' : 'rgba(226,195,107,0.06)',
          border: `1px solid ${atLimit ? 'rgba(248,113,113,0.25)' : 'rgba(226,195,107,0.2)'}`,
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: atLimit ? 'rgba(248,113,113,0.85)' : gold }}>
            {selectedCount} / {PUB_LIMIT}
          </span>
          <span style={{ fontSize: '10px', color: textFaint, marginLeft: '6px' }}>for publication</span>
        </div>
      </div>

      {/* Phase move hint */}
      {phases.length > 0 && photos.length > 0 && (
        <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65, marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(226,195,107,0.04)', borderLeft: '2px solid rgba(226,195,107,0.2)' }}>
          Use Move to Phase on any photo to send it to the correct Event Phase — removing it from the gallery and placing it where it belongs in the programme.
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

            return (
              <div key={photo.id} style={{
                borderRadius: '10px', overflow: 'hidden',
                border: `1px solid ${isSelected ? 'rgba(74,222,128,0.3)' : cardBorder}`,
                background: isSelected ? 'rgba(74,222,128,0.04)' : cardBg,
                opacity: isRemovingThis ? 0.4 : 1,
                transition: 'all 0.2s',
              }}>
                {/* Photo */}
                <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#0a0218', position: 'relative' }}>
                  <img
                    src={getPublicUrl(photo.storage_path)}
                    alt={photo.caption || photo.contributor_name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Publication checkbox */}
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
                    {isTogglingThis ? '...' : isSelected ? 'checkmark' : ''}
                  </button>
                </div>

                {/* Info + actions */}
                <div style={{ padding: '6px 8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photo.contributor_name}
                  </p>
                  {photo.caption && (
                    <p style={{ fontSize: '9px', color: textFaint, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photo.caption}
                    </p>
                  )}
                  <button
                    onClick={() => handleRemove(photo.id)}
                    disabled={isRemovingThis}
                    style={{
                      width: '100%', fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                      border: '1px solid rgba(248,113,113,0.2)', background: 'transparent',
                      color: 'rgba(248,113,113,0.6)', cursor: 'pointer',
                    }}
                  >
                    {isRemovingThis ? '...' : 'Remove'}
                  </button>

                  {/* Move to Phase */}
                  {phases.length > 0 && (
                    <MoveToPhasePanel
                      photo={photo}
                      phases={phases}
                      capsuleId={capsuleId}
                      actorEmail={actorEmail}
                      onMoved={fetchPhotos}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
