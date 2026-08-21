// ============================================================
// FILE PATH: components/manage/display/DisplayPhotoSelector.tsx
// PURPOSE:   Organiser selects which gallery photos appear
//            in both the Video Reel and Offline HTML display.
//            Uses display_queue_overrides (hidden=true to exclude).
//            Shows photo grid with gold border on selected.
//            Counter shows X of Y photos selected.
// ARCHITECTURE: EDS — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.29
// DATE:      21 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect, useCallback } from 'react'

// ═══ SECTION 2 — Types ═══

interface DisplayPhoto {
  id: string
  image_url: string
  caption: string | null
  uploaded_by_name: string | null
  included: boolean
}

interface DisplayPhotoSelectorProps {
  capsuleSlug: string
  capsuleId: string
  onSelectionChange?: (includedCount: number) => void
}

// ═══ SECTION 3 — Component ═══

export default function DisplayPhotoSelector({
  capsuleSlug,
  capsuleId,
  onSelectionChange,
}: DisplayPhotoSelectorProps) {
  const [photos, setPhotos] = useState<DisplayPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── 3a. Load photos ──
  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/photos?slug=${capsuleSlug}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setPhotos(data.photos || [])
      onSelectionChange?.(data.included || 0)
    } catch {
      setError('Could not load photos.')
    }
    setLoading(false)
  }, [capsuleSlug, onSelectionChange])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  // ── 3b. Toggle inclusion ──
  async function togglePhoto(photoId: string, currentlyIncluded: boolean) {
    setToggling(photoId)
    setError(null)

    // Optimistic update
    setPhotos(prev => prev.map(p =>
      p.id === photoId ? { ...p, included: !currentlyIncluded } : p
    ))

    const res = await fetch(`/api/display/queue/hide?slug=${capsuleSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_type: 'gallery_item',
        item_id: photoId,
        hidden: currentlyIncluded, // if currently included, hide it; if excluded, unhide
      }),
    })

    if (!res.ok) {
      // Revert on failure
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, included: currentlyIncluded } : p
      ))
      setError('Failed to update photo selection.')
    } else {
      const included = photos.filter(p =>
        p.id === photoId ? !currentlyIncluded : p.included
      ).length
      onSelectionChange?.(included)
    }

    setToggling(null)
  }

  // ── 3c. Select / deselect all ──
  async function selectAll() {
    for (const photo of photos.filter(p => !p.included)) {
      await fetch(`/api/display/queue/hide?slug=${capsuleSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: 'gallery_item', item_id: photo.id, hidden: false }),
      })
    }
    await loadPhotos()
  }

  async function deselectAll() {
    for (const photo of photos.filter(p => p.included)) {
      await fetch(`/api/display/queue/hide?slug=${capsuleSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: 'gallery_item', item_id: photo.id, hidden: true }),
      })
    }
    await loadPhotos()
  }

  const includedCount = photos.filter(p => p.included).length

  // ═══ SECTION 4 — Render ═══

  if (loading) return <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Loading photos…</p>

  if (photos.length === 0) {
    return (
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>
          No approved event photos yet. Photos uploaded on the day will appear here.
        </p>
      </div>
    )
  }

  return (
    <div>

      {/* ── Header + controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
            {includedCount} of {photos.length} photos selected
          </span>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.5rem' }}>
            — these appear as visual breaks between tributes
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={selectAll}
            style={{ fontSize: '0.75rem', color: '#0D0820', background: 'rgba(212,174,42,0.15)', border: '1px solid rgba(212,174,42,0.4)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            Select all
          </button>
          <button
            onClick={deselectAll}
            style={{ fontSize: '0.75rem', color: '#6b7280', background: 'transparent', border: '1px solid #d1d5db', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            Deselect all
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.5rem' }}>{error}</p>
      )}

      {/* ── Photo grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '0.5rem',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '0.25rem',
      }}>
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => togglePhoto(photo.id, photo.included)}
            disabled={toggling === photo.id}
            style={{
              position: 'relative',
              padding: 0,
              border: photo.included ? '3px solid #D4AE2A' : '3px solid transparent',
              borderRadius: '6px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#f3f4f6',
              aspectRatio: '1',
              transition: 'border-color 0.15s',
              opacity: toggling === photo.id ? 0.6 : 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.image_url}
              alt={photo.caption || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Included checkmark */}
            {photo.included && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#D4AE2A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: '#0D0820',
                fontWeight: 700,
              }}>
                ✓
              </div>
            )}

            {/* Caption tooltip on hover */}
            {photo.caption && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.75)',
                padding: '0.2rem 0.3rem',
                fontSize: '0.6rem',
                color: '#F5F3EE',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {photo.caption}
              </div>
            )}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
        Selected photos appear automatically between tributes.
        The system spaces them evenly based on how many tributes and photos you have.
      </p>
    </div>
  )
}
