// ============================================================
// FILE PATH: components/display/VideoReelPlayer.tsx
// PURPOSE:   Premium browser-based video reel playback engine.
//            State machine: opening → items (with photo breaks
//            and transition cards) → closing → complete.
//            Features:
//              - LC frozen footer strip + honouree watermark
//              - Attribution lower-third overlay (documentary)
//              - Transition title card between clips (1.5s)
//              - Photo break cards auto-slotted between tributes
//              - Persistent mini-QR fixed bottom-right
//              - Pre-resolves all signed URLs before Play
//              - Pre-loads next video during current playback
//              - Auto-skips failed videos with premium error card
//              - Always-visible fading operator control bar
//              - Loose MIME acceptance for WhatsApp exports
// ARCHITECTURE: EDS / EDSVR P0 — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.29
// DATE:      21 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import VideoReelBrandOpening from '@/components/display/VideoReelBrandOpening'
import VideoReelBrandClosing from '@/components/display/VideoReelBrandClosing'
import QRCode from 'qrcode'

// ═══ SECTION 2 — Types ═══

export interface ReelItem {
  id: string
  assetId: string
  sortOrder: number
  displayTitle: string | null
  attribution: string | null
  durationSeconds: number | null
}

export interface ReelPhotoItem {
  id: string
  image_url: string
  caption: string | null
}

export interface ResolvedReelItem extends ReelItem {
  signedUrl: string | null
  unavailable: boolean
}

// Sequence item — video or photo break
type SequenceItem =
  | { kind: 'video'; item: ResolvedReelItem; index: number }
  | { kind: 'photo'; photo: ReelPhotoItem; photoIndex: number }

interface VideoReelPlayerProps {
  reelItems: ReelItem[]
  photos: ReelPhotoItem[]
  capsuleSlug: string
  capsuleUrl: string
  honoureeName: string
  eventType: string
  theme?: string
  onComplete: () => void
}

// ═══ SECTION 3 — Auto-slot Formula ═══
// Evenly distributes photos as breaks between video tributes.

function buildSequence(videos: ResolvedReelItem[], photos: ReelPhotoItem[]): SequenceItem[] {
  if (photos.length === 0) {
    return videos.map((item, index) => ({ kind: 'video', item, index }))
  }

  const tributeCount = videos.length
  const photoCount = photos.length
  const gap = Math.max(5, Math.min(20, Math.floor(tributeCount / photoCount)))

  const sequence: SequenceItem[] = []
  let photoIdx = 0

  videos.forEach((item, index) => {
    sequence.push({ kind: 'video', item, index })
    // Insert photo break after every `gap` tributes
    if ((index + 1) % gap === 0 && photoIdx < photoCount) {
      sequence.push({ kind: 'photo', photo: photos[photoIdx], photoIndex: photoIdx })
      photoIdx++
    }
  })

  return sequence
}

// ═══ SECTION 4 — Playback State ═══

type PlaybackState =
  | 'resolving'
  | 'ready'
  | 'opening'
  | 'transition'   // Title card between items
  | 'playing'      // Video playing
  | 'photo'        // Photo break
  | 'skipping'
  | 'closing'
  | 'complete'

// ═══ SECTION 5 — Component ═══

export default function VideoReelPlayer({
  reelItems,
  photos,
  capsuleSlug,
  capsuleUrl,
  honoureeName,
  eventType,
  theme = 'default',
  onComplete,
}: VideoReelPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('resolving')
  const [resolvedItems, setResolvedItems] = useState<ResolvedReelItem[]>([])
  const [sequence, setSequence] = useState<SequenceItem[]>([])
  const [currentSeqIndex, setCurrentSeqIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [skipMessage, setSkipMessage] = useState<string | null>(null)
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(null)
  const [attributionVisible, setAttributionVisible] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [currentAttribution, setCurrentAttribution] = useState<{ name: string | null; title: string | null } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const preloadRef = useRef<HTMLVideoElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const photoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attributionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 5a. Pre-generate QR ──
  useEffect(() => {
    QRCode.toDataURL(capsuleUrl, {
      width: 120, margin: 1,
      color: { dark: '#0D0820', light: '#F5F3EE' },
    }).then(setQrDataUrl).catch(() => {})
  }, [capsuleUrl])

  // ── 5b. Pre-resolve all signed URLs ──
  useEffect(() => {
    async function resolveAll() {
      const results = await Promise.allSettled(
        reelItems.map(async (item) => {
          const res = await fetch(`/api/display/video/${item.assetId}/signed-url?slug=${capsuleSlug}&purpose=playback`)
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const data = await res.json()
          return { ...item, signedUrl: data.url, unavailable: false } as ResolvedReelItem
        })
      )

      const resolved: ResolvedReelItem[] = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return { ...reelItems[i], signedUrl: null, unavailable: true }
      })

      const unavailableCount = resolved.filter(r => r.unavailable).length
      if (unavailableCount > 0) {
        setResolutionWarning(unavailableCount + ' video' + (unavailableCount > 1 ? 's' : '') + ' could not be loaded and will be skipped.')
      }

      setResolvedItems(resolved)
      const seq = buildSequence(resolved, photos)
      setSequence(seq)
      setPlaybackState('ready')
    }

    resolveAll().catch(() => setPlaybackState('ready'))
  }, [reelItems, photos, capsuleSlug])

  // ── 5c. Controls auto-hide ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resetControlsTimer)
    window.addEventListener('keydown', resetControlsTimer)
    resetControlsTimer()
    return () => {
      window.removeEventListener('mousemove', resetControlsTimer)
      window.removeEventListener('keydown', resetControlsTimer)
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [resetControlsTimer])

  // ── 5d. Attribution lower-third ──
  function showAttribution(name: string | null, title: string | null) {
    if (!name && !title) return
    setCurrentAttribution({ name, title })
    setAttributionVisible(true)
    if (attributionTimerRef.current) clearTimeout(attributionTimerRef.current)
    attributionTimerRef.current = setTimeout(() => setAttributionVisible(false), 4000)
  }

  // ── 5e. Play sequence item ──
  const playSequenceItem = useCallback((seqIndex: number, seq: SequenceItem[]) => {
    if (seqIndex >= seq.length) {
      setPlaybackState('closing')
      return
    }

    setCurrentSeqIndex(seqIndex)
    const seqItem = seq[seqIndex]

    if (seqItem.kind === 'photo') {
      setPlaybackState('photo')
      photoTimerRef.current = setTimeout(() => {
        playSequenceItem(seqIndex + 1, seq)
      }, 5000)
      return
    }

    // Video item
    const item = seqItem.item
    if (item.unavailable || !item.signedUrl) {
      setSkipMessage('This tribute could not be loaded')
      setPlaybackState('skipping')
      setTimeout(() => {
        setSkipMessage(null)
        playSequenceItem(seqIndex + 1, seq)
      }, 2000)
      return
    }

    // Show transition title card for 1.5s
    setPlaybackState('transition')
    transitionTimerRef.current = setTimeout(() => {
      setPlaybackState('playing')
      // Pre-load next video
      const nextSeqItem = seq[seqIndex + 1]
      if (nextSeqItem?.kind === 'video' && nextSeqItem.item.signedUrl && preloadRef.current) {
        preloadRef.current.src = nextSeqItem.item.signedUrl
        preloadRef.current.preload = 'auto'
      }
      // Show attribution lower-third
      showAttribution(item.attribution, item.displayTitle)
    }, 1500)
  }, [])

  // ── 5f. Wire video element ──
  const handleVideoEnded = useCallback(() => {
    playSequenceItem(currentSeqIndex + 1, sequence)
  }, [currentSeqIndex, sequence, playSequenceItem])

  const handleVideoError = useCallback(() => {
    setSkipMessage('This tribute could not be loaded')
    setPlaybackState('skipping')
    setTimeout(() => {
      setSkipMessage(null)
      playSequenceItem(currentSeqIndex + 1, sequence)
    }, 2000)
  }, [currentSeqIndex, sequence, playSequenceItem])

  useEffect(() => {
    if (playbackState !== 'playing') return
    const seqItem = sequence[currentSeqIndex]
    if (!seqItem || seqItem.kind !== 'video') return
    const item = seqItem.item
    if (!item.signedUrl || !videoRef.current) return
    videoRef.current.src = item.signedUrl
    videoRef.current.play().catch(handleVideoError)
  }, [playbackState, currentSeqIndex, sequence, handleVideoError])

  useEffect(() => {
    if (!videoRef.current || playbackState !== 'playing') return
    if (isPaused) videoRef.current.pause()
    else videoRef.current.play().catch(() => {})
  }, [isPaused, playbackState])

  // ── 5g. Operator actions ──
  const handleStart = () => setPlaybackState('opening')

  const handlePauseResume = () => {
    setIsPaused(p => !p)
    if (playbackState === 'photo' && !isPaused) {
      if (photoTimerRef.current) clearTimeout(photoTimerRef.current)
    }
  }

  const handleSkip = () => {
    if (playbackState === 'playing' && videoRef.current) videoRef.current.pause()
    if (photoTimerRef.current) clearTimeout(photoTimerRef.current)
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    playSequenceItem(currentSeqIndex + 1, sequence)
  }

  const handleRestart = () => {
    if (videoRef.current) videoRef.current.pause()
    if (photoTimerRef.current) clearTimeout(photoTimerRef.current)
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    setIsPaused(false)
    setPlaybackState('opening')
  }

  const handleOpeningComplete = useCallback(() => {
    playSequenceItem(0, sequence)
  }, [sequence, playSequenceItem])

  const handleClosingComplete = useCallback(() => {
    setPlaybackState('complete')
    onComplete()
  }, [onComplete])

  // ── 5h. Current video item for display ──
  const currentVideoItem = useMemo(() => {
    const seqItem = sequence[currentSeqIndex]
    if (!seqItem || seqItem.kind !== 'video') return null
    return seqItem.item
  }, [sequence, currentSeqIndex])

  const currentPhotoItem = useMemo(() => {
    const seqItem = sequence[currentSeqIndex]
    if (!seqItem || seqItem.kind !== 'photo') return null
    return seqItem.photo
  }, [sequence, currentSeqIndex])

  const videoCount = resolvedItems.filter(r => !r.unavailable).length
  const totalItems = sequence.length

  // ═══ SECTION 6 — Render ═══

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50 }}
      onClick={resetControlsTimer}
    >
      {/* Hidden preload element */}
      <video ref={preloadRef} style={{ display: 'none' }} />

      {/* ── Resolving ── */}
      {playbackState === 'resolving' && (
        <div style={centreStyle}>
          <p style={statusTextStyle}>Preparing reel…</p>
        </div>
      )}

      {/* ── Ready — pre-play screen ── */}
      {playbackState === 'ready' && (
        <div style={{ ...centreStyle, flexDirection: 'column', gap: '1.5rem', background: '#0D0820' }}>
          <div style={{ color: '#D4AE2A', fontSize: '1.5rem', letterSpacing: '0.5rem' }}>✦ ─── ✦</div>
          <h1 style={{ color: '#F5F3EE', fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 'normal', margin: 0, textAlign: 'center', maxWidth: '80vw' }}>
            {honoureeName}
          </h1>
          {resolutionWarning && (
            <p style={{ color: '#D4AE2A', fontFamily: 'sans-serif', fontSize: '0.95rem', textAlign: 'center', maxWidth: '500px', opacity: 0.9, margin: 0 }}>
              ⚠ {resolutionWarning}
            </p>
          )}
          <p style={{ color: '#F5F3EE', fontFamily: 'Georgia, serif', fontSize: 'clamp(1rem,1.8vw,1.4rem)', margin: 0, opacity: 0.6 }}>
            {videoCount} tribute video{videoCount !== 1 ? 's' : ''}
            {photos.length > 0 ? ' · ' + photos.length + ' photos' : ''}
          </p>
          <button onClick={handleStart} style={startBtnStyle}>▶ Start Reel</button>
        </div>
      )}

      {/* ── LC Brand Opening ── */}
      {playbackState === 'opening' && (
        <VideoReelBrandOpening
          honoureeName={honoureeName}
          eventType={eventType}
          theme={theme}
          durationSecs={5}
          onComplete={handleOpeningComplete}
        />
      )}

      {/* ── Transition title card ── */}
      {playbackState === 'transition' && currentVideoItem && (
        <div style={{ ...centreStyle, flexDirection: 'column', gap: '1rem', background: '#0D0820' }}>
          <div style={{ color: '#D4AE2A', opacity: 0.6, fontSize: '1rem' }}>✦</div>
          {(currentVideoItem.attribution || currentVideoItem.displayTitle) && (
            <>
              <h2 style={{ color: '#D4AE2A', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'normal', margin: 0, textAlign: 'center' }}>
                {currentVideoItem.displayTitle || currentVideoItem.attribution}
              </h2>
              {currentVideoItem.displayTitle && currentVideoItem.attribution && (
                <p style={{ color: '#F5F3EE', fontFamily: 'sans-serif', fontSize: 'clamp(0.9rem,1.6vw,1.1rem)', margin: 0, opacity: 0.6, fontStyle: 'italic' }}>
                  {currentVideoItem.attribution}
                </p>
              )}
            </>
          )}
          <div style={{ color: '#D4AE2A', opacity: 0.3, fontSize: '0.8rem' }}>✦</div>
        </div>
      )}

      {/* ── Video playback ── */}
      {(playbackState === 'playing' || playbackState === 'skipping') && (
        <video
          ref={videoRef}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            background: '#000',
            display: playbackState === 'playing' ? 'block' : 'none',
          }}
        />
      )}

      {/* ── Error/skip card ── */}
      {playbackState === 'skipping' && skipMessage && (
        <div style={{ ...centreStyle, flexDirection: 'column', gap: '1rem', background: 'rgba(13,8,32,0.95)' }}>
          <div style={{ color: '#D4AE2A', opacity: 0.4, fontSize: '1rem' }}>✦</div>
          <p style={{ color: '#F5F3EE', fontFamily: 'Georgia, serif', fontSize: '1.2rem', margin: 0, opacity: 0.7, fontStyle: 'italic' }}>
            {skipMessage}
          </p>
        </div>
      )}

      {/* ── Photo break card ── */}
      {playbackState === 'photo' && currentPhotoItem && (
        <div style={{ position: 'fixed', inset: 0, background: '#0D0820', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}>
          {/* Photo label strip */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '42px',
            background: 'rgba(13,8,32,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(212,174,42,0.2)',
          }}>
            <span style={{ color: '#D4AE2A', fontSize: '0.75rem', letterSpacing: '0.2em', fontFamily: 'Georgia, serif', opacity: 0.8 }}>
              ✦ &nbsp; Photo &nbsp; ✦
            </span>
          </div>

          {/* Photo */}
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 3rem 2rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhotoItem.image_url}
              alt={currentPhotoItem.caption || ''}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
            />
          </div>

          {/* Caption */}
          {currentPhotoItem.caption && (
            <div style={{ padding: '0.75rem 3rem 2rem', textAlign: 'center' }}>
              <p style={{ color: '#F5F3EE', fontFamily: 'Georgia, serif', fontSize: 'clamp(1rem,1.8vw,1.3rem)', margin: 0, fontStyle: 'italic', opacity: 0.85 }}>
                {currentPhotoItem.caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── LC Brand Closing ── */}
      {playbackState === 'closing' && (
        <VideoReelBrandClosing
          honoureeName={honoureeName}
          eventType={eventType}
          theme={theme}
          durationSecs={6}
          onComplete={handleClosingComplete}
        />
      )}

      {/* ── Complete ── */}
      {playbackState === 'complete' && (
        <div style={{ ...centreStyle, flexDirection: 'column', gap: '1.5rem', background: '#0D0820' }}>
          <p style={{ color: '#D4AE2A', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.2rem,2vw,1.8rem)' }}>✦ Reel Complete ✦</p>
          <button onClick={handleRestart} style={controlBtnStyle}>↺ Replay Reel</button>
        </div>
      )}

      {/* ═══ SECTION 7 — Persistent overlays ═══ */}

      {/* Honouree name watermark — bottom left */}
      {['playing', 'photo', 'transition'].includes(playbackState) && (
        <div style={{
          position: 'fixed',
          bottom: '52px',
          left: '1.5rem',
          zIndex: 55,
          color: '#D4AE2A',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(0.7rem,1.2vw,0.9rem)',
          fontStyle: 'italic',
          opacity: 0.25,
          pointerEvents: 'none',
          letterSpacing: '0.05em',
        }}>
          {honoureeName}
        </div>
      )}

      {/* Attribution lower-third — fades in then out */}
      {playbackState === 'playing' && currentAttribution && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '2rem',
          zIndex: 56,
          opacity: attributionVisible ? 1 : 0,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(13,8,32,0.82)',
            borderLeft: '3px solid #D4AE2A',
            padding: '0.5rem 0.875rem',
            backdropFilter: 'blur(4px)',
          }}>
            {currentAttribution.title && (
              <p style={{ color: '#F5F3EE', fontFamily: 'Georgia, serif', fontSize: 'clamp(0.9rem,1.5vw,1.1rem)', margin: 0, fontWeight: 'normal' }}>
                {currentAttribution.title}
              </p>
            )}
            {currentAttribution.name && (
              <p style={{ color: '#D4AE2A', fontFamily: 'sans-serif', fontSize: 'clamp(0.75rem,1.2vw,0.9rem)', margin: currentAttribution.title ? '0.1rem 0 0' : 0, opacity: 0.85 }}>
                {currentAttribution.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Persistent mini-QR — bottom right */}
      {['playing', 'photo', 'transition', 'opening', 'closing'].includes(playbackState) && qrDataUrl && (
        <div style={{
          position: 'fixed',
          bottom: '52px',
          right: '1rem',
          zIndex: 55,
          background: 'rgba(13,8,32,0.75)',
          border: '1px solid rgba(212,174,42,0.35)',
          borderRadius: '6px',
          padding: '0.4rem',
          backdropFilter: 'blur(4px)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Scan to participate" style={{ display: 'block', width: '80px', height: '80px' }} />
          <p style={{ color: '#D4AE2A', fontFamily: 'sans-serif', fontSize: '0.55rem', textAlign: 'center', margin: '0.2rem 0 0', opacity: 0.7, letterSpacing: '0.05em' }}>
            SCAN TO JOIN
          </p>
        </div>
      )}

      {/* ═══ SECTION 8 — LC Footer Strip ═══ */}
      {['playing', 'photo', 'transition', 'opening', 'closing', 'skipping'].includes(playbackState) && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: '42px',
          background: 'rgba(13,8,32,0.9)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(212,174,42,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          zIndex: 54,
        }}>
          <span style={{ color: '#D4AE2A', fontFamily: 'Georgia, serif', fontSize: '0.65rem', letterSpacing: '0.18em', opacity: 0.7 }}>
            LegacyCapsule &middot; itslegacycapsule.com
          </span>
          <span style={{ color: '#D4AE2A', fontFamily: 'sans-serif', fontSize: '0.65rem', opacity: 0.6, letterSpacing: '0.05em' }}>
            {currentSeqIndex + 1} of {totalItems}
          </span>
        </div>
      )}

      {/* ═══ SECTION 9 — Operator Control Bar ═══ */}
      {['playing', 'photo', 'skipping', 'opening', 'closing', 'transition'].includes(playbackState) && (
        <div style={{
          position: 'fixed',
          bottom: '42px', left: 0, right: 0,
          height: '58px',
          background: 'rgba(13,8,32,0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.4s ease',
          zIndex: 60,
          borderTop: '1px solid rgba(212,174,42,0.15)',
        }}>
          <button onClick={handlePauseResume} style={controlBtnStyle} title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={handleSkip} style={controlBtnStyle} title="Skip">⏭ Skip</button>
          <button onClick={handleRestart} style={{ ...controlBtnStyle, opacity: 0.65 }} title="Restart">↺ Restart</button>
          <span style={{ position: 'absolute', right: '7rem', color: '#D4AE2A', fontFamily: 'sans-serif', fontSize: '0.75rem', opacity: 0.6 }}>
            {playbackState === 'photo' ? '— Photo —' : currentVideoItem?.attribution || ''}
          </span>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 10 — Shared Styles ═══

const centreStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const statusTextStyle: React.CSSProperties = {
  color: '#F5F3EE', fontFamily: 'Georgia, serif',
  fontSize: 'clamp(1rem,2vw,1.4rem)', margin: 0, opacity: 0.8,
}

const startBtnStyle: React.CSSProperties = {
  background: '#D4AE2A', color: '#0D0820',
  border: 'none', padding: '1rem 3rem',
  fontSize: '1.2rem', fontFamily: 'Georgia, serif',
  cursor: 'pointer', borderRadius: '4px', letterSpacing: '0.05em',
}

const controlBtnStyle: React.CSSProperties = {
  background: 'rgba(212,174,42,0.15)',
  color: '#D4AE2A',
  border: '1px solid rgba(212,174,42,0.4)',
  padding: '0.45rem 1.1rem',
  fontSize: '0.85rem',
  fontFamily: 'sans-serif',
  cursor: 'pointer',
  borderRadius: '4px',
  letterSpacing: '0.03em',
  transition: 'background 0.2s',
}
