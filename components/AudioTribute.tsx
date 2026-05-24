'use client'

/* =========================================================
   components/AudioTribute.tsx
   Audio tribute recorder for the composer.
   Uses browser MediaRecorder API.
   Uploads to tribute-audio Supabase bucket.
   
   Usage in TributeWallClient:
   <AudioTribute onRecorded={(url) => setAudioUrl(url)} theme={t} />
========================================================= */

import { useState, useRef, useEffect } from 'react'
import type { ThemeConfig } from '@/lib/themeConfig'

interface AudioTributeProps {
  onRecorded: (url: string | null) => void
  capsuleId: string
  t: ThemeConfig
}

type RecordState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'done'

export default function AudioTribute({ onRecorded, capsuleId, t }: AudioTributeProps) {
  const [state, setState] = useState<RecordState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_SECONDS = 120 // 2 minutes max

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorder.current = mr
      chunks.current = []

      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState('recorded')
        stream.getTracks().forEach(t => t.stop())
      }

      mr.start(100)
      setState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= MAX_SECONDS - 1) {
            stopRecording()
            return MAX_SECONDS
          }
          return d + 1
        })
      }, 1000)
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
  }

  const uploadAudio = async () => {
    if (!audioUrl || chunks.current.length === 0) return
    setState('uploading')
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const blob = new Blob(chunks.current, { type: 'audio/webm' })
      const path = `${capsuleId}/${Date.now()}.webm`

      const { error: ue } = await supabase.storage
        .from('tribute-audio')
        .upload(path, blob, { contentType: 'audio/webm', upsert: false })

      if (ue) throw ue

      const publicUrl = supabase.storage.from('tribute-audio').getPublicUrl(path).data.publicUrl
      onRecorded(publicUrl)
      setState('done')
    } catch (err) {
      setError('Upload failed. Please try again.')
      setState('recorded')
    }
  }

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null); setState('idle'); setDuration(0); setError('')
    onRecorded(null)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ borderRadius: '12px', padding: '14px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}`, marginTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>🎙️</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Voice Tribute</span>
        {state === 'done' && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(134,239,172,0.9)' }}>Attached</span>}
        <button onClick={reset} style={{ marginLeft: 'auto', fontSize: '11px', color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
      </div>

      {state === 'idle' && (
        <button onClick={startRecording} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${t.accentFaint}`, background: 'transparent', color: t.accentPrimary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          Start Recording
        </button>
      )}

      {state === 'recording' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Recording</span>
            </div>
            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: t.textBody }}>{formatTime(duration)} / {formatTime(MAX_SECONDS)}</span>
          </div>
          {/* Waveform bars — animated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '32px', marginBottom: '10px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ flex: 1, background: t.accentPrimary, borderRadius: '2px', opacity: 0.6 + Math.random() * 0.4, animation: `waveBar${i % 5} ${0.4 + Math.random() * 0.4}s ease-in-out infinite alternate` }} />
            ))}
          </div>
          <button onClick={stopRecording} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            ■ Stop Recording
          </button>
        </div>
      )}

      {state === 'recorded' && audioUrl && (
        <div>
          <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '10px', borderRadius: '8px' }} />
          <p style={{ fontSize: '11px', color: t.textFaint, marginBottom: '10px', textAlign: 'center' }}>{formatTime(duration)} recorded</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={uploadAudio} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Attach to Tribute</button>
            <button onClick={reset} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textFaint, fontSize: '13px', cursor: 'pointer' }}>Redo</button>
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <div style={{ textAlign: 'center', padding: '12px' }}>
          <p style={{ fontSize: '13px', color: t.accentMuted }}>Uploading voice tribute…</p>
        </div>
      )}

      {state === 'done' && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(134,239,172,0.8)' }}>✓ Voice tribute attached — will appear in your card after approval.</p>
        </div>
      )}

      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', marginTop: '8px', textAlign: 'center' }}>{error}</p>}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes waveBar0 { from { height: 4px } to { height: 28px } }
        @keyframes waveBar1 { from { height: 8px } to { height: 24px } }
        @keyframes waveBar2 { from { height: 12px } to { height: 32px } }
        @keyframes waveBar3 { from { height: 6px } to { height: 20px } }
        @keyframes waveBar4 { from { height: 10px } to { height: 28px } }
      `}</style>
    </div>
  )
}
