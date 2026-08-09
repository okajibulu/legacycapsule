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
   - Hero identity-first — composer no longer dominates xxxxx
========================================================= */

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import ActivePremiumsStrip from '@/components/ActivePremiumsStrip'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import { getTributePageTitle } from '@/lib/eventLabels'
import { COUNTRIES } from '@/lib/tributeWallHelpers'
import { getThemeConfig } from '@/lib/themeConfig'
import type { ThemeKey, ThemeConfig } from '@/lib/themeConfig'
import PublicationSubscribePanel from '@/components/capsule/PublicationSubscribePanel'
import { getParticipationLanguage, formatParticipationCount } from '@/lib/utils/getParticipationLanguage'
import { getRelationshipQuestion, getRelationshipOptions, getFamiliarName } from '@/lib/utils/getRelationshipQuestion'
import GlobalExpressionsStrip from '@/components/capsule/GlobalExpressionsStrip'

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
  supportAccounts: any[]; themeKey: ThemeKey
}

/* ── CONSTANTS ── */
const MIN_CHARS = 20
const MAX_CHARS = 2000
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
function TributeCard({ c, capsuleId, isAdmin, isOwn, onApprove, onDelete, onEdit, t, serialNumber }: {
  c: Contribution; capsuleId: string; isAdmin: boolean; isOwn: boolean
  onApprove: (id: string) => void; onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void; t: ThemeConfig; serialNumber?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.tribute_text)
  // 3-line clamp via CSS — no char counting needed
  const isPending = c.status === 'pending_review' || c.status === 'pending'
  const canEdit = (isOwn && isPending) || isAdmin
  const canDelete = (isOwn && isPending) || isAdmin
  const displayName = c.relationship ? `${c.contributor_name} (${c.relationship})` : c.contributor_name

  return (
    <div style={{
      borderRadius: '16px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      backgroundColor: isPending ? 'rgba(234,179,8,0.05)' : t.cardBg,
     borderTop: `1px solid ${isPending ? t.cardAccentPending : t.cardBorder}`,
borderRight: `1px solid ${isPending ? t.cardAccentPending : t.cardBorder}`,
borderBottom: `1px solid ${isPending ? t.cardAccentPending : t.cardBorder}`,
borderLeft: `3px solid ${isPending ? t.cardAccentPending : t.accentPrimary}`,
      boxShadow: t.cardShadow, transition: 'all 0.24s ease',
 
    }}>
      <div style={{ padding: '14px 20px 14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          {/* Contributor thumbnail if uploaded */}
          {c.thumbnail_url && (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${t.accentFaint}`, marginTop: '2px' }}>
              <img src={c.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Line 1: Serial · Name · Relationship */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              {serialNumber && <span style={{ fontSize: '9px', fontWeight: 700, color: t.textFaint, letterSpacing: '0.08em', fontFamily: 'monospace', flexShrink: 0 }}>#{String(serialNumber).padStart(3, '0')}</span>}
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.textHeading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.contributor_name}
              </span>
              {c.relationship && (
                <span style={{ fontSize: '10px', color: t.accentMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {c.relationship}</span>
              )}
              {isOwn && <span style={{ fontSize: '9px', fontWeight: 400, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>you</span>}
            </div>
            {/* Line 2: City · Country · dd Mon yyyy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: '10px', color: t.textFaint }}>
                {[c.city, c.country].filter(Boolean).join(' · ')}
              </span>
              {(c.city || c.country) && <span style={{ fontSize: '10px', color: t.textFaint }}>·</span>}
              <span style={{ fontSize: '10px', color: t.textFaint }}>
                {new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}).format(new Date(c.created_at))}
              </span>
            </div>
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
            {/* 3-line clamp with inline "read more" at end of line 3 */}
            {!expanded ? (
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.75, letterSpacing: '0.01em', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', margin: 0 }}>{c.tribute_text}</p>
                {c.tribute_text.length > 160 && (
                  <button onClick={() => setExpanded(true)} style={{ fontSize: '11px', color: t.accentMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline', marginTop: '2px' }}>read more</button>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.75, letterSpacing: '0.01em', margin: 0 }}>{c.tribute_text}</p>
                <button onClick={() => setExpanded(false)} style={{ fontSize: '11px', color: t.accentMuted, marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}>show less</button>
              </div>
            )}

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

        {/* Emoji reactions */}
        {!isPending && (
          <EmojiReactions contributionId={c.id} capsuleId={capsuleId} t={t} />
        )}

        {/* Family response — shown if exists */}
        {(c as any).response_text && (
          <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(226,195,107,0.05)', borderLeft: `3px solid rgba(226,195,107,0.35)` }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: t.accentMuted, marginBottom: '5px' }}>
              Family Response · {(c as any).responded_by || 'The Family'}
            </p>
            <p style={{ fontSize: '12px', color: t.textBody, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
              "{(c as any).response_text}"
            </p>
          </div>
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
   EMOJI REACTIONS
========================================================= */
const EMOJIS = ['❤️', '🙏', '✦', '😢', '👏', '🕊️']

function EmojiReactions({ contributionId, capsuleId, t }: {
  contributionId: string; capsuleId: string; t: ThemeConfig
}) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [myReactions, setMyReactions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tribute_reactions')
        .select('emoji')
        .eq('contribution_id', contributionId)

      const tally: Record<string, number> = {}
      data?.forEach(r => { tally[r.emoji] = (tally[r.emoji] ?? 0) + 1 })
      setCounts(tally)
      setLoading(false)
    }
    load()

    // Load my reactions from localStorage
    const stored = localStorage.getItem(`reactions_${contributionId}`)
    if (stored) setMyReactions(JSON.parse(stored))
  }, [contributionId])

  const handleReact = async (emoji: string) => {
    const res = await fetch('/api/tribute/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contributionId, capsuleId, emoji }),
    })
    const data = await res.json()

    if (data.action === 'added') {
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }))
      const updated = [...myReactions, emoji]
      setMyReactions(updated)
      localStorage.setItem(`reactions_${contributionId}`, JSON.stringify(updated))
    } else {
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }))
      const updated = myReactions.filter(r => r !== emoji)
      setMyReactions(updated)
      localStorage.setItem(`reactions_${contributionId}`, JSON.stringify(updated))
    }
  }

  if (loading) return null

  const hasAny = EMOJIS.some(e => (counts[e] ?? 0) > 0) || true // always show

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginTop: '10px' }}>
      {EMOJIS.map(emoji => {
        const count = counts[emoji] ?? 0
        const isMine = myReactions.includes(emoji)
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '3px 8px', borderRadius: '20px', cursor: 'pointer',
              fontSize: '13px', lineHeight: 1,
              border: `1px solid ${isMine ? 'rgba(226,195,107,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background: isMine ? 'rgba(226,195,107,0.08)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.15s',
            }}
          >
            <span>{emoji === '✦' ? <span style={{ color: '#E2C36B', fontSize: '11px' }}>✦</span> : emoji}</span>
            {count > 0 && <span style={{ fontSize: '10px', color: isMine ? t.accentPrimary : t.textFaint, fontWeight: isMine ? 700 : 400 }}>{count}</span>}
          </button>
        )
      })}
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
    <div style={{ position: 'fixed', top: '16px', left: '16px', right: '16px', bottom: '16px', zIndex: 50, display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', background: 'rgba(8,2,26,0.97)', backdropFilter: 'blur(4px)' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${t.accentFaint}` }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: t.textHeading, fontFamily: "'Playfair Display', serif" }}>{`A World of Voices`}</p>
          <p style={{ fontSize: '11px', color: t.textFaint, marginTop: '3px' }}>
            {uniqueCountries.length > 0 ? `Every pin represents someone who paused to honour ${honourName}` : `Pins appear as voices are approved`}
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
function ProfileSummarySection({ section, t, slug }: { section: ProfileSection; t: ThemeConfig; slug: string }) {
  const title = section.custom_title ?? section.section_type.replace(/_/g, ' ')
  if (!section.content) return null
  const truncated = section.content.length > 100 ? section.content.slice(0, 100).trimEnd() + '…' : section.content
  const needsTruncation = section.content.length > 100
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Gold separator line */}
      <div style={{ height: '1px', marginBottom: '16px', background: `linear-gradient(to right, transparent, ${t.accentPrimary}, transparent)`, opacity: 0.4 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: t.accentMuted, margin: 0 }}>{title}</h3>
      </div>
      {needsTruncation ? (
        <Link href={`/for/${slug}/profile`} style={{ textDecoration: 'none' }}>
          <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.85, padding: '0 8px', opacity: 0.85, cursor: 'pointer' }}>
            {truncated}
            <span style={{ color: t.accentMuted, fontSize: '12px', marginLeft: '4px' }}>read more</span>
          </p>
        </Link>
      ) : (
        <p style={{ fontSize: '13px', color: t.textBody, lineHeight: 1.85, padding: '0 8px', opacity: 0.85 }}>{section.content}</p>
      )}
    </div>
  )
}


function RelationshipSelect({ selected, onChange, error, t, eventType, honoureeName }: {
  selected: string[]
  onChange: (val: string[]) => void
  error?: string
  t: ThemeConfig
  eventType: string
  honoureeName: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(r => r !== opt) : [...selected, opt])
  }

  return (
    <div style={{ position: 'relative' }}>
      <p style={{ fontSize: '11px', color: t.accentMuted, fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {getRelationshipQuestion(eventType, honoureeName)} <span style={{ color: 'rgba(248,113,113,0.8)' }}>*</span>
      </p>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : open ? t.accentPrimary : t.inputBorder ?? 'rgba(226,195,107,0.18)'}`,
          color: selected.length ? t.textBody : t.textFaint,
          fontSize: '13px', textAlign: 'left' as const,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'border-color 0.2s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1 }}>
          {selected.length === 0
            ? getRelationshipQuestion(eventType, honoureeName)
            : selected.length === 1
              ? selected[0]
              : `${selected[0]} +${selected.length - 1} more`
          }
        </span>
        <span style={{ marginLeft: '8px', fontSize: '10px', color: t.textFaint, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {/* Selected tags — shown below trigger when multiple selected */}
      {selected.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
          {selected.map(s => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: t.accentFaint, border: `1px solid rgba(226,195,107,0.2)`, color: t.accentPrimary }}>
              {s}
              <button type="button" onClick={() => toggle(s)} style={{ background: 'none', border: 'none', color: t.accentMuted, cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: '#1a0f35', border: `1px solid rgba(226,195,107,0.25)`,
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          maxHeight: '180px', overflowY: 'auto' as const,
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain' as const,
        }}>

<div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
  <input
    value={search}
    onChange={e => setSearch(e.target.value)}
    placeholder="Search relationship..."
    style={{
      width: '100%',
      padding: '8px 10px',
      borderRadius: '8px',
      border: '1px solid rgba(226,195,107,0.18)',
      background: 'rgba(255,255,255,0.04)',
      color: t.textBody,
      fontSize: '12px',
      outline: 'none',
    }}
  />
</div>

{getRelationshipOptions(eventType)
  .filter((opt: string) =>
    opt.toLowerCase().includes(search.toLowerCase())
  )
  .map((opt: string) => {
                const isSelected = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
  toggle(opt)
  setOpen(false)
}}
                style={{
                  width: '100%', padding: '10px 14px', textAlign: 'left' as const,
                  background: isSelected ? 'rgba(226,195,107,0.08)' : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  color: isSelected ? t.accentPrimary : t.textBody,
                  fontSize: '13px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'background 0.15s',
                }}
              >
                {opt}
                {isSelected && <span style={{ color: t.accentPrimary, fontSize: '14px' }}>✓</span>}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(226,195,107,0.05)', border: 'none', color: t.accentMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em' }}
          >Done ✓</button>
        </div>
      )}

      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function TributeWallClient({ capsule, initialContributions, profileSections, featuredPhotos, supportAccounts, themeKey }: Props) {
  const t = getThemeConfig(themeKey)
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const searchParams = useSearchParams()
const phaseId = searchParams.get('phase')
  /* ── STATE ── */
  const [all, setAll] = useState<Contribution[]>(initialContributions)
  const [visitorEmail, setVisitorEmail] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVideoUploader, setShowVideoUploader] = useState(false)
  const [premiumNotice, setPremiumNotice] = useState<'audio' | 'video' | null>(null)
  const [fAudioUrl, setFAudioUrl] = useState<string | null>(null)
  const [fVideoUrl, setFVideoUrl] = useState<string | null>(null)
  const [fVideoThumb, setFVideoThumb] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(capsule.hero_image_url ?? null)
  const [heroPosition, setHeroPosition] = useState<string>((capsule as any).hero_image_position ?? '50% 50%')
  const [heroZoom, setHeroZoom] = useState<number>((capsule as any).hero_image_zoom ?? 150)
  const [heroFit, setHeroFit] = useState<string>((capsule as any).hero_image_fit ?? 'height')
  const [heroSize, setHeroSize] = useState<string>((capsule as any).hero_panel_size ?? 'compact')
  const [heroBleed, setHeroBleed] = useState<boolean>((capsule as any).hero_full_bleed ?? false)
const [showPositionPicker, setShowPositionPicker] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [repAccessOpen, setRepAccessOpen] = useState(false)
  const [repAccessEmail, setRepAccessEmail] = useState('')
  const [repAccessSending, setRepAccessSending] = useState(false)
  const [repAccessDone, setRepAccessDone] = useState(false)
  const [repAccessError, setRepAccessError] = useState('')
  const heroPhotoRef = useRef<HTMLInputElement>(null)
  const [fName, setFName] = useState(''); const [fEmail, setFEmail] = useState('')
  const [fCity, setFCity] = useState(''); const [fCountry, setFCountry] = useState('')
  const [fMsg, setFMsg] = useState(''); const [fRel, setFRel] = useState<string[]>([])
  const [fPhoto, setFPhoto] = useState<File | null>(null); const [fPhotoPreview, setFPhotoPreview] = useState<string | null>(null)
  const [countryQuery, setCountryQuery] = useState(''); const [showCountryList, setShowCountryList] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false); const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [phases, setPhases] = useState<Array<{ id: string; name: string; event_date: string | null; photo_count: number }>>([])
const [fConsent, setFConsent] = useState(false)
  const [arrivalRef, setArrivalRef] = useState<string | null>(null)
  const [myRefCode, setMyRefCode] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null); const countryRef = useRef<HTMLDivElement>(null); const photoRef = useRef<HTMLInputElement>(null)

  /* ── DERIVED ── */
  const honourName = capsule.honouree_name
  const pageTitle = getTributePageTitle(capsule.event_type, honourName)
  const ornament = ORNAMENTS[capsule.event_type] ?? '✦'
  const lang      = getParticipationLanguage(capsule.event_type)
  const isAdmin = visitorEmail !== '' && visitorEmail.toLowerCase() === capsule.organiser_email?.toLowerCase()
  const visible = all.filter(c => { if (c.status === 'approved') return true; if (isAdmin) return true; if (visitorEmail && c.email?.toLowerCase() === visitorEmail.toLowerCase()) return true; return false })
  const approvedCount = all.filter(c => c.status === 'approved').length
  const pins: Pin[] = all.filter(c => c.status === 'approved' && c.lat && c.lng).map(c => ({ lat: c.lat as number, lng: c.lng as number, name: c.contributor_name, country: c.country }))
  const uniqueCountries = [...new Set(all.filter(c => c.status === 'approved' && (c as any).ip_country).map(c => (c as any).ip_country as string))]
  const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}`
 const resolvedHero =
  heroImage ??
  featuredPhotos.find(p => p.is_hero)?.image_url ??
  null
   // Cities list for map label
  const cityNames = [...new Set(pins.map(p => p.name ? p.country : '').filter(Boolean))].slice(0, 3)

  /* ── EFFECTS ── */
  useEffect(() => { const saved = localStorage.getItem(LS_EMAIL); if (saved) { setVisitorEmail(saved); setFEmail(saved) } }, [])
// LC-PARTICIPATION-001: Capture ?ref= from URL on arrival
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref && /^[A-Z2-9]{8}$/.test(ref)) {
        setArrivalRef(ref)
        sessionStorage.setItem('lc_arrival_ref_' + capsule.slug, ref)
      } else {
        const stored = sessionStorage.getItem('lc_arrival_ref_' + capsule.slug)
        if (stored) setArrivalRef(stored)
      }
    } catch {}
  }, [capsule.slug])

  // LC-PARTICIPATION-001: Fetch visitor's own ref code for share links
  useEffect(() => {
    if (!visitorEmail) return
    const fetchMyRef = async () => {
      try {
        const { data } = await supabaseClient
          .from('contributions')
          .select('ref_code')
          .eq('capsule_id', capsule.id)
          .eq('email', visitorEmail)
          .eq('status', 'approved')
          .not('ref_code', 'is', null)
          .limit(1)
          .single()
        if (data?.ref_code) setMyRefCode(data.ref_code)
      } catch {}
    }
    fetchMyRef()
  }, [visitorEmail, capsule.id])

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

  // ── Fetch phases with D-Day photo counts ─────────────────────────────────
  useEffect(() => {
    fetch(`/api/capsule/public-info?slug=${capsule.slug}`)
      .then(r => r.json())
      .then(d => { if (d.capsule?.phases) setPhases(d.capsule.phases) })
      .catch(() => {})
  }, [capsule.slug])
  const poll = useCallback(async () => {
    const { data } = await supabaseClient
      .from('contributions')
      .select('id, contributor_name, city, country, ip_country, relationship, tribute_text, thumbnail_url, audio_url, video_url, lat, lng, status, email, created_at, tribute_responses(response_text, responded_by)')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null)
      .is('story_topic_id', null)
      .order('created_at', { ascending: false })
    if (data) {
      // Flatten response onto contribution
      const enriched = data.map((c: any) => ({
        ...c,
        response_text: c.tribute_responses?.[0]?.response_text ?? null,
        responded_by: c.tribute_responses?.[0]?.responded_by ?? null,
      }))
      setAll(enriched as Contribution[])
    }
  }, [capsule.id])
  useEffect(() => { const iv = setInterval(poll, 60_000); return () => clearInterval(iv) }, [poll])
  useEffect(() => { const handler = (e: MouseEvent) => { if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountryList(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])
  useEffect(() => { document.body.style.overflow = mapOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [mapOpen])

  /* ── HANDLERS ── */
  const handleApprove = async (id: string) => { await supabaseClient.from('contributions').update({ status: 'approved' }).eq('id', id); fetch('/api/email/approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionId: id }) }).catch(() => {}); poll() }
  const handleDelete = async (id: string) => { await supabaseClient.from('contributions').delete().eq('id', id); poll() }
  const handleEdit = async (id: string, text: string) => { await supabaseClient.from('contributions').update({ tribute_text: text }).eq('id', id); poll() }
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const compressed = await compressPhoto(f); setFPhoto(compressed); const reader = new FileReader(); reader.onload = ev => setFPhotoPreview(ev.target?.result as string); reader.readAsDataURL(compressed) }
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !isAdmin) return; setUploadingHero(true); try { const compressed = await compressPhoto(f); const ext = compressed.name.split('.').pop() ?? 'jpg'; const path = `hero/${capsule.id}.${ext}`; const { error: ue } = await supabaseClient.storage.from(BUCKET).upload(path, compressed, { upsert: true }); if (!ue) { const url = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; await supabaseClient.from('capsules').update({ hero_image_url: url }).eq('id', capsule.id); setHeroImage(url); setShowPositionPicker(true) } } catch (err) { console.error(err) } setUploadingHero(false) }
const handleCopy = async () => {
    const shareUrl = myRefCode ? capsuleUrl + '?ref=' + myRefCode : capsuleUrl
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (myRefCode) {
      fetch('/api/share/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId: capsule.id, refCode: myRefCode, channel: 'copy_link', contributionId: null }),
      }).catch(() => {})
    }
  }
  const handleRepAccessRequest = async () => {
    if (!repAccessEmail.trim() || !repAccessEmail.includes('@')) {
      setRepAccessError('Please enter a valid email address.')
      return
    }
    setRepAccessSending(true); setRepAccessError('')
    try {
      await fetch('/api/rep/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: repAccessEmail.trim().toLowerCase() }),
      })
      setRepAccessDone(true)
    } catch { setRepAccessError('Something went wrong. Please try again.') }
    setRepAccessSending(false)
  }
  const validate = () => { const e: Record<string, string> = {}; if (!fName.trim()) e.name = 'Name required'; if (!fEmail.trim() || !fEmail.includes('@')) e.email = 'Valid email required'; if (!fCity.trim()) e.city = 'City required'; if (!fCountry) e.country = 'Country required'; if (fMsg.trim().length < MIN_CHARS) e.msg = `${MIN_CHARS}+ characters`; if (fMsg.trim().length > MAX_CHARS) e.msg = `Over ${MAX_CHARS} limit`; setErrors(e); return !Object.keys(e).length }
  const handleSubmit = async () => {
    if (!validate()) return; setSubmitting(true); setSubmitErr('')
    try {
      let photoUrl: string | null = null
      if (fPhoto) { const ext = fPhoto.name.split('.').pop() ?? 'jpg'; const path = capsule.id + '/' + Date.now() + '.' + ext; const { error: ue } = await supabaseClient.storage.from(BUCKET).upload(path, fPhoto, { upsert: false }); if (!ue) photoUrl = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
      const coords = await getIPCoords()
      const { data: nc, error: ie } = await supabaseClient.from('contributions').insert({ capsule_id: capsule.id, phase_id: phaseId || null, contributor_name: fName.trim(), city: fCity.trim(), country: fCountry, relationship: fRel.length > 0 ? fRel.join(', ') : null, tribute_text: fMsg.trim(), email: fEmail.trim(), thumbnail_url: fVideoThumb ?? photoUrl, audio_url: fAudioUrl ?? null, video_url: fVideoUrl ?? null, lat: coords?.lat ?? null, lng: coords?.lng ?? null, ip_country: coords?.country ?? null, status: 'pending_review', legacy_builder_consent: fConsent, story_topic_id: null }).select('id').single()
      if (ie) { setSubmitErr(ie.message); setSubmitting(false); return }
      if (nc) { fetch('/api/email/submission-confirmation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionId: nc.id, capsuleSlug: capsule.slug, contributorName: fName.trim(), contributorEmail: fEmail.trim(), subjectName: honourName, eventType: capsule.event_type, tributeText: fMsg.trim() }) }).catch(() => {}) }
     
     // LC-PARTICIPATION-001: Record attribution if visitor arrived via ?ref= link
      const refFromSession = arrivalRef || sessionStorage.getItem('lc_arrival_ref_' + capsule.slug)
      if (refFromSession && nc) {
        try {
          const { data: referrer } = await supabaseClient
            .from('contributions')
            .select('id')
            .eq('ref_code', refFromSession)
            .single()
          await supabaseClient.from('contribution_attribution').insert({
            contribution_id: nc.id,
            ref_code: refFromSession,
            referrer_contribution_id: referrer?.id ?? null,
            capsule_id: capsule.id,
          })
        } catch {}
        sessionStorage.removeItem('lc_arrival_ref_' + capsule.slug)
      }
     
      localStorage.setItem(LS_EMAIL, fEmail); setVisitorEmail(fEmail)
      setFName(''); setFCity(''); setFCountry(''); setFMsg(''); setFRel([]); setFPhoto(null); setFPhotoPreview(null); setCountryQuery(''); setErrors({})
setFAudioUrl(null); setFVideoUrl(null); setFVideoThumb(null); setFConsent(false)
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

      {/* Premium unlock notice */}
      {premiumNotice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setPremiumNotice(null)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '340px', width: '100%', background: 'linear-gradient(145deg, #1a0845, #0f0620)', border: '1px solid rgba(226,195,107,0.3)', borderRadius: '20px', padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
            <div style={{ height: '2px', position: 'absolute', top: 0, left: '32px', right: '32px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.6), transparent)', borderRadius: '1px' }} />
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '22px' }}>
              {premiumNotice === 'audio' ? '🎙️' : '🎬'}
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(226,195,107,0.55)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '12px' }}>Premium Feature</p>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: '12px' }}>
              {premiumNotice === 'audio' ? 'Voice Tributes' : 'Video Tributes'}
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '24px' }}>
              {premiumNotice === 'audio'
                ? 'Voice tributes allow contributors to record personal audio messages. Hearing someone&apos;s voice adds a dimension text cannot replicate.'
                : 'Video tributes let contributors upload short video messages — visible in their tribute card with a play button.'
              }
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(226,195,107,0.6)', marginBottom: '20px', fontStyle: 'italic' }}>
              This feature needs to be activated for this capsule. Contact the organiser or upgrade from the dashboard.
            </p>
            <button onClick={() => setPremiumNotice(null)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #E2C36B, rgba(226,195,107,0.7))', color: '#1a0845', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>Got it</button>
          </div>
        </div>
      )}

{mapOpen && <MapModal pins={pins} honourName={honourName} uniqueCountries={uniqueCountries} onClose={() => setMapOpen(false)} t={t} />}

      {/* ── Family Rep Access Modal ── */}
      {repAccessOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(8,2,20,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setRepAccessOpen(false); setRepAccessDone(false); setRepAccessEmail(''); setRepAccessError('') }}
        >
          <div
            style={{ width: '100%', maxWidth: '360px', borderRadius: '20px', background: 'linear-gradient(145deg, #1e0d4e, #2a1060)', border: '1px solid rgba(226,195,107,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.7), transparent)' }} />
            <div style={{ padding: '28px 24px' }}>
              {repAccessDone ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '14px' }}>✦</div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(226,195,107,1)', fontFamily: "'Playfair Display', serif", marginBottom: '10px' }}>Check your inbox</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '20px' }}>
                    If your email is registered as a Family Representative on this capsule, your portal access link has been sent.
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: '20px' }}>
                    Didn't receive it? Check your spam folder, or ask the organiser to resend from the capsule dashboard.
                  </p>
                  <button
                    onClick={() => { setRepAccessOpen(false); setRepAccessDone(false); setRepAccessEmail('') }}
                    style={{ padding: '10px 28px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(226,195,107,1), rgba(226,195,107,0.7))', color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontFamily: "'Playfair Display', serif", marginBottom: '6px' }}>Family Rep Portal</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
                      Enter your email address and we will send your private portal access link.
                    </p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={repAccessEmail}
                      onChange={e => { setRepAccessEmail(e.target.value); setRepAccessError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleRepAccessRequest()}
                      style={{
                        width: '100%', fontSize: '13px', padding: '11px 14px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        border: `1px solid ${repAccessError ? 'rgba(248,113,113,0.4)' : 'rgba(226,195,107,0.25)'}`,
                        color: '#ffffff', outline: 'none',
                        fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
                      }}
                    />
                    {repAccessError && (
                      <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '5px' }}>{repAccessError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleRepAccessRequest}
                    disabled={repAccessSending || !repAccessEmail.trim()}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '12px',
                      background: repAccessEmail.trim()
                        ? 'linear-gradient(135deg, rgba(226,195,107,1), rgba(226,195,107,0.7))'
                        : 'rgba(255,255,255,0.06)',
                      color: repAccessEmail.trim() ? '#1a0845' : 'rgba(255,255,255,0.3)',
                      fontSize: '13px', fontWeight: 700, border: 'none',
                      cursor: repAccessEmail.trim() ? 'pointer' : 'not-allowed',
                      opacity: repAccessSending ? 0.7 : 1,
                    }}
                  >
                    {repAccessSending ? 'Sending…' : 'Send My Access Link →'}
                  </button>
                  <button
                    onClick={() => { setRepAccessOpen(false); setRepAccessEmail(''); setRepAccessError('') }}
                    style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', background: t.pageBg }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header — scrollable */}

{/* ── TOP BAR — session aware ── */}
<div
  style={{
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 8px',
    gap: '12px'
  }}
>
  <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
    <span
      style={{
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.18em',
        background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}
    >
      LEGACY
    </span>
    <span
      style={{
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.18em',
        color: t.textFaint,
        marginLeft: '0.18em'
      }}
    >
      CAPSULE
    </span>
  </Link>

  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Link
      href={`/for/${capsule.slug}/profile`}
      style={{
        fontSize: '12px',
        fontWeight: 600,
        color: t.accentPrimary,
        textDecoration: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      View Profile →
    </Link>

    {isAdmin && (
      <Link
        href={`/manage/${capsule.slug}`}
        style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '5px 12px',
          borderRadius: '20px',
          background: `rgba(226,195,107,0.1)`,
          border: `1px solid rgba(226,195,107,0.28)`,
          color: t.accentPrimary,
          textDecoration: 'none',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap'
        }}
      >
        ⚙ Manage
      </Link>
    )}
  </div>
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

{resolvedHero ? (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `url(${resolvedHero})`,
      backgroundSize:
        heroFit === 'width'
          ? '100% auto'
          : heroFit === 'height'
          ? 'auto 100%'
          : heroFit === 'custom'
          ? `${heroZoom}%`
          : 'cover',
      backgroundPosition: heroPosition,
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#000'
    }}
  />
) : (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
background:
  capsule?.event_type === 'Memorial'
    ? 'linear-gradient(145deg, #050507 0%, #140f1d 45%, #24142d 100%)'
    : capsule?.event_type === 'Retirement' ||
      capsule?.event_type === 'Award Ceremony' ||
      capsule?.event_type === 'Ordination' ||
      capsule?.event_type === 'Chieftaincy'
    ? 'linear-gradient(145deg, #120d06 0%, #2a1b08 45%, #4b3212 100%)'
    : capsule?.event_type === 'Biography'
    ? 'linear-gradient(145deg, #08121a 0%, #132634 45%, #1d3c52 100%)'
    : 'linear-gradient(145deg, #2a0d18 0%, #4b1730 45%, #6e2345 100%)'
  }}
  >
    {/* soft glow */}
    <div
      style={{
        position: 'absolute',
        width: '60%',
        height: '60%',
        borderRadius: '999px',
        background: 'rgba(226,195,107,0.12)',
        filter: 'blur(90px)',
        top: '-10%',
        right: '-10%'
      }}
    />

    {/* texture overlay */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
        backgroundSize: '18px 18px'
      }}
    />

    {/* ceremonial lines */}
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: 28,
        right: 28,
        height: 1,
        background:
          'linear-gradient(to right, transparent, rgba(226,195,107,0.5), transparent)'
      }}
    />

    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: 28,
        right: 28,
        height: 1,
        background:
          'linear-gradient(to right, transparent, rgba(226,195,107,0.3), transparent)'
      }}
    />

    {/* centered ceremonial identity */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'rgba(226,195,107,0.72)',
          marginBottom: '14px',
          fontWeight: 700
        }}
      >
        Legacy Capsule
      </div>

      <div
        style={{
          fontSize: 'clamp(32px, 7vw, 64px)',
          fontWeight: 800,
          lineHeight: 1,
          color: '#f4d47a',
          textShadow: '0 6px 24px rgba(0,0,0,0.45)',
          marginBottom: '12px'
        }}
      >
        {honourName}
      </div>

      {capsule?.event_tag && (
        <div
          style={{
            fontSize: '14px',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.74)',
            maxWidth: '80%'
          }}
        >
        {capsule?.event_tag}
        </div>
      )}

      <div
        style={{
          marginTop: '26px',
          fontSize: '10px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.34)'
        }}
      >
        A space for memories, honour and presence
      </div>
    </div>
  </div>
)}

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
              {capsule.event_date && (() => {



                const d = new Date(capsule.event_date!)
                const day = String(d.getDate()).padStart(2, '0')
                const month = d.toLocaleString('en-GB', { month: 'short' })
                const year = d.getFullYear()
                const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000)
                const isPast = daysLeft < 0
                const isToday = daysLeft === 0
                const countdownText = isToday ? 'Today ✦' : isPast ? 'Event concluded' : `${daysLeft}d to go`
                return (
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '3px 10px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '0.06em' }}>{day}.{month}.{year}</span>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: isPast ? 'rgba(255,255,255,0.3)' : t.accentPrimary, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: '10px', color: isPast ? 'rgba(255,255,255,0.45)' : t.accentPrimary, fontWeight: isPast ? 400 : 700, letterSpacing: '0.08em' }}>{countdownText}</span>
                  </div>
                )
              })()}
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

          {/* ── GLOBAL EXPRESSIONS STRIP — fixed below hero ── */}
          <div style={{ flexShrink: 0, padding: '6px 16px 2px', borderBottom: '1px solid rgba(226,195,107,0.08)' }}>
            <GlobalExpressionsStrip expressionCategory={lang.expressionCategory} />
          </div>

          {/* ── COLLAPSIBLE COMPOSER ── */}
          <div style={{ flexShrink: 0, margin: '10px 12px 0' }}>
{!composerOpen ? (
/* Collapsed — three-part action row */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                 {/* Primary Task Anchor */}
  <button
    onClick={() => setComposerOpen(true)}
    style={{
      width: '100%',
      padding: '11px 14px',
      borderRadius: '8px',
      backgroundColor: t.accentPrimary,
      color: '#1a0826',
      fontWeight: 'bold',
      fontSize: '14px',
      letterSpacing: '0.03em',
      cursor: 'pointer',
      border: 'none',
    }}
  >
    ✦ {lang.cta}
  </button>
  
  {/* Secondary Amplification Row */}
  <div style={{ display: 'flex', gap: '10px' }}>
    <button
      onClick={handleCopy}
      style={{
        flex: 1,
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: t.textMuted,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copied' : '🔗 Copy Link'}
    </button>
    <button 
      onClick={() => {
        const text = encodeURIComponent(`Join us in honouring ${honourName}. View the Capsule here: ${capsuleUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      }}
      style={{
        flex: 1,
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: t.textMuted,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      💬 Share
    </button>
  </div>
</div>

) : (
              /* Expanded — full form */
              <div className="composer-enter" style={{ borderRadius: '18px', padding: '18px 16px', background: t.cardBg, border: `1px solid ${t.accentFaint}`, overflow: 'visible' }}>
                {/* Close composer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: t.accentMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{lang.cta}</span>
                  <button onClick={() => setComposerOpen(false)} style={{ color: t.textFaint, background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>↑</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Name + Email + Photo */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}><input style={inp} placeholder="Your name *" value={fName} onChange={e => setFName(e.target.value)} maxLength={50} />{errors.name && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.name}</p>}</div>
                    <div style={{ flex: 1 }}><input type="email" style={inp} placeholder="Add Email" value={fEmail} onChange={e => setFEmail(e.target.value)} maxLength={100} />{errors.email && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.email}</p>}</div>
                    <div onClick={() => photoRef.current?.click()} style={{ width: '42px', height: '42px', borderRadius: '50%', border: `1px dashed ${t.accentFaint}`, background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}>
                      {fPhotoPreview ? <img src={fPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: t.accentMuted, fontSize: '18px', lineHeight: 1 }}>+</span>}
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </div>

                  {/* City + Country — same row */}
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
                  </div>

                  {/* How you are connected — own row */}
                  <RelationshipSelect
                    selected={fRel}
                    onChange={setFRel}
                    error={(errors as any).rel}
                    t={t}
                    eventType={capsule.event_type}
                    honoureeName={capsule.honouree_name}
                  />

<p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.65, margin: '0 0 6px', fontStyle: 'italic' }}>
 Keep {lang.plural} limited to 2000 characters.
  {' '}<span style={{ color: t.accentMuted }}>You can share longer stories in the Community Memories &amp; Stories room.</span>
</p>

                  {/* Tribute + Submit */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea style={{ ...inp, minHeight: '60px', maxHeight: '90px', resize: 'none', lineHeight: 1.7 }} placeholder={`${lang.cta}…`} value={fMsg} onChange={e => setFMsg(e.target.value)} maxLength={MAX_CHARS} rows={3} />
                      <span style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '9px', color: fMsg.length > 1750 ? t.accentPrimary : t.textFaint, pointerEvents: 'none' }}>{fMsg.length}/{MAX_CHARS}</span>
                      {errors.msg && <p style={{ fontSize: '9px', color: 'rgba(248,113,113,0.8)', marginTop: '2px', paddingLeft: '4px' }}>{errors.msg}</p>}
                    </div>
<button 
  onClick={handleSubmit} 
  disabled={submitting} 
  style={{ 
    flexShrink: 0,
    padding: '11px 14px', 
    borderRadius: '14px', 
    fontWeight: 700, 
    fontSize: '14px', 
    background: `linear-gradient(180deg, ${t.accentPrimary}, ${t.accentMuted})`, 
    color: '#1a0826', 
    border: 'none', 
    cursor: submitting ? 'not-allowed' : 'pointer', 
    opacity: submitting ? 0.5 : 1, 
    boxShadow: `0 6px 20px rgba(0,0,0,0.3)`, 
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
    marginTop: '2px',
  }}
>
  {submitting ? '…' : 'Submit'}
</button>
                  </div>

                  {/* Audio/Video premium toggles */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {capsule.components?.includes('audio_tributes') ? (
                      <button type="button" onClick={() => { setShowVideoUploader(false); setShowAudioRecorder(v => !v) }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${showAudioRecorder ? t.accentFaint : t.cardBorder}`, background: showAudioRecorder ? t.accentFaint : t.inputBg, color: showAudioRecorder ? t.accentPrimary : t.textMuted, cursor: 'pointer' }}>🎙️ Audio</button>
                    ) : (
                      <button type="button" onClick={() => setPremiumNotice('audio')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, background: t.inputBg, color: t.textFaint, cursor: 'pointer' }}>🎙️ Audio <span style={{ fontSize: '9px', color: t.accentMuted }}>✦</span></button>
                    )}
                    {capsule.components?.includes('video_tributes') ? (
                      <button type="button" onClick={() => { setShowAudioRecorder(false); setShowVideoUploader(v => !v) }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${showVideoUploader ? t.accentFaint : t.cardBorder}`, background: showVideoUploader ? t.accentFaint : t.inputBg, color: showVideoUploader ? t.accentPrimary : t.textMuted, cursor: 'pointer' }}>🎬 Video</button>
                    ) : (
                      <button type="button" onClick={() => setPremiumNotice('video')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, background: t.inputBg, color: t.textFaint, cursor: 'pointer' }}>🎬 Video <span style={{ fontSize: '9px', color: t.accentMuted }}>✦</span></button>
                    )}
                  </div>

{/* LC-PARTICIPATION-001: Legacy Builder consent checkbox */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={fConsent}
                      onChange={e => setFConsent(e.target.checked)}
                      style={{ marginTop: '2px', accentColor: t.accentPrimary, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.5 }}>
                      {`If my ${lang.singular.toLowerCase()} helps bring others to this collection, I'd like to be recognised as a Legacy Builder.`}
                    </span>
                  </label>


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

                  {submitSuccess && <div style={{ borderRadius: '12px', padding: '12px 16px', fontSize: '12px', textAlign: 'center', letterSpacing: '0.04em', border: `1px solid ${t.accentFaint}`, background: t.cardBg, color: t.accentPrimary }}>✦ Your {lang.singular.toLowerCase()} has been received — thank you.</div>}
                  {submitErr && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.85)', textAlign: 'center' }}>{submitErr}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Success toast when composer is closed */}
          {submitSuccess && !composerOpen && (
            <div style={{ margin: '10px 12px 0', borderRadius: '12px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', textAlign: 'center', borderBottom: `1px solid ${t.accentFaint}` }}>
                <p style={{ fontSize: '13px', color: t.accentPrimary, margin: '0 0 6px' }}>✦ Your {lang.singular.toLowerCase()} is now part of this record.</p>
                <p style={{ fontSize: '11px', color: t.textFaint, margin: 0, lineHeight: 1.7 }}>
                  {fEmail
                    ? `You are part of ${honourName}'s story. The keepsake publication will be sent to you when it is ready.`
                    : `Leave your email below to receive the keepsake publication — a permanent record of everything gathered for this occasion.`}
                </p>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: t.textFaint, lineHeight: 1.6 }}>
                  Have a longer memory or story about {honourName}?
                </p>
                <a href={`/for/${capsule.slug}/stories`} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: t.accentPrimary, textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${t.accentFaint}`, background: 'rgba(226,195,107,0.06)', whiteSpace: 'nowrap' }}>
                  Share a Story →
                </a>
              </div>
            </div>
          )}

{/* ── Stories discovery teaser ── */}
          <div style={{ margin: '8px 12px 0', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: t.accentMuted }}>📖 From the Stories Room</p>
              <p style={{ margin: 0, fontSize: '11px', color: t.textFaint, lineHeight: 1.5 }}>
                Every memory, lesson and chapter about {honourName} lives here.
              </p>
            </div>
            <a href={`/for/${capsule.slug}/stories`} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: t.accentPrimary, textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${t.accentFaint}`, background: 'rgba(226,195,107,0.06)', whiteSpace: 'nowrap' }}>
              Read →
            </a>
          </div>

          {/* ── TRIBUTE WALL HEADER ── */}
          <div style={{ flexShrink: 0, padding: '18px 16px 10px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 700, color: t.textHeading, letterSpacing: '0.04em', textShadow: `0 0 20px ${t.accentFaint}` }}>
              {approvedCount > 0 ? `${approvedCount} ${formatParticipationCount(approvedCount, lang)} shared for ${honourName}` : `Be the first to ${lang.cta.toLowerCase()} for ${honourName}`}
            </p>
            <div style={{ height: '1px', marginTop: '12px', background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)` }} />
          </div>

          {/* ── TRIBUTE CARDS ── */}
          <div style={{ margin: '0 12px 16px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0, minHeight: '100px', maxHeight: '420px', height: 'auto', border: `1px solid ${t.cardBorder}`, background: 'rgba(0,0,0,0.12)' }}>
            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'thin', scrollbarColor: `${t.accentFaint} transparent` }}>
              {visible.length === 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}><p style={{ color: t.textFaint, fontSize: '13px', lineHeight: 1.7, fontStyle: 'italic', maxWidth: '280px' }}>{(() => {
                const type = capsule.event_type?.toLowerCase() ?? ''
                return `${lang.plural} for ${honourName} will appear here. ${lang.cta} to be first.`
              })()}</p></div>}
              {visible.map((c, idx) => <TributeCard key={c.id} c={c} capsuleId={capsule.id} isAdmin={isAdmin} isOwn={visitorEmail !== '' && c.email?.toLowerCase() === visitorEmail.toLowerCase()} onApprove={handleApprove} onDelete={handleDelete} onEdit={handleEdit} t={t} serialNumber={visible.length - idx} />)}
          {/* ── Publication subscribe panel — Moment 1 email collection ── */}
          {visible.length > 0 && (
            <PublicationSubscribePanel
              capsuleId={capsule.id}
              honoureeName={capsule.honouree_name}
            />
          )}
              <div ref={bottomRef} />
            </div>
          </div>

         

          {/* ── EVENT PHASES STRIP — pre-announcement ── */}
          {phases.length > 0 && (
            <div style={{ margin: '0 12px 16px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(226,195,107,0.05)', border: `1px solid ${t.accentFaint}` }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: t.accentMuted, marginBottom: '10px' }}>
                Event Phases
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {phases.map(phase => (
                  <div key={phase.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: t.textHeading, margin: '0 0 1px' }}>{phase.name}</p>
                      {phase.event_date && (
                        <p style={{ fontSize: '10px', color: t.textFaint, margin: 0 }}>
                          {new Date(phase.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
                        </p>
                      )}
                    </div>
                    {phase.photo_count > 0 ? (
                      <span style={{ fontSize: '10px', color: t.accentMuted, fontWeight: 700, flexShrink: 0 }}>
                        📸 {phase.photo_count}
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: t.textFaint, flexShrink: 0 }}>Photos on day</span>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '10px', color: t.textFaint, marginTop: '10px', lineHeight: 1.65 }}>
                On event day, guests can upload their own photos and capture the moment. Watch this space.
              </p>
            </div>
          )}

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
                {uniqueCountries.length > 0 ? 'Every pin represents someone who paused to honour this story' : `Pins appear as ${lang.plural.toLowerCase()} are approved`}
              </span>
            </div>
          </div>

          {/* ── PROFILE SUMMARY ── */}
          {/* No photo/name repeat. No placeholder notices. Only active sections. */}
            <div style={{ padding: '0 16px 8px' }}>
              {profileSections.map(section => <ProfileSummarySection key={section.id} section={section} t={t} slug={capsule.slug} />)}
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <Link href={`/for/${capsule.slug}/profile`} style={{ fontSize: '12px', color: t.accentMuted, textDecoration: 'none', letterSpacing: '0.06em' }}>
                    
                </Link>
              </div>
            </div>
          
          {/* ── Premiums awareness strip ── */}
          <div style={{ margin: '8px 16px 16px' }}>
            <ActivePremiumsStrip slug={capsule.slug} components={capsule.components ?? []} />
          </div>

{/* ── Page Navigation ── */}
<div
  style={{
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '8px 16px 20px',
  }}
>
  {/* ── SHARE STRIP ── */}
  <div style={{
    background: 'rgba(226,195,107,0.05)',
    border: `1px solid rgba(226,195,107,0.15)`,
    borderRadius: '14px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  }}>
    <p style={{ margin: 0, fontSize: '11px', color: t.accentMuted, fontWeight: 700, letterSpacing: '0.08em' }}>
      {myRefCode ? 'Your personal share link' : `Share this ${lang.wallTitle.toLowerCase()}`}
    </p>
    <p style={{ margin: 0, fontSize: '10px', color: t.textFaint, lineHeight: 1.5 }}>
      {myRefCode
        ? 'When others visit via your link, you\'ll be recognised as a Legacy Builder.'
        : 'Help grow this community — share with family and friends.'}
    </p>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handleCopy}
        style={{
          flex: 1, padding: '9px 12px', borderRadius: '10px',
          border: `1px solid rgba(226,195,107,0.25)`,
          background: 'rgba(226,195,107,0.08)',
          color: t.accentPrimary, fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {copied ? '✓ Copied' : '🔗 Copy Link'}
      </button>
      <button
        onClick={() => {
          const shareUrl = myRefCode ? capsuleUrl + '?ref=' + myRefCode : capsuleUrl
          const text = encodeURIComponent(`${capsule.honouree_name}'s story is being preserved — your voice belongs in this record: ${shareUrl}`)
          window.open(`https://wa.me/?text=${text}`, '_blank')
        }}
        style={{
          flex: 1, padding: '9px 12px', borderRadius: '10px',
          border: `1px solid rgba(255,255,255,0.08)`,
          background: 'rgba(255,255,255,0.03)',
          color: t.textFaint, fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        💬 WhatsApp
      </button>
    </div>
  </div>
   </div>
{/* Nav links removed — bottom nav provides Highlights, Profile and all navigation */}
           

  {/* ── FOOTER ── */}
          <div style={{ padding: '28px 16px 24px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', color: t.textFaint, marginLeft: '0.18em' }}>CAPSULE</span>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', marginTop: '6px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Events end. Legacies don't.</p>
            <p style={{ marginTop: '10px' }}>
              <button
                onClick={() => { setRepAccessOpen(true); setRepAccessDone(false); setRepAccessEmail(''); setRepAccessError('') }}
                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.22)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}
              >
                Family Representative? Access your portal →
              </button>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
