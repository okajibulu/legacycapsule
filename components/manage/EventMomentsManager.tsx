// ============================================================
// FILE PATH: components/manage/EventMomentsManager.tsx
// PURPOSE:   Organiser curation dashboard for Event Moments.
//            Per-phase photo gallery management.
//            Sections: Guest Eye View, Official Photography.
//            Actions: show/hide, feature for publication,
//            upload official photos, photographer token management.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.19
// DATE:      2 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect, useRef, useCallback } from 'react'

interface GalleryPhoto {
  id:                      string
  image_url:               string
  contributor_name:        string
  created_at:              string
  display_order:           number | null
  approved:                boolean
  is_official_photography: boolean
  featured_in_publication: boolean
}

interface Phase {
  id:         string
  name:       string
  event_date: string | null
  sort_order: number
}

interface EventMomentsManagerProps {
  capsuleId:   string
  capsuleSlug: string
  phases:      Phase[]
  gold:        string
  goldMuted:   string
  textPrimary: string
  textFaint:   string
  cardBg:      string
  accentFaint: string
}

// ═══ SECTION 2 — Phase tab sub-component ═══

function PhaseTab({
  phase, active, onClick, gold, goldMuted, textFaint, accentFaint,
}: {
  phase: Phase; active: boolean; onClick: () => void
  gold: string; goldMuted: string; textFaint: string; accentFaint: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      '8px 16px',
        borderRadius: '20px',
        border:       `1px solid ${active ? gold : accentFaint}`,
        background:   active ? 'rgba(226,195,107,0.1)' : 'transparent',
        color:        active ? gold : textFaint,
        fontSize:     '12px',
        fontWeight:   active ? 700 : 500,
        cursor:       'pointer',
        whiteSpace:   'nowrap',
        flexShrink:   0,
        transition:   'all 0.15s',
      }}>
      {phase.name}
    </button>
  )
}

// ═══ SECTION 3 — Managed photo card sub-component ═══

function ManagedPhotoCard({
  photo, onAction, gold, textFaint, accentFaint,
}: {
  photo: GalleryPhoto
  onAction: (photoId: string, action: string) => void
  gold: string; textFaint: string; accentFaint: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [busy,   setBusy]   = useState(false)

  const act = async (action: string) => {
    if (busy) return
    setBusy(true)
    await onAction(photo.id, action)
    setBusy(false)
  }

  return (
    <div style={{
      borderRadius: '12px',
      overflow:     'hidden',
      border:       `1px solid ${photo.approved ? accentFaint : 'rgba(248,113,113,0.2)'}`,
      background:   'rgba(255,255,255,0.02)',
      position:     'relative',
    }}>
      <div style={{ aspectRatio: '1', position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
        {!loaded && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }} />}
        <img
          src={photo.image_url}
          alt={photo.contributor_name}
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
        />
        <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {!photo.approved && (
            <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(248,113,113,0.85)', fontSize: '9px', fontWeight: 700, color: '#fff' }}>Hidden</span>
          )}
          {photo.featured_in_publication && (
            <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(226,195,107,0.85)', fontSize: '9px', fontWeight: 700, color: '#1a0845' }}>★ Featured</span>
          )}
          {photo.is_official_photography && (
            <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(99,102,241,0.85)', fontSize: '9px', fontWeight: 700, color: '#fff' }}>Official</span>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '11px', color: textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {photo.is_official_photography ? 'Official Photography' : photo.contributor_name}
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => act(photo.approved ? 'hide' : 'show')}
            disabled={busy}
            style={{
              padding: '4px 8px', borderRadius: '6px',
              border: `1px solid ${photo.approved ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
              background: 'transparent',
              color: photo.approved ? 'rgba(248,113,113,0.8)' : 'rgba(134,239,172,0.8)',
              fontSize: '10px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
            }}>
            {photo.approved ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => act(photo.featured_in_publication ? 'unfeature' : 'feature')}
            disabled={busy}
            style={{
              padding: '4px 8px', borderRadius: '6px',
              border: `1px solid ${photo.featured_in_publication ? accentFaint : 'rgba(226,195,107,0.3)'}`,
              background: 'transparent',
              color: photo.featured_in_publication ? textFaint : gold,
              fontSize: '10px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
            }}>
            {photo.featured_in_publication ? 'Unfeature' : '★ Feature'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 4 — Photographer token panel sub-component ═══

function PhotographerTokenPanel({
  phaseId, capsuleId, phaseName, gold, goldMuted, textFaint, accentFaint,
}: {
  phaseId: string; capsuleId: string; phaseName: string
  gold: string; goldMuted: string; textFaint: string; accentFaint: string
}) {
  const [token,      setToken]      = useState<string | null>(null)
  const [portalUrl,  setPortalUrl]  = useState<string | null>(null)
  const [expiresAt,  setExpiresAt]  = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [revoking,   setRevoking]   = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res  = await fetch('/api/photographer/token/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase_id: phaseId, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (data.ok) {
        setToken(data.token)
        setPortalUrl(data.portal_url)
        setExpiresAt(data.expires_at)
      } else {
        setError(data.error ?? 'Failed to generate link')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async () => {
    if (!confirm('Revoke this link? The photographer will lose access immediately.')) return
    setRevoking(true)
    setError(null)
    try {
      const res  = await fetch('/api/photographer/token/revoke', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase_id: phaseId, capsule_id: capsuleId }),
      })
      const data = await res.json()
      if (data.ok) {
        setToken(null)
        setPortalUrl(null)
        setExpiresAt(null)
      } else {
        setError(data.error ?? 'Failed to revoke')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setRevoking(false)
    }
  }

  const handleCopy = () => {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const formatExpiry = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div style={{
      padding:      '14px 16px',
      borderRadius: '12px',
      border:       `1px solid ${accentFaint}`,
      background:   'rgba(255,255,255,0.02)',
      marginBottom: '20px',
    }}>
      <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: goldMuted }}>
        Official Photography Portal
      </p>
      <p style={{ margin: '0 0 14px', fontSize: '12px', color: textFaint, lineHeight: 1.5 }}>
        Generate a secure upload link for your photographer. They upload directly — no account needed.
      </p>

      {error && (
        <p style={{ margin: '0 0 10px', fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>
      )}

      {!token ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '9px 20px', borderRadius: '20px',
            background: generating ? 'rgba(255,255,255,0.04)' : 'rgba(226,195,107,0.1)',
            border: `1px solid ${generating ? accentFaint : gold}`,
            color: generating ? textFaint : gold,
            fontSize: '12px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
          }}>
          {generating ? 'Generating…' : '🔗 Generate Photographer Link'}
        </button>
      ) : (
        <div>
          {/* Portal URL display */}
          <div style={{
            padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(226,195,107,0.06)', border: `1px solid rgba(226,195,107,0.2)`,
            marginBottom: '10px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: goldMuted, letterSpacing: '0.08em' }}>
              PHOTOGRAPHER UPLOAD LINK
            </p>
            <p style={{
              margin: '0 0 6px', fontSize: '11px', color: 'rgba(255,255,255,0.7)',
              wordBreak: 'break-all', lineHeight: 1.5,
            }}>
              {portalUrl}
            </p>
            {expiresAt && (
              <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>
                Expires {formatExpiry(expiresAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 16px', borderRadius: '16px',
                background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(226,195,107,0.1)',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(226,195,107,0.3)'}`,
                color: copied ? 'rgba(134,239,172,0.9)' : gold,
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
              {copied ? '✓ Copied' : '📋 Copy Link'}
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Official Photography Portal for ${phaseName}: ${portalUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px', borderRadius: '16px',
                background: 'rgba(74,222,128,0.06)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: 'rgba(134,239,172,0.85)',
                fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                display: 'inline-block',
              }}>
              💬 Send via WhatsApp
            </a>

            <button
              onClick={handleRevoke}
              disabled={revoking}
              style={{
                padding: '8px 16px', borderRadius: '16px',
                background: 'transparent',
                border: '1px solid rgba(248,113,113,0.25)',
                color: 'rgba(248,113,113,0.7)',
                fontSize: '12px', fontWeight: 600,
                cursor: revoking ? 'not-allowed' : 'pointer', opacity: revoking ? 0.5 : 1,
              }}>
              {revoking ? 'Revoking…' : 'Revoke Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 5 — Section heading sub-component ═══

function SectionHeading({ label, count, goldMuted, textFaint, accentFaint }: {
  label: string; count: number
  goldMuted: string; textFaint: string; accentFaint: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '14px', paddingBottom: '10px',
      borderBottom: `1px solid ${accentFaint}`,
    }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: goldMuted }}>
        {label}
      </p>
      <span style={{ fontSize: '10px', color: textFaint }}>
        · {count} {count === 1 ? 'photo' : 'photos'}
      </span>
    </div>
  )
}

// ═══ SECTION 6 — Main component ═══

export default function EventMomentsManager({
  capsuleId, capsuleSlug, phases,
  gold, goldMuted, textPrimary, textFaint, cardBg, accentFaint,
}: EventMomentsManagerProps) {

  const [activePhaseId,  setActivePhaseId]  = useState<string>(phases[0]?.id ?? '')
  const [photos,         setPhotos]         = useState<GalleryPhoto[]>([])
  const [loading,        setLoading]        = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [successMsg,     setSuccessMsg]     = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activePhase = phases.find(p => p.id === activePhaseId)

  // ── Fetch full photo records for active phase ──────────────────────
 
const fetchFullPhotos = useCallback(async () => {
    if (!activePhaseId) return
    try {
      const res  = await fetch(`/api/event-moments/${activePhaseId}`)
      const data = await res.json()
      if (data.ok) {
        const all = [
          ...(data.guest_photos ?? []).map((p: any) => ({
            ...p,
            approved:                true,
            is_official_photography: false,
            featured_in_publication: false,
          })),
          ...(data.official_photos ?? []).map((p: any) => ({
            ...p,
            approved:                true,
            is_official_photography: true,
            featured_in_publication: false,
          })),
        ]
        setPhotos(all)
      }
    } catch (e) {
      console.error('[EventMomentsManager] fetchFull error:', e)
    }
  }, [activePhaseId])

  useEffect(() => {
    if (activePhaseId) fetchFullPhotos()
  }, [activePhaseId, fetchFullPhotos])

  // ── Curation action ────────────────────────────────────────────────
  const handleAction = async (photoId: string, action: string) => {
    try {
      const res  = await fetch(`/api/event-moments/${activePhaseId}/curate`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId, photo_id: photoId, action }),
      })
      const data = await res.json()
      if (data.ok) {
        setPhotos(prev => prev.map(p => {
          if (p.id !== photoId) return p
          if (action === 'show')      return { ...p, approved: true }
          if (action === 'hide')      return { ...p, approved: false }
          if (action === 'feature')   return { ...p, featured_in_publication: true }
          if (action === 'unfeature') return { ...p, featured_in_publication: false }
          return p
        }))
      }
    } catch (e) {
      console.error('[EventMomentsManager] action error:', e)
    }
  }

  // ── Official photo upload ──────────────────────────────────────────
  const handleOfficialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setUploadError(null)
    setSuccessMsg(null)

    let successCount = 0

    for (const file of files) {
      const form = new FormData()
      form.append('capsule_id', capsuleId)
      form.append('file', file)
      try {
        const res  = await fetch(`/api/event-moments/${activePhaseId}/upload-official`, {
          method: 'POST',
          body:   form,
        })
        const data = await res.json()
        if (data.ok) successCount++
        else setUploadError(data.error ?? 'Upload failed')
      } catch {
        setUploadError('Upload failed — please try again')
      }
    }

    if (successCount > 0) {
      setSuccessMsg(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully`)
      await fetchFullPhotos()
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (phases.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: textFaint }}>
          No event phases have been set up for this capsule yet.
        </p>
      </div>
    )
  }

  const guestPhotos    = photos.filter(p => !p.is_official_photography)
  const officialPhotos = photos.filter(p =>  p.is_official_photography)

  return (
    <div style={{ padding: '20px 0' }}>

      {/* ── Phase tabs ── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 0 16px', scrollbarWidth: 'none' }}>
        {phases.map(phase => (
          <PhaseTab
            key={phase.id}
            phase={phase}
            active={phase.id === activePhaseId}
            onClick={() => setActivePhaseId(phase.id)}
            gold={gold}
            goldMuted={goldMuted}
            textFaint={textFaint}
            accentFaint={accentFaint}
          />
        ))}
      </div>

      {/* ── Photographer token panel ── */}
      <PhotographerTokenPanel
        phaseId={activePhaseId}
        capsuleId={capsuleId}
        phaseName={activePhase?.name ?? 'this phase'}
        gold={gold}
        goldMuted={goldMuted}
        textFaint={textFaint}
        accentFaint={accentFaint}
      />

      {/* ── Upload official photography ── */}
      <div style={{
        padding: '14px 16px', borderRadius: '12px',
        border: `1px solid ${accentFaint}`, background: 'rgba(255,255,255,0.02)',
        marginBottom: '20px',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: goldMuted }}>
          Upload Official Photography
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: textFaint, lineHeight: 1.5 }}>
          Add formal photographer shots directly. Multi-select supported — all photos are compressed automatically.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
          multiple
          onChange={handleOfficialUpload}
          style={{ display: 'none' }}
          id="official-upload-input"
        />
        <label
          htmlFor="official-upload-input"
          style={{
            display: 'inline-block', padding: '9px 20px', borderRadius: '20px',
            background: uploading ? 'rgba(255,255,255,0.04)' : 'rgba(226,195,107,0.1)',
            border: `1px solid ${uploading ? accentFaint : gold}`,
            color: uploading ? textFaint : gold,
            fontSize: '12px', fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer', letterSpacing: '0.03em',
          }}>
          {uploading ? 'Uploading…' : '+ Add Official Photos'}
        </label>

        {uploadError && <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{uploadError}</p>}
        {successMsg  && <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'rgba(134,239,172,0.8)' }}>✓ {successMsg}</p>}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '20px 0' }}>
          Loading photos…
        </p>
      )}

      {/* ── Guest Eye View ── */}
      {!loading && (
        <>
          {guestPhotos.length > 0 ? (
            <div style={{ marginBottom: '28px' }}>
              <SectionHeading
                label="Guest Eye View"
                count={guestPhotos.length}
                goldMuted={goldMuted}
                textFaint={textFaint}
                accentFaint={accentFaint}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {guestPhotos.map(photo => (
                  <ManagedPhotoCard
                    key={photo.id}
                    photo={photo}
                    onAction={handleAction}
                    gold={gold}
                    textFaint={textFaint}
                    accentFaint={accentFaint}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '28px', borderRadius: '12px',
              border: `1px solid ${accentFaint}`, marginBottom: '20px',
            }}>
              <p style={{ margin: 0, fontSize: '12px', color: textFaint }}>
                No guest photos yet for {activePhase?.name ?? 'this moment'}.
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: textFaint, opacity: 0.6 }}>
                Guest photos appear here once submitted on the event day.
              </p>
            </div>
          )}

          {/* ── Official Photography ── */}
          {officialPhotos.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <SectionHeading
                label="Official Photography"
                count={officialPhotos.length}
                goldMuted={goldMuted}
                textFaint={textFaint}
                accentFaint={accentFaint}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {officialPhotos.map(photo => (
                  <ManagedPhotoCard
                    key={photo.id}
                    photo={photo}
                    onAction={handleAction}
                    gold={gold}
                    textFaint={textFaint}
                    accentFaint={accentFaint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no photos at all */}
          {guestPhotos.length === 0 && officialPhotos.length === 0 && !loading && (
            <div style={{
              textAlign: 'center', padding: '20px',
              borderRadius: '12px', border: `1px solid ${accentFaint}`,
              background: 'rgba(255,255,255,0.01)',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: textFaint }}>
                No photos yet for {activePhase?.name ?? 'this moment'}.
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: textFaint, opacity: 0.6 }}>
                Upload official photos above or share the photographer link.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
