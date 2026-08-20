// ============================================================
// FILE PATH: components/manage/display/VideoAssetCard.tsx
// PURPOSE:   Displays a single video asset in the library.
//            Shows orientation badge, duration, filename/title,
//            status, include/exclude toggle, drag handle.
//            Preview loads signed URL on demand.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

import { useState } from 'react'

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
  dragHandleProps?: Record<string, unknown>
}

function formatDuration(secs: number | null): string {
  if (!secs) return '–'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(0)}MB`
}

const ORIENTATION_LABEL: Record<string, string> = {
  landscape: '⬛ Landscape',
  portrait: '📱 Portrait',
  square: '⬜ Square',
}

export default function VideoAssetCard({
  asset,
  capsuleSlug,
  selected,
  onToggle,
  dragHandleProps,
}: VideoAssetCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  async function loadPreview() {
    if (previewUrl) { setPreviewUrl(null); return }
    setLoadingPreview(true)
    try {
      const res = await fetch(
        `/api/display/video/${asset.id}/signed-url?slug=${capsuleSlug}&purpose=preview`
      )
      const data = await res.json()
      if (data.url) setPreviewUrl(data.url)
    } catch {
      // silent
    }
    setLoadingPreview(false)
  }

  const displayName = asset.title || asset.original_filename

  return (
    <div style={{
      border: selected ? '2px solid #D4AE2A' : '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      background: selected ? 'rgba(212,174,42,0.05)' : '#fff',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Drag handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            style={{ cursor: 'grab', color: '#9ca3af', fontSize: '1.2rem', paddingTop: '2px', flexShrink: 0 }}
          >
            ⠿
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Filename / title */}
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            }} title={displayName}>
              {displayName}
            </span>

            {/* Orientation badge */}
            {asset.orientation && (
              <span style={{
                fontSize: '0.7rem',
                background: '#f3f4f6',
                color: '#6b7280',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                flexShrink: 0,
              }}>
                {ORIENTATION_LABEL[asset.orientation]}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.8rem', color: '#6b7280' }}>
            <span>{formatDuration(asset.duration_seconds)}</span>
            {asset.file_size_bytes && <span>{formatSize(asset.file_size_bytes)}</span>}
            {asset.attribution && <span>By {asset.attribution}</span>}
          </div>

          {/* Preview toggle */}
          {previewUrl && (
            <video
              src={previewUrl}
              controls
              style={{ width: '100%', maxHeight: '180px', marginTop: '0.75rem', borderRadius: '4px', background: '#000' }}
            />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
          <button
            onClick={() => onToggle(asset.id)}
            style={{
              background: selected ? '#D4AE2A' : 'transparent',
              color: selected ? '#0D0820' : '#6b7280',
              border: `1px solid ${selected ? '#D4AE2A' : '#d1d5db'}`,
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: selected ? 600 : 400,
            }}
          >
            {selected ? '✓ In Reel' : 'Add'}
          </button>

          <button
            onClick={loadPreview}
            disabled={loadingPreview}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            {loadingPreview ? '…' : previewUrl ? '✕ Hide' : '▶ Preview'}
          </button>
        </div>
      </div>
    </div>
  )
}
