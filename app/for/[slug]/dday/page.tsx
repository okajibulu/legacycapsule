'use client'

/* =========================================================
   FILE PATH: app/for/[slug]/dday/page.tsx
   D-DAY GUEST CAPTURE PORTAL — Event Phase Photo Upload

   PURPOSE:
   Guests upload their own photos and selfies on event day.
   This is the "I was there" experience — visual, candid,
   crowd-sourced storytelling from every guest's perspective.

   THIS PAGE DOES NOT COLLECT TRIBUTES.
   Tributes belong on the Tribute Wall (/for/[slug]).
   This page is exclusively for event-day photo capture.

   FLOW:
   Step 1 — Name + email (who are you?)
   Step 2 — Choose event phase (if multiple phases)
   Step 3 — Upload photos (up to limit per device per phase)
   Step 4 — Success + link to tribute wall

   LIMITS:
   - Photos per device per phase: read from platform_config
     (lc.dday.photos_per_device_per_phase, default 6)
   - Guest can delete and replace within the D-Day window
   - No tribute text accepted on this page

   ARCHITECTURE: LC02 Event Services Engine · D-Day Collection (LC-owned)
   BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
   UPDATED: AI21 · Claude Opus 4.6 · 17 August 2026 (v2.12.16)
             — Placeholders removed, email mandatory, gold note shortened
             — Autocomplete fix for name + email, upload button visual feedback
   UPDATED: AI21 · Claude Opus 4.6 · 17 August 2026 (v2.12.17)
             — Three window states: before / open / closed
             — Pre-event screen: countdown to 6am WAT on event_date, phase info,
               links to tribute wall / stories / profile
             — Post-event screen: window closed message + capsule links
             — Phase pre-selection from ?phase=[phaseId] URL param
             — Countdown ticker updates every second
             — Window open = 6am WAT (05:00 UTC) to +24hrs on event_date
========================================================= */

import { useState, useEffect, useRef } from 'react'
import { useParams }                   from 'next/navigation'
import Link                            from 'next/link'

// ═══ SECTION 1 — Types ═══

interface Phase {
  id:         string
  name:       string
  event_date: string | null
}

interface CapsuleInfo {
  id:           string
  honouree_name: string
  event_type:   string
  event_tag:    string | null
  phases:       Phase[]
  page_state:   string
}

interface UploadedPhoto {
  id:        string
  image_url: string
  caption:   string
}

type Step = 'identity' | 'phase' | 'upload' | 'done'

// ═══ SECTION 2 — Design tokens ═══

const pageBg      = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 50%, #0f0a1e 100%)'
const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.10)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.15)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.35)'
const greenAccent = 'rgba(74,222,128,0.85)'
const inp: React.CSSProperties = {
  width: '100%', fontSize: '14px', padding: '13px 16px', borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.2)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — Shell ═══

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 80px' }}>
        {children}
      </div>
    </div>
  )
}

function Header({ honoureeName, eventTag }: { honoureeName: string; eventTag: string | null }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: goldMuted, textTransform: 'uppercase' as const, marginBottom: '10px' }}>
        Event Day
      </p>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, color: textPrimary, lineHeight: 1.2, marginBottom: '6px' }}>
        {honoureeName}
      </h1>
      {eventTag && (
        <p style={{ fontSize: '13px', color: goldMuted, margin: 0 }}>{eventTag}</p>
      )}
    </div>
  )
}

function GoldRule() {
  return (
    <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.3), transparent)', margin: '20px 0' }} />
  )
}

// ═══ SECTION 4 — Photo thumbnail with delete ═══

function PhotoThumb({
  photo,
  capsuleId,
  onDelete,
}: {
  photo:      UploadedPhoto
  capsuleId:  string
  onDelete:   (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Remove this photo?')) return
    setDeleting(true)
    try {
      await fetch('/api/dday/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_item_id: photo.id,
          capsule_id:      capsuleId,
        }),
      })
      onDelete(photo.id)
    } catch {
      // Silent fail — photo stays visible
    }
    setDeleting(false)
  }

  return (
    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', background: 'rgba(255,255,255,0.04)' }}>
      <img
        src={photo.image_url}
        alt={photo.caption}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px',
          borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif',
        }}
        title="Remove this photo"
      >
        {deleting ? '…' : '×'}
      </button>
    </div>
  )
}

// ═══ SECTION 5 — Window state helpers ═══
// Upload window: 6am WAT (UTC+1 = 05:00 UTC) on event_date
// to 6am WAT the following day (24 hours).
// Returns: 'before' | 'open' | 'closed'

type WindowState = 'before' | 'open' | 'closed'

function getWindowState(eventDate: string | null): WindowState {
  if (!eventDate) return 'before'

  const now = Date.now()

  // 6am WAT = 05:00 UTC on event_date
  const dateStr    = eventDate.slice(0, 10) // YYYY-MM-DD
  const windowOpen = new Date(`${dateStr}T05:00:00Z`).getTime()
  const windowClose = windowOpen + 24 * 60 * 60 * 1000  // +24 hours

  if (now < windowOpen)  return 'before'
  if (now < windowClose) return 'open'
  return 'closed'
}

// Formats a countdown from now to a future timestamp
function formatCountdown(targetMs: number): string {
  const diff = Math.max(0, targetMs - Date.now())
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secs  = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0)  return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`
  return `${mins}m ${secs}s`
}

// ═══ SECTION 6 — Main component ═══

export default function DDayPage() {
  const params     = useParams()
  const slug       = params?.slug as string
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const phaseIdFromUrl = searchParams?.get('phase') ?? null

  const [capsule,        setCapsule]        = useState<CapsuleInfo | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [step,           setStep]           = useState<Step>('identity')
  const [name,           setName]           = useState('')
  const [email,          setEmail]          = useState('')
  const [selectedPhase,  setSelectedPhase]  = useState<Phase | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [photoLimit,     setPhotoLimit]     = useState(6)
  const [uploading,      setUploading]      = useState(false)
  const [uploadError,    setUploadError]    = useState('')
  const [countdown,      setCountdown]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Fetch capsule info ──────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return
    fetch(`/api/capsule/public-info?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.capsule) {
          setCapsule(d.capsule)
          // Auto-select phase from URL param
          if (phaseIdFromUrl && d.capsule.phases?.length) {
            const match = d.capsule.phases.find((p: Phase) => p.id === phaseIdFromUrl)
            if (match) setSelectedPhase(match)
          }
        }
        if (d.photo_limit) setPhotoLimit(d.photo_limit)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  // ── Countdown ticker ────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedPhase?.event_date) return
    const dateStr    = selectedPhase.event_date.slice(0, 10)
    const windowOpen = new Date(`${dateStr}T05:00:00Z`).getTime()
    if (Date.now() >= windowOpen) return  // window already open — no ticker needed

    const interval = setInterval(() => {
      setCountdown(formatCountdown(windowOpen))
    }, 1000)
    setCountdown(formatCountdown(windowOpen))
    return () => clearInterval(interval)
  }, [selectedPhase])

  // ── Determine active phase for window check ─────────────────────────────
  // If phase pre-selected from URL, use it. Otherwise use first phase.
  const activePhase = selectedPhase ?? capsule?.phases?.[0] ?? null
  const windowState: WindowState = getWindowState(activePhase?.event_date ?? null)

  const remaining = photoLimit - uploadedPhotos.length

  // ── Validate identity step ──────────────────────────────────────────────
  const identityValid = name.trim().length > 0 && email.trim().includes('@')

  // ── Handle file upload ──────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !capsule) return

    // Only process up to `remaining` files
    const filesToUpload = files.slice(0, remaining)
    if (filesToUpload.length < files.length) {
      setUploadError(`You can only add ${remaining} more photo${remaining !== 1 ? 's' : ''}. Only the first ${filesToUpload.length} will be uploaded.`)
    } else {
      setUploadError('')
    }

    setUploading(true)

    for (const file of filesToUpload) {
      try {
        const form = new FormData()
        form.append('capsule_id',        capsule.id)
        form.append('capsule_slug',      slug)
        form.append('contributor_name',  name.trim())
        form.append('contributor_email', email.trim())
        form.append('phase_id',          selectedPhase?.id ?? '')
        form.append('file',              file)

        const res  = await fetch('/api/dday/upload', { method: 'POST', body: form })
        const data = await res.json()

        if (!res.ok) {
          if (data.error === 'photo_limit_reached') {
            setUploadError(data.message)
            break
          }
          setUploadError(data.error ?? 'Upload failed. Please try again.')
          continue
        }

        // Add to local state immediately for instant feedback
        setUploadedPhotos(prev => [...prev, {
          id:        data.gallery_item_id,
          image_url: URL.createObjectURL(file),
          caption:   name.trim(),
        }])

      } catch {
        setUploadError('Upload failed. Please check your connection and try again.')
      }
    }

    setUploading(false)
    // Reset file input so same file can be re-selected after delete
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDeletePhoto = (id: string) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== id))
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid rgba(226,195,107,0.2)`, borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '12px', color: textFaint }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </Shell>
    )
  }

  if (!capsule || capsule.page_state !== 'active') {
    return (
      <Shell>
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>◈</p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: textPrimary, marginBottom: '8px' }}>This capsule is not currently active</p>
          <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.65 }}>The D-Day capture portal is only available while the capsule is active.</p>
        </div>
      </Shell>
    )
  }

  // ── Pre-event: window not yet open ──────────────────────────────────────
  if (windowState === 'before') {
    const dateStr    = activePhase?.event_date?.slice(0, 10) ?? ''
    const windowOpen = dateStr ? new Date(`${dateStr}T05:00:00Z`).getTime() : 0
    const openLabel  = activePhase?.event_date
      ? new Date(activePhase.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'event day'

    return (
      <Shell>
        <Header honoureeName={capsule.honouree_name} eventTag={capsule.event_tag} />
        <GoldRule />

        {/* ── Phase name ── */}
        {activePhase && (
          <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '20px' }}>
            {activePhase.name}
          </p>
        )}

        {/* ── Countdown card ── */}
        <div style={{ padding: '24px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: textFaint, marginBottom: '12px', lineHeight: 1.6 }}>
            Photo uploads open in
          </p>
          <p style={{ fontSize: '36px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", letterSpacing: '0.04em', marginBottom: '8px' }}>
            {countdown || '…'}
          </p>
          <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, margin: 0 }}>
            Uploads open at 6am on <strong style={{ color: goldMuted }}>{openLabel}</strong> and close 24 hours later.
            Come back then to share your photos from the event.
          </p>
        </div>

        {/* ── What to expect ── */}
        <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(226,195,107,0.05)', border: '1px solid rgba(226,195,107,0.12)', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: goldMuted, lineHeight: 1.75, margin: 0 }}>
            ✦ On event day, scan the QR code again or return to this page to upload your photos.
            Every photo becomes part of {capsule.honouree_name}'s permanent event record and publication.
          </p>
        </div>

        {/* ── Links to other capsule pages ── */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
            Explore the capsule now
          </p>
          <Link href={`/for/${slug}`} style={{ display: 'block', padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
            Leave a voice or tribute →
          </Link>
          <Link href={`/for/${slug}/stories`} style={{ display: 'block', padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: cardBg, color: goldMuted, fontSize: '13px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
            Share a memory or story
          </Link>
          <Link href={`/for/${slug}/profile`} style={{ display: 'block', padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: cardBg, color: goldMuted, fontSize: '13px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
            View the profile
          </Link>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Shell>
    )
  }

  // ── Post-event: window closed ───────────────────────────────────────────
  if (windowState === 'closed') {
    return (
      <Shell>
        <Header honoureeName={capsule.honouree_name} eventTag={capsule.event_tag} />
        <GoldRule />

        <div style={{ textAlign: 'center', paddingTop: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '32px', marginBottom: '14px' }}>📷</p>
          <p style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, marginBottom: '8px', fontFamily: "'Playfair Display', serif" }}>
            Photo uploads have closed
          </p>
          <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.7, maxWidth: '300px', margin: '0 auto' }}>
            The 24-hour photo window for {activePhase?.name ?? 'this event'} has ended.
            The photos shared are now part of {capsule.honouree_name}'s permanent record.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          <Link href={`/for/${slug}`} style={{ display: 'block', padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
            Visit the tribute wall →
          </Link>
          <Link href={`/for/${slug}/stories`} style={{ display: 'block', padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: cardBg, color: goldMuted, fontSize: '13px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
            Share a memory or story
          </Link>
        </div>
      </Shell>
    )
  }

  /* ═════════════════════════════════════════
     STEP 1 — Identity
  ═════════════════════════════════════════ */
  if (step === 'identity') {
    return (
      <Shell>
        <Header honoureeName={capsule.honouree_name} eventTag={capsule.event_tag} />
        <GoldRule />

        {/* ── What this is ── */}
        <div style={{ padding: '16px', borderRadius: '14px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '20px' }}>
          <p style={{ fontSize: '22px', textAlign: 'center', marginBottom: '10px' }}>📸</p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, textAlign: 'center', marginBottom: '8px' }}>
            Share your photos from today
          </p>
          <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.7, textAlign: 'center', margin: 0 }}>
            You were here. Your photos tell that story — moments only you captured, from where only you were standing.
            Upload up to <strong style={{ color: gold }}>{photoLimit} photos</strong> from today's event and they'll become part of the permanent record.
          </p>
        </div>

        {/* ── Publication note — shortened, no email mention ── */}
        <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(226,195,107,0.05)', border: '1px solid rgba(226,195,107,0.12)', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: goldMuted, lineHeight: 1.7, margin: 0 }}>
            ✦ These memories will all be compiled into a publication at end of event!
          </p>
        </div>

        {/* ── Form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

          {/* ── Name — empty placeholder, autocomplete fix ── */}
          <div>
            <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.12em', display: 'block', marginBottom: '6px' }}>
              Your name *
            </label>
            <input
              style={inp}
              placeholder=""
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={e => { if (e.target.value !== name) setName(e.target.value) }}
              maxLength={80}
              autoFocus
              autoComplete="name"
            />
          </div>

          {/* ── Email — mandatory, empty placeholder, autocomplete fix ── */}
          <div>
            <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.12em', display: 'block', marginBottom: '6px' }}>
              Email address *
            </label>
            <input
              type="email"
              style={inp}
              placeholder=""
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={e => { if (e.target.value !== email) setEmail(e.target.value) }}
              maxLength={120}
              autoComplete="email"
            />
            <p style={{ fontSize: '11px', color: textFaint, marginTop: '5px', lineHeight: 1.5 }}>
              A copy of the event publication will be emailed to you.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!identityValid) return
            // Skip phase selection if only one phase
            if (capsule.phases.length <= 1) {
              setSelectedPhase(capsule.phases[0] ?? null)
              setStep('upload')
            } else {
              setStep('phase')
            }
          }}
          disabled={!identityValid}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: identityValid ? 'linear-gradient(135deg, #E2C36B, #C9A84E)' : 'rgba(255,255,255,0.06)',
            color: identityValid ? '#1a0845' : textFaint,
            fontSize: '14px', fontWeight: 700,
            cursor: identityValid ? 'pointer' : 'not-allowed',
            letterSpacing: '0.04em',
          }}
        >
          Continue →
        </button>

        {/* ── Tribute wall link ── */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: textFaint, lineHeight: 1.65 }}>
          Want to leave a personal message for {capsule.honouree_name}?{' '}
          <Link href={`/for/${slug}`} style={{ color: goldMuted, textDecoration: 'none', fontWeight: 600 }}>
            Visit the Tribute Wall →
          </Link>
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Shell>
    )
  }

  /* ═════════════════════════════════════════
     STEP 2 — Phase selection (only if multiple phases)
  ═════════════════════════════════════════ */
  if (step === 'phase') {
    return (
      <Shell>
        <Header honoureeName={capsule.honouree_name} eventTag={capsule.event_tag} />
        <GoldRule />

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>
            Which part of the event are you at?
          </h2>
          <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.6 }}>
            Your photos will be added to the right chapter of the event story.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {capsule.phases.map(phase => (
            <button
              key={phase.id}
              onClick={() => {
                setSelectedPhase(phase)
                setStep('upload')
              }}
              style={{
                padding: '16px 18px', borderRadius: '12px', textAlign: 'left' as const,
                border: `1px solid ${cardBorder}`, background: cardBg,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: '0 0 3px' }}>{phase.name}</p>
              {phase.event_date && (
                <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
                  {new Date(phase.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep('identity')}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid rgba(255,255,255,0.08)`, background: 'transparent', color: textFaint, fontSize: '13px', cursor: 'pointer' }}
        >
          ← Back
        </button>
      </Shell>
    )
  }

  /* ═════════════════════════════════════════
     STEP 3 — Upload
  ═════════════════════════════════════════ */
  if (step === 'upload') {
    const used      = uploadedPhotos.length
    const remaining = photoLimit - used
    const atLimit   = remaining <= 0

    return (
      <Shell>
        <Header honoureeName={capsule.honouree_name} eventTag={capsule.event_tag} />
        <GoldRule />

        {/* Phase name */}
        {selectedPhase && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>
              {selectedPhase.name}
            </span>
          </div>
        )}

        {/* Photo counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '13px', color: textFaint, margin: 0 }}>
            {used} of {photoLimit} photos shared
          </p>
          {remaining > 0 && (
            <p style={{ fontSize: '12px', color: goldMuted, margin: 0, fontWeight: 600 }}>
              {remaining} remaining
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ height: '100%', width: `${(used / photoLimit) * 100}%`, background: used === photoLimit ? 'rgba(74,222,128,0.7)' : 'linear-gradient(90deg, #E2C36B, #C9A84E)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>

        {/* Uploaded photos grid */}
        {uploadedPhotos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {uploadedPhotos.map(photo => (
              <PhotoThumb
                key={photo.id}
                photo={photo}
                capsuleId={capsule.id}
                onDelete={handleDeletePhoto}
              />
            ))}
          </div>
        )}

        {/* Upload button — with clear visual feedback while uploading */}
        {!atLimit ? (
          <label style={{ display: 'block', marginBottom: '12px', cursor: uploading ? 'not-allowed' : 'pointer' }}>
            <div style={{
              width: '100%', padding: '16px', borderRadius: '12px', textAlign: 'center' as const,
              border: `2px dashed ${uploading ? 'rgba(226,195,107,0.5)' : 'rgba(226,195,107,0.25)'}`,
              background: uploading ? 'rgba(226,195,107,0.08)' : 'rgba(226,195,107,0.04)',
              opacity: uploading ? 0.75 : 1,
              transition: 'all 0.2s',
              pointerEvents: uploading ? 'none' : 'auto',
            }}>
              <p style={{ fontSize: '28px', margin: '0 0 8px' }}>
                {uploading ? '⏳' : '📷'}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: uploading ? goldMuted : textPrimary, margin: '0 0 4px' }}>
                {uploading ? 'Uploading your photo…' : 'Add photos'}
              </p>
              <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
                {uploading ? 'Please wait' : `${remaining} slot${remaining !== 1 ? 's' : ''} left · Tap to choose from your phone`}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={uploading || atLimit}
            />
          </label>
        ) : (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: greenAccent, margin: '0 0 4px' }}>
              ✓ All {photoLimit} photos shared
            </p>
            <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
              To swap a photo, tap × on the one you want to remove, then upload a new one.
            </p>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '12px', textAlign: 'center', lineHeight: 1.6 }}>
            {uploadError}
          </p>
        )}

        {/* Finish */}
        {uploadedPhotos.length > 0 && (
          <button
            onClick={() => setStep('done')}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
              color: '#1a0845', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.04em', marginBottom: '12px',
            }}
          >
            I'm done — submit my photos
          </button>
        )}

        {/* Tribute wall nudge */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: textFaint, lineHeight: 1.65 }}>
          Want to leave a personal message too?{' '}
          <Link href={`/for/${slug}`} style={{ color: goldMuted, textDecoration: 'none', fontWeight: 600 }}>
            Visit the Tribute Wall →
          </Link>
        </p>
      </Shell>
    )
  }

  /* ═════════════════════════════════════════
     STEP 4 — Done
  ═════════════════════════════════════════ */
  return (
    <Shell>
      <div style={{ textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 24px', boxShadow: '0 0 32px rgba(74,222,128,0.12)' }}>
          ✓
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>
          Your photos are in
        </h2>

        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: '8px', maxWidth: '320px', margin: '0 auto 12px' }}>
          Thank you for sharing your view of today. Your photos become part of{' '}
          <strong style={{ color: textPrimary }}>{capsule?.honouree_name}</strong>'s permanent event record.
        </p>

        {email && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', background: goldFaint, border: `1px solid rgba(226,195,107,0.15)`, margin: '16px auto', maxWidth: '320px' }}>
            <p style={{ fontSize: '12px', color: goldMuted, margin: 0, lineHeight: 1.65 }}>
              ✦ We'll send the full event publication to <strong style={{ color: gold }}>{email}</strong> when it's ready.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px', maxWidth: '320px', margin: '24px auto 0' }}>
          <Link
            href={`/for/${slug}`}
            style={{ display: 'block', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', letterSpacing: '0.04em' }}
          >
            Visit the Tribute Wall →
          </Link>
          <button
            onClick={() => {
              setUploadedPhotos([])
              setUploadError('')
              setStep('upload')
            }}
            style={{ padding: '12px', borderRadius: '12px', border: `1px solid rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Upload more photos
          </button>
        </div>
      </div>
    </Shell>
  )
}
