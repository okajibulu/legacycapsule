'use client'

// ─────────────────────────────────────────────────────────────
// TRIBUTE WALL — Single-Page Experience v3
// Layout: Header → Map band → Tribute cards → Fixed CTA
// Clean separation — no text floating over map.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES, formatTributeDate, getInitials } from '@/lib/tributeWallHelpers'

// ── SECTION: DYNAMIC IMPORT ───────────────────────────────────
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#120E24' }} />
  ),
})

// ── SECTION: SUPABASE ─────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── SECTION: CONSTANTS ────────────────────────────────────────
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

// ── SECTION: PALETTE ──────────────────────────────────────────
const P = {
  bg1: '#1A1035',
  bg2: '#241848',
  bg3: '#2E2160',
  gold: '#E2C36B',
  goldDim: 'rgba(226,195,107,0.3)',
  goldGlow: 'rgba(226,195,107,0.1)',
  white90: 'rgba(255,255,255,0.9)',
  white70: 'rgba(255,255,255,0.7)',
  white50: 'rgba(255,255,255,0.5)',
  white30: 'rgba(255,255,255,0.3)',
  white15: 'rgba(255,255,255,0.15)',
  white08: 'rgba(255,255,255,0.08)',
  green: '#34D399',
  red: '#f87171',
  cardBg: 'rgba(255,255,255,0.07)',
  cardBorder: 'rgba(255,255,255,0.1)',
}

// ── SECTION: TYPES ────────────────────────────────────────────
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

// ── SECTION: UTILITIES ────────────────────────────────────────
async function compressPhoto(file: File): Promise<File> {
  try {
    const ic = (await import('browser-image-compression')).default
    return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
  } catch { return file }
}

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

// ── SECTION: TRIBUTE CARD COMPONENT ──────────────────────────
function TributeCard({
  c, isAdmin, isOwn, onApprove, onDelete, onEdit, isNew,
}: {
  c: Contribution; isAdmin: boolean; isOwn: boolean
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  isNew?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.tribute_text)
  const isLong = c.tribute_text.length > 300
  const text = isLong && !expanded ? c.tribute_text.slice(0, 300) + '…' : c.tribute_text
  const isPending = c.status === 'pending_review' || c.status === 'pending'
  const canEdit = isOwn && isPending
  const canDelete = isOwn || isAdmin

  return (
    <div style={{
      backgroundColor: isPending ? 'rgba(226,195,107,0.05)' : P.cardBg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid ' + (isPending ? P.goldDim : P.cardBorder),
      borderLeft: '3px solid ' + (isPending ? P.goldDim : P.gold),
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '6px',
      animation: isNew ? 'fadeSlideIn 0.5s ease-out' : undefined,
    }}>

      {/* ── SECTION: CARD HEADER ────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'baseline',
        gap: '6px', marginBottom: '5px', flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '14px', fontWeight: 600, color: P.white90,
        }}>
          {c.contributor_name}
        </span>
        {isOwn && (
          <span style={{
            fontSize: '8px', color: P.gold,
            textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
          }}>you</span>
        )}
        <span style={{
          fontSize: '11px', color: P.white50,
          marginLeft: 'auto', whiteSpace: 'nowrap',
        }}>
          {c.city}{c.country ? ' · ' + c.country : ''}
        </span>
        <span style={{ fontSize: '10px', color: P.white30, whiteSpace: 'nowrap' }}>
          {formatTributeDate(c.created_at)}
        </span>
      </div>

      {/* ── SECTION: CARD BODY ──────────────────────── */}
      {editing ? (
        <div>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: '6px',
              border: '1px solid ' + P.goldDim,
              backgroundColor: P.white08,
              color: P.white90, fontSize: '13px', resize: 'vertical',
              fontFamily: "'DM Sans', sans-serif", outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button
              onClick={() => { onEdit(c.id, editText); setEditing(false) }}
              style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                backgroundColor: P.gold, border: 'none', color: P.bg1,
                cursor: 'pointer', fontWeight: 700,
              }}
            >Save</button>
            <button
              onClick={() => { setEditing(false); setEditText(c.tribute_text) }}
              style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                backgroundColor: 'transparent', border: '1px solid ' + P.white30,
                color: P.white50, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      ) : (
        <p style={{
          fontSize: '13.5px', lineHeight: '1.65',
          color: isPending ? P.white50 : P.white90,
          margin: 0, whiteSpace: 'pre-wrap',
        }}>
          {text}
        </p>
      )}

      {isLong && !editing && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: '3px', fontSize: '11px', color: P.gold,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontWeight: 600,
          }}
        >
          {expanded ? 'Less' : 'Read more'}
        </button>
      )}

      {/* ── SECTION: CARD ACTIONS ───────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '6px', marginTop: '6px',
      }}>
        {isPending && (
          <span style={{
            fontSize: '9px', color: P.gold,
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
          }}>
            Pending
          </span>
        )}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '8px',
                backgroundColor: 'transparent', border: '1px solid ' + P.goldDim,
                color: P.gold, cursor: 'pointer',
              }}
            >Edit</button>
          )}
          {canDelete && !editing && (
            <button
              onClick={() => { if (window.confirm('Delete this tribute?')) onDelete(c.id) }}
              style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(248,113,113,0.3)',
                color: P.red, cursor: 'pointer',
              }}
            >Delete</button>
          )}
          {isAdmin && isPending && !editing && (
            <button
              onClick={() => onApprove(c.id)}
              style={{
                fontSize: '10px', padding: '2px 10px', borderRadius: '8px',
                backgroundColor: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: P.green, cursor: 'pointer', fontWeight: 600,
              }}
            >Approve</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SECTION: MAIN COMPONENT ───────────────────────────────────
export default function TributeWallClient({ capsule, initialContributions }: Props) {

  // ── SECTION: STATE ────────────────────────────────────────
  const [all, setAll] = useState<Contribution[]>(initialContributions)
  const [formOpen, setFormOpen] = useState(false)
  const [visitorEmail, setVisitorEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)

  // ── SECTION: FORM STATE ───────────────────────────────────
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

  // ── SECTION: DERIVED VALUES ───────────────────────────────
  const name = capsule.honouree_name
  const title = getTributePageTitle(capsule.event_type, name)
  const ornament = ORNAMENTS[capsule.event_type] ?? '✦'
  const isAdmin = visitorEmail !== '' &&
    visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase()

  const capsuleUrl = typeof window !== 'undefined'
    ? window.location.origin + '/for/' + capsule.slug
    : 'https://itslegacycapsule.com/for/' + capsule.slug

  const visible = all.filter(c => {
    if (c.status === 'approved') return true
    if (isAdmin) return true
    if (visitorEmail && c.email?.toLowerCase() === visitorEmail.toLowerCase()) return true
    return false
  })

  const approved = all.filter(c => c.status === 'approved').length
  const countries = new Set(
    all.filter(c => c.status === 'approved').map(c => c.country)
  ).size

  const pins = all
    .filter(c => c.status === 'approved' && c.lat && c.lng)
    .map(c => ({
      lat: c.lat as number,
      lng: c.lng as number,
      name: c.contributor_name,
      country: c.country,
    }))

  const whatsapp = 'https://wa.me/?text=' +
    encodeURIComponent('Leave a tribute for ' + name + ': ' + capsuleUrl)

  const filtered = COUNTRIES
    .filter(c => c.toLowerCase().includes(countryQ.toLowerCase()))
    .slice(0, 12)

  // ── SECTION: EFFECTS ──────────────────────────────────────
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

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node))
        setShowCountries(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── SECTION: HANDLERS ─────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(capsuleUrl)
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

  const handleDelete = async (id: string) => {
    await supabase.from('contributions').delete().eq('id', id)
    poll()
  }

  const handleEdit = async (id: string, text: string) => {
    await supabase.from('contributions')
      .update({ tribute_text: text }).eq('id', id)
    poll()
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressPhoto(f)
    setFPhoto(compressed)
    const r = new FileReader()
    r.onload = ev => setFPhotoPreview(ev.target?.result as string)
    r.readAsDataURL(compressed)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fName.trim()) e.name = 'Required'
    if (!fCity.trim()) e.city = 'Required'
    if (!fCountry) e.country = 'Required'
    if (!fEmail.trim() || !fEmail.includes('@')) e.email = 'Valid email required'
    if (fMsg.trim().length < MIN_CHARS) e.msg = MIN_CHARS + '+ chars minimum'
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
        const { error: ue } = await supabase.storage
          .from(BUCKET).upload(path, fPhoto, { upsert: false })
        if (!ue) {
          photoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
        }
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
            subjectName: name, eventType: capsule.event_type,
            tributeText: fMsg.trim(),
          }),
        }).catch(() => {})
      }

      if (fEmail.includes('@')) {
        localStorage.setItem(LS_EMAIL, fEmail)
        setVisitorEmail(fEmail)
      }

      setNewId(nc?.id ?? null)
      setTimeout(() => setNewId(null), 3000)
      setFormOpen(false)
      setFName(''); setFCity(''); setFCountry('')
      setFMsg(''); setFRel(''); setFPhoto(null)
      setFPhotoPreview(null); setErrors({})
      poll()
    } catch { setSubmitErr('Something went wrong. Try again.') }
    setSubmitting(false)
  }

  // ── SECTION: INPUT STYLE ──────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid ' + P.goldDim,
    backgroundColor: P.white08,
    color: P.white90, fontSize: '13px', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  }

  // ── SECTION: RENDER ───────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(168deg, ' + P.bg1 + ' 0%, ' + P.bg2 + ' 60%, ' + P.bg1 + ' 100%)',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Keyframe animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* ════════════════════════════════════════════════
          ZONE 1 — TOP BAR
          Logo left · To Profile right
      ════════════════════════════════════════════════ */}
      <header style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px 0',
      }}>
        <span style={{
          fontSize: '12px', fontWeight: 700, color: P.gold,
          letterSpacing: '0.08em',
        }}>
          LEGACY<span style={{ color: P.white50 }}>CAPSULE</span>
        </span>
        <span
          style={{ fontSize: '11px', color: P.white30, cursor: 'default' }}
          title="Capsule profile — coming soon"
        >
          To Profile
        </span>
      </header>

      {/* ════════════════════════════════════════════════
          ZONE 2 — HONOUREE HEADER
          Ornament · Name · Event tag · Count · Share
      ════════════════════════════════════════════════ */}
      <section style={{
        textAlign: 'center',
        padding: '28px 24px 20px',
      }}>

        {/* Honouree photo — if available */}
        {capsule.hero_image_url && (
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            margin: '0 auto 16px',
            backgroundImage: 'url(' + capsule.hero_image_url + ')',
            backgroundSize: 'cover', backgroundPosition: 'center top',
            border: '2px solid ' + P.goldDim,
            boxShadow: '0 0 20px rgba(226,195,107,0.2)',
          }} />
        )}

        {/* Ornament */}
        <div style={{ fontSize: '26px', marginBottom: '8px', lineHeight: 1 }}>
          {ornament}
        </div>

        {/* Name */}
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(24px, 5vw, 42px)',
          fontWeight: 700, color: '#FFFFFF',
          margin: '0 0 6px', lineHeight: 1.2,
          textShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}>
          {title}
        </h1>

        {/* Event tag */}
        {capsule.event_tag && (
          <p style={{
            color: P.gold, fontSize: '11px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            margin: '0 0 14px', fontWeight: 500,
          }}>
            {capsule.event_tag}
          </p>
        )}

        {/* Tribute count */}
        <p style={{
          fontSize: '13px', color: P.white50, margin: '0 0 16px',
        }}>
          {approved === 0
            ? 'Be the first to leave a tribute'
            : approved + ' tribute' + (approved !== 1 ? 's' : '') +
              (countries > 1 ? ' · ' + countries + ' countries' : '')}
        </p>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={handleCopy} style={{
            padding: '5px 16px', borderRadius: '16px',
            border: '1px solid ' + P.goldDim,
            backgroundColor: P.goldGlow,
            color: copied ? P.gold : P.white50,
            fontSize: '11px', cursor: 'pointer',
            transition: 'color 0.2s',
          }}>
            {copied ? '✓ Copied' : 'Share link'}
          </button>
          <Link href={whatsapp} target="_blank" rel="noopener noreferrer" style={{
            padding: '5px 16px', borderRadius: '16px',
            border: '1px solid rgba(52,211,153,0.25)',
            backgroundColor: 'rgba(52,211,153,0.06)',
            color: 'rgba(52,211,153,0.7)',
            fontSize: '11px', textDecoration: 'none',
          }}>
            WhatsApp
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          ZONE 3 — MAP BAND
          Fixed height · Gold border · Rounded corners
          Shows contributor pins worldwide.
      ════════════════════════════════════════════════ */}
      <div style={{
        margin: '0 16px 24px',
        height: '220px',
        borderRadius: '12px',
        border: '1px solid ' + P.goldDim,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(226,195,107,0.1)',
        position: 'relative',
      }}>
        <TributeMap pins={pins} />

        {/* Pin count overlay */}
        {pins.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '8px', right: '10px',
            fontSize: '9px', color: P.gold,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            backgroundColor: 'rgba(26,16,53,0.8)',
            padding: '2px 8px', borderRadius: '8px',
            backdropFilter: 'blur(4px)',
          }}>
            {pins.length} pin{pins.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Empty map message */}
        {pins.length === 0 && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px', color: P.white30,
            letterSpacing: '0.1em',
            backgroundColor: 'rgba(26,16,53,0.7)',
            padding: '2px 10px', borderRadius: '8px',
            whiteSpace: 'nowrap',
          }}>
            Pins appear as tributes are approved
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          ZONE 4 — TRIBUTE WALL
          Section header · Inline form · Cards
      ════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: '640px', margin: '0 auto',
        padding: '0 16px 110px',
      }}>

        {/* ── SECTION: WALL HEADER ────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid ' + P.white08,
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px', fontWeight: 700,
            color: P.white90, margin: 0,
          }}>
            Tribute Wall
          </h2>
          {approved > 0 && (
            <span style={{
              fontSize: '12px', color: P.gold,
              fontWeight: 600, letterSpacing: '0.04em',
            }}>
              {approved} {approved === 1 ? 'tribute' : 'tributes'}
            </span>
          )}
        </div>

        {/* ── SECTION: INLINE FORM ────────────────────── */}
        <div ref={formRef} style={{
          maxHeight: formOpen ? '700px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: formOpen ? '14px' : '0',
        }}>
          <div style={{
            backgroundColor: P.white08,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid ' + P.goldDim,
            borderRadius: '10px',
            padding: '14px',
          }}>
            <p style={{
              fontSize: '10px', color: P.gold, letterSpacing: '0.18em',
              textTransform: 'uppercase', marginBottom: '10px',
              textAlign: 'center', margin: '0 0 10px',
            }}>
              Leave a tribute for {name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>

              {/* Row 1 — Name + Relationship + Photo */}
              <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fName}
                    onChange={e => setFName(e.target.value)}
                    placeholder="Your name *" style={inp} />
                  {errors.name && (
                    <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fRel}
                    onChange={e => setFRel(e.target.value)}
                    placeholder="Relationship" style={inp} />
                </div>
                {/* Photo circle */}
                <div
                  onClick={() => photoRef.current?.click()}
                  title={fPhotoPreview ? 'Change photo' : 'Add photo'}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    flexShrink: 0, border: '1.5px dashed ' + P.goldDim,
                    backgroundColor: P.white08, cursor: 'pointer',
                    overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {fPhotoPreview
                    ? <img src={fPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: P.goldDim, fontSize: '16px' }}>+</span>
                  }
                </div>
                <input ref={photoRef} type="file" accept="image/*"
                  onChange={handlePhoto} style={{ display: 'none' }} />
              </div>

              {/* Row 2 — City + Country + Email */}
              <div style={{ display: 'flex', gap: '7px' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={fCity}
                    onChange={e => setFCity(e.target.value)}
                    placeholder="City *" style={inp} />
                  {errors.city && (
                    <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>
                      {errors.city}
                    </p>
                  )}
                </div>
                <div style={{ flex: 1, position: 'relative' }} ref={countryRef}>
                  <input type="text" value={fCountry || countryQ}
                    onChange={e => {
                      setCountryQ(e.target.value)
                      setFCountry('')
                      setShowCountries(true)
                    }}
                    onFocus={() => setShowCountries(true)}
                    placeholder="Country *" style={inp} />
                  {errors.country && (
                    <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>
                      {errors.country}
                    </p>
                  )}
                  {showCountries && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      zIndex: 30, maxHeight: '150px', overflowY: 'auto',
                      backgroundColor: P.bg2,
                      border: '1px solid ' + P.goldDim,
                      borderRadius: '6px', marginTop: '3px',
                    }}>
                      {filtered.map(c => (
                        <div key={c}
                          onClick={() => {
                            setFCountry(c)
                            setCountryQ('')
                            setShowCountries(false)
                          }}
                          style={{
                            padding: '6px 10px', fontSize: '12px',
                            color: P.white50, cursor: 'pointer',
                            borderBottom: '1px solid ' + P.white08,
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = P.goldGlow}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >{c}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="email" value={fEmail}
                    onChange={e => setFEmail(e.target.value)}
                    placeholder="Email *" style={inp} />
                  {errors.email && (
                    <p style={{ color: P.red, fontSize: '10px', margin: '2px 0 0' }}>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3 — Message + Submit */}
              <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <textarea rows={2} value={fMsg}
                    onChange={e => setFMsg(e.target.value)}
                    placeholder={'Your tribute for ' + name + ' *'}
                    style={{ ...inp, resize: 'vertical', lineHeight: '1.5', minHeight: '38px' }}
                  />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: '1px',
                  }}>
                    {errors.msg
                      ? <span style={{ color: P.red, fontSize: '10px' }}>{errors.msg}</span>
                      : <span />}
                    <span style={{
                      fontSize: '10px',
                      color: fMsg.length > MAX_CHARS ? P.red
                        : fMsg.length >= MIN_CHARS ? P.goldDim
                        : P.white30,
                    }}>{fMsg.length}/{MAX_CHARS}</span>
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={submitting} style={{
                  flexShrink: 0, padding: '9px 16px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, ' + P.gold + ', #C9A84E)',
                  border: 'none', color: P.bg1, fontWeight: 700,
                  fontSize: '12px', cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap', alignSelf: 'flex-start',
                }}>
                  {submitting ? '…' : 'Submit'}
                </button>
              </div>

              {submitErr && (
                <p style={{ color: P.red, fontSize: '11px', textAlign: 'center', margin: 0 }}>
                  {submitErr}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION: TRIBUTE CARDS ──────────────────── */}
        {visible.map(c => (
          <TributeCard
            key={c.id} c={c}
            isAdmin={isAdmin}
            isOwn={visitorEmail !== '' && c.email?.toLowerCase() === visitorEmail.toLowerCase()}
            onApprove={handleApprove}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isNew={c.id === newId}
          />
        ))}

        {/* Empty state */}
        {visible.length === 0 && !formOpen && (
          <p style={{
            textAlign: 'center', color: P.white30,
            fontSize: '13px', padding: '32px 0',
          }}>
            No tributes yet — be the first.
          </p>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ color: P.white15, fontSize: '9px', letterSpacing: '0.08em' }}>
            VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          ZONE 5 — FIXED BOTTOM CTA
      ════════════════════════════════════════════════ */}
      <div
        onClick={() => {
          setFormOpen(o => !o)
          if (!formOpen) {
            setTimeout(() => formRef.current?.scrollIntoView({
              behavior: 'smooth', block: 'start',
            }), 100)
          }
        }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'linear-gradient(135deg, ' + P.gold + ', #C9A84E)',
          textAlign: 'center', padding: '12px 24px', cursor: 'pointer',
          boxShadow: '0 -2px 16px rgba(226,195,107,0.2)',
        }}
      >
        <span style={{
          color: P.bg1, fontWeight: 700, fontSize: '13px',
          letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif",
        }}>
          {formOpen ? '✕ Close' : '✦ Add Your Tribute'}
        </span>
      </div>

    </div>
  )
}