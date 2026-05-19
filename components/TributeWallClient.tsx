'use client'

// ─────────────────────────────────────────────────────────────
// TRIBUTE WALL — Single-Page Experience
// Map hero backdrop → tribute cards → inline form drawer.
// Everything happens on one surface. No route changes.
// D43: Client island. Server component owns initial data fetch.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES, formatTributeDate, getInitials } from '@/lib/tributeWallHelpers'

// ─────────────────────────────────────────────────────────────
// DYNAMIC IMPORT — TributeMap (Leaflet, ssr: false mandatory)
// ─────────────────────────────────────────────────────────────
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: '#080014',
    }} />
  ),
})

// ─────────────────────────────────────────────────────────────
// SUPABASE — anon key for client-side operations
// ─────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─────────────────────────────────────────────────────────────
// ORNAMENT MAP
// ─────────────────────────────────────────────────────────────
const ORNAMENTS: Record<string, string> = {
  'Memorial & Funeral': '🕊️', 'Wedding': '💍',
  'Retirement': '🏅', 'Milestone Birthday': '🎂',
  'Anniversary': '💛', 'Graduation': '🎓',
  'Ordination': '✝️', 'Chieftaincy Ceremony': '👑',
  'Award Ceremony': '🏆', 'Thanksgiving Service': '🙏',
  'Conference': '🎙️', 'Other': '✦',
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const MIN_CHARS = 20
const MAX_CHARS = 1000
const BUCKET = 'tribute-photos'
const LS_EMAIL_KEY = 'lc_visitor_email'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Capsule {
  id: string
  slug: string
  honouree_name: string
  event_type: string
  event_tag: string | null
  page_state: string
  tier: string
  hero_image_url: string | null
  organiser_email: string
  free_tier_expires_at: string | null
  created_at: string
}

interface Contribution {
  id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  status: string
  email: string | null
  created_at: string
}

interface Props {
  capsule: Capsule
  initialContributions: Contribution[]
}

// ─────────────────────────────────────────────────────────────
// PHOTO COMPRESSION — D17
// ─────────────────────────────────────────────────────────────
async function compressPhoto(file: File): Promise<File> {
  try {
    const ic = (await import('browser-image-compression')).default
    return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
  } catch { return file }
}

// ─────────────────────────────────────────────────────────────
// GEOCODE HELPER
// ─────────────────────────────────────────────────────────────
async function geocode(city: string, country: string) {
  try {
    const r = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, country }),
    })
    if (!r.ok) return null
    const d = await r.json()
    return d.lat && d.lng ? { lat: d.lat, lng: d.lng } : null
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────
// TRIBUTE CARD — Compact, ivory, gold left border
// ─────────────────────────────────────────────────────────────
function TributeCard({
  c, isAdmin, isOwn, onApprove,
}: {
  c: Contribution
  isAdmin: boolean
  isOwn: boolean
  onApprove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = c.tribute_text.length > 280
  const text = isLong && !expanded
    ? c.tribute_text.slice(0, 280) + '…'
    : c.tribute_text
  const isPending = c.status === 'pending_review' || c.status === 'pending'

  return (
    <div style={{
      backgroundColor: isPending ? 'rgba(212,174,42,0.06)' : '#F5F3EE',
      borderLeft: '3px solid ' + (isPending ? 'rgba(212,174,42,0.4)' : '#D4AE2A'),
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '8px',
      border: isPending ? '1px dashed rgba(212,174,42,0.3)' : undefined,
      borderLeftWidth: '3px',
      borderLeftStyle: 'solid',
      borderLeftColor: isPending ? 'rgba(212,174,42,0.4)' : '#D4AE2A',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>

        {/* Avatar */}
        {c.photo_url ? (
          <img src={c.photo_url} alt="" style={{
            width: '32px', height: '32px', borderRadius: '50%',
            objectFit: 'cover', flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: '#2D1B69',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#D4AE2A', fontSize: '12px', fontWeight: 700 }}>
              {getInitials(c.contributor_name)}
            </span>
          </div>
        )}

        {/* Name + location */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '14px', fontWeight: 600, color: '#1a1a2e',
          }}>
            {c.contributor_name}
          </span>
          {isOwn && (
            <span style={{
              marginLeft: '6px', fontSize: '9px', color: '#B8960C',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>You</span>
          )}
          <div style={{ fontSize: '11px', color: '#7a7a8a', marginTop: '1px' }}>
            {c.city}{c.country ? ' · ' + c.country : ''}
            {c.relationship ? ' · ' + c.relationship : ''}
          </div>
        </div>

        {/* Date */}
        <span style={{ fontSize: '10px', color: '#9a9aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatTributeDate(c.created_at)}
        </span>
      </div>

      {/* Message */}
      <p style={{
        fontSize: '13.5px', lineHeight: '1.65', color: '#2a2a3e',
        margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {text}
      </p>

      {isLong && (
        <button onClick={() => setExpanded(e => !e)} style={{
          marginTop: '4px', fontSize: '11px', color: '#B8960C',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600,
        }}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Pending + Approve */}
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '10px', color: '#B8960C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Pending approval
          </span>
          {isAdmin && (
            <button onClick={() => onApprove(c.id)} style={{
              marginLeft: 'auto', fontSize: '11px', padding: '3px 12px',
              borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e',
              cursor: 'pointer', fontWeight: 600,
            }}>
              Approve
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function TributeWallClient({ capsule, initialContributions }: Props) {

  // ── State ──────────────────────────────────────────────────
  const [allContributions, setAllContributions] = useState<Contribution[]>(initialContributions)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [visitorEmail, setVisitorEmail] = useState('')
  const [copied, setCopied] = useState(false)

  // ── Form state ─────────────────────────────────────────────
  const [formStep, setFormStep] = useState<'form' | 'preview'>('form')
  const [fName, setFName] = useState('')
  const [fCity, setFCity] = useState('')
  const [fCountry, setFCountry] = useState('')
  const [fMessage, setFMessage] = useState('')
  const [fRelationship, setFRelationship] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPhoto, setFPhoto] = useState<File | null>(null)
  const [fPhotoPreview, setFPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countryFilter, setCountryFilter] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)

  // ── Derived ────────────────────────────────────────────────
  const subjectName = capsule.honouree_name
  const pageTitle = getTributePageTitle(capsule.event_type, subjectName)
  const ornament = ORNAMENTS[capsule.event_type] ?? '✦'
  const isAdmin = visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase() && visitorEmail !== ''

  const capsuleUrl = typeof window !== 'undefined'
    ? window.location.origin + '/for/' + capsule.slug
    : 'https://itslegacycapsule.com/for/' + capsule.slug

  // Visible contributions — approved for everyone, pending for owner/admin
  const visibleContributions = allContributions.filter(c => {
    if (c.status === 'approved') return true
    if (isAdmin) return true
    if (visitorEmail && c.email?.toLowerCase() === visitorEmail.toLowerCase()) return true
    return false
  })

  // Map pins
  const mapPins = allContributions
    .filter(c => c.status === 'approved' && c.latitude && c.longitude)
    .map(c => ({
      lat: c.latitude as number,
      lng: c.longitude as number,
      name: c.contributor_name,
      country: c.country,
    }))

  // Unique countries count
  const uniqueCountries = new Set(
    allContributions.filter(c => c.status === 'approved').map(c => c.country)
  ).size

  const approvedCount = allContributions.filter(c => c.status === 'approved').length

  // WhatsApp
  const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(
    'Leave a tribute for ' + subjectName + ': ' + capsuleUrl
  )

  // ── Load visitor email from localStorage ───────────────────
  useEffect(() => {
    const stored = localStorage.getItem(LS_EMAIL_KEY)
    if (stored) {
      setVisitorEmail(stored)
      setFEmail(stored)
    }
  }, [])

  // ── Save email to localStorage when form email changes ─────
  useEffect(() => {
    if (fEmail.includes('@')) {
      localStorage.setItem(LS_EMAIL_KEY, fEmail)
      setVisitorEmail(fEmail)
    }
  }, [fEmail])

  // ── Polling — 60s ──────────────────────────────────────────
  const poll = useCallback(async () => {
    const { data } = await supabase
      .from('contributions')
      .select('id, contributor_name, city, country, relationship, tribute_text, photo_url, latitude, longitude, status, email, created_at')
      .eq('capsule_id', capsule.id)
      .order('created_at', { ascending: false })
    if (data) setAllContributions(data as Contribution[])
  }, [capsule.id])

  useEffect(() => {
    const iv = setInterval(poll, 60_000)
    return () => clearInterval(iv)
  }, [poll])

  // ── Close country dropdown on outside click ────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Copy link ──────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(capsuleUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Approve ────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    await supabase.from('contributions').update({ status: 'approved' }).eq('id', id)

    // Trigger keepsake card email
    fetch('/api/email/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contributionId: id }),
    }).catch(() => {})

    poll()
  }

  // ── Photo handler ──────────────────────────────────────────
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressPhoto(file)
    setFPhoto(compressed)
    const reader = new FileReader()
    reader.onload = (ev) => setFPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(compressed)
  }

  // ── Validate ───────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!fName.trim()) e.name = 'Required'
    if (!fCity.trim()) e.city = 'Required'
    if (!fCountry) e.country = 'Required'
    if (fMessage.trim().length < MIN_CHARS) e.message = MIN_CHARS + ' chars minimum'
    if (fMessage.trim().length > MAX_CHARS) e.message = 'Over ' + MAX_CHARS + ' limit'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Preview ────────────────────────────────────────────────
  const handlePreview = () => {
    if (!validate()) return
    setFormStep('preview')
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      let photoUrl: string | null = null
      if (fPhoto) {
        const ext = fPhoto.name.split('.').pop() ?? 'jpg'
        const path = capsule.id + '/' + Date.now() + '.' + ext
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, fPhoto, { upsert: false })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      }

      const coords = await geocode(fCity.trim(), fCountry)

      // CRITICAL: contributor_name — not name. Gotcha #3.
      const { data: newContrib, error: insertErr } = await supabase
        .from('contributions')
        .insert({
          capsule_id: capsule.id,
          contributor_name: fName.trim(),
          city: fCity.trim(),
          country: fCountry,
          relationship: fRelationship.trim() || null,
          tribute_text: fMessage.trim(),
          email: fEmail.trim() || null,
          photo_url: photoUrl,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          status: 'pending_review',
        })
        .select('id')
        .single()

      if (insertErr) {
        setSubmitError(insertErr.message || 'Failed to submit. Try again.')
        setSubmitting(false)
        return
      }

      // Trigger confirmation email if email provided
      if (fEmail.trim() && newContrib) {
        fetch('/api/email/submission-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributionId: newContrib.id,
            capsuleSlug: capsule.slug,
            contributorName: fName.trim(),
            contributorEmail: fEmail.trim(),
            subjectName: capsule.honouree_name,
            eventType: capsule.event_type,
            tributeText: fMessage.trim(),
          }),
        }).catch(() => {})
      }

      // Save email, close drawer, reset form, refresh
      if (fEmail.includes('@')) {
        localStorage.setItem(LS_EMAIL_KEY, fEmail)
        setVisitorEmail(fEmail)
      }
      setDrawerOpen(false)
      setFormStep('form')
      setFName(''); setFCity(''); setFCountry(''); setFMessage('')
      setFRelationship(''); setFPhoto(null); setFPhotoPreview(null)
      setFieldErrors({})
      poll()
    } catch {
      setSubmitError('Something went wrong. Try again.')
    }
    setSubmitting(false)
  }

  // ── Filtered countries for dropdown ────────────────────────
  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countryFilter.toLowerCase())
  ).slice(0, 15)

  // ── Shared input style ─────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid rgba(212,174,42,0.25)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#FFFFFF', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif',
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0820' }}>

      {/* ════════════════════════════════════════════════════
          ZONE 1 — MAP HERO BACKDROP (full viewport)
      ════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

        {/* Map fills entire viewport */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <TributeMap pins={mapPins} />
        </div>

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(13,8,32,0.5) 0%, rgba(13,8,32,0.3) 40%, rgba(13,8,32,0.85) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Content floating over map */}
        <div style={{
          position: 'relative', zIndex: 10,
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 24px', textAlign: 'center',
        }}>

          {/* Small logo */}
          <p style={{
            fontSize: '9px', color: 'rgba(212,174,42,0.5)',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            LegacyCapsule
          </p>

          {/* Ornament */}
          <div style={{ fontSize: '32px', marginBottom: '12px', lineHeight: 1 }}>
            {ornament}
          </div>

          {/* Honouree name */}
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: 700, color: '#FFFFFF',
            margin: '0 0 10px', lineHeight: 1.15,
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}>
            {pageTitle}
          </h1>

          {/* Event tag */}
          {capsule.event_tag && (
            <p style={{
              color: '#D4AE2A', fontSize: '12px',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              margin: '0 0 20px',
            }}>
              {capsule.event_tag}
            </p>
          )}

          {/* Tribute count */}
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
            {approvedCount === 0
              ? 'Be the first to leave a tribute'
              : approvedCount + ' tribute' + (approvedCount !== 1 ? 's' : '') +
                (uniqueCountries > 1 ? ' from ' + uniqueCountries + ' countries' : '')}
          </p>

          {/* Share buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button onClick={handleCopy} style={{
              padding: '6px 16px', borderRadius: '20px',
              border: '1px solid rgba(212,174,42,0.3)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: copied ? '#D4AE2A' : 'rgba(255,255,255,0.5)',
              fontSize: '11px', cursor: 'pointer',
            }}>
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
              padding: '6px 16px', borderRadius: '20px',
              border: '1px solid rgba(37,211,102,0.3)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(37,211,102,0.7)',
              fontSize: '11px', textDecoration: 'none',
            }}>
              WhatsApp
            </Link>
          </div>

          {/* Profile link — greyed out, coming soon */}
          <p style={{
            fontSize: '12px', color: 'rgba(255,255,255,0.2)',
            cursor: 'default',
          }} title="Capsule profile — coming soon">
            About {subjectName} — Coming Soon
          </p>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ZONE 2 — TRIBUTE CARDS
      ════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: '640px', margin: '0 auto',
        padding: '24px 16px 100px',
      }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{
            color: 'rgba(212,174,42,0.5)', fontSize: '10px',
            letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 6px',
          }}>
            ── ✦ TRIBUTE WALL ✦ ──
          </p>
        </div>

        {/* Cards */}
        {visibleContributions.map(c => (
          <TributeCard
            key={c.id}
            c={c}
            isAdmin={isAdmin}
            isOwn={visitorEmail !== '' && c.email?.toLowerCase() === visitorEmail.toLowerCase()}
            onApprove={handleApprove}
          />
        ))}

        {/* Empty state */}
        {visibleContributions.length === 0 && (
          <p style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.15)',
            fontSize: '13px', padding: '40px 0',
          }}>
            No tributes yet — be the first.
          </p>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>
            VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ZONE 3 — FIXED BOTTOM CTA
      ════════════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#D4AE2A', textAlign: 'center',
        padding: '12px 24px', cursor: 'pointer',
      }} onClick={() => { setDrawerOpen(true); setFormStep('form') }}>
        <span style={{
          color: '#0D0820', fontWeight: 700, fontSize: '14px',
          letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif',
        }}>
          ✦ Add Your Tribute
        </span>
      </div>

      {/* ════════════════════════════════════════════════════
          DRAWER — Slides up 75%
      ════════════════════════════════════════════════════ */}

      {/* Scrim */}
      {drawerOpen && (
        <div
          onClick={() => { setDrawerOpen(false); setFormStep('form') }}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            backgroundColor: 'rgba(0,0,0,0.55)',
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '75vh', zIndex: 100,
        backgroundColor: '#0D0820',
        borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
        borderTop: '2px solid rgba(212,174,42,0.3)',
        transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        overflowY: 'auto',
        padding: '20px 20px 32px',
      }}>

        {/* Drag handle */}
        <div style={{
          width: '36px', height: '4px', borderRadius: '2px',
          backgroundColor: 'rgba(212,174,42,0.3)',
          margin: '0 auto 16px',
        }} />

        {/* ── FORM STEP ────────────────────────────────────── */}
        {formStep === 'form' && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>

            <p style={{
              fontSize: '10px', color: 'rgba(212,174,42,0.6)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              marginBottom: '12px', textAlign: 'center',
            }}>
              Leave a tribute for {subjectName}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Name row with photo button */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fName} onChange={e => setFName(e.target.value)}
                    placeholder="Your name *" style={inputStyle} />
                  {fieldErrors.name && <p style={{ color: '#f87171', fontSize: '10px', marginTop: '2px' }}>{fieldErrors.name}</p>}
                </div>

                {/* Photo circle button */}
                <div
                  onClick={() => photoRef.current?.click()}
                  title={fPhotoPreview ? 'Change photo' : 'Add photo'}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    border: '2px dashed rgba(212,174,42,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    cursor: 'pointer', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,174,42,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(212,174,42,0.3)')}
                >
                  {fPhotoPreview ? (
                    <img src={fPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'rgba(212,174,42,0.4)', fontSize: '16px' }}>+</span>
                  )}
                </div>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </div>

              {/* City + Country row */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fCity} onChange={e => setFCity(e.target.value)}
                    placeholder="City *" style={inputStyle} />
                  {fieldErrors.city && <p style={{ color: '#f87171', fontSize: '10px', marginTop: '2px' }}>{fieldErrors.city}</p>}
                </div>
                <div style={{ flex: 1, position: 'relative' }} ref={countryRef}>
                  <input
                    type="text"
                    value={fCountry || countryFilter}
                    onChange={e => { setCountryFilter(e.target.value); setFCountry(''); setShowCountryDropdown(true) }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder="Country *"
                    style={inputStyle}
                  />
                  {fieldErrors.country && <p style={{ color: '#f87171', fontSize: '10px', marginTop: '2px' }}>{fieldErrors.country}</p>}
                  {showCountryDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      zIndex: 110, maxHeight: '160px', overflowY: 'auto',
                      backgroundColor: 'rgba(13,8,32,0.97)', border: '1px solid rgba(212,174,42,0.25)',
                      borderRadius: '8px', marginTop: '4px',
                    }}>
                      {filteredCountries.map(c => (
                        <div key={c} onClick={() => { setFCountry(c); setCountryFilter(''); setShowCountryDropdown(false) }}
                          style={{
                            padding: '6px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(212,174,42,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <textarea
                  rows={4} value={fMessage}
                  onChange={e => setFMessage(e.target.value)}
                  placeholder={'Your tribute for ' + subjectName + ' *'}
                  style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  {fieldErrors.message
                    ? <span style={{ color: '#f87171', fontSize: '10px' }}>{fieldErrors.message}</span>
                    : <span />}
                  <span style={{
                    fontSize: '10px',
                    color: fMessage.length > MAX_CHARS ? '#f87171'
                      : fMessage.length >= MIN_CHARS ? 'rgba(212,174,42,0.5)'
                      : 'rgba(255,255,255,0.2)',
                  }}>
                    {fMessage.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Relationship */}
              <input type="text" value={fRelationship} onChange={e => setFRelationship(e.target.value)}
                placeholder="Relationship (optional)" style={inputStyle} />

              {/* Email */}
              <div>
                <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)}
                  placeholder="Email (for keepsake card)" style={inputStyle} />
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}>
                  We will send you a keepsake of your tribute when approved
                </p>
              </div>

              {/* Preview CTA */}
              <button onClick={handlePreview} style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #D4AE2A, #B8960C)',
                border: 'none', color: '#0D0820', fontWeight: 700,
                fontSize: '14px', cursor: 'pointer', marginTop: '4px',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Preview Tribute →
              </button>
            </div>
          </div>
        )}

        {/* ── PREVIEW STEP ─────────────────────────────────── */}
        {formStep === 'preview' && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>

            <p style={{
              fontSize: '10px', color: 'rgba(212,174,42,0.6)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              marginBottom: '8px', textAlign: 'center',
            }}>
              Your tribute preview
            </p>

            <button onClick={() => setFormStep('form')} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '10px',
            }}>
              ← Edit
            </button>

            {/* Preview card — exactly as it will appear */}
            <div style={{
              backgroundColor: '#F5F3EE', borderLeft: '3px solid #D4AE2A',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {fPhotoPreview ? (
                  <img src={fPhotoPreview} alt="" style={{
                    width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#2D1B69',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#D4AE2A', fontSize: '12px', fontWeight: 700 }}>
                      {getInitials(fName || 'You')}
                    </span>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
                    {fName || 'Your name'}
                  </span>
                  <div style={{ fontSize: '11px', color: '#7a7a8a' }}>
                    {fCity || 'City'}{fCountry ? ' · ' + fCountry : ''}
                    {fRelationship ? ' · ' + fRelationship : ''}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: '#9a9aaa' }}>
                  {formatTributeDate(new Date().toISOString())}
                </span>
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: '1.65', color: '#2a2a3e', margin: 0, whiteSpace: 'pre-wrap' }}>
                {fMessage}
              </p>
            </div>

            {submitError && (
              <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', marginBottom: '8px' }}>
                {submitError}
              </p>
            )}

            <button onClick={handleSubmit} disabled={submitting} style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AE2A, #B8960C)',
              border: 'none', color: '#0D0820', fontWeight: 700,
              fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1, fontFamily: 'DM Sans, sans-serif',
            }}>
              {submitting ? 'Submitting…' : 'Submit Tribute'}
            </button>
          </div>
        )}

      </div>

    </div>
  )
}