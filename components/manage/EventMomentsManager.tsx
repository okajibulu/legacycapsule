// ============================================================
// FILE PATH: components/manage/EventMomentsManager.tsx
// PURPOSE:   Organiser curation dashboard for Event Moments.
//            Per-phase photo gallery management.
//            Sections: Guest Eye View, Official Photography.
//            Actions: show/hide, feature for publication,
//            delete, select-all, bulk actions,
//            drag-and-drop reorder for official photos.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// UPDATED:   AI17 · Claude Opus 4.6 · 4 August 2026
//            AI26 · Claude Sonnet 4.6 · 26 August 2026
//            — Guest Eye View: Select All added
// VERSION:   v2.11.45
// DATE:      4 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface GalleryPhoto {
  id:                      string
  image_url:               string
  contributor_name:        string
  created_at:              string
  display_order:           number | null
  approved:                boolean
  is_official_photography: boolean
  featured_in_publication: boolean
}

interface Phase {
  id:         string
  name:       string
  event_date: string | null
  sort_order: number
}

interface EventMomentsManagerProps {
  capsuleId:   string
  capsuleSlug: string
  phases:      Phase[]
  gold:        string
  goldMuted:   string
  textPrimary: string
  textFaint:   string
  cardBg:      string
  accentFaint: string
}

// ═══ SECTION 2 — Responsive columns helper ═══
// Returns CSS grid value based on viewport width.
// 2 cols on mobile (<600px), 3 cols on desktop.

function useGridCols(): string {
  const [cols, setCols] = useState('repeat(3, 1fr)')
  useEffect(() => {
    const update = () =>
      setCols(window.innerWidth < 600 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return cols
}

// ═══ SECTION 3 — Phase tab sub-component ═══

function PhaseTab({
  phase, active, onClick, gold, goldMuted, textFaint, accentFaint,
}: {
  phase: Phase; active: boolean; onClick: () => void
  gold: string; goldMuted: string; textFaint: string; accentFaint: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      '8px 16px',
        borderRadius: '20px',
        border:       `1px solid ${active ? gold : accentFaint}`,
        background:   active ? 'rgba(226,195,107,0.1)' : 'transparent',
        color:        active ? gold : textFaint,
        fontSize:     '12px',
        fontWeight:   active ? 700 : 500,
        cursor:       'pointer',
        whiteSpace:   'nowrap',
        flexShrink:   0,
        transition:   'all 0.15s',
      }}>
      {phase.name}
    </button>
  )
}

// ═══ SECTION 4 — Managed photo card sub-component ═══

function ManagedPhotoCard({
  photo, onAction, onDelete, selected, onSelect,
  gold, textFaint, accentFaint, isMobile,
}: {
  photo:      GalleryPhoto
  onAction:   (photoId: string, action: string) => void
  onDelete:   (photoId: string) => void
  selected:   boolean
  onSelect:   (photoId: string) => void
  gold:       string
  textFaint:  string
  accentFaint: string
  isMobile:   boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [busy,   setBusy]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const act = async (action: string) => {
    if (busy) return
    setBusy(true)
    await onAction(photo.id, action)
    setBusy(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    if (busy) return
    setBusy(true)
    await onDelete(photo.id)
    setBusy(false)
    setConfirmDelete(false)
  }

  return (
    <div style={{
      borderRadius: '12px',
      border:       `2px solid ${selected
        ? 'rgba(226,195,107,0.6)'
        : photo.approved
          ? accentFaint
          : 'rgba(248,113,113,0.2)'}`,
      background:   'rgba(255,255,255,0.02)',
      position:     'relative',
    }}>
      {/* Selection checkbox */}
      <div
        onClick={() => onSelect(photo.id)}
        style={{
          position:       'absolute',
          top:            '6px',
          left:           '6px',
          zIndex:         20,
          width:          '20px',
          height:         '20px',
          borderRadius:   '4px',
          background:     selected ? 'rgba(226,195,107,0.9)' : 'rgba(0,0,0,0.5)',
          border:         `1px solid ${selected ? gold : 'rgba(255,255,255,0.3)'}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:         'pointer',
          fontSize:       '11px',
          color:          '#1a0845',
          fontWeight:     800,
        }}
      >
        {selected ? '✓' : ''}
      </div>

      {/* Image container */}
      <div style={{
        aspectRatio:  '1',
        position:     'relative',
        background:   'rgba(255,255,255,0.04)',
        borderRadius: '10px 10px 0 0',
        overflow:     'hidden',
      }}>
        {!loaded && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }} />}
        <img
          src={photo.image_url}
          alt={photo.contributor_name}
          onLoad={() => setLoaded(true)}
          style={{
            width:            '100%',
            height:           '100%',
            objectFit:        'cover',
            imageOrientation: 'from-image',
            display:          loaded ? 'block' : 'none',
          }}
        />
        {/* Badges */}
        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!photo.approved && (
            <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(248,113,113,0.85)', fontSize: '9px', fontWeight: 700, color: '#fff' }}>Hidden</span>
          )}
          {photo.featured_in_publication && (
            <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(226,195,107,0.85)', fontSize: '9px', fontWeight: 700, color: '#1a0845' }}>★</span>
          )}
          {photo.is_official_photography && (
            <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(99,102,241,0.85)', fontSize: '9px', fontWeight: 700, color: '#fff' }}>Official</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: isMobile ? '6px 8px' : '8px 10px' }}>
        {!isMobile && (
          <p style={{ margin: '0 0 6px', fontSize: '11px', color: textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {photo.is_official_photography ? 'Official Photography' : photo.contributor_name}
          </p>
        )}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {/* Hide/Show */}
          <button
            onClick={() => act(photo.approved ? 'hide' : 'show')}
            disabled={busy}
            title={photo.approved ? 'Hide' : 'Show'}
            style={{
              flex: 1, padding: isMobile ? '5px 4px' : '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${photo.approved ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
              background: 'transparent',
              color: photo.approved ? 'rgba(248,113,113,0.8)' : 'rgba(134,239,172,0.8)',
              fontSize: isMobile ? '13px' : '10px',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
              textAlign: 'center' as const,
            }}>
            {isMobile ? (photo.approved ? '👁' : '👁') : (photo.approved ? 'Hide' : 'Show')}
          </button>

          {/* Feature */}
          <button
            onClick={() => act(photo.featured_in_publication ? 'unfeature' : 'feature')}
            disabled={busy}
            title={photo.featured_in_publication ? 'Unfeature' : 'Feature'}
            style={{
              flex: 1, padding: isMobile ? '5px 4px' : '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${photo.featured_in_publication ? accentFaint : 'rgba(226,195,107,0.3)'}`,
              background: 'transparent',
              color: photo.featured_in_publication ? textFaint : gold,
              fontSize: isMobile ? '13px' : '10px',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
              textAlign: 'center' as const,
            }}>
            {isMobile ? '★' : (photo.featured_in_publication ? 'Unfeature' : '★ Feature')}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={busy}
            title={confirmDelete ? 'Tap again to confirm delete' : 'Delete'}
            style={{
              flex: 1, padding: isMobile ? '5px 4px' : '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${confirmDelete ? 'rgba(248,113,113,0.6)' : 'rgba(248,113,113,0.2)'}`,
              background: confirmDelete ? 'rgba(248,113,113,0.15)' : 'transparent',
              color: 'rgba(248,113,113,0.8)',
              fontSize: isMobile ? '13px' : '10px',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
              textAlign: 'center' as const,
              transition: 'all 0.2s',
            }}>
            {isMobile ? '🗑' : (confirmDelete ? 'Confirm?' : 'Delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 5 — Sortable official photo card ═══

function SortablePhotoCard({
  photo, onAction, onDelete, selected, onSelect,
  gold, textFaint, accentFaint, isMobile,
}: {
  photo:       GalleryPhoto
  onAction:    (photoId: string, action: string) => void
  onDelete:    (photoId: string) => void
  selected:    boolean
  onSelect:    (photoId: string) => void
  gold:        string
  textFaint:   string
  accentFaint: string
  isMobile:    boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.5 : 1,
    position:   'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position:       'absolute',
          top:            '34px',
          right:          '6px',
          zIndex:         10,
          width:          '22px',
          height:         '22px',
          borderRadius:   '5px',
          background:     'rgba(0,0,0,0.55)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:         'grab',
          fontSize:       '13px',
          color:          'rgba(255,255,255,0.7)',
          userSelect:     'none',
          touchAction:    'none',
        }}
        title="Drag to reorder"
      >
        ⠿
      </div>
      <ManagedPhotoCard
        photo={photo}
        onAction={onAction}
        onDelete={onDelete}
        selected={selected}
        onSelect={onSelect}
        gold={gold}
        textFaint={textFaint}
        accentFaint={accentFaint}
        isMobile={isMobile}
      />
    </div>
  )
}

// ═══ SECTION 6 — Photographer token panel sub-component ═══

function PhotographerTokenPanel({
  phaseId, capsuleId, phaseName, gold, goldMuted, textFaint, accentFaint,
}: {
  phaseId: string; capsuleId: string; phaseName: string
  gold: string; goldMuted: string; textFaint: string; accentFaint: string
}) {
  const [token,      setToken]      = useState<string | null>(null)
  const [portalUrl,  setPortalUrl]  = useState<string | null>(null)
  const [expiresAt,  setExpiresAt]  = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [revoking,   setRevoking]   = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true); setError(null)
    try {
      const res  = await fetch('/api/photographer/token/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ phase_id: phaseId, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (data.ok) { setToken(data.token); setPortalUrl(data.portal_url); setExpiresAt(data.expires_at) }
      else setError(data.error ?? 'Failed to generate link')
    } catch { setError('Connection error. Please try again.') }
    finally { setGenerating(false) }
  }

  const handleRevoke = async () => {
    if (!confirm('Revoke this link? The photographer will lose access immediately.')) return
    setRevoking(true); setError(null)
    try {
      const res  = await fetch('/api/photographer/token/revoke', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ phase_id: phaseId, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (data.ok) { setToken(null); setPortalUrl(null); setExpiresAt(null) }
      else setError(data.error ?? 'Failed to revoke')
    } catch { setError('Connection error. Please try again.') }
    finally { setRevoking(false) }
  }

  const handleCopy = () => {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }

  const formatExpiry = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div style={{ padding: '14px 16px', borderRadius: '12px', border: `1px solid ${accentFaint}`, background: 'rgba(255,255,255,0.02)', marginBottom: '20px' }}>
      <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: goldMuted }}>
        Official Photography Portal
      </p>
      <p style={{ margin: '0 0 14px', fontSize: '12px', color: textFaint, lineHeight: 1.5 }}>
        Generate a secure upload link for your photographer. They upload directly — no account needed.
      </p>
      {error && <p style={{ margin: '0 0 10px', fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}
      {!token ? (
        <button onClick={handleGenerate} disabled={generating} style={{
          padding: '9px 20px', borderRadius: '20px',
          background: generating ? 'rgba(255,255,255,0.04)' : 'rgba(226,195,107,0.1)',
          border: `1px solid ${generating ? accentFaint : gold}`,
          color: generating ? textFaint : gold,
          fontSize: '12px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
        }}>
          {generating ? 'Generating…' : '🔗 Generate Photographer Link'}
        </button>
      ) : (
        <div>
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.06)', border: `1px solid rgba(226,195,107,0.2)`, marginBottom: '10px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: goldMuted, letterSpacing: '0.08em' }}>PHOTOGRAPHER UPLOAD LINK</p>
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all', lineHeight: 1.5 }}>{portalUrl}</p>
            {expiresAt && <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>Expires {formatExpiry(expiresAt)}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleCopy} style={{
              padding: '8px 16px', borderRadius: '16px',
              background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(226,195,107,0.1)',
              border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(226,195,107,0.3)'}`,
              color: copied ? 'rgba(134,239,172,0.9)' : gold,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              {copied ? '✓ Copied' : '📋 Copy Link'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Official Photography Portal for ${phaseName}: ${portalUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                padding: '8px 16px', borderRadius: '16px',
                background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                color: 'rgba(134,239,172,0.85)', fontSize: '12px', fontWeight: 600,
                textDecoration: 'none', display: 'inline-block',
              }}>
              💬 Send via WhatsApp
            </a>
            <button onClick={handleRevoke} disabled={revoking} style={{
              padding: '8px 16px', borderRadius: '16px', background: 'transparent',
              border: '1px solid rgba(248,113,113,0.25)', color: 'rgba(248,113,113,0.7)',
              fontSize: '12px', fontWeight: 600,
              cursor: revoking ? 'not-allowed' : 'pointer', opacity: revoking ? 0.5 : 1,
            }}>
              {revoking ? 'Revoking…' : 'Revoke Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 7 — Section heading sub-component ═══

function SectionHeading({ label, count, hint, goldMuted, textFaint, accentFaint }: {
  label: string; count: number; hint?: string
  goldMuted: string; textFaint: string; accentFaint: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: `1px solid ${accentFaint}` }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: goldMuted }}>
        {label}
      </p>
      <span style={{ fontSize: '10px', color: textFaint }}>
        · {count} {count === 1 ? 'photo' : 'photos'}
      </span>
      {hint && (
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: textFaint, opacity: 0.6, fontStyle: 'italic' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

// ═══ SECTION 8 — Main component ═══

export default function EventMomentsManager({
  capsuleId, capsuleSlug, phases,
  gold, goldMuted, textPrimary, textFaint, cardBg, accentFaint,
}: EventMomentsManagerProps) {

  const [activePhaseId,  setActivePhaseId]  = useState<string>(phases[0]?.id ?? '')
  const [photos,         setPhotos]         = useState<GalleryPhoto[]>([])
  const [loading,        setLoading]        = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [successMsg,     setSuccessMsg]     = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [reordering,     setReordering]     = useState(false)
  const [reorderMsg,     setReorderMsg]     = useState<string | null>(null)
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())
  const [bulkBusy,       setBulkBusy]       = useState(false)
  const [isMobile,       setIsMobile]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gridCols = useGridCols()

  const activePhase = phases.find(p => p.id === activePhaseId)

  // ── Detect mobile ──────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 600)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Clear selection on phase change ───────────────────────────────
  useEffect(() => { setSelectedIds(new Set()) }, [activePhaseId])

  // ── DnD sensors ───────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  // ── Fetch photos ───────────────────────────────────────────────────
  const fetchFullPhotos = useCallback(async () => {
    if (!activePhaseId) return
    try {
      const res  = await fetch(`/api/event-moments/${activePhaseId}?limit=50&manage=1`)
      const data = await res.json()
      if (data.ok) {
        const all = [
          ...(data.guest_photos ?? []).map((p: any) => ({
            ...p,
            approved:                p.approved ?? true,
            is_official_photography: false,
            featured_in_publication: p.featured_in_publication ?? false,
          })),
          ...(data.official_photos ?? []).map((p: any) => ({
            ...p,
            approved:                p.approved ?? true,
            is_official_photography: true,
            featured_in_publication: p.featured_in_publication ?? false,
          })),
        ]
        setPhotos(all)
      }
    } catch (e) {
      console.error('[EventMomentsManager] fetchFull error:', e)
    }
  }, [activePhaseId])

  useEffect(() => {
    if (activePhaseId) fetchFullPhotos()
  }, [activePhaseId, fetchFullPhotos])

  // ── Single photo action ────────────────────────────────────────────
  const handleAction = async (photoId: string, action: string) => {
    try {
      const res  = await fetch(`/api/event-moments/${activePhaseId}/curate`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ capsule_id: capsuleId, photo_id: photoId, action }),
      })
      const data = await res.json()
      if (data.ok) {
        setPhotos(prev => prev.map(p => {
          if (p.id !== photoId) return p
          if (action === 'show')      return { ...p, approved: true }
          if (action === 'hide')      return { ...p, approved: false }
          if (action === 'feature')   return { ...p, featured_in_publication: true }
          if (action === 'unfeature') return { ...p, featured_in_publication: false }
          return p
        }))
      }
    } catch (e) { console.error('[EventMomentsManager] action error:', e) }
  }

  // ── Single photo delete ────────────────────────────────────────────
  const handleDelete = async (photoId: string) => {
    try {
      const res = await fetch(
        `/api/event-moments/${activePhaseId}/photos/${photoId}`,
        {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ capsule_id: capsuleId }),
        }
      )
      const data = await res.json()
      if (data.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(photoId); return n })
      }
    } catch (e) { console.error('[EventMomentsManager] delete error:', e) }
  }

  // ── Selection handlers ─────────────────────────────────────────────
  const handleSelect = (photoId: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(photoId) ? n.delete(photoId) : n.add(photoId)
      return n
    })
  }

  const handleSelectAll = (photos: GalleryPhoto[]) => {
    const allIds = photos.map(p => p.id)
    const allSelected = allIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(prev => {
        const n = new Set(prev)
        allIds.forEach(id => n.delete(id))
        return n
      })
    } else {
      setSelectedIds(prev => {
        const n = new Set(prev)
        allIds.forEach(id => n.add(id))
        return n
      })
    }
  }

  // ── Bulk action ────────────────────────────────────────────────────
  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0 || bulkBusy) return
    if (action === 'delete') {
      if (!confirm(`Delete ${selectedIds.size} selected photo${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    }
    setBulkBusy(true)
    try {
      const res  = await fetch(`/api/event-moments/${activePhaseId}/bulk-curate`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          photo_ids:  Array.from(selectedIds),
          action,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        if (action === 'delete') {
          setPhotos(prev => prev.filter(p => !selectedIds.has(p.id)))
          setSelectedIds(new Set())
        } else {
          await fetchFullPhotos()
          setSelectedIds(new Set())
        }
      }
    } catch (e) { console.error('[EventMomentsManager] bulk action error:', e) }
    finally { setBulkBusy(false) }
  }

  // ── Drag end ───────────────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const officialPhotos = photos.filter(p => p.is_official_photography)
    const oldIndex       = officialPhotos.findIndex(p => p.id === active.id)
    const newIndex       = officialPhotos.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(officialPhotos, oldIndex, newIndex)
    setPhotos(prev => [
      ...prev.filter(p => !p.is_official_photography),
      ...reordered,
    ])

    setReordering(true); setReorderMsg(null)
    try {
      const order = reordered.map((p, i) => ({ id: p.id, display_order: i + 1 }))
      const res   = await fetch(`/api/event-moments/${activePhaseId}/reorder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ capsule_id: capsuleId, order }),
      })
      const data = await res.json()
      if (data.ok) {
        setReorderMsg('Order saved')
        setTimeout(() => setReorderMsg(null), 2500)
      } else {
        setReorderMsg('Could not save order — please try again')
        await fetchFullPhotos()
      }
    } catch {
      setReorderMsg('Could not save order — please try again')
      await fetchFullPhotos()
    } finally { setReordering(false) }
  }

  // ── Upload ─────────────────────────────────────────────────────────
  const UPLOAD_BATCH_SIZE = 5

  const handleOfficialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true); setUploadError(null); setSuccessMsg(null)
    setUploadProgress({ done: 0, total: files.length })

    let successCount = 0
    const failedNames: string[] = []

    for (let i = 0; i < files.length; i += UPLOAD_BATCH_SIZE) {
      const batch = files.slice(i, i + UPLOAD_BATCH_SIZE)
      for (const file of batch) {
        const form = new FormData()
        form.append('capsule_id', capsuleId)
        form.append('file', file)
        try {
          const res  = await fetch(`/api/event-moments/${activePhaseId}/upload-official`, { method: 'POST', body: form })
          const data = await res.json()
          if (data.ok) successCount++
          else failedNames.push(file.name)
        } catch { failedNames.push(file.name) }
        setUploadProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null)
      }
      if (i + UPLOAD_BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }

    if (successCount > 0) {
      setSuccessMsg(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully`)
      await fetchFullPhotos()
    }
    if (failedNames.length > 0) {
      setUploadError(`${failedNames.length} photo${failedNames.length > 1 ? 's' : ''} failed — please retry them`)
    }

    setUploading(false); setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (phases.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: textFaint }}>No event phases have been set up yet.</p>
      </div>
    )
  }

  const guestPhotos    = photos.filter(p => !p.is_official_photography)
  const officialPhotos = photos.filter(p =>  p.is_official_photography)
  const allOfficialSelected = officialPhotos.length > 0 && officialPhotos.every(p => selectedIds.has(p.id))
  const someSelected   = selectedIds.size > 0

  return (
    <div style={{ padding: '20px 0', paddingBottom: someSelected ? '80px' : '20px' }}>

      {/* ── Phase tabs ── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 0 16px', scrollbarWidth: 'none' }}>
        {phases.map(phase => (
          <PhaseTab
            key={phase.id} phase={phase} active={phase.id === activePhaseId}
            onClick={() => setActivePhaseId(phase.id)}
            gold={gold} goldMuted={goldMuted} textFaint={textFaint} accentFaint={accentFaint}
          />
        ))}
      </div>

      {/* ── Photographer token panel ── */}
      <PhotographerTokenPanel
        phaseId={activePhaseId} capsuleId={capsuleId}
        phaseName={activePhase?.name ?? 'this phase'}
        gold={gold} goldMuted={goldMuted} textFaint={textFaint} accentFaint={accentFaint}
      />

      {/* ── Upload official photography ── */}
      <div style={{ padding: '14px 16px', borderRadius: '12px', border: `1px solid ${accentFaint}`, background: 'rgba(255,255,255,0.02)', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: goldMuted }}>
          Upload Official Photography
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: textFaint, lineHeight: 1.5 }}>
          Add formal photographer shots directly. Multi-select supported — all photos are compressed automatically.
        </p>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
          multiple onChange={handleOfficialUpload} style={{ display: 'none' }} id="official-upload-input" />
        <label htmlFor="official-upload-input" style={{
          display: 'inline-block', padding: '9px 20px', borderRadius: '20px',
          background: uploading ? 'rgba(255,255,255,0.04)' : 'rgba(226,195,107,0.1)',
          border: `1px solid ${uploading ? accentFaint : gold}`,
          color: uploading ? textFaint : gold,
          fontSize: '12px', fontWeight: 600,
          cursor: uploading ? 'not-allowed' : 'pointer', letterSpacing: '0.03em',
        }}>
          {uploading ? 'Uploading…' : '+ Add Official Photos'}
        </label>
        {uploadProgress && <p style={{ margin: '8px 0 0', fontSize: '11px', color: goldMuted }}>Uploading {uploadProgress.done} of {uploadProgress.total}…</p>}
        {uploadError   && <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{uploadError}</p>}
        {successMsg    && <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'rgba(134,239,172,0.8)' }}>✓ {successMsg}</p>}
      </div>

      {loading && <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '20px 0' }}>Loading photos…</p>}

      {!loading && (
        <>
          {/* ── Guest Eye View ── */}
          {guestPhotos.length > 0 ? (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: `1px solid ${accentFaint}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: goldMuted }}>
                    Guest Eye View
                  </p>
                  <span style={{ fontSize: '10px', color: textFaint }}>· {guestPhotos.length} {guestPhotos.length === 1 ? 'photo' : 'photos'}</span>
                </div>
                <button
                  onClick={() => handleSelectAll(guestPhotos)}
                  style={{
                    padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                    border: `1px solid ${guestPhotos.every(p => selectedIds.has(p.id)) ? 'rgba(226,195,107,0.5)' : accentFaint}`,
                    background: guestPhotos.every(p => selectedIds.has(p.id)) ? 'rgba(226,195,107,0.1)' : 'transparent',
                    color: guestPhotos.every(p => selectedIds.has(p.id)) ? gold : textFaint,
                    cursor: 'pointer',
                  }}>
                  {guestPhotos.every(p => selectedIds.has(p.id)) ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px' }}>
                {guestPhotos.map(photo => (
                  <ManagedPhotoCard
                    key={photo.id} photo={photo}
                    onAction={handleAction} onDelete={handleDelete}
                    selected={selectedIds.has(photo.id)} onSelect={handleSelect}
                    gold={gold} textFaint={textFaint} accentFaint={accentFaint}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px', borderRadius: '12px', border: `1px solid ${accentFaint}`, marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: textFaint }}>No guest photos yet for {activePhase?.name ?? 'this moment'}.</p>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: textFaint, opacity: 0.6 }}>Guest photos appear here once submitted on the event day.</p>
            </div>
          )}

          {/* ── Official Photography ── */}
          {officialPhotos.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: `1px solid ${accentFaint}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: goldMuted }}>
                    Official Photography
                  </p>
                  <span style={{ fontSize: '10px', color: textFaint }}>· {officialPhotos.length} photos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {reordering
                    ? <span style={{ fontSize: '10px', color: textFaint, opacity: 0.6, fontStyle: 'italic' }}>Saving order…</span>
                    : reorderMsg
                      ? <span style={{ fontSize: '10px', color: 'rgba(134,239,172,0.7)', fontStyle: 'italic' }}>{reorderMsg}</span>
                      : <span style={{ fontSize: '10px', color: textFaint, opacity: 0.6, fontStyle: 'italic' }}>Drag ⠿ to reorder</span>
                  }
                  {/* Select all toggle */}
                  <button
                    onClick={() => handleSelectAll(officialPhotos)}
                    style={{
                      padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                      border: `1px solid ${allOfficialSelected ? 'rgba(226,195,107,0.5)' : accentFaint}`,
                      background: allOfficialSelected ? 'rgba(226,195,107,0.1)' : 'transparent',
                      color: allOfficialSelected ? gold : textFaint, cursor: 'pointer',
                    }}>
                    {allOfficialSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={officialPhotos.map(p => p.id)} strategy={rectSortingStrategy}>
                  <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px' }}>
                    {officialPhotos.map(photo => (
                      <SortablePhotoCard
                        key={photo.id} photo={photo}
                        onAction={handleAction} onDelete={handleDelete}
                        selected={selectedIds.has(photo.id)} onSelect={handleSelect}
                        gold={gold} textFaint={textFaint} accentFaint={accentFaint}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {guestPhotos.length === 0 && officialPhotos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', borderRadius: '12px', border: `1px solid ${accentFaint}`, background: 'rgba(255,255,255,0.01)' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: textFaint }}>No photos yet for {activePhase?.name ?? 'this moment'}.</p>
              <p style={{ margin: 0, fontSize: '11px', color: textFaint, opacity: 0.6 }}>Upload official photos above or share the photographer link.</p>
            </div>
          )}
        </>
      )}

      {/* ── Bulk action bar — sticky bottom ── */}
      {someSelected && (
        <div style={{
          position:       'fixed',
          bottom:         0,
          left:           0,
          right:          0,
          zIndex:         50,
          background:     'rgba(15,10,30,0.97)',
          borderTop:      '1px solid rgba(226,195,107,0.2)',
          backdropFilter: 'blur(12px)',
          padding:        '12px 20px',
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          flexWrap:       'wrap',
        }}>
          <span style={{ fontSize: '12px', color: goldMuted, fontWeight: 600, flexShrink: 0 }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            <button onClick={() => handleBulkAction('feature')} disabled={bulkBusy} style={{
              padding: '7px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
              border: '1px solid rgba(226,195,107,0.3)', background: 'transparent', color: gold,
              cursor: bulkBusy ? 'not-allowed' : 'pointer', opacity: bulkBusy ? 0.5 : 1,
            }}>★ Feature</button>
            <button onClick={() => handleBulkAction('unfeature')} disabled={bulkBusy} style={{
              padding: '7px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
              border: `1px solid ${accentFaint}`, background: 'transparent', color: textFaint,
              cursor: bulkBusy ? 'not-allowed' : 'pointer', opacity: bulkBusy ? 0.5 : 1,
            }}>Unfeature</button>
            <button onClick={() => handleBulkAction('hide')} disabled={bulkBusy} style={{
              padding: '7px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
              border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: 'rgba(248,113,113,0.8)',
              cursor: bulkBusy ? 'not-allowed' : 'pointer', opacity: bulkBusy ? 0.5 : 1,
            }}>Hide</button>
            <button onClick={() => handleBulkAction('delete')} disabled={bulkBusy} style={{
              padding: '7px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
              border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.1)', color: 'rgba(248,113,113,0.9)',
              cursor: bulkBusy ? 'not-allowed' : 'pointer', opacity: bulkBusy ? 0.5 : 1,
            }}>🗑 Delete</button>
          </div>
          <button onClick={() => setSelectedIds(new Set())} style={{
            padding: '7px 14px', borderRadius: '16px', fontSize: '12px',
            border: `1px solid ${accentFaint}`, background: 'transparent', color: textFaint, cursor: 'pointer',
          }}>✕ Clear</button>
        </div>
      )}
    </div>
  )
}