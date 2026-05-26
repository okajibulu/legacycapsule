'use client'
/* =========================================================
   HonoureePortalClient.tsx
   Family Rep / Honouree private view
   - Read-only tributes (no composer)
   - Ways to Honour acknowledgements list
   - Premium intimate feel — distinct from public wall
========================================================= */
import { useState } from 'react'
import Link from 'next/link'
import WaysToHonourSection from '@/components/WaysToHonourSection'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.12)'
const goldMuted = 'rgba(226,195,107,0.55)'
const bg = '#0f0a1e'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint = 'rgba(255,255,255,0.28)'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'

const t = {
  accentPrimary: gold, accentMuted: goldMuted, accentFaint: goldFaint,
  cardBg, cardBorder, textHeading: textPrimary, textBody: textSecondary,
  textMuted: textSecondary, textFaint, inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(226,195,107,0.18)',
}

type Tab = 'tributes' | 'honour' | 'acknowledgements'

interface Tribute {
  id: string; contributor_name: string; city: string; country: string
  relationship: string | null; tribute_text: string; thumbnail_url: string | null
  audio_url: string | null; video_url: string | null; created_at: string; status: string
}
interface Acknowledgement {
  id: string; contributor_name: string; relationship: string | null
  amount: string | null; currency: string | null; note: string | null
  created_at: string; support_account_id: string | null
}

export default function HonoureePortalClient({ capsule, tributes, supportAccounts, acknowledgements, token }: {
  capsule: any; tributes: Tribute[]; supportAccounts: any[]
  acknowledgements: Acknowledgement[]; token: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('tributes')
  const [expanded, setExpanded] = useState<string | null>(null)

  const honourName = capsule.honouree_name

  const formatDate = (s: string) => {
    const d = new Date(s)
    return `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en-GB',{month:'short'})} ${d.getFullYear()}`
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: textPrimary }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(226,195,107,0.18); border-radius: 2px; }`}</style>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(226,195,107,0.1)`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </Link>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{honourName}</p>
            <p style={{ fontSize: '10px', color: textFaint, margin: '1px 0 0' }}>Private view · Family Representative</p>
          </div>
          <span style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '10px', background: 'rgba(226,195,107,0.08)', border: `1px solid rgba(226,195,107,0.2)`, color: goldMuted, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>Rep</span>
        </div>
      </div>

      {/* Private notice */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '14px 16px 0' }}>
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(226,195,107,0.05)', border: `1px solid rgba(226,195,107,0.12)`, marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, lineHeight: 1.6 }}>✦ This is a private view for the Family Representative of <strong style={{ color: gold }}>{honourName}</strong>. This page is only accessible via your personal link.</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", margin: 0 }}>{tributes.length}</p>
            <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Tributes</p>
          </div>
          <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0 }}>{[...new Set(tributes.map(t => t.country).filter(Boolean))].length}</p>
            <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Countries</p>
          </div>
          <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0 }}>{acknowledgements.length}</p>
            <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Acknowledgements</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {([['tributes', 'Tributes'], ['honour', 'Ways to Honour'], ['acknowledgements', 'Acknowledgements']] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', border: `1px solid ${activeTab === id ? 'rgba(226,195,107,0.4)' : 'rgba(255,255,255,0.06)'}`, background: activeTab === id ? 'rgba(226,195,107,0.08)' : 'transparent', color: activeTab === id ? gold : textFaint, fontSize: '10px', fontWeight: activeTab === id ? 700 : 500, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tributes tab */}
        {activeTab === 'tributes' && (
          <div style={{ paddingBottom: '32px' }}>
            {tributes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
                <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>No tributes yet. They will appear here as they are approved.</p>
              </div>
            ) : tributes.map(tribute => (
              <div key={tribute.id} style={{ borderRadius: '14px', background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `3px solid rgba(226,195,107,0.4)`, padding: '14px 16px', marginBottom: '10px' }}>
                {/* Name · Relationship */}
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{tribute.contributor_name}</span>
                  {tribute.relationship && <span style={{ fontSize: '11px', color: goldMuted, marginLeft: '6px' }}>· {tribute.relationship}</span>}
                </div>
                {/* City · Country · Date */}
                <p style={{ fontSize: '10px', color: textFaint, marginBottom: '10px' }}>
                  {[tribute.city, tribute.country].filter(Boolean).join(' · ')}{(tribute.city || tribute.country) ? ' · ' : ''}{formatDate(tribute.created_at)}
                </p>
                {/* Text — 3-line clamp */}
                <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.75, display: expanded === tribute.id ? 'block' : '-webkit-box', WebkitLineClamp: expanded === tribute.id ? undefined : 3, WebkitBoxOrient: 'vertical' as any, overflow: expanded === tribute.id ? 'visible' : 'hidden', margin: 0 }}>
                  {tribute.tribute_text}
                </p>
                {tribute.tribute_text.length > 160 && (
                  <button onClick={() => setExpanded(expanded === tribute.id ? null : tribute.id)} style={{ fontSize: '11px', color: goldMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', display: 'block' }}>
                    {expanded === tribute.id ? 'show less' : 'read more'}
                  </button>
                )}
                {tribute.audio_url && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '9px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>🎙️ Voice Tribute</p>
                    <audio controls src={tribute.audio_url} style={{ width: '100%', height: '32px' }} />
                  </div>
                )}
                {tribute.video_url && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '9px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>🎬 Video Tribute</p>
                    <video controls src={tribute.video_url} style={{ width: '100%', borderRadius: '8px', maxHeight: '200px' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ways to Honour tab */}
        {activeTab === 'honour' && (
          <div style={{ paddingBottom: '32px' }}>
            {supportAccounts.length === 0 ? (
              <p style={{ textAlign: 'center', color: textFaint, fontSize: '13px', padding: '32px 0' }}>No support channels have been set up yet.</p>
            ) : (
              <WaysToHonourSection
                accounts={supportAccounts}
                capsuleId={capsule.id}
                honourName={honourName}
                eventType={capsule.event_type}
                supabase={supabase}
                t={t}
                isRepView={true}
              />
            )}
          </div>
        )}

        {/* Acknowledgements tab */}
        {activeTab === 'acknowledgements' && (
          <div style={{ paddingBottom: '32px' }}>
            {acknowledgements.length === 0 ? (
              <p style={{ textAlign: 'center', color: textFaint, fontSize: '13px', padding: '32px 0', fontStyle: 'italic' }}>No acknowledgements have been submitted yet.</p>
            ) : acknowledgements.map(ack => (
              <div key={ack.id} style={{ borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, padding: '12px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{ack.contributor_name}</span>
                  {ack.amount && <span style={{ fontSize: '12px', color: gold, fontWeight: 700 }}>{ack.currency || ''} {ack.amount}</span>}
                </div>
                {ack.relationship && <p style={{ fontSize: '11px', color: goldMuted, marginBottom: '4px' }}>{ack.relationship}</p>}
                {ack.note && <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.6, fontStyle: 'italic' }}>"{ack.note}"</p>}
                <p style={{ fontSize: '10px', color: textFaint, marginTop: '6px' }}>{formatDate(ack.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
