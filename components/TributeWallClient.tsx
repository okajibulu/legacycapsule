'use client'

// ─────────────────────────────────────────────────────────────
// TRIBUTE WALL — Single-Page Experience v2
// Map hero → inline form → tribute cards. One surface. No routes.
// Design: Rich amethyst palette, warm gold, breathing typography.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES, formatTributeDate, getInitials } from '@/lib/tributeWallHelpers'

// ── TributeMap — ssr: false mandatory (Leaflet) ─────────────
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', backgroundColor: '#120E24' }} />,
})

// ── Supabase client ──────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Constants ────────────────────────────────────────────────
const MIN_CHARS = 20
const MAX_CHARS = 1000
const BUCKET = 'tribute-photos'
const LS_EMAIL = 'lc_visitor_email'

const ORNAMENTS: Record<string, string> = {
  'Memorial & Funeral': '🕊️', 'Wedding': '💍', 'Retirement': '🏅',
  'Milestone Birthday': '🎂', 'Anniversary': '💛', 'Graduation': '🎓',
  'Ordination': '✝️', 'Chieftaincy Ceremony': '👑', 'Award Ceremony': '🏆',
  'Thanksgiving Service': '🙏', 'Conference': '🎙️', 'Other': '✦',
}

// ── Palette — rich amethyst, warm gold, breathing ────────────
const P = {
  bg1: '#1A1035',
  bg2: '#241848',
  card: '#FEFCF8',
  cardShadow: 'rgba(0,0,0,0.12)',
  gold: '#E2C36B',
  goldDim: 'rgba(226,195,107,0.35)',
  goldGlow: 'rgba(226,195,107,0.15)',
  text: '#2C2840',
  textLight: '#6E6888',
  textFaint: 'rgba(255,255,255,0.4)',
  white90: 'rgba(255,255,255,0.9)',
  white60: 'rgba(255,255,255,0.6)',
  white25: 'rgba(255,255,255,0.25)',
  white10: 'rgba(255,255,255,0.1)',
  green: '#34D399',
  red: '#f87171',
}

// ── Types ────────────────────────────────────────────────────
interface Capsule {
  id: string; slug: string; honouree_name: string; event_type: string
  event_tag: string | null; page_state: string; tier: string
  hero_image_url: string | null; organiser_email: string
  free_tier_expires_at: string | null; created_at: string
}

interface Contribution {
  id: string; contributor_name: string; city: string; country: string
  relationship: string | null; tribute_text: string
  thumbnail_url: string | null; lat: number | null; lng: number | null
  status: string; email: string | null; created_at: string
}

interface Props {
  capsule: Capsule
  initialContributions: Contribution[]
}

// ── Photo compression ────────────────────────────────────────
async function compressPhoto(file: File): Promise<File> {
  try {
    const ic = (await import('browser-image-compression')).default
    return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
  } catch { return file }
}

// ── Geocode ──────────────────────────────────────────────────
async function geocode(city: string, country: string) {
  try {
    const r = await fetch('/api/geocode', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, country }),
    })
    if (!r.ok) return null
    const d = await r.json()
    return d.lat && d.lng ? { lat: d.lat, lng: d.lng } : null
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────
// TRIBUTE CARD — warm white, gold left accent, compact
// ─────────────────────────────────────────────────────────────
function TributeCard({
  c, isAdmin, isOwn, onApprove, isNew,
}: {
  c: Contribution; isAdmin: boolean; isOwn: boolean
  onApprove: (id: string) => void; isNew?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = c.tribute_text.length > 300
  const text = isLong && !expanded ? c.tribute_text.slice(0, 300) + '…' : c.tribute_text
  const isPending = c.status === 'pending_review' || c.status === 'pending'

  return (
    <div style={{
      backgroundColor: isPending ? 'rgba(226,195,107,0.06)' : P.card,
      borderLeft: '3px solid ' + (isPending ? P.goldDim : P.gold),
      borderRadius: '6px',
      padding: '10px 14px 10px 14px',
      marginBottom: '6px',
      boxShadow: isPending ? 'none' : '0 1px 4px ' + P.cardShadow,
      transition: 'all 0.4s ease',
      animation: isNew ? 'fadeSlideIn 0.5s ease-out' : undefined,
      ...(isPending ? { border: '1px dashed ' + P.goldDim, borderLeftWidth: '3px', borderLeftStyle: 'solid' } : {}),
    }}>
      {/* Header — name, location, date. One row. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '14px', fontWeight: 600,
          color: isPending ? 'rgba(255,255,255,0.7)' : P.text,
        }}>
          {c.contributor_name}
        </span>
        {isOwn && (
          <span style={{
            fontSize: '8px', color: P.gold, textTransform: 'uppercase',
            letterSpacing: '0.12em', fontWeight: 700,
          }}>you</span>
        )}
        <span style={{
          fontSize: '11px',
          color: isPending ? 'rgba(255,255,255,0.3)' : P.textLight,
          marginLeft: 'auto', whiteSpace: 'nowrap',
        }}>
          {c.city}{c.country ? ' · ' + c.country : ''}
        </span>
        <span style={{
          fontSize: '10px',
          color: isPending ? 'rgba(255,255,255,0.2)' : '#B0ACBA',
          whiteSpace: 'nowrap',
        }}>
          {formatTributeDate(c.created_at)}
        </span>
      </div>

      {/* Message */}
      <p style={{
        fontSize: '13.5px', lineHeight: '1.6',
        color: isPending ? 'rgba(255,255,255,0.55)' : P.text,
        margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {text}
      </p>

      {isLong && (
        <button onClick={() => setExpanded(e => !e)} style={{
          marginTop: '3px', fontSize: '11px', color: P.gold,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, fontWeight: 600,
        }}>
          {expanded ? 'Less' : 'More'}
        </button>
      )}

      {/* Pending badge + approve */}
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
          <span style={{
            fontSize: '9px', color: P.gold, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 600,
          }}>
            Pending
          </span>
          {isAdmin && (
            <button onClick={() => onApprove(c.id)} style={{
              marginLeft: 'auto', fontSize: '10px', padding: '2px 10px',
              borderRadius: '10px', backgroundColor: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)', color: P.green,
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
  const [all, setAll] = useState<Contribution[]>(initialContributions)
  const [formOpen, setFormOpen] = useState(false)
  const [visitorEmail, setVisitorEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)

  // ── Form ───────────────────────────────────────────────────
  const [fName, setFName] = useState('')
  const [fCity, setFCity] = useState('')
  const [fCountry, setFCountry] = useState('')
  const [fMsg, setFMsg] = useState('')
  const [fRel, setFRel] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPhoto, setFPhoto] = useState<File | null>(null)
  const [fPhotoPreview, setFPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCountries, setShowCountries] = useState(false)
  const [countryQ, setCountryQ] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // ── Derived ────────────────────────────────────────────────
  const name = capsule.honouree_name
  const title = getTributePageTitle(capsule.event_type, name)
  const ornament = ORNAMENTS[capsule.event_type] ?? '✦'
  const isAdmin = visitorEmail !== '' && visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase()

  const url = typeof window !== 'undefined'
    ? window.location.origin + '/for/' + capsule.slug
    : 'https://itslegacycapsule.com/for/' + capsule.slug

  const visible = all.filter(c => {
    if (c.status === 'approved') return true
    if (isAdmin) return true
    if (visitorEmail && c.email?.toLowerCase() === visitorEmail.toLowerCase()) return true
    return false
  })

  const pins = all
    .filter(c => c.status === 'approved' && c.lat && c.lng)
    .map(c => ({ lat: c.lat as number, lng: c.lng as number, name: c.contributor_name, country: c.country }))

  const approved = all.filter(c => c.status === 'approved').length
  const countries = new Set(all.filter(c => c.status === 'approved').map(c => c.country)).size

  const whatsapp = 'https://wa.me/?text=' + encodeURIComponent(
    'Leave a tribute for ' + name + ': ' + url
  )

  // ── Email persistence ──────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem(LS_EMAIL)
    if (s) { setVisitorEmail(s); setFEmail(s) }
  }, [])

  useEffect(() => {
    if (fEmail.includes('@')) {
      localStorage.setItem(LS_EMAIL, fEmail)
      setVisitorEmail(fEmail)
    }
  }, [fEmail])

  // ── Polling — 60s ──────────────────────────────────────────
  const poll = useCallback(async () => {
    const { data } = await supabase
      .from('contributions')
      .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, lat, lng, status, email, created_at')
      .eq('capsule_id', capsule.id)
      .order('created_at', { ascending: false })
    if (data) setAll(data as Contribution[])
  }, [capsule.id])

  useEffect(() => {
    const iv = setInterval(poll, 60_000)
    return () => clearInterval(iv)
  }, [poll])

  // ── Outside click — country dropdown ───────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node))
        setShowCountries(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Handlers ───────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleApprove = async (id: string) => {
    await supabase.from('contributions').update({ status: 'approved' }).eq('id', id)
    fetch('/api/email/approval', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contributionId: id }),
    }).catch(() => {})
    poll()
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const c = await compressPhoto(f)
    setFPhoto(c)
    const r = new FileReader()
    r.onload = ev => setFPhotoPreview(ev.target?.result as string)
    r.readAsDataURL(c)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fName.trim()) e.name = 'Required'
    if (!fCity.trim()) e.city = 'Required'
    if (!fCountry) e.country = 'Required'
    if (fMsg.trim().length < MIN_CHARS) e.msg = MIN_CHARS + '+ chars'
    if (fMsg.trim().length > MAX_CHARS) e.msg = 'Too long'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true); setSubmitErr('')
    try {
      let photoUrl: string | null = null
      if (fPhoto) {
        const ext = fPhoto.name.split('.').pop() ?? 'jpg'
        const path = capsule.id + '/' + Date.now() + '.' + ext
        const { error: ue } = await supabase.storage.from(BUCKET).upload(path, fPhoto, { upsert: false })
        if (!ue) { photoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
      }

      const coords = await geocode(fCity.trim(), fCountry)

      const { data: nc, error: ie } = await supabase
        .from('contributions')
        .insert({
          capsule_id: capsule.id,
          contributor_name: fName.trim(),
          city: fCity.trim(),
          country: fCountry,
          relationship: fRel.trim() || null,
          tribute_text: fMsg.trim(),
          email: fEmail.trim() || null,
          thumbnail_url: photoUrl,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          status: 'pending_review',
        })
        .select('id').single()

      if (ie) { setSubmitErr(ie.message); setSubmitting(false); return }

      if (fEmail.trim() && nc) {
        fetch('/api/email/submission-confirmation', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributionId: nc.id, capsuleSlug: capsule.slug,
            contributorName: fName.trim(), contributorEmail: fEmail.trim(),
            subjectName: name, eventType: capsule.event_type, tributeText: fMsg.trim(),
          }),
        }).catch(() => {})
      }

      if (fEmail.includes('@')) {
        localStorage.setItem(LS_EMAIL, fEmail); setVisitorEmail(fEmail)
      }

      setNewId(nc?.id ?? null)
      setTimeout(() => setNewId(null), 3000)

      setFormOpen(false)
      setFName(''); setFCity(''); setFCountry(''); setFMsg('')
      setFRel(''); setFPhoto(null); setFPhotoPreview(null); setErrors({})
      poll()
    } catch { setSubmitErr('Something went wrong.') }
    setSubmitting(false)
  }

  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(countryQ.toLowerCase())).slice(0, 12)

  // ── Input style ────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid ' + P.goldDim,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: P.white90, fontSize: '13px', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(168deg, ' + P.bg1 + ' 0%, ' + P.bg2 + ' 50%, ' + P.bg1 + ' 100%)',
    }}>

      {/* Keyframe for new card animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* ════════════════════════════════════════════════════
          TOP BAR — Logo left, "To Profile" right. Clean.
      ════════════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'linear-gradient(to bottom, rgba(26,16,53,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, color: P.gold,
          letterSpacing: '0.08em', pointerEvents: 'auto',
        }}>
          LEGACY<span style={{ color: P.white60 }}>CAPSULE</span>
        </span>
        <span
          style={{
            fontSize: '11px', color: P.white25, pointerEvents: 'auto',
            cursor: 'default',
          }}
          title="Capsule profile — coming soon"
        >
          To Profile
        </span>
      </header>

      {/* ════════════════════════════════════════════════════
          ZONE 1 — MAP HERO (full viewport)
      ════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

        {/* Map backdrop */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <TributeMap pins={pins} />
        </div>

        {/* Gradient veil — softer than before */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(26,16,53,0.45) 0%, rgba(26,16,53,0.25) 35%, rgba(26,16,53,0.8) 85%, ' + P.bg1 + ' 100%)',
          pointerEvents: 'none',
        }} />

        {/* Content over map */}
        <div style={{
          position: 'relative', zIndex: 10, height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 24px', textAlign: 'center',
        }}>

          {/* Ornament */}
          <div style={{ fontSize: '28px', marginBottom: '10px', lineHeight: 1, opacity: 0.9 }}>
            {ornament}
          </div>

          {/* Name */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(26px, 5.5vw, 48px)',
            fontWeight: 700, color: '#FFFFFF',
            margin: '0 0 8px', lineHeight: 1.15,
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
          }}>
            {title}
          </h1>

          {/* Event tag */}
          {capsule.event_tag && (
            <p style={{
              color: P.gold, fontSize: '11px',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              margin: '0 0 16px', fontWeight: 500,
            }}>
              {capsule.event_tag}
            </p>
          )}

          {/* Count */}
          <p style={{ fontSize: '12px', color: P.white60, margin: '0 0 20px' }}>
            {approved === 0
              ? 'Be the first to leave a tribute'
              : approved + ' tribute' + (approved !== 1 ? 's' : '') +
                (countries > 1 ? ' from ' + countries + ' countries' : '')}
          </p>

          {/* Share pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy} style={{
              padding: '5px 14px', borderRadius: '16px',
              border: '1px solid ' + P.goldDim,
              backgroundColor: P.goldGlow, color: copied ? P.gold : P.white60,
              fontSize: '11px', cursor: 'pointer', fontWeight: 500,
              transition: 'all 0.2s',
            }}>
              {copied ? '✓ Copied' : 'Share link'}
            </button>
            <Link href={whatsapp} target="_blank" rel="noopener noreferrer" style={{
              padding: '5px 14px', borderRadius: '16px',
              border: '1px solid rgba(52,211,153,0.25)',
              backgroundColor: 'rgba(52,211,153,0.08)',
              color: 'rgba(52,211,153,0.7)', fontSize: '11px',
              textDecoration: 'none', fontWeight: 500,
            }}>
              WhatsApp
            </Link>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute', bottom: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          }}>
            <span style={{ fontSize: '10px', color: P.white25, letterSpacing: '0.1em' }}>
              SCROLL
            </span>
            <div style={{
              width: '1px', height: '20px',
              background: 'linear-gradient(to bottom, ' + P.goldDim + ', transparent)',
            }} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ZONE 2 — TRIBUTE WALL
      ════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: '600px', margin: '0 auto',
        padding: '28px 16px 110px',
      }}>

        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <p style={{
            color: P.goldDim, fontSize: '9px',
            letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0,
          }}>
            ✦ TRIBUTE WALL ✦
          </p>
        </div>

        {/* ── Inline form (collapsible) ───────────────────── */}
        <div ref={formRef} style={{
          maxHeight: formOpen ? '600px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: formOpen ? '16px' : '0',
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid ' + P.goldDim,
            borderRadius: '10px',
            padding: '16px',
          }}>
            <p style={{
              fontSize: '10px', color: P.gold, letterSpacing: '0.18em',
              textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center',
            }}>
              Leave a tribute for {name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Name + photo button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fName} onChange={e => setFName(e.target.value)}
                    placeholder="Your name *" style={inp}
                    onFocus={e => e.target.style.borderColor = P.gold}
                    onBlur={e => e.target.style.borderColor = P.goldDim} />
                  {errors.name && <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>{errors.name}</p>}
                </div>
                <div onClick={() => photoRef.current?.click()} title={fPhotoPreview ? 'Change photo' : 'Add photo'}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                    border: '1.5px dashed ' + P.goldDim,
                    backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = P.gold}
                  onMouseLeave={e => e.currentTarget.style.borderColor = P.goldDim}
                >
                  {fPhotoPreview
                    ? <img src={fPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: P.goldDim, fontSize: '14px' }}>+</span>
                  }
                </div>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </div>

              {/* City + Country */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fCity} onChange={e => setFCity(e.target.value)}
                    placeholder="City *" style={inp}
                    onFocus={e => e.target.style.borderColor = P.gold}
                    onBlur={e => e.target.style.borderColor = P.goldDim} />
                  {errors.city && <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>{errors.city}</p>}
                </div>
                <div style={{ flex: 1, position: 'relative' }} ref={countryRef}>
                  <input type="text" value={fCountry || countryQ}
                    onChange={e => { setCountryQ(e.target.value); setFCountry(''); setShowCountries(true) }}
                    onFocus={() => setShowCountries(true)}
                    placeholder="Country *" style={inp} />
                  {errors.country && <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>{errors.country}</p>}
                  {showCountries && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      maxHeight: '140px', overflowY: 'auto',
                      backgroundColor: P.bg2, border: '1px solid ' + P.goldDim,
                      borderRadius: '6px', marginTop: '3px',
                    }}>
                      {filtered.map(c => (
                        <div key={c}
                          onClick={() => { setFCountry(c); setCountryQ(''); setShowCountries(false) }}
                          style={{
                            padding: '6px 10px', fontSize: '12px', color: P.white60,
                            cursor: 'pointer', borderBottom: '1px solid ' + P.white10,
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = P.goldGlow}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >{c}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <textarea rows={3} value={fMsg} onChange={e => setFMsg(e.target.value)}
                  placeholder={'Your tribute for ' + name + ' *'}
                  style={{ ...inp, resize: 'none', lineHeight: '1.5' }}
                  onFocus={e => e.target.style.borderColor = P.gold}
                  onBlur={e => e.target.style.borderColor = P.goldDim} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                  {errors.msg ? <span style={{ color: P.red, fontSize: '10px' }}>{errors.msg}</span> : <span />}
                  <span style={{
                    fontSize: '10px',
                    color: fMsg.length > MAX_CHARS ? P.red : fMsg.length >= MIN_CHARS ? P.goldDim : P.white25,
                  }}>{fMsg.length}/{MAX_CHARS}</span>
                </div>
              </div>

              {/* Relationship + Email on one row */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={fRel} onChange={e => setFRel(e.target.value)}
                  placeholder="Relationship" style={{ ...inp, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = P.gold}
                  onBlur={e => e.target.style.borderColor = P.goldDim} />
                <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)}
                  placeholder="Email (keepsake)" style={{ ...inp, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = P.gold}
                  onBlur={e => e.target.style.borderColor = P.goldDim} />
              </div>

              {submitErr && <p style={{ color: P.red, fontSize: '11px', textAlign: 'center' }}>{submitErr}</p>}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={submitting} style={{
                width: '100%', padding: '10px', borderRadius: '8px',
                background: 'linear-gradient(135deg, ' + P.gold + ', #C9A84E)',
                border: 'none', color: P.bg1, fontWeight: 700,
                fontSize: '13px', cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.03em',
                transition: 'opacity 0.2s',
              }}>
                {submitting ? 'Sending…' : 'Submit Tribute'}
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        {visible.map(c => (
          <TributeCard
            key={c.id} c={c} isAdmin={isAdmin}
            isOwn={visitorEmail !== '' && c.email?.toLowerCase() === visitorEmail.toLowerCase()}
            onApprove={handleApprove}
            isNew={c.id === newId}
          />
        ))}

        {visible.length === 0 && !formOpen && (
          <p style={{ textAlign: 'center', color: P.white25, fontSize: '13px', padding: '32px 0' }}>
            No tributes yet — be the first.
          </p>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px', paddingBottom: '8px' }}>
          <p style={{ color: P.white10, fontSize: '9px', letterSpacing: '0.08em' }}>
            VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ZONE 3 — FIXED BOTTOM CTA
      ════════════════════════════════════════════════════ */}
      <div
        onClick={() => {
          setFormOpen(o => !o)
          if (!formOpen) setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
        }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'linear-gradient(135deg, ' + P.gold + ', #C9A84E)',
          textAlign: 'center', padding: '11px 24px', cursor: 'pointer',
          boxShadow: '0 -2px 16px rgba(226,195,107,0.2)',
        }}
      >
        <span style={{
          color: P.bg1, fontWeight: 700, fontSize: '13px',
          letterSpacing: '0.06em',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {formOpen ? '✕ Close' : '✦ Add Your Tribute'}
        </span>
      </div>

    </div>
  )
}