'use client'

/* =========================================================
   TRIBUTE WALL CLIENT — v4
   Built on the original single-page architecture.
   Frozen header · scrollable cards · inline form · map band.
   
   SECTIONS:
   1. Imports
   2. Constants & Config
   3. Types
   4. Utilities (compress, geocode)
   5. TributeCard component
   6. Main component
   7. — State
   8. — Effects
   9. — Handlers
   10. — Render: Top bar
   11. — Render: Hero panel (frozen)
   12. — Render: Map band
   13. — Render: Wall header
   14. — Render: Scrollable cards
   15. — Render: Bottom rule
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
import { COUNTRIES, formatTributeDate } from '@/lib/tributeWallHelpers'

/* =========================================================
   SECTION 2 — CONSTANTS & CONFIG
========================================================= */
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

// Gold-glow input — matches original frosted look
const inputBase = [
  'w-full text-sm px-3 py-1.5 rounded-lg',
  'text-white placeholder:text-yellow-200/50',
  'bg-white/10 backdrop-blur-sm',
  'border border-yellow-400/40',
  'shadow-[0_0_6px_rgba(234,179,8,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]',
  'hover:border-yellow-300/70 hover:bg-white/15',
  'focus:outline-none focus:border-yellow-300',
  'focus:bg-white/20',
  'focus:shadow-[0_0_0_2px_rgba(234,179,8,0.2),0_0_14px_rgba(234,179,8,0.6)]',
  'transition-all duration-200',
].join(' ')

// Dynamic import — Leaflet cannot run server-side
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0010]" />
  ),
})

/* =========================================================
   SECTION 3 — TYPES
========================================================= */
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

/* =========================================================
   SECTION 4 — UTILITIES
========================================================= */
async function compressPhoto(file: File): Promise<File> {
  try {
    const ic = (await import('browser-image-compression')).default
    return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
  } catch { return file }
}

async function geocodeLocation(city: string, country: string) {
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
  const isLong = c.tribute_text.length > 280
  const text = isLong && !expanded ? c.tribute_text.slice(0, 280) + '…' : c.tribute_text
  const isPending = c.status === 'pending_review' || c.status === 'pending'
  const canEdit = isOwn && isPending
  const canDelete = isOwn || isAdmin

  return (
<div style={{
      width: '100%', borderRadius: '12px',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      transition: 'all 0.2s',
      backgroundColor: isPending
        ? 'rgba(234,179,8,0.06)'
        : 'rgba(255,255,255,0.07)',
      border: '1px solid ' + (isPending
        ? 'rgba(234,179,8,0.35)'
        : isOwn
        ? 'rgba(234,179,8,0.25)'
        : 'rgba(255,255,255,0.1)'),
      boxShadow: isPending ? '0 0 10px rgba(234,179,8,0.08)' : 'none',
    }}>
      <div className="py-2 px-3">

        {/* ── Card header ──────────────────────────── */}
        <div className="flex justify-between items-center gap-1 w-full mb-0.5">
          <span className="text-xs font-semibold text-yellow-100 truncate max-w-[120px]">
            {c.contributor_name}
            {isOwn && (
              <span className="ml-1.5 text-[9px] font-normal text-yellow-400/60 uppercase tracking-widest">
                you
              </span>
            )}
          </span>
          <span className="text-[10px] text-white/40 tracking-wide truncate flex-1 text-center px-1">
            {[c.city, c.country].filter(Boolean).join(' · ')}
          </span>
          <span className="text-[10px] text-white/25 whitespace-nowrap">
            {new Date(c.created_at).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </span>
        </div>

        {/* ── Message body ─────────────────────────── */}
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
                className="text-[11px] px-3 py-1 rounded-md border border-white/20 text-white/50 hover:border-white/40 transition-colors"
              >Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/80 leading-relaxed">{text}</p>
            {isLong && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-[11px] text-yellow-400/70 mt-0.5 hover:text-yellow-300 transition-colors"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}

        {/* ── Status + actions ─────────────────────── */}
        <div className="flex items-center gap-2 mt-1">
          {isPending && (
            <span className="text-[9px] text-yellow-500/70 tracking-widest uppercase">
              · Pending
            </span>
          )}
          <div className="flex gap-1.5 ml-auto">
            {isAdmin && isPending && !editing && (
              <button
                onClick={() => onApprove(c.id)}
                className="text-[11px] px-2.5 py-0.5 rounded-md bg-green-500/15 border border-green-400/25 text-green-300 hover:bg-green-500/25 transition-colors"
              >Approve</button>
            )}
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] px-2.5 py-0.5 rounded-md border border-white/15 text-white/45 hover:border-yellow-400/35 hover:text-yellow-300/70 transition-colors"
              >Edit</button>
            )}
            {canDelete && !editing && (
              <button
                onClick={() => { if (window.confirm('Delete this tribute?')) onDelete(c.id) }}
                className="text-[11px] px-2.5 py-0.5 rounded-md border border-red-400/20 text-red-400/60 hover:border-red-400/40 hover:text-red-400/80 transition-colors"
              >Delete</button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

/* =========================================================
   SECTION 6 — MAIN COMPONENT
========================================================= */
export default function TributeWallClient({ capsule, initialContributions }: Props) {

  /* =========================================================
     SECTION 7 — STATE
  ========================================================= */
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [all, setAll] = useState<Contribution[]>(initialContributions)
  const [visitorEmail, setVisitorEmail] = useState('')

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
     SECTION 8 — DERIVED VALUES
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

  const pins = all
    .filter(c => c.status === 'approved' && c.lat && c.lng)
    .map(c => ({
      lat: c.lat as number,
      lng: c.lng as number,
      name: c.contributor_name,
      country: c.country,
    }))

  const capsuleUrl = typeof window !== 'undefined'
    ? window.location.origin + '/for/' + capsule.slug
    : 'https://itslegacycapsule.com/for/' + capsule.slug

  /* =========================================================
     SECTION 9 — EFFECTS
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
      .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, lat, lng, status, email, created_at')
      .eq('capsule_id', capsule.id)
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

  /* =========================================================
     SECTION 9B — HANDLERS
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

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fName.trim()) e.name = 'Name is required'
    if (!fEmail.trim() || !fEmail.includes('@')) e.email = 'Valid email required'
    if (!fCity.trim()) e.city = 'City is required'
    if (!fCountry) e.country = 'Country is required'
    if (fMsg.trim().length < MIN_CHARS) e.msg = MIN_CHARS + '+ characters required'
    if (fMsg.trim().length > MAX_CHARS) e.msg = 'Over ' + MAX_CHARS + ' limit'
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

      const coords = await geocodeLocation(fCity.trim(), fCountry)

      // CRITICAL: contributor_name — not name. Gotcha #3.
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
      setFName(''); setFCity(''); setFCountry('')
      setFMsg(''); setFRel(''); setFPhoto(null)
      setFPhotoPreview(null); setCountryQuery(''); setErrors({})
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3500)
      poll()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch { setSubmitErr('Something went wrong. Try again.') }
    setSubmitting(false)
  }

  /* =========================================================
     SECTION 10 — RENDER
  ========================================================= */
  return (
    <main className="h-screen flex flex-col w-full max-w-lg mx-auto overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0a0010, #100018)' }}>

{/* ═══════════════════════════════════════════════════
          SECTION 10 — TOP BAR
          Logo left · To Profile pill right
      ═══════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 pt-2 pb-1">
<Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em',
            background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            LEGACY<span style={{ WebkitTextFillColor: 'rgba(255,255,255,0.5)', background: 'none' }}>CAPSULE</span>
          </span>
        </Link>
        <span
          className="text-[10px] px-3 py-1 rounded-full border border-yellow-400/40 text-yellow-400/60 cursor-default tracking-wide"
          title="Capsule profile — coming soon"
        >
          To Profile
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 11 — HERO PANEL (frozen, flex-shrink-0)
          Honouree photo backdrop · ornament · title · form
      ═══════════════════════════════════════════════════ */}
      <div
        className="relative flex-shrink-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: capsule.hero_image_url
            ? 'url(' + capsule.hero_image_url + ')'
            : undefined,
          backgroundColor: capsule.hero_image_url ? undefined : '#0D0820',
        }}
      ></div>
        {/* Layered overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/80 pointer-events-none" />
        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] pointer-events-none" />
        {/* Gold top rule */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent" />

        <div className="relative z-10 px-3 pt-1.5 pb-2">
          <div className="flex flex-col gap-1.5">

          {/* Ornament + Title */}
          <div className="text-center space-y-0.5">
            <div className="text-2xl leading-none">{ornament}</div>
            <h1 className="font-extrabold tracking-tight text-yellow-300"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(18px, 5vw, 28px)',
                textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 0 24px rgba(234,179,8,0.4)',
              }}>
              {pageTitle}
            </h1>
            {capsule.event_tag && (
              <p className="text-[10px] text-yellow-400/80 tracking-[0.2em] uppercase">
                {capsule.event_tag}
              </p>
            )}
          </div>

          {/* Gold divider */}
          <div className="flex items-center gap-1.5 px-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-400/50" />
            <span className="text-yellow-400/70 text-xs">✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-400/50" />
          </div>

          {/* Form fields */}
          <div className="space-y-1.5">

            {/* Row 1 — Name + Email + Photo */}
            <div className="flex gap-1.5 items-start">
              <div className="flex-1">
                <input
                  className={inputBase}
                  placeholder="Your name *"
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  maxLength={50}
                />
                {errors.name && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.name}</p>}
              </div>
              <div className="flex-1">
                <input
                  type="email"
                  className={inputBase}
                  placeholder="Email *"
                  value={fEmail}
                  onChange={e => setFEmail(e.target.value)}
                  maxLength={100}
                />
                {errors.email && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.email}</p>}
              </div>
              {/* Photo button */}
              <div
                onClick={() => photoRef.current?.click()}
                title={fPhotoPreview ? 'Change photo' : 'Add photo'}
                className="flex-shrink-0 w-[34px] h-[34px] rounded-full border border-dashed border-yellow-400/30 bg-white/5 cursor-pointer overflow-hidden flex items-center justify-center hover:border-yellow-400/60 transition-colors"
              >
                {fPhotoPreview
                  ? <img src={fPhotoPreview} alt="" className="w-full h-full object-cover" />
                  : <span className="text-yellow-400/40 text-base leading-none">+</span>
                }
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>

            {/* Row 2 — City + Country + Relationship */}
            <div className="flex gap-1.5">
              <div className="flex-1">
                <input
                  className={inputBase}
                  placeholder="City *"
                  value={fCity}
                  onChange={e => setFCity(e.target.value)}
                  maxLength={50}
                />
                {errors.city && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.city}</p>}
              </div>
              <div className="flex-1 relative" ref={countryRef}>
                <input
                  className={inputBase}
                  placeholder="Country *"
                  value={countryQuery || fCountry}
                  onChange={e => { setCountryQuery(e.target.value); setFCountry(''); setShowCountryList(true) }}
                  onFocus={() => setShowCountryList(true)}
                  maxLength={50}
                />
                {errors.country && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.country}</p>}
                {showCountryList && (
                  <div className="absolute z-30 mt-1 w-full max-h-36 overflow-y-auto bg-[#1a0d2e]/95 backdrop-blur-md border border-yellow-400/25 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-sm">
                    {COUNTRIES
                      .filter(c => c.toLowerCase().includes((countryQuery || '').toLowerCase()))
                      .slice(0, 20)
                      .map(c => (
                        <div
                          key={c}
                          className="px-3 py-1.5 text-yellow-100/85 hover:bg-yellow-400/12 cursor-pointer border-b border-yellow-400/8 last:border-0 transition-colors"
                          onClick={() => { setFCountry(c); setCountryQuery(''); setShowCountryList(false) }}
                        >{c}</div>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  className={inputBase}
                  placeholder="Relationship"
                  value={fRel}
                  onChange={e => setFRel(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>

{/* Row 3 — Message + counter + Submit */}
            <div className="flex gap-1.5 items-start">
              {/* Tribute textarea — fixed width, not flex-1 */}
              <div style={{ flex: '0 0 60%' }}>
                <textarea
                  className={inputBase + ' min-h-[36px] max-h-[72px] resize-none leading-snug py-1.5 w-full'}
                  placeholder={'Tribute for ' + honourName + '…'}
                  value={fMsg}
                  onChange={e => setFMsg(e.target.value)}
                  maxLength={MAX_CHARS}
                  rows={2}
                />
                {errors.msg && (
                  <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.msg}</p>
                )}
              </div>
              {/* Counter — vertical centre */}
<div style={{ flexShrink: 0, paddingTop: '6px', textAlign: 'center' }}>
                <span style={{
                  fontSize: '10px',
                  color: fMsg.length > 900 ? '#E2C36B' : 'rgba(255,255,255,0.25)',
                  whiteSpace: 'nowrap',
                }}>
                  {fMsg.length}<span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '9px' }}>/{MAX_CHARS}</span>
                </span>
              </div>
              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-shrink-0 px-3 py-2 rounded-lg font-bold text-sm bg-gradient-to-b from-yellow-400 to-yellow-500 text-purple-950 border border-yellow-300/50 shadow-[0_0_10px_rgba(234,179,8,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] hover:from-yellow-300 hover:to-yellow-400 hover:shadow-[0_0_18px_rgba(234,179,8,0.7)] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 self-start"
              >
                {submitting ? '…' : 'Submit'}
              </button>
            </div>

            {/* Success toast */}
            {submitSuccess && (
              <div className="rounded-lg border border-yellow-400/35 bg-yellow-400/8 px-3 py-1.5 text-yellow-200 text-xs text-center tracking-wide">
                ✦ Your tribute has been received — thank you.
              </div>
            )}
            {submitErr && (
              <p className="text-[11px] text-red-400 text-center">{submitErr}</p>
            )}
          </div>

          {/* ── Tribute Wall heading ────────────────── */}
          <div className="pt-0.5">
            <h2 className="text-center font-bold tracking-widest uppercase text-base text-yellow-300"
              style={{ textShadow: '0 0 12px rgba(234,179,8,0.5)' }}>
              Tribute Wall
              <span className="text-yellow-400/60 font-normal normal-case tracking-normal ml-2 text-sm">
                · {approvedCount}
              </span>
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent mt-1" />
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 12 — MAP BAND (frozen, flex-shrink-0)
          Gold border · rounded · full world view · pin count
      ═══════════════════════════════════════════════════ */}
<div className="flex-shrink-0 mx-0 my-1.5 relative" style={{ height: '160px' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '-12px', right: '-12px',
          borderTop: '1px solid rgba(226,195,107,0.2)',
          borderBottom: '1px solid rgba(226,195,107,0.2)',
          overflow: 'hidden',
        }}>        <div className="w-full h-full rounded-xl overflow-hidden border border-yellow-400/25 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
         </div>
          <TributeMap pins={pins} />
        </div>
        {/* Pin/country overlay */}
        <div className="absolute bottom-1.5 right-2 text-[8px] text-yellow-400/50 bg-black/50 px-1.5 py-0.5 rounded-full backdrop-blur-sm tracking-wide">
          {pins.length > 0
            ? pins.length + ' pin' + (pins.length !== 1 ? 's' : '')
            : 'Pins appear as tributes are approved'}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 13 — SHARE ROW (frozen, flex-shrink-0)
      ═══════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex gap-2 px-3 pb-1.5">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(capsuleUrl)
          }}
          className="flex-1 text-[11px] py-1 rounded-lg border border-yellow-400/25 text-yellow-400/55 bg-white/3 hover:border-yellow-400/45 hover:text-yellow-400/80 transition-colors"
        >
          Copy link
        </button>
        <Link
          href={'https://wa.me/?text=' + encodeURIComponent('Leave a tribute for ' + honourName + ': ' + capsuleUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-[11px] py-1 rounded-lg border border-green-400/25 text-green-400/55 bg-white/3 hover:border-green-400/45 hover:text-green-400/75 transition-colors text-center"
        >
          WhatsApp
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 14 — SCROLLABLE TRIBUTE CARDS
      ═══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">

        {visible.length === 0 && (
          <p className="text-center text-white/25 text-sm pt-8 tracking-wide">
            Be the first to leave a tribute.
          </p>
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

      {/* ═══════════════════════════════════════════════════
          SECTION 15 — BOTTOM RULE
      ═══════════════════════════════════════════════════ */}
      <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/25 to-transparent flex-shrink-0" />

    </main>
  )
}