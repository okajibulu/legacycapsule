// ============================================================
// FILE PATH: components/manage/display/ExternalVideoImport.tsx
// PURPOSE:   File picker for organiser-supplied tribute videos.
//            Extension-based validation (not MIME).
//            Duplicate detection — skips files already uploaded.
//            Shows per-file success/skip/error report after batch.
//            Discard all button to clear the entire library.
//            Max 20 videos. Warning at 10+.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.30
// DATE:      21 August 2026
// ============================================================

'use client'

import { useRef, useState } from 'react'

interface ExternalVideoImportProps {
  capsuleSlug: string
  capsuleId: string
  currentCount: number
  onUploaded: () => void
  onDiscarded: () => void
}

const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'MP4', 'MOV', 'm4v', 'M4V', 'mpeg', 'mpg', 'avi', 'webm']
const MAX_VIDEOS = 20
const WARN_AT = 10
const MAX_SIZE_MB = 500

function getExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

type FileResult = {
  filename: string
  status: 'uploaded' | 'duplicate' | 'error' | 'skipped'
  reason?: string
}

export default function ExternalVideoImport({
  capsuleSlug,
  capsuleId,
  currentCount,
  onUploaded,
  onDiscarded,
}: ExternalVideoImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [results, setResults] = useState<FileResult[] | null>(null)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  async function handleFiles(files: FileList) {
    setResults(null)
    const fileArray = Array.from(files)
    const batchResults: FileResult[] = []

    // Pre-validate all files before uploading any
    const invalid = fileArray.filter(f => !ALLOWED_EXTENSIONS.includes(getExtension(f.name)))
    const tooBig = fileArray.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024)
    const wouldExceed = currentCount + fileArray.length > MAX_VIDEOS

    if (invalid.length > 0) {
      setResults(invalid.map(f => ({
        filename: f.name,
        status: 'skipped',
        reason: 'Unsupported format',
      })))
      return
    }

    if (tooBig.length > 0) {
      setResults(tooBig.map(f => ({
        filename: f.name,
        status: 'skipped',
        reason: 'Exceeds 500MB limit',
      })))
      return
    }

    if (wouldExceed) {
      const canUpload = MAX_VIDEOS - currentCount
      setResults([{
        filename: fileArray.length + ' files selected',
        status: 'skipped',
        reason: 'Would exceed ' + MAX_VIDEOS + ' video limit. You can add ' + canUpload + ' more.',
      }])
      return
    }

    setUploading(true)
    let successCount = 0

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      setProgress('Uploading ' + (i + 1) + ' of ' + fileArray.length + ': ' + file.name)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('capsule_id', capsuleId)

      const res = await fetch(`/api/display/video/import?slug=${capsuleSlug}`, {
        method: 'POST',
        body: formData,
      })

      if (res.status === 409) {
        // Duplicate — server confirmed same filename already exists
        batchResults.push({ filename: file.name, status: 'duplicate', reason: 'Already uploaded' })
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        batchResults.push({ filename: file.name, status: 'error', reason: data.error || 'Upload failed' })
      } else {
        batchResults.push({ filename: file.name, status: 'uploaded' })
        successCount++
      }
    }

    setUploading(false)
    setProgress(null)
    setResults(batchResults)
    if (successCount > 0) onUploaded()
  }

  // ── Discard all — deletes every ready asset for this capsule ──
  async function handleDiscard() {
    setDiscarding(true)
    try {
      const res = await fetch(`/api/display/video/list?slug=${capsuleSlug}`)
      if (res.ok) {
        const data = await res.json()
        const assets: { id: string }[] = data.assets || []
        await Promise.all(
          assets.map(a =>
            fetch(`/api/display/video/${a.id}?slug=${capsuleSlug}`, { method: 'DELETE' })
          )
        )
      }
    } catch { /* silent */ }
    setDiscarding(false)
    setDiscardConfirm(false)
    setResults(null)
    onDiscarded()
  }

  const atMax = currentCount >= MAX_VIDEOS
  const nearMax = currentCount >= WARN_AT

  // ── Status icon ──
  function statusIcon(status: FileResult['status']) {
    if (status === 'uploaded') return <span style={{ color: '#16a34a' }}>✓</span>
    if (status === 'duplicate') return <span style={{ color: '#D4AE2A' }}>≡</span>
    if (status === 'error') return <span style={{ color: '#dc2626' }}>✕</span>
    return <span style={{ color: '#9ca3af' }}>–</span>
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".mp4,.mov,.MP4,.MOV,.m4v,.M4V,.mpeg,.mpg,.avi,.webm"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* ── Warning at 10+ ── */}
      {nearMax && !atMax && (
        <p style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '4px', padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}>
          {currentCount} of {MAX_VIDEOS} videos uploaded.
        </p>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || atMax}
          style={{
            background: atMax ? '#e5e7eb' : uploading ? 'rgba(212,174,42,0.3)' : '#D4AE2A',
            color: atMax ? '#9ca3af' : '#0D0820',
            border: 'none',
            padding: '0.7rem 1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            cursor: uploading || atMax ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          {atMax ? 'Maximum reached' : uploading ? '↑ Uploading…' : '+ Add Tribute Videos'}
        </button>

        {/* Discard all button */}
        {currentCount > 0 && !uploading && (
          <button
            onClick={() => setDiscardConfirm(true)}
            style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.7rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px' }}
          >
            × Discard All Videos
          </button>
        )}
      </div>

      {/* ── Discard confirmation ── */}
      {discardConfirm && (
        <div style={{ marginTop: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.875rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#991b1b', margin: '0 0 0.6rem' }}>
            This will permanently remove all {currentCount} uploaded videos and clear the reel. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDiscard}
              disabled={discarding}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              {discarding ? 'Removing…' : 'Yes, discard all'}
            </button>
            <button
              onClick={() => setDiscardConfirm(false)}
              style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Upload progress ── */}
      {progress && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
          {progress}
        </p>
      )}

      {/* ── Per-file results report ── */}
      {results && results.length > 0 && (
        <div style={{ marginTop: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#f9fafb', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Upload Report — {results.filter(r => r.status === 'uploaded').length} of {results.length} successful
            </span>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ flexShrink: 0 }}>{statusIcon(r.status)}</span>
                <span style={{ fontSize: '0.8rem', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.filename}
                </span>
                {r.reason && (
                  <span style={{ fontSize: '0.75rem', color: r.status === 'duplicate' ? '#92400e' : r.status === 'error' ? '#dc2626' : '#9ca3af', flexShrink: 0 }}>
                    {r.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setResults(null)}
            style={{ width: '100%', background: 'transparent', border: 'none', borderTop: '1px solid #e5e7eb', padding: '0.4rem', fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.4rem 0 0' }}>
        MP4, MOV, M4V supported · Max 500MB per file · Up to {MAX_VIDEOS} videos
      </p>
    </div>
  )
}
