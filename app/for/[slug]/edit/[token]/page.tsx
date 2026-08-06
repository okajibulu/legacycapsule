'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTOR EDIT PAGE
// Route: /for/[slug]/edit/[token]
// Token-based access — no password, no auth.
// Contributor can edit their tribute before organiser approval.
// Once approved, edits are locked — wall shows approved version only.
// contributor_name — not name. Gotcha #3.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LogoCapsule from '@/components/LogoCapsule'
import { COUNTRIES, getInitials, formatTributeDate } from '@/lib/tributeWallHelpers'
import { getRelationshipLabel } from '@/lib/eventLabels'

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT — anon key for client-side reads and updates
// ─────────────────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MIN_CHARS = 20
const MAX_CHARS = 2000
const MAX_PHOTO_MB = 1
const TRIBUTE_PHOTOS_BUCKET = 'tribute-photos'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Contribution {
  id: string
  capsule_id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  photo_url: string | null
  status: string
  created_at: string
}

interface Capsule {
  id: string
  slug: string
  honouree_name: string
  event_type: string
  event_tag: string | null
}

type PageState =
  | 'loading'
  | 'invalid_token'
  | 'already_approved'
  | 'edit'
  | 'preview'
  | 'saved'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES — matches submission form for consistency
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_BG = 'linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(212,174,42,0.25)',
  backgroundColor: 'rgba(255,255,255,0.06)',
  color: '#FFFFFF',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'DM Sans, sans-serif',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '6px',
  fontFamily: 'DM Sans, sans-serif',
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO COMPRESSION UTILITY — D17
// ─────────────────────────────────────────────────────────────────────────────
async function compressPhoto(file: File): Promise<File> {
  try {
    const imageCompression = (await import('browser-image-compression')).default
    return await imageCompression(file, {
      maxSizeMB: MAX_PHOTO_MB,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    })
  } catch {
    return file
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IVORY CARD PREVIEW — matches tribute wall appearance exactly
// ─────────────────────────────────────────────────────────────────────────────
function TributePreviewCard({
  name,
  city,
  country,
  relationship,
  message,
  photoPreview,
  createdAt,
}: {
  name: string
  city: string
  country: string
  relationship: string
  message: string
  photoPreview: string | null
  createdAt: string
}) {
  return (
    <div style={{
      backgroundColor: '#F5F3EE',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      borderTop: '3px solid #D4AE2A',
      padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>

        {photoPreview ? (
          <img
            src={photoPreview}
            alt={name}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: '#2D1B69',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#D4AE2A', fontSize: '14px', fontWeight: 700 }}>
              {getInitials(name || 'You')}
            </span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '15px', fontWeight: 600, color: '#1a1a2e', margin: 0,
          }}>
            {name}
          </p>
          <p style={{ fontSize: '12px', color: '#6b6b80', margin: '2px 0 0' }}>
            {city}
            {country ? ' ✦ ' + country : ''}
            {relationship ? ' · ' + relationship : ''}
          </p>
        </div>

        <p style={{ fontSize: '11px', color: '#9090a0', flexShrink: 0, margin: 0, whiteSpace: 'nowrap' }}>
          {formatTributeDate(createdAt)}
        </p>
      </div>

      {/* Message */}
      <p style={{
        fontSize: '14px', lineHeight: '1.75',
        color: '#2a2a3e', margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {message}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOCODE HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function geocodeLocation(
  city: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, country }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.lat && data.lng) return { lat: data.lat, lng: data.lng }
    return null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function EditTributePage() {
  const params = useParams()
  const slug = params.slug as string
  const token = params.token as string

  // ── Page state ─────────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>('loading')

  // ── Data ───────────────────────────────────────────────────────────────────
  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [capsule, setCapsule] = useState<Capsule | null>(null)

  // ── Edit fields — pre-filled from contribution ─────────────────────────────
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [relationship, setRelationship] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD — validate token, fetch contribution + capsule
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // 1. Validate token in email_verifications
      const { data: tokenRow } = await supabase
        .from('email_verifications')
        .select('record_id, expires_at, type')
        .eq('token', token)
        .eq('type', 'contributor_edit')
        .single()

      if (!tokenRow) {
        setPageState('invalid_token')
        return
      }

      // Check expiry
      if (new Date(tokenRow.expires_at) < new Date()) {
        setPageState('invalid_token')
        return
      }

      // 2. Fetch contribution
      // contributor_name — not name. Gotcha #3.
      const { data: contrib } = await supabase
        .from('contributions')
        .select('id, capsule_id, contributor_name, city, country, relationship, tribute_text, photo_url, status, created_at')
        .eq('id', tokenRow.record_id)
        .single()

      if (!contrib) {
        setPageState('invalid_token')
        return
      }

      // 3. Lock if already approved
      if (contrib.status === 'approved') {
        setPageState('already_approved')
        return
      }

      // 4. Fetch capsule
      const { data: cap } = await supabase
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag')
        .eq('id', contrib.capsule_id)
        .single()

      if (!cap) {
        setPageState('invalid_token')
        return
      }

      // 5. Pre-fill fields
      setContribution(contrib as Contribution)
      setCapsule(cap as Capsule)
      setName(contrib.contributor_name)
      setCity(contrib.city)
      setCountry(contrib.country)
      setMessage(contrib.tribute_text)
      setRelationship(contrib.relationship ?? '')
      setPhotoPreview(contrib.photo_url)
      setPageState('edit')
    }

    load()
  }, [token])

  // ─────────────────────────────────────────────────────────────────────────
  // PHOTO CHANGE
  // ─────────────────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressPhoto(file)
    setPhotoFile(compressed)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(compressed)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!city.trim()) errors.city = 'City is required'
    if (!country) errors.country = 'Country is required'
    if (message.trim().length < MIN_CHARS)
      errors.message = 'Tribute must be at least ' + MIN_CHARS + ' characters'
    // Note: existing tributes may exceed 2000 chars — warn but don't block
    if (message.trim().length > MAX_CHARS)
      errors.message = `Tribute is over ${MAX_CHARS} characters. Please shorten before saving.`
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const handlePreview = () => {
    if (!validate()) return
    setPageState('preview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE EDIT
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!contribution || !capsule) return
    setSaving(true)
    setSaveError('')

    try {
      // Upload new photo if changed
      let photoUrl = contribution.photo_url
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        const path = contribution.capsule_id + '/edit-' + Date.now() + '.' + ext
        const { error: uploadError } = await supabase.storage
          .from(TRIBUTE_PHOTOS_BUCKET)
          .upload(path, photoFile, { upsert: false })
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from(TRIBUTE_PHOTOS_BUCKET)
            .getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      }

      // Re-geocode if city or country changed
      let latitude = null
      let longitude = null
      if (city !== contribution.city || country !== contribution.country) {
        const coords = await geocodeLocation(city.trim(), country)
        if (coords) {
          latitude = coords.lat
          longitude = coords.lng
        }
      }

      // Update contribution
      // contributor_name — not name. Gotcha #3.
      const updatePayload: Record<string, any> = {
        contributor_name: name.trim(),
        city: city.trim(),
        country: country,
        relationship: relationship.trim() || null,
        tribute_text: message.trim(),
        photo_url: photoUrl,
      }
      if (latitude !== null) updatePayload.latitude = latitude
      if (longitude !== null) updatePayload.longitude = longitude

      const { error: updateError } = await supabase
        .from('contributions')
        .update(updatePayload)
        .eq('id', contribution.id)

      if (updateError) {
        setSaveError('Something went wrong. Please try again.')
        setSaving(false)
        return
      }

      setPageState('saved')
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch {
      setSaveError('Something went wrong. Please try again.')
    }

    setSaving(false)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — LOADING
  // ─────────────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading...</p>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — INVALID TOKEN
  // ─────────────────────────────────────────────────────────────────────────
  if (pageState === 'invalid_token') {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: '400px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>✦</div>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '22px', fontWeight: 700, color: '#F5F3EE', margin: '0 0 12px',
          }}>
            This link has expired
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: '0 0 24px' }}>
            Edit links are valid for 7 days after submission.
            If your tribute has not yet been approved, contact the organiser directly.
          </p>
          <Link
            href={'/for/' + slug}
            style={{ color: '#D4AE2A', fontSize: '13px', textDecoration: 'none' }}
          >
            View tribute wall &#8594;
          </Link>
        </div>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — ALREADY APPROVED
  // ─────────────────────────────────────────────────────────────────────────
  if (pageState === 'already_approved') {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: '400px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>✦</div>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '22px', fontWeight: 700, color: '#F5F3EE', margin: '0 0 12px',
          }}>
            Your tribute is live
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: '0 0 24px' }}>
            Your tribute has already been approved and is now live on the wall.
            Approved tributes cannot be edited.
          </p>
          <Link
            href={'/for/' + slug}
            style={{ color: '#D4AE2A', fontSize: '13px', textDecoration: 'none' }}
          >
            View tribute wall &#8594;
          </Link>
        </div>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — SAVED CONFIRMATION
  // ─────────────────────────────────────────────────────────────────────────
  if (pageState === 'saved') {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <LogoCapsule size="sm" />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✦</div>
            <h1 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '26px', fontWeight: 700, color: '#F5F3EE', margin: '0 0 12px',
            }}>
              Tribute updated
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
              Your changes have been saved. The organiser will review your updated tribute.
            </p>
          </div>

          {/* Updated preview */}
          <div style={{ marginBottom: '32px' }}>
            <TributePreviewCard
              name={name}
              city={city}
              country={country}
              relationship={relationship}
              message={message}
              photoPreview={photoPreview}
              createdAt={contribution?.created_at ?? new Date().toISOString()}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              href={'/for/' + slug}
              style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textDecoration: 'none' }}
            >
              Back to tribute wall &#8594;
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — PREVIEW STEP
  // ─────────────────────────────────────────────────────────────────────────
  if (pageState === 'preview' && contribution) {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <LogoCapsule size="sm" />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{
              fontSize: '11px', color: 'rgba(212,174,42,0.6)',
              letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px',
            }}>
              Preview your changes
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              This is how your tribute will appear on the wall.
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setPageState('edit')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: '13px', padding: 0,
              }}
            >
              &#8592; Edit
            </button>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <TributePreviewCard
              name={name}
              city={city}
              country={country}
              relationship={relationship}
              message={message}
              photoPreview={photoPreview}
              createdAt={contribution.created_at}
            />
          </div>

          {saveError && (
            <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
              {saveError}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AE2A, #B8960C)',
              border: 'none', color: '#0D0820',
              fontWeight: 700, fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — EDIT FORM
  // ─────────────────────────────────────────────────────────────────────────
  const subjectName = capsule?.honouree_name ?? ''
  const relationshipLabel = getRelationshipLabel(capsule?.event_type ?? '', subjectName)

  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG, padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Logo + back link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
          <LogoCapsule size="sm" />
          <Link
            href={'/for/' + slug}
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textDecoration: 'none' }}
          >
            &#8592; Back to wall
          </Link>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 700, color: '#F5F3EE', margin: '0 0 8px', lineHeight: 1.3,
          }}>
            Edit your tribute
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {'For ' + subjectName + ' · Changes saved until approved.'}
          </p>
        </div>

        {/* ── EDIT FIELDS ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
            {fieldErrors.name && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.name}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label style={labelStyle}>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
            />
            {fieldErrors.city && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.city}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label style={labelStyle}>Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              <option value="" disabled>Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: '#1A0F3E', color: '#FFFFFF' }}>
                  {c}
                </option>
              ))}
            </select>
            {fieldErrors.country && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.country}</p>
            )}
          </div>

<p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.65, margin: '0 0 6px', fontStyle: 'italic' }}>
  Tributes are limited to 2000 characters — keep it personal and concise.{' '}
  <span style={{ color: 'rgba(226,195,107,0.6)' }}>Have a longer story or photos? Share them in the Community Memories &amp; Stories room.</span>
</p>

          {/* Tribute message */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Tribute</label>
              <span style={{
                fontSize: '11px',
                color: message.length > MAX_CHARS
                  ? '#f87171'
                  : message.length >= MIN_CHARS
                  ? 'rgba(212,174,42,0.6)'
                  : 'rgba(255,255,255,0.25)',
              }}>
                {message.length} / {MAX_CHARS}
              </span>
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
            />
            {fieldErrors.message && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.message}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label style={labelStyle}>{relationshipLabel}</label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Colleague, Friend, Family"
              style={inputStyle}
            />
          </div>

          {/* Photo */}
          <div>
            <label style={labelStyle}>Photo</label>
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{
                border: '1px dashed rgba(212,174,42,0.3)',
                borderRadius: '10px', padding: '20px',
                textAlign: 'center', cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }}
                />
              ) : (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '0 0 4px' }}>
                    Tap to upload a new photo
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', margin: 0 }}>
                    Compressed automatically · Max 1MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            {photoPreview && (
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                style={{
                  marginTop: '6px', background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.25)', fontSize: '12px',
                  cursor: 'pointer', padding: 0,
                }}
              >
                Remove photo
              </button>
            )}
          </div>

        </div>

        {/* Preview CTA */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={handlePreview}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AE2A, #B8960C)',
              border: 'none', color: '#0D0820',
              fontWeight: 700, fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            Preview Changes &#8594;
          </button>
        </div>

      </div>
    </main>
  )
}