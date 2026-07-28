'use client'

// ============================================================
// FILE PATH: app/manage/[slug]/page.tsx
// PURPOSE:   Organiser control dashboard. Section editor, style picker, services, orders, settings.
// ARCHITECTURE: LC02 LC04
// BUILT BY:  AI10
// UPDATED:   AI13 - Claude Sonnet 4.6
// VERSION:   v2.1.1
// DATE:      22 July 2026
// ============================================================
// SECTIONS:
//   See sub-section headers (// === SECTION N) within file
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getAllThemes, resolveTheme } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'
  import GalleryEditor from '@/components/GalleryEditor'
import HonoureeRevealPanel from '@/components/HonoureeRevealPanel'
import OrderHistoryPanel   from '@/components/manage/OrderHistoryPanel'
import ServicesTab from '@/components/manage/ServicesTab'
import HeroPositionPicker from '@/components/HeroPositionPicker'

interface Capsule {
  id: string; slug: string; honouree_name: string; honouree_title: string | null
  event_type: string; event_tag: string | null; event_date: string | null
  page_state: string; tier: string | null; theme: string | null
  hero_image_url: string | null; organiser_email: string
  free_tier_expires_at: string | null; activated_at: string | null
  approved_contrib_count: number; components: string[]
  hero_image_position: string | null; hero_image_zoom: number | null
  hero_image_fit: string | null; hero_panel_size: string | null
  hero_full_bleed: boolean | null
}
interface Contribution {
  id: string; contributor_name: string; city: string; country: string
  relationship: string | null; tribute_text: string; email: string | null
  status: string; created_at: string; thumbnail_url: string | null
}
interface ProfileSection {
  id: string; section_type: string; custom_title: string | null
  content: string | null; sort_order: number; is_active: boolean
}
type Tab = 'overview' | 'setstories' | 'setprofile' | 'settings' | 'services'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FREE_TRIBUTE_LIMIT = 50
const LS_EMAIL = 'lc_visitor_email'

// -- NO character limits on any section type --------------
const SUMMARY_SECTION_TYPES = [
  { type: 'intro',   label: 'Introduction',    placeholder: 'A brief introduction to the honouree and this occasion…' },
  { type: 'occasion', label: 'About the Occasion', placeholder: 'Details about this event or milestone…' },
  { type: 'quote',   label: 'Featured Quote',  placeholder: 'A meaningful quote from or about the honouree…' },
  { type: 'message', label: 'Organiser Message', placeholder: 'A personal message from the organiser…' },
]

const PROFILE_SECTION_TYPES = [
  { type: 'biography',    label: 'Biography',     placeholder: 'The full story of the honouree...' },
  { type: 'timeline',     label: 'Timeline',      placeholder: 'Key milestones and dates...' },
  { type: 'achievements', label: 'Achievements',  placeholder: 'Notable accomplishments and recognition...' },
  { type: 'family',       label: 'Family',        placeholder: 'Family members and relationships...' },
  { type: 'legacy',       label: 'Legacy',        placeholder: 'The lasting impact and legacy...' },
  { type: 'custom',       label: 'Custom Section', placeholder: 'Write your own section...' },
  { type: 'appreciation', label: 'Family Appreciation', placeholder: 'A heartfelt thank you from the family to all who contributed...' },
]

const DEFAULT_APPRECIATION_TEXT = `From the heart of our family, we want to say thank you.

To every person who took a moment to add their voice to this tribute wall -- whether you shared a memory, sent a message, uploaded a photo, or simply visited to honour [honouree_name] -- your presence here has meant more than words can express.

This capsule was built by all of you. Every tribute, every story, every expression of love and support has been received with deep gratitude. You have helped us preserve something that will outlast this moment.

With love and appreciation,
The Family of [honouree_name]`

const bg = '#0f0a1e'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', transition: 'all 0.2s',
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}

const galleryTheme = {
  accentPrimary: gold, accentFaint: goldFaint, accentMuted: goldMuted,
  cardBg: 'rgba(255,255,255,0.04)', cardBorder: 'rgba(226,195,107,0.12)',
  textPrimary, textBody: textSecondary, textFaint,
  inputBg: 'rgba(255,255,255,0.06)', inputBorder: 'rgba(226,195,107,0.18)',
}

const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#0a0218' }} />,
})

/* -- FREE TIER BAR --------------------------------------- */
function FreeTierBar({ approvedCount, daysLeft, hasFirstTribute, onUpgrade }: {
  approvedCount: number; daysLeft: number | null; hasFirstTribute: boolean; onUpgrade: () => void
}) {
  const pct = Math.min(100, (approvedCount / FREE_TRIBUTE_LIMIT) * 100)
  const urgent = (daysLeft !== null && hasFirstTribute && daysLeft < 14) || pct > 80
  return (
    <div style={{ background: urgent ? 'rgba(226,195,107,0.07)' : 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${urgent ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.05)'}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: goldMuted, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Tributes</span>
          <span style={{ fontSize: '10px', color: urgent ? gold : textFaint }}>{approvedCount} / {FREE_TRIBUTE_LIMIT}</span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? `linear-gradient(to right, ${gold}, #F0D878)` : 'linear-gradient(to right, rgba(226,195,107,0.5), rgba(226,195,107,0.8))', borderRadius: '2px', transition: 'width 0.6s ease' }} />
        </div>
      </div>
      {!hasFirstTribute ? (
        <span style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic', maxWidth: '160px', lineHeight: 1.4 }}>
          Expiry countdown starts after first tribute is posted
        </span>
      ) : daysLeft !== null ? (
        <span style={{ fontSize: '11px', color: daysLeft < 14 ? gold : textSecondary, fontWeight: daysLeft < 14 ? 600 : 400 }}>
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} before capsule expiry
        </span>
      ) : null}
      <button onClick={onUpgrade} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px', border: `1px solid rgba(226,195,107,0.35)`, background: 'rgba(226,195,107,0.08)', color: gold, cursor: 'pointer', letterSpacing: '0.04em' }}>Expand Capsule</button>
    </div>
  )
}

/* -- STAT PILL --------------------------------------------- */
function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: '70px', padding: '12px 10px', borderRadius: '12px', background: accent ? 'rgba(226,195,107,0.07)' : cardBg, border: `1px solid ${accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: accent ? gold : textPrimary, lineHeight: 1.1, fontFamily: "'Playfair Display', serif" }}>{value}</div>
      <div style={{ fontSize: '9px', color: textFaint, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  )
}

/* -- SECTION CARD -------------------------------------------- */
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: textPrimary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: '11px', color: textFaint, marginTop: '2px' }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

/* -- TRIBUTE REVIEW CARD -------------------------------- */
function TributeReviewCard({ c, onApprove, onDecline }: { c: Contribution; onApprove: (id: string) => void; onDecline: (id: string) => void }) {
  const [declining, setDeclining] = useState(false)
  const [approving, setApproving] = useState(false)
  const displayName = c.relationship ? `${c.contributor_name} (${c.relationship})` : c.contributor_name
  return (
    <div style={{ borderRadius: '12px', border: '1px solid rgba(226,195,107,0.15)', background: 'rgba(226,195,107,0.03)', padding: '14px 16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: gold }}>{displayName}</span>
        <span style={{ fontSize: '10px', color: textFaint }}>{[c.city, c.country].filter(Boolean).join(' · ')}</span>
        <span style={{ fontSize: '10px', color: textFaint, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
      </div>
      <p style={{ fontSize: '13px', color: textPrimary, lineHeight: 1.7, marginBottom: '12px', fontStyle: 'italic' }}>"{c.tribute_text}"</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button disabled={approving} onClick={async () => { setApproving(true); await onApprove(c.id) }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.28)', background: 'rgba(74,222,128,0.07)', color: approving ? textFaint : 'rgba(134,239,172,0.9)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{approving ? 'Publishing…' : '✓ Publish'}</button>
        <button onClick={() => setDeclining(true)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.05)', color: 'rgba(248,113,113,0.7)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Decline</button>
      </div>
      {declining && (
        <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <p style={{ fontSize: '12px', color: textSecondary, marginBottom: '8px' }}>Decline this tribute? The contributor will not be notified.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { onDecline(c.id); setDeclining(false) }} style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: 'rgba(248,113,113,0.9)', cursor: 'pointer' }}>Confirm</button>
            <button onClick={() => setDeclining(false)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -- EDIT FIELD ----------------------------------------- */
function EditField({ label, value, placeholder, onSave, type = 'text', hint }: {
  label: string; value: string; placeholder?: string
  onSave: (val: string) => Promise<void>; type?: 'text' | 'date' | 'email'; hint?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false) }
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
        {!editing && <button onClick={() => { setDraft(value); setEditing(true) }} style={{ fontSize: '11px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Edit</button>}
      </div>
      {editing ? (
        <div>
          <input type={type} value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} style={inp} autoFocus />
          {hint && <p style={{ fontSize: '10px', color: textFaint, marginTop: '4px' }}>{hint}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`, fontSize: '13px', color: value ? textPrimary : textFaint, minHeight: '40px', display: 'flex', alignItems: 'center' }}>
          {value || <span style={{ fontStyle: 'italic' }}>{placeholder || 'Not set'}</span>}
        </div>
      )}
    </div>
  )
}

/* -- SECTION EDITOR -- NO character limits --------------- */
function SectionEditor({ capsuleId, sections, onRefresh }: { capsuleId: string; sections: ProfileSection[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [drafts, setDrafts] = useState<
  Record<string, { title: string; content: string }>
>({})
  const [saving, setSaving] = useState(false)
 
  const allTypes = [...SUMMARY_SECTION_TYPES, ...PROFILE_SECTION_TYPES]
  const selectedTypeDef = allTypes.find(t => t.type === newType)
useEffect(() => {
  const initialDrafts: Record<
    string,
    { title: string; content: string }
  > = {}

  sections.forEach(s => {
    initialDrafts[s.id] = {
      title:
        s.custom_title ??
        allTypes.find(t => t.type === s.section_type)?.label ??
        s.section_type.replace(/_/g, ' '),

      content: s.content ?? '',
    }
  })

  setDrafts(initialDrafts)
}, [sections])

  const handleAdd = async () => {
    if (!newType || !newContent.trim()) return
    setSaving(true)
const nextSortOrder =
  sections.length > 0
    ? Math.max(...sections.map(s => s.sort_order ?? 0)) + 1
    : 0

const { error } = await supabase
  .from('capsule_profile_sections')
  .insert({
    capsule_id: capsuleId,
    section_type: newType,
    custom_title:
      newType === 'custom'
        ? (newTitle.trim() || 'Custom Section')
        : null,
    content: newContent.trim(),
    sort_order: nextSortOrder,
    is_active: true,
  })

if (error) {
  console.error('SECTION INSERT ERROR:', error)
  alert(error.message)
}
    setNewType(''); setNewTitle(''); setNewContent(''); setAdding(false); setSaving(false)
    onRefresh()
  }

  const handleToggle = async (s: ProfileSection) => {
    await supabase.from('capsule_profile_sections').update({ is_active: !s.is_active }).eq('id', s.id)
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this section?')) return
    await supabase.from('capsule_profile_sections').delete().eq('id', id)
    onRefresh()
  }

  const handleMoveUp = async (s: ProfileSection, idx: number) => {
    if (idx === 0) return
    const prev = sections[idx - 1]
    await Promise.all([
      supabase.from('capsule_profile_sections').update({ sort_order: prev.sort_order }).eq('id', s.id),
      supabase.from('capsule_profile_sections').update({ sort_order: s.sort_order }).eq('id', prev.id),
    ])
    onRefresh()
  }

  const handleMoveDown = async (s: ProfileSection, idx: number) => {
    if (idx === sections.length - 1) return
    const next = sections[idx + 1]
    await Promise.all([
      supabase.from('capsule_profile_sections').update({ sort_order: next.sort_order }).eq('id', s.id),
      supabase.from('capsule_profile_sections').update({ sort_order: s.sort_order }).eq('id', next.id),
    ])
    onRefresh()
  }

const handleSaveEdit = async (
  id: string,
  title: string,
  content: string
) => {
  await supabase
    .from('capsule_profile_sections')
    .update({
      content,
      custom_title: title || null,
    })
    .eq('id', id)

  onRefresh()
}

  const getLabel = (s: ProfileSection) => {
    if (s.custom_title) return s.custom_title
    return allTypes.find(t => t.type === s.section_type)?.label ?? s.section_type.replace(/_/g, ' ')
  }

  return (
    <div>
      {sections.length === 0 && !adding && (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '16px 0' }}>No sections yet. Add your first section below.</p>
      )}
      {sections.map((s, idx) => (
        <div key={s.id} style={{ borderRadius: '10px', border: `1px solid ${s.is_active ? cardBorder : 'rgba(255,255,255,0.04)'}`, background: s.is_active ? cardBg : 'transparent', padding: '12px 14px', marginBottom: '8px', opacity: s.is_active ? 1 : 0.5 }}>
<div style={{ flex: 1, minWidth: 0 }}>
  <input
    value={drafts[s.id]?.title ?? ''}
    onChange={e =>
      setDrafts(prev => ({
        ...prev,
        [s.id]: {
          ...prev[s.id],
          title: e.target.value,
        },
      }))
    }
    placeholder="Section title"
    style={{
      ...inp,
      marginBottom: '10px',
      fontSize: '12px',
      fontWeight: 700,
      color: gold,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}
  />

  <textarea
    value={drafts[s.id]?.content ?? ''}
    onChange={e =>
      setDrafts(prev => ({
        ...prev,
        [s.id]: {
          ...prev[s.id],
          content: e.target.value,
        },
      }))
    }
    rows={5}
    placeholder="Write here..."
    style={{
      ...inp,
      resize: 'vertical',
      lineHeight: 1.7,
      marginBottom: '12px',
      fontSize: '12px',
      color: textSecondary,
    }}
  />

  <div
    style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}
  >
    <button
      onClick={() =>
        handleSaveEdit(
          s.id,
          drafts[s.id]?.title ?? '',
          drafts[s.id]?.content ?? ''
        )
      }
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: 'none',
        background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
        color: '#1a0845',
        fontWeight: 700,
        fontSize: '11px',
        cursor: 'pointer',
      }}
    >
      Save
    </button>
  </div>
</div>
        </div>
      ))}
      {adding ? (
        <div style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, padding: '14px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>New Section</p>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Section Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allTypes.map(t => (
                <button key={t.type} onClick={() => setNewType(t.type)} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '20px', border: `1px solid ${newType === t.type ? 'rgba(226,195,107,0.5)' : cardBorder}`, background: newType === t.type ? 'rgba(226,195,107,0.1)' : 'transparent', color: newType === t.type ? gold : textFaint, cursor: 'pointer' }}>{t.label}</button>
              ))}
            </div>
          </div>
          {newType === 'custom' && <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Section title" style={{ ...inp, marginBottom: '8px' }} maxLength={60} />}
          {newType && (
            <>
              {/* NO maxLength, NO char counter -- unlimited */}
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder={selectedTypeDef?.placeholder ?? 'Write your content…'}
                rows={6}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAdd} disabled={saving || !newContent.trim()} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer', opacity: saving || !newContent.trim() ? 0.6 : 1 }}>{saving ? 'Adding…' : 'Add Section'}</button>
                <button onClick={() => { setAdding(false); setNewType(''); setNewContent(''); setNewTitle('') }} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', letterSpacing: '0.04em' }}>+ Add Section</button>
      )}
    </div>
  )
}

/* -- STYLE PICKER --------------------------------------- */
function StylePicker({ currentTheme, eventType, onSave }: { currentTheme: string | null; eventType: string; onSave: (theme: ThemeKey | 'classic') => Promise<void> }) {
  const themes = getAllThemes()
  const autoKey = resolveTheme('classic', eventType)
  const [saving, setSaving] = useState(false)
  const handleSelect = async (key: ThemeKey | 'classic') => { setSaving(true); await onSave(key); setSaving(false) }
  const currentLabel = (!currentTheme || currentTheme === 'classic')
    ? `Auto -- ${themes.find(t => t.key === autoKey)?.label ?? 'Classic'}`
    : themes.find(t => t.key === currentTheme)?.label ?? currentTheme

  return (
    <div>
      <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '12px' }}>
        Auto uses the best theme for your event type.
      </p>
      <select
        value={currentTheme ?? 'classic'}
        onChange={e => handleSelect(e.target.value as ThemeKey | 'classic')}
        disabled={saving}
        style={{ ...inp, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(226,195,107,0.6)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px' }}
      >
        <option value="classic">Auto -- {themes.find(t => t.key === autoKey)?.label} (Recommended)</option>
        {themes.map(t => (
          <option key={t.key} value={t.key}>{t.label} -- {t.description}</option>
        ))}
      </select>
      {saving && <p style={{ fontSize: '11px', color: goldMuted, marginTop: '8px' }}>Saving…</p>}
    </div>
  )
}
/* -- UPGRADE CARD --------------------------------------- */
function UpgradeCard({ capsuleName }: { capsuleName: string }) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false); const [sent, setSent] = useState(false)
  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return
    setSending(true)
    try { await fetch('/api/email/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), capsule: capsuleName, subject: 'Capsule expansion enquiry' }) }); setSent(true) } catch { setSent(true) }
    setSending(false)
  }
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid rgba(226,195,107,0.18)`, background: 'linear-gradient(145deg, rgba(226,195,107,0.05), rgba(255,255,255,0.02))', marginBottom: '14px' }}>
      <div style={{ height: '2px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.55), transparent)` }} />
      <div style={{ padding: '20px 18px' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 700, color: gold, marginBottom: '8px' }}>Expand Your Capsule</h3>
        <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, marginBottom: '16px' }}>Photo tributes, audio and video contributions, digital publication, extended validity -- add what your event needs.</p>
        {sent ? (
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'rgba(134,239,172,0.9)', fontWeight: 600, margin: 0 }}>✓ Message received -- we'll be in touch within 24 hours.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inp} />
            <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
            <textarea placeholder="Tell us what you need" value={message} onChange={e => setMessage(e.target.value)} rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
            <button onClick={handleSend} disabled={sending || !name.trim() || !email.trim() || !message.trim()} style={{ padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: sending || !name.trim() || !email.trim() || !message.trim() ? 0.6 : 1 }}>{sending ? 'Sending…' : 'Get in Touch'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* -- BOTTOM NAV ----------------------------------------- */
function BottomNav({ active, onChange, pendingCount }: { active: Tab; onChange: (t: Tab) => void; pendingCount: number }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',    label: 'Overview',   icon: '🏠' },
    { id: 'setstories',  label: 'Stories',    icon: '📖' },
    { id: 'setprofile',  label: 'Profile',    icon: '👤' },
    { id: 'settings',    label: 'Settings',   icon: '⚙️' },
    { id: 'services',    label: 'Services',   icon: '✨' },
  ]
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,10,30,0.98)', backdropFilter: 'blur(20px)', borderTop: `1px solid rgba(226,195,107,0.15)`, display: 'flex', padding: '6px 8px max(8px, env(safe-area-inset-bottom))' }}>
      {tabs.map((tab: { id: Tab; label: string; icon: string }) => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: active === tab.id ? 'rgba(226,195,107,0.1)' : 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px', borderRadius: '10px', position: 'relative', margin: '0 2px', transition: 'background 0.2s' }}>
          <span style={{ fontSize: '18px', color: active === tab.id ? gold : 'rgba(255,255,255,0.45)', transition: 'color 0.15s', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', color: active === tab.id ? gold : 'rgba(255,255,255,0.45)', fontWeight: active === tab.id ? 700 : 500, transition: 'color 0.15s' }}>{tab.label}</span>
          {tab.id === 'overview' && pendingCount > 0 && (
            <span style={{ position: 'absolute', top: '4px', right: '18%', width: '16px', height: '16px', borderRadius: '50%', background: gold, color: '#1a0845', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>
          )}
          {active === tab.id && (
            <div style={{ position: 'absolute', bottom: '0', left: '25%', right: '25%', height: '2px', borderRadius: '1px', background: gold }} />
          )}
        </button>
      ))}
    </div>
  )
}

/* -- WAYS TO HONOUR EDITOR ----------------------------- */
function WaysToHonourEditor({ capsuleId, supabase }: { capsuleId: string; supabase: any }) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [form, setForm] = useState({
    title: '',
    account_name: '',
    bank_name: '',
    account_number: '',
    currency: 'NGN',
    instructions: '',
    relationship: '',
  })

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null)
      .order('sort_order')
    setAccounts(data ?? [])
  }

  useEffect(() => { fetchAccounts() }, [capsuleId])

  const handleAdd = async () => {
    if (!form.account_name.trim() || !form.account_number.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('capsule_support_accounts')
      .insert({
        capsule_id: capsuleId,
        method_label: form.title || null,
        account_holder: form.account_name,
        bank_name: form.bank_name || null,
        account_number: form.account_number,
        reference_guide: form.instructions || null,
        currency: form.currency,
        relationship_to_honouree: form.relationship || null,
        is_active: true,
        sort_order: accounts.length,
      })
    if (error) { console.error('EOH insert error:', error); alert(error.message) }
    await fetchAccounts()
    setForm({ title: '', account_name: '', bank_name: '', account_number: '', currency: 'NGN', instructions: '', relationship: '' })
    setAdding(false)
    setSaving(false)
  }

  const handleEditSave = async (id: string) => {
    await supabase
      .from('capsule_support_accounts')
      .update({
        method_label: editForm.method_label || null,
        account_holder: editForm.account_holder,
        bank_name: editForm.bank_name || null,
        account_number: editForm.account_number,
        reference_guide: editForm.reference_guide || null,
        currency: editForm.currency,
        relationship_to_honouree: editForm.relationship_to_honouree || null,
      })
      .eq('id', id)
    await fetchAccounts()
    setEditingId(null)
  }

  const handleToggle = async (id: string, is_active: boolean) => {
    await supabase
      .from('capsule_support_accounts')
      .update({ is_active: !is_active })
      .eq('id', id)
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, is_active: !is_active } : a))
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this account?')) return
    await supabase.from('capsule_support_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        Add bank account details for guests who wish to send support. Displayed on the tribute wall. LegacyCapsule never handles or processes any funds.
      </p>

      {accounts.map(acc => (
        <div key={acc.id}>
          {editingId === acc.id ? (
            /* -- Inline Edit Mode -- */
            <div style={{ padding: '14px', borderRadius: '12px', border: `1px solid rgba(226,195,107,0.3)`, background: 'rgba(226,195,107,0.05)', marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Edit Account</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input style={inp} placeholder="Label (e.g. Celebrate With Prof. Adesina)" value={editForm.method_label ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, method_label: e.target.value }))} />
                <input style={inp} placeholder="Account holder name *" value={editForm.account_holder ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, account_holder: e.target.value }))} />
                <input style={inp} placeholder="Relationship to honouree (e.g. Spouse, Son)" value={editForm.relationship_to_honouree ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, relationship_to_honouree: e.target.value }))} />
                <input style={inp} placeholder="Bank name" value={editForm.bank_name ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, bank_name: e.target.value }))} />
                <input style={inp} placeholder="Account number *" value={editForm.account_number ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, account_number: e.target.value }))} />
                <input style={inp} placeholder="Currency (e.g. NGN, USD, GBP)" value={editForm.currency ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))} />
                <textarea style={{ ...inp, resize: 'none', lineHeight: 1.6 }} rows={2} placeholder="Optional note for guests" value={editForm.reference_guide ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, reference_guide: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => handleEditSave(acc.id)} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            /* -- Display Mode -- */
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: acc.is_active ? gold : textFaint, marginBottom: '2px' }}>
                  {acc.method_label || acc.bank_name || 'Account'}
                </p>
                <p style={{ fontSize: '11px', color: textFaint }}>{acc.account_holder} · {acc.bank_name}</p>
                {acc.relationship_to_honouree && (
                  <p style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic' }}>{acc.relationship_to_honouree}</p>
                )}
                <p style={{ fontSize: '11px', color: textFaint }}>••••{acc.account_number?.slice(-4)} · {acc.currency}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => { setEditingId(acc.id); setEditForm({ ...acc }) }}
                  style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.06)', color: goldMuted, cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(acc.id, acc.is_active)}
                  style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, cursor: 'pointer' }}
                >
                  {acc.is_active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, padding: '14px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>New Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input style={inp} placeholder="Label (e.g. Celebrate With Prof. Adesina)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input style={inp} placeholder="Account holder name *" value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} />
            <input style={inp} placeholder="Relationship to honouree (e.g. Spouse, Son, Daughter)" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} />
            <input style={inp} placeholder="Bank name" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} />
            <input style={inp} placeholder="Account number *" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
            <input style={inp} placeholder="Currency (e.g. NGN, USD, GBP)" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <textarea style={{ ...inp, resize: 'none', lineHeight: 1.6 }} rows={2} placeholder="Optional note (e.g. Please use your name as reference)" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={handleAdd} disabled={saving || !form.account_name.trim() || !form.account_number.trim()} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Add Account'}
            </button>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', letterSpacing: '0.04em' }}>
          + Add Support Account
        </button>
      )}
    </div>
  )
}


/* =========================================================
   REPLACEMENT FOR: FamilyRepSection component
   inside app/manage/[slug]/page.tsx

   Find the entire "function FamilyRepSection" block
   (from its first line to its closing "}") and replace
   with this.

   Changes v1.2.7 (AI6):
   - Adds issued portal tokens list below send button
   - Each token row: rep email, issued date, last accessed,
     active/expired badge, Resend button
   - Resend calls /api/rep/invite (same route, resend mode)
   - Tokens fetched from honouree_portal_tokens on mount
     and after each send/resend
========================================================= */

/* -- FAMILY REP SECTION -- inline fields, single send --- */
function FamilyRepSection({ capsuleId, slug, initialName, initialEmail, sentAt, onSaved }: {
  capsuleId: string; slug: string; initialName: string; initialEmail: string
  sentAt: string | null; onSaved: () => void
}) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [tokens, setTokens] = useState<any[]>([])
  const [resendingId, setResendingId] = useState<string | null>(null)

  const canSend = email.includes('@')
  const isDirty = name !== initialName || email !== initialEmail

  /* -- Fetch issued tokens -- */
  const fetchTokens = async () => {
    const { data } = await supabase
      .from('honouree_portal_tokens')
      .select('id, honouree_email, created_at, last_accessed_at, expires_at')
      .eq('capsule_id', capsuleId)
      .order('created_at', { ascending: false })
    setTokens(data ?? [])
  }

  useEffect(() => { fetchTokens() }, [capsuleId])

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('capsules')
      .update({ family_rep_name: name || null, family_rep_email: email || null } as any)
      .eq('id', capsuleId)
    setSaving(false); setSaved(true); onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSend = async () => {
    if (!canSend) return
    if (isDirty) await handleSave()
    setSending(true); setError('')
    try {
      const res = await fetch('/api/rep/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId, slug }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send'); setSending(false); return }
      setSent(true); onSaved(); fetchTokens()
    } catch { setError('Something went wrong. Please try again.') }
    setSending(false)
  }

  const handleResend = async (repEmail: string) => {
    setResendingId(repEmail)
    setError('')
    try {
      const res = await fetch('/api/rep/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId, slug, repEmail }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Failed to resend')
      else fetchTokens()
    } catch { setError('Something went wrong.') }
    setResendingId(null)
  }

  const now = new Date()

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        The Family Representative receives a private link to view all tributes, support acknowledgements and Ways to Honour details -- without organiser access.
      </p>

      {/* Always-editable fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Representative Name</label>
          <input style={inp} placeholder="Full name of the family rep" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Representative Email</label>
          <input type="email" style={inp} placeholder="Their email address" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>

      {/* Save if changed */}
      {isDirty && (
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '9px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${cardBorder}`, color: textSecondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Details'}
        </button>
      )}
      {saved && !isDirty && (
        <p style={{ fontSize: '11px', color: 'rgba(134,239,172,0.8)', marginBottom: '8px', textAlign: 'center' }}>✓ Details saved</p>
      )}

      {/* Send portal access */}
      {sent ? (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: '0 0 2px' }}>✓ Portal access link sent</p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>Sent to {email} -- they can click the link to view tributes privately.</p>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {sentAt && (
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '8px', fontStyle: 'italic' }}>
              ✓ Previously sent: {formatDate(sentAt)}
            </p>
          )}
          <button onClick={handleSend} disabled={sending || !canSend} style={{ width: '100%', padding: '11px', borderRadius: '10px', background: canSend ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))` : 'rgba(255,255,255,0.04)', border: canSend ? 'none' : `1px solid ${cardBorder}`, color: canSend ? '#1a0845' : textFaint, fontSize: '13px', fontWeight: 700, cursor: canSend ? 'pointer' : 'not-allowed', opacity: sending ? 0.7 : 1, letterSpacing: '0.04em' }}>
            {sending ? 'Sending…' : sentAt ? 'Resend Portal Access Link' : 'Send Portal Access Link →'}
          </button>
          {!canSend && (
            <p style={{ fontSize: '11px', color: textFaint, marginTop: '6px', textAlign: 'center' }}>
              Enter the representative's email address above first.
            </p>
          )}
          {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '6px' }}>{error}</p>}
        </div>
      )}

      {/* -- Issued Portal Access List -- */}
      {tokens.length > 0 && (
        <div>
          <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.15), transparent)`, marginBottom: '14px' }} />
          <p style={{ fontSize: '10px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
            Issued Access Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tokens.map(token => {
              const isExpired = token.expires_at && new Date(token.expires_at) < now
              const isResending = resendingId === token.honouree_email
              return (
                <div key={token.id} style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${isExpired ? 'rgba(255,255,255,0.05)' : 'rgba(226,195,107,0.08)'}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: isExpired ? textFaint : textPrimary, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {token.honouree_email}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '10px', color: textFaint }}>Issued: {formatDate(token.created_at)}</span>
                      <span style={{ fontSize: '10px', color: textFaint }}>
                        {token.last_accessed_at ? `Last accessed: ${formatDate(token.last_accessed_at)}` : 'Never accessed'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: '6px',
                      background: isExpired ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
                      border: `1px solid ${isExpired ? 'rgba(248,113,113,0.18)' : 'rgba(74,222,128,0.18)'}`,
                      color: isExpired ? 'rgba(248,113,113,0.7)' : 'rgba(134,239,172,0.8)',
                    }}>
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                    <button
                      onClick={() => handleResend(token.honouree_email)}
                      disabled={!!resendingId}
                      style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: `1px solid rgba(226,195,107,0.2)`, background: 'rgba(226,195,107,0.05)', color: goldMuted, cursor: 'pointer', opacity: resendingId ? 0.5 : 1 }}
                    >
                      {isResending ? '…' : 'Resend'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


/* -- NOTIFICATION SETTINGS ------------------------------ */
function NotificationSettings({ capsuleId, currentFrequency, eventDate, onSaved }: {
  capsuleId: string; currentFrequency: string | null
  eventDate: string | null; onSaved: () => void
}) {
  const [enabled, setEnabled] = useState(!!currentFrequency)
  const [frequency, setFrequency] = useState(currentFrequency ?? '1hr')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const endDate = eventDate
    ? new Date(new Date(eventDate).getTime() + 30 * 86400000)
    : null

  const handleSave = async (newEnabled: boolean, newFreq: string) => {
    setSaving(true); setSaved(false)
    await supabase
      .from('capsules')
      .update({ notification_frequency: newEnabled ? newFreq : null } as any)
      .eq('id', capsuleId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  const handleToggle = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    await handleSave(newEnabled, frequency)
  }

  const handleFrequency = async (freq: string) => {
    setFrequency(freq)
    if (enabled) await handleSave(true, freq)
  }

  const FREQUENCIES = [
    { value: '20min', label: 'Every 20 minutes' },
    { value: '1hr',   label: 'Every hour' },
    { value: '6hr',   label: 'Every 6 hours' },
    { value: '24hr',  label: 'Once a day' },
  ]

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        Receive an email when new tributes arrive and are waiting for your approval. One email per window -- never flooded.
      </p>

      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: enabled ? textPrimary : textFaint, fontWeight: enabled ? 600 : 400 }}>
          {enabled ? 'Notifications on' : 'Notifications off'}
        </span>
        <button
          onClick={handleToggle}
          disabled={saving}
          style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: enabled ? gold : 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
        >
          <div style={{ position: 'absolute', top: '3px', left: enabled ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
        </button>
      </div>

      {/* Frequency selector -- only shown when enabled */}
      {enabled && (
        <div>
          <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
            Notification Frequency
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {FREQUENCIES.map(f => (
              <button
                key={f.value}
                onClick={() => handleFrequency(f.value)}
                style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${frequency === f.value ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: frequency === f.value ? 'rgba(226,195,107,0.07)' : 'transparent', color: frequency === f.value ? textPrimary : textSecondary, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                {f.label}
                {frequency === f.value && <span style={{ color: gold, fontSize: '13px' }}>✓</span>}
              </button>
            ))}
          </div>

          {/* End date notice */}
          <p style={{ fontSize: '10px', color: textFaint, marginTop: '10px', lineHeight: 1.6, fontStyle: 'italic' }}>
            {endDate
              ? `Notifications will stop automatically after ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (30 days after your event).`
              : 'Notifications will stop automatically 120 days after capsule creation.'
            }
          </p>
        </div>
      )}

      {saved && <p style={{ fontSize: '11px', color: 'rgba(134,239,172,0.8)', marginTop: '8px' }}>✓ Saved</p>}
      {saving && <p style={{ fontSize: '11px', color: textFaint, marginTop: '8px' }}>Saving…</p>}
    </div>
  )
}

/* -- DELETE ACCOUNT SECTION ----------------------------- */
function DeleteAccountSection({ email, slug, capsuleId }: { email: string; slug: string; capsuleId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return
    setDeleting(true); setError('')
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, confirmation, capsuleId }),
     })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to delete account'); setDeleting(false); return }
      // Clear session and redirect
      localStorage.clear()
      window.location.href = '/?deleted=true'
    } catch {
      setError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Danger zone */}
      <div style={{ marginTop: '8px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.03)' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(248,113,113,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Danger Zone</p>
        <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '12px' }}>
          Permanently delete your account and all capsules. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', color: 'rgba(248,113,113,0.8)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
        >
          Delete My Account
        </button>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(8,2,20,0.92)', backdropFilter: 'blur(8px)' }} onClick={() => { if (!deleting) setShowModal(false) }}>
          <div style={{ width: '100%', maxWidth: '340px', borderRadius: '20px', background: 'linear-gradient(145deg, #1e0d4e, #2a1060)', border: '1px solid rgba(248,113,113,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(248,113,113,0.6), transparent)' }} />
            <div style={{ padding: '24px 20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '28px', marginBottom: '10px' }}>⚠️</p>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Delete Account</h3>
                <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7 }}>
                  This will permanently delete your account <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{email}</strong> and all capsules. All tributes, profile sections and media will be removed. <strong style={{ color: 'rgba(248,113,113,0.8)' }}>This cannot be undone.</strong>
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '10px', color: 'rgba(248,113,113,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
                  Type DELETE to confirm
                </label>
                <input
                  style={{ ...inp, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}
                  placeholder="DELETE"
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  autoFocus
                />
              </div>

              {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting || confirmation !== 'DELETE'}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: confirmation === 'DELETE' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${confirmation === 'DELETE' ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`, color: confirmation === 'DELETE' ? 'rgba(248,113,113,0.9)' : textFaint, fontSize: '13px', fontWeight: 700, cursor: confirmation === 'DELETE' ? 'pointer' : 'not-allowed', opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setConfirmation('') }}
                  disabled={deleting}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* -- ADD-ONS TABLE -------------------------------------- */
const LC_SERVICES = [
  // -- Free -- always on ------------------------------------------------------
  { id: 'tribute_wall',      label: 'Text Tributes',              desc: 'Guests leave written tributes on the public wall, visible to all visitors. Included on every capsule at no cost.', alwaysOn: true, phase: 1 },
  { id: 'world_map',         label: 'World Tribute Map',          desc: 'Interactive map showing where in the world tributes came from. Included on every capsule.', alwaysOn: true, phase: 1 },
  { id: 'event_profile',     label: 'Event Profile Canvas',       desc: 'Full profile page with biography, sections, timeline and photo gallery.', alwaysOn: true, phase: 1 },
  { id: 'photo_tributes',    label: 'Photo Tributes',             desc: 'Contributors can attach a photo to their tribute message. Included on every capsule.', alwaysOn: true, phase: 1 },
  { id: 'family_rep_portal', label: 'Family Rep Portal',          desc: 'Private portal for the Family Representative to view tributes and acknowledgements.', alwaysOn: true, phase: 1 },
  { id: 'community_stories', label: 'Community Memories & Stories', desc: 'A dedicated room for contributors to share memories and stories, organised by topic.', alwaysOn: true, phase: 1 },
  // -- Premium -- activate from Services tab ----------------------------------
  { id: 'ways_to_honour',    label: 'Gift of Honour',             desc: 'A dignified private channel for guests to express financial support for the honouree.', alwaysOn: false, phase: 1 },
  { id: 'audio_tributes',    label: 'Voice Tributes',             desc: 'Contributors record personal audio messages. Hearing a voice adds a dimension text cannot replicate.', alwaysOn: false, phase: 1 },
  { id: 'video_tributes',    label: 'Video Tributes',             desc: 'Contributors upload short video messages shown directly in their tribute card.', alwaysOn: false, phase: 1 },
  { id: 'publication',       label: 'Digital Publication',        desc: 'A beautifully designed keepsake PDF compiled from all capsule content and sent to every contributor.', alwaysOn: false, phase: 1 },
  { id: 'guest_management',  label: 'Guest Management & Seating', desc: 'Guest list, RSVP tracking, table management, seat assignment, and printable access cards.', alwaysOn: false, phase: 1 },
  { id: 'access_codes',      label: 'Access Code System',         desc: 'Unique entry codes per guest, usher interface, real-time check-in dashboard and arrival metrics.', alwaysOn: false, phase: 1 },
  { id: 'attire',            label: 'Fabric & Attire',            desc: 'Coordinate event dress code, fabric choices and attire orders for guests.', alwaysOn: false, phase: 1 },
  { id: 'extended_validity', label: 'Extended Validity',          desc: 'Extend your capsule beyond the standard validity period to keep collecting tributes.', alwaysOn: false, phase: 1 },
]

function AddOnsTable({ capsuleComponents, onServicesTab }: { capsuleComponents: string[]; onServicesTab: () => void }) {
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(74,222,128,0.7)' }} />
          <span style={{ fontSize: '10px', color: textFaint }}>Included free</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(226,195,107,0.4)' }} />
          <span style={{ fontSize: '10px', color: textFaint }}>🔒 Premium add-on</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontSize: '10px', color: textFaint }}>Coming soon</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>
        {LC_SERVICES.map((svc, idx) => {
          const isActivated = svc.alwaysOn || capsuleComponents.includes(svc.id)
          const isAutoActivated = false
          const isFree = svc.alwaysOn
          const isComingSoon = svc.phase > 1
          const isHovered = tooltip === svc.id

          return (
            <div
              key={svc.id}
              onMouseEnter={() => setTooltip(svc.id)}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => setTooltip(isHovered ? null : svc.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px',
                borderBottom: idx < LC_SERVICES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: isHovered ? 'rgba(226,195,107,0.04)' : 'transparent',
                transition: 'background 0.15s',
                opacity: isComingSoon ? 0.45 : 1,
                position: 'relative' as const,
              }}
            >
              {/* Status dot */}
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: isActivated || isAutoActivated ? 'rgba(74,222,128,0.7)' : isFree ? 'rgba(74,222,128,0.7)' : isComingSoon ? 'rgba(255,255,255,0.12)' : 'rgba(226,195,107,0.4)' }} />

              {/* Label */}
              <span style={{ flex: 1, fontSize: '12px', color: isActivated || isFree ? textPrimary : isComingSoon ? textFaint : textSecondary, fontWeight: isActivated || isFree ? 600 : 400 }}>
                {svc.label}
                {false && <span style={{ fontSize: '9px', color: textFaint, marginLeft: '6px', fontStyle: 'italic' }}>auto</span>}
              </span>

              {/* Phase badge for coming soon */}
              {isComingSoon && (
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: textFaint, letterSpacing: '0.08em' }}>
                  Phase {svc.phase}
                </span>
              )}

              {/* Free tick */}
              {(isActivated || isFree) && !isComingSoon && (
                <span style={{ fontSize: '12px', color: 'rgba(74,222,128,0.7)', flexShrink: 0 }}>✓</span>
              )}

              {/* Locked -- show lock icon only, no button */}
              {!svc.alwaysOn && !isActivated && !isAutoActivated && !isComingSoon && (
                <span style={{ fontSize: '11px', color: 'rgba(226,195,107,0.35)', flexShrink: 0 }}>🔒</span>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '14px', right: '14px', zIndex: 20, padding: '8px 12px', borderRadius: '10px', background: '#1a0845', border: `1px solid rgba(226,195,107,0.2)`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                  <p style={{ fontSize: '11px', color: textSecondary, lineHeight: 1.6, margin: 0 }}>{svc.desc}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onServicesTab}
        style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', border: '1px solid rgba(226,195,107,0.2)', background: 'rgba(226,195,107,0.05)', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}
      >
        Manage & Unlock Services →
      </button>
    </div>
  )
}


/* -- EXPORTS TAB -- */
function ExportsTab({ contributions, slug }: {
  contributions: Contribution[]
  slug: string
}) {
  const [copiedAll,  setCopiedAll]  = useState(false)
  const [copiedProg, setCopiedProg] = useState(false)

  const programmeContribs = contributions.filter(
    c => (c as any).include_in_programme_export === true
  )

  function formatTributes(list: Contribution[]): string {
    return list.map(c => {
      const location = [c.city, c.country].filter(Boolean).join(', ')
      const relationship = c.relationship ? ` · ${c.relationship}` : ''
      return [
        '---',
        c.contributor_name + (location ? `\n${location}${relationship}` : relationship ? `\n${relationship}` : ''),
        '',
        c.tribute_text,
      ].join('\n')
    }).join('\n\n') + '\n\n---'
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(formatTributes(contributions))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  const handleCopyProgramme = async () => {
    if (programmeContribs.length === 0) return
    await navigator.clipboard.writeText(formatTributes(programmeContribs))
    setCopiedProg(true)
    setTimeout(() => setCopiedProg(false), 2500)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <div style={{ flex: 1, padding: '14px 12px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
          <p style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0 }}>{contributions.length}</p>
          <p style={{ fontSize: '9px', color: textFaint, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Approved Tributes</p>
        </div>
        <div style={{ flex: 1, padding: '14px 12px', borderRadius: '12px', background: 'rgba(226,195,107,0.05)', border: `1px solid rgba(226,195,107,0.18)`, textAlign: 'center' }}>
          <p style={{ fontSize: '24px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", margin: 0 }}>{programmeContribs.length}</p>
          <p style={{ fontSize: '9px', color: textFaint, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Programme Export</p>
        </div>
      </div>

      <SectionCard title="Copy to Clipboard" subtitle="Paste into Word, Google Docs, Canva, InDesign or any print tool">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleCopyAll}
            disabled={contributions.length === 0}
            style={{ width: '100%', padding: '13px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: copiedAll ? 'rgba(74,222,128,0.08)' : cardBg, color: copiedAll ? 'rgba(134,239,172,0.9)' : textPrimary, fontSize: '13px', fontWeight: 700, cursor: contributions.length === 0 ? 'not-allowed' : 'pointer', opacity: contributions.length === 0 ? 0.4 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {copiedAll ? '✓ Copied Successfully' : `Copy All Approved Tributes (${contributions.length})`}
          </button>

          <button
            onClick={handleCopyProgramme}
            disabled={programmeContribs.length === 0}
            style={{ width: '100%', padding: '13px', borderRadius: '10px', border: `1px solid ${programmeContribs.length > 0 ? 'rgba(226,195,107,0.28)' : cardBorder}`, background: copiedProg ? 'rgba(74,222,128,0.08)' : programmeContribs.length > 0 ? goldFaint : 'transparent', color: copiedProg ? 'rgba(134,239,172,0.9)' : programmeContribs.length > 0 ? gold : textFaint, fontSize: '13px', fontWeight: 700, cursor: programmeContribs.length === 0 ? 'not-allowed' : 'pointer', opacity: programmeContribs.length === 0 ? 0.4 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {copiedProg ? '✓ Copied Successfully' : `Copy Programme Export Tributes (${programmeContribs.length})`}
          </button>

          {programmeContribs.length === 0 && (
            <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center', fontStyle: 'italic' }}>
              Mark tributes for Programme Export in the Tributes tab first.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Export Format" subtitle="Each tribute exports in this structure">
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)`, fontFamily: 'monospace', fontSize: '11px', color: textFaint, lineHeight: 1.8 }}>
          <p style={{ margin: 0, whiteSpace: 'pre' }}>{'---\nContributor Name\nCity, Country · Relationship\n\nTribute text appears here,\nas written by the contributor.\n\n---'}</p>
        </div>
      </SectionCard>

      <SectionCard title="Coming Soon" subtitle="Future export formats">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Export as DOCX', 'Export as PDF', 'Export Selected Contributors', 'Export Stories', 'Export Community Memories'].map(item => (
            <div key={item} style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid rgba(255,255,255,0.04)`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: textFaint }}>{item}</span>
              <span style={{ fontSize: '9px', color: textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Soon</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}


/* -- SETSTORIES MANAGER --------------------------------- */
function SetStoriesManager({ communityTopics, capsule, supabase, fetchAll, gold, goldMuted, textPrimary, textFaint }: {
  communityTopics: any[]; capsule: any; supabase: any; fetchAll: () => void
  gold: string; goldMuted: string; textPrimary: string; textFaint: string
}) {
  const CATEGORY_ORDER = [
    'Personal Memories', 'Childhood & Early Life', 'Work & Achievements',
    'Faith & Values', 'Family', 'Funny Moments', 'Legacy & Impact', 'General',
  ]
  const presentCats = CATEGORY_ORDER.filter(cat =>
    communityTopics.some((t: any) => (t.category ?? 'General') === cat)
  )
  const extraCats = [...new Set(communityTopics.map((t: any) => t.category ?? 'General'))]
    .filter((c: any) => !CATEGORY_ORDER.includes(c))
  const allCats = [...presentCats, ...extraCats as string[]]

  const [openCategory,      setOpenCategory]      = useState<string | null>(null)
  const [addingInCategory,  setAddingInCategory]  = useState(false)
  const [newTopicText,      setNewTopicText]      = useState('')
  const [topicSaving,       setTopicSaving]       = useState(false)
  const cardBorder = 'rgba(226,195,107,0.12)'
  const cardBg     = 'rgba(255,255,255,0.04)'

  if (openCategory) {
    const catTopics = communityTopics.filter((t: any) => (t.category ?? 'General') === openCategory)
    return (
      <div>
        <button onClick={() => { setOpenCategory(null); setAddingInCategory(false); setNewTopicText('') }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 0 16px', letterSpacing: '0.04em' }}>
          ← S/Stories
        </button>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 2px' }}>{openCategory}</p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
            {catTopics.length} {catTopics.length === 1 ? 'prompt' : 'prompts'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '14px' }}>
          {catTopics.map((topic: any) => (
            <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: topic.status === 'active' ? 'rgba(226,195,107,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${topic.status === 'active' ? 'rgba(226,195,107,0.15)' : 'rgba(255,255,255,0.05)'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '12px', color: topic.status === 'active' ? textPrimary : textFaint, lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{topic.topic_name.replace(/\[honouree_name\]/g, capsule.honouree_name)}"
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '9px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  {topic.topic_source === 'system' ? 'Default' : topic.topic_source === 'organiser' ? 'Your prompt' : 'Community'} · {topic.status}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newStatus = topic.status === 'active' ? 'inactive' : 'active'
                  await supabase.from('community_story_topics').update({ status: newStatus }).eq('id', topic.id)
                  fetchAll()
                }}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${topic.status === 'active' ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`, background: 'transparent', color: topic.status === 'active' ? 'rgba(248,113,113,0.7)' : 'rgba(134,239,172,0.7)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                {topic.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
          {catTopics.length === 0 && (
            <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center' as const, padding: '16px 0' }}>No prompts in this category yet.</p>
          )}
        </div>
        {addingInCategory ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            <textarea value={newTopicText} onChange={e => setNewTopicText(e.target.value)}
              placeholder={`Write a prompt for ${openCategory}…`}
              style={{ width: '100%', minHeight: '80px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)', color: textPrimary, fontSize: '13px', boxSizing: 'border-box' as const, resize: 'vertical' as const, fontFamily: "'DM Sans', sans-serif" }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={topicSaving || !newTopicText.trim()}
                onClick={async () => {
                  if (!newTopicText.trim()) return
                  setTopicSaving(true)
                  const maxOrder = communityTopics.length > 0 ? Math.max(...communityTopics.map((t: any) => t.display_order ?? 0)) : 0
                  await supabase.from('community_story_topics').insert({ capsule_id: capsule.id, topic_name: newTopicText.trim(), topic_source: 'organiser', status: 'active', category: openCategory, display_order: maxOrder + 10 })
                  setNewTopicText(''); setAddingInCategory(false); setTopicSaving(false); fetchAll()
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: topicSaving || !newTopicText.trim() ? 0.5 : 1 }}>
                {topicSaving ? 'Saving…' : 'Add Prompt'}
              </button>
              <button onClick={() => { setAddingInCategory(false); setNewTopicText('') }}
                style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: textFaint, fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingInCategory(true)}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px dashed rgba(226,195,107,0.2)', background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            + Add a Prompt to {openCategory}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 16px' }}>
        Manage Community Story Topics
      </p>
      {communityTopics.length === 0 && (
        <div style={{ textAlign: 'center' as const, padding: '24px 16px', borderRadius: '12px', border: '1px dashed rgba(226,195,107,0.15)', marginBottom: '14px' }}>
          <p style={{ fontSize: '12px', color: textFaint, marginBottom: '14px', lineHeight: 1.65 }}>
            No story topics yet. Load a set of suggested prompts tailored to your event type to get started quickly.
          </p>
          <button
            onClick={async () => {
              await fetch('/api/capsule/seed-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capsule_id: capsule.id }) })
              fetchAll()
            }}
            style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Load Suggested Topics for This Event
          </button>
        </div>
      )}
      {allCats.map((cat: string) => {
        const catTopics   = communityTopics.filter((t: any) => (t.category ?? 'General') === cat)
        const activeCount = catTopics.filter((t: any) => t.status === 'active').length
        return (
          <button key={cat} onClick={() => setOpenCategory(cat)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: textPrimary }}>{cat}</p>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: textFaint }}>
                {activeCount} active · {catTopics.length} total
              </p>
            </div>
            <span style={{ fontSize: '14px', color: textFaint, flexShrink: 0 }}>→</span>
          </button>
        )
      })}
    </div>
  )
}

/* -- MAIN COMPONENT ------------------------------------- */
export default function ManagePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([])
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([])
  const [visitorEmail, setVisitorEmail] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [communityTopics, setCommunityTopics] = useState<any[]>([])
  const [addingTopic, setAddingTopic] = useState(false)
  const [newTopicText, setNewTopicText] = useState('')
  const [topicSaving, setTopicSaving] = useState(false)
const [heroUploading, setHeroUploading] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [showHeroPicker, setShowHeroPicker] = useState(false)
  const heroPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function checkSession() {
      const urlParams = new URLSearchParams(window.location.search)
      const authEmail = urlParams.get('auth')
      if (authEmail) {
        const decoded = decodeURIComponent(authEmail)
        localStorage.setItem(LS_EMAIL, decoded)
        setVisitorEmail(decoded)
        window.history.replaceState({}, '', window.location.pathname)
        return
      }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          localStorage.setItem(LS_EMAIL, session.user.email)
          setVisitorEmail(session.user.email)
          return
        }
      } catch {}
      const saved = localStorage.getItem(LS_EMAIL)
      if (saved) setVisitorEmail(saved)
    }
    checkSession()
  }, [])

  const fetchAll = useCallback(async () => {
    if (!slug) return
const capRes = await supabase.from('capsules')
      .select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, theme, hero_image_url, organiser_email, free_tier_expires_at, activated_at, approved_contrib_count, components, hero_image_position, hero_image_zoom, hero_image_fit, hero_panel_size, hero_full_bleed')
      .eq('slug', slug).single()
    if (!capRes.data) { setLoading(false); return }
    const cap = capRes.data as Capsule
    setCapsule(cap); setHeroImage(cap.hero_image_url)

    const [contribRes, sectionsRes, galleryRes, topicsRes] = await Promise.all([
      supabase.from('contributions').select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, email, status, created_at, include_in_publication, include_in_programme_export').eq('capsule_id', cap.id).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('capsule_profile_sections').select('id, section_type, custom_title, content, sort_order, is_active').eq('capsule_id', cap.id).order('sort_order'),
      supabase.from('capsule_gallery').select('id, image_url, description, sort_order, section_index').eq('capsule_id', cap.id).order('section_index').order('sort_order'),
      supabase.from('community_story_topics').select('id, topic_name, topic_source, status, display_order').eq('capsule_id', cap.id).order('display_order', { ascending: true }),
    ])

    if (contribRes.data) setContributions(contribRes.data as Contribution[])
    if (sectionsRes.data) setProfileSections(sectionsRes.data as ProfileSection[])
    if (galleryRes.data) setGalleryPhotos(galleryRes.data)
    if (topicsRes.data) setCommunityTopics(topicsRes.data)
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchAll() }, [fetchAll])

  const isOrganiser = visitorEmail !== '' && visitorEmail.toLowerCase() === capsule?.organiser_email?.toLowerCase()
  const pending = contributions.filter(c => c.status === 'pending_review' || c.status === 'pending')
  const approved = contributions.filter(c => c.status === 'approved')
  const isFree = !capsule?.tier || capsule.tier === 'free'
  const capsuleUrl = typeof window !== 'undefined' ? `${window.location.origin}/for/${slug}` : `https://itslegacycapsule.com/for/${slug}`
  const pins = approved.filter(c => (c as any).lat && (c as any).lng).map(c => ({ lat: (c as any).lat, lng: (c as any).lng, name: c.contributor_name, country: c.country }))

  const firstTributeAt = contributions.length > 0 ? contributions.reduce((e, c) => new Date(c.created_at) < new Date(e.created_at) ? c : e).created_at : null
  const hasFirstTribute = firstTributeAt !== null
  const expiryDate = firstTributeAt ? new Date(new Date(firstTributeAt).getTime() + 90 * 86400000) : null
  const days = expiryDate && hasFirstTribute ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / 86400000)) : null

  const handleApprove = async (id: string) => {
    await supabase.from('contributions').update({ status: 'approved' }).eq('id', id)
    fetch('/api/email/approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionId: id }) }).catch(() => {})
    fetchAll()
  }
  const handleDecline = async (id: string) => { await supabase.from('contributions').delete().eq('id', id); fetchAll() }
 
 const handleToggleFlag = async (id: string, field: string, current: boolean) => {
    await supabase.from('contributions').update({ [field]: !current }).eq('id', id)
    fetchAll()
  }

  const handleCopy = async () => { await navigator.clipboard.writeText(capsuleUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const updateCapsule = async (fields: Partial<Capsule>) => { if (!capsule) return; await supabase.from('capsules').update(fields).eq('id', capsule.id); fetchAll() }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !capsule) return; setHeroUploading(true)
    try {
      const ic = (await import('browser-image-compression')).default
      const compressed = await ic(f, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
      const ext = compressed.name.split('.').pop() ?? 'jpg'
      const path = `hero/${capsule.id}.${ext}`
      const { error: ue } = await supabase.storage.from('tribute-photos').upload(path, compressed, { upsert: true })
      if (!ue) {
        const url = supabase.storage.from('tribute-photos').getPublicUrl(path).data.publicUrl
        await supabase.from('capsules').update({ hero_image_url: url }).eq('id', capsule.id)
        setHeroImage(url)
      }
    } catch (err) { console.error(err) }
    setHeroUploading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${goldFaint}`, borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '11px', color: textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading your capsule</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!capsule) return <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: textFaint, fontSize: '14px' }}>Capsule not found.</p></div>

  if (!visitorEmail) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: '20px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: goldFaint, border: `1px solid rgba(226,195,107,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>◈</div>
      <div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px', fontFamily: "'Playfair Display', serif" }}>Welcome back</p>
        <p style={{ fontSize: '14px', color: textFaint, maxWidth: '280px', lineHeight: 1.65 }}>Sign in to access your capsule dashboard for <strong style={{ color: goldMuted }}>{capsule.honouree_name}</strong>.</p>
      </div>
      <Link href="/signin" style={{ padding: '12px 28px', borderRadius: '12px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em' }}>Sign In →</Link>
      <Link href={`/for/${slug}`} style={{ fontSize: '13px', color: goldMuted, textDecoration: 'none' }}>View the tribute wall instead</Link>
    </div>
  )

  if (!isOrganiser) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: '16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ fontSize: '16px', fontWeight: 600, color: textPrimary }}>Different account needed</p>
      <p style={{ color: textFaint, fontSize: '14px', maxWidth: '300px', lineHeight: 1.65 }}>You are signed in as <strong style={{ color: goldMuted }}>{visitorEmail}</strong> but this capsule belongs to a different organiser.</p>
      <button onClick={() => { localStorage.removeItem(LS_EMAIL); setVisitorEmail('') }} style={{ padding: '10px 22px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Sign In with Different Email</button>
      <Link href={`/for/${slug}`} style={{ fontSize: '13px', color: goldMuted, textDecoration: 'none' }}>View the tribute wall</Link>
    </div>
  )

  const resolvedHero = heroImage ?? null

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } * { box-sizing: border-box; } body { margin: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(226,195,107,0.18); border-radius: 2px; } input:focus, textarea:focus, select:focus { border-color: rgba(226,195,107,0.45) !important; }`}</style>

      <div style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: textPrimary, paddingBottom: '80px' }}>

        {/* -- TOP HEADER -- */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(226,195,107,0.08)`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
            </Link>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capsule.honouree_name}</p>
              <p style={{ fontSize: '10px', color: textFaint, margin: '1px 0 0' }}>{capsule.event_type}{capsule.event_tag ? ` · ${capsule.event_tag}` : ''}</p>
            </div>
            {/* View Live -- clickable link to public wall */}
            <a href={`/for/${slug}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: 'rgba(134,239,172,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>View Live ↗</a>
          </div>
        </div>

        {/* -- FREE TIER BAR -- */}
        {isFree && <FreeTierBar approvedCount={capsule.approved_contrib_count} daysLeft={days} hasFirstTribute={hasFirstTribute} onUpgrade={() => setActiveTab('services')} />}

        {/* -- EXPIRY BANNER -- */}
        {(() => {
          if (!capsule.free_tier_expires_at) return null
          const daysLeft = Math.floor((new Date(capsule.free_tier_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysLeft > 14 || daysLeft < 0) return null
          const lastContrib = contributions.length > 0
            ? [...contributions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
            : null
          const approvedCount = contributions.filter(c => c.status === 'approved').length
          const recentContrib = lastContrib ? (Date.now() - new Date(lastContrib).getTime()) < 7 * 24 * 60 * 60 * 1000 : false
          const eventDate = capsule.event_date ? new Date(capsule.event_date) : null
          const eventDaysAgo = eventDate ? Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24)) : null
          const eventPast = eventDaysAgo !== null && eventDaysAgo > 0
          const daysSinceContrib = lastContrib ? Math.floor((Date.now() - new Date(lastContrib).getTime()) / (1000 * 60 * 60 * 24)) : null

          // Infer completion status from signals
          let status: 'complete' | 'wrapping_up' | 'active' | 'underused' = 'active'
          if (recentContrib) {
            status = approvedCount < 3 ? 'underused' : 'active'
          } else if (eventPast && eventDaysAgo! > 30 && approvedCount > 0) {
            status = 'wrapping_up'
          } else if (daysSinceContrib && daysSinceContrib > 45 && approvedCount > 5) {
            status = 'wrapping_up'
          } else if (approvedCount < 3) {
            status = 'underused'
          }

          const banners = {
            complete:    { tone: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)', heading: `${capsule.honouree_name}'s legacy is preserved`, body: `This capsule has gathered its community. It remains accessible at your link. Extended Validity is available from Services if needed.`, cta: null, href: null },
            wrapping_up: { tone: 'rgba(147,197,253,0.08)', border: 'rgba(147,197,253,0.25)', heading: `Ready to compile the final record?`, body: `${daysLeft} days remaining. The tributes are gathered -- a Digital Publication will preserve them permanently.`, cta: 'Generate Publication', href: `/manage/${slug}/publication` },
            active:      { tone: 'rgba(226,195,107,0.07)', border: 'rgba(226,195,107,0.3)', heading: `Your capsule closes in ${daysLeft} days`, body: `Voices are still arriving. Extend your capsule to keep the tribute wall open.`, cta: 'Extend Access', href: null },
            underused:   { tone: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', heading: `Your capsule is still waiting`, body: `${capsule.honouree_name}'s tribute wall hasn't gathered many voices yet. Share the link to get started.`, cta: 'Share Your Capsule', href: `/for/${slug}` },
          }
          const b = banners[status]

          return (
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '12px 16px 0' }}>
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: b.tone, border: `1px solid ${b.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: textPrimary }}>{b.heading}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: textFaint, lineHeight: 1.6 }}>{b.body}</p>
                </div>
                {b.cta && (
                  <a href={b.href ?? '#'} onClick={!b.href ? (e) => { e.preventDefault(); setActiveTab('services') } : undefined}
                    style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', background: 'rgba(226,195,107,0.12)', border: '1px solid rgba(226,195,107,0.28)', color: gold, whiteSpace: 'nowrap' }}>
                    {b.cta}
                  </a>
                )}
              </div>
            </div>
          )
        })()}

        {/* -- MAIN CONTENT -- */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 16px 0' }}>

          {/* -- OVERVIEW TAB -- */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {contributions.length > 0 && <StatPill label="Total" value={contributions.length} />}
                {capsule.approved_contrib_count > 0 && <StatPill label="Approved" value={capsule.approved_contrib_count} accent />}
                {pending.length > 0 && <StatPill label="Awaiting" value={pending.length} />}
                {capsule.event_date && <StatPill label="Days to go" value={Math.max(0, Math.ceil((new Date(capsule.event_date).getTime() - Date.now()) / 86400000))} />}
              </div>

              {pending.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(226,195,107,0.06)', border: `1px solid rgba(226,195,107,0.22)`, marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: gold, margin: 0 }}>{pending.length} voice{pending.length !== 1 ? 's' : ''} awaiting review</p>
                      <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>Review and publish below</p>
                    </div>
                    <span style={{ fontSize: '16px', color: goldMuted }}>{pending.length}</span>
                  </div>
                  <SectionCard title="Awaiting Review" subtitle={`${pending.length} to review`}>
                    {pending.map(c => <TributeReviewCard key={c.id} c={c} onApprove={handleApprove} onDecline={handleDecline} />)}
                  </SectionCard>
                </div>
              )}

              <SectionCard title="Your Capsule Is Live">
                <p style={{ fontSize: '12px', color: textFaint, marginBottom: '12px' }}>Share this link with contributors.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: goldFaint, border: `1px solid rgba(226,195,107,0.15)`, marginBottom: '10px' }}>
                  <span style={{ flex: 1, fontSize: '12px', color: goldMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capsuleUrl}</span>
                  <button onClick={handleCopy} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', background: copied ? 'rgba(74,222,128,0.1)' : goldFaint, border: `1px solid ${copied ? 'rgba(74,222,128,0.28)' : 'rgba(226,195,107,0.22)'}`, color: copied ? 'rgba(134,239,172,0.9)' : gold, cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy'}</button>
                </div>
                <Link href={`https://wa.me/?text=${encodeURIComponent(`You are invited to leave a tribute for ${capsule.honouree_name}: ${capsuleUrl}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)', color: 'rgba(134,239,172,0.85)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>💬 Share via WhatsApp</Link>
              </SectionCard>

              {pins.length > 0 && (
                <SectionCard title="World Tribute Map" subtitle={`${[...new Set(pins.map(p => p.country))].length} countries`}>
                  <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', border: `1px solid rgba(226,195,107,0.12)` }}>
                    <TributeMap pins={pins} locked={true} />
                  </div>
                </SectionCard>
              )}

                

              {/* -- ADD-ONS / SERVICES TABLE -- */}
              <SectionCard title="Capsule Services" subtitle="Tap any service to learn more -- contact us to activate">
                <AddOnsTable capsuleComponents={capsule.components ?? []} onServicesTab={() => {
                  setActiveTab('services')
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }, 150)
                }} />
              </SectionCard>
            </div>
          )}


{/* -- SETSTORIES TAB -- */}
          {activeTab === 'setstories' && (
            <div>
              <SetStoriesManager
                communityTopics={communityTopics}
                capsule={capsule}
                supabase={supabase}
                fetchAll={fetchAll}
                gold={gold}
                goldMuted={goldMuted}
                textPrimary={textPrimary}
                textFaint={textFaint}
              />
            </div>
          )}

          {/* -- SETPROFILE TAB -- */}
          {activeTab === 'setprofile' && (
            <div>
              <SectionCard title="Capsule Photo" subtitle="Appears on the tribute wall and profile">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: resolvedHero ? '14px' : '0' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid rgba(226,195,107,0.35)`, background: '#1a0845', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {resolvedHero
                      ? <img src={resolvedHero} alt={capsule.honouree_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.6))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LC</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '10px' }}>Upload a clear, high-quality image.</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      <label style={{ display: 'inline-block', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', background: goldFaint, border: `1px solid rgba(226,195,107,0.22)`, color: gold, fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>
                        {heroUploading ? 'Uploading…' : '📷 Upload Photo'}
                        <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} disabled={heroUploading} />
                      </label>
                      {resolvedHero && (
                        <button
                          onClick={() => setShowHeroPicker(p => !p)}
                          style={{ padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', background: showHeroPicker ? 'rgba(226,195,107,0.15)' : 'transparent', border: `1px solid rgba(226,195,107,0.22)`, color: goldMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}
                        >
                          ⚙ Adjust
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {resolvedHero && showHeroPicker && (
                  <HeroPositionPicker
                    capsuleId={capsule.id}
                    imageUrl={resolvedHero}
                    currentPosition={capsule.hero_image_position ?? '50% 50%'}
                    currentZoom={capsule.hero_image_zoom ?? 150}
                    currentFit={capsule.hero_image_fit ?? 'height'}
                    currentSize={capsule.hero_panel_size ?? 'standard'}
                    currentBleed={capsule.hero_full_bleed ?? false}
                    onSettingsChange={({ pos, zoom, fit, size, bleed }) => {
                      setCapsule(prev => prev ? { ...prev, hero_image_position: pos, hero_image_zoom: zoom, hero_image_fit: fit, hero_panel_size: size, hero_full_bleed: bleed } : prev)
                    }}
                    onDone={() => setShowHeroPicker(false)}
                    t={{ accentPrimary: gold, accentFaint: goldFaint, accentMuted: goldMuted, cardBg, cardBorder, textMuted: textSecondary, textFaint, inputBg: 'rgba(255,255,255,0.06)', inputBorder: 'rgba(226,195,107,0.18)' }}
                  />
                )}
              </SectionCard>

              <SectionCard title="Photo Gallery" subtitle="Up to 3 sections · 10 photos each · photo + caption per row">
                <GalleryEditor capsuleId={capsule.id} initialPhotos={galleryPhotos} supabase={supabase} t={galleryTheme} onSaved={fetchAll} />
              </SectionCard>

              <SectionCard title="Profile Sections" subtitle="No character limit -- write as much as your event deserves">
                {!profileSections.some((s: ProfileSection) => s.section_type === 'appreciation') && (
                  <div style={{ padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(212,174,42,0.3)', background: 'linear-gradient(135deg, rgba(212,174,42,0.06) 0%, rgba(212,174,42,0.02) 100%)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>&#10022;</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: gold }}>Add a Family Appreciation</p>
                        <p style={{ margin: '0 0 12px', fontSize: '12px', color: textSecondary, lineHeight: 1.65 }}>
                          A warm closing message from the family — thanking guests and everyone who contributed to this capsule.
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              await supabase.from('capsule_profile_sections').insert({
                                capsule_id:   capsule.id,
                                section_type: 'appreciation',
                                custom_title: null,
                                content:      DEFAULT_APPRECIATION_TEXT.replace(/\[honouree_name\]/g, capsule.honouree_name),
                                sort_order:   (profileSections.length + 1) * 10,
                                is_active:    true,
                              })
                              fetchAll()
                            } catch (err) {
                              console.error('[appreciation] Failed to add:', err)
                            }
                          }}
                          style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #E2C36B, #C8A84A)', color: '#1a0845', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
                        >
                          + Add Family Appreciation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <SectionEditor capsuleId={capsule.id} sections={profileSections} onRefresh={fetchAll} />
              </SectionCard>
            </div>
          )}

          {/* -- SERVICES TAB -- */}
          {activeTab === 'services' && (
            <ServicesTab
              capsule={capsule}
              approvedContributions={approved}
              supabase={supabase}
              eohEditor={capsule.components?.includes('ways_to_honour')
                ? <WaysToHonourEditor capsuleId={capsule.id} supabase={supabase} />
                : undefined}
              onToggleFlag={handleToggleFlag}
              onUpgrade={() => {
                setActiveTab('services')
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 150)
              }}
            />
          )}

          {/* -- SETTINGS TAB -- */}
          {activeTab === 'settings' && (
            <div>
              <SectionCard title="Capsule Details">
                <EditField label="Display Name" value={capsule.honouree_name} placeholder="Name as it appears on the tribute wall" onSave={async val => { await updateCapsule({ honouree_name: val }) }} />
                <EditField label="Honouree Title" value={capsule.honouree_title ?? ''} placeholder="e.g. Dr · Chief · Pastor · Prof (optional)" hint="Displayed beneath the name on the tribute wall." onSave={async val => { await updateCapsule({ honouree_title: val }) }} />
                <EditField label="Event Tag" value={capsule.event_tag ?? ''} placeholder="e.g. United In Love · 35 Years of Excellence" hint="Subtitle shown beneath the name on the tribute wall." onSave={async val => { await updateCapsule({ event_tag: val }) }} />
                <EditField label="Event Date" value={capsule.event_date ?? ''} type="date" hint="Used for the days-to-event countdown." onSave={async val => { await updateCapsule({ event_date: val }) }} />
                <EditField label="Capsule URL" value={capsule.slug} placeholder="your-capsule-slug" hint={`Your link: itslegacycapsule.com/for/${capsule.slug}`} onSave={async val => { const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'); await updateCapsule({ slug: clean }) }} />
              </SectionCard>

              <SectionCard title="Tribute Notifications" subtitle="Get notified when new tributes arrive for review">
                <NotificationSettings
                  capsuleId={capsule.id}
                  currentFrequency={(capsule as any).notification_frequency ?? null}
                  eventDate={capsule.event_date}
                  onSaved={fetchAll}
                />
              </SectionCard>

              <SectionCard title="Visual Style" subtitle="Choose the mood for your capsule">
                <StylePicker currentTheme={capsule.theme} eventType={capsule.event_type} onSave={async (key) => { await updateCapsule({ theme: key }) }} />
              </SectionCard>

              <SectionCard title="Family Representative" subtitle="Private portal access for the honouree or trusted family member">
                <FamilyRepSection
                  capsuleId={capsule.id}
                  slug={capsule.slug}
                  initialName={(capsule as any).family_rep_name ?? ''}
                  initialEmail={(capsule as any).family_rep_email ?? ''}
                  sentAt={(capsule as any).rep_portal_sent_at ?? null}
                  onSaved={fetchAll}
                />
              </SectionCard>

{/* Capsule Reveal decommissioned -- Family Rep Portal covers this use case with multi-access support */}

              

              <div id="upgrade-form" style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid rgba(226,195,107,0.18)`, background: 'linear-gradient(145deg, rgba(226,195,107,0.05), rgba(255,255,255,0.02))', marginBottom: '14px' }}>
                <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.55), transparent)' }} />
                <div style={{ padding: '20px 18px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 700, color: gold, marginBottom: '8px' }}>Add Services to Your Capsule</h3>
                  <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, marginBottom: '16px' }}>
                    Voice tributes, video messages, guest management, digital publication, attire coordination -- add what your event needs, directly from your Services tab. No need to contact us.
                  </p>
                  <button
                    onClick={() => setActiveTab('services')}
                    style={{ padding: '10px 20px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  >
                    Go to Services →
                  </button>
                </div>
              </div>

              <SectionCard title="Order History" subtitle="Services purchased for this capsule">
                <OrderHistoryPanel capsuleId={capsule.id} />
              </SectionCard>

              <DeleteAccountSection email={visitorEmail} slug={slug} capsuleId={capsule?.id ?? ''} />
            </div>
          )}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} pendingCount={pending.length} />
      </div>
    </>
  )
}
