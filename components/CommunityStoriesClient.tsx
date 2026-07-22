'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/CommunityStoriesClient.tsx
// PURPOSE: Community Memories & Stories room — client island
// UPDATED: AI13 · Claude Opus 4.6 · 22 July 2026
//   — Fix: subscription fetch moved inside try block (only fires on success)
//   — Fix: name/email fields stacked vertically (mobile layout)
//   — Improved: email placeholder shortened + hint line below field
//   — Upgraded: GiftOfHonourSection — copy-to-clipboard per account card
//   — Upgraded: GiftOfHonourSection — elevated dignity seal
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports & types
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link         from 'next/link'
import type { CapsuleInfo, StoryTopic, CommunityStory } from '@/app/for/[slug]/stories/page'

interface EohAccount {
  method_label:    string
  account_holder:  string
  reference_guide: string | null
}

interface Props {
  capsule:     CapsuleInfo
  topics:      StoryTopic[]
  stories:     CommunityStory[]
  eohAccounts: EohAccount[]
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Design tokens
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — StoryCard with truncation and admin response
// ─────────────────────────────────────────────────────────────────────────────

function StoryCard({ story }: { story: CommunityStory }) {
  const [expanded, setExpanded] = useState(false)

  const location = [story.city, story.country].filter(Boolean).join(', ')
  const isLong   = story.tribute_text.length > 280

  return (
    <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>

      {/* ── Author ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: goldFaint, border: `1px solid rgba(226,195,107,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: goldMuted, fontWeight: 700 }}>
            {story.contributor_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: textPrimary }}>{story.contributor_name}</p>
          <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>
            {story.relationship && <span>{story.relationship}</span>}
            {story.relationship && location && <span> · </span>}
            {location && <span>{location}</span>}
          </p>
        </div>
        {story.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.thumbnail_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', marginLeft: 'auto', flexShrink: 0 }} />
        )}
      </div>

      {/* ── Story text with truncation ── */}
      <div>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: textSecondary,
          lineHeight: 1.75,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical' as const,
          WebkitLineClamp: expanded ? 'unset' : 3,
          overflow: expanded ? 'visible' : 'hidden',
        }}>
          {story.tribute_text}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: '11px', color: goldMuted, background: 'none', border: 'none', padding: '4px 0 0', cursor: 'pointer', fontWeight: 600 }}
          >
            {expanded ? 'Read less ▲' : 'Read more ▼'}
          </button>
        )}
      </div>

      {/* ── Admin response ── */}
      {story.admin_response && (
        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(226,195,107,0.06)', borderLeft: `3px solid rgba(226,195,107,0.4)` }}>
          <p style={{ margin: '0 0 4px', fontSize: '9px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Response from the family</p>
          <p style={{ margin: 0, fontSize: '12px', color: textSecondary, lineHeight: 1.65, fontStyle: 'italic' }}>{story.admin_response}</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — TopicSection
// ─────────────────────────────────────────────────────────────────────────────

function TopicSection({ topic, stories, onShare }: {
  topic:   StoryTopic
  stories: CommunityStory[]
  onShare: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? stories : stories.slice(0, 3)

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {topic.topic_name}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '10px', color: textFaint }}>
            {topic.story_count} {topic.story_count === 1 ? 'memory' : 'memories'}
          </p>
        </div>
        <button onClick={onShare}
          style={{ fontSize: '11px', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', border: `1px solid rgba(226,195,107,0.25)`, background: goldFaint, color: goldMuted, cursor: 'pointer' }}>
          + Share
        </button>
      </div>

      {visible.map(s => <StoryCard key={s.id} story={s} />)}

      {stories.length > 3 && (
        <button onClick={() => setShowAll(v => !v)}
          style={{ width: '100%', padding: '9px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.06)`, background: 'transparent', color: textFaint, fontSize: '11px', cursor: 'pointer', marginTop: '4px' }}>
          {showAll ? 'Show fewer' : `Show ${stories.length - 3} more`}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Story submission form (bottom sheet modal)
// ─────────────────────────────────────────────────────────────────────────────

function SubmitStoryPanel({ capsule, topics, onClose, onSuccess }: {
  capsule:   CapsuleInfo
  topics:    StoryTopic[]
  onClose:   () => void
  onSuccess: () => void
}) {
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [topicId,    setTopicId]    = useState(topics[0]?.id ?? '')
  const [text,       setText]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const remaining = STORY_CHAR_LIMIT - text.length

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !topicId) return
    if (text.length > STORY_CHAR_LIMIT) { setError(`Story must be ${STORY_CHAR_LIMIT} characters or fewer`); return }

    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/community-topics/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:        capsule.id,
          story_topic_id:    topicId,
          contributor_name:  name.trim(),
          contributor_email: email.trim() || undefined,
          tribute_text:      text.trim(),
        }),
      })
      if (!res.ok) throw new Error('Submission failed')

      // Auto-register to publication subscribers — only fires on successful submission
      if (email.trim() && email.includes('@')) {
        fetch('/api/publication/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            capsule_id: capsule.id,
            name:       name.trim(),
            email:      email.trim().toLowerCase(),
            source:     'stories',
          }),
        }).catch(() => {}) // silent — non-blocking
      }

      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(226,195,107,0.18)`,
    color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(8,2,20,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '540px', background: 'linear-gradient(160deg,#1a0845,#120630)', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', maxHeight: '90vh', overflowY: 'auto' as const }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>Share a Memory</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>

          {/* ── Name field — full width ── */}
          <input
            style={inp}
            placeholder="Your name *"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          {/* ── Email field — full width with hint ── */}
          <div>
            <input
              type="email"
              style={inp}
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <p style={{ margin: '5px 0 0', fontSize: '10px', color: textFaint, lineHeight: 1.5, paddingLeft: '2px' }}>
              We'll send you the keepsake publication when this record is ready.
            </p>
          </div>

          {topics.length > 1 && (
            <select style={{ ...inp, background: '#1a0845' }} value={topicId} onChange={e => setTopicId(e.target.value)}>
              {topics.map(t => <option key={t.id} value={t.id}>{t.topic_name}</option>)}
            </select>
          )}

          <div>
            <textarea
              style={{ ...inp, minHeight: '120px', resize: 'vertical' as const }}
              placeholder="Share a memory, lesson, or experience that deserves to be remembered…"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={STORY_CHAR_LIMIT}
            />
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: remaining < 100 ? 'rgba(248,113,113,0.7)' : textFaint, textAlign: 'right' as const }}>
              {remaining} characters remaining
            </p>
          </div>

          {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={submitting || !name.trim() || !text.trim()}
            style={{ padding: '13px', borderRadius: '12px', border: 'none', background: name.trim() && text.trim() ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.06)', color: name.trim() && text.trim() ? '#1a0845' : textFaint, fontSize: '14px', fontWeight: 700, cursor: name.trim() && text.trim() ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Sharing…' : 'Share Memory'}
          </button>

          <p style={{ fontSize: '10px', color: textFaint, textAlign: 'center' as const, lineHeight: 1.6, margin: 0 }}>
            Your memory will be reviewed before appearing in this record.
            {email ? ' We\'ll also send you the keepsake publication after the event.' : ' Add your email above to receive the keepsake publication after the event.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Gift of Honour section (EOH in stories room)
// Shows only when ways_to_honour is in capsule.components and accounts exist
// Upgraded: per-account copy-to-clipboard, elevated dignity seal
// ─────────────────────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: EohAccount }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const textToCopy = [account.account_holder, account.reference_guide].filter(Boolean).join(' · ')
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable — silent */ }
  }

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid rgba(226,195,107,0.15)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      {/* ── Account details ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', fontSize: '10px', color: goldMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>
          {account.method_label}
        </p>
        <p style={{ margin: '0 0 2px', fontSize: '14px', color: textPrimary, fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
          {account.account_holder}
        </p>
        {account.reference_guide && (
          <p style={{ margin: 0, fontSize: '11px', color: textSecondary, lineHeight: 1.5 }}>
            {account.reference_guide}
          </p>
        )}
      </div>

      {/* ── Copy button ── */}
      <button
        onClick={handleCopy}
        style={{
          flexShrink: 0,
          padding: '7px 14px',
          borderRadius: '20px',
          border: copied ? `1px solid rgba(226,195,107,0.5)` : `1px solid rgba(226,195,107,0.22)`,
          background: copied ? 'rgba(226,195,107,0.12)' : 'transparent',
          color: copied ? gold : goldMuted,
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap' as const,
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

function GiftOfHonourSection({ honoureeName, accounts }: {
  honoureeName: string
  accounts:     EohAccount[]
}) {
  if (accounts.length === 0) return null

  return (
    <div style={{
      margin: '28px 0',
      borderRadius: '16px',
      border: `1px solid rgba(226,195,107,0.28)`,
      background: 'linear-gradient(160deg, rgba(226,195,107,0.06) 0%, rgba(226,195,107,0.02) 100%)',
      overflow: 'hidden',
    }}>

      {/* ── Header band ── */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid rgba(226,195,107,0.1)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '3px', color: gold }}>✦</span>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", letterSpacing: '0.01em' }}>
              Gift of Honour
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: textSecondary, lineHeight: 1.7 }}>
              If you wish to honour {honoureeName} in a personal way, the family has made these details available. Your gesture will be received with deep gratitude.
            </p>
          </div>
        </div>
      </div>

      {/* ── Account cards ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {accounts.map((a, i) => (
          <AccountCard key={i} account={a} />
        ))}
      </div>

      {/* ── Dignity seal ── */}
      <div style={{
        padding: '10px 20px 14px',
        borderTop: `1px solid rgba(226,195,107,0.08)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '10px', color: 'rgba(226,195,107,0.35)', letterSpacing: '0.06em' }}>◈</span>
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(226,195,107,0.4)', letterSpacing: '0.06em', fontVariant: 'small-caps', textAlign: 'center' as const }}>
          Private &amp; dignified · No amounts displayed publicly
        </p>
        <span style={{ fontSize: '10px', color: 'rgba(226,195,107,0.35)', letterSpacing: '0.06em' }}>◈</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function CommunityStoriesClient({ capsule, topics, stories, eohAccounts }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [copied,     setCopied]     = useState(false)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}/stories`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const topicsWithStories = topics.filter(t => t.story_count > 0)
  const showEmpty = topicsWithStories.length === 0

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
          <button onClick={() => setSubmitting(true)}
            style={{ flexShrink: 0, padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
            + Share a Memory
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.25), transparent)', margin: '16px 0 0' }} />
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 20px' }}>

        {/* ── Empty state ── */}
        {showEmpty && (
          <div style={{ padding: '32px 20px', textAlign: 'center' as const }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: goldFaint, border: `1px solid rgba(226,195,107,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px' }}>
              📖
            </div>
            <p style={{ fontSize: '15px', fontStyle: 'italic', color: textSecondary, lineHeight: 1.75, margin: '0 auto 20px', maxWidth: '320px' }}>
              "This story is still being written. Be the first to share a memory, lesson, or experience that deserves to be remembered."
            </p>
            <button onClick={() => setSubmitting(true)}
              style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Share the First Memory
            </button>
          </div>
        )}

        {/* ── Topics and stories ── */}
        {topicsWithStories.map(topic => (
          <TopicSection
            key={topic.id}
            topic={topic}
            stories={stories.filter(s => s.story_topic_id === topic.id)}
            onShare={() => setSubmitting(true)}
          />
        ))}

        {/* ── Gift of Honour section ── */}
        {eohAccounts.length > 0 && (
          <GiftOfHonourSection honoureeName={capsule.honouree_name} accounts={eohAccounts} />
        )}

        {/* ── Share strip ── */}
        <div style={{ padding: '16px', borderRadius: '14px', background: goldFaint, border: `1px solid rgba(226,195,107,0.15)`, marginTop: '16px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: goldMuted, letterSpacing: '0.08em' }}>
            Share this room
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: textFaint, lineHeight: 1.55 }}>
            Every person who shares their memory makes this record more complete.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {copied ? '✓ Copied' : '🔗 Copy Link'}
            </button>
            <button onClick={() => {
              const text = encodeURIComponent(`${capsule.honouree_name}'s story is being preserved — share your memory: ${shareUrl}`)
              window.open(`https://wa.me/?text=${text}`, '_blank')
            }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)', color: textFaint, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* ── View tributes link ── */}
        <div style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Link href={`/for/${capsule.slug}`}
            style={{ fontSize: '12px', color: textFaint, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            ← Back to Tribute Wall
          </Link>
        </div>
      </div>

      {/* ── Submission panel ── */}
      {submitting && (
        <SubmitStoryPanel
          capsule={capsule}
          topics={topics}
          onClose={() => setSubmitting(false)}
          onSuccess={() => { setSubmitting(false); setSubmitted(true) }}
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
            <button onClick={() => setSubmitted(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Continue Reading
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
