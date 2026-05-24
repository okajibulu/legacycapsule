'use client'

/* =========================================================
   components/VideoTribute.tsx
   Video file upload for tribute composer.
   Uploads to tribute-video Supabase bucket.
   Max 50MB. Shows thumbnail preview.
   
   Usage in TributeWallClient:
   <VideoTribute onUploaded={(url, thumb) => { setVideoUrl(url); setThumbUrl(thumb) }} capsuleId={capsuleId} t={t} />
========================================================= */

import { useState, useRef } from 'react'
import type { ThemeConfig } from '@/lib/themeConfig'

interface VideoTributeProps {
  onUploaded: (videoUrl: string, thumbnailUrl: string | null) => void
  capsuleId: string
  t: ThemeConfig
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'done'
const MAX_MB = 50

export default function VideoTribute({ onUploaded, capsuleId, t }: VideoTributeProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Video must be under ${MAX_MB}MB`)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setState('selected')
    setError('')
  }

  const generateThumbnail = (videoUrl: string): Promise<string | null> => {
    return new Promise(resolve => {
      try {
        const video = document.createElement('video')
        video.src = videoUrl
        video.currentTime = 1
        video.onloadeddata = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 320; canvas.height = 180
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0, 320, 180)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        video.onerror = () => resolve(null)
        setTimeout(() => resolve(null), 5000)
      } catch { resolve(null) }
    })
  }

  const handleUpload = async () => {
    if (!file || !preview) return
    setState('uploading'); setProgress(10)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      setProgress(30)
      const ext = file.name.split('.').pop() ?? 'mp4'
      const path = `${capsuleId}/${Date.now()}.${ext}`

      const { error: ue } = await supabase.storage
        .from('tribute-video')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (ue) throw ue
      setProgress(80)

      const videoUrl = supabase.storage.from('tribute-video').getPublicUrl(path).data.publicUrl

      // Generate and upload thumbnail
      setProgress(90)
      const thumbDataUrl = await generateThumbnail(preview)
      let thumbPublicUrl: string | null = null

      if (thumbDataUrl) {
        const thumbBlob = await (await fetch(thumbDataUrl)).blob()
        const thumbPath = `${capsuleId}/${Date.now()}_thumb.jpg`
        const { error: te } = await supabase.storage
          .from('tribute-photos')
          .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: false })
        if (!te) {
          thumbPublicUrl = supabase.storage.from('tribute-photos').getPublicUrl(thumbPath).data.publicUrl
        }
      }

      setProgress(100)
      onUploaded(videoUrl, thumbPublicUrl)
      setState('done')
    } catch (err) {
      setError('Upload failed. Please try again.')
      setState('selected')
    }
  }

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null); setPreview(null); setState('idle')
    setProgress(0); setError('')
    onUploaded('', null)
  }

  return (
    <div style={{ borderRadius: '12px', padding: '14px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}`, marginTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>🎬</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Video Tribute</span>
        {state === 'done' && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(134,239,172,0.9)' }}>Attached</span>}
        <button onClick={reset} style={{ marginLeft: 'auto', fontSize: '11px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
      </div>

      {state === 'idle' && (
        <>
          <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: `1px dashed ${t.accentFaint}`, background: 'transparent', color: t.accentMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '24px' }}>📹</span>
            <span>Select video file</span>
            <span style={{ fontSize: '11px', color: t.textFaint, fontWeight: 400 }}>MP4, MOV, WebM — max {MAX_MB}MB</span>
          </button>
          <input ref={fileRef} type="file" accept="video/*" onChange={handleSelect} style={{ display: 'none' }} />
        </>
      )}

      {state === 'selected' && preview && (
        <div>
          <video src={preview} controls style={{ width: '100%', borderRadius: '8px', marginBottom: '10px', maxHeight: '180px', background: '#000' }} />
          <p style={{ fontSize: '11px', color: t.textFaint, marginBottom: '10px', textAlign: 'center' }}>
            {file?.name} · {((file?.size ?? 0) / 1024 / 1024).toFixed(1)}MB
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpload} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Attach to Tribute</button>
            <button onClick={reset} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textFaint, fontSize: '13px', cursor: 'pointer' }}>Change</button>
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: '12px', color: t.accentMuted, marginBottom: '10px', textAlign: 'center' }}>Uploading video…</p>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(to right, ${t.accentPrimary}, ${t.accentMuted})`, borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: '10px', color: t.textFaint, marginTop: '6px', textAlign: 'center' }}>{progress}%</p>
        </div>
      )}

      {state === 'done' && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(134,239,172,0.8)' }}>✓ Video attached — will appear in your card after approval.</p>
        </div>
      )}

      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
    </div>
  )
}
