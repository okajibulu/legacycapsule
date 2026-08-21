// ============================================================
// FILE PATH: components/manage/display/ExternalVideoImport.tsx
// PURPOSE:   Direct browser-to-Supabase upload — bypasses Vercel
//            4.5MB payload limit entirely. Flow:
//            1. GET presigned upload URL from /api/display/video/presign
//            2. PUT file directly to Supabase signed URL
//            3. POST metadata to /api/display/video/register
//            Supports multiple files, per-file report, discard all.
//            Extension-based validation. Duplicate detection.
//            Max 20 videos. Warning at 10+.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.31
// DATE:      21 August 2026
// ============================================================

'use client'

import { useRef, useState } from 'react'

// ═══ SECTION 1 — Types ═══

interface ExternalVideoImportProps {
  capsuleSlug: string
  capsuleId: string
  currentCount: number
  onUploaded: () => void
  onDiscarded: () => void
}

type FileResult = {
  filename: string
  status: 'uploaded' | 'duplicate' | 'skipped' | 'error'
  reason?: string
}

// ═══ SECTION 2 — Constants ═══

const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'MP4', 'MOV', 'm4v', 'M4V', 'mpeg', 'mpg', 'avi', 'webm']
const MAX_VIDEOS = 20
const WARN_AT = 10
const MAX_SIZE_MB = 500

function getExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

function formatSize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(0) + 'MB'
}

// ═══ SECTION 3 — Component ═══

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
  const [progressPct, setProgressPct] = useState<number | null>(null)
  const [results, setResults] = useState<FileResult[] | null>(null)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  // ═══ SECTION 4 — Upload Handler ═══

  async function handleFiles(files: FileList) {
    setResults(null)
    const fileArray = Array.from(files)
    const batchResults: FileResult[] = []
    let successCount = 0

    // Pre-validate all files
    const invalid = fileArray.filter(f => !ALLOWED_EXTENSIONS.includes(getExtension(f.name)))
    if (invalid.length > 0) {
      setResults(invalid.map(f => ({ filename: f.name, status: 'skipped', reason: 'Unsupported format' })))
      return
    }

    const tooBig = fileArray.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024)
    if (tooBig.length > 0) {
      setResults(tooBig.map(f => ({
        filename: f.name,
        status: 'skipped',
        reason: formatSize(f.size) + ' — exceeds ' + MAX_SIZE_MB + 'MB limit',
      })))
      return
    }

    const available = MAX_VIDEOS - currentCount
    if (available <= 0) {
      setResults([{ filename: 'All files', status: 'skipped', reason: 'Maximum ' + MAX_VIDEOS + ' videos reached.' }])
      return
    }

    setUploading(true)

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]

      if (successCount >= available) {
        batchResults.push({ filename: file.name, status: 'skipped', reason: 'Would exceed ' + MAX_VIDEOS + '-video limit' })
        continue
      }

      setProgress('Preparing ' + (i + 1) + ' of ' + fileArray.length + ': ' + file.name)
      setProgressPct(0)

      try {
        // ── Step 1: Get presigned upload URL ──
        const presignRes = await fetch(`/api/display/video/presign?slug=${capsuleSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
          }),
        })

        if (presignRes.status === 409) {
          batchResults.push({ filename: file.name, status: 'duplicate', reason: 'Already uploaded' })
          continue
        }

        if (!presignRes.ok) {
          const data = await presignRes.json().catch(() => ({}))
          batchResults.push({ filename: file.name, status: 'error', reason: data.error || 'Failed to prepare upload' })
          continue
        }

        const presignData = await presignRes.json()
        const { signed_url, storage_path, asset_id, content_type } = presignData

        // ── Step 2: Upload directly to Supabase (bypasses Vercel) ──
        setProgress('Uploading ' + (i + 1) + ' of ' + fileArray.length + ': ' + file.name)

        // Use XMLHttpRequest for upload progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgressPct(Math.round((e.loaded / e.total) * 100))
            }
          })
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve()
            else reject(new Error('Storage upload failed: ' + xhr.status))
          })
          xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
          xhr.open('PUT', signed_url)
          xhr.setRequestHeader('Content-Type', content_type)
          xhr.setRequestHeader('x-upsert', 'false')
          xhr.send(file)
        })

        setProgressPct(100)

        // ── Step 3: Register in DB ──
        setProgress('Saving ' + file.name + '…')
        const registerRes = await fetch(`/api/display/video/register?slug=${capsuleSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id,
            capsule_id: capsuleId,
            storage_path,
            original_filename: file.name,
            mime_type: content_type,
            file_size_bytes: file.size,
          }),
        })

        if (!registerRes.ok) {
          const data = await registerRes.json().catch(() => ({}))
          batchResults.push({ filename: file.name, status: 'error', reason: data.error || 'Failed to save record' })
        } else {
          batchResults.push({ filename: file.name, status: 'uploaded' })
          successCount++
        }

      } catch (err) {
        batchResults.push({
          filename: file.name,
          status: 'error',
          reason: err instanceof Error ? err.message : 'Upload failed',
        })
      }
    }

    setUploading(false)
    setProgress(null)
    setProgressPct(null)
    setResults(batchResults)
    if (successCount > 0) onUploaded()
  }

  // ═══ SECTION 5 — Discard All ═══

  async function handleDiscard() {
    setDiscarding(true)
    try {
      const res = await fetch(`/api/display/video/list?slug=${capsuleSlug}`)
      if (res.ok) {
        const data = await res.json()
        const assets: { id: string }[] = data.assets || []
        await Promise.all(
          assets.map(a => fetch(`/api/display/video/${a.id}?slug=${capsuleSlug}`, { method: 'DELETE' }))
        )
      }
    } catch { /* silent */ }
    setDiscarding(false)
    setDiscardConfirm(false)
    setResults(null)
    onDiscarded()
  }

  // ═══ SECTION 6 — Render ═══

  const atMax = currentCount >= MAX_VIDEOS
  const nearMax = currentCount >= WARN_AT

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

      {nearMax && !atMax && (
        <p style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '4px', padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}>
          {currentCount} of {MAX_VIDEOS} videos uploaded.
        </p>
      )}

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

        {currentCount > 0 && !uploading && (
          <button
            onClick={() => setDiscardConfirm(true)}
            style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.7rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px' }}
          >
            × Discard All Videos
          </button>
        )}
      </div>

      {/* Discard confirmation */}
      {discardConfirm && (
        <div style={{ marginTop: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.875rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#991b1b', margin: '0 0 0.6rem' }}>
            This will permanently remove all {currentCount} uploaded videos and clear the reel. Cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleDiscard} disabled={discarding}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}>
              {discarding ? 'Removing…' : 'Yes, discard all'}
            </button>
            <button onClick={() => setDiscardConfirm(false)}
              style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.3rem', fontStyle: 'italic' }}>
            {progress}
          </p>
          {progressPct !== null && (
            <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{
                background: '#D4AE2A',
                height: '100%',
                width: progressPct + '%',
                transition: 'width 0.2s ease',
                borderRadius: '4px',
              }} />
            </div>
          )}
        </div>
      )}

      {/* Per-file results report */}
      {results && results.length > 0 && (
        <div style={{ marginTop: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#f9fafb', padding: '0.4rem 0.75rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {results.filter(r => r.status === 'uploaded').length} of {results.length} uploaded
            </span>
            <button onClick={() => setResults(null)}
              style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer' }}>
              Dismiss ×
            </button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none', background: '#fff' }}>
                <span style={{ flexShrink: 0, fontSize: '0.85rem', color: r.status === 'uploaded' ? '#16a34a' : r.status === 'duplicate' ? '#D4AE2A' : '#dc2626' }}>
                  {r.status === 'uploaded' ? '✓' : r.status === 'duplicate' ? '≡' : '✕'}
                </span>
                <span style={{ flex: 1, fontSize: '0.8rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.filename}
                </span>
                {r.reason && (
                  <span style={{ fontSize: '0.75rem', flexShrink: 0, color: r.status === 'uploaded' ? '#16a34a' : r.status === 'duplicate' ? '#92400e' : '#dc2626' }}>
                    {r.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.4rem 0 0' }}>
        MP4, MOV, M4V supported · Max 500MB per file · Up to {MAX_VIDEOS} videos
      </p>
    </div>
  )
}
