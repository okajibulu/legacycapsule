// ============================================================
// FILE PATH: components/manage/display/AudioTrackPanel.tsx
// PURPOSE:   Upload and manage up to 3 background music tracks
//            for the offline display export. Shows track list
//            with drag-to-reorder, duration, delete.
//            Calls /api/display/audio/import for uploads.
// ARCHITECTURE: EDS — Manage Dashboard
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.28
// DATE:      21 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useRef, useState, useEffect, useCallback } from 'react'

// ═══ SECTION 2 — Types ═══

interface AudioTrack {
  id: string
  original_filename: string
  mime_type: string
  duration_seconds: number | null
  file_size_bytes: number | null
  sort_order: number
  status: string
}

interface AudioTrackPanelProps {
  capsuleSlug: string
  capsuleId: string
}

// ═══ SECTION 3 — Helpers ═══

const ACCEPTED_TYPES = [
  'audio/mpeg', 'audio/mp4', 'audio/aac',
  'audio/wav', 'audio/ogg', 'audio/x-m4a',
]
const ACCEPTED_EXT = '.mp3,.m4a,.aac,.wav,.ogg,.mp4'
const MAX_TRACKS = 3
const MAX_SIZE_MB = 50

function formatDuration(secs: number | null): string {
  if (!secs) return '–'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return m + ':' + s.toString().padStart(2, '0')
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  return (bytes / 1024 / 1024).toFixed(1) + 'MB'
}

// ═══ SECTION 4 — Component ═══

export default function AudioTrackPanel({
  capsuleSlug,
  capsuleId,
}: AudioTrackPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── 4a. Load tracks ──
  const loadTracks = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/audio/list?slug=${capsuleSlug}`)
      if (!res.ok) return
      const data = await res.json()
      setTracks(data.tracks || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [capsuleSlug])

  useEffect(() => { loadTracks() }, [loadTracks])

  // ── 4b. Upload handler ──
  async function handleFile(file: File) {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported format. Please upload MP3, M4A, AAC, WAV, or OGG files.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError('File is too large. Maximum ' + MAX_SIZE_MB + 'MB per track.')
      return
    }
    if (tracks.length >= MAX_TRACKS) {
      setError('Maximum ' + MAX_TRACKS + ' tracks allowed. Remove one before adding another.')
      return
    }

    setUploading(true)
    setUploadProgress('Uploading ' + file.name + '…')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('capsule_id', capsuleId)

    const res = await fetch(`/api/display/audio/import?slug=${capsuleSlug}`, {
      method: 'POST',
      body: formData,
    })

    setUploading(false)
    setUploadProgress(null)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Upload failed. Please try again.')
      return
    }

    await loadTracks()
  }

  // ── 4c. Delete handler ──
  async function handleDelete(trackId: string) {
    setDeletingId(trackId)
    const res = await fetch(`/api/display/audio/${trackId}?slug=${capsuleSlug}`, {
      method: 'DELETE',
    })
    setDeletingId(null)
    if (res.ok) await loadTracks()
    else setError('Failed to remove track.')
  }

  // ── 4d. Reorder — move up ──
  async function moveUp(index: number) {
    if (index === 0) return
    const reordered = [...tracks]
    const temp = reordered[index - 1]
    reordered[index - 1] = reordered[index]
    reordered[index] = temp
    setTracks(reordered)
    await saveOrder(reordered)
  }

  async function moveDown(index: number) {
    if (index === tracks.length - 1) return
    const reordered = [...tracks]
    const temp = reordered[index + 1]
    reordered[index + 1] = reordered[index]
    reordered[index] = temp
    setTracks(reordered)
    await saveOrder(reordered)
  }

  async function saveOrder(ordered: AudioTrack[]) {
    await fetch(`/api/display/audio/reorder?slug=${capsuleSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id: capsuleId,
        order: ordered.map((t, i) => ({ id: t.id, sort_order: i })),
      }),
    })
  }

  // ═══ SECTION 5 — Render ═══

  return (
    <div style={{ maxWidth: '560px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
          Background Music
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
          Up to {MAX_TRACKS} tracks. Plays sequentially and loops during the display.
          MP3, M4A, AAC, WAV, OGG supported. Max {MAX_SIZE_MB}MB each.
        </p>
      </div>

      {/* ── Track list ── */}
      {loading ? (
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Loading…</p>
      ) : tracks.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', marginBottom: '1rem' }}>
          No music tracks yet. Add one below.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {tracks.map((track, index) => (
            <div
              key={track.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.6rem 0.75rem',
                background: '#fff',
              }}
            >
              {/* Order controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#d1d5db' : '#6b7280', fontSize: '0.7rem', padding: '0', lineHeight: 1 }}
                >▲</button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === tracks.length - 1}
                  style={{ background: 'none', border: 'none', cursor: index === tracks.length - 1 ? 'default' : 'pointer', color: index === tracks.length - 1 ? '#d1d5db' : '#6b7280', fontSize: '0.7rem', padding: '0', lineHeight: 1 }}
                >▼</button>
              </div>

              {/* Track number */}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D4AE2A', width: '18px', flexShrink: 0 }}>
                {index + 1}
              </span>

              {/* Track info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.original_filename}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.1rem 0 0' }}>
                  {formatDuration(track.duration_seconds)}
                  {track.file_size_bytes ? ' · ' + formatSize(track.file_size_bytes) : ''}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(track.id)}
                disabled={deletingId === track.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', flexShrink: 0, padding: '0.25rem' }}
                title="Remove track"
              >
                {deletingId === track.id ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload button ── */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0])
          e.target.value = ''
        }}
      />

      {tracks.length < MAX_TRACKS && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            background: uploading ? 'rgba(212,174,42,0.3)' : 'rgba(212,174,42,0.1)',
            color: '#92400e',
            border: '1px dashed #D4AE2A',
            padding: '0.6rem 1.25rem',
            fontSize: '0.85rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          {uploading ? '↑ Uploading…' : '+ Add Music Track'}
        </button>
      )}

      {uploadProgress && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
          {uploadProgress}
        </p>
      )}

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '0.5rem 0 0' }}>
          {error}
        </p>
      )}
    </div>
  )
}
