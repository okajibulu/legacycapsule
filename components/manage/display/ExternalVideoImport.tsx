// ============================================================
// FILE PATH: components/manage/display/ExternalVideoImport.tsx
// PURPOSE:   File picker for organiser-supplied tribute videos.
//            Validates file type client-side before upload.
//            Shows upload progress. Calls /api/display/video/import.
//            On success: notifies parent to refresh library.
//            On error: shows clear rejection message.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

import { useRef, useState } from 'react'

interface ExternalVideoImportProps {
  capsuleSlug: string
  capsuleId: string
  onUploaded: () => void  // parent refreshes library
}

export default function ExternalVideoImport({
  capsuleSlug,
  capsuleId,
  onUploaded,
}: ExternalVideoImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    const valid = Array.from(files).filter((f) =>
      ['video/mp4', 'video/quicktime'].includes(f.type)
    )
    const invalid = Array.from(files).filter(
      (f) => !['video/mp4', 'video/quicktime'].includes(f.type)
    )

    if (invalid.length > 0) {
      setError(`Unsupported file type. Please upload MP4 or MOV files only.`)
      return
    }

    if (valid.length === 0) return

    setUploading(true)
    let successCount = 0

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i]
      setProgress(`Uploading ${i + 1} of ${valid.length}: ${file.name}`)

      const formData = new FormData()
      formData.append('file', file)
      // capsule_id included for route but auth derives authoritative capsuleId server-side
      formData.append('capsule_id', capsuleId)

      const res = await fetch(`/api/display/video/import?slug=${capsuleSlug}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Failed to upload ${file.name}.`)
        break
      }

      successCount++
    }

    setUploading(false)
    setProgress(null)

    if (successCount > 0) {
      onUploaded()
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov,.MOV,.MP4"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = '' // allow re-upload of same file
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          background: uploading ? 'rgba(212,174,42,0.3)' : '#D4AE2A',
          color: '#0D0820',
          border: 'none',
          padding: '0.75rem 1.5rem',
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          cursor: uploading ? 'not-allowed' : 'pointer',
          borderRadius: '6px',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        {uploading ? '↑ Uploading…' : '+ Add Tribute Videos'}
      </button>

      {progress && (
        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
          {progress}
        </p>
      )}

      {error && (
        <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: '0.5rem 0 0' }}>
          {error}
        </p>
      )}

      <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.5rem 0 0' }}>
        MP4 and MOV files supported. Maximum 500MB per file.
      </p>
    </div>
  )
}
