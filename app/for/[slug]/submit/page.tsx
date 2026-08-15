'use client'

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSION FORM
// Route: /for/[slug]/submit
// D28: Separate route — not inline on tribute wall.
// D35: Fields — Name*, City*, Country*, Message*, Relationship, Email, Photo.
// D17: Photo compressed client-side to under 1MB before upload.
// Q6:  Ivory card preview IS the final submit step. No separate modal.
// contributor_name — not name. Gotcha #3. Every insert uses contributor_name.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LogoCapsule from '@/components/LogoCapsule'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'
import { COUNTRIES, getInitials, formatTributeDate } from '@/lib/tributeWallHelpers'
import {
  getSubmitPageHeading,
  getRelationshipLabel,
  getConfirmationMessage,
} from '@/lib/eventLabels'

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT — anon key for client-side inserts
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
const TITLE_OPTIONS = [
  'Dr', 'Prof', 'Chief', 'Rev', 'Pastor',
  'Alhaji', 'Alhaja', 'Engr', 'Barr',
  'Mr', 'Mrs', 'Ms', 'Sir', 'Lady', 'Other',
]
// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Capsule {
  id: string
  slug: string
  honouree_name: string
  event_type: string
  event_tag: string | null
}

type Step = 'form' | 'preview' | 'confirmation'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
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

const goldAsterisk: React.CSSProperties = {
  color: '#D4AE2A',
  marginLeft: '3px',
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO COMPRESSION UTILITY
// D17: All photos compressed client-side to under 1MB before upload.
// Uses browser-image-compression if available, falls back to canvas resize.
// ─────────────────────────────────────────────────────────────────────────────
async function compressPhoto(file: File): Promise<File> {
  try {
    // Dynamic import — browser-image-compression is a client-only package
    const imageCompression = (await import('browser-image-compression')).default
    return await imageCompression(file, {
      maxSizeMB: MAX_PHOTO_MB,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    })
  } catch {
    // Fallback: return original if compression fails
    return file
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IVORY CARD PREVIEW COMPONENT
// Renders tribute exactly as it will appear on the wall.
// Q6: This IS the final submit step — not a separate modal.
// ─────────────────────────────────────────────────────────────────────────────
function TributePreviewCard({
  name,
  city,
  country,
  relationship,
  message,
  photoPreview,
}: {
  name: string
  city: string
  country: string
  relationship: string
  message: string
  photoPreview: string | null
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

        {/* Avatar */}
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

        {/* Name + location */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '15px', fontWeight: 600, color: '#1a1a2e', margin: 0,
          }}>
            {name || 'Your name'}
          </p>
          <p style={{ fontSize: '12px', color: '#6b6b80', margin: '2px 0 0' }}>
            {city || 'Your city'}
            {country ? ' ✦ ' + country : ''}
            {relationship ? ' · ' + relationship : ''}
          </p>
        </div>

        {/* Date — today */}
        <p style={{ fontSize: '11px', color: '#9090a0', flexShrink: 0, margin: 0, whiteSpace: 'nowrap' }}>
          {formatTributeDate(new Date().toISOString())}
        </p>
      </div>

      {/* Message */}
      <p style={{
        fontSize: '14px', lineHeight: '1.75', color: '#2a2a3e',
        margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {message || 'Your tribute will appear here…'}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOCODE HELPER
// Calls the existing /api/geocode route to get lat/lng from city + country.
// ─────────────────────────────────────────────────────────────────────────────
async function geocodeLocation(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
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
export default function SubmitPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // ── Capsule data ───────────────────────────────────────────────────────────
  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [loadError, setLoadError] = useState(false)

  // ── Form fields — D35 ─────────────────────────────────────────────────────
  const [title,     setTitle]     = useState('')
const [firstName, setFirstName] = useState('')
const [lastName,  setLastName]  = useState('')
const [customTitle, setCustomTitle] = useState('')
const [name,      setName]      = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [relationship, setRelationship] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const lang = capsule ? getParticipationLanguage(capsule.event_type) : null
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ── Load capsule on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadCapsule() {
      const { data, error } = await supabase
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag')
        .eq('slug', slug)
        .eq('page_state', 'active')
        .single()
      if (error || !data) {
        setLoadError(true)
        return
      }
      setCapsule(data as Capsule)
      // LC-PARTICIPATION-001: capture arrival ref
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const ref = urlParams.get('ref')
        if (ref && /^[A-Z2-9]{8}$/.test(ref)) {
          sessionStorage.setItem('lc_arrival_ref_' + slug, ref)
        }
      } catch {}
    }
    loadCapsule()
  }, [slug])

  // ── Photo selection + compression preview ─────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressPhoto(file)
    setPhotoFile(compressed)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(compressed)
  }

  // ── Form validation ────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = 'First name required'
    if (!lastName.trim())  errors.lastName  = `Please add your last name — it helps ${capsule?.honouree_name ?? 'the honouree'} know exactly who this is from.`
    if (!city.trim()) errors.city = 'City is required'
    if (!country) errors.country = 'Country is required'
    if (message.trim().length < MIN_CHARS)
      errors.message = 'Message must be at least ' + MIN_CHARS + ' characters'
    if (message.trim().length > MAX_CHARS)
      errors.message = 'Message must be under ' + MAX_CHARS + ' characters'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Proceed to preview ─────────────────────────────────────────────────────
  const handlePreview = () => {
    if (!validate()) return
    setStep('preview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Final submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!capsule) return
    setSubmitting(true)
    setSubmitError('')

    try {
      // 1. Upload photo if provided
      let photoUrl: string | null = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        const path = capsule.id + '/' + Date.now() + '.' + ext
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

      // 2. Geocode city + country for map pin
      const coords = await geocodeLocation(city.trim(), country)

      // 3. Insert contribution
      // CRITICAL: column is contributor_name — not name. Gotcha #3.
      const { data: contribution, error: insertError } = await supabase
        .from('contributions')
        .insert({
          capsule_id: capsule.id,
          contributor_name: [
  customTitle.trim() || (title !== 'Other' ? title : ''),
  firstName.trim(),
  lastName.trim(),
].filter(Boolean).join(' '),
          city: city.trim(),
          country: country,
          relationship: relationship.trim() || null,
          tribute_text: message.trim(),
          email: email.trim() || null,
          thumbnail_url: photoUrl,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          status: 'pending_review',
          legacy_builder_consent: consent,
        })
        .select('id')
        .single()

      if (insertError) {
        setSubmitError('Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

// LC-PARTICIPATION-001: Record attribution if arrived via ref link
      const arrivalRef = sessionStorage.getItem('lc_arrival_ref_' + slug)
      if (arrivalRef && contribution) {
        try {
          const { data: referrer } = await supabase
            .from('contributions')
            .select('id')
            .eq('ref_code', arrivalRef)
            .single()
          await supabase.from('contribution_attribution').insert({
            contribution_id: contribution.id,
            ref_code: arrivalRef,
            referrer_contribution_id: referrer?.id ?? null,
            capsule_id: capsule.id,
          })
        } catch {}
        sessionStorage.removeItem('lc_arrival_ref_' + slug)
      }

      // 4. Send submission confirmation email if email provided (Path A)
      if (email.trim() && contribution) {
        await fetch('/api/email/submission-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributionId: contribution.id,
            capsuleSlug: capsule.slug,
            contributorName: name.trim(),
            contributorEmail: email.trim(),
            subjectName: capsule.honouree_name,
            eventType: capsule.event_type,
            tributeText: message.trim(),
          }),
        })
      }

      // 5. Advance to confirmation screen
      setStep('confirmation')
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch {
      setSubmitError('Something went wrong. Please try again.')
    }

    setSubmitting(false)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING / ERROR STATES
  // ─────────────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            This tribute wall is not available for submissions.
          </p>
          <Link href={'/' } style={{ color: '#D4AE2A', fontSize: '13px', textDecoration: 'none' }}>
            Return home
          </Link>
        </div>
      </main>
    )
  }

  if (!capsule) {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading...</p>
      </main>
    )
  }

  const subjectName = capsule.honouree_name
  const pageHeading = getSubmitPageHeading(capsule.event_type, subjectName)
  const relationshipLabel = getRelationshipLabel(capsule.event_type, subjectName)
  const capsuleUrl = typeof window !== 'undefined'
    ? window.location.origin + '/for/' + slug
    : 'https://itslegacycapsule.com/for/' + slug
  const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(
    'I just added my voice to ' + subjectName + '\'s story. Add yours here: ' + capsuleUrl
  )

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMATION SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'confirmation') {
    const confirmMsg = getConfirmationMessage(capsule.event_type, subjectName)
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <LogoCapsule size="sm" />
          </div>

          {/* Confirmation header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✦</div>
            <h1 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '26px', fontWeight: 700,
              color: '#F5F3EE', margin: '0 0 12px',
            }}>
              {confirmMsg}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
              Once reviewed by the organiser, your tribute will appear on the wall.
            </p>
          </div>

          {/* Preview of submitted tribute */}
          <div style={{ marginBottom: '32px' }}>
            <TributePreviewCard
              name={name}
              city={city}
              country={country}
              relationship={relationship}
              message={message}
              photoPreview={photoPreview}
            />
          </div>

          {/* Share prompt */}
          <div style={{
            padding: '20px 24px', borderRadius: '12px',
            border: '1px solid rgba(212,174,42,0.2)',
            backgroundColor: 'rgba(212,174,42,0.04)',
            marginBottom: '24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 14px' }}>
              Know someone else who would like to contribute?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  border: '1px solid rgba(37,211,102,0.35)',
                  color: 'rgba(37,211,102,0.8)', fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Share on WhatsApp
              </Link>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(capsuleUrl)
                  }
                }}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  border: '1px solid rgba(212,174,42,0.3)',
                  backgroundColor: 'transparent',
                  color: 'rgba(212,174,42,0.7)', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Copy link
              </button>
            </div>
          </div>

          {/* Back to wall */}
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
  // PREVIEW STEP — Q6: Ivory card preview IS the final submit step
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <main style={{ minHeight: '100vh', background: PAGE_BG, padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <LogoCapsule size="sm" />
          </div>

          {/* Preview heading */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{
              fontSize: '11px', color: 'rgba(212,174,42,0.6)',
              letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px',
            }}>
              Your tribute preview
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              This is exactly how your tribute will appear on the wall.
            </p>
          </div>

          {/* Edit link — above card */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setStep('form')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: '13px', padding: 0,
              }}
            >
              &#8592; Edit
            </button>
          </div>

          {/* Ivory card preview */}
          <div style={{ marginBottom: '28px' }}>
            <TributePreviewCard
              name={name}
              city={city}
              country={country}
              relationship={relationship}
              message={message}
              photoPreview={photoPreview}
            />
          </div>

          {/* Submit CTA */}
          {submitError && (
            <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
              {submitError}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AE2A, #B8960C)',
              border: 'none', color: '#0D0820',
              fontWeight: 700, fontSize: '15px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Tribute'}
          </button>

        </div>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORM STEP — D35 fields
  // ─────────────────────────────────────────────────────────────────────────
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

        {/* Page heading */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 700, color: '#F5F3EE',
            margin: '0 0 8px', lineHeight: 1.3,
          }}>
            {pageHeading}
          </h1>
          {capsule.event_tag && (
            <p style={{ color: '#D4AE2A', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
              {capsule.event_tag}
            </p>
          )}
        </div>

        {/* ── FORM FIELDS ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Title (optional) + First name + Last name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>
              Your Name<span style={goldAsterisk}>*</span>
            </label>
            {/* Title row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={title}
                onChange={e => { setTitle(e.target.value); if (e.target.value !== 'Other') setCustomTitle('') }}
                style={{ ...inputStyle, width: '130px', flexShrink: 0 }}
              >
                <option value="">Title (optional)</option>
                {TITLE_OPTIONS.map(t => <option key={t} value={t} style={{ backgroundColor: '#1A0F3E', color: '#FFFFFF' }}>{t}</option>)}
              </select>
              {title === 'Other' && (
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="Your title"
                  style={{ ...inputStyle, flex: 1 }}
                  maxLength={20}
                />
              )}
            </div>
            {/* First + Last name row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name *"
                  style={inputStyle}
                  maxLength={40}
                />
                {fieldErrors.firstName && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.firstName}</p>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name *"
                  style={inputStyle}
                  maxLength={40}
                />
                {fieldErrors.lastName && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* City * */}
          <div>
            <label style={labelStyle}>
              City<span style={goldAsterisk}>*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              style={inputStyle}
            />
            {fieldErrors.city && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.city}</p>
            )}
          </div>

          {/* Country * — dropdown from tributeWallHelpers */}
          <div>
            <label style={labelStyle}>
              Country<span style={goldAsterisk}>*</span>
            </label>
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

          {/* Tribute message * — live counter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                {lang?.singular ?? 'Voice'}<span style={goldAsterisk}>*</span>
              </label>
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
              placeholder={`Share your ${lang?.singular?.toLowerCase() ?? 'voice'} (up to 2,000 characters). For photos, stories and memories, use the Community Memories & Stories room.`}
            />
            {fieldErrors.message && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.message}</p>
            )}
          </div>

          {/* Relationship — optional, no marker */}
          <div>
            <label style={labelStyle}>{relationshipLabel}</label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. His daughter, A former student, Close friend"
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '5px', lineHeight: 1.5 }}>
              Describe how you are connected to {capsule?.honouree_name ?? 'them'}
            </p>
          </div>

          {/* Email — optional, no marker */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '6px', lineHeight: 1.5 }}>
              Leave your email to receive a keepsake of your tribute when it&apos;s approved.
            </p>
          </div>

          {/* Photo — optional, no marker */}
          <div>
            <label style={labelStyle}>Photo</label>
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{
                border: '1px dashed rgba(212,174,42,0.3)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
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
                    Tap to upload a photo
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
                  color: 'rgba(255,255,255,0.25)', fontSize: '12px', cursor: 'pointer', padding: 0,
                }}
              >
                Remove photo
              </button>
            )}
          </div>

        </div>

{/* LC-PARTICIPATION-001: Legacy Builder consent */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '8px' }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            style={{ marginTop: '3px', accentColor: '#D4AE2A' }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            If my tribute helps bring others to this collection, I'd like to be recognised as a Legacy Builder.
          </span>
        </label>

        {/* Preview CTA */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={handlePreview}
            style={{
              width: '100%', padding: '14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AE2A, #B8960C)',
              border: 'none', color: '#0D0820',
              fontWeight: 700, fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            Preview My {lang?.singular ?? 'Voice'} &#8594;
          </button>
        </div>

      </div>
    </main>
  )
}