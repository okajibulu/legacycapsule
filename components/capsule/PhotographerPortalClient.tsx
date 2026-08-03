// ============================================================
// FILE PATH: components/capsule/PhotographerPortalClient.tsx
// PURPOSE:   Client component for Official Photography Portal.
//            Premium branded upload interface for photographers.
//            Shows existing uploads, cap status, multi-file upload,
//            per-file progress, confirmation state.
//            No organiser account required — token-gated only.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.17
// DATE:      2 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports & types ═══

import { useState, useRef, useCallback } from 'react'

interface ExistingPhoto {
  id:         string
  image_url:  string
  created_at: string
}

interface PhotographerPortalClientProps {
  token:    string
  expired:  boolean
  phase: {
    id:         string
    name:       string
    event_date: string | null
    location:   string | null
  }
  capsule: {
    slug:           string
    honouree_name:  string
    event_tag:      string | null
    hero_image_url: string | null
  }
  existingPhotos: ExistingPhoto[]
  uploaded:       number
  remaining:      number
  cap:            number
}

interface UploadItem {
  file:     File
  status:   'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?:   string
  imageUrl?: string
}

// ═══ SECTION 2 — Design tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.08)'
const goldBorder  = 'rgba(226,195,107,0.2)'
const pageBg      = '#0f0a1e'
const cardBg      = 'rgba(255,255,255,0.04)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.35)'
const textMuted   = 'rgba(255,255,255,0.55)'

// ═══ SECTION 3 — Date formatter ═══

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ═══ SECTION 4 — Main component ═══

export default function PhotographerPortalClient({
  token, expired, phase, capsule,
  existingPhotos, uploaded, remaining, cap,
}: PhotographerPortalClientProps) {

  const [queue,         setQueue]         = useState<UploadItem[]>([])
  const [isDragging,    setIsDragging]    = useState(false)
  const [currentUploaded, setCurrentUploaded] = useState(uploaded)
  const [currentRemaining, setCurrentRemaining] = useState(remaining)
  const [photos,        setPhotos]        = useState<ExistingPhoto[]>(existingPhotos)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ═══ SECTION 5 — Upload handler ═══

  const uploadFile = useCallback(async (file: File, index: number) => {
    setQueue(prev => prev.map((item, i) =>
      i === index ? { ...item, status: 'uploading', progress: 10 } : item
    ))

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch(`/api/photographer/${token}/upload`, {
        method: 'POST',
        body:   form,
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setQueue(prev => prev.map((item, i) =>
          i === index
            ? { ...item, status: 'error', progress: 0, error: data.message ?? data.error ?? 'Upload failed' }
            : item
        ))
        return
      }

      setQueue(prev => prev.map((item, i) =>
        i === index
          ? { ...item, status: 'done', progress: 100, imageUrl: data.image_url }
          : item
      ))

      setCurrentUploaded(data.uploaded)
      setCurrentRemaining(data.remaining)
      setPhotos(prev => [{
        id:         data.photo_id,
        image_url:  data.image_url,
        created_at: new Date().toISOString(),
      }, ...prev])

    } catch (e: any) {
      setQueue(prev => prev.map((item, i) =>
        i === index
          ? { ...item, status: 'error', progress: 0, error: 'Connection error. Please try again.' }
          : item
      ))
    }
  }, [token])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr       = Array.from(files)
    const allowed   = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    const valid     = arr.filter(f => allowed.includes(f.type.toLowerCase()))
    const startIdx  = queue.length

    const newItems: UploadItem[] = valid.map(file => ({
      file, status: 'pending', progress: 0,
    }))

    setQueue(prev => [...prev, ...newItems])

    // Upload sequentially
    valid.reduce((promise, file, i) => {
      return promise.then(() => uploadFile(file, startIdx + i))
    }, Promise.resolve())

  }, [queue.length, uploadFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  // ═══ SECTION 6 — Expired state ═══

  if (expired) {
    return (
      <div style={{
        minHeight:  '100vh',
        background: pageBg,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        padding:    '20px',
      }}>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>⏱</p>
          <h1 style={{
            fontFamily:   "'Playfair Display', Georgia, serif",
            fontSize:     '24px',
            color:        textPrimary,
            marginBottom: '12px',
          }}>
            This link has expired
          </h1>
          <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>
            The upload link for <strong style={{ color: textMuted }}>{phase.name}</strong> is
            no longer active. Please ask the event organiser to generate a new link.
          </p>
        </div>
      </div>
    )
  }

  // ═══ SECTION 7 — Main render ═══

  const capReached = currentRemaining <= 0

  return (
    <div style={{
      minHeight:  '100vh',
      background: pageBg,
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: '60px',
    }}>

      {/* ── Header ── */}
      <div style={{
        background:    'rgba(15,10,30,0.98)',
        borderBottom:  `1px solid ${goldBorder}`,
        padding:       '16px 20px',
        position:      'sticky',
        top:           0,
        zIndex:        40,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: goldMuted }}>
              LegacyCapsule
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: textFaint }}>
              Official Photography Portal
            </p>
          </div>
          <div style={{
            padding:      '4px 12px',
            borderRadius: '20px',
            background:   currentRemaining > 0 ? 'rgba(226,195,107,0.1)' : 'rgba(248,113,113,0.1)',
            border:       `1px solid ${currentRemaining > 0 ? goldBorder : 'rgba(248,113,113,0.3)'}`,
            fontSize:     '11px',
            fontWeight:   700,
            color:        currentRemaining > 0 ? gold : 'rgba(248,113,113,0.8)',
          }}>
            {currentUploaded}/{cap} photos
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Phase identity ── */}
        <div style={{
          padding:      '20px',
          borderRadius: '16px',
          border:       `1px solid ${goldBorder}`,
          background:   goldFaint,
          marginBottom: '24px',
        }}>
          <p style={{
            margin:        '0 0 4px',
            fontSize:      '10px',
            fontWeight:    800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         goldMuted,
          }}>
            {capsule.honouree_name}{capsule.event_tag ? ` · ${capsule.event_tag}` : ''}
          </p>
          <h1 style={{
            fontFamily:   "'Playfair Display', Georgia, serif",
            fontSize:     'clamp(20px, 5vw, 26px)',
            fontWeight:   800,
            color:        textPrimary,
            margin:       '0 0 8px',
            lineHeight:   1.2,
          }}>
            {phase.name}
          </h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {phase.event_date && (
              <p style={{ margin: 0, fontSize: '12px', color: goldMuted }}>
                📅 {formatDate(phase.event_date)}
              </p>
            )}
            {phase.location && (
              <p style={{ margin: 0, fontSize: '12px', color: textFaint }}>
                📍 {phase.location}
              </p>
            )}
          </div>
        </div>

        {/* ── Upload area ── */}
        {!capReached ? (
          <div style={{ marginBottom: '28px' }}>
            <p style={{
              margin:        '0 0 12px',
              fontSize:      '10px',
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color:         goldMuted,
            }}>
              Upload Official Photos
            </p>

            {/* Drag and drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding:      '36px 20px',
                borderRadius: '14px',
                border:       `2px dashed ${isDragging ? gold : goldBorder}`,
                background:   isDragging ? 'rgba(226,195,107,0.06)' : cardBg,
                textAlign:    'center',
                cursor:       'pointer',
                transition:   'all 0.2s',
                marginBottom: '12px',
              }}>
              <p style={{ margin: '0 0 8px', fontSize: '28px' }}>📸</p>
              <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: textPrimary }}>
                Drag photos here or tap to select
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: textFaint }}>
                JPEG, PNG, WEBP, HEIC · {currentRemaining} of {cap} slots remaining
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
              multiple
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            {/* Upload queue */}
            {queue.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {queue.map((item, i) => (
                  <div key={i} style={{
                    padding:      '12px 14px',
                    borderRadius: '10px',
                    border:       `1px solid ${item.status === 'error' ? 'rgba(248,113,113,0.3)' : item.status === 'done' ? 'rgba(74,222,128,0.2)' : goldBorder}`,
                    background:   cardBg,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '12px',
                  }}>
                    {/* Thumbnail or status icon */}
                    {item.status === 'done' && item.imageUrl ? (
                      <img src={item.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width:          '40px',
                        height:         '40px',
                        borderRadius:   '6px',
                        background:     'rgba(255,255,255,0.06)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        fontSize:       '18px',
                      }}>
                        {item.status === 'uploading' ? '⏳' : item.status === 'error' ? '✗' : '📷'}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin:       '0 0 4px',
                        fontSize:     '12px',
                        fontWeight:   600,
                        color:        textPrimary,
                        whiteSpace:   'nowrap',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.file.name}
                      </p>
                      {item.status === 'error' ? (
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>
                          {item.error}
                        </p>
                      ) : item.status === 'done' ? (
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(74,222,128,0.7)' }}>
                          ✓ Uploaded successfully
                        </p>
                      ) : item.status === 'uploading' ? (
                        <p style={{ margin: 0, fontSize: '11px', color: goldMuted }}>
                          Uploading and compressing…
                        </p>
                      ) : (
                        <p style={{ margin: 0, fontSize: '11px', color: textFaint }}>
                          Waiting…
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span style={{
                      fontSize:   '11px',
                      fontWeight: 700,
                      color:      item.status === 'done'
                        ? 'rgba(74,222,128,0.8)'
                        : item.status === 'error'
                        ? 'rgba(248,113,113,0.8)'
                        : item.status === 'uploading'
                        ? gold
                        : textFaint,
                      flexShrink: 0,
                    }}>
                      {item.status === 'done' ? '✓' : item.status === 'error' ? '✗' : item.status === 'uploading' ? '…' : '–'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding:      '20px',
            borderRadius: '12px',
            border:       '1px solid rgba(248,113,113,0.2)',
            background:   'rgba(248,113,113,0.04)',
            textAlign:    'center',
            marginBottom: '28px',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: 'rgba(248,113,113,0.8)' }}>
              Photo limit reached (30/30)
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: textFaint, lineHeight: 1.6 }}>
              The organiser must remove a photo before you can upload more.
            </p>
          </div>
        )}

        {/* ── Existing photos grid ── */}
        {photos.length > 0 && (
          <div>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              marginBottom: '14px',
              paddingBottom:'10px',
              borderBottom: `1px solid ${goldBorder}`,
            }}>
              <p style={{
                margin:        0,
                fontSize:      '10px',
                fontWeight:    700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color:         goldMuted,
              }}>
                Already Uploaded
              </p>
              <span style={{ fontSize: '10px', color: textFaint }}>
                · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </span>
            </div>
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 '8px',
            }}>
              {photos.map(photo => (
                <div key={photo.id} style={{
                  aspectRatio:  '1',
                  borderRadius: '10px',
                  overflow:     'hidden',
                  border:       `1px solid ${goldBorder}`,
                }}>
                  <img
                    src={photo.image_url}
                    alt="Uploaded photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer note ── */}
        <p style={{
          marginTop:  '32px',
          fontSize:   '11px',
          color:      'rgba(255,255,255,0.15)',
          textAlign:  'center',
          lineHeight: 1.6,
        }}>
          All photos are automatically compressed and added to the event record.<br />
          This upload link expires {phase.event_date
            ? `7 days after ${formatDate(phase.event_date)}`
            : 'after 7 days'}.
        </p>

      </div>
    </div>
  )
}