// ============================================================
// FILE PATH: components/display/VideoReelPlayer.tsx
// PURPOSE:   Browser-based video reel playback engine.
//            State machine: opening → items → closing → complete.
//            Pre-resolves all signed URLs before enabling Play.
//            Pre-loads next video while current plays (no gap).
//            Auto-skips failed videos with 2-second pause.
//            Always-visible fading operator control bar.
//            Zero MP4 rendering dependency — plays source files.
// ARCHITECTURE: EDS / EDSVR P0 — Shared Presentation Engine
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import VideoReelBrandOpening from '@/components/display/VideoReelBrandOpening'
import VideoReelBrandClosing from '@/components/display/VideoReelBrandClosing'

// ═══ SECTION 2 — Types ═══

export interface ReelItem {
  id: string           // eds_video_reel_items.id
  assetId: string      // eds_video_assets.id
  sortOrder: number
  displayTitle: string | null
  attribution: string | null
  durationSeconds: number | null
}

export interface ResolvedReelItem extends ReelItem {
  signedUrl: string | null   // null = failed to resolve
  unavailable: boolean
}

interface VideoReelPlayerProps {
  reelItems: ReelItem[]
  capsuleSlug: string
  honoureeName: string
  eventType: string
  theme?: string
  onComplete: () => void
}

// ═══ SECTION 3 — Playback State Machine ═══

type PlaybackState =
  | 'resolving'     // Pre-resolving all signed URLs
  | 'ready'         // URLs resolved, awaiting operator Start
  | 'opening'       // LC brand opening playing
  | 'playing'       // Video item playing
  | 'skipping'      // Error — skip pause (2 seconds)
  | 'closing'       // LC brand closing playing
  | 'complete'      // Reel finished

// ═══ SECTION 4 — Component ═══

export default function VideoReelPlayer({
  reelItems,
  capsuleSlug,
  honoureeName,
  eventType,
  theme = 'default',
  onComplete,
}: VideoReelPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('resolving')
  const [resolvedItems, setResolvedItems] = useState<ResolvedReelItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [skipMessage, setSkipMessage] = useState<string | null>(null)
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const preloadRef = useRef<HTMLVideoElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 4a. Pre-resolve all signed URLs on mount ──
  useEffect(() => {
    async function resolveAll() {
      const results = await Promise.allSettled(
        reelItems.map(async (item) => {
          const res = await fetch(
            `/api/display/video/${item.assetId}/signed-url?slug=${capsuleSlug}&purpose=playback`
          )
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          return { ...item, signedUrl: data.url, unavailable: false } as ResolvedReelItem
        })
      )

      const resolved: ResolvedReelItem[] = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return { ...reelItems[i], signedUrl: null, unavailable: true }
      })

      const unavailableCount = resolved.filter((r) => r.unavailable).length
      if (unavailableCount > 0) {
        setResolutionWarning(
          `${unavailableCount} video${unavailableCount > 1 ? 's' : ''} could not be loaded and will be skipped.`
        )
      }

      setResolvedItems(resolved)
      setPlaybackState('ready')
    }

    resolveAll().catch((err) => {
      console.error('[VideoReelPlayer] Resolution failed:', err)
      setPlaybackState('ready')
    })
  }, [reelItems, capsuleSlug])

  // ── 4b. Controls auto-hide ──
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

  // ── 4c. Play next item in sequence ──
  const playItem = useCallback((index: number, items: ResolvedReelItem[]) => {
    if (index >= items.length) {
      setPlaybackState('closing')
      return
    }

    const item = items[index]
    setCurrentIndex(index)

    if (item.unavailable || !item.signedUrl) {
      // Skip unavailable — auto-advance after 2 seconds
      setSkipMessage(`Video ${index + 1} unavailable — skipping`)
      setPlaybackState('skipping')
      setTimeout(() => {
        setSkipMessage(null)
        playItem(index + 1, items)
      }, 2000)
      return
    }

    setPlaybackState('playing')

    // Pre-load next video while this one starts
    const nextItem = items[index + 1]
    if (nextItem?.signedUrl && preloadRef.current) {
      preloadRef.current.src = nextItem.signedUrl
      preloadRef.current.preload = 'auto'
    }
  }, [])

  // ── 4d. Video element event handlers ──
  const handleVideoEnded = useCallback(() => {
    playItem(currentIndex + 1, resolvedItems)
  }, [currentIndex, resolvedItems, playItem])

  const handleVideoError = useCallback(() => {
    console.error('[VideoReelPlayer] Video error on item', currentIndex)
    setSkipMessage(`Video ${currentIndex + 1} failed — skipping`)
    setPlaybackState('skipping')
    setTimeout(() => {
      setSkipMessage(null)
      playItem(currentIndex + 1, resolvedItems)
    }, 2000)
  }, [currentIndex, resolvedItems, playItem])

  // ── 4e. Wire video element to current item ──
  useEffect(() => {
    if (playbackState !== 'playing') return
    const item = resolvedItems[currentIndex]
    if (!item?.signedUrl || !videoRef.current) return

    videoRef.current.src = item.signedUrl
    videoRef.current.play().catch((err) => {
      console.error('[VideoReelPlayer] Play failed:', err)
      handleVideoError()
    })
  }, [playbackState, currentIndex, resolvedItems, handleVideoError])

  // ── 4f. Pause / resume ──
  useEffect(() => {
    if (!videoRef.current || playbackState !== 'playing') return
    if (isPaused) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(() => {})
    }
  }, [isPaused, playbackState])

  // ── 4g. Operator actions ──
  const handleStart = () => {
    setPlaybackState('opening')
  }

  const handlePauseResume = () => {
    setIsPaused((p) => !p)
  }

  const handleSkip = () => {
    if (playbackState === 'playing') {
      if (videoRef.current) videoRef.current.pause()
      playItem(currentIndex + 1, resolvedItems)
    }
  }

  const handleRestart = () => {
    if (videoRef.current) videoRef.current.pause()
    setCurrentIndex(0)
    setIsPaused(false)
    setPlaybackState('opening')
  }

  // ── 4h. Opening complete → start first video ──
  const handleOpeningComplete = useCallback(() => {
    playItem(0, resolvedItems)
  }, [resolvedItems, playItem])

  // ── 4i. Closing complete ──
  const handleClosingComplete = useCallback(() => {
    setPlaybackState('complete')
    onComplete()
  }, [onComplete])

  const availableItems = resolvedItems.filter((r) => !r.unavailable)

  // ═══ SECTION 5 — Render ═══

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 50,
      }}
      onClick={resetControlsTimer}
    >
      {/* Hidden preload element */}
      <video ref={preloadRef} style={{ display: 'none' }} />

      {/* ── Resolving state ── */}
      {playbackState === 'resolving' && (
        <div style={centreStyle}>
          <p style={statusTextStyle}>Preparing reel…</p>
        </div>
      )}

      {/* ── Ready state — pre-play screen ── */}
      {playbackState === 'ready' && (
        <div style={{ ...centreStyle, flexDirection: 'column', gap: '1.5rem', background: '#0D0820' }}>
          {resolutionWarning && (
            <p style={{
              color: '#D4AE2A',
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              fontSize: '1rem',
              textAlign: 'center',
              maxWidth: '500px',
              opacity: 0.9,
              margin: 0,
            }}>
              ⚠ {resolutionWarning}
            </p>
          )}
          <p style={{
            color: '#F5F3EE',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
            margin: 0,
            opacity: 0.7,
          }}>
            {availableItems.length} video{availableItems.length !== 1 ? 's' : ''} ready
          </p>
          <button
            onClick={handleStart}
            style={{
              background: '#D4AE2A',
              color: '#0D0820',
              border: 'none',
              padding: '1rem 3rem',
              fontSize: '1.2rem',
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              borderRadius: '4px',
              letterSpacing: '0.05em',
            }}
          >
            ▶ Start Reel
          </button>
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

      {/* ── Video playback ── */}
      {(playbackState === 'playing' || playbackState === 'skipping') && (
        <video
          ref={videoRef}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
            display: playbackState === 'playing' ? 'block' : 'none',
          }}
        />
      )}

      {/* ── Skip message overlay ── */}
      {playbackState === 'skipping' && skipMessage && (
        <div style={{ ...centreStyle, background: 'rgba(13,8,32,0.9)' }}>
          <p style={statusTextStyle}>{skipMessage}</p>
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

      {/* ── Complete state ── */}
      {playbackState === 'complete' && (
        <div style={{ ...centreStyle, flexDirection: 'column', gap: '1.5rem', background: '#0D0820' }}>
          <p style={{
            color: '#D4AE2A',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
          }}>
            ✦ Reel Complete ✦
          </p>
          <button onClick={handleRestart} style={controlBtnStyle}>
            ↺ Replay Reel
          </button>
        </div>
      )}

      {/* ═══ SECTION 6 — Operator Control Bar ═══ */}
      {['playing', 'skipping', 'opening', 'closing'].includes(playbackState) && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'rgba(13,8,32,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.4s ease',
          zIndex: 60,
          borderTop: '1px solid rgba(212,174,42,0.2)',
        }}>
          {/* Pause/Resume */}
          <button
            onClick={handlePauseResume}
            style={controlBtnStyle}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            style={controlBtnStyle}
            disabled={playbackState !== 'playing'}
            title="Skip to next"
          >
            ⏭ Skip
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            style={{ ...controlBtnStyle, opacity: 0.7 }}
            title="Restart reel"
          >
            ↺ Restart
          </button>

          {/* Item counter */}
          {playbackState === 'playing' && resolvedItems.length > 0 && (
            <span style={{
              color: '#D4AE2A',
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              fontSize: '0.85rem',
              opacity: 0.7,
              position: 'absolute',
              right: '1.5rem',
            }}>
              {currentIndex + 1} / {resolvedItems.length}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 7 — Shared Styles ═══

const centreStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const statusTextStyle: React.CSSProperties = {
  color: '#F5F3EE',
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(1rem, 2vw, 1.4rem)',
  margin: 0,
  opacity: 0.8,
}

const controlBtnStyle: React.CSSProperties = {
  background: 'rgba(212,174,42,0.15)',
  color: '#D4AE2A',
  border: '1px solid rgba(212,174,42,0.4)',
  padding: '0.5rem 1.25rem',
  fontSize: '0.9rem',
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  cursor: 'pointer',
  borderRadius: '4px',
  letterSpacing: '0.03em',
  transition: 'background 0.2s',
}
