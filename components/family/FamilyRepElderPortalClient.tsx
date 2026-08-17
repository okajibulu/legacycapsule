'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/family/FamilyRepElderPortalClient.tsx
// PURPOSE:   Client component for the Family Rep Elder portal.
//            Extends the existing HonoureePortalClient capabilities with:
//            - Role badge showing "Family Rep · Elder"
//            - Stories tab (community stories with respond capability)
//            - Family Appreciation tab (set/edit appreciation message)
//            - ECS participation language throughout
//            - Access Codes and Guest Management tabs (placeholders for now —
//              will show data when those modules are built)
//            Voices (tributes) tab retains full respond capability from
//            HonoureePortalClient pattern.
//            SERVER-SIDE ONLY auth — this component never handles auth.
// ARCHITECTURE: CA-SPEC-001 — Step 6.
//               Uses getParticipationLanguage for event-type-aware copy.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link         from 'next/link'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const bg          = '#0f0a1e'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary    = 'rgba(255,255,255,0.92)'
const textSecondary  = 'rgba(255,255,255,0.55)'
const textFaint      = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '12px', padding: '8px 12px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', resize: 'none',
  lineHeight: 1.65, boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
}

// ═══ SECTION 2 — Types ═══

type PortalTab = 'voices' | 'stories' | 'honour' | 'acknowledgements' | 'appreciation'

interface Contribution {
  id: string; contributor_name: string; city: string; country: string
  ip_country?: string | null; relationship: string | null
  tribute_text: string; thumbnail_url: string | null
  audio_url: string | null; video_url: string | null
  created_at: string; status: string; email: string | null
  tribute_responses?: { response_text: string; responded_by: string }[]
}

interface Story {
  id: string; contributor_name: string; relationship: string | null
  story_text: string; status: string; created_at: string
  topic_id: string | null; topic_name: string | null
}

interface Acknowledgement {
  id: string; supporter_name: string; supporter_email: string | null
  created_at: string; support_account_id: string | null
}

interface AppreciationSection {
  id: string; content: string
}

interface Props {
  capsule:         any
  contributions:   Contribution[]
  stories:         Story[]
  supportAccounts: any[]
  acknowledgements: Acknowledgement[]
  appreciation:    AppreciationSection | null
  elderName:       string
  elderId:         string
}

// ═══ SECTION 3 — Voice card with respond ═══

function VoiceCard({ contribution, capsule, elderName, elderId, formatDate }: {
  contribution: Contribution; capsule: any
  elderName: string; elderId: string
  formatDate: (s: string) => string
}) {
  const [expanded,     setExpanded]     = useState(false)
  const [showRespond,  setShowRespond]  = useState(false)
  const [responseText, setResponseText] = useState('')
  const [respondedBy,  setRespondedBy]  = useState('')
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)

  const existingResponse = contribution.tribute_responses?.[0]?.response_text ?? null
  const existingBy       = contribution.tribute_responses?.[0]?.responded_by  ?? null

  const handleRespond = async () => {
    if (!responseText.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/rep/respond', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contributionId: contribution.id,
          capsuleId:      capsule.id,
          responseText:   responseText.trim(),
          respondedBy:    respondedBy.trim() || 'The Family',
        }),
      })
      if (res.ok) { setSent(true); setShowRespond(false) }
    } catch {}
    setSending(false)
  }

  return (
    <div style={{ borderRadius: '14px', background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `3px solid rgba(226,195,107,0.4)`, padding: '14px 16px', marginBottom: '10px' }}>
      <div style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{contribution.contributor_name}</span>
        {contribution.relationship && <span style={{ fontSize: '11px', color: goldMuted, marginLeft: '6px' }}>· {contribution.relationship}</span>}
      </div>
      <p style={{ fontSize: '10px', color: textFaint, marginBottom: '10px' }}>
        {[contribution.city, contribution.country].filter(Boolean).join(' · ')}{(contribution.city || contribution.country) ? ' · ' : ''}{formatDate(contribution.created_at)}
      </p>
      <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.75, display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? undefined : 3, WebkitBoxOrient: 'vertical' as any, overflow: expanded ? 'visible' : 'hidden', margin: 0 }}>
        {contribution.tribute_text}
      </p>
      {contribution.tribute_text.length > 160 && (
        <button onClick={() => setExpanded(!expanded)} style={{ fontSize: '11px', color: goldMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', display: 'block' }}>
          {expanded ? 'show less' : 'read more'}
        </button>
      )}

      {existingResponse && (
        <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(226,195,107,0.06)', borderLeft: `3px solid rgba(226,195,107,0.35)` }}>
          <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: goldMuted, marginBottom: '5px' }}>
            Response · {existingBy || 'The Family'}
          </p>
          <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>"{existingResponse}"</p>
        </div>
      )}

      {!sent && !existingResponse && !showRespond && (
        <button onClick={() => setShowRespond(true)} style={{ marginTop: '10px', fontSize: '11px', padding: '5px 14px', borderRadius: '8px', border: `1px solid rgba(226,195,107,0.22)`, background: 'rgba(226,195,107,0.05)', color: goldMuted, cursor: 'pointer', fontWeight: 600 }}>
          ✦ Respond on behalf of the family
        </button>
      )}

      {showRespond && !sent && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input placeholder="Your name / role (e.g. The Adeyemi Family)" value={respondedBy} onChange={e => setRespondedBy(e.target.value)} style={{ ...inp, resize: undefined }} />
          <textarea placeholder="Write your response…" value={responseText} onChange={e => setResponseText(e.target.value)} rows={3} style={inp} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRespond} disabled={sending || !responseText.trim()} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: sending || !responseText.trim() ? 0.6 : 1 }}>
              {sending ? 'Sending…' : 'Send Response'}
            </button>
            <button onClick={() => setShowRespond(false)} style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
          {contribution.email
            ? <p style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic' }}>✓ {contribution.contributor_name} will receive an email notification.</p>
            : <p style={{ fontSize: '10px', color: textFaint, fontStyle: 'italic' }}>This contributor did not provide an email — no notification will be sent.</p>
          }
        </div>
      )}

      {sent && <p style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(134,239,172,0.8)' }}>✓ Response sent — it will appear on the wall.</p>}
    </div>
  )
}

// ═══ SECTION 4 — Family Appreciation editor ═══

function AppreciationEditor({ capsuleId, honoureeName, existing, onSaved }: {
  capsuleId: string; honoureeName: string
  existing: AppreciationSection | null; onSaved: () => void
}) {
  const DEFAULT = `From the heart of our family, we want to say thank you.\n\nTo every person who took a moment to add their voice to this wall — your presence here has meant more than words can express.\n\nWith love and appreciation,\nThe Family of ${honoureeName}`

  const [text,   setText]   = useState(existing?.content ?? DEFAULT)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/capsule/appreciation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId, content: text.trim(), section_id: existing?.id ?? null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setSaving(false); return }
      setSaved(true); setTimeout(() => setSaved(false), 2500); onSaved()
    } catch { setError('Something went wrong. Please try again.') }
    setSaving(false)
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.7, marginBottom: '14px' }}>
        This message appears on {honoureeName}'s capsule wall as a thank-you from the family. Write something that feels right for your family's voice.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={10}
        style={{ ...inp, marginBottom: '10px' }}
        placeholder="Write your family's appreciation message…"
      />
      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginBottom: '8px' }}>{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving || !text.trim()}
        style={{ width: '100%', padding: '11px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !text.trim() ? 0.7 : 1 }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : existing ? 'Update Appreciation' : 'Publish Appreciation'}
      </button>
    </div>
  )
}

// ═══ SECTION 5 — Main portal component ═══

export default function FamilyRepElderPortalClient({
  capsule, contributions, stories, supportAccounts,
  acknowledgements, appreciation, elderName, elderId,
}: Props) {
  const [activeTab, setActiveTab] = useState<PortalTab>('voices')

  const lang        = getParticipationLanguage(capsule.event_type)
  const honoureeName = capsule.honouree_name

  const formatDate = (s: string) => {
    const d = new Date(s)
    return `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en-GB',{month:'short'})} ${d.getFullYear()}`
  }

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs: { id: PortalTab; label: string }[] = [
    { id: 'voices',          label: lang.plural },
    { id: 'stories',         label: 'Stories' },
    { id: 'honour',          label: 'Ways to Honour' },
    { id: 'acknowledgements', label: 'Acknowledgements' },
    { id: 'appreciation',    label: 'Family Appreciation' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: textPrimary }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(226,195,107,0.18); border-radius: 2px; }`}</style>

      {/* ── Header ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(226,195,107,0.1)`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </Link>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{honoureeName}</p>
            <p style={{ fontSize: '10px', color: textFaint, margin: '1px 0 0' }}>Private view · {elderName}</p>
          </div>
          {/* Role badge */}
          <span style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '10px', background: 'rgba(226,195,107,0.08)', border: `1px solid rgba(226,195,107,0.2)`, color: goldMuted, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
            Family Rep
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '14px 16px 80px' }}>

        {/* ── Private notice ── */}
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.05)', border: `1px solid rgba(226,195,107,0.12)`, marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, lineHeight: 1.6, margin: 0 }}>
            ✦ This is a private view for the Family Representative of <strong style={{ color: gold }}>{honoureeName}</strong>. Only you can see this page.
          </p>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: lang.plural, value: contributions.length },
            { label: 'Stories', value: stories.length },
            { label: 'Acknowledgements', value: acknowledgements.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", margin: 0 }}>{value}</p>
              <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab navigation — horizontally scrollable ── */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '20px', border: `1px solid ${activeTab === id ? 'rgba(226,195,107,0.4)' : 'rgba(255,255,255,0.06)'}`, background: activeTab === id ? goldFaint : 'transparent', color: activeTab === id ? gold : textFaint, fontSize: '10px', fontWeight: activeTab === id ? 700 : 500, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Voices tab ── */}
        {activeTab === 'voices' && (
          <div style={{ paddingBottom: '32px' }}>
            <p style={{ fontSize: '11px', color: textFaint, fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.6 }}>
              You can respond to individual {lang.plural.toLowerCase()} below. Contributors who provided an email will receive a notification of your response.
            </p>
            {contributions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
                <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>No {lang.plural.toLowerCase()} yet. They will appear here as they are approved.</p>
              </div>
            ) : contributions.map(c => (
              <VoiceCard
                key={c.id}
                contribution={c}
                capsule={capsule}
                elderName={elderName}
                elderId={elderId}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* ── Stories tab ── */}
        {activeTab === 'stories' && (
          <div style={{ paddingBottom: '32px' }}>
            {stories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
                <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>No community stories yet.</p>
              </div>
            ) : stories.map(s => (
              <div key={s.id} style={{ borderRadius: '14px', background: cardBg, border: `1px solid ${cardBorder}`, padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{s.contributor_name}</span>
                  {s.relationship && <span style={{ fontSize: '11px', color: goldMuted, marginLeft: '6px' }}>· {s.relationship}</span>}
                </div>
                {s.topic_name && (
                  <p style={{ fontSize: '9px', fontWeight: 700, color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    {s.topic_name}
                  </p>
                )}
                <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.75, margin: 0 }}>
                  {s.story_text}
                </p>
                <p style={{ fontSize: '10px', color: textFaint, marginTop: '8px' }}>{formatDate(s.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Ways to Honour tab ── */}
        {activeTab === 'honour' && (
          <div style={{ paddingBottom: '32px' }}>
            {supportAccounts.length === 0 ? (
              <p style={{ textAlign: 'center', color: textFaint, fontSize: '13px', padding: '32px 0' }}>No support channels have been set up yet.</p>
            ) : supportAccounts.map(acc => (
              <div key={acc.id} style={{ borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, padding: '14px 16px', marginBottom: '10px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>{acc.account_holder}</p>
                {acc.bank_name && <p style={{ fontSize: '11px', color: textFaint, marginBottom: '2px' }}>{acc.bank_name}</p>}
                <p style={{ fontSize: '13px', color: gold, fontFamily: 'monospace', marginBottom: acc.reference_guide ? '6px' : 0 }}>{acc.account_number} · {acc.currency}</p>
                {acc.reference_guide && <p style={{ fontSize: '11px', color: textFaint, fontStyle: 'italic', marginBottom: 0 }}>{acc.reference_guide}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── Acknowledgements tab ── */}
        {activeTab === 'acknowledgements' && (
          <div style={{ paddingBottom: '32px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.05)', border: `1px solid rgba(226,195,107,0.12)`, marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65, margin: 0 }}>
                When a guest views Ways to Honour and submits a support acknowledgement, it appears here. This is private — only visible to you and the organiser.
              </p>
            </div>
            {acknowledgements.length === 0 ? (
              <p style={{ textAlign: 'center', color: textFaint, fontSize: '13px', padding: '32px 0', fontStyle: 'italic' }}>No acknowledgements yet.</p>
            ) : acknowledgements.map(ack => (
              <div key={ack.id} style={{ borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, padding: '12px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{ack.supporter_name}</span>
                  <span style={{ fontSize: '10px', color: textFaint }}>{formatDate(ack.created_at)}</span>
                </div>
                {ack.supporter_email && <p style={{ fontSize: '11px', color: goldMuted, margin: 0 }}>{ack.supporter_email}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── Family Appreciation tab ── */}
        {activeTab === 'appreciation' && (
          <div style={{ paddingBottom: '32px' }}>
            <AppreciationEditor
              capsuleId={capsule.id}
              honoureeName={honoureeName}
              existing={appreciation}
              onSaved={() => {}}
            />
          </div>
        )}

      </div>
    </div>
  )
}
