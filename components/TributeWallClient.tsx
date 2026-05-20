'use client'

/* =========================================================
   TRIBUTE WALL CLIENT — v7
   All fixes from second review pass:
   - LogoCapsule component (sm) in top bar
   - Action strip larger, better tap targets, less gap below
   - Map band = compact preview, click to expand full modal
   - Card gaps space-y-2.5, left padding px-4
   - Hero placeholder: /honouree.jpg
   - Profile photo upload (organiser only)

   SECTIONS:
   1.  Imports
   2.  Constants & Config
   3.  Types
   4.  Utilities
   5.  TributeCard component
   6.  PremiumFeatureModal component
   7.  MapModal component
   8.  ProfileSection renderer
   9.  Main component
   10. — State
   11. — Derived values
   12. — Effects
   13. — Handlers
   14. — Render
========================================================= */

/* =========================================================
   SECTION 1 — IMPORTS
========================================================= */
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import LogoCapsule from '@/components/LogoCapsule'
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES } from '@/lib/tributeWallHelpers'
import type {
  Capsule,
  Contribution,
  ProfileSection,
  FeaturedPhoto,
} from '@/app/for/[slug]/page'

/* =========================================================
   SECTION 2 — CONSTANTS & CONFIG
========================================================= */
const MIN_CHARS = 20
const MAX_CHARS = 1000
const BUCKET = 'tribute-photos'
const LS_EMAIL = 'lc_visitor_email'

const ORNAMENTS: Record<string, string> = {
  'Memorial & Funeral': '🕊️',
  'Wedding': '💍',
  'Retirement': '🏅',
  'Milestone Birthday': '🎂',
  'Anniversary': '💛',
  'Graduation': '🎓',
  'Ordination': '✝️',
  'Chieftaincy Ceremony': '👑',
  'Award Ceremony': '🏆',
  'Thanksgiving Service': '🙏',
  'Conference': '🎙️',
  'Other': '✦',
}

const inputBase = [
  'w-full text-sm px-3 py-2.5 rounded-lg',
  'text-white placeholder:text-yellow-100/55',
  'bg-white/10 backdrop-blur-sm',
  'border border-yellow-400/45',
  'shadow-[0_0_8px_rgba(234,179,8,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]',
  'hover:border-yellow-300/65 hover:bg-white/14',
  'focus:outline-none focus:border-yellow-300/85',
  'focus:bg-white/18',
  'focus:shadow-[0_0_0_2px_rgba(234,179,8,0.18),0_0_16px_rgba(234,179,8,0.45)]',
  'transition-all duration-200',
].join(' ')

// Dynamic import — Leaflet must never run SSR (D43)
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full" style={{ background: '#130630' }} />,
})

/* =========================================================
   SECTION 3 — TYPES
========================================================= */
interface Pin {
  lat: number
  lng: number
  name: string
  country: string
}

interface Props {
  capsule: Capsule
  initialContributions: Contribution[]
  profileSections: ProfileSection[]
  featuredPhotos: FeaturedPhoto[]
}

/* =========================================================
   SECTION 4 — UTILITIES
========================================================= */
async function compressPhoto(file: File): Promise<File> {
  try {
    const ic = (await import('browser-image-compression')).default
    return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
  } catch {
    return file
  }
}

async function getIPCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch('/api/ip-geocode')
    if (!r.ok) return null
    const d = await r.json()
    return d.lat && d.lng ? { lat: d.lat, lng: d.lng } : null
  } catch {
    return null
  }
}

/* =========================================================
   SECTION 5 — TRIBUTE CARD COMPONENT
========================================================= */
function TributeCard({
  c, isAdmin, isOwn, onApprove, onDelete, onEdit,
}: {
  c: Contribution
  isAdmin: boolean
  isOwn: boolean
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.tribute_text)

  const isLong = c.tribute_text.length > 260
  const text = isLong && !expanded ? c.tribute_text.slice(0, 260) + '…' : c.tribute_text
  const isPending = c.status === 'pending_review' || c.status === 'pending'

  // Contributor: Edit/Delete only while pending. Admin: always.
  const canEdit = (isOwn && isPending) || isAdmin
  const canDelete = (isOwn && isPending) || isAdmin

  // Relationship in brackets after name
  const displayName = c.relationship
    ? `${c.contributor_name} (${c.relationship})`
    : c.contributor_name

  return (
    <div style={{
      borderRadius: '10px',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      backgroundColor: isPending ? 'rgba(234,179,8,0.06)' : 'rgba(255,255,255,0.07)',
      border: '1px solid ' + (isPending
        ? 'rgba(234,179,8,0.35)'
        : isOwn ? 'rgba(180,140,255,0.28)' : 'rgba(255,255,255,0.11)'),
      boxShadow: isPending ? '0 2px 12px rgba(234,179,8,0.07)' : '0 2px 8px rgba(0,0,0,0.25)',
      transition: 'all 0.2s',
    }}>
      <div className="px-4 py-3">

        {/* Card header — name(rel) · location · date */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-xs font-semibold text-yellow-200 truncate max-w-[150px] flex-shrink-0">
            {displayName}
            {isOwn && (
              <span className="ml-1.5 text-[9px] font-normal text-purple-300/55 uppercase tracking-widest">you</span>
            )}
          </span>
          <span className="text-[10px] text-white/50 truncate flex-1">
            {[c.city, c.country].filter(Boolean).join(' · ')}
          </span>
          <span className="text-[10px] text-white/30 whitespace-nowrap flex-shrink-0">
            {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* Message body */}
        {editing ? (
          <div className="space-y-1.5 mt-1">
            <textarea
              className={inputBase + ' text-xs min-h-[56px] resize-none'}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              maxLength={MAX_CHARS}
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => { onEdit(c.id, editText); setEditing(false) }}
                className="text-[11px] px-3 py-1 rounded-md bg-yellow-400 text-purple-950 font-semibold hover:bg-yellow-300 transition-colors"
              >Save</button>
              <button
                onClick={() => { setEditing(false); setEditText(c.tribute_text) }}
                className="text-[11px] px-3 py-1 rounded-md border border-white/20 text-white/50 hover:border-white/35 transition-colors"
              >Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/88 leading-relaxed">{text}</p>
            {isLong && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-[11px] text-yellow-400/70 mt-0.5 hover:text-yellow-300 transition-colors"
              >{expanded ? 'Show less' : 'Read more'}</button>
            )}
          </>
        )}

        {/* Status + actions */}
        <div className="flex items-center gap-2 mt-2">
          {isPending && (
            <span className="text-[9px] text-yellow-500/65 tracking-widest uppercase">· Awaiting review</span>
          )}
          <div className="flex gap-1.5 ml-auto">
            {isAdmin && isPending && !editing && (
              <button
                onClick={() => onApprove(c.id)}
                className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/12 border border-emerald-400/25 text-emerald-300/85 hover:bg-emerald-500/22 transition-colors"
              >Approve</button>
            )}
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] px-2.5 py-0.5 rounded-md border border-white/18 text-white/45 hover:border-yellow-400/40 hover:text-yellow-300/70 transition-colors"
              >Edit</button>
            )}
            {canDelete && !editing && (
              <button
                onClick={() => { if (window.confirm('Remove this tribute?')) onDelete(c.id) }}
                className="text-[10px] px-2.5 py-0.5 rounded-md border border-red-400/22 text-red-400/55 hover:border-red-400/40 hover:text-red-400/80 transition-colors"
              >Delete</button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

/* =========================================================
   SECTION 6 — PREMIUM FEATURE MODAL
========================================================= */
function PremiumModal({ feature, onClose }: { feature: 'video' | 'audio' | null; onClose: () => void }) {
  if (!feature) return null
  const isVideo = feature === 'video'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,2,20,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-6 text-center relative"
        style={{
          background: 'linear-gradient(145deg, #1e0d4e, #2a1060)',
          border: '1px solid rgba(226,195,107,0.35)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(226,195,107,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
        <div className="text-3xl mb-3">{isVideo ? '🎬' : '🎙️'}</div>
        <h3 className="text-base font-bold text-yellow-300 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          {isVideo ? 'Video' : 'Audio'} Tributes
        </h3>
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {isVideo ? 'Video' : 'Audio'} contributions are a premium feature.
          Contact us to activate this for your capsule.
        </p>
        <a
          href="mailto:hello@itslegacycapsule.com"
          className="inline-block text-xs px-5 py-2 rounded-full font-semibold"
          style={{ background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845' }}
        >Get in touch</a>
        <button onClick={onClose} className="absolute top-3 right-3 text-white/30 hover:text-white/60 text-xl leading-none transition-colors">×</button>
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 7 — MAP MODAL COMPONENT
   Full-screen overlay with expanded interactive map.
   Opened by clicking the compact map band.
========================================================= */
function MapModal({ pins, honourName, uniqueCountries, onClose }: {
  pins: Pin[]
  honourName: string
  uniqueCountries: string[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(8,2,26,0.95)', backdropFilter: 'blur(4px)' }}
    >
      {/* Modal top bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(226,195,107,0.2)' }}
      >
        <div>
          <p className="text-xs font-semibold text-yellow-300 tracking-wide">Tribute Map</p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {uniqueCountries.length > 0
              ? `${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'country' : 'countries'} represented`
              : 'No pins yet — pending approvals'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors text-2xl leading-none px-2"
        >×</button>
      </div>

      {/* Map fills remaining space */}
      <div className="flex-1 relative">
        <TributeMap pins={pins} />
      </div>

      {/* Bottom label */}
      <div
        className="flex-shrink-0 text-center py-3 px-4"
        style={{ borderTop: '1px solid rgba(226,195,107,0.15)' }}
      >
        <p className="text-[10px] text-yellow-400/50 tracking-wide">
          {uniqueCountries.length > 0
            ? `People from ${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'country' : 'countries'} have honoured ${honourName}`
            : 'Pins appear as tributes are approved and geocoded'}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 8 — PROFILE SECTION RENDERER
========================================================= */
function ProfileSectionBlock({ section }: { section: ProfileSection }) {
  const title = section.custom_title ?? section.section_type.replace(/_/g, ' ')
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/30 to-transparent" />
        <h3 className="text-xs tracking-[0.25em] uppercase text-yellow-400/70 font-medium">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-l from-yellow-400/30 to-transparent" />
      </div>
      {section.content && (
        <p className="text-sm text-white/70 leading-relaxed text-center px-2">{section.content}</p>
      )}
    </div>
  )
}

/* =========================================================
   SECTION 9 — MAIN COMPONENT
========================================================= */
export default function TributeWallClient({
  capsule, initialContributions, profileSections, featuredPhotos,
}: Props) {

  /* =========================================================
     SECTION 10 — STATE
  ========================================================= */
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [all, setAll] = useState<Contribution[]>(initialContributions)
  const [visitorEmail, setVisitorEmail] = useState('')
  const [premiumModal, setPremiumModal] = useState<'video' | 'audio' | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Profile photo upload state
  const [heroImage, setHeroImage] = useState<string | null>(
    capsule.hero_image_url ?? null
  )
  const [uploadingHero, setUploadingHero] = useState(false)
  const heroPhotoRef = useRef<HTMLInputElement>(null)

  // Form state
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fCity, setFCity] = useState('')
  const [fCountry, setFCountry] = useState('')
  const [fMsg, setFMsg] = useState('')
  const [fRel, setFRel] = useState('')
  const [fPhoto, setFPhoto] = useState<File | null>(null)
  const [fPhotoPreview, setFPhotoPreview] = useState<string | null>(null)
  const [countryQuery, setCountryQuery] = useState('')
  const [showCountryList, setShowCountryList] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  /* =========================================================
     SECTION 11 — DERIVED VALUES
  ========================================================= */
  const honourName = capsule.honouree_name
  const pageTitle = getTributePageTitle(capsule.event_type, honourName)
  const ornament = ORNAMENTS[capsule.event_type] ?? '✦'

  const isAdmin =
    visitorEmail !== '' &&
    visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase()

  const visible = all.filter(c => {
    if (c.status === 'approved') return true
    if (isAdmin) return true
    if (visitorEmail && c.email?.toLowerCase() === visitorEmail.toLowerCase()) return true
    return false
  })

  const approvedCount = all.filter(c => c.status === 'approved').length

  const pins: Pin[] = all
    .filter(c => c.status === 'approved' && c.lat && c.lng)
    .map(c => ({
      lat: c.lat as number,
      lng: c.lng as number,
      name: c.contributor_name,
      country: c.country,
    }))

  const uniqueCountries = [...new Set(pins.map(p => p.country).filter(Boolean))]

  const capsuleUrl =
    typeof window !== 'undefined'
      ? window.location.origin + '/for/' + capsule.slug
      : 'https://itslegacycapsule.com/for/' + capsule.slug

  // Hero: capsule field → featured photo is_hero → public placeholder
  const resolvedHero =
    heroImage ??
    featuredPhotos.find(p => p.is_hero)?.image_url ??
    '/honouree.jpg'

  /* =========================================================
     SECTION 12 — EFFECTS
  ========================================================= */
  useEffect(() => {
    const saved = localStorage.getItem(LS_EMAIL)
    if (saved) { setVisitorEmail(saved); setFEmail(saved) }
  }, [])

  useEffect(() => {
    if (fEmail.includes('@')) {
      localStorage.setItem(LS_EMAIL, fEmail)
      setVisitorEmail(fEmail)
    }
  }, [fEmail])

  const poll = useCallback(async () => {
    const { data } = await supabaseClient
      .from('contributions')
      .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (data) setAll(data as Contribution[])
  }, [capsule.id])

  useEffect(() => {
    const iv = setInterval(poll, 60_000)
    return () => clearInterval(iv)
  }, [poll])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node))
        setShowCountryList(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Lock body scroll when map modal is open
  useEffect(() => {
    document.body.style.overflow = mapOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mapOpen])

  /* =========================================================
     SECTION 13 — HANDLERS
  ========================================================= */
  const handleApprove = async (id: string) => {
    await supabaseClient.from('contributions').update({ status: 'approved' }).eq('id', id)
    fetch('/api/email/approval', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contributionId: id }),
    }).catch(() => {})
    poll()
  }

  const handleDelete = async (id: string) => {
    await supabaseClient.from('contributions').delete().eq('id', id)
    poll()
  }

  const handleEdit = async (id: string, text: string) => {
    await supabaseClient.from('contributions').update({ tribute_text: text }).eq('id', id)
    poll()
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressPhoto(f)
    setFPhoto(compressed)
    const reader = new FileReader()
    reader.onload = ev => setFPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(compressed)
  }

  // Hero photo upload — organiser only
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !isAdmin) return
    setUploadingHero(true)
    try {
      const compressed = await compressPhoto(f)
      const ext = compressed.name.split('.').pop() ?? 'jpg'
      const path = `hero/${capsule.id}.${ext}`
      const { error: ue } = await supabaseClient.storage
        .from(BUCKET)
        .upload(path, compressed, { upsert: true })
      if (ue) throw ue
      const url = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      await supabaseClient.from('capsules').update({ hero_image_url: url }).eq('id', capsule.id)
      setHeroImage(url)
    } catch (err) {
      console.error('Hero upload failed:', err)
    }
    setUploadingHero(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(capsuleUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fName.trim()) e.name = 'Name required'
    if (!fEmail.trim() || !fEmail.includes('@')) e.email = 'Valid email required'
    if (!fCity.trim()) e.city = 'City required'
    if (!fCountry) e.country = 'Country required'
    if (fMsg.trim().length < MIN_CHARS) e.msg = `${MIN_CHARS}+ characters required`
    if (fMsg.trim().length > MAX_CHARS) e.msg = `Over ${MAX_CHARS} limit`
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
        const { error: ue } = await supabaseClient.storage
          .from(BUCKET).upload(path, fPhoto, { upsert: false })
        if (!ue) {
          photoUrl = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
        }
      }

      // IP-based geocoding — real sender location for map pin
      const coords = await getIPCoords()

      // CRITICAL: contributor_name — not name (Gotcha #3)
      const { data: nc, error: ie } = await supabaseClient
        .from('contributions')
        .insert({
          capsule_id: capsule.id,
          contributor_name: fName.trim(),
          city: fCity.trim(),
          country: fCountry,
          relationship: fRel.trim() || null,
          tribute_text: fMsg.trim(),
          email: fEmail.trim(),
          thumbnail_url: photoUrl,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          status: 'pending_review',
        })
        .select('id').single()

      if (ie) { setSubmitErr(ie.message); setSubmitting(false); return }

      if (nc) {
        fetch('/api/email/submission-confirmation', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributionId: nc.id, capsuleSlug: capsule.slug,
            contributorName: fName.trim(), contributorEmail: fEmail.trim(),
            subjectName: honourName, eventType: capsule.event_type,
            tributeText: fMsg.trim(),
          }),
        }).catch(() => {})
      }

      localStorage.setItem(LS_EMAIL, fEmail)
      setVisitorEmail(fEmail)
      setFName(''); setFCity(''); setFCountry(''); setFMsg('')
      setFRel(''); setFPhoto(null); setFPhotoPreview(null)
      setCountryQuery(''); setErrors({})
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3500)
      poll()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch {
      setSubmitErr('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  /* =========================================================
     SECTION 14 — RENDER
  ========================================================= */
  const pageBg = 'linear-gradient(160deg, #1d0b48 0%, #2e1070 40%, #200c55 70%, #160740 100%)'

  return (
    <>
      {/* Modals */}
      <PremiumModal feature={premiumModal} onClose={() => setPremiumModal(null)} />
      {mapOpen && (
        <MapModal
          pins={pins}
          honourName={honourName}
          uniqueCountries={uniqueCountries}
          onClose={() => setMapOpen(false)}
        />
      )}

      <div className="min-h-screen w-full flex justify-center" style={{ background: pageBg }}>
        <div className="w-full max-w-lg flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

          {/* ═══════════════════════════════════════════════
              SECTION 14A — TOP BAR
              LogoCapsule sm · no To Profile link
          ═══════════════════════════════════════════════ */}
          <div className="flex-shrink-0 flex items-center px-4 pt-3 pb-1.5">
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <LogoCapsule size="sm" />
            </Link>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 14B — HERO PANEL
              Rounded card · backdrop photo · form
          ═══════════════════════════════════════════════ */}
          <div
            className="flex-shrink-0 relative overflow-hidden mx-3 rounded-2xl"
            style={{ minHeight: '280px' }}
          >
            {/* Background — photo or radial gradient */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${resolvedHero})` }}
            />

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/90" />
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(226,195,107,0.10) 0%, transparent 55%)',
            }} />

            {/* Gold rules */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/65 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/35 to-transparent" />

            {/* Dot texture */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, rgba(226,195,107,0.12) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              opacity: 0.45,
            }} />

            {/* Organiser: change photo button */}
            {isAdmin && (
              <div className="absolute top-2.5 right-2.5 z-20">
                <button
                  onClick={() => heroPhotoRef.current?.click()}
                  disabled={uploadingHero}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all duration-150"
                  style={{
                    background: 'rgba(10,2,26,0.75)',
                    border: '1px solid rgba(226,195,107,0.35)',
                    color: 'rgba(226,195,107,0.75)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {uploadingHero ? 'Uploading…' : '📷 Change photo'}
                </button>
                <input
                  ref={heroPhotoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 px-4 pt-5 pb-4">

              {/* Ornament + Title + Tag */}
              <div className="text-center mb-4">
                <div className="text-2xl mb-1 leading-none">{ornament}</div>
                <h1
                  className="font-extrabold tracking-tight text-yellow-300"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(20px, 6vw, 30px)',
                    textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 32px rgba(234,179,8,0.4)',
                    lineHeight: 1.2,
                  }}
                >{pageTitle}</h1>
                {capsule.event_tag && (
                  <p className="text-[11px] text-yellow-400/80 tracking-[0.22em] uppercase mt-1.5">
                    {capsule.event_tag}
                  </p>
                )}
              </div>

              {/* Gold divider */}
              <div className="flex items-center gap-2 px-6 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-400/45" />
                <span className="text-yellow-400/55 text-xs">✦</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-400/45" />
              </div>

              {/* FORM */}
              <div className="space-y-2.5">

                {/* Row 1 — Name · Email · Photo */}
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <input className={inputBase} placeholder="Your name *"
                      value={fName} onChange={e => setFName(e.target.value)} maxLength={50} />
                    {errors.name && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.name}</p>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input type="email" className={inputBase} placeholder="Email *"
                      value={fEmail} onChange={e => setFEmail(e.target.value)} maxLength={100} />
                    {errors.email && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.email}</p>}
                  </div>
                  <div
                    onClick={() => photoRef.current?.click()}
                    className="flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200"
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      border: '1px dashed rgba(226,195,107,0.45)',
                      background: 'rgba(255,255,255,0.07)',
                    }}
                  >
                    {fPhotoPreview
                      ? <img src={fPhotoPreview} alt="" className="w-full h-full object-cover" />
                      : <span style={{ color: 'rgba(226,195,107,0.55)', fontSize: '20px', lineHeight: 1 }}>+</span>
                    }
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>

                {/* Row 2 — City · Country · Relationship */}
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <input className={inputBase} placeholder="City *"
                      value={fCity} onChange={e => setFCity(e.target.value)} maxLength={50} />
                    {errors.city && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.city}</p>}
                  </div>
                  <div className="flex-1 min-w-0 relative" ref={countryRef}>
                    <input
                      className={inputBase} placeholder="Country *"
                      value={countryQuery || fCountry}
                      onChange={e => { setCountryQuery(e.target.value); setFCountry(''); setShowCountryList(true) }}
                      onFocus={() => setShowCountryList(true)}
                      maxLength={50}
                    />
                    {errors.country && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.country}</p>}
                    {showCountryList && (
                      <div
                        className="absolute z-30 mt-1 w-full max-h-36 overflow-y-auto rounded-xl"
                        style={{
                          background: 'rgba(18,6,48,0.97)',
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(226,195,107,0.22)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.75)',
                        }}
                      >
                        {COUNTRIES
                          .filter(c => c.toLowerCase().includes((countryQuery || '').toLowerCase()))
                          .slice(0, 20)
                          .map(c => (
                            <div
                              key={c}
                              className="px-3 py-1.5 cursor-pointer transition-colors border-b border-yellow-400/6 last:border-0"
                              style={{ fontSize: '13px', color: 'rgba(255,235,160,0.85)' }}
                              onMouseDown={() => { setFCountry(c); setCountryQuery(''); setShowCountryList(false) }}
                            >{c}</div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input className={inputBase} placeholder="Relationship"
                      value={fRel} onChange={e => setFRel(e.target.value)} maxLength={50} />
                  </div>
                </div>

                {/* Row 3 — Tribute textarea + Submit */}
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0 relative">
                    <textarea
                      className={inputBase + ' resize-none leading-snug block'}
                      style={{ minHeight: '64px', maxHeight: '84px' }}
                      placeholder={`Leave a tribute for ${honourName}…`}
                      value={fMsg}
                      onChange={e => setFMsg(e.target.value)}
                      maxLength={MAX_CHARS}
                      rows={2}
                    />
                    <span
                      className="absolute bottom-2 right-2 text-[9px] pointer-events-none select-none"
                      style={{ color: fMsg.length > 900 ? 'rgba(226,195,107,0.75)' : 'rgba(255,255,255,0.22)' }}
                    >{fMsg.length}/{MAX_CHARS}</span>
                    {errors.msg && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.msg}</p>}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-shrink-0 self-start px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(145deg, #E2C36B, #C9A84E)',
                      color: '#1a0845',
                      border: '1px solid rgba(226,195,107,0.5)',
                      boxShadow: '0 0 14px rgba(226,195,107,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >{submitting ? '…' : 'Submit'}</button>
                </div>

                {/* Row 4 — Action strip (no extra margin below) */}
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => setPremiumModal('video')}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-150"
                    style={{
                      border: '1px solid rgba(255,255,255,0.16)',
                      color: 'rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  >🎬 Video</button>

                  <button
                    onClick={() => setPremiumModal('audio')}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-150"
                    style={{
                      border: '1px solid rgba(255,255,255,0.16)',
                      color: 'rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  >🎙️ Audio</button>

                  <div className="flex-1" />

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-150"
                    style={{
                      border: '1px solid rgba(226,195,107,0.32)',
                      color: copied ? 'rgba(226,195,107,0.95)' : 'rgba(226,195,107,0.65)',
                      background: copied ? 'rgba(226,195,107,0.10)' : 'rgba(255,255,255,0.05)',
                    }}
                  >{copied ? '✓ Copied' : '🔗 Copy'}</button>

                  <Link
                    href={`https://wa.me/?text=${encodeURIComponent('Leave a tribute for ' + honourName + ': ' + capsuleUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-150"
                    style={{
                      border: '1px solid rgba(74,222,128,0.28)',
                      color: 'rgba(74,222,128,0.70)',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  >💬 Share</Link>
                </div>

                {/* Feedback */}
                {submitSuccess && (
                  <div className="rounded-xl px-3 py-2 text-xs text-center tracking-wide" style={{
                    border: '1px solid rgba(226,195,107,0.35)',
                    background: 'rgba(226,195,107,0.08)',
                    color: 'rgba(226,195,107,0.92)',
                  }}>
                    ✦ Your tribute has been received — thank you.
                  </div>
                )}
                {submitErr && <p className="text-[11px] text-red-400/85 text-center">{submitErr}</p>}

              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 14C — MAP BAND
              Compact teaser · click to expand full modal
              No extra margin below — sits flush before wall header
          ═══════════════════════════════════════════════ */}
          <div
            className="flex-shrink-0 mt-2 relative cursor-pointer group"
            style={{ height: '130px' }}
            onClick={() => setMapOpen(true)}
            title="Click to expand map"
          >
            {/* Gold rules */}
            <div className="absolute top-0 left-0 right-0 h-px z-10"
              style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.35), transparent)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-px z-10"
              style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.35), transparent)' }} />

            {/* Map */}
            <div className="w-full h-full overflow-hidden pointer-events-none">
              <TributeMap pins={pins} />
            </div>

            {/* Expand hint — appears on hover/always */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <span
                className="text-[10px] px-3 py-1 rounded-full tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  background: 'rgba(10,2,26,0.82)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(226,195,107,0.3)',
                  color: 'rgba(226,195,107,0.8)',
                }}
              >🗺 Expand map</span>
            </div>

            {/* Country count — bottom */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none z-10">
              <span
                className="text-[9px] px-3 py-0.5 rounded-full tracking-wide"
                style={{
                  background: 'rgba(10,2,26,0.72)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(226,195,107,0.58)',
                }}
              >
                {uniqueCountries.length > 0
                  ? `${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'country' : 'countries'} · tap to expand`
                  : 'Pins appear as tributes are approved'}
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 14D — TRIBUTE WALL HEADER
          ═══════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2">
            <h2
              className="text-center font-bold tracking-[0.2em] uppercase text-sm text-yellow-300"
              style={{ textShadow: '0 0 14px rgba(226,195,107,0.4)' }}
            >Tribute Wall</h2>
            <p className="text-center text-xs text-white/50 mt-0.5">
              {approvedCount > 0
                ? `${approvedCount} ${approvedCount === 1 ? 'person has' : 'people have'} honoured ${honourName}`
                : `Be the first to honour ${honourName}`}
            </p>
            <div className="h-px mt-2"
              style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.28), transparent)' }} />
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 14E — TRIBUTE CONTAINER
              Capped · internal scroll · space-y-2.5 card gaps
          ═══════════════════════════════════════════════ */}
          <div
            className="mx-3 mb-5 rounded-2xl overflow-hidden flex-shrink-0"
            style={{
              height: '360px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.18)',
            }}
          >
            <div
              className="h-full overflow-y-auto px-2.5 py-2.5 space-y-2.5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(226,195,107,0.18) transparent' }}
            >
              {visible.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-white/30 text-sm tracking-wide">
                    Be the first to leave a tribute.
                  </p>
                </div>
              )}
              {visible.map(c => (
                <TributeCard
                  key={c.id} c={c}
                  isAdmin={isAdmin}
                  isOwn={visitorEmail !== '' && c.email?.toLowerCase() === visitorEmail.toLowerCase()}
                  onApprove={handleApprove}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 14F — PROFILE CANVAS
          ═══════════════════════════════════════════════ */}
          <div id="profile" className="px-4 pb-12">

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.35))' }} />
              <span className="text-[10px] tracking-[0.3em] uppercase text-yellow-400/55">About</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(226,195,107,0.35))' }} />
            </div>

            {/* Cover photo — editorial size */}
            <div className="mb-8 rounded-2xl overflow-hidden relative" style={{ aspectRatio: '16/9', maxHeight: '220px' }}>
              <img
                src={resolvedHero}
                alt={honourName}
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.88) saturate(1.1)' }}
              />
              {/* Organiser upload overlay on profile photo */}
              {isAdmin && (
                <div className="absolute inset-0 flex items-end justify-end p-3">
                  <button
                    onClick={() => heroPhotoRef.current?.click()}
                    className="text-[10px] px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(10,2,26,0.8)',
                      border: '1px solid rgba(226,195,107,0.4)',
                      color: 'rgba(226,195,107,0.8)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >{uploadingHero ? 'Uploading…' : '📷 Update photo'}</button>
                </div>
              )}
            </div>

            {/* Honouree name */}
            <div className="text-center mb-8">
              <h2
                className="font-extrabold text-yellow-300"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(24px, 7vw, 36px)',
                  textShadow: '0 0 40px rgba(226,195,107,0.3)',
                  lineHeight: 1.2,
                }}
              >{honourName}</h2>
              {capsule.honouree_title && (
                <p className="text-sm text-white/50 mt-1 tracking-wide">{capsule.honouree_title}</p>
              )}
              {capsule.event_tag && (
                <p className="text-[11px] text-yellow-400/60 tracking-[0.2em] uppercase mt-2">{capsule.event_tag}</p>
              )}
              {capsule.event_date && (
                <p className="text-[11px] text-white/35 mt-1">
                  {new Date(capsule.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Dynamic profile sections */}
            {profileSections.length > 0 ? (
              profileSections.map(section => (
                <ProfileSectionBlock key={section.id} section={section} />
              ))
            ) : (
              <div
                className="rounded-2xl p-6 text-center mb-6"
                style={{ border: '1px dashed rgba(226,195,107,0.15)', background: 'rgba(226,195,107,0.03)' }}
              >
                <p className="text-xs text-white/30 tracking-wide leading-relaxed">
                  The organiser can add a story, gallery, milestones and more
                  to this profile from the capsule dashboard.
                </p>
              </div>
            )}

            {/* Featured photos grid */}
            {featuredPhotos.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.25))' }} />
                  <span className="text-[10px] tracking-[0.3em] uppercase text-yellow-400/50">Gallery</span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(226,195,107,0.25))' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {featuredPhotos.map(photo => (
                    <div key={photo.id} className="rounded-xl overflow-hidden" style={{ aspectRatio: '1' }}>
                      <img src={photo.image_url} alt={photo.caption ?? ''} className="w-full h-full object-cover" style={{ filter: 'brightness(0.9)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 pb-2">
              <div className="h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.15), transparent)' }} />
              <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <LogoCapsule size="sm" />
              </Link>
              <p className="text-[9px] text-white/15 mt-2 tracking-widest uppercase">Events end. Legacies don't.</p>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}
