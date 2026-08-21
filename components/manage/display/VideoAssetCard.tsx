// ============================================================
// FILE PATH: components/manage/display/VideoAssetCard.tsx
// PURPOSE:   Displays a single video asset in the library.
//            Shows orientation badge, duration, title/attribution.
//            Inline title edit. Delete button with confirmation.
//            Loose MIME validation — accepts WhatsApp exports.
//            Preview loads signed URL on demand.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.29
// DATE:      21 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState } from 'react'

// ═══ SECTION 2 — Types ═══

export interface VideoAsset {
  id: string
  original_filename: string
  title: string | null
  attribution: string | null
  duration_seconds: number | null
  orientation: 'landscape' | 'portrait' | 'square' | null
  file_size_bytes: number | null
  status: string
}

interface VideoAssetCardProps {
  asset: VideoAsset
  capsuleSlug: string
  selected: boolean
  onToggle: (assetId: string) => void
  onDeleted: (assetId: string) => void
  onUpdated: (assetId: string, updates: Partial<VideoAsset>) => void
  dragHandleProps?: Record<string, unknown>
}

// ═══ SECTION 3 — Helpers ═══

function formatDuration(secs: number | null): string {
  if (!secs) return '–'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return m + ':' + s.toString().padStart(2, '0')
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  return (bytes / 1024 / 1024).toFixed(0) + 'MB'
}

const ORIENTATION_LABEL: Record<string, string> = {
  landscape: '⬛ Landscape',
  portrait: '📱 Portrait',
  square: '⬜ Square',
}

// ═══ SECTION 4 — Component ═══

export default function VideoAssetCard({
  asset,
  capsuleSlug,
  selected,
  onToggle,
  onDeleted,
  onUpdated,
  dragHandleProps,
}: VideoAssetCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(asset.title || '')
  const [editAttribution, setEditAttribution] = useState(asset.attribution || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── 4a. Preview ──
  async function loadPreview() {
    if (previewUrl) { setPreviewUrl(null); return }
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/display/video/${asset.id}/signed-url?slug=${capsuleSlug}&purpose=preview`)
      const data = await res.json()
      if (data.url) setPreviewUrl(data.url)
    } catch { /* silent */ }
    setLoadingPreview(false)
  }

  // ── 4b. Save title/attribution ──
  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`/api/display/video/${asset.id}?slug=${capsuleSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, attribution: editAttribution }),
    })
    setSaving(false)
    if (res.ok) {
      onUpdated(asset.id, { title: editTitle || null, attribution: editAttribution || null })
      setEditing(false)
    }
  }

  // ── 4c. Delete ──
  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/display/video/${asset.id}?slug=${capsuleSlug}`, {
      method: 'DELETE',
    })
    setDeleting(false)
    if (res.ok) {
      onDeleted(asset.id)
    } else {
      setConfirmDelete(false)
    }
  }

  const displayName = asset.title || asset.original_filename

  // ═══ SECTION 5 — Render ═══

  return (
    <div style={{
      border: selected ? '2px solid #D4AE2A' : '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '0.875rem',
      background: selected ? 'rgba(212,174,42,0.04)' : '#fff',
      transition: 'all 0.2s',
    }}>

      {/* ── Delete confirmation overlay ── */}
      {confirmDelete && (
        <div style={{ marginBottom: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: '0 0 0.5rem' }}>
            Remove this video? This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.3rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              {deleting ? 'Removing…' : 'Yes, remove'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.3rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Drag handle */}
        {dragHandleProps && (
          <div {...dragHandleProps} style={{ cursor: 'grab', color: '#9ca3af', fontSize: '1.1rem', paddingTop: '2px', flexShrink: 0 }}>
            ⠿
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {editing ? (
            // ── Edit mode ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Display title (e.g. Uncle James's Tribute)"
                style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                value={editAttribution}
                onChange={e => setEditAttribution(e.target.value)}
                placeholder="Attribution (contributor name)"
                style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  style={{ background: '#0D0820', color: '#D4AE2A', border: 'none', padding: '0.3rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.3rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // ── Display mode ──
            <div style={{ marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={displayName}>
                  {displayName}
                </span>
                {asset.orientation && (
                  <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280', padding: '0.1rem 0.35rem', borderRadius: '3px', flexShrink: 0 }}>
                    {ORIENTATION_LABEL[asset.orientation]}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                <span>{formatDuration(asset.duration_seconds)}</span>
                {asset.file_size_bytes && <span>{formatSize(asset.file_size_bytes)}</span>}
                {asset.attribution && <span style={{ color: '#6b7280' }}>By {asset.attribution}</span>}
              </div>
            </div>
          )}

          {/* Preview player */}
          {previewUrl && (
            <video src={previewUrl} controls style={{ width: '100%', maxHeight: '160px', marginTop: '0.5rem', borderRadius: '4px', background: '#000' }} />
          )}
        </div>

        {/* Action column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
          {/* Add/Remove reel toggle */}
          <button
            onClick={() => onToggle(asset.id)}
            style={{
              background: selected ? '#D4AE2A' : 'transparent',
              color: selected ? '#0D0820' : '#6b7280',
              border: '1px solid ' + (selected ? '#D4AE2A' : '#d1d5db'),
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: selected ? 700 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {selected ? '✓ In Reel' : 'Add'}
          </button>

          {/* Preview */}
          <button
            onClick={loadPreview}
            disabled={loadingPreview}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
          >
            {loadingPreview ? '…' : previewUrl ? '✕ Hide' : '▶ Preview'}
          </button>

          {/* Edit */}
          <button
            onClick={() => setEditing(e => !e)}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
          >
            ✎ Edit
          </button>

          {/* Delete */}
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
          >
            × Remove
          </button>
        </div>
      </div>
    </div>
  )
}
