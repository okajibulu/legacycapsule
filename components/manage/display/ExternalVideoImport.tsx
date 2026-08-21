// ============================================================
// FILE PATH: components/manage/display/ExternalVideoImport.tsx
// PURPOSE:   File picker for organiser-supplied tribute videos.
//            Loose MIME validation — accepts WhatsApp exports,
//            unknown MIME types, validates by extension instead.
//            Max 20 videos. Warning at 10+.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.29
// DATE:      21 August 2026
// ============================================================

'use client'

import { useRef, useState } from 'react'

interface ExternalVideoImportProps {
  capsuleSlug: string
  capsuleId: string
  currentCount: number
  onUploaded: () => void
}

// ── Loose validation — extension based, not MIME ──
const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'MP4', 'MOV', 'm4v', 'M4V', 'mpeg', 'mpg', 'avi', 'webm']
const MAX_VIDEOS = 20
const WARN_AT = 10
const MAX_SIZE_MB = 500

function getExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

export default function ExternalVideoImport({
  capsuleSlug,
  capsuleId,
  currentCount,
  onUploaded,
}: ExternalVideoImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    setError(null)

    const fileArray = Array.from(files)

    // Check total would not exceed max
    if (currentCount + fileArray.length > MAX_VIDEOS) {
      setError('Adding these files would exceed the ' + MAX_VIDEOS + ' video maximum. You currently have ' + currentCount + '.')
      return
    }

    // Validate by extension (not MIME — WhatsApp/various sources use inconsistent MIME)
    const invalid = fileArray.filter(f => !ALLOWED_EXTENSIONS.includes(getExtension(f.name)))
    if (invalid.length > 0) {
      setError('Unsupported format: ' + invalid.map(f => f.name).join(', ') + '. Please upload MP4, MOV, or M4V files.')
      return
    }

    // Size check
    const tooBig = fileArray.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024)
    if (tooBig.length > 0) {
      setError(tooBig.map(f => f.name).join(', ') + ' exceeds the 500MB limit.')
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Non-fatal — continue with remaining files
        setError((data.error || 'Upload failed for ' + file.name) + '. Continuing with remaining files…')
      } else {
        successCount++
      }
    }

    setUploading(false)
    setProgress(null)
    if (successCount > 0) onUploaded()
  }

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
          You have {currentCount} videos. Maximum is {MAX_VIDEOS}.
        </p>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading || atMax}
        style={{
          background: atMax ? '#e5e7eb' : uploading ? 'rgba(212,174,42,0.3)' : '#D4AE2A',
          color: atMax ? '#9ca3af' : '#0D0820',
          border: 'none',
          padding: '0.75rem 1.5rem',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          cursor: uploading || atMax ? 'not-allowed' : 'pointer',
          borderRadius: '6px',
          fontWeight: 600,
        }}
      >
        {atMax ? 'Maximum videos reached' : uploading ? '↑ Uploading…' : '+ Add Tribute Videos'}
      </button>

      {progress && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
          {progress}
        </p>
      )}

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '0.5rem 0 0' }}>
          {error}
        </p>
      )}

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.4rem 0 0' }}>
        MP4, MOV, M4V supported. Max 500MB per file. Up to {MAX_VIDEOS} videos.
      </p>
    </div>
  )
}
