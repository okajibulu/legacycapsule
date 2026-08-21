// ============================================================
// FILE PATH: components/manage/display/VideoReelEditor.tsx
// PURPOSE:   Full video reel editor for the organiser.
//            Composes ExternalVideoImport + VideoAssetLibrary.
//            Save Reel → persists selection and order to DB.
//            Preview → VideoReelPlayer in overlay.
//            Play on Display → VideoReelPlayer fullscreen.
//            Clean P0 UI per Addendum D spec.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ExternalVideoImport from './ExternalVideoImport'
import VideoAssetLibrary, { SelectedItem } from './VideoAssetLibrary'

// VideoReelPlayer dynamically imported — large component, client-only
const VideoReelPlayer = dynamic(
  () => import('@/components/display/VideoReelPlayer'),
  { ssr: false }
)

// ═══ SECTION 2 — Types ═══

interface VideoReelEditorProps {
  capsuleSlug: string
  capsuleId: string
  honoureeName: string
  eventType: string
}

// ═══ SECTION 3 — Component ═══

export default function VideoReelEditor({
  capsuleSlug,
  capsuleId,
  honoureeName,
  eventType,
}: VideoReelEditorProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [reelTitle, setReelTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [uploadTrigger, setUploadTrigger] = useState(0)
  const [playerMode, setPlayerMode] = useState<'hidden' | 'preview' | 'fullscreen'>('hidden')
  const [reelItems, setReelItems] = useState<import('@/components/display/VideoReelPlayer').ReelItem[]>([])
  const [photos, setPhotos] = useState<import('@/components/display/VideoReelPlayer').ReelPhotoItem[]>([])

  // ── 3g. Load selected display photos ──
  async function loadPhotos() {
    const res = await fetch(`/api/display/photos?slug=${capsuleSlug}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.photos || []).filter((p: { included: boolean }) => p.included)
  }

  // ── 3a. Load existing reel on mount ──
  useEffect(() => {
    async function loadReel() {
      const res = await fetch(`/api/display/reel?slug=${capsuleSlug}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.reel?.title) setReelTitle(data.reel.title)
      if (data.items?.length) {
        const ids = data.items.map((i: { asset: { id: string }; sort_order: number }) => ({
          assetId: i.asset.id,
          sortOrder: i.sort_order,
        }))
        setSelectedItems(ids)
      }
    }
    loadReel()
  }, [capsuleSlug])

  // ── 3b. Handle selection changes from library ──
  const handleSelectionChange = useCallback((items: SelectedItem[]) => {
    setSelectedItems(items)
  }, [])

  // ── 3c. Save reel ──
  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)

    const res = await fetch(`/api/display/reel?slug=${capsuleSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: reelTitle || null,
        theme: 'default',
        items: selectedItems.map((item) => ({
          asset_id: item.assetId,
          sort_order: item.sortOrder,
        })),
      }),
    })

    setSaving(false)

    if (res.ok) {
      setSaveMessage('Reel saved.')
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      const data = await res.json().catch(() => ({}))
      setSaveMessage(data.error || 'Failed to save reel.')
    }
  }

  // ── 3d. Build reel items for player ──
  async function buildReelItems() {
    // Fetch current reel from DB to get item IDs and asset info
    const res = await fetch(`/api/display/reel?slug=${capsuleSlug}`)
    if (!res.ok) return []
    const data = await res.json()
    if (!data.items?.length) return []

    return data.items.map((item: {
      id: string
      asset: { id: string; duration_seconds: number | null }
      sort_order: number
      display_title: string | null
      attribution: string | null
    }) => ({
      id: item.id,
      assetId: item.asset.id,
      sortOrder: item.sort_order,
      displayTitle: item.display_title,
      attribution: item.attribution,
      durationSeconds: item.asset.duration_seconds,
    }))
  }

  // ── 3e. Preview ──
  async function handlePreview() {
    await handleSave()
    const items = await buildReelItems()
    if (!items.length) {
      alert('No videos in reel. Please add and save videos first.')
      return
    }
    setReelItems(items)
    setPlayerMode('preview')
  }

  // ── 3f. Play on Display (fullscreen) ──
  async function handlePlayOnDisplay() {
    await handleSave()
    const items = await buildReelItems()
    if (!items.length) {
      alert('No videos in reel. Please add and save videos first.')
      return
    }
    const displayPhotos = await loadPhotos()
    setReelItems(items)
    setPhotos(displayPhotos)
    setPlayerMode('fullscreen')

    // Request fullscreen
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Fullscreen not available — player still runs
    }
  }

  function handlePlayerComplete() {
    setPlayerMode('hidden')
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  // ═══ SECTION 4 — Render ═══

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
          Video Reel
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Upload tribute videos, arrange them, and play on the event screen.
        </p>
      </div>

      {/* ── Reel title ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
          Reel Title (optional)
        </label>
        <input
          type="text"
          value={reelTitle}
          onChange={(e) => setReelTitle(e.target.value)}
          placeholder={`${honoureeName}'s Tribute Reel`}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Upload ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ExternalVideoImport
          capsuleSlug={capsuleSlug}
          capsuleId={capsuleId}
          currentCount={selectedItems.length}
          onUploaded={() => setUploadTrigger((t) => t + 1)}
        />
      </div>

      {/* ── Library ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <VideoAssetLibrary
          capsuleSlug={capsuleSlug}
          capsuleId={capsuleId}
          initialSelectedIds={selectedItems.map((i) => i.assetId)}
          onSelectionChange={handleSelectionChange}
          refreshTrigger={uploadTrigger}
        />
      </div>

      {/* ── Reel preview summary ── */}
      {selectedItems.length > 0 && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
            Reel Preview
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>[ LC Opening ]</div>
            {selectedItems.map((item, i) => (
              <div key={item.assetId} style={{ fontSize: '0.85rem', color: '#111827' }}>
                {i + 1}. Video {i + 1}
              </div>
            ))}
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>[ LC Closing ]</div>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#111827',
            color: '#fff',
            border: 'none',
            padding: '0.7rem 1.5rem',
            fontSize: '0.9rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Reel'}
        </button>

        <button
          onClick={handlePreview}
          disabled={selectedItems.length === 0 || saving}
          style={{
            background: 'transparent',
            color: '#111827',
            border: '1px solid #d1d5db',
            padding: '0.7rem 1.5rem',
            fontSize: '0.9rem',
            cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            fontWeight: 500,
            opacity: selectedItems.length === 0 ? 0.5 : 1,
          }}
        >
          ▶ Preview
        </button>

        <button
          onClick={handlePlayOnDisplay}
          disabled={selectedItems.length === 0 || saving}
          style={{
            background: '#D4AE2A',
            color: '#0D0820',
            border: 'none',
            padding: '0.7rem 1.5rem',
            fontSize: '0.9rem',
            cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            fontWeight: 700,
            opacity: selectedItems.length === 0 ? 0.5 : 1,
          }}
        >
          ⛶ Play on Display
        </button>

        {saveMessage && (
          <span style={{
            fontSize: '0.85rem',
            color: saveMessage.startsWith('Failed') ? '#dc2626' : '#16a34a',
          }}>
            {saveMessage}
          </span>
        )}
      </div>

      {/* ═══ SECTION 5 — Player Overlay ═══ */}
      {playerMode !== 'hidden' && reelItems.length > 0 && (
        <VideoReelPlayer
          reelItems={reelItems}
          photos={photos}
          capsuleSlug={capsuleSlug}
          capsuleUrl={(process.env.NEXT_PUBLIC_APP_URL || '') + '/for/' + capsuleSlug}
          honoureeName={honoureeName}
          eventType={eventType}
          theme="default"
          onComplete={handlePlayerComplete}
        />
      )}
    </div>
  )
}
