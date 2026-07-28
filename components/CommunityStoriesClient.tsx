'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/CommunityStoriesClient.tsx
// PURPOSE: Community Memories & Stories room — guest-facing client component.
//          Two-level navigation: category summary → topic detail + stories.
//          Category summary shows prompt count and response count per group.
//          Drill-in view shows topics and stories for one category with back button.
//          Submission panel preserved exactly from previous version.
// ARCHITECTURE: LC02 LC05
// BUILT BY: AI11 (original), AI13 (updates)
// UPDATED: AI14 · Claude Sonnet 4.6 · July 2026
//   — Two-level category navigation replacing flat carousel
//   — CategorySummaryCard sub-component
//   — CategoryDetailView sub-component
//   — All SubmitStoryPanel, StoryCard, TopicSection logic preserved
// VERSION: v2.2.0
// DATE: 28 July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useRef } from 'react'
import Link                 from 'next/link'
import ActivePremiumsStrip  from '@/components/ActivePremiumsStrip'
import type { CapsuleInfo, StoryTopic, CommunityStory } from '@/app/for/[slug]/stories/page'

interface StoryPhoto {
  id:           string
  storage_path: string | null
  image_url?:   string | null
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
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint     = 'rgba(255,255,255,0.28)'

const STORY_CHAR_LIMIT = 2000
const MAX_PHOTOS       = 3

const RELATIONSHIP_OPTIONS = [
  'Family', 'Close Friend', 'Friend', 'Colleague', 'Classmate',
  'Neighbour', 'Church / Mosque', 'Mentor', 'Student',
  'Community Member', 'Other',
]

const ERA_OPTIONS = [
  'The 1950s', 'The 1960s', 'The 1970s', 'The 1980s',
  'The 1990s', 'The 2000s', 'The 2010s', 'Recent Years',
]

// ═══ SECTION 3 — Category colour accents ═══
// Each category gets a subtle accent so they're visually distinct

const CATEGORY_ACCENTS: Record<string, string> = {
  'Personal Memories':     'rgba(226,195,107,0.15)',
  'Childhood & Early Life': 'rgba(147,197,253,0.12)',
  'Work & Achievements':   'rgba(134,239,172,0.12)',
  'Faith & Values':        'rgba(192,132,252,0.12)',
  'Family':                'rgba(249,168,212,0.12)',
  'Funny Moments':         'rgba(253,186,116,0.12)',
  'Legacy & Impact':       'rgba(226,195,107,0.10)',
  'General':               'rgba(255,255,255,0.04)',
}

const CATEGORY_BORDER: Record<string, string> = {
  'Personal Memories':     'rgba(226,195,107,0.25)',
  'Childhood & Early Life': 'rgba(147,197,253,0.2)',
  'Work & Achievements':   'rgba(134,239,172,0.2)',
  'Faith & Values':        'rgba(192,132,252,0.2)',
  'Family':                'rgba(249,168,212,0.2)',
  'Funny Moments':         'rgba(253,186,116,0.2)',
  'Legacy & Impact':       'rgba(226,195,107,0.18)',
  'General':               'rgba(255,255,255,0.08)',
}

const CATEGORY_ICON: Record<string, string> = {
  'Personal Memories':     '✦',
  'Childhood & Early Life': '◎',
  'Work & Achievements':   '◈',
  'Faith & Values':        '◇',
  'Family':                '❖',
  'Funny Moments':         '◉',
  'Legacy & Impact':       '⊙',
  'General':               '·',
}

// ═══ SECTION 4 — StoryCard ═══

function StoryCard({ story, photos, honoureeName }: {
  story:         CommunityStory
  photos:        StoryPhoto[]
  honoureeName:  string
}) {
  const [expanded, setExpanded] = useState(false)
  const location = [story.city, story.country].filter(Boolean).join(', ')
  const isLong   = story.tribute_text.length > 280

  return (
    <div style={{
      padding: '16px', borderRadius: '12px',
      border: `1px solid ${cardBorder}`, background: cardBg,
      marginBottom: '10px',
    }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: goldFaint, border: `1px solid rgba(226,195,107,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px', color: goldMuted, fontWeight: 700 }}>
            {story.contributor_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: textPrimary }}>
            {story.contributor_name}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center', marginTop: '2px' }}>
            {story.relationship && (
              <span style={{ fontSize: '10px', color: goldMuted, fontWeight: 600 }}>{story.relationship}</span>
            )}
            {story.relationship && location && <span style={{ fontSize: '10px', color: textFaint }}>·</span>}
            {location && <span style={{ fontSize: '10px', color: textFaint }}>{location}</span>}
            {(story as any).era && (
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '10px',
                background: 'rgba(226,195,107,0.08)', border: '1px solid rgba(226,195,107,0.15)',
                color: goldMuted, fontWeight: 600,
              }}>
                {(story as any).era}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Story text */}
      <div>
        <p style={{
          margin: 0, fontSize: '13px', color: textSecondary, lineHeight: 1.75,
          display: '-webkit-box', WebkitBoxOrient: 'vertical' as const,
          WebkitLineClamp: expanded ? 'unset' : 3,
          overflow: expanded ? 'visible' : 'hidden',
        }}>
          {story.tribute_text}
        </p>
        {isLong && (
          <button onClick={() => setExpanded(e => !e)} style={{
            fontSize: '11px', color: goldMuted, background: 'none',
            border: 'none', padding: '4px 0 0', cursor: 'pointer', fontWeight: 600,
          }}>
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Inline photos */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' as const }}>
          {photos.map(p => (
            <img
              key={p.id}
              src={p.image_url ?? p.storage_path ?? ''}
              alt=""
              style={{
                width: photos.length === 1 ? '100%' : '140px',
                height: photos.length === 1 ? 'auto' : '100px',
                maxHeight: '200px', borderRadius: '8px',
                objectFit: 'cover', flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Admin response */}
      {story.admin_response && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(226,195,107,0.06)', borderLeft: '3px solid rgba(226,195,107,0.4)',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '9px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
            Response from the family
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: textSecondary, lineHeight: 1.65, fontStyle: 'italic' }}>
            {story.admin_response}
          </p>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 5 — TopicSection ═══

function TopicSection({ topic, stories, photos, honoureeName, onShare }: {
  topic:        StoryTopic
  stories:      CommunityStory[]
  photos:       Record<string, StoryPhoto[]>
  honoureeName: string
  onShare:      () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible     = showAll ? stories : stories.slice(0, 3)
  const displayName = topic.topic_name.replace(/\[honouree_name\]/g, honoureeName)

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '12px', gap: '10px',
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            margin: 0, fontSize: '14px', fontWeight: 700, color: textPrimary,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            "{displayName}"
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '10px', color: textFaint }}>
            {topic.story_count} {topic.story_count === 1 ? 'memory' : 'memories'}
          </p>
        </div>
        <button onClick={onShare} style={{
          fontSize: '11px', fontWeight: 600, padding: '6px 14px',
          borderRadius: '20px', border: `1px solid rgba(226,195,107,0.25)`,
          background: goldFaint, color: goldMuted, cursor: 'pointer', flexShrink: 0,
        }}>
          + Share
        </button>
      </div>

      {visible.map(s => (
        <StoryCard key={s.id} story={s} photos={photos[s.id] ?? []} honoureeName={honoureeName} />
      ))}

      {stories.length > 3 && (
        <button onClick={() => setShowAll(v => !v)} style={{
          width: '100%', padding: '9px', borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
          color: textFaint, fontSize: '11px', cursor: 'pointer', marginTop: '4px',
        }}>
          {showAll ? 'Show fewer' : `Show ${stories.length - 3} more`}
        </button>
      )}
    </div>
  )
}

// ═══ SECTION 6 — CategorySummaryCard ═══

function CategorySummaryCard({ name, topicCount, responseCount, onClick }: {
  name:          string
  topicCount:    number
  responseCount: number
  onClick:       () => void
}) {
  const accent = CATEGORY_ACCENTS[name] ?? CATEGORY_ACCENTS['General']
  const border = CATEGORY_BORDER[name]  ?? CATEGORY_BORDER['General']
  const icon   = CATEGORY_ICON[name]   ?? '·'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '16px 18px',
        borderRadius: '14px', border: `1px solid ${border}`,
        background: accent, cursor: 'pointer',
        textAlign: 'left' as const,
        display: 'flex', alignItems: 'center', gap: '14px',
        marginBottom: '10px', transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '18px', color: goldMuted, flexShrink: 0, lineHeight: 1 }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '14px', fontWeight: 700,
          color: textPrimary, lineHeight: 1.3,
        }}>
          {name}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: textFaint }}>
          {topicCount} {topicCount === 1 ? 'prompt' : 'prompts'} ·{' '}
          <span style={{ color: responseCount > 0 ? goldMuted : textFaint }}>
            {responseCount} {responseCount === 1 ? 'memory' : 'memories'}
          </span>
        </p>
      </div>
      <span style={{ fontSize: '16px', color: textFaint, flexShrink: 0 }}>→</span>
    </button>
  )
}

// ═══ SECTION 7 — CategoryDetailView ═══

function CategoryDetailView({ category, topics, stories, photos, honoureeName, onBack, onShare }: {
  category:     string
  topics:       StoryTopic[]
  stories:      CommunityStory[]
  photos:       Record<string, StoryPhoto[]>
  honoureeName: string
  onBack:       () => void
  onShare:      (topicId: string) => void
}) {
  const categoryTopics  = topics.filter(t => (t.category ?? 'General') === category)
  const topicsWithStories = categoryTopics.filter(t => t.story_count > 0)
  const topicsWithoutStories = categoryTopics.filter(t => t.story_count === 0)

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none',
          color: goldMuted, fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', padding: '0 0 16px', letterSpacing: '0.04em',
        }}
      >
        ← All Categories
      </button>

      {/* Category header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontSize: '10px', color: goldMuted, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase' as const,
          margin: '0 0 4px',
        }}>
          {category}
        </p>
        <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
          {categoryTopics.length} {categoryTopics.length === 1 ? 'prompt' : 'prompts'} ·{' '}
          {categoryTopics.reduce((sum, t) => sum + t.story_count, 0)} memories shared
        </p>
      </div>

      {/* Unanswered prompts — shown as cards to invite response */}
      {topicsWithoutStories.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '10px', color: textFaint,
            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
            margin: '0 0 10px', fontWeight: 600,
          }}>
            Be the first to answer
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {topicsWithoutStories.map(topic => {
              const displayText = topic.topic_name.replace(/\[honouree_name\]/g, honoureeName)
              return (
                <button
                  key={topic.id}
                  onClick={() => onShare(topic.id)}
                  style={{
                    textAlign: 'left' as const, padding: '14px 16px',
                    borderRadius: '12px', border: `1px solid ${cardBorder}`,
                    background: cardBg, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: 0, fontSize: '13px', color: textPrimary,
                      lineHeight: 1.6, fontStyle: 'italic',
                      fontFamily: "'Playfair Display', serif",
                    }}>
                      "{displayText}"
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '10px', color: goldMuted, fontWeight: 600 }}>
                      No memories yet — share yours
                    </p>
                  </div>
                  <span style={{ fontSize: '14px', color: goldMuted, flexShrink: 0 }}>+</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Topics with stories */}
      {topicsWithStories.map(topic => (
        <TopicSection
          key={topic.id}
          topic={topic}
          stories={stories.filter(s => s.story_topic_id === topic.id)}
          photos={photos}
          honoureeName={honoureeName}
          onShare={() => onShare(topic.id)}
        />
      ))}

      {categoryTopics.length === 0 && (
        <div style={{ textAlign: 'center' as const, padding: '32px 20px', color: textFaint }}>
          <p style={{ fontSize: '13px' }}>No prompts in this category yet.</p>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 8 — SubmitStoryPanel (unchanged from AI11/AI13) ═══

function SubmitStoryPanel({ capsule, topics, hasPublication, onClose, onSuccess }: {
  capsule:        CapsuleInfo
  topics:         StoryTopic[]
  hasPublication: boolean
  onClose:        () => void
  onSuccess:      () => void
}) {
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [topicId,      setTopicId]      = useState(topics[0]?.id ?? '')
  const [text,         setText]         = useState('')
  const [relationship, setRelationship] = useState('')
  const [customRel,    setCustomRel]    = useState('')
  const [era,          setEra]          = useState('')
  const [photoFiles,   setPhotoFiles]   = useState<File[]>([])
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const remaining          = STORY_CHAR_LIMIT - text.length
  const finalRelationship  = relationship === 'Other' ? customRel.trim() : relationship

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const total = photoFiles.length + files.length
    if (total > MAX_PHOTOS) { setError(`Maximum ${MAX_PHOTOS} photos per memory`); return }
    setPhotoFiles(prev => [...prev, ...files])
    setError('')
  }

  const removePhoto = (idx: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !topicId) return
    if (text.length > STORY_CHAR_LIMIT) { setError(`Story must be ${STORY_CHAR_LIMIT} characters or fewer`); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/community-topics/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:            capsule.id,
          story_topic_id:        topicId,
          contributor_name:      name.trim(),
          contributor_email:     email.trim() || undefined,
          tribute_text:          text.trim(),
          relationship:          finalRelationship || undefined,
          era:                   era || undefined,
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
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ capsule_id: capsule.id, name: name.trim(), email: email.trim().toLowerCase(), source: 'stories' }),
        }).catch(() => {})
      }

      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
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
        style={{ width: '100%', maxWidth: '540px', background: 'linear-gradient(160deg,#1a0845,#120630)', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', maxHeight: '92vh', overflowY: 'auto' as const }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>Share a Memory</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        {promptDisplay && (
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.06)', border: '1px solid rgba(226,195,107,0.15)', marginBottom: '14px' }}>
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
            <option value="">Your relationship to {capsule.honouree_name}</option>
            {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {relationship === 'Other' && (
            <input style={inp} placeholder="Describe your relationship..." value={customRel} onChange={e => setCustomRel(e.target.value)} />
          )}

          <select style={{ ...inp, background: '#1a0845' }} value={era} onChange={e => setEra(e.target.value)}>
            <option value="">When was this? (optional)</option>
            {ERA_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {topics.length > 1 && (
            <select style={{ ...inp, background: '#1a0845' }} value={topicId} onChange={e => setTopicId(e.target.value)}>
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.topic_name.replace(/\[honouree_name\]/g, capsule.honouree_name).slice(0, 60)}
                </option>
              ))}
            </select>
          )}

          <div>
            <textarea
              style={{ ...inp, minHeight: '120px', resize: 'vertical' as const }}
              placeholder="Share your memory, story, or experience..."
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={STORY_CHAR_LIMIT}
            />
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: remaining < 100 ? 'rgba(248,113,113,0.7)' : textFaint, textAlign: 'right' as const }}>
              {remaining} characters remaining
            </p>
          </div>

          <div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoFiles.length >= MAX_PHOTOS}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px dashed rgba(226,195,107,0.2)', background: 'transparent', color: photoFiles.length >= MAX_PHOTOS ? textFaint : goldMuted, fontSize: '12px', fontWeight: 600, cursor: photoFiles.length >= MAX_PHOTOS ? 'default' : 'pointer' }}
            >
              + Add photos ({photoFiles.length}/{MAX_PHOTOS})
            </button>
            {photoFiles.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' as const }}>
                {photoFiles.map((file, i) => (
                  <div key={i} style={{ position: 'relative' as const }}>
                    <img src={URL.createObjectURL(file)} alt="" style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' as const }} />
                    <button onClick={() => removePhoto(i)} style={{ position: 'absolute' as const, top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(248,113,113,0.9)', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ margin: '5px 0 0', fontSize: '10px', color: textFaint, lineHeight: 1.5, paddingLeft: '2px' }}>
              Old photos, nostalgic snapshots, meaningful moments. Photos will be compressed automatically.
            </p>
          </div>

          {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', margin: 0 }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !text.trim()}
            style={{ padding: '13px', borderRadius: '12px', border: 'none', background: name.trim() && text.trim() ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.06)', color: name.trim() && text.trim() ? '#1a0845' : textFaint, fontSize: '14px', fontWeight: 700, cursor: name.trim() && text.trim() ? 'pointer' : 'not-allowed' }}
          >
            {submitting ? 'Sharing...' : 'Share Memory'}
          </button>

          <p style={{ fontSize: '10px', color: textFaint, textAlign: 'center' as const, lineHeight: 1.6, margin: 0 }}>
            Your memory will be reviewed before appearing in this record.
            {email ? ' We will also send you the keepsake publication after the event.' : ' Add your email above to receive the keepsake publication after the event.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══ SECTION 9 — Main component ═══

export default function CommunityStoriesClient({ capsule, topics, stories, storyPhotos, hasPublication }: Props) {

  // ── 9.1 State ──────────────────────────────────────────────────────────────

  const [submitting,       setSubmitting]       = useState(false)
  const [submitted,        setSubmitted]        = useState(false)
  const [copied,           setCopied]           = useState(false)
  const [selectedTopicId,  setSelectedTopicId]  = useState<string | null>(null)
  const [activeCategory,   setActiveCategory]   = useState<string | null>(null)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}/stories`

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePromptSelect = (topicId: string) => {
    setSelectedTopicId(topicId)
    setSubmitting(true)
  }

  // ── 9.2 Category computation ───────────────────────────────────────────────

  // Derive ordered unique categories from active topics
  const categoryOrder = [
    'Personal Memories', 'Childhood & Early Life', 'Work & Achievements',
    'Faith & Values', 'Family', 'Funny Moments', 'Legacy & Impact', 'General',
  ]

  const presentCategories = categoryOrder.filter(cat =>
    topics.some(t => (t.category ?? 'General') === cat)
  )
  // Any categories not in the predefined order go at end
  const extraCategories = [...new Set(topics.map(t => t.category ?? 'General'))]
    .filter(c => !categoryOrder.includes(c))
  const allCategories = [...presentCategories, ...extraCategories]

  // ── 9.3 Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: '80px' }}>

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
            onClick={() => setSubmitting(true)}
            style={{ flexShrink: 0, padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
          >
            + Share a Memory
          </button>
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.25), transparent)', margin: '16px 0 0' }} />
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 20px' }}>

        {/* ── LEVEL 1: Category summary ── */}
        {!activeCategory && (
          <div>
            {topics.length === 0 ? (
              /* Empty state */
              <div style={{ padding: '32px 20px', textAlign: 'center' as const }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: goldFaint, border: '1px solid rgba(226,195,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px' }}>
                  📖
                </div>
                <p style={{ fontSize: '15px', fontStyle: 'italic', color: textSecondary, lineHeight: 1.75, margin: '0 auto 20px', maxWidth: '320px' }}>
                  "This story is still being written. Be the first to share a memory, lesson, or experience that deserves to be remembered."
                </p>
                <button
                  onClick={() => setSubmitting(true)}
                  style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Share the First Memory
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '10px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 600, margin: '0 0 14px' }}>
                  Browse by category
                </p>
                {allCategories.map(cat => {
                  const catTopics    = topics.filter(t => (t.category ?? 'General') === cat)
                  const responseCount = catTopics.reduce((sum, t) => sum + t.story_count, 0)
                  return (
                    <CategorySummaryCard
                      key={cat}
                      name={cat}
                      topicCount={catTopics.length}
                      responseCount={responseCount}
                      onClick={() => setActiveCategory(cat)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── LEVEL 2: Category detail ── */}
        {activeCategory && (
          <CategoryDetailView
            category={activeCategory}
            topics={topics}
            stories={stories}
            photos={storyPhotos}
            honoureeName={capsule.honouree_name}
            onBack={() => setActiveCategory(null)}
            onShare={handlePromptSelect}
          />
        )}

        {/* ── Premiums strip ── */}
        <ActivePremiumsStrip slug={capsule.slug} components={capsule.components ?? []} />

        {/* ── Share strip ── */}
        <div style={{ padding: '16px', borderRadius: '14px', background: goldFaint, border: '1px solid rgba(226,195,107,0.15)', marginTop: '16px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: goldMuted, letterSpacing: '0.08em' }}>
            Share this room
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: textFaint, lineHeight: 1.55 }}>
            Every person who shares their memory makes this record more complete.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid rgba(226,195,107,0.25)', background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => {
                const t = encodeURIComponent(`${capsule.honouree_name}'s story is being preserved — share your memory: ${shareUrl}`)
                window.open(`https://wa.me/?text=${t}`, '_blank')
              }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: textFaint, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              WhatsApp
            </button>
          </div>
        </div>

        {/* ── Back to tribute wall ── */}
        <div style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Link href={`/for/${capsule.slug}`} style={{ fontSize: '12px', color: textFaint, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            Back to Tribute Wall
          </Link>
        </div>
      </div>

      {/* ── Submission panel ── */}
      {submitting && (
        <SubmitStoryPanel
          capsule={capsule}
          topics={selectedTopicId
            ? topics.filter(t => t.id === selectedTopicId).concat(topics.filter(t => t.id !== selectedTopicId))
            : (activeCategory ? topics.filter(t => (t.category ?? 'General') === activeCategory) : topics)
          }
          hasPublication={hasPublication}
          onClose={() => { setSubmitting(false); setSelectedTopicId(null) }}
          onSuccess={() => { setSubmitting(false); setSelectedTopicId(null); setSubmitted(true) }}
        />
      )}

      {/* ── Success confirmation ── */}
      {submitted && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,2,20,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '320px', width: '100%', background: 'linear-gradient(145deg,#1e0d4e,#2a1060)', border: '1px solid rgba(226,195,107,0.25)', borderRadius: '20px', padding: '32px 24px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📖</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>Your memory has been received</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: textFaint, lineHeight: 1.7 }}>
              It will be reviewed and added to this record. Thank you for helping preserve this story.
            </p>
            <button onClick={() => setSubmitted(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Continue Reading
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
