'use client'

/* =========================================================
   ORGANISER CONTROL DASHBOARD — /manage/[slug] — v2
   Full section editor · Style picker · Arrow reorder
   Theme-aware · Premium workspace aesthetic

   SECTIONS:
   1.  Imports & types
   2.  Constants & supabase client
   3.  Sub-components
       3a. FreeTierBar
       3b. StatPill
       3c. SectionCard
       3d. TributeReviewCard
       3e. EditField
       3f. SectionEditor (NEW — full section management)
       3g. StylePicker (NEW — theme selection)
       3h. UpgradeCard
       3i. BottomNav
       3j. EmailGate
   4.  Main component
========================================================= */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getAllThemes, resolveTheme } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'

/* =========================================================
   SECTION 1 — TYPES
========================================================= */
interface Capsule {
  id: string; slug: string; honouree_name: string; honouree_title: string | null
  event_type: string; event_tag: string | null; event_date: string | null
  page_state: string; tier: string | null; theme: string | null
  hero_image_url: string | null; organiser_email: string
  free_tier_expires_at: string | null; activated_at: string | null
  approved_contrib_count: number; components: string[]
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
type Tab = 'overview' | 'tributes' | 'profile' | 'settings'

/* =========================================================
   SECTION 2 — CONSTANTS
========================================================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FREE_TRIBUTE_LIMIT = 50
const LS_EMAIL = 'lc_visitor_email'

// Predefined section types for profile summary (tribute wall)
const SUMMARY_SECTION_TYPES = [
  { type: 'intro', label: 'Introduction', placeholder: 'A brief introduction to the honouree and this occasion…', maxChars: 280 },
  { type: 'occasion', label: 'About the Occasion', placeholder: 'Details about this event or milestone…', maxChars: 280 },
  { type: 'quote', label: 'Featured Quote', placeholder: 'A meaningful quote from or about the honouree…', maxChars: 180 },
  { type: 'message', label: 'Organiser Message', placeholder: 'A personal message from the organiser…', maxChars: 320 },
]

// Extended section types for full profile page
const PROFILE_SECTION_TYPES = [
  { type: 'biography', label: 'Biography', placeholder: 'The full story of the honouree…', maxChars: 2000 },
  { type: 'timeline', label: 'Timeline', placeholder: 'Key milestones and dates…', maxChars: 1000 },
  { type: 'achievements', label: 'Achievements', placeholder: 'Notable accomplishments and recognition…', maxChars: 1000 },
  { type: 'family', label: 'Family', placeholder: 'Family members and relationships…', maxChars: 500 },
  { type: 'legacy', label: 'Legacy', placeholder: 'The lasting impact and legacy…', maxChars: 800 },
  { type: 'custom', label: 'Custom Section', placeholder: 'Write your own section…', maxChars: 1000 },
]

// Design tokens
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

const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#0a0218' }} />,
})

/* =========================================================
   SECTION 3A — FREE TIER BAR
========================================================= */
function FreeTierBar({ approvedCount, daysLeft, onUpgrade }: { approvedCount: number; daysLeft: number | null; onUpgrade: () => void }) {
  const pct = Math.min(100, (approvedCount / FREE_TRIBUTE_LIMIT) * 100)
  const urgent = (daysLeft !== null && daysLeft < 14) || pct > 80
  return (
    <div style={{ background: urgent ? 'rgba(226,195,107,0.07)' : 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${urgent ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.05)'}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: goldMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tributes</span>
          <span style={{ fontSize: '10px', color: urgent ? gold : textFaint }}>{approvedCount} / {FREE_TRIBUTE_LIMIT}</span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? `linear-gradient(to right, ${gold}, #F0D878)` : 'linear-gradient(to right, rgba(226,195,107,0.5), rgba(226,195,107,0.8))', borderRadius: '2px', transition: 'width 0.6s ease' }} />
        </div>
      </div>
      {daysLeft !== null && <span style={{ fontSize: '11px', color: daysLeft < 14 ? gold : textSecondary, fontWeight: daysLeft < 14 ? 600 : 400 }}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</span>}
      <button onClick={onUpgrade} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px', border: `1px solid rgba(226,195,107,0.35)`, background: 'rgba(226,195,107,0.08)', color: gold, cursor: 'pointer', letterSpacing: '0.04em' }}>Expand Capsule</button>
    </div>
  )
}

/* =========================================================
   SECTION 3B — STAT PILL
========================================================= */
function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: '70px', padding: '12px 10px', borderRadius: '12px', background: accent ? 'rgba(226,195,107,0.07)' : cardBg, border: `1px solid ${accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: accent ? gold : textPrimary, lineHeight: 1.1, fontFamily: "'Playfair Display', serif" }}>{value}</div>
      <div style={{ fontSize: '9px', color: textFaint, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  )
}

/* =========================================================
   SECTION 3C — SECTION CARD WRAPPER
========================================================= */
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

/* =========================================================
   SECTION 3D — TRIBUTE REVIEW CARD
========================================================= */
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
        <button disabled={approving} onClick={async () => { setApproving(true); await onApprove(c.id) }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.28)', background: 'rgba(74,222,128,0.07)', color: approving ? textFaint : 'rgba(134,239,172,0.9)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>{approving ? 'Publishing…' : '✓ Publish'}</button>
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

/* =========================================================
   SECTION 3E — EDIT FIELD
========================================================= */
function EditField({ label, value, placeholder, onSave, type = 'text', hint }: { label: string; value: string; placeholder?: string; onSave: (val: string) => Promise<void>; type?: 'text' | 'date' | 'email'; hint?: string }) {
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

/* =========================================================
   SECTION 3F — SECTION EDITOR
   Predefined types for profile summary · Custom for full profile
========================================================= */
function SectionEditor({ capsuleId, sections, onRefresh }: { capsuleId: string; sections: ProfileSection[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')

  const allTypes = [...SUMMARY_SECTION_TYPES, ...PROFILE_SECTION_TYPES]
  const selectedTypeDef = allTypes.find(t => t.type === newType)
  const maxChars = selectedTypeDef?.maxChars ?? 1000

  const handleAdd = async () => {
    if (!newType || !newContent.trim()) return
    setSaving(true)
    const isCustom = newType === 'custom'
    await supabase.from('capsule_profile_sections').insert({
      capsule_id: capsuleId,
      section_type: newType,
      custom_title: isCustom ? (newTitle.trim() || 'Custom Section') : null,
      content: newContent.trim(),
      sort_order: sections.length,
      is_active: true,
    })
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

  const handleSaveEdit = async (id: string) => {
    await supabase.from('capsule_profile_sections').update({ content: editContent, custom_title: editTitle || null }).eq('id', id)
    setEditingId(null); onRefresh()
  }

  const getLabel = (s: ProfileSection) => {
    if (s.custom_title) return s.custom_title
    return allTypes.find(t => t.type === s.section_type)?.label ?? s.section_type.replace(/_/g, ' ')
  }

  return (
    <div>
      {/* Existing sections */}
      {sections.length === 0 && !adding && (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '16px 0' }}>No sections yet. Add your first section below.</p>
      )}

      {sections.map((s, idx) => (
        <div key={s.id} style={{ borderRadius: '10px', border: `1px solid ${s.is_active ? cardBorder : 'rgba(255,255,255,0.04)'}`, background: s.is_active ? cardBg : 'transparent', padding: '12px 14px', marginBottom: '8px', opacity: s.is_active ? 1 : 0.5, transition: 'all 0.2s' }}>
          {editingId === s.id ? (
            <div>
              {s.section_type === 'custom' && (
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Section title" style={{ ...inp, marginBottom: '8px' }} />
              )}
              <textarea value={editContent} onChange={e => setEditContent(e.target.value.slice(0, allTypes.find(t => t.type === s.section_type)?.maxChars ?? 1000))} rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleSaveEdit(s.id)} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* Up/down arrows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0, paddingTop: '2px' }}>
                <button onClick={() => handleMoveUp(s, idx)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.1)' : textFaint, cursor: idx === 0 ? 'default' : 'pointer', fontSize: '12px', lineHeight: 1, padding: '2px' }}>↑</button>
                <button onClick={() => handleMoveDown(s, idx)} disabled={idx === sections.length - 1} style={{ background: 'none', border: 'none', color: idx === sections.length - 1 ? 'rgba(255,255,255,0.1)' : textFaint, cursor: idx === sections.length - 1 ? 'default' : 'pointer', fontSize: '12px', lineHeight: 1, padding: '2px' }}>↓</button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: s.is_active ? gold : textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{getLabel(s)}</span>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: s.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', color: s.is_active ? 'rgba(134,239,172,0.8)' : textFaint, border: `1px solid ${s.is_active ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}` }}>{s.is_active ? 'Live' : 'Hidden'}</span>
                </div>
                {s.content && <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.6, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{s.content}</p>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => handleToggle(s)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, cursor: 'pointer' }}>{s.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => { setEditingId(s.id); setEditContent(s.content ?? ''); setEditTitle(s.custom_title ?? '') }} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new section */}
      {adding ? (
        <div style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, padding: '14px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>New Section</p>

          {/* Type selector */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Section Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[...SUMMARY_SECTION_TYPES, ...PROFILE_SECTION_TYPES].map(t => (
                <button key={t.type} onClick={() => setNewType(t.type)} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '20px', border: `1px solid ${newType === t.type ? 'rgba(226,195,107,0.5)' : cardBorder}`, background: newType === t.type ? 'rgba(226,195,107,0.1)' : 'transparent', color: newType === t.type ? gold : textFaint, cursor: 'pointer', transition: 'all 0.15s' }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Custom title (for custom type only) */}
          {newType === 'custom' && (
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Section title (e.g. Words of Wisdom)" style={{ ...inp, marginBottom: '8px' }} maxLength={60} />
          )}

          {/* Content */}
          {newType && (
            <>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value.slice(0, maxChars))} placeholder={selectedTypeDef?.placeholder ?? 'Write your content…'} rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                <span style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '9px', color: newContent.length > maxChars * 0.9 ? gold : textFaint, pointerEvents: 'none' }}>{newContent.length}/{maxChars}</span>
              </div>
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

/* =========================================================
   SECTION 3G — STYLE PICKER
========================================================= */
function StylePicker({ currentTheme, eventType, onSave }: { currentTheme: string | null; eventType: string; onSave: (theme: ThemeKey | 'classic') => Promise<void> }) {
  const themes = getAllThemes()
  const autoKey = resolveTheme('classic', eventType)
  const [saving, setSaving] = useState(false)

  const handleSelect = async (key: ThemeKey | 'classic') => {
    setSaving(true)
    await onSave(key)
    setSaving(false)
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '14px' }}>
        Choose the visual mood for your capsule. The default is automatically selected based on your event type
        {' '}(<span style={{ color: goldMuted }}>{themes.find(t => t.key === autoKey)?.label}</span>).
      </p>

      {/* Auto option */}
      <button onClick={() => handleSelect('classic')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${(!currentTheme || currentTheme === 'classic') ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: (!currentTheme || currentTheme === 'classic') ? 'rgba(226,195,107,0.07)' : 'transparent', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.15s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, margin: 0 }}>Auto (Recommended)</p>
            <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>Uses {themes.find(t => t.key === autoKey)?.label} based on your event type</p>
          </div>
          {(!currentTheme || currentTheme === 'classic') && <span style={{ color: gold, fontSize: '14px' }}>✓</span>}
        </div>
      </button>

      {/* Manual options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {themes.map(t => (
          <button key={t.key} onClick={() => handleSelect(t.key)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${currentTheme === t.key ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: currentTheme === t.key ? 'rgba(226,195,107,0.07)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, margin: 0 }}>{t.label}</p>
                <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>{t.description}</p>
              </div>
              {currentTheme === t.key && <span style={{ color: gold, fontSize: '14px' }}>✓</span>}
            </div>
          </button>
        ))}
      </div>
      {saving && <p style={{ fontSize: '11px', color: goldMuted, marginTop: '8px', textAlign: 'center' }}>Saving…</p>}
    </div>
  )
}

/* =========================================================
   SECTION 3H — UPGRADE CARD
========================================================= */
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
        <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, marginBottom: '16px' }}>Photo tributes, audio and video contributions, digital publication, extended validity — we'll build the right package around your event.</p>
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.05)', border: `1px solid ${goldFaint}`, marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, lineHeight: 1.8, margin: 0 }}>✦ At the close of your event, LegacyCapsule automatically compiles every tribute, photo, and voice from your wall into a beautifully designed digital publication. The platform can be triggered to send it to every person who contributed, wherever they are.</p>
        </div>
        {sent ? (
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'rgba(134,239,172,0.9)', fontWeight: 600, margin: 0 }}>✓ Message received — we'll be in touch within 24 hours.</p>
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

/* =========================================================
   SECTION 3I — BOTTOM NAV
========================================================= */
function BottomNav({ active, onChange, pendingCount }: { active: Tab; onChange: (t: Tab) => void; pendingCount: number }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'tributes', label: 'Tributes', icon: '✦' },
    { id: 'profile', label: 'Profile', icon: '◉' },
    { id: 'settings', label: 'Settings', icon: '⊙' },
  ]
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,10,30,0.97)', backdropFilter: 'blur(16px)', borderTop: `1px solid rgba(226,195,107,0.12)`, display: 'flex', padding: '8px 0 max(8px, env(safe-area-inset-bottom))' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', position: 'relative' }}>
          <span style={{ fontSize: '16px', color: active === tab.id ? gold : 'rgba(255,255,255,0.2)', transition: 'all 0.15s', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: active === tab.id ? gold : 'rgba(255,255,255,0.2)', fontWeight: active === tab.id ? 700 : 400, transition: 'all 0.15s' }}>{tab.label}</span>
          {tab.id === 'tributes' && pendingCount > 0 && <span style={{ position: 'absolute', top: '0px', right: '20%', width: '14px', height: '14px', borderRadius: '50%', background: gold, color: '#1a0845', fontSize: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>}
        </button>
      ))}
    </div>
  )
}

/* =========================================================
   SECTION 3J — EMAIL GATE
========================================================= */
function EmailGate({ onEmail }: { onEmail: (email: string) => void }) {
  const [email, setEmail] = useState('')
  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '36px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
        <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
      </div>
      <div style={{ width: '100%', maxWidth: '340px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 20px', background: goldFaint, border: `1px solid rgba(226,195,107,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>◈</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Organiser Access</h2>
        <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.65, marginBottom: '22px' }}>Enter the email you used to create this capsule.</p>
        <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && email.includes('@') && onEmail(email.trim())} style={{ ...inp, marginBottom: '12px', textAlign: 'center' }} autoFocus />
        <button onClick={() => email.includes('@') && onEmail(email.trim())} disabled={!email.includes('@')} style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: !email.includes('@') ? 'not-allowed' : 'pointer', opacity: !email.includes('@') ? 0.55 : 1, letterSpacing: '0.04em' }}>Open Dashboard</button>
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 4 — MAIN COMPONENT
========================================================= */
export default function ManagePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([])
  const [visitorEmail, setVisitorEmail] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const heroPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Read email from URL param first (set by signin flow), then localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const authEmail = urlParams.get('auth')
    if (authEmail) {
      const decoded = decodeURIComponent(authEmail)
      localStorage.setItem(LS_EMAIL, decoded)
      setVisitorEmail(decoded)
      // Clean the URL param without page reload
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
    } else {
      const saved = localStorage.getItem(LS_EMAIL)
      if (saved) setVisitorEmail(saved)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    if (!slug) return
    const capRes = await supabase.from('capsules').select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, theme, hero_image_url, organiser_email, free_tier_expires_at, activated_at, approved_contrib_count, components').eq('slug', slug).single()
    if (!capRes.data) { setLoading(false); return }
    const cap = capRes.data as Capsule
    setCapsule(cap); setHeroImage(cap.hero_image_url)

    const [contribRes, sectionsRes] = await Promise.all([
      supabase.from('contributions').select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, email, status, created_at').eq('capsule_id', cap.id).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('capsule_profile_sections').select('id, section_type, custom_title, content, sort_order, is_active').eq('capsule_id', cap.id).order('sort_order'),
    ])
    if (contribRes.data) setContributions(contribRes.data as Contribution[])
    if (sectionsRes.data) setProfileSections(sectionsRes.data as ProfileSection[])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchAll() }, [fetchAll])

  const isOrganiser = visitorEmail !== '' && visitorEmail.toLowerCase() === capsule?.organiser_email?.toLowerCase()
  const pending = contributions.filter(c => c.status === 'pending_review' || c.status === 'pending')
  const approved = contributions.filter(c => c.status === 'approved')
  const days = capsule?.free_tier_expires_at ? Math.max(0, Math.ceil((new Date(capsule.free_tier_expires_at).getTime() - Date.now()) / 86400000)) : null
  const isFree = !capsule?.tier || capsule.tier === 'free'
  const capsuleUrl = typeof window !== 'undefined' ? `${window.location.origin}/for/${slug}` : `https://itslegacycapsule.com/for/${slug}`
  const pins = approved.filter(c => (c as any).lat && (c as any).lng).map(c => ({ lat: (c as any).lat, lng: (c as any).lng, name: c.contributor_name, country: c.country }))

  const handleApprove = async (id: string) => { await supabase.from('contributions').update({ status: 'approved' }).eq('id', id); fetch('/api/email/approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionId: id }) }).catch(() => {}); fetchAll() }
  const handleDecline = async (id: string) => { await supabase.from('contributions').delete().eq('id', id); fetchAll() }
  const handleCopy = async () => { await navigator.clipboard.writeText(capsuleUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const updateCapsule = async (fields: Partial<Capsule>) => { if (!capsule) return; await supabase.from('capsules').update(fields).eq('id', capsule.id); fetchAll() }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !capsule) return; setHeroUploading(true)
    try {
      const ic = (await import('browser-image-compression')).default
      const compressed = await ic(f, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
      const ext = compressed.name.split('.').pop() ?? 'jpg'; const path = `hero/${capsule.id}.${ext}`
      const { error: ue } = await supabase.storage.from('tribute-photos').upload(path, compressed, { upsert: true })
      if (!ue) { const url = supabase.storage.from('tribute-photos').getPublicUrl(path).data.publicUrl; await supabase.from('capsules').update({ hero_image_url: url }).eq('id', capsule.id); setHeroImage(url) }
    } catch (err) { console.error(err) }
    setHeroUploading(false)
  }

  // Loading
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

  if (!visitorEmail) return <EmailGate onEmail={email => { localStorage.setItem(LS_EMAIL, email); setVisitorEmail(email) }} />

  if (!isOrganiser) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: '16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: textFaint, fontSize: '14px', maxWidth: '280px' }}>This dashboard is only accessible to the capsule organiser.</p>
      <Link href={`/for/${slug}`} style={{ fontSize: '13px', color: goldMuted, textDecoration: 'underline' }}>View the tribute wall</Link>
    </div>
  )

  const resolvedHero = heroImage ?? '/honouree.jpg'

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } * { box-sizing: border-box; } body { margin: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(226,195,107,0.18); border-radius: 2px; } input:focus, textarea:focus, select:focus { border-color: rgba(226,195,107,0.45) !important; }`}</style>

      <div style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: textPrimary, paddingBottom: '80px' }}>

        {/* TOP HEADER */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(226,195,107,0.08)`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
            </Link>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capsule.honouree_name}</p>
              <p style={{ fontSize: '10px', color: textFaint, margin: 0, marginTop: '1px' }}>{capsule.event_type}{capsule.event_tag ? ` · ${capsule.event_tag}` : ''}</p>
            </div>
            <div style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: capsule.page_state === 'active' || capsule.page_state === 'tribute_collection' ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.05)', border: `1px solid ${capsule.page_state === 'active' || capsule.page_state === 'tribute_collection' ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`, color: capsule.page_state === 'active' || capsule.page_state === 'tribute_collection' ? 'rgba(134,239,172,0.9)' : textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</div>
          </div>
        </div>

        {/* FREE TIER BAR */}
        {isFree && <FreeTierBar approvedCount={capsule.approved_contrib_count} daysLeft={days} onUpgrade={() => setActiveTab('settings')} />}

        {/* MAIN CONTENT */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 16px 0' }}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <StatPill label="Total" value={contributions.length} />
                <StatPill label="Approved" value={capsule.approved_contrib_count} accent />
                <StatPill label="Awaiting" value={pending.length} />
                {capsule.event_date && <StatPill label="Days to go" value={Math.max(0, Math.ceil((new Date(capsule.event_date).getTime() - Date.now()) / 86400000))} />}
              </div>

              {/* Pending prompt */}
              {pending.length > 0 && (
                <div onClick={() => setActiveTab('tributes')} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(226,195,107,0.06)', border: `1px solid rgba(226,195,107,0.22)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: gold, margin: 0 }}>{pending.length} tribute{pending.length !== 1 ? 's' : ''} awaiting review</p>
                    <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>Tap to review and publish</p>
                  </div>
                  <span style={{ fontSize: '18px', color: goldMuted }}>→</span>
                </div>
              )}

              <SectionCard title="Your Capsule Is Live">
                <p style={{ fontSize: '12px', color: textFaint, marginBottom: '12px' }}>Share this link with contributors.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: goldFaint, border: `1px solid rgba(226,195,107,0.15)`, marginBottom: '10px' }}>
                  <span style={{ flex: 1, fontSize: '12px', color: goldMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capsuleUrl}</span>
                  <button onClick={handleCopy} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', background: copied ? 'rgba(74,222,128,0.1)' : goldFaint, border: `1px solid ${copied ? 'rgba(74,222,128,0.28)' : 'rgba(226,195,107,0.22)'}`, color: copied ? 'rgba(134,239,172,0.9)' : gold, cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy'}</button>
                </div>
                <Link href={`https://wa.me/?text=${encodeURIComponent(`You are invited to leave a tribute for ${capsule.honouree_name}: ${capsuleUrl}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)', color: 'rgba(134,239,172,0.85)', textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>💬 Share via WhatsApp</Link>
              </SectionCard>

              {pins.length > 0 && (
                <SectionCard title="World Tribute Map" subtitle={`${[...new Set(pins.map(p => p.country))].length} countries`}>
                  <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', border: `1px solid rgba(226,195,107,0.12)` }}>
                    <TributeMap pins={pins} locked={true} />
                  </div>
                </SectionCard>
              )}

              <Link href={`/for/${slug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.07)`, background: 'rgba(255,255,255,0.02)', color: textSecondary, textDecoration: 'none', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px' }}>View Public Tribute Wall ↗</Link>
            </div>
          )}

          {/* TRIBUTES TAB */}
          {activeTab === 'tributes' && (
            <div>
              {pending.length > 0 && (
                <SectionCard title="Awaiting Review" subtitle={`${pending.length} to review`}>
                  {pending.map(c => <TributeReviewCard key={c.id} c={c} onApprove={handleApprove} onDecline={handleDecline} />)}
                </SectionCard>
              )}
              {approved.length > 0 && (
                <SectionCard title="Published" subtitle={`${approved.length} live on the wall`}>
                  {approved.map(c => (
                    <div key={c.id} style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.06)`, background: 'rgba(255,255,255,0.02)', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{c.contributor_name}{c.relationship && <span style={{ fontWeight: 400, color: textFaint }}> ({c.relationship})</span>}</span>
                        <span style={{ fontSize: '10px', color: textFaint }}>{[c.city, c.country].filter(Boolean).join(' · ')}</span>
                        <span style={{ fontSize: '10px', color: textFaint, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.6, margin: 0 }}>{c.tribute_text.length > 180 ? c.tribute_text.slice(0, 180) + '…' : c.tribute_text}</p>
                    </div>
                  ))}
                </SectionCard>
              )}
              {contributions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
                  <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>No tributes yet. Share your capsule link and the first one will arrive soon.</p>
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              {/* Hero photo */}
              <SectionCard title="Capsule Photo" subtitle="Appears on the tribute wall and profile">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid rgba(226,195,107,0.35)`, boxShadow: '0 0 16px rgba(226,195,107,0.12)' }}>
                    <img src={resolvedHero} alt={capsule.honouree_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '10px' }}>This photo appears as the backdrop on the tribute wall and as the profile photo. Upload a clear, high-quality image.</p>
                    <label style={{ display: 'inline-block', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', background: goldFaint, border: `1px solid rgba(226,195,107,0.22)`, color: gold, fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>
                      {heroUploading ? 'Uploading…' : '📷 Upload Photo'}
                      <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} disabled={heroUploading} />
                    </label>
                  </div>
                </div>
              </SectionCard>

              {/* Section editor */}
              <SectionCard title="Profile Sections" subtitle="Content shown on the tribute wall and full profile page">
                <SectionEditor capsuleId={capsule.id} sections={profileSections} onRefresh={fetchAll} />
              </SectionCard>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <SectionCard title="Capsule Details">
                <EditField label="Display Name" value={capsule.honouree_name} placeholder="Name as it appears on the tribute wall" onSave={async val => { await updateCapsule({ honouree_name: val }) }} />
                <EditField label="Event Tag" value={capsule.event_tag ?? ''} placeholder="e.g. United In Love · 35 Years of Excellence" hint="Subtitle shown beneath the name on the tribute wall." onSave={async val => { await updateCapsule({ event_tag: val }) }} />
                <EditField label="Honouree Title" value={capsule.honouree_title ?? ''} placeholder="e.g. Dr · Chief · Pastor" onSave={async val => { await updateCapsule({ honouree_title: val }) }} />
                <EditField label="Event Date" value={capsule.event_date ?? ''} type="date" hint="Used for the days-to-event countdown and anniversary reminder." onSave={async val => { await updateCapsule({ event_date: val }) }} />
                <EditField label="Capsule URL" value={capsule.slug} placeholder="your-capsule-slug" hint={`Your link: itslegacycapsule.com/for/${capsule.slug}`} onSave={async val => { const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'); await updateCapsule({ slug: clean }) }} />
              </SectionCard>

              <SectionCard title="Visual Style" subtitle="Choose the mood for your capsule">
                <StylePicker currentTheme={capsule.theme} eventType={capsule.event_type} onSave={async (key) => { await updateCapsule({ theme: key }) }} />
              </SectionCard>

              <SectionCard title="Family Representative" subtitle="Private portal access">
                <EditField label="Representative Name" value={(capsule as any).family_rep_name ?? ''} placeholder="Name of the family rep" onSave={async val => { await updateCapsule({ family_rep_name: val } as any) }} />
                <EditField label="Representative Email" value={(capsule as any).family_rep_email ?? ''} type="email" placeholder="Their email address" hint="Receives the Honouree Reveal and access to the private portal." onSave={async val => { await updateCapsule({ family_rep_email: val } as any) }} />
              </SectionCard>

              <UpgradeCard capsuleName={capsule.honouree_name} />
            </div>
          )}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} pendingCount={pending.length} />
      </div>
    </>
  )
}
