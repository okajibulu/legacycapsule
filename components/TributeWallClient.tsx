'use client'

/* =========================================================
   TRIBUTE WALL CLIENT — v9 PREMIUM
   Theme-aware · Collapsible composer · Revised section order
   Hero → Collapsed composer → Tribute wall → Map card → Profile summary → Footer

   Key changes from v8:
   - Theme engine integration — all colours from themeConfig
   - Collapsible tribute composer — expands on tap
   - Map framed as memory card with title
   - Profile summary: no photo/name repeat, no placeholder notices
   - Left accent on tribute cards
   - Hero identity-first — composer no longer dominates
========================================================= */

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES } from '@/lib/tributeWallHelpers'
import { getThemeConfig } from '@/lib/themeConfig'
import type { ThemeKey, ThemeConfig } from '@/lib/themeConfig'

const AudioTribute = dynamic(() => import('@/components/AudioTribute'), { ssr: false })
const VideoTribute = dynamic(() => import('@/components/VideoTribute'), { ssr: false })
const HeroPositionPicker = dynamic(() => import('@/components/HeroPositionPicker'), { ssr: false })

/* ── LOCAL TYPES ── */
interface Capsule {
  id: string; slug: string; honouree_name: string; honouree_title: string | null
  event_type: string; event_tag: string | null; event_date: string | null
  page_state: string; tier: string | null; hero_image_url: string | null
  organiser_email: string; free_tier_expires_at: string | null; created_at: string
  approved_contrib_count: number; components: string[]
}
interface Contribution {
  id: string; contributor_name: string; city: string; country: string
  relationship: string | null; tribute_text: string; thumbnail_url: string | null
  audio_url: string | null; video_url: string | null
  lat: number | null; lng: number | null; status: string; email: string | null; created_at: string
}
interface ProfileSection {
  id: string; section_type: string; custom_title: string | null
  content: string | null; sort_order: number; is_active: boolean
}
interface FeaturedPhoto {
  id: string; image_url: string; caption: string | null
  sort_order: number | null; is_hero: boolean | null
}
interface Pin { lat: number; lng: number; name: string; country: string }
interface Props {
  capsule: Capsule; initialContributions: Contribution[]
  profileSections: ProfileSection[]; featuredPhotos: FeaturedPhoto[]
  themeKey: ThemeKey
}

/* ── CONSTANTS ── */
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

const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false, loading: () => <div className="w-full h-full" style={{ background: '#0a0218' }} />,
})

/* ── UTILITIES ── */
async function compressPhoto(file: File): Promise<File> {
  try { const ic = (await import('browser-image-compression')).default; return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true }) } catch { return file }
}
async function getIPCoords(): Promise<{ lat: number; lng: number; country: string | null } | null> {
  try { const r = await fetch('/api/ip-geocode'); if (!r.ok) return null; const d = await r.json(); return d.lat && d.lng ? { lat: d.lat, lng: d.lng, country: d.country ?? null } : null } catch { return null }
}

/* =========================================================
   TRIBUTE CARD — theme-aware, left accent
========================================================= */
function TributeCard({ c, isAdmin, isOwn, onApprove, onDelete, onEdit, t }: {
  c: Contribution; isAdmin: boolean; isOwn: boolean
  onApprove: (id: string) => void; onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void; t: ThemeConfig
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.tribute_text)
  const isLong = c.tribute_text.length > 260
  const text = isLong && !expanded ? c.tribute_text.slice(0, 260) + '…' : c.tribute_text
  const isPending = c.status === 'pending_review' || c.status === 'pending'
  const canEdit = (isOwn && isPending) || isAdmin
  const canDelete = (isOwn && isPending) || isAdmin
  const displayName = c.relationship ? `${c.contributor_name} (${c.relationship})` : c.contributor_name

  return (
    <div style={{
      borderRadius: '16px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      backgroundColor: isPending ? 'rgba(234,179,8,0.05)' : t.cardBg,
      border: `1px solid ${isPending ? t.cardAccentPending : isOwn ? t.accentFaint : t.cardBorder}`,
      boxShadow: t.cardShadow, transition: 'all 0.24s ease',
      borderLeft: `3px solid ${isPending ? t.cardAccentPending : t.cardAccentApproved}`,
    }}>
      <div style={{ padding: '14px 20px 14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {/* Contributor thumbnail if uploaded */}
          {c.thumbnail_url && (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${t.accentFaint}` }}>
              <img src={c.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: t.textHeading, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {displayName}
              {isOwn && <span style={{ marginLeft: '6px', fontSize: '9px', fontWeight: 400, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>you</span>}
            </span>
            <span style={{ fontSize: '10px', color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {[c.city, c.country].filter(Boolean).join(' · ')}
            </span>
            <span style={{ fontSize: '10px', color: t.textFaint, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} maxLength={MAX_CHARS}
              style={{ width: '100%', minHeight: '56px', resize: 'none', padding: '10px 14px', borderRadius: '10px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textBody, fontSize: '13px', outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { onEdit(c.id, editText); setEditing(false) }}
                style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '6px', background: t.accentPrimary, color: '#1a0826', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditing(false); setEditText(c.tribute_text) }}
                style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '6px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textFaint, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: t.textBody, lineHeight: 1.85, letterSpacing: '0.01em' }}>{text}</p>
            {isLong && <button onClick={() => setExpanded(e => !e)} style={{ fontSize: '11px', color: t.accentMuted, marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{expanded ? 'Show less' : 'Read more'}</button>}

            {/* Audio playback */}
            {c.audio_url && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px' }}>🎙️</span>
                  <span style={{ fontSize: '10px', color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Voice Tribute</span>
                </div>
                <audio controls src={c.audio_url} style={{ width: '100%', height: '32px', borderRadius: '8px' }} />
              </div>
            )}

            {/* Video playback */}
            {c.video_url && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px' }}>🎬</span>
                  <span style={{ fontSize: '10px', color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Video Tribute</span>
                </div>
                {expanded ? (
                  <video controls src={c.video_url} style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', background: '#000' }} />
                ) : (
                  <button onClick={() => setExpanded(true)} style={{ width: '100%', padding: '0', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                    {c.thumbnail_url
                      ? <img src={c.thumbnail_url} alt="Video thumbnail" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>▶</div>
                    }
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>▶</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          {isPending && <span style={{ fontSize: '9px', color: t.accentMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>· Awaiting review</span>}
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            {isAdmin && isPending && !editing && <button onClick={() => onApprove(c.id)} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)', color: 'rgba(134,239,172,0.85)', cursor: 'pointer' }}>Approve</button>}
            {canEdit && !editing && <button onClick={() => setEditing(true)} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textFaint, cursor: 'pointer' }}>Edit</button>}
            {canDelete && !editing && <button onClick={() => { if (window.confirm('Remove this tribute?')) onDelete(c.id) }} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.18)', background: 'transparent', color: 'rgba(248,113,113,0.55)', cursor: 'pointer' }}>Delete</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   PREMIUM FEATURE MODAL
========================================================= */
function PremiumModal({ feature, onClose, t }: { feature: 'video' | 'audio' | null; onClose: () => void; t: ThemeConfig }) {
  if (!feature) return null
  const isVideo = feature === 'video'
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(8,2,20,0.90)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '320px', borderRadius: '20px', padding: '28px 24px', textAlign: 'center', position: 'relative', background: 'linear-gradient(145deg, #1e0d4e, #2a1060)', border: `1px solid ${t.accentFaint}`, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '32px', marginBottom: '14px' }}>{isVideo ? '🎬' : '🎙️'}</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 700, color: t.textHeading, marginBottom: '10px' }}>{isVideo ? 'Video' : 'Audio'} Tributes</h3>
        <p style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.7, marginBottom: '20px' }}>{isVideo ? 'Video' : 'Audio'} contributions are a premium feature. Contact us to activate this for your capsule.</p>
        <a href="mailto:hello@itslegacycapsule.com" style={{ display: 'inline-block', fontSize: '12px', padding: '10px 22px', borderRadius: '24px', fontWeight: 700, background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', textDecoration: 'none' }}>Get in touch</a>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', color: t.textFaint, background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
    </div>
  )
}

/* =========================================================
   MAP MODAL — ceremonial, rounded
========================================================= */
function MapModal({ pins, honourName, uniqueCountries, onClose, t }: { pins: Pin[]; honourName: string; uniqueCountries: string[]; onClose: () => void; t: ThemeConfig }) {
  return (
    <div style={{ position: 'fixed', inset: '16px', zIndex: 50, display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', background: 'rgba(8,2,26,0.97)', backdropFilter: 'blur(4px)' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${t.accentFaint}` }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: t.textHeading, fontFamily: "'Playfair Display', serif" }}>A World of Tributes</p>
          <p style={{ fontSize: '11px', color: t.textFaint, marginTop: '3px' }}>
            {uniqueCountries.length > 0 ? `Every pin represents someone who paused to honour ${honourName}` : 'Pins appear as tributes are approved'}
          </p>
        </div>
        <button onClick={onClose} style={{ color: t.textFaint, background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>×</button>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <TributeMap pins={pins} locked={false} pinFill={t.mapPinFill} mapBg={t.mapBg} />
      </div>
      <div style={{ flexShrink: 0, textAlign: 'center', padding: '14px 20px', borderTop: `1px solid ${t.accentFaint}` }}>
        <p style={{ fontSize: '10px', color: t.accentMuted, letterSpacing: '0.06em' }}>
          {uniqueCountries.length > 0 ? `Voices from ${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'country' : 'countries'}` : ''}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   PROFILE SECTION RENDERER — for profile summary
========================================================= */
function ProfileSummarySection({ section, t }: { section: ProfileSection; t: ThemeConfig }) {
  const title = section.custom_title ?? section.section_type.replace(/_/g, ' ')
  if (!section.content) return null
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, ${t.accentFaint}, transparent)` }} />
        <h3 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', color: t.accentMuted, margin: 0, whiteSpace: 'nowrap' }}>{title}</h3>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, ${t.accentFaint}, transparent)` }} />
      </div>
      <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.85, textAlign: 'center', padding: '0 8px', opacity: 0.85 }}>{section.content}</p>
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function TributeWallClient({ capsule, initialContributions, profileSections, featuredPhotos, themeKey }: Props) {
  const t = getThemeConfig(themeKey)
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  /* ── STATE ── */
  const [all, setAll] = useState<Contribution[]>(initialContributions)
  const [visitorEmail, setVisitorEmail] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVideoUploader, setShowVideoUploader] = useState(false)
  const [fAudioUrl, setFAudioUrl] = useState<string | null>(null)
  const [fVideoUrl, setFVideoUrl] = useState<string | null>(null)
  const [fVideoThumb, setFVideoThumb] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(capsule.hero_image_url ?? null)
  const [heroPosition, setHeroPosition] = useState<string>((capsule as any).hero_image_position ?? '50% 50%')
  const [heroZoom, setHeroZoom] = useState<number>((capsule as any).hero_image_zoom ?? 150)
  const [heroFit, setHeroFit] = useState<string>((capsule as any).hero_image_fit ?? 'height')
  const [heroSize, setHeroSize] = useState<string>((capsule as any).hero_panel_size ?? 'standard')
  const [heroBleed, setHeroBleed] = useState<boolean>((capsule as any).hero_full_bleed ?? false)
  const [showPositionPicker, setShowPositionPicker] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const heroPhotoRef = useRef<HTMLInputElement>(null)
  const [fName, setFName] = useState(''); const [fEmail, setFEmail] = useState('')
  const [fCity, setFCity] = useState(''); const [fCountry, setFCountry] = useState('')
  const [fMsg, setFMsg] = useState(''); const [fRel, setFRel] = useState('')
  const [fPhoto, setFPhoto] = useState<File | null>(null); const [fPhotoPreview, setFPhotoPreview] = useState<string | null>(null)
  const [countryQuery, setCountryQuery] = useState(''); const [showCountryList, setShowCountryList] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false); const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null); const countryRef = useRef<HTMLDivElement>(null); const photoRef = useRef<HTMLInputElement>(null)

  /* ── DERIVED ── */
  const honourName = capsule.honouree_name
  const pageTitle = getTributePageTitle(capsule.event_type, honourName)
  const ornament = ORNAMENTS[capsule.event_type] ?? '✦'
  const isAdmin = visitorEmail !== '' && visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase()
  const visible = all.filter(c => { if (c.status === 'approved') return true; if (isAdmin) return true; if (visitorEmail && c.email?.toLowerCase() === visitorEmail.toLowerCase()) return true; return false })
  const approvedCount = all.filter(c => c.status === 'approved').length
  const pins: Pin[] = all.filter(c => c.status === 'approved' && c.lat && c.lng).map(c => ({ lat: c.lat as number, lng: c.lng as number, name: c.contributor_name, country: c.country }))
  const uniqueCountries = [...new Set(all.filter(c => c.status === 'approved' && (c as any).ip_country).map(c => (c as any).ip_country as string))]
  const capsuleUrl = typeof window !== 'undefined' ? window.location.origin + '/for/' + capsule.slug : 'https://itslegacycapsule.com/for/' + capsule.slug
  const resolvedHero = heroImage ?? featuredPhotos.find(p => p.is_hero)?.image_url ?? '/honouree.jpg'
  // Cities list for map label
  const cityNames = [...new Set(pins.map(p => p.name ? p.country : '').filter(Boolean))].slice(0, 3)

  /* ── EFFECTS ── */
  useEffect(() => { const saved = localStorage.getItem(LS_EMAIL); if (saved) { setVisitorEmail(saved); setFEmail(saved) } }, [])

  // Store this capsule as last visited — for nav back link
  useEffect(() => {
    try {
      localStorage.setItem('lc_last_capsule', JSON.stringify({
        slug: capsule.slug,
        name: capsule.honouree_name,
      }))
    } catch {}
  }, [capsule.slug, capsule.honouree_name])
  useEffect(() => { if (fEmail.includes('@')) { localStorage.setItem(LS_EMAIL, fEmail); setVisitorEmail(fEmail) } }, [fEmail])
  const poll = useCallback(async () => { const { data } = await supabaseClient.from('contributions').select('id, contributor_name, city, country, ip_country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at').eq('capsule_id', capsule.id).is('deleted_at', null).order('created_at', { ascending: false }); if (data) setAll(data as Contribution[]) }, [capsule.id])
  useEffect(() => { const iv = setInterval(poll, 60_000); return () => clearInterval(iv) }, [poll])
  useEffect(() => { const handler = (e: MouseEvent) => { if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountryList(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])
  useEffect(() => { document.body.style.overflow = mapOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [mapOpen])

  /* ── HANDLERS ── */
  const handleApprove = async (id: string) => { await supabaseClient.from('contributions').update({ status: 'approved' }).eq('id', id); fetch('/api/email/approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionId: id }) }).catch(() => {}); poll() }
  const handleDelete = async (id: string) => { await supabaseClient.from('contributions').delete().eq('id', id); poll() }
  const handleEdit = async (id: string, text: string) => { await supabaseClient.from('contributions').update({ tribute_text: text }).eq('id', id); poll() }
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const compressed = await compressPhoto(f); setFPhoto(compressed); const reader = new FileReader(); reader.onload = ev => setFPhotoPreview(ev.target?.result as string); reader.readAsDataURL(compressed) }
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !isAdmin) return; setUploadingHero(true); try { const compressed = await compressPhoto(f); const ext = compressed.name.split('.').pop() ?? 'jpg'; const path = `hero/${capsule.id}.${ext}`; const { error: ue } = await supabaseClient.storage.from(BUCKET).upload(path, compressed, { upsert: true }); if (!ue) { const url = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; await supabaseClient.from('capsules').update({ hero_image_url: url }).eq('id', capsule.id); setHeroImage(url); setShowPositionPicker(true) } } catch (err) { console.error(err) } setUploadingHero(false) }
  const handleCopy = async () => { await navigator.clipboard.writeText(capsuleUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const validate = () => { const e: Record<string, string> = {}; if (!fName.trim()) e.name = 'Name required'; if (!fEmail.trim() || !fEmail.includes('@')) e.email = 'Valid email required'; if (!fCity.trim()) e.city = 'City required'; if (!fCountry) e.country = 'Country required'; if (fMsg.trim().length < MIN_CHARS) e.msg = `${MIN_CHARS}+ characters`; if (fMsg.trim().length > MAX_CHARS) e.msg = `Over ${MAX_CHARS} limit`; setErrors(e); return !Object.keys(e).length }
  const handleSubmit = async () => {
    if (!validate()) return; setSubmitting(true); setSubmitErr('')
    try {
      let photoUrl: string | null = null
      if (fPhoto) { const ext = fPhoto.name.split('.').pop() ?? 'jpg'; const path = capsule.id + '/' + Date.now() + '.' + ext; const { error: ue } = await supabaseClient.storage.from(BUCKET).upload(path, fPhoto, { upsert: false }); if (!ue) photoUrl = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
      const coords = await getIPCoords()
      const { data: nc, error: ie } = await supabaseClient.from('contributions').insert({ capsule_id: capsule.id, contributor_name: fName.trim(), city: fCity.trim(), country: fCountry, relationship: fRel.trim() || null, tribute_text: fMsg.trim(), email: fEmail.trim(), thumbnail_url: fVideoThumb ?? photoUrl, audio_url: fAudioUrl ?? null, video_url: fVideoUrl ?? null, lat: coords?.lat ?? null, lng: coords?.lng ?? null, ip_country: coords?.country ?? null, status: 'pending_review' }).select('id').single()
      if (ie) { setSubmitErr(ie.message); setSubmitting(false); return }
      if (nc) { fetch('/api/email/submission-confirmation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionId: nc.id, capsuleSlug: capsule.slug, contributorName: fName.trim(), contributorEmail: fEmail.trim(), subjectName: honourName, eventType: capsule.event_type, tributeText: fMsg.trim() }) }).catch(() => {}) }
      localStorage.setItem(LS_EMAIL, fEmail); setVisitorEmail(fEmail)
      setFName(''); setFCity(''); setFCountry(''); setFMsg(''); setFRel(''); setFPhoto(null); setFPhotoPreview(null); setCountryQuery(''); setErrors({})
      setFAudioUrl(null); setFVideoUrl(null); setFVideoThumb(null)
      setShowAudioRecorder(false); setShowVideoUploader(false)
      setSubmitSuccess(true); setComposerOpen(false); setTimeout(() => setSubmitSuccess(false), 3500); poll()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch { setSubmitErr('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  /* ── INPUT STYLE ── */
  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '12px 14px', borderRadius: '14px',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textBody,
    outline: 'none', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  }

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <>
      <style>{`
        @keyframes goldPulse { 0%,100%{opacity:0;transform:scale(0.95)} 50%{opacity:0.4;transform:scale(1.05)} }
        .map-pulse{animation:goldPulse 3.5s ease-in-out infinite}
        @keyframes composerSlide { from{max-height:0;opacity:0} to{max-height:600px;opacity:1} }
        .composer-enter{animation:composerSlide 0.35s ease-out forwards}
      `}</style>

      {mapOpen && <MapModal pins={pins} honourName={honourName} uniqueCountries={uniqueCountries} onClose={() => setMapOpen(false)} t={t} />}

      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', background: t.pageBg }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

          {/* ── TOP BAR ── */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px 8px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', color: t.textFaint, marginLeft: '0.18em' }}>CAPSULE</span>
            </Link>
          </div>

          {/* ── HERO — Identity first ── */}
          {(() => {
            const sizeMap: Record<string, string> = { compact: '180px', standard: '260px', cinematic: '380px' }
            const minH = sizeMap[heroSize] ?? '260px'
            const bleedStyle = heroBleed
              ? { margin: '0', borderRadius: '0' }
              : { margin: '0 12px', borderRadius: '20px' }
            return (
          <div style={{ flexShrink: 0, position: 'relative', overflow: 'hidden', minHeight: minH, ...bleedStyle }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resolvedHero})`, backgroundSize: heroFit === 'width' ? '100% auto' : heroFit === 'height' ? 'auto 100%' : `${heroZoom}%`, backgroundPosition: heroPosition, backgroundRepeat: 'no-repeat', backgroundColor: '#000' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.75) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: t.heroGlow }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)` }} />

            {/* Hero photo upload — visible to organiser */}
            {(isAdmin || (visitorEmail && visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase())) && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20 }}>
                <button onClick={() => heroPhotoRef.current?.click()} disabled={uploadingHero}
                  style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(10,2,26,0.8)', border: `1px solid ${t.accentFaint}`, color: t.accentMuted, backdropFilter: 'blur(8px)', cursor: 'pointer' }}>
                  {uploadingHero ? 'Uploading…' : '📷 Change photo'}
                </button>
                <input ref={heroPhotoRef} type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
              </div>
            )}

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '0 20px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', lineHeight: 1 }}>{ornament}</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: 800, color: t.textHeading, lineHeight: 1.15, textShadow: '0 2px 20px rgba(0,0,0,0.9)', marginBottom: '6px' }}>{pageTitle}</h1>
              {capsule.event_tag && <p style={{ fontSize: '11px', color: t.accentMuted, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: '6px' }}>{capsule.event_tag}</p>}
              {capsule.event_date && <p style={{ fontSize: '10px', color: t.textFaint, marginTop: '6px' }}>{new Date(capsule.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            </div>
          </div>
          )
          })()}

          {/* Hero photo settings — toggled by organiser */}
          {heroImage && (isAdmin || (visitorEmail && visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase())) && (
            <div style={{ margin: `4px ${heroBleed ? '0' : '12px'} 0`, display: 'flex', justifyContent: 'flex-end' }}>
              {!showPositionPicker ? (
                <button onClick={() => setShowPositionPicker(true)} style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '12px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.04)', color: t.accentMuted, cursor: 'pointer', letterSpacing: '0.06em', marginRight: heroBleed ? '12px' : '0' }}>
                  ↕ Adjust photo
                </button>
              ) : (
                <div style={{ width: '100%', padding: heroBleed ? '0 12px' : '0' }}>
                  <HeroPositionPicker
                    capsuleId={capsule.id}
                    imageUrl={heroImage}
                    currentPosition={heroPosition}
                    currentZoom={heroZoom}
                    currentFit={heroFit}
                    currentSize={heroSize}
                    currentBleed={heroBleed}
                    onSettingsChange={({ pos, zoom, fit, size, bleed }) => {
                      setHeroPosition(pos); setHeroZoom(zoom); setHeroFit(fit)
                      setHeroSize(size); setHeroBleed(bleed)
                    }}
                    onDone={() => setShowPositionPicker(false)}
                    t={t}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── COLLAPSIBLE COMPOSER ── */}
          <div style={{ flexShrink: 0, margin: '10px 12px 0' }}>
            {!composerOpen ? (
              /* Collapsed — invitation bar */
              <button onClick={() => setComposerOpen(true)} style={{
                width: '100%', padding: '14px 20px', borderRadius: '16px', cursor: 'pointer',
                background: t.cardBg, border: `1px solid ${t.accentFaint}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '13px', color: t.accentPrimary, fontWeight: 600, letterSpacing: '0.04em' }}>
                  ✦ Click to leave a tribute
                </span>
              </button>
            ) : (
              /* Expanded — full form */
              <div className="composer-enter" style={{ borderRadius: '18px', padding: '18px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}`, overflow: 'hidden' }}>
                {/* Close composer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: t.accentMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Leave a Tribute</span>
                  <button onClick={() => setComposerOpen(false)} style={{ color: t.textFaint, background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>↑</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Name + Email + Photo */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}><input style={inp} placeholder="Your name *" value={fName} onChange={e => setFName(e.target.value)} maxLength={50} />{errors.name && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.name}</p>}</div>
                    <div style={{ flex: 1 }}><input type="email" style={inp} placeholder="Email *" value={fEmail} onChange={e => setFEmail(e.target.value)} maxLength={100} />{errors.email && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.email}</p>}</div>
                    <div onClick={() => photoRef.current?.click()} style={{ width: '42px', height: '42px', borderRadius: '50%', border: `1px dashed ${t.accentFaint}`, background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}>
                      {fPhotoPreview ? <img src={fPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: t.accentMuted, fontSize: '18px', lineHeight: 1 }}>+</span>}
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </div>

                  {/* City + Country + Relationship */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}><input style={inp} placeholder="City *" value={fCity} onChange={e => setFCity(e.target.value)} maxLength={50} />{errors.city && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.city}</p>}</div>
                    <div style={{ flex: 1, position: 'relative' }} ref={countryRef}>
                      <input style={inp} placeholder="Country *" value={countryQuery || fCountry} onChange={e => { setCountryQuery(e.target.value); setFCountry(''); setShowCountryList(true) }} onFocus={() => setShowCountryList(true)} maxLength={50} />
                      {errors.country && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.country}</p>}
                      {showCountryList && <div style={{ position: 'absolute', zIndex: 30, marginTop: '4px', width: '100%', maxHeight: '150px', overflowY: 'auto', borderRadius: '12px', background: 'rgba(18,6,48,0.97)', backdropFilter: 'blur(16px)', border: `1px solid ${t.accentFaint}`, boxShadow: '0 12px 32px rgba(0,0,0,0.75)' }}>
                        {COUNTRIES.filter(c => c.toLowerCase().includes((countryQuery || '').toLowerCase())).slice(0, 20).map(c => (
                          <div key={c} onMouseDown={() => { setFCountry(c); setCountryQuery(''); setShowCountryList(false) }} style={{ padding: '8px 14px', fontSize: '13px', color: t.textBody, cursor: 'pointer', borderBottom: `1px solid ${t.accentFaint}` }}>{c}</div>
                        ))}
                      </div>}
                    </div>
                    <div style={{ flex: 1 }}><input style={inp} placeholder="Relationship" value={fRel} onChange={e => setFRel(e.target.value)} maxLength={50} /></div>
                  </div>

                  {/* Tribute + Submit */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea style={{ ...inp, minHeight: '80px', maxHeight: '120px', resize: 'none', lineHeight: 1.7 }} placeholder={`Share a memory or tribute for ${honourName}…`} value={fMsg} onChange={e => setFMsg(e.target.value)} maxLength={MAX_CHARS} rows={3} />
                      <span style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '9px', color: fMsg.length > 900 ? t.accentPrimary : t.textFaint, pointerEvents: 'none' }}>{fMsg.length}/{MAX_CHARS}</span>
                      {errors.msg && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.msg}</p>}
                    </div>
                    <button onClick={handleSubmit} disabled={submitting} style={{ flexShrink: 0, padding: '14px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '13px', background: `linear-gradient(180deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0826', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1, boxShadow: `0 6px 20px rgba(0,0,0,0.3)`, transition: 'all 0.2s', alignSelf: 'flex-start', marginTop: '2px' }}>
                      {submitting ? '…' : 'Submit'}
                    </button>
                  </div>

                  {/* Action strip */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => { setShowVideoUploader(false); setShowAudioRecorder(v => !v) }} title="Record a voice tribute" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${showAudioRecorder ? t.accentFaint : t.cardBorder}`, background: showAudioRecorder ? t.accentFaint : t.inputBg, color: showAudioRecorder ? t.accentPrimary : t.textMuted, cursor: 'pointer' }}><span style={{ fontSize: '14px' }}>🎙️</span>Audio</button>
                    <button onClick={() => { setShowAudioRecorder(false); setShowVideoUploader(v => !v) }} title="Upload a video tribute" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${showVideoUploader ? t.accentFaint : t.cardBorder}`, background: showVideoUploader ? t.accentFaint : t.inputBg, color: showVideoUploader ? t.accentPrimary : t.textMuted, cursor: 'pointer' }}><span style={{ fontSize: '14px' }}>🎬</span>Video</button>
                    <div style={{ flex: 1 }} />
                    <button onClick={handleCopy} title="Copy link" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.accentFaint}`, background: copied ? t.accentFaint : t.inputBg, color: copied ? t.accentPrimary : t.accentMuted, cursor: 'pointer' }}><span style={{ fontSize: '14px' }}>{copied ? '✓' : '🔗'}</span>{copied ? 'Copied' : 'Copy'}</button>
                    <Link href={`https://wa.me/?text=${encodeURIComponent('Leave a tribute for ' + honourName + ': ' + capsuleUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.22)', background: t.inputBg, color: 'rgba(74,222,128,0.7)', textDecoration: 'none' }}><span style={{ fontSize: '14px' }}>💬</span>Share</Link>
                  </div>

                  {/* Audio recorder — expands when toggled */}
                  {showAudioRecorder && (
                    <AudioTribute
                      capsuleId={capsule.id}
                      t={t}
                      onRecorded={(url) => setFAudioUrl(url)}
                    />
                  )}

                  {/* Video uploader — expands when toggled */}
                  {showVideoUploader && (
                    <VideoTribute
                      capsuleId={capsule.id}
                      t={t}
                      onUploaded={(vUrl, tUrl) => { setFVideoUrl(vUrl); setFVideoThumb(tUrl) }}
                    />
                  )}

                  {submitSuccess && <div style={{ borderRadius: '12px', padding: '12px 16px', fontSize: '12px', textAlign: 'center', letterSpacing: '0.04em', border: `1px solid ${t.accentFaint}`, background: t.cardBg, color: t.accentPrimary }}>✦ Your tribute has been received — thank you.</div>}
                  {submitErr && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', textAlign: 'center' }}>{submitErr}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Success toast when composer is closed */}
          {submitSuccess && !composerOpen && (
            <div style={{ margin: '10px 12px 0', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', textAlign: 'center', border: `1px solid ${t.accentFaint}`, background: t.cardBg, color: t.accentPrimary }}>✦ Your tribute has been received — thank you.</div>
          )}

          {/* ── TRIBUTE WALL HEADER ── */}
          <div style={{ flexShrink: 0, padding: '18px 16px 10px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 700, color: t.textHeading, letterSpacing: '0.04em', textShadow: `0 0 20px ${t.accentFaint}` }}>
              {approvedCount > 0 ? `${approvedCount} ${approvedCount === 1 ? 'person has' : 'people have'} honoured ${honourName}` : `Be the first to honour ${honourName}`}
            </p>
            <div style={{ height: '1px', marginTop: '12px', background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)` }} />
          </div>

          {/* ── TRIBUTE CARDS ── */}
          <div style={{ margin: '0 12px 16px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0, minHeight: '100px', maxHeight: '420px', height: 'auto', border: `1px solid ${t.cardBorder}`, background: 'rgba(0,0,0,0.12)' }}>
            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'thin', scrollbarColor: `${t.accentFaint} transparent` }}>
              {visible.length === 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}><p style={{ color: t.textFaint, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Be the first to leave a tribute.</p></div>}
              {visible.map(c => <TributeCard key={c.id} c={c} isAdmin={isAdmin} isOwn={visitorEmail !== '' && c.email?.toLowerCase() === visitorEmail.toLowerCase()} onApprove={handleApprove} onDelete={handleDelete} onEdit={handleEdit} t={t} />)}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── MAP MEMORY CARD ── */}
          <div style={{ margin: '0 12px 16px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.accentFaint}`, background: t.cardBg, cursor: 'pointer' }} onClick={() => setMapOpen(true)} title="View the world tribute map">
            {/* Card header */}
            <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accentMuted }}>A World Gathered</span>
              {uniqueCountries.length > 0 && <span style={{ fontSize: '10px', color: t.textFaint }}>{uniqueCountries.length} {uniqueCountries.length === 1 ? 'country' : 'countries'}</span>}
            </div>
            {/* Map strip */}
            <div style={{ height: '85px', margin: '8px 0', position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
              {!mapOpen && <TributeMap pins={pins} locked={true} pinFill={t.mapPinFill} mapBg={t.mapBg} />}
              <div className="map-pulse" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 50%, ${t.mapPinGlow} 0%, transparent 70%)` }} />
            </div>
            {/* Card footer */}
            <div style={{ padding: '0 16px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: t.textFaint, letterSpacing: '0.04em' }}>
                {uniqueCountries.length > 0 ? 'Tap to explore where tributes have arrived from' : 'Pins appear as tributes are approved'}
              </span>
            </div>
          </div>

          {/* ── PROFILE SUMMARY ── */}
          {/* No photo/name repeat. No placeholder notices. Only active sections. */}
          {profileSections.length > 0 && (
            <div style={{ padding: '0 16px 8px' }}>
              {profileSections.map(section => <ProfileSummarySection key={section.id} section={section} t={t} />)}
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <Link href={`/for/${capsule.slug}/profile`} style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none', letterSpacing: '0.06em' }}>
                  Read the full story of {honourName} →
                </Link>
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ padding: '28px 16px 24px', textAlign: 'center' }}>
            <div style={{ height: '1px', marginBottom: '20px', background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)` }} />
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', color: t.textFaint, marginLeft: '0.18em' }}>CAPSULE</span>
            </Link>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', marginTop: '6px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Events end. Legacies continue.</p>
          </div>

        </div>
      </div>
    </>
  )
}
