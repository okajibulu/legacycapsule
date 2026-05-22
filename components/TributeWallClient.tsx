'use client'

/* =========================================================
   TRIBUTE WALL CLIENT — v8
   Fixes from third review pass:
   - Top bar: centred two-tone LEGACY CAPSULE text (no SVG)
   - Profile: circular centred photo + name/tag replaces ABOUT
   - Action strip: larger icons, tooltips on all four
   - Map band: royal dark + gold pulse + scanlines + notice
   - Map modal: draggable (locked=false passed to TributeMap)

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
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES } from '@/lib/tributeWallHelpers'
/* =========================================================
   SECTION 1B — LOCAL TYPES
   Defined here to avoid importing from server component.
========================================================= */
interface Capsule {
  id: string
  slug: string
  honouree_name: string
  honouree_title: string | null
  event_type: string
  event_tag: string | null
  event_date: string | null
  page_state: string
  tier: string | null
  hero_image_url: string | null
  organiser_email: string
  free_tier_expires_at: string | null
  created_at: string
  approved_contrib_count: number
  components: string[]
}

interface Contribution {
  id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  thumbnail_url: string | null
  audio_url: string | null
  video_url: string | null
  lat: number | null
  lng: number | null
  status: string
  email: string | null
  created_at: string
}

interface ProfileSection {
  id: string
  section_type: string
  custom_title: string | null
  content: string | null
  sort_order: number
  is_active: boolean
}

interface FeaturedPhoto {
  id: string
  image_url: string
  caption: string | null
  sort_order: number | null
  is_hero: boolean | null
}

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
  'w-full text-sm px-4 py-3.5 rounded-2xl',
  'text-white placeholder:text-yellow-100/45',
  'bg-white/[0.07] backdrop-blur-xl',
  'border border-white/[0.08]',
  'shadow-[0_0_12px_rgba(0,0,0,0.18)]',
  'hover:bg-white/[0.09]',
  'hover:border-yellow-300/20',
  'focus:outline-none',
  'focus:bg-white/[0.11]',
  'focus:border-yellow-300/35',
  'focus:shadow-[0_0_0_1px_rgba(226,195,107,0.12),0_0_20px_rgba(226,195,107,0.12)]',
  'transition-all duration-200',
].join(' ')

// Dynamic import — never SSR (D43)
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full" style={{ background: '#0a0218' }} />,
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
  const canEdit = (isOwn && isPending) || isAdmin
  const canDelete = (isOwn && isPending) || isAdmin
  const displayName = c.relationship
    ? `${c.contributor_name} (${c.relationship})`
    : c.contributor_name

  return (
    <div style={{
  borderRadius: '18px',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  backgroundColor: isPending
    ? 'rgba(234,179,8,0.06)'
    : 'rgba(255,255,255,0.055)',

  border: '1px solid ' + (
    isPending
      ? 'rgba(234,179,8,0.28)'
      : isOwn
        ? 'rgba(180,140,255,0.20)'
        : 'rgba(255,255,255,0.07)'
  ),

  boxShadow: isPending
    ? '0 6px 22px rgba(234,179,8,0.08)'
    : '0 6px 22px rgba(0,0,0,0.24)',

  transition: 'all 0.24s ease',
}}>
      <div className="px-7 py-4">
        <div className="flex items-baseline gap-2.5 mb-3">
          <span className="text-xs font-semibold text-yellow-200 truncate max-w-[150px] flex-shrink-0">
            {displayName}
            {isOwn && (
              <span className="ml-1.5 text-[9px] font-normal text-purple-300/55 uppercase tracking-widest">you</span>
            )}
          </span>
          <span className="text-[10px] text-white/50 truncate flex-1">
            {[c.city, c.country].filter(Boolean).join(' · ')}
          </span>
          <span className="text-[10px] text-white/30 opacity-70 whitespace-nowrap flex-shrink-0">
            {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {editing ? (
          <div className="space-y-1.5 mt-1">
            <textarea
              className={inputBase + ' text-xs min-h-[56px] resize-none'}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              maxLength={MAX_CHARS}
            />
            <div className="flex gap-1.5">
              <button onClick={() => { onEdit(c.id, editText); setEditing(false) }}
                className="text-[11px] px-3 py-1 rounded-md bg-yellow-400 text-purple-950 font-semibold hover:bg-yellow-300 transition-colors">
                Save
              </button>
              <button onClick={() => { setEditing(false); setEditText(c.tribute_text) }}
                className="text-[11px] px-3 py-1 rounded-md border border-white/20 text-white/50 hover:border-white/35 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
           <p className="text-[15px] text-white/90 leading-7 tracking-[0.01em] pl-1">
  {text}
</p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)}
                className="text-[11px] text-yellow-400/70 mt-0.5 hover:text-yellow-300 transition-colors">
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}

        <div className="flex items-center gap-2 mt-2">
          {isPending && (
            <span className="text-[9px] text-yellow-500/65 tracking-widest uppercase">· Awaiting review</span>
          )}
          <div className="flex gap-1.5 ml-auto">
            {isAdmin && isPending && !editing && (
              <button onClick={() => onApprove(c.id)}
                className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/12 border border-emerald-400/25 text-emerald-300/85 hover:bg-emerald-500/22 transition-colors">
                Approve
              </button>
            )}
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)}
                className="text-[10px] px-2.5 py-0.5 rounded-md border border-white/18 text-white/45 hover:border-yellow-400/40 hover:text-yellow-300/70 transition-colors">
                Edit
              </button>
            )}
            {canDelete && !editing && (
              <button onClick={() => { if (window.confirm('Remove this tribute?')) onDelete(c.id) }}
                className="text-[10px] px-2.5 py-0.5 rounded-md border border-red-400/22 text-red-400/55 hover:border-red-400/40 hover:text-red-400/80 transition-colors">
                Delete
              </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,2,20,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl p-6 text-center relative"
        style={{
          background: 'linear-gradient(145deg, #1e0d4e, #2a1060)',
          border: '1px solid rgba(226,195,107,0.35)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(226,195,107,0.08)',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
        <div className="text-3xl mb-3">{isVideo ? '🎬' : '🎙️'}</div>
        <h3 className="text-base font-bold text-yellow-300 mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {isVideo ? 'Video' : 'Audio'} Tributes
        </h3>
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {isVideo ? 'Video' : 'Audio'} contributions are a premium feature.
          Contact us to activate this for your capsule.
        </p>
        <a href="mailto:hello@itslegacycapsule.com"
          className="inline-block text-xs px-5 py-3.5 rounded-full font-semibold"
          style={{ background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845' }}>
          Get in touch
        </a>
        <button onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 text-xl leading-none transition-colors">×</button>
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 7 — MAP MODAL
   Full-screen · draggable map (locked=false)
========================================================= */
function MapModal({ pins, honourName, uniqueCountries, onClose }: {
  pins: Pin[]
  honourName: string
  uniqueCountries: string[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(8,2,26,0.96)', backdropFilter: 'blur(4px)' }}>
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: '1px solid rgba(226,195,107,0.2)' }}>
        <div>
          <p className="text-xs font-semibold text-yellow-300 tracking-wide">World Tribute Map</p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {uniqueCountries.length > 0
              ? `${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'country' : 'countries'} represented · drag to explore`
              : 'No pins yet — approve tributes to see them appear'}
          </p>
        </div>
        <button onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors text-2xl leading-none px-2">×</button>
      </div>
      <div className="flex-1 relative">
        <TributeMap pins={pins} locked={false} />
      </div>
      <div className="flex-shrink-0 text-center py-3.5 px-4"
        style={{ borderTop: '1px solid rgba(226,195,107,0.15)' }}>
        <p className="text-[10px] text-yellow-400/50 tracking-wide">
          {uniqueCountries.length > 0
            ? `People from ${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'country' : 'countries'} have honoured ${honourName}`
            : 'Pins appear as tributes are approved'}
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
  const [heroImage, setHeroImage] = useState<string | null>(capsule.hero_image_url ?? null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const heroPhotoRef = useRef<HTMLInputElement>(null)

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

  const isAdmin = visitorEmail !== '' &&
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
    .map(c => ({ lat: c.lat as number, lng: c.lng as number, name: c.contributor_name, country: c.country }))

  const uniqueCountries = [...new Set(pins.map(p => p.country).filter(Boolean))]

  const capsuleUrl = typeof window !== 'undefined'
    ? window.location.origin + '/for/' + capsule.slug
    : 'https://itslegacycapsule.com/for/' + capsule.slug

  const resolvedHero = heroImage ?? featuredPhotos.find(p => p.is_hero)?.image_url ?? '/honouree.jpg'

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

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !isAdmin) return
    setUploadingHero(true)
    try {
      const compressed = await compressPhoto(f)
      const ext = compressed.name.split('.').pop() ?? 'jpg'
      const path = `hero/${capsule.id}.${ext}`
      const { error: ue } = await supabaseClient.storage
        .from(BUCKET).upload(path, compressed, { upsert: true })
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

      const coords = await getIPCoords()

      // CRITICAL: contributor_name not name (Gotcha #3)
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
      {/* CSS for map gold pulse + scanlines */}
      <style>{`
        @keyframes goldPulse {
          0%, 100% { opacity: 0.0; transform: scale(0.95); }
          50%       { opacity: 0.5; transform: scale(1.05); }
        }
        .map-pulse {
          animation: goldPulse 3.5s ease-in-out infinite;
        }
        @keyframes scanMove {
          0%   { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        .map-scanlines {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(0,0,0,0.18) 3px,
            rgba(0,0,0,0.18) 4px
          );
          animation: scanMove 1.2s linear infinite;
        }
      `}</style>

      <PremiumModal feature={premiumModal} onClose={() => setPremiumModal(null)} />
      {mapOpen && (
        <MapModal
          pins={pins}
          honourName={honourName}
          uniqueCountries={uniqueCountries}
          onClose={() => setMapOpen(false)}
        />
      )}

<div
  className="h-screen overflow-hidden w-full flex justify-center"
  style={{ background: pageBg }}
>
  <div
    className="w-full max-w-lg flex flex-col h-full"
    style={{ fontFamily: "'DM Sans', sans-serif" }}
  >

          {/* ═══════════════════════════════════════════════
              SECTION 15 — TOP BAR
              Centred two-tone LEGACY CAPSULE text — no SVG
          ═══════════════════════════════════════════════ */}
          <div className="flex-shrink-0 flex items-center justify-center px-4 pt-4 pb-1.5">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.18em',
                background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>LEGACY</span>
              <span style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.38)',
                marginLeft: '0.18em',
              }}>CAPSULE</span>
            </Link>
          </div>

          {/* ═══════════════════════════════════════════════
              FROZEN EXPERIENCE
          ═══════════════════════════════════════════════ */}
          <div
            className="flex-shrink-0 relative overflow-hidden mx-3 rounded-2xl"
            style={{ minHeight: '340px' }}
          >
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${resolvedHero})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/90" />
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(226,195,107,0.10) 0%, transparent 55%)',
            }} />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/65 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/35 to-transparent" />
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, rgba(226,195,107,0.12) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              opacity: 0.45,
            }} />

            {/* Organiser: change cover photo */}
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
                >{uploadingHero ? 'Uploading…' : '📷 Change photo'}</button>
                <input ref={heroPhotoRef} type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
              </div>
            )}

            <div className="relative z-10 px-4 pt-5 pb-4">
              <div className="text-center mb-4">
                <div className="text-2xl mb-1 leading-none">{ornament}</div>
                <h1 className="font-extrabold tracking-tight text-yellow-300"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(20px, 6vw, 30px)',
                    textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 32px rgba(234,179,8,0.4)',
                    lineHeight: 1.2,
                  }}>{pageTitle}</h1>
                {capsule.event_tag && (
                  <p className="text-[11px] text-yellow-400/80 tracking-[0.22em] uppercase mt-1.5">
                    {capsule.event_tag}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 px-6 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-400/45" />
                <span className="text-yellow-400/55 text-xs">✦</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-400/45" />
              </div>

              {/* FORM */}
              <div className="space-y-2.5">

                {/* Row 1 — Name · Email · Photo */}
                <div className="flex gap-3 items-start mt-2">
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
                  <div onClick={() => photoRef.current?.click()}
                    className="flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px dashed rgba(226,195,107,0.45)', background: 'rgba(255,255,255,0.07)' }}>
                    {fPhotoPreview
                      ? <img src={fPhotoPreview} alt="" className="w-full h-full object-cover" />
                      : <span style={{ color: 'rgba(226,195,107,0.55)', fontSize: '20px', lineHeight: 1 }}>+</span>
                    }
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>

                {/* Row 2 — City · Country · Relationship */}
                <div className="flex gap-3 mt-2">
                  <div className="flex-1 min-w-0">
                    <input className={inputBase} placeholder="City *"
                      value={fCity} onChange={e => setFCity(e.target.value)} maxLength={50} />
                    {errors.city && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.city}</p>}
                  </div>
                  <div className="flex-1 min-w-0 relative" ref={countryRef}>
                    <input className={`${inputBase} appearance-none pr-10`} placeholder="Country *"
                      value={countryQuery || fCountry}
                      onChange={e => { setCountryQuery(e.target.value); setFCountry(''); setShowCountryList(true) }}
                      onFocus={() => setShowCountryList(true)} maxLength={50} />
                    {errors.country && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.country}</p>}
                    {showCountryList && (
                      <div className="absolute z-30 mt-1 w-full max-h-36 overflow-y-auto rounded-xl"
                        style={{ maxHeight: '160px', background: 'rgba(18,6,48,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,195,107,0.22)', boxShadow: '0 12px 32px rgba(0,0,0,0.75)' }}>
                        {COUNTRIES
                          .filter(c => c.toLowerCase().includes((countryQuery || '').toLowerCase()))
                          .slice(0, 20)
                          .map(c => (
                            <div key={c}
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

                {/* Row 3 — Tribute + Submit */}
                <div className="flex gap-3 items-end mt-2">
                  <div className="flex-1 min-w-0 relative">
                    <textarea
                     className={`${inputBase} min-h-[110px] resize-none leading-7`}
                      style={{ maxHeight: '84px' }}
                      placeholder={`Share a memory, reflection, or tribute for ${honourName}…`}
                      value={fMsg} onChange={e => setFMsg(e.target.value)}
                      maxLength={MAX_CHARS} rows={2}
                    />
                    <span className="absolute bottom-2 right-2 text-[9px] pointer-events-none select-none"
                      style={{ color: fMsg.length > 900 ? 'rgba(226,195,107,0.75)' : 'rgba(255,255,255,0.22)' }}>
                      {fMsg.length}/{MAX_CHARS}
                    </span>
                    {errors.msg && <p className="text-[9px] text-red-400/85 mt-0.5 pl-1">{errors.msg}</p>}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-shrink-0 self-start mt-1 px-5 py-3.5 rounded-2xl font-semibold text-[14px] tracking-[0.04em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                    style={{
                      background:
                        'linear-gradient(180deg, #f3d36b 0%, #d4a93a 100%)',
                      color: '#1a0826',
                      border:
                        '1px solid rgba(255,255,255,0.18)',
                      boxShadow:
                        '0 8px 22px rgba(212,169,58,0.30), inset 0 1px 0 rgba(255,255,255,0.26)',
                    }}
                  >
                    {submitting ? '…' : 'Submit'}
                  </button>
                </div>

                {/* Row 4 — Action strip: larger icons, all with tooltips */}
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setPremiumModal('video')}
                    title="Add a video tribute (premium feature)"
                    className="flex items-center gap-1.5 text-sm px-3 py-3.5 rounded-lg transition-all duration-150 hover:bg-white/8"
                    style={{ border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ fontSize: '16px' }}>🎬</span>
                    <span className="text-xs">Video</span>
                  </button>

                  <button
                    onClick={() => setPremiumModal('audio')}
                    title="Add an audio tribute (premium feature)"
                    className="flex items-center gap-1.5 text-sm px-3 py-3.5 rounded-lg transition-all duration-150 hover:bg-white/8"
                    style={{ border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ fontSize: '16px' }}>🎙️</span>
                    <span className="text-xs">Audio</span>
                  </button>

                  <div className="flex-1" />

                  <button
                    onClick={handleCopy}
                    title="Copy the link to this tribute wall"
                    className="flex items-center gap-1.5 text-sm px-3 py-3.5 rounded-lg transition-all duration-150 hover:bg-yellow-400/8"
                    style={{
                      border: '1px solid rgba(226,195,107,0.32)',
                      color: copied ? 'rgba(226,195,107,0.95)' : 'rgba(226,195,107,0.68)',
                      background: copied ? 'rgba(226,195,107,0.10)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{copied ? '✓' : '🔗'}</span>
                    <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <Link
                    href={`https://wa.me/?text=${encodeURIComponent('Leave a tribute for ' + honourName + ': ' + capsuleUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    title="Share this tribute wall on WhatsApp"
                    className="flex items-center gap-1.5 text-sm px-3 py-3.5 rounded-lg transition-all duration-150 hover:bg-green-400/8"
                    style={{ border: '1px solid rgba(74,222,128,0.28)', color: 'rgba(74,222,128,0.72)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ fontSize: '16px' }}>💬</span>
                    <span className="text-xs">Share</span>
                  </Link>
                </div>

                {submitSuccess && (
                  <div className="rounded-xl px-3 py-3 text-xs text-center tracking-wide"
                    style={{ border: '1px solid rgba(226,195,107,0.35)', background: 'rgba(226,195,107,0.08)', color: 'rgba(226,195,107,0.92)' }}>
                    ✦ Your tribute has been received — thank you.
                  </div>
                )}
                {submitErr && <p className="text-[11px] text-red-400/85 text-center">{submitErr}</p>}

              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 17 — MAP BAND
              Royal: deep bg + gold pulse glow + scanlines
              Permanent notice + click to expand
          ═══════════════════════════════════════════════ */}
          <div
            className="flex-shrink-0 mt-2 relative cursor-pointer"
            style={{ height: '130px' }}
            onClick={() => setMapOpen(true)}
            title="Click to open the world tribute map"
          >
            {/* Gold top/bottom rules */}
            <div className="absolute top-0 left-0 right-0 h-px z-10"
              style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-px z-10"
              style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)' }} />

            {/* Map — pointer-events-none so click passes to outer div */}
            <div className="w-full h-full overflow-hidden pointer-events-none">
              <TributeMap pins={pins} locked={true} />
            </div>

            {/* Scanlines overlay — royal satellite feel */}
            <div className="map-scanlines absolute inset-0 pointer-events-none z-10" style={{ opacity: 0.6 }} />

            {/* Gold pulse glow — radial, breathes */}
            <div className="map-pulse absolute inset-0 pointer-events-none z-10" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(226,195,107,0.18) 0%, transparent 70%)',
            }} />

            {/* Permanent notice — always visible, not just on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <div
                className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{
                  background: 'rgba(8,2,22,0.72)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(226,195,107,0.35)',
                }}
              >
                <span style={{ fontSize: '14px' }}>🌍</span>
                <span style={{ fontSize: '11px', color: 'rgba(226,195,107,0.85)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  World Tribute Map
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
                  · tap to explore
                </span>
              </div>
              {uniqueCountries.length > 0 && (
                <p style={{ fontSize: '9px', color: 'rgba(226,195,107,0.45)', marginTop: '6px', letterSpacing: '0.06em' }}>
                  {uniqueCountries.length} {uniqueCountries.length === 1 ? 'country' : 'countries'} represented
                </p>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 18 — TRIBUTE WALL HEADER
          ═══════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2">
            <h2 className="text-center font-bold tracking-[0.2em] uppercase text-sm text-yellow-300"
              style={{ textShadow: '0 0 14px rgba(226,195,107,0.4)' }}>
              Tribute Wall
            </h2>
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
          ═══════════════════════════════════════════════ */}
<div
  className="mx-3 mb-5 rounded-2xl overflow-hidden flex-1 min-h-0"
  style={{
    minHeight: '120px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(12,6,24,0.34)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }}
>


            <div
  className="overflow-y-auto px-4 py-4 space-y-4 flex-1 min-h-0 lc-scrollbar"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(226,195,107,0.18) transparent' }}>
              {visible.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-white/40 text-sm tracking-[0.18em] uppercase">Be the first to preserve a tribute.</p>
                </div>
              )}
              {visible.map(c => (
                <TributeCard key={c.id} c={c}
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
              Circular photo centred · name + tag where ABOUT was
          ═══════════════════════════════════════════════ */}
          <div id="profile" className="px-4 pb-12">

            {/* Profile identity block — replaces ABOUT heading */}
            <div className="flex flex-col items-center mb-8 pt-2">

              {/* Circular photo — centred, gold ring */}
              <div className="relative mb-4">
                <div
                  className="overflow-hidden"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '2px solid rgba(226,195,107,0.5)',
                    boxShadow: '0 0 0 4px rgba(226,195,107,0.12), 0 0 24px rgba(226,195,107,0.2), 0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  <img
                    src={resolvedHero}
                    alt={honourName}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.92) saturate(1.1)' }}
                  />
                </div>
                {/* Organiser: update photo */}
                {isAdmin && (
                  <button
                    onClick={() => heroPhotoRef.current?.click()}
                    className="absolute -bottom-1 -right-1 text-[9px] w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(10,2,26,0.9)',
                      border: '1px solid rgba(226,195,107,0.45)',
                      color: 'rgba(226,195,107,0.8)',
                    }}
                    title="Update profile photo"
                  >📷</button>
                )}
              </div>

              {/* Name — large, where ABOUT was */}
<h2
  className="font-extrabold text-[#f3d36b] text-center"
  style={{
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 'clamp(24px, 6vw, 34px)',
    textShadow:
      '0 0 18px rgba(226,195,107,0.18), 0 0 42px rgba(226,195,107,0.12)',
    lineHeight: 1.15,
    letterSpacing: '0.01em',
  }}
>{honourName}</h2>

              {/* Event tag as subtitle */}
              {capsule.event_tag && (
                <p className="text-[11px] text-yellow-400/60 tracking-[0.2em] uppercase mt-1.5">
                  {capsule.event_tag}
                </p>
              )}

              {/* Honouree title */}
              {capsule.honouree_title && (
                <p className="text-sm text-white/45 mt-1 tracking-wide">{capsule.honouree_title}</p>
              )}

              {/* Event date */}
              {capsule.event_date && (
                <p className="text-[11px] text-white/30 mt-1.5">
                  {new Date(capsule.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}

              {/* Thin gold rule beneath identity block */}
              <div className="w-24 h-px mt-5"
                style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)' }} />
            </div>

            {/* Dynamic profile sections */}
            {profileSections.length > 0 ? (
              profileSections.map(section => (
                <ProfileSectionBlock key={section.id} section={section} />
              ))
            ) : (
              <div className="rounded-2xl p-6 text-center mb-6"
                style={{ border: '1px solid rgba(226,195,107,0.1)', background: 'rgba(226,195,107,0.03)' }}>
                <p className="text-xs text-white/28 tracking-wide leading-relaxed">
                  The organiser can add a story, gallery, milestones and more
                  to this profile from the capsule dashboard.
                </p>
              </div>
            )}

            {/* Featured photos */}
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
              <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.15), transparent)' }} />
              <Link href="/" style={{ textDecoration: 'none' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em',
                  background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>LEGACY</span>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.22)', marginLeft: '0.18em' }}>CAPSULE</span>
              </Link>
              <p className="text-[9px] text-white/15 mt-1.5 tracking-widest uppercase">Events end. Legacies don't.</p>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}
