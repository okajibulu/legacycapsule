'use client'

/* =========================================================
   ORGANISER CONTROL DASHBOARD — /manage/[slug] — v2
   Full section editor · Style picker · Arrow reorder
   Theme-aware · Premium workspace aesthetic
========================================================= */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getAllThemes, resolveTheme } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'
import GalleryEditor from '@/components/GalleryEditor'

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FREE_TRIBUTE_LIMIT = 50
const LS_EMAIL = 'lc_visitor_email'

// ── NO character limits on any section type ──────────────
const SUMMARY_SECTION_TYPES = [
  { type: 'intro',   label: 'Introduction',    placeholder: 'A brief introduction to the honouree and this occasion…' },
  { type: 'occasion', label: 'About the Occasion', placeholder: 'Details about this event or milestone…' },
  { type: 'quote',   label: 'Featured Quote',  placeholder: 'A meaningful quote from or about the honouree…' },
  { type: 'message', label: 'Organiser Message', placeholder: 'A personal message from the organiser…' },
]

const PROFILE_SECTION_TYPES = [
  { type: 'biography',    label: 'Biography',     placeholder: 'The full story of the honouree…' },
  { type: 'timeline',     label: 'Timeline',      placeholder: 'Key milestones and dates…' },
  { type: 'achievements', label: 'Achievements',  placeholder: 'Notable accomplishments and recognition…' },
  { type: 'family',       label: 'Family',        placeholder: 'Family members and relationships…' },
  { type: 'legacy',       label: 'Legacy',        placeholder: 'The lasting impact and legacy…' },
  { type: 'custom',       label: 'Custom Section', placeholder: 'Write your own section…' },
]

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

/* ── FREE TIER BAR ────────────────────────────────────── */
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

/* ── STAT PILL ────────────────────────────────────────── */
function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: '70px', padding: '12px 10px', borderRadius: '12px', background: accent ? 'rgba(226,195,107,0.07)' : cardBg, border: `1px solid ${accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: accent ? gold : textPrimary, lineHeight: 1.1, fontFamily: "'Playfair Display', serif" }}>{value}</div>
      <div style={{ fontSize: '9px', color: textFaint, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  )
}

/* ── SECTION CARD ─────────────────────────────────────── */
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

/* ── TRIBUTE REVIEW CARD ──────────────────────────────── */
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

/* ── EDIT FIELD ───────────────────────────────────────── */
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

/* ── SECTION EDITOR — NO character limits ─────────────── */
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

  const handleAdd = async () => {
    if (!newType || !newContent.trim()) return
    setSaving(true)
    await supabase.from('capsule_profile_sections').insert({
      capsule_id: capsuleId, section_type: newType,
      custom_title: newType === 'custom' ? (newTitle.trim() || 'Custom Section') : null,
      content: newContent.trim(), sort_order: sections.length, is_active: true,
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
      {sections.length === 0 && !adding && (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '16px 0' }}>No sections yet. Add your first section below.</p>
      )}
      {sections.map((s, idx) => (
        <div key={s.id} style={{ borderRadius: '10px', border: `1px solid ${s.is_active ? cardBorder : 'rgba(255,255,255,0.04)'}`, background: s.is_active ? cardBg : 'transparent', padding: '12px 14px', marginBottom: '8px', opacity: s.is_active ? 1 : 0.5 }}>
          {editingId === s.id ? (
            <div>
              {s.section_type === 'custom' && <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Section title" style={{ ...inp, marginBottom: '8px' }} />}
              {/* NO maxLength — no char counter — unlimited content */}
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleSaveEdit(s.id)} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0, paddingTop: '2px' }}>
                <button onClick={() => handleMoveUp(s, idx)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.1)' : textFaint, cursor: idx === 0 ? 'default' : 'pointer', fontSize: '12px', lineHeight: 1, padding: '2px' }}>↑</button>
                <button onClick={() => handleMoveDown(s, idx)} disabled={idx === sections.length - 1} style={{ background: 'none', border: 'none', color: idx === sections.length - 1 ? 'rgba(255,255,255,0.1)' : textFaint, cursor: idx === sections.length - 1 ? 'default' : 'pointer', fontSize: '12px', lineHeight: 1, padding: '2px' }}>↓</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: s.is_active ? gold : textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{getLabel(s)}</span>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: s.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', color: s.is_active ? 'rgba(134,239,172,0.8)' : textFaint, border: `1px solid ${s.is_active ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}` }}>{s.is_active ? 'Live' : 'Hidden'}</span>
                </div>
                {s.content && <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.6, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{s.content}</p>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => handleToggle(s)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, cursor: 'pointer' }}>{s.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => { setEditingId(s.id); setEditContent(s.content ?? ''); setEditTitle(s.custom_title ?? '') }} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}
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
              {/* NO maxLength, NO char counter — unlimited */}
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

/* ── STYLE PICKER ─────────────────────────────────────── */
function StylePicker({ currentTheme, eventType, onSave }: { currentTheme: string | null; eventType: string; onSave: (theme: ThemeKey | 'classic') => Promise<void> }) {
  const themes = getAllThemes()
  const autoKey = resolveTheme('classic', eventType)
  const [saving, setSaving] = useState(false)
  const handleSelect = async (key: ThemeKey | 'classic') => { setSaving(true); await onSave(key); setSaving(false) }
  return (
    <div>
      <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '14px' }}>Choose the visual mood for your capsule. Auto uses the best theme for your event type (<span style={{ color: goldMuted }}>{themes.find(t => t.key === autoKey)?.label}</span>).</p>
      <button onClick={() => handleSelect('classic')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${(!currentTheme || currentTheme === 'classic') ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: (!currentTheme || currentTheme === 'classic') ? 'rgba(226,195,107,0.07)' : 'transparent', cursor: 'pointer', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, margin: 0 }}>Auto (Recommended)</p><p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>Uses {themes.find(t => t.key === autoKey)?.label} based on your event type</p></div>
          {(!currentTheme || currentTheme === 'classic') && <span style={{ color: gold, fontSize: '14px' }}>✓</span>}
        </div>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {themes.map(t => (
          <button key={t.key} onClick={() => handleSelect(t.key)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${currentTheme === t.key ? 'rgba(226,195,107,0.45)' : cardBorder}`, background: currentTheme === t.key ? 'rgba(226,195,107,0.07)' : 'transparent', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><p style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, margin: 0 }}>{t.label}</p><p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>{t.description}</p></div>
              {currentTheme === t.key && <span style={{ color: gold, fontSize: '14px' }}>✓</span>}
            </div>
          </button>
        ))}
      </div>
      {saving && <p style={{ fontSize: '11px', color: goldMuted, marginTop: '8px', textAlign: 'center' }}>Saving…</p>}
    </div>
  )
}

/* ── UPGRADE CARD ─────────────────────────────────────── */
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
        <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, marginBottom: '16px' }}>Photo tributes, audio and video contributions, digital publication, extended validity — add what your event needs.</p>
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

/* ── BOTTOM NAV ───────────────────────────────────────── */
function BottomNav({ active, onChange, pendingCount }: { active: Tab; onChange: (t: Tab) => void; pendingCount: number }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'tributes', label: 'Tributes', icon: '✦' },
    { id: 'profile',  label: 'Profile',  icon: '◉' },
    { id: 'settings', label: 'Settings', icon: '⊙' },
  ]
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,10,30,0.98)', backdropFilter: 'blur(20px)', borderTop: `1px solid rgba(226,195,107,0.15)`, display: 'flex', padding: '6px 8px max(8px, env(safe-area-inset-bottom))' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: active === tab.id ? 'rgba(226,195,107,0.1)' : 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px', borderRadius: '10px', position: 'relative', margin: '0 2px', transition: 'background 0.2s' }}>
          <span style={{ fontSize: '18px', color: active === tab.id ? gold : 'rgba(255,255,255,0.45)', transition: 'color 0.15s', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', color: active === tab.id ? gold : 'rgba(255,255,255,0.45)', fontWeight: active === tab.id ? 700 : 500, transition: 'color 0.15s' }}>{tab.label}</span>
          {tab.id === 'tributes' && pendingCount > 0 && (
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

/* ── WAYS TO HONOUR EDITOR ───────────────────────────── */
function WaysToHonourEditor({ capsuleId, supabase }: { capsuleId: string; supabase: any }) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', account_name: '', bank_name: '', account_number: '', currency: 'NGN', instructions: '', support_type: 'bank_transfer', is_visible: true, reveal_required: true })

  useEffect(() => {
    supabase.from('capsule_support_accounts').select('*').eq('capsule_id', capsuleId).order('sort_order').then(({ data }: any) => setAccounts(data ?? []))
  }, [capsuleId])

  const handleAdd = async () => {
    if (!form.account_name.trim() || !form.account_number.trim()) return
    setSaving(true)
    await supabase.from('capsule_support_accounts').insert({ capsule_id: capsuleId, ...form, sort_order: accounts.length })
    const { data } = await supabase.from('capsule_support_accounts').select('*').eq('capsule_id', capsuleId).order('sort_order')
    setAccounts(data ?? [])
    setForm({ title: '', account_name: '', bank_name: '', account_number: '', currency: 'NGN', instructions: '', support_type: 'bank_transfer', is_visible: true, reveal_required: true })
    setAdding(false); setSaving(false)
  }

  const handleToggle = async (id: string, is_visible: boolean) => {
    await supabase.from('capsule_support_accounts').update({ is_visible: !is_visible }).eq('id', id)
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, is_visible: !is_visible } : a))
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this account?')) return
    await supabase.from('capsule_support_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        Add bank account details for guests who wish to send support. Displayed tastefully on your profile page. LegacyCapsule never handles or processes any funds.
      </p>

      {accounts.map(acc => (
        <div key={acc.id} style={{ padding: '12px 14px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: acc.is_visible ? gold : textFaint, marginBottom: '2px' }}>{acc.title || acc.bank_name || 'Account'}</p>
            <p style={{ fontSize: '11px', color: textFaint }}>{acc.account_name} · {acc.bank_name}</p>
            <p style={{ fontSize: '11px', color: textFaint }}>••••{acc.account_number?.slice(-4)} · {acc.currency}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => handleToggle(acc.id, acc.is_visible)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, cursor: 'pointer' }}>{acc.is_visible ? 'Hide' : 'Show'}</button>
            <button onClick={() => handleDelete(acc.id)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ))}

      {adding ? (
        <div style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, padding: '14px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>New Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input style={inp} placeholder="Label (e.g. Celebrate With Prof. Adesina)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input style={inp} placeholder="Account name *" value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} />
            <input style={inp} placeholder="Bank name" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} />
            <input style={inp} placeholder="Account number *" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
            <input style={inp} placeholder="Currency (e.g. NGN, USD, GBP)" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <textarea style={{ ...inp, resize: 'none', lineHeight: 1.6 }} rows={2} placeholder="Optional note (e.g. Please use your name as reference)" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={handleAdd} disabled={saving || !form.account_name.trim() || !form.account_number.trim()} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Add Account'}</button>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', letterSpacing: '0.04em' }}>+ Add Support Account</button>
      )}
    </div>
  )
}

/* ── FAMILY REP SECTION — inline fields, single send ─── */
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

  const canSend = email.includes('@')
  const isDirty = name !== initialName || email !== initialEmail

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('capsules').update({ family_rep_name: name || null, family_rep_email: email || null } as any).eq('id', capsuleId)
    setSaving(false); setSaved(true); onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSend = async () => {
    if (!canSend) return
    // Save first if dirty
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
      setSent(true); onSaved()
    } catch { setError('Something went wrong. Please try again.') }
    setSending(false)
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        The Family Representative receives a private link to view all tributes, support acknowledgements and Ways to Honour details — without organiser access.
      </p>

      {/* Always-editable fields — no edit button needed */}
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

      {/* Save details if changed */}
      {isDirty && (
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '9px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${cardBorder}`, color: textSecondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Details'}
        </button>
      )}
      {saved && !isDirty && <p style={{ fontSize: '11px', color: 'rgba(134,239,172,0.8)', marginBottom: '8px', textAlign: 'center' }}>✓ Details saved</p>}

      {/* Send portal access */}
      {sent ? (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: '0 0 2px' }}>✓ Portal access link sent</p>
          <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>Sent to {email} — they can click the link to view tributes privately.</p>
        </div>
      ) : (
        <div>
          {sentAt && (
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '8px', fontStyle: 'italic' }}>
              ✓ Previously sent: {new Date(sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
          <button onClick={handleSend} disabled={sending || !canSend} style={{ width: '100%', padding: '11px', borderRadius: '10px', background: canSend ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))` : 'rgba(255,255,255,0.04)', border: canSend ? 'none' : `1px solid ${cardBorder}`, color: canSend ? '#1a0845' : textFaint, fontSize: '13px', fontWeight: 700, cursor: canSend ? 'pointer' : 'not-allowed', opacity: sending ? 0.7 : 1, letterSpacing: '0.04em' }}>
            {sending ? 'Sending…' : sentAt ? 'Resend Portal Access Link' : 'Send Portal Access Link →'}
          </button>
          {!canSend && <p style={{ fontSize: '11px', color: textFaint, marginTop: '6px', textAlign: 'center' }}>Enter the representative's email address above first.</p>}
          {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '6px' }}>{error}</p>}
        </div>
      )}
    </div>
  )
}

/* ── ADD-ONS TABLE ────────────────────────────────────── */
const LC_SERVICES = [
  // ── Free — always on ────────────────────────────────
  { id: 'tribute_wall',        label: 'Text Tributes',            desc: 'Guests leave written tributes on the public wall, visible to all visitors. Included on every capsule at no cost.', alwaysOn: true, phase: 1, autoActivated: false },
  { id: 'world_map',           label: 'World Tribute Map',        desc: 'Interactive map showing where in the world tributes came from. Included on every capsule.', alwaysOn: true, phase: 1, autoActivated: false },
  { id: 'event_profile',       label: 'Event Profile Canvas',     desc: 'Full profile page with biography, sections, timeline and photo gallery — the permanent identity layer for the honouree.', alwaysOn: true, phase: 1, autoActivated: false },
  { id: 'photo_tributes',      label: 'Photo Tributes',           desc: 'Contributors can attach a photo to their tribute message. Included on every capsule.', alwaysOn: true, phase: 1, autoActivated: false },
  { id: 'family_rep_portal',   label: 'Family Rep Portal',        desc: 'Private token-gated portal for the Family Representative to view all tributes and acknowledgements. Free on all capsules.', alwaysOn: true, phase: 1, autoActivated: false },
  { id: 'capsule_90days',      label: '90-Day Capsule Access',    desc: 'Every capsule includes 90 days of active tribute collection counted from the date the first tribute is received.', alwaysOn: true, phase: 1, autoActivated: false },
  // ── Premium — paid unlock ────────────────────────────
  { id: 'ways_to_honour',      label: 'Ways to Honour',           desc: 'Tasteful bank transfer details and acknowledgement flow — a dignified private channel for guests to support the honouree.', alwaysOn: false, phase: 1, autoActivated: false },
  { id: 'audio_tributes',      label: 'Voice Tributes',           desc: 'Contributors record personal audio messages up to 2 minutes. Hearing a voice adds a dimension text cannot replicate.', alwaysOn: false, phase: 1, autoActivated: false },
  { id: 'video_tributes',      label: 'Video Tributes',           desc: 'Contributors upload short video messages shown directly in their tribute card on the wall.', alwaysOn: false, phase: 1, autoActivated: false },
  { id: 'capsule_3month_ext',  label: '3-Month Capsule Extension', desc: 'Extends the free tribute wall service for an additional 3 months after the standard 90-day period expires.', alwaysOn: false, phase: 1, autoActivated: false },
  { id: 'capsule_6month',      label: '6-Month Capsule Span',     desc: 'Automatically applied when any premium service is unlocked. Capsule runs for 6 months from the date of the first tribute received.', alwaysOn: false, phase: 1, autoActivated: true },
  { id: 'publication',         label: 'Digital Publication',      desc: 'A beautifully designed keepsake PDF compiled from all tributes and sent to every contributor after the event.', alwaysOn: false, phase: 1, autoActivated: false },
  // ── Coming soon ──────────────────────────────────────
  { id: 'rsvp',                label: 'Guest Management & RSVP',  desc: 'Collect RSVPs, manage guest lists and coordinate event attendance.', alwaysOn: false, phase: 2, autoActivated: false },
  { id: 'attire',              label: 'Fabric & Attire',          desc: 'Coordinate event dress code, fabric choices and attire instructions for guests.', alwaysOn: false, phase: 2, autoActivated: false },
  { id: 'gift_capsule',        label: 'Gift a Capsule',           desc: 'Commission a capsule as a ceremonial gift for someone with a milestone event.', alwaysOn: false, phase: 2, autoActivated: false },
]

function AddOnsTable({ capsuleComponents, onUpgrade }: { capsuleComponents: string[]; onUpgrade: () => void }) {
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
          const isAutoActivated = svc.autoActivated && capsuleComponents.some(c => !['tribute_wall','world_map','event_profile','photo_tributes','family_rep_portal','capsule_90days'].includes(c))
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
                {svc.autoActivated && <span style={{ fontSize: '9px', color: textFaint, marginLeft: '6px', fontStyle: 'italic' }}>auto</span>}
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

              {/* Premium unlock button */}
              {!isFree && !isActivated && !isComingSoon && !svc.autoActivated && (
                <button
                  onClick={onUpgrade}
                  title="This is a paid add-on. Click to enquire about unlocking."
                  style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '8px', border: '1px solid rgba(226,195,107,0.25)', background: 'rgba(226,195,107,0.05)', color: goldMuted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  🔒 Unlock
                </button>
              )}

              {/* Auto-activated — not clickable */}
              {svc.autoActivated && !isActivated && !isComingSoon && (
                <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', color: textFaint, flexShrink: 0 }}>
                  With any unlock
                </span>
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

      <p style={{ fontSize: '10px', color: textFaint, marginTop: '10px', textAlign: 'center', fontStyle: 'italic' }}>
        🔒 Locked services require a paid add-on. Contact us or use the Expand Capsule form to unlock.
      </p>
    </div>
  )
}

/* ── MAIN COMPONENT ───────────────────────────────────── */
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
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(null)
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
      .select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, theme, hero_image_url, organiser_email, free_tier_expires_at, activated_at, approved_contrib_count, components')
      .eq('slug', slug).single()
    if (!capRes.data) { setLoading(false); return }
    const cap = capRes.data as Capsule
    setCapsule(cap); setHeroImage(cap.hero_image_url)

    const [contribRes, sectionsRes, galleryRes] = await Promise.all([
      supabase.from('contributions').select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, email, status, created_at').eq('capsule_id', cap.id).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('capsule_profile_sections').select('id, section_type, custom_title, content, sort_order, is_active').eq('capsule_id', cap.id).order('sort_order'),
      supabase.from('capsule_gallery').select('id, image_url, description, sort_order, section_index').eq('capsule_id', cap.id).order('section_index').order('sort_order'),
    ])

    if (contribRes.data) setContributions(contribRes.data as Contribution[])
    if (sectionsRes.data) setProfileSections(sectionsRes.data as ProfileSection[])
    if (galleryRes.data) setGalleryPhotos(galleryRes.data)
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

        {/* ── TOP HEADER ── */}
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
            {/* View Live — clickable link to public wall */}
            <a href={`/for/${slug}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: 'rgba(134,239,172,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>View Live ↗</a>
          </div>
        </div>

        {/* ── FREE TIER BAR ── */}
        {isFree && <FreeTierBar approvedCount={capsule.approved_contrib_count} daysLeft={days} hasFirstTribute={hasFirstTribute} onUpgrade={() => setActiveTab('settings')} />}

        {/* ── MAIN CONTENT ── */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 16px 0' }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {contributions.length > 0 && <StatPill label="Total" value={contributions.length} />}
                {capsule.approved_contrib_count > 0 && <StatPill label="Approved" value={capsule.approved_contrib_count} accent />}
                {pending.length > 0 && <StatPill label="Awaiting" value={pending.length} />}
                {capsule.event_date && <StatPill label="Days to go" value={Math.max(0, Math.ceil((new Date(capsule.event_date).getTime() - Date.now()) / 86400000))} />}
              </div>

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
                <Link href={`https://wa.me/?text=${encodeURIComponent(`You are invited to leave a tribute for ${capsule.honouree_name}: ${capsuleUrl}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)', color: 'rgba(134,239,172,0.85)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>💬 Share via WhatsApp</Link>
              </SectionCard>

              {pins.length > 0 && (
                <SectionCard title="World Tribute Map" subtitle={`${[...new Set(pins.map(p => p.country))].length} countries`}>
                  <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', border: `1px solid rgba(226,195,107,0.12)` }}>
                    <TributeMap pins={pins} locked={true} />
                  </div>
                </SectionCard>
              )}

              <Link href={`/for/${slug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.07)`, background: 'rgba(255,255,255,0.02)', color: textSecondary, textDecoration: 'none', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px' }}>View Public Tribute Wall ↗</Link>

              {/* ── ADD-ONS / SERVICES TABLE ── */}
              <SectionCard title="Capsule Services" subtitle="Tap any service to learn more — contact us to activate">
                <AddOnsTable capsuleComponents={capsule.components ?? []} onUpgrade={() => {
                  setActiveTab('settings')
                  setTimeout(() => {
                    document.getElementById('upgrade-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 150)
                }} />
              </SectionCard>
            </div>
          )}

          {/* ── TRIBUTES TAB ── */}
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

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div>
              <SectionCard title="Capsule Photo" subtitle="Appears on the tribute wall and profile">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid rgba(226,195,107,0.35)`, background: '#1a0845', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {resolvedHero
                      ? <img src={resolvedHero} alt={capsule.honouree_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.6))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LC</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '10px' }}>Upload a clear, high-quality image.</p>
                    <label style={{ display: 'inline-block', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', background: goldFaint, border: `1px solid rgba(226,195,107,0.22)`, color: gold, fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>
                      {heroUploading ? 'Uploading…' : '📷 Upload Photo'}
                      <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} disabled={heroUploading} />
                    </label>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Photo Gallery" subtitle="Up to 3 sections · 10 photos each · photo + caption per row">
                <GalleryEditor capsuleId={capsule.id} initialPhotos={galleryPhotos} supabase={supabase} t={galleryTheme} onSaved={fetchAll} />
              </SectionCard>

              <SectionCard title="Profile Sections" subtitle="No character limit — write as much as your event deserves">
                <SectionEditor capsuleId={capsule.id} sections={profileSections} onRefresh={fetchAll} />
              </SectionCard>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div>
              <SectionCard title="Capsule Details">
                <EditField label="Display Name" value={capsule.honouree_name} placeholder="Name as it appears on the tribute wall" onSave={async val => { await updateCapsule({ honouree_name: val }) }} />
                <EditField label="Honouree Title" value={capsule.honouree_title ?? ''} placeholder="e.g. Dr · Chief · Pastor · Prof (optional)" hint="Displayed beneath the name on the tribute wall." onSave={async val => { await updateCapsule({ honouree_title: val }) }} />
                <EditField label="Event Tag" value={capsule.event_tag ?? ''} placeholder="e.g. United In Love · 35 Years of Excellence" hint="Subtitle shown beneath the name on the tribute wall." onSave={async val => { await updateCapsule({ event_tag: val }) }} />
                <EditField label="Event Date" value={capsule.event_date ?? ''} type="date" hint="Used for the days-to-event countdown." onSave={async val => { await updateCapsule({ event_date: val }) }} />
                <EditField label="Capsule URL" value={capsule.slug} placeholder="your-capsule-slug" hint={`Your link: itslegacycapsule.com/for/${capsule.slug}`} onSave={async val => { const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'); await updateCapsule({ slug: clean }) }} />
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

              {/* Ways to Honour */}
              <SectionCard title="Ways to Honour" subtitle="Premium · Add bank accounts for guests to send support">
                <WaysToHonourEditor capsuleId={capsule.id} supabase={supabase} />
              </SectionCard>

              <div id="upgrade-form">
                <UpgradeCard capsuleName={capsule.honouree_name} />
              </div>
            </div>
          )}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} pendingCount={pending.length} />
      </div>
    </>
  )
}
