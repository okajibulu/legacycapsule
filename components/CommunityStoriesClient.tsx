'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/CommunityStoriesClient.tsx
// PURPOSE:   Community Stories room — guest-facing client component.
//            Redesigned: flat scrollable story feed first, topic explorer below.
//            Reactions (heart/prayer/star/sad/clap/dove) via story_reactions table.
//            Category filter on feed. Contributor topic creation per category.
//            SubmitStoryPanel preserved with grouped topic selector.
// ARCHITECTURE: LC02 LC05
// BUILT BY:  AI11 (original) · AI13 · AI14 · AI16 (full redesign)
// VERSION:   v3.0.0
// DATE:      9 August 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect, useRef, useCallback } from 'react'
import Link                                          from 'next/link'
import ActivePremiumsStrip                           from '@/components/ActivePremiumsStrip'
import type { CapsuleInfo, StoryTopic, CommunityStory } from '@/app/for/[slug]/stories/page'
import { getRelationshipQuestion, getRelationshipOptions } from '@/lib/utils/getRelationshipQuestion'

interface StoryPhoto {
  id:           string
  storage_path: string | null
  image_url?:   string | null
}

interface ReactionCounts {
  heart:  number
  prayer: number
  star:   number
  laugh:  number
  clap:   number
  thumbs: number
}

interface Props {
  capsule:        CapsuleInfo
  topics:         StoryTopic[]
  stories:        CommunityStory[]
  storyPhotos:    Record<string, StoryPhoto[]>
  hasPublication: boolean
}

// ═══ SECTION 2 — Design tokens ═══

const pageBg        = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)'
const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.08)'
const goldBorder    = 'rgba(226,195,107,0.18)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint     = 'rgba(255,255,255,0.28)'

const STORY_CHAR_LIMIT = 3000
const MAX_PHOTOS       = 3

// ═══ SECTION 3 — Category config ═══

const CATEGORY_ORDER = [
  'Personal Memories', 'Childhood & Early Life', 'Work & Achievements',
  'Faith & Values', 'Family', 'Funny Moments', 'Legacy & Impact', 'General',
]

const CATEGORY_ACCENTS: Record<string, string> = {
  'Personal Memories':      'rgba(226,195,107,0.08)',
  'Childhood & Early Life': 'rgba(147,197,253,0.06)',
  'Work & Achievements':    'rgba(134,239,172,0.06)',
  'Faith & Values':         'rgba(192,132,252,0.06)',
  'Family':                 'rgba(249,168,212,0.06)',
  'Funny Moments':          'rgba(253,186,116,0.06)',
  'Legacy & Impact':        'rgba(226,195,107,0.06)',
  'General':                'rgba(255,255,255,0.03)',
}

const CATEGORY_ICON: Record<string, string> = {
  'Personal Memories':      '✦',
  'Childhood & Early Life': '◎',
  'Work & Achievements':    '◈',
  'Faith & Values':         '◇',
  'Family':                 '❖',
  'Funny Moments':          '◉',
  'Legacy & Impact':        '⊙',
  'General':                '·',
}

// ═══ SECTION 4 — Reaction config ═══

const REACTIONS: { key: keyof ReactionCounts; emoji: string; label: string }[] = [
  { key: 'heart',  emoji: '❤️', label: 'Love'      },
  { key: 'prayer', emoji: '🙏', label: 'Grateful'  },
  { key: 'star',   emoji: '⭐', label: 'Inspiring' },
  { key: 'laugh',  emoji: '😂', label: 'Funny'     },
  { key: 'clap',   emoji: '👏', label: 'Celebrate' },
  { key: 'thumbs', emoji: '👍', label: 'Agree'     },
]

const EMPTY_COUNTS: ReactionCounts = { heart: 0, prayer: 0, star: 0, laugh: 0, clap: 0, thumbs: 0 }

// ═══ SECTION 5 — Device token (localStorage UUID) ═══

function getDeviceToken(): string {
  try {
    const key = 'lc_device_token'
    let token = localStorage.getItem(key)
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem(key, token)
    }
    return token
  } catch {
    return 'anon'
  }
}

// ═══ SECTION 6 — ReactionStrip sub-component ═══

function ReactionStrip({ storyId, capsuleId, initialCounts, initialMine }: {
  storyId:       string
  capsuleId:     string
  initialCounts: ReactionCounts
  initialMine:   Set<string>
}) {
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts)
  const [mine,   setMine]   = useState<Set<string>>(initialMine)
  const [busy,   setBusy]   = useState<string | null>(null)

  const toggle = async (key: keyof ReactionCounts) => {
    if (busy) return
    setBusy(key)
    const deviceToken = getDeviceToken()
    const isReacted   = mine.has(key)

    // Optimistic update
    setCounts(prev => ({ ...prev, [key]: prev[key] + (isReacted ? -1 : 1) }))
    setMine(prev => {
      const next = new Set(prev)
      isReacted ? next.delete(key) : next.add(key)
      return next
    })

    try {
      await fetch('/api/stories/react', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ story_id: storyId, capsule_id: capsuleId, reaction: key, device_token: deviceToken }),
      })
    } catch {
      // Revert on failure
      setCounts(prev => ({ ...prev, [key]: prev[key] + (isReacted ? 1 : -1) }))
      setMine(prev => {
        const next = new Set(prev)
        isReacted ? next.add(key) : next.delete(key)
        return next
      })
    }
    setBusy(null)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginTop: '12px' }}>
      {REACTIONS.map(({ key, emoji, label }) => {
        const isActive = mine.has(key)
        const count    = counts[key]
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            disabled={busy === key}
            title={label}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '4px',
              padding:      '4px 10px',
              borderRadius: '20px',
              border:       `1px solid ${isActive ? goldBorder : 'rgba(255,255,255,0.08)'}`,
              background:   isActive ? goldFaint : 'rgba(255,255,255,0.03)',
              cursor:       busy ? 'not-allowed' : 'pointer',
              opacity:      busy === key ? 0.6 : 1,
              transition:   'all 0.15s',
            }}
          >
            <span style={{ fontSize: '13px', lineHeight: 1 }}>{emoji}</span>
            {count > 0 && (
              <span style={{ fontSize: '10px', color: isActive ? gold : textFaint, fontWeight: 600 }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ═══ SECTION 7 — StoryCard sub-component ═══

function StoryCard({ story, photos, honoureeName, capsuleId, reactionCounts, myReactions, onShareUnder, serialNumber }: {
  story:          CommunityStory
  photos:         StoryPhoto[]
  honoureeName:   string
  capsuleId:      string
  reactionCounts: ReactionCounts
  myReactions:    Set<string>
  onShareUnder:   () => void
  serialNumber:   number
}) {
  const [expanded, setExpanded] = useState(false)
  const location = [story.city, story.country].filter(Boolean).join(', ')
  const isLong   = story.tribute_text.length > 300

  const topicDisplay = (story as any).community_story_topics?.topic_name
    ? (story as any).community_story_topics.topic_name.replace(/\[honouree_name\]/g, honoureeName)
    : null

  return (
    <div style={{
      padding:      '16px',
      borderRadius: '14px',
      border:       `1px solid ${cardBorder}`,
      background:   cardBg,
      marginBottom: '12px',
    }}>
      {/* ── Card header: Line 1 = Topic + Date, Line 2 = Serial + Name + Relationship ── */}
      <div style={{ marginBottom: '12px' }}>

        {/* Line 1 — Topic (prominent) + Date */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <p style={{
            margin: 0, fontSize: '13px', fontWeight: 700,
            color: topicDisplay ? gold : textFaint,
            fontStyle: topicDisplay ? 'italic' : 'normal',
            lineHeight: 1.4, flex: 1, minWidth: 0,
            overflow: 'visible', whiteSpace: 'normal', wordBreak: 'break-word' as const,
          }}>
            {topicDisplay
              ? `"${topicDisplay}"`
              : 'Community Memory'}
          </p>
          <span style={{ fontSize: '10px', color: textFaint, flexShrink: 0 }}>
            {new Date(story.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* Line 2 — Serial circle + Name + Relationship */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: goldFaint, border: `1px solid rgba(226,195,107,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '10px', color: goldMuted, fontWeight: 700 }}>
              {serialNumber}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: textSecondary }}>
            {story.contributor_name}
          </p>
          {story.relationship && (
            <>
              <span style={{ fontSize: '10px', color: textFaint }}>·</span>
              <span style={{ fontSize: '11px', color: goldMuted, fontWeight: 500 }}>
                My {story.relationship}
              </span>
            </>
          )}
          {location && (
            <>
              <span style={{ fontSize: '10px', color: textFaint }}>·</span>
              <span style={{ fontSize: '10px', color: textFaint }}>{location}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Story text ── */}
      <div>
        <p style={{
          margin: 0, fontSize: '13px', color: textSecondary, lineHeight: 1.8,
          display: '-webkit-box', WebkitBoxOrient: 'vertical' as const,
          WebkitLineClamp: expanded ? 'unset' : 4,
          overflow: expanded ? 'visible' : 'hidden',
          fontStyle: 'italic',
        }}>
          {story.tribute_text}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: '11px', color: goldMuted, background: 'none', border: 'none', padding: '6px 0 0', cursor: 'pointer', fontWeight: 600 }}
          >
            {expanded ? 'Read less ↑' : 'Read more ↓'}
          </button>
        )}
      </div>

      {/* ── Photos ── */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' as const }}>
          {photos.map(p => (
            <img
              key={p.id}
              src={p.image_url ?? p.storage_path ?? ''}
              alt=""
              style={{
                width: photos.length === 1 ? '100%' : '130px',
                height: photos.length === 1 ? 'auto' : '90px',
                maxHeight: '200px', borderRadius: '8px',
                objectFit: 'cover', flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Admin response ── */}
      {story.admin_response && (
        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(226,195,107,0.06)', borderLeft: '3px solid rgba(226,195,107,0.4)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '9px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
            Response from the family
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: textSecondary, lineHeight: 1.65, fontStyle: 'italic' }}>
            {story.admin_response}
          </p>
        </div>
      )}

      {/* ── Reaction strip ── */}
      <ReactionStrip
        storyId={story.id}
        capsuleId={capsuleId}
        initialCounts={reactionCounts}
        initialMine={myReactions}
      />

      {/* ── Add story under this topic ── */}
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
        <button
          onClick={onShareUnder}
          style={{ fontSize: '11px', color: goldMuted, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 600 }}
        >
          + Add your memory under this topic →
        </button>
      </div>
    </div>
  )
}

// ═══ SECTION 8 — AddTopicInline sub-component ═══

function AddTopicInline({ capsuleId, category, honoureeName, onAdded }: {
  capsuleId:    string
  category:     string
  honoureeName: string
  onAdded:      () => void
}) {
  const [open,   setOpen]   = useState(false)
  const [text,   setText]   = useState('')
  const [saving, setSaving] = useState(false)
  const [done,   setDone]   = useState(false)
  const [error,  setError]  = useState('')

  const handleAdd = async () => {
    if (!text.trim() || text.trim().length < 10) { setError('Please write at least 10 characters.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/community-topics', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId, topic_name: text.trim(), topic_source: 'community', category }),
      })
      if (!res.ok) throw new Error('Failed')
      setDone(true); setText('')
      setTimeout(() => { setDone(false); setOpen(false); onAdded() }, 1800)
    } catch { setError('Could not add topic. Please try again.') }
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: `1px solid ${goldBorder}`,
    color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  if (done) return (
    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' as const, marginTop: '16px' }}>
      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(134,239,172,0.8)', fontWeight: 600 }}>✓ Topic submitted — thank you!</p>
      <p style={{ margin: '4px 0 0', fontSize: '10px', color: textFaint }}>It will appear once approved.</p>
    </div>
  )

  return (
    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid rgba(226,195,107,0.06)` }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed ${goldBorder}`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}
        >
          + Add a topic to {category}
        </button>
      ) : (
        <div style={{ padding: '14px', borderRadius: '12px', background: goldFaint, border: `1px solid ${goldBorder}` }}>
          {/* Category reminder */}
          <div style={{ padding: '7px 10px', borderRadius: '7px', background: 'rgba(226,195,107,0.06)', border: `1px solid ${goldBorder}`, marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: goldMuted, lineHeight: 1.5 }}>
              📂 You are adding a topic under <strong style={{ color: gold }}>{category}</strong>. Make sure your topic fits here.
            </p>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Suggest a Topic</p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: textFaint, lineHeight: 1.6 }}>
            Propose a question or memory prompt others can respond to about {honoureeName}.
          </p>
          <textarea
            style={{ ...inp, minHeight: '80px', resize: 'none' as const, lineHeight: 1.6, marginBottom: '6px' }}
            placeholder={`e.g. "What is a lesson ${honoureeName.split(' ')[0]} taught you that you still carry today?"`}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={200}
          />
          <p style={{ margin: '0 0 8px', fontSize: '10px', color: textFaint, textAlign: 'right' as const }}>{text.length}/200</p>
          {error && <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAdd}
              disabled={saving || !text.trim()}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: text.trim() ? `linear-gradient(135deg,${gold},#C8A84A)` : 'rgba(255,255,255,0.06)', color: text.trim() ? '#1a0845' : textFaint, fontSize: '12px', fontWeight: 700, cursor: text.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Submitting…' : 'Submit Topic'}
            </button>
            <button
              onClick={() => { setOpen(false); setText(''); setError('') }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 9 — TopicExplorer sub-component ═══

function TopicExplorer({ topics, capsuleId, honoureeName, eventType, activeFilter, onFilter, onShare }: {
  topics:       StoryTopic[]
  capsuleId:    string
  honoureeName: string
  eventType:    string
  activeFilter: string | null
  onFilter:     (cat: string | null) => void
  onShare:      (topicId: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const allCategories = [
    ...CATEGORY_ORDER.filter(c => topics.some(t => (t.category ?? 'General') === c)),
    ...Array.from(new Set(topics.map(t => t.category ?? 'General'))).filter(c => !CATEGORY_ORDER.includes(c)),
  ]

  const categoryTopics = selectedCategory
    ? topics.filter(t => (t.category ?? 'General') === selectedCategory)
    : []

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat)
    onFilter(cat)
    setOpen(false)
  }

  const clearFilter = () => {
    setSelectedCategory(null)
    onFilter(null)
  }

  return (
    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '14px', border: `1px solid ${cardBorder}`, background: cardBg }}>
      <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: goldMuted }}>
        Explore & Contribute
      </p>
      <p style={{ margin: '0 0 14px', fontSize: '12px', color: textFaint, lineHeight: 1.6 }}>
        Browse by category to find a topic — or write under one that speaks to you.
      </p>

      {/* Category dropdown */}
      <div style={{ position: 'relative' as const, marginBottom: selectedCategory ? '14px' : '0' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            border: `1px solid ${selectedCategory ? gold : goldBorder}`,
            background: selectedCategory ? goldFaint : 'rgba(255,255,255,0.04)',
            color: selectedCategory ? gold : textSecondary,
            fontSize: '13px', fontWeight: selectedCategory ? 600 : 400,
            cursor: 'pointer', textAlign: 'left' as const,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span>
            {selectedCategory
              ? `${CATEGORY_ICON[selectedCategory] ?? '·'} ${selectedCategory}`
              : 'Browse by category…'}
          </span>
          <span style={{ color: textFaint, fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div style={{
            position:  'absolute' as const, top: 'calc(100% + 4px)', left: 0, right: 0,
            borderRadius: '12px', border: `1px solid ${goldBorder}`,
            background: '#1a0845', zIndex: 30,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            {selectedCategory && (
              <button
                onClick={clearFilter}
                style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'rgba(248,113,113,0.06)', color: 'rgba(248,113,113,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const, borderBottom: `1px solid ${cardBorder}` }}
              >
                ✕ Clear filter — show all stories
              </button>
            )}
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                style={{
                  width: '100%', padding: '11px 14px', border: 'none',
                  background: cat === selectedCategory ? goldFaint : 'transparent',
                  color: cat === selectedCategory ? gold : textSecondary,
                  fontSize: '13px', cursor: 'pointer', textAlign: 'left' as const,
                  borderBottom: `1px solid rgba(255,255,255,0.04)`,
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
              >
                <span style={{ color: goldMuted }}>{CATEGORY_ICON[cat] ?? '·'}</span>
                <span>{cat}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: textFaint }}>
                  {topics.filter(t => (t.category ?? 'General') === cat).length} topics
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Topics in selected category */}
      {selectedCategory && categoryTopics.length > 0 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '10px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 600 }}>
            Topics in {selectedCategory}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            {categoryTopics.map(topic => (
              <button
                key={topic.id}
                onClick={() => onShare(topic.id)}
                style={{
                  padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${CATEGORY_ACCENTS[selectedCategory] ? goldBorder : 'rgba(255,255,255,0.06)'}`,
                  background: CATEGORY_ACCENTS[selectedCategory] ?? 'rgba(255,255,255,0.02)',
                  color: textSecondary, fontSize: '12px', cursor: 'pointer',
                  textAlign: 'left' as const, lineHeight: 1.5,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px',
                }}
              >
                <span style={{ fontStyle: 'italic' }}>
                  "{topic.topic_name.replace(/\[honouree_name\]/g, honoureeName).slice(0, 80)}{topic.topic_name.length > 80 ? '…' : ''}"
                </span>
                <span style={{ color: goldMuted, flexShrink: 0, fontSize: '11px', marginTop: '1px' }}>
                  Write →
                </span>
              </button>
            ))}
          </div>

          <AddTopicInline
            capsuleId={capsuleId}
            category={selectedCategory}
            honoureeName={honoureeName}
            onAdded={() => window.location.reload()}
          />
        </div>
      )}

      {selectedCategory && categoryTopics.length === 0 && (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center' as const, padding: '12px 0 4px' }}>
          No topics in this category yet.
        </p>
      )}
    </div>
  )
}

// ═══ SECTION 10 — SubmitStoryPanel ═══

function SubmitStoryPanel({ capsule, topics, hasPublication, onClose, onSuccess, defaultTopicId }: {
  capsule:         CapsuleInfo
  topics:          StoryTopic[]
  hasPublication:  boolean
  onClose:         () => void
  onSuccess:       () => void
  defaultTopicId?: string
}) {
  const [name,              setName]              = useState('')
  const [email,             setEmail]             = useState('')
  const [topicId,           setTopicId]           = useState(defaultTopicId ?? topics[0]?.id ?? '')
  const [text,              setText]              = useState('')
  const [relationship,      setRelationship]      = useState('')
  const [customRel,         setCustomRel]         = useState('')
  const [photoFiles,        setPhotoFiles]        = useState<File[]>([])
  const [submitting,        setSubmitting]        = useState(false)
  const [error,             setError]             = useState('')
  const [showNewTopic,      setShowNewTopic]      = useState(false)
  const [newTopicText,      setNewTopicText]      = useState('')
  const [newTopicSaving,    setNewTopicSaving]    = useState(false)
  const [newTopicSubmitted, setNewTopicSubmitted] = useState(false)
  const [newTopicError,     setNewTopicError]     = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNewTopicSubmit = async () => {
    if (!newTopicText.trim() || newTopicText.trim().length < 10) { setNewTopicError('Please write at least 10 characters.'); return }
    setNewTopicSaving(true); setNewTopicError('')
    try {
      const res = await fetch('/api/community-topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsule.id, topic_name: newTopicText.trim(), topic_source: 'community', category: 'General' }),
      })
      if (!res.ok) throw new Error('Failed')
      setNewTopicSubmitted(true)
    } catch { setNewTopicError('Could not submit. Please try again.') }
    setNewTopicSaving(false)
  }

  const remaining         = STORY_CHAR_LIMIT - text.length
  const finalRelationship = relationship === 'Other' ? customRel.trim() : relationship

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (photoFiles.length + files.length > MAX_PHOTOS) { setError(`Maximum ${MAX_PHOTOS} photos`); return }
    setPhotoFiles(prev => [...prev, ...files]); setError('')
  }

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !topicId) return
    if (text.length > STORY_CHAR_LIMIT) { setError(`Story must be ${STORY_CHAR_LIMIT} characters or fewer`); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/community-topics/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id:            capsule.id,
          capsule_slug:          capsule.slug,
          story_topic_id:        topicId || null,
          contributor_name:      name.trim(),
          email:                 email.trim() || undefined,
          tribute_text:          text.trim(),
          relationship:          finalRelationship || undefined,
          relationship_category: relationship || undefined,
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      const data = await res.json()
      const contributionId = data.id ?? data.contribution_id

      if (photoFiles.length > 0 && contributionId) {
        for (const file of photoFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('capsule_id', capsule.id)
          formData.append('contribution_id', contributionId)
          formData.append('source', 'stories')
          await fetch('/api/dday/upload', { method: 'POST', body: formData })
        }
      }

      if (email.trim() && email.includes('@')) {
        fetch('/api/publication/subscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capsule_id: capsule.id, name: name.trim(), email: email.trim().toLowerCase(), source: 'stories' }),
        }).catch(() => {})
      }

      onSuccess()
    } catch { setError('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: `1px solid ${goldBorder}`,
    color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  const selectedTopic  = topics.find(t => t.id === topicId)
  const promptDisplay  = selectedTopic
    ? selectedTopic.topic_name.replace(/\[honouree_name\]/g, capsule.honouree_name)
    : null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(8,2,20,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '540px', background: 'linear-gradient(160deg,#1a0845,#120630)', borderRadius: '20px 20px 0 0', padding: '24px 20px 140px', maxHeight: '92vh', overflowY: 'auto' as const }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>Share a Memory</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        {/* Selected topic prompt */}
        {promptDisplay && (
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.06)', border: `1px solid ${goldBorder}`, marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: goldMuted, fontStyle: 'italic', lineHeight: 1.6 }}>
              "{promptDisplay}"
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          <input style={inp} placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} />

          <div>
            <input type="email" style={inp} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            <p style={{ margin: '5px 0 0', fontSize: '10px', color: textFaint, lineHeight: 1.5, paddingLeft: '2px' }}>
              We will send you the keepsake publication when this record is ready.
            </p>
          </div>

          <select style={{ ...inp, background: '#1a0845' }} value={relationship} onChange={e => setRelationship(e.target.value)}>
            <option value="">{getRelationshipQuestion(capsule.event_type, capsule.honouree_name)}</option>
            {getRelationshipOptions(capsule.event_type).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {relationship === 'Other' && (
            <input style={inp} placeholder="Describe your relationship…" value={customRel} onChange={e => setCustomRel(e.target.value)} />
          )}

          {/* Grouped topic selector */}
          {topics.length > 1 && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: goldMuted, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                Choose a topic
              </p>
              <select
                style={{ ...inp, background: '#1a0845' }}
                value={topicId}
                onChange={e => {
                  if (e.target.value === '__new__') { setShowNewTopic(true); setTopicId(topics[0]?.id ?? '') }
                  else { setTopicId(e.target.value); setShowNewTopic(false) }
                }}
              >
                {(() => {
                  const grouped: Record<string, typeof topics> = {}
                  topics.forEach(t => {
                    const cat = t.category ?? 'General'
                    if (!grouped[cat]) grouped[cat] = []
                    grouped[cat].push(t)
                  })
                  const orderedCats = [
                    ...CATEGORY_ORDER.filter(c => grouped[c]),
                    ...Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)),
                  ]
                  return orderedCats.map(cat => (
                    <optgroup key={cat} label={cat}>
                      {grouped[cat].map((t: StoryTopic) => (
                        <option key={t.id} value={t.id}>
                          {t.topic_name.replace(/\[honouree_name\]/g, capsule.honouree_name).slice(0, 70)}
                        </option>
                      ))}
                    </optgroup>
                  ))
                })()}
                <optgroup label="─────────────">
                  <option value="__new__">+ Suggest a new topic…</option>
                </optgroup>
              </select>
            </div>
          )}

          {/* Suggest new topic */}
          {showNewTopic && (
            <div style={{ padding: '14px', borderRadius: '12px', background: goldFaint, border: `1px solid ${goldBorder}` }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Suggest a New Topic</p>
              <p style={{ margin: '0 0 10px', fontSize: '11px', color: textFaint, lineHeight: 1.6 }}>Can't find the right topic? Suggest one — it will be reviewed and added if approved.</p>
              <textarea
                style={{ ...inp, minHeight: '72px', resize: 'none' as const, lineHeight: 1.6, marginBottom: '6px' }}
                placeholder={`e.g. "What did ${capsule.honouree_name.split(' ')[0]} teach you that you still carry today?"`}
                value={newTopicText}
                onChange={e => setNewTopicText(e.target.value)}
                maxLength={200}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>{newTopicText.length}/200</p>
                {newTopicSubmitted && <p style={{ margin: 0, fontSize: '11px', color: 'rgba(134,239,172,0.8)', fontWeight: 600 }}>✓ Topic submitted</p>}
              </div>
              {newTopicError && <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{newTopicError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleNewTopicSubmit}
                  disabled={newTopicSaving || !newTopicText.trim() || newTopicSubmitted}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: newTopicText.trim() && !newTopicSubmitted ? `linear-gradient(135deg,${gold},#C8A84A)` : 'rgba(255,255,255,0.06)', color: newTopicText.trim() && !newTopicSubmitted ? '#1a0845' : textFaint, fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: newTopicSaving ? 0.6 : 1 }}>
                  {newTopicSaving ? 'Submitting…' : newTopicSubmitted ? 'Submitted ✓' : 'Submit Topic'}
                </button>
                <button onClick={() => { setShowNewTopic(false); setNewTopicText(''); setNewTopicError('') }} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Story textarea */}
          <div>
            <textarea
              style={{ ...inp, minHeight: '140px', resize: 'vertical' as const, lineHeight: 1.75 }}
              placeholder="Write your memory, lesson or story here…"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={STORY_CHAR_LIMIT}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: remaining < 100 ? 'rgba(248,113,113,0.7)' : textFaint }}>{remaining} remaining</span>
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />
            <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '12px', color: goldMuted, background: 'none', border: `1px dashed ${goldBorder}`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
              📷 Add photos ({photoFiles.length}/{MAX_PHOTOS})
            </button>
            {photoFiles.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto' as const }}>
                {photoFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative' as const, flexShrink: 0 }}>
                    <img src={URL.createObjectURL(f)} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button onClick={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute' as const, top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(248,113,113,0.9)', border: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !text.trim() || !topicId}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: name.trim() && text.trim() && topicId ? `linear-gradient(135deg,${gold},#C8A84A)` : 'rgba(255,255,255,0.06)', color: name.trim() && text.trim() && topicId ? '#1a0845' : textFaint, fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting…' : 'Share This Memory'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 11 — Main component ═══

export default function CommunityStoriesClient({ capsule, topics, stories, storyPhotos, hasPublication }: Props) {

  // ── 11.1 State ──────────────────────────────────────────────────────────────

  const [submitting,      setSubmitting]      = useState(false)
  const [submitted,       setSubmitted]       = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [activeFilter,    setActiveFilter]    = useState<string | null>(null)
  const [reactionCounts,  setReactionCounts]  = useState<Record<string, ReactionCounts>>({})
  const [myReactions,     setMyReactions]     = useState<Record<string, Set<string>>>({})

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}/stories`

  // ── 11.2 Load reactions ─────────────────────────────────────────────────────

  useEffect(() => {
    if (stories.length === 0) return
    const storyIds    = stories.map(s => s.id)
    const deviceToken = getDeviceToken()

    fetch(`/api/stories/reactions?story_ids=${storyIds.join(',')}&device_token=${deviceToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.counts)    setReactionCounts(data.counts)
        if (data.my_reactions) {
          const parsed: Record<string, Set<string>> = {}
          Object.entries(data.my_reactions).forEach(([id, reacts]) => {
            parsed[id] = new Set(reacts as string[])
          })
          setMyReactions(parsed)
        }
      })
      .catch(() => {})
  }, [stories])

  // ── 11.3 Handlers ───────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  const handleShareUnder = (topicId: string) => {
    setSelectedTopicId(topicId)
    setSubmitting(true)
  }

  const handleOpenPanel = () => {
    setSelectedTopicId(null)
    setSubmitting(true)
  }

  // ── 11.4 Filtered stories ───────────────────────────────────────────────────

  const filteredStories = activeFilter
    ? stories.filter(s => {
        const topicForStory = topics.find(t => t.id === s.story_topic_id)
        return (topicForStory?.category ?? 'General') === activeFilter
      })
    : stories

  // ── 11.5 Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: '100px' }}>

      {/* ── Page header ── */}
      <div style={{ padding: '24px 20px 16px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: goldMuted, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
              Community Memories & Stories
            </p>
            <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.2 }}>
              {capsule.honouree_name}
            </h1>
            {capsule.event_tag && (
              <p style={{ margin: 0, fontSize: '13px', color: textFaint, fontStyle: 'italic' }}>{capsule.event_tag}</p>
            )}
          </div>
          <button
            onClick={handleOpenPanel}
            style={{ flexShrink: 0, padding: '9px 16px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${gold},#C8A84A)`, color: '#1a0845', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
          >
            + Share a Memory
          </button>
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.25), transparent)', margin: '16px 0 0' }} />
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── Active filter chip ── */}
        {activeFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', color: goldMuted, fontWeight: 600 }}>
              Showing: {activeFilter}
            </span>
            <button
              onClick={() => setActiveFilter(null)}
              style={{ fontSize: '10px', color: textFaint, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '3px 8px', cursor: 'pointer' }}
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* ── Story feed — fixed height scrollable ── */}
        {stories.length === 0 ? (

          /* ── Empty state ── */
          <div style={{
            padding: '40px 24px', textAlign: 'center' as const,
            borderRadius: '16px', border: `1px solid ${cardBorder}`,
            background: cardBg, marginBottom: '20px',
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: goldFaint, border: '1px solid rgba(226,195,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}>
              📖
            </div>
            <p style={{ fontSize: '16px', fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: textSecondary, lineHeight: 1.8, margin: '0 auto 8px', maxWidth: '320px' }}>
              "Every life worth celebrating has chapters that deserve to be told.
            </p>
            <p style={{ fontSize: '16px', fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: textSecondary, lineHeight: 1.8, margin: '0 auto 8px', maxWidth: '320px' }}>
              This is where those chapters live.
            </p>
            <p style={{ fontSize: '16px', fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: goldMuted, lineHeight: 1.8, margin: '0 auto 24px', maxWidth: '320px' }}>
              Be the first to write one for {capsule.honouree_name}."
            </p>
            <button
              onClick={handleOpenPanel}
              style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${gold},#C8A84A)`, color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Share the First Memory
            </button>
          </div>

        ) : (

          /* ── Stories feed — fixed height scrollable ── */
          <div>
            {/* Feed header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 600 }}>
                {filteredStories.length} {filteredStories.length === 1 ? 'memory' : 'memories'} {activeFilter ? `in ${activeFilter}` : 'shared'}
              </p>
            </div>

            {/* Fixed-height scrollable container — ~1.5 cards visible */}
            <div style={{
              height:     '420px',
              overflowY:  'auto',
              paddingRight: '4px',
              scrollbarWidth: 'thin',
              scrollbarColor: `rgba(226,195,107,0.2) transparent`,
            }}>
              {filteredStories.length === 0 ? (
                <div style={{ textAlign: 'center' as const, padding: '40px 20px' }}>
                  <p style={{ fontSize: '13px', color: textFaint }}>No memories in this category yet.</p>
                  <button onClick={handleOpenPanel} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', border: `1px solid ${goldBorder}`, background: goldFaint, color: goldMuted, fontSize: '12px', cursor: 'pointer' }}>
                    Be the first to share one →
                  </button>
                </div>
              ) : (
                filteredStories.map((story, idx) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    photos={storyPhotos[story.id] ?? []}
                    honoureeName={capsule.honouree_name}
                    capsuleId={capsule.id}
                    reactionCounts={reactionCounts[story.id] ?? { ...EMPTY_COUNTS }}
                    myReactions={myReactions[story.id] ?? new Set()}
                    serialNumber={filteredStories.length - idx}
                    onShareUnder={() => {
                      const topic = topics.find(t => t.id === story.story_topic_id)
                      if (topic) handleShareUnder(topic.id)
                      else handleOpenPanel()
                    }}
                  />
                ))
              )}
            </div>

            {/* Subtle scroll hint */}
            <p style={{ textAlign: 'center' as const, fontSize: '10px', color: textFaint, margin: '8px 0 0', letterSpacing: '0.06em' }}>
              ↕ scroll to read more
            </p>
          </div>
        )}

        {/* ── Topic Explorer — category dropdown + topics ── */}
        <TopicExplorer
          topics={topics}
          capsuleId={capsule.id}
          honoureeName={capsule.honouree_name}
          eventType={capsule.event_type}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          onShare={handleShareUnder}
        />

        {/* ── Premiums strip ── */}
        <ActivePremiumsStrip slug={capsule.slug} components={capsule.components ?? []} />

        {/* ── Share strip ── */}
        <div style={{ padding: '16px', borderRadius: '14px', background: goldFaint, border: `1px solid ${cardBorder}`, marginTop: '20px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: goldMuted, letterSpacing: '0.08em' }}>
            Share this room
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: textFaint, lineHeight: 1.55 }}>
            Every person who shares their memory makes this record more complete.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
            <button
              onClick={() => {
                const t = encodeURIComponent(`${capsule.honouree_name}'s story is being preserved — share your memory: ${shareUrl}`)
                window.open(`https://wa.me/?text=${t}`, '_blank')
              }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.04)', color: 'rgba(134,239,172,0.8)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* ── Back to The Voices ── */}
        <div style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Link href={`/for/${capsule.slug}`} style={{ fontSize: '12px', color: textFaint, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            ← Back to The Voices
          </Link>
        </div>
      </div>

      {/* ── Submission panel ── */}
      {submitting && (
        <SubmitStoryPanel
          capsule={capsule}
          topics={selectedTopicId
            ? topics.filter(t => t.id === selectedTopicId).concat(topics.filter(t => t.id !== selectedTopicId))
            : topics
          }
          hasPublication={hasPublication}
          defaultTopicId={selectedTopicId ?? undefined}
          onClose={() => { setSubmitting(false); setSelectedTopicId(null) }}
          onSuccess={() => { setSubmitting(false); setSelectedTopicId(null); setSubmitted(true) }}
        />
      )}

      {/* ── Success confirmation ── */}
      {submitted && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,2,20,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '320px', width: '100%', background: 'linear-gradient(145deg,#1e0d4e,#2a1060)', border: `1px solid rgba(226,195,107,0.25)`, borderRadius: '20px', padding: '32px 24px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📖</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>
              Your memory has been received
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: textFaint, lineHeight: 1.7 }}>
              It will be reviewed and added to this record. Every word you shared helps preserve this story for those who come after.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${gold},#C8A84A)`, color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Continue Reading
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
