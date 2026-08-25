'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/ContributorGallery.tsx
// PURPOSE:   Public-facing Contributor Gallery displayed on the About page.
//            Open photo pool — any visitor can upload photos with captions.
//            Shows photo grid with name overlaid on photo (no footer below).
//            Compression via browser-image-compression before upload.
//            Per-person limit: 20 photos (enforced server-side, shown client-side).
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.41
// DATE:      25 August 2026
// UPDATED:   AI25 · Claude Sonnet 4.6 · 25 August 2026
//            — TopContributors removed (belongs in Highlights section)
//            — Contributor name moved from below photo to overlay on photo
//            — Caption shown in lightbox only (saves card space)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

// ═══ SECTION 1 — Types ═══

interface GalleryPhoto {
  id:               string
  contributor_name: string
  contributor_email: string
  storage_path:     string
  caption:          string | null
  created_at:       string
}

interface ContributorGalleryProps {
  capsuleId:    string
  honoureeName: string
  themeKey:     string
}

// ═══ SECTION 2 — Helpers ═══

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET       = 'contributor-gallery'
const MAX_FILES    = 20

function getPublicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

// ═══ SECTION 3 — Theme tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ═══ SECTION 4 — Lightbox ═══
// Shows full image, contributor name and caption on tap

function Lightbox({ photo, photos, onClose, onNav }: {
  photo:   GalleryPhoto
  photos:  GalleryPhoto[]
  onClose: () => void
  onNav:   (photo: GalleryPhoto) => void
}) {
  const currentIndex = photos.findIndex(p => p.id === photo.id)
  const hasPrev      = currentIndex > 0
  const hasNext      = currentIndex < photos.length - 1

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  && hasPrev) onNav(photos[currentIndex - 1])
      if (e.key === 'ArrowRight' && hasNext) onNav(photos[currentIndex + 1])
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex, hasPrev, hasNext])

  const navBtnStyle = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    [side]: '16px',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    color: textPrimary,
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
    transition: 'background 0.15s',
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', cursor: 'pointer',
      }}
    >
      {/* Prev */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); onNav(photos[currentIndex - 1]) }}
          style={navBtnStyle('left')}
        >
          ‹
        </button>
      )}

      {/* Photo */}
      <img
        src={getPublicUrl(photo.storage_path)}
        alt={photo.caption || `Photo by ${photo.contributor_name}`}
        style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', objectFit: 'contain' }}
        onClick={e => e.stopPropagation()}
      />

      {/* Next */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); onNav(photos[currentIndex + 1]) }}
          style={navBtnStyle('right')}
        >
          ›
        </button>
      )}

      {/* Caption + name */}
      <div style={{ marginTop: '16px', textAlign: 'center', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: '0 0 4px' }}>
          {photo.contributor_name}
        </p>
        {photo.caption && (
          <p style={{ fontSize: '12px', color: goldMuted, fontStyle: 'italic', margin: 0 }}>
            {photo.caption}
          </p>
        )}
        {/* Counter */}
        <p style={{ fontSize: '10px', color: textFaint, margin: '6px 0 0', letterSpacing: '0.06em' }}>
          {currentIndex + 1} / {photos.length}
        </p>
      </div>

      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '20px', right: '20px',
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: '36px', height: '36px', color: textPrimary, fontSize: '18px', cursor: 'pointer',
      }}>×</button>
    </div>
  )
}

// ═══ SECTION 5 — Upload form ═══

function UploadForm({ capsuleId, onUploaded }: { capsuleId: string; onUploaded: () => void }) {
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [files,     setFiles]     = useState<File[]>([])
  const [captions,  setCaptions]  = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState('')
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} photos at a time.`)
      return
    }
    setFiles(selected)
    setCaptions(selected.map(() => ''))
    setError('')
  }

  const handleCaptionChange = (index: number, value: string) => {
    setCaptions(prev => { const next = [...prev]; next[index] = value; return next })
  }

  const handleUpload = async () => {
    if (!name.trim() || !email.trim() || files.length === 0) return
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }

    setUploading(true)
    setProgress('Compressing photos…')
    setError('')

    try {
      const imageCompression = (await import('browser-image-compression')).default
      const formData = new FormData()
      formData.append('capsule_id', capsuleId)
      formData.append('contributor_name', name.trim())
      formData.append('contributor_email', email.trim().toLowerCase())
      formData.append('captions', JSON.stringify(captions))

      for (let i = 0; i < files.length; i++) {
        setProgress(`Compressing photo ${i + 1} of ${files.length}…`)
        const compressed = await imageCompression(files[i], {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        })
        formData.append(`photo_${i}`, compressed, compressed.name)
      }

      setProgress('Uploading…')

      const res  = await fetch('/api/gallery/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed. Please try again.')
        setUploading(false)
        setProgress('')
        return
      }

      setSuccess(true)
      setFiles([])
      setCaptions([])
      if (fileRef.current) fileRef.current.value = ''
      onUploaded()
    } catch (err) {
      console.error('[ContributorGallery] Upload error:', err)
      setError('Something went wrong. Please try again.')
    }

    setUploading(false)
    setProgress('')
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 16px', borderRadius: '14px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
        <p style={{ fontSize: '24px', marginBottom: '8px' }}>✦</p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: '0 0 6px' }}>Photos uploaded successfully!</p>
        <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, margin: '0 0 14px' }}>
          Thank you for adding to this collection. A confirmation email is on its way.
        </p>
        <button
          onClick={() => setSuccess(false)}
          style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.08)', color: gold, cursor: 'pointer', fontWeight: 600 }}
        >
          Upload More Photos
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', borderRadius: '14px', border: `1px dashed rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.03)' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 4px' }}>Add Your Photos</p>
      <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65, margin: '0 0 14px' }}>
        Do you have any photos of the event to share? Kindly post here! Up to 20 photos per person — selected photos may be included in the final publication.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        <input placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} style={inp} />
        <input placeholder="Your email *" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        <div>
          <label style={{
            display: 'inline-block', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
            background: goldFaint, border: `1px solid rgba(226,195,107,0.25)`,
            color: gold, fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em',
          }}>
            📷 Select Photos
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
            />
          </label>
          {files.length > 0 && (
            <span style={{ fontSize: '11px', color: goldMuted, marginLeft: '10px' }}>
              {files.length} photo{files.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </div>

      {/* Caption fields */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                background: '#1a0845', border: `1px solid ${cardBorder}`,
              }}>
                <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <input
                placeholder="Add a caption (optional)"
                value={captions[i] || ''}
                onChange={e => handleCaptionChange(i, e.target.value)}
                style={{ ...inp, flex: 1 }}
                maxLength={200}
              />
            </div>
          ))}
        </div>
      )}

      {error    && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', marginBottom: '10px' }}>{error}</p>}
      {progress && <p style={{ fontSize: '11px', color: goldMuted, marginBottom: '10px' }}>{progress}</p>}

      <button
        onClick={handleUpload}
        disabled={uploading || !name.trim() || !email.trim() || files.length === 0}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
          background: name.trim() && email.trim() && files.length > 0
            ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
            : 'rgba(255,255,255,0.06)',
          color: name.trim() && email.trim() && files.length > 0 ? '#1a0845' : textFaint,
          fontSize: '13px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {uploading ? 'Uploading…' : `Upload ${files.length || ''} Photo${files.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}

// ═══ SECTION 6 — Photo card with name overlay ═══
// Name rendered as a gradient overlay at the bottom of the image.
// No footer below the photo — saves vertical space in the grid.
// Caption visible only in the lightbox.

function PhotoCard({ photo, onClick }: { photo: GalleryPhoto; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${cardBorder}`, background: cardBg,
        position: 'relative',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'rgba(226,195,107,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = cardBorder
      }}
    >
      {/* Photo — square aspect ratio */}
      <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#0a0218', position: 'relative' }}>
        <img
          src={getPublicUrl(photo.storage_path)}
          alt={photo.caption || `Photo by ${photo.contributor_name}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Name overlay — gradient from bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          padding: '20px 8px 6px',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
            margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}>
            {photo.contributor_name}
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 7 — Main component ═══

export default function ContributorGallery({ capsuleId, honoureeName, themeKey }: ContributorGalleryProps) {
  const [photos,     setPhotos]     = useState<GalleryPhoto[]>([])
  const [loading,    setLoading]    = useState(true)
  const [lightbox,   setLightbox]   = useState<GalleryPhoto | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const fetchPhotos = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('contributor_gallery_photos')
        .select('id, contributor_name, contributor_email, storage_path, caption, created_at')
        .eq('capsule_id', capsuleId)
        .eq('status', 'visible')
        .order('sort_order', { ascending: true })
      setPhotos(data ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchPhotos() }, [capsuleId])

  if (loading) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: textFaint }}>Loading gallery…</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '24px' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: goldMuted, margin: '0 0 4px' }}>
            Contributor Gallery
          </p>
          <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''} shared by friends and family
          </p>
        </div>
        <button
          onClick={() => setShowUpload(s => !s)}
          style={{
            fontSize: '11px', fontWeight: 700, padding: '7px 16px', borderRadius: '8px',
            background: showUpload ? 'rgba(226,195,107,0.15)' : goldFaint,
            border: `1px solid rgba(226,195,107,0.25)`, color: gold, cursor: 'pointer',
          }}
        >
          {showUpload ? 'Close' : '+ Add Photos'}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div style={{ marginBottom: '16px' }}>
          <UploadForm capsuleId={capsuleId} onUploaded={() => { fetchPhotos(); setShowUpload(false) }} />
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && !showUpload ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', borderRadius: '14px', border: `1px dashed rgba(226,195,107,0.15)` }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>📷</p>
          <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.65, margin: '0 0 14px' }}>
            Do you have any photos of the event to share? Kindly post here!
          </p>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              fontSize: '12px', fontWeight: 700, padding: '10px 24px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
              color: '#1a0845', border: 'none', cursor: 'pointer',
            }}
          >
            Add Your Photos
          </button>
        </div>
      ) : (
        /* Photo grid — name overlaid on each photo, no footer */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px',
        }}>
          {photos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setLightbox(photo)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photo={lightbox}
          photos={photos}
          onClose={() => setLightbox(null)}
          onNav={photo => setLightbox(photo)}
        />
      )}
    </div>
  )
}
