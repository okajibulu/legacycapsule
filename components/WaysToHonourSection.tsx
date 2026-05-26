'use client'
/* =========================================================
   WaysToHonourSection.tsx — Premium support display
   - Masked account numbers, Reveal Details, Copy
   - Acknowledgement modal (I Have Sent Support)
   - Event-type dynamic titles
   - Premium ceremonial aesthetic
   - NO payment processing — pure display + acknowledgement
========================================================= */

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SupportAccount {
  id: string
  support_type: string
  title: string | null
  account_name: string | null
  bank_name: string | null
  account_number: string | null
  currency: string | null
  country: string | null
  contact_person: string | null
  contact_phone: string | null
  instructions: string | null
  is_visible: boolean
  reveal_required: boolean
  sort_order: number
}

interface ThemeConfig {
  accentPrimary: string
  accentMuted: string
  accentFaint: string
  cardBg: string
  cardBorder: string
  textHeading: string
  textBody: string
  textMuted: string
  textFaint: string
  inputBg: string
  inputBorder: string
}

interface Props {
  accounts: SupportAccount[]
  capsuleId: string
  honourName: string
  eventType: string
  supabase: SupabaseClient
  t: ThemeConfig
  isRepView?: boolean // true when viewed from family rep portal
}

// ── Event-specific section titles ─────────────────────────
function getSectionTitle(eventType: string, name: string): { heading: string; subtext: string } {
  const type = eventType?.toLowerCase() ?? ''
  if (type.includes('memorial') || type.includes('funeral'))
    return { heading: 'Ways to Support the Family', subtext: `The family deeply appreciates every expression of love and support during this season of remembrance.` }
  if (type.includes('retirement'))
    return { heading: `Celebrate With ${name}`, subtext: `For colleagues, students and friends who may wish to honour a lifetime of impact and service.` }
  if (type.includes('wedding'))
    return { heading: 'Wedding Support', subtext: `For those who wish to celebrate and support this union in a meaningful way.` }
  if (type.includes('ordination') || type.includes('thanksgiving'))
    return { heading: 'Blessings & Support', subtext: `For those who wish to offer blessings and support on this sacred occasion.` }
  if (type.includes('birthday'))
    return { heading: `Honour ${name}`, subtext: `For those who wish to celebrate and honour the celebrant in a meaningful way.` }
  if (type.includes('chieftaincy') || type.includes('recognition'))
    return { heading: 'Expressions of Honour', subtext: `For those who wish to extend their honour and recognition in a meaningful way.` }
  return { heading: 'Ways to Honour', subtext: `For those who may wish to celebrate, support or honour this occasion in a meaningful way.` }
}

// ── Mask account number ───────────────────────────────────
function maskAccount(num: string): string {
  if (!num || num.length < 4) return num
  const last4 = num.slice(-4)
  const masked = num.slice(0, -4).replace(/\d/g, '•')
  // Format in groups of 4
  const full = masked + last4
  return full.match(/.{1,4}/g)?.join(' ') ?? full
}

// ── Single support card ───────────────────────────────────
function SupportCard({ account, capsuleId, honourName, supabase, t }: {
  account: SupportAccount; capsuleId: string; honourName: string
  supabase: SupabaseClient; t: ThemeConfig
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAckModal, setShowAckModal] = useState(false)

  const handleCopy = async () => {
    if (!account.account_number) return
    await navigator.clipboard.writeText(account.account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayAccount = revealed
    ? (account.account_number?.match(/.{1,4}/g)?.join(' ') ?? account.account_number ?? '')
    : maskAccount(account.account_number ?? '')

  return (
    <>
      <div style={{
        borderRadius: '16px', marginBottom: '12px',
        background: 'rgba(20,12,40,0.72)',
        border: `1px solid rgba(226,195,107,0.18)`,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Gold top accent */}
        <div style={{ height: '2px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.6), transparent)` }} />

        <div style={{ padding: '16px 18px' }}>
          {/* Card type badge + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: t.accentMuted, padding: '2px 8px', borderRadius: '10px', background: 'rgba(226,195,107,0.08)', border: '1px solid rgba(226,195,107,0.15)' }}>
              {account.support_type === 'bank_transfer' ? 'Bank Transfer' : account.support_type === 'physical_gift' ? 'Physical Gift' : 'Institutional'}
            </span>
            {account.title && <span style={{ fontSize: '12px', fontWeight: 600, color: t.textHeading }}>{account.title}</span>}
          </div>

          {/* Bank transfer details */}
          {account.support_type === 'bank_transfer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {account.account_name && (
                <div>
                  <p style={{ fontSize: '9px', color: t.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '2px' }}>Account Name</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: t.textHeading }}>{account.account_name}</p>
                </div>
              )}
              {account.bank_name && (
                <div>
                  <p style={{ fontSize: '9px', color: t.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '2px' }}>Bank</p>
                  <p style={{ fontSize: '13px', color: t.textBody }}>{account.bank_name}{account.country ? ` · ${account.country}` : ''}</p>
                </div>
              )}
              {account.account_number && (
                <div>
                  <p style={{ fontSize: '9px', color: t.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '4px' }}>Account Number</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: t.accentPrimary, fontFamily: 'monospace', letterSpacing: '0.12em' }}>
                      {displayAccount}
                    </span>
                    {account.currency && <span style={{ fontSize: '10px', color: t.textFaint, padding: '1px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>{account.currency}</span>}
                  </div>
                </div>
              )}

              {/* Reveal / Copy buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {account.reveal_required && !revealed ? (
                  <button onClick={() => setRevealed(true)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid rgba(226,195,107,0.3)`, background: 'rgba(226,195,107,0.07)', color: t.accentPrimary, fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
                    Reveal Details
                  </button>
                ) : (
                  <button onClick={handleCopy} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(226,195,107,0.2)'}`, background: copied ? 'rgba(74,222,128,0.07)' : 'rgba(226,195,107,0.05)', color: copied ? 'rgba(134,239,172,0.9)' : t.accentMuted, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    {copied ? '✓ Copied' : 'Copy Account'}
                  </button>
                )}
                <button onClick={() => setShowAckModal(true)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: t.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  I Have Sent Support
                </button>
              </div>
            </div>
          )}

          {/* Physical gift details */}
          {account.support_type === 'physical_gift' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {account.contact_person && <p style={{ fontSize: '13px', color: t.textBody }}>Contact: <strong style={{ color: t.textHeading }}>{account.contact_person}</strong></p>}
              {account.contact_phone && <p style={{ fontSize: '13px', color: t.textBody }}>Phone: <strong style={{ color: t.textHeading }}>{account.contact_phone}</strong></p>}
              {account.instructions && <p style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.7, fontStyle: 'italic' }}>{account.instructions}</p>}
              <button onClick={() => setShowAckModal(true)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: t.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                I Have Sent a Gift
              </button>
            </div>
          )}

          {/* Institutional support */}
          {account.support_type === 'institutional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {account.instructions && <p style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.7 }}>{account.instructions}</p>}
              {account.contact_person && <p style={{ fontSize: '13px', color: t.textBody }}>Contact: <strong style={{ color: t.textHeading }}>{account.contact_person}</strong></p>}
              <button onClick={() => setShowAckModal(true)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: t.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                I Have Sent Support
              </button>
            </div>
          )}

          {/* Custom instructions */}
          {account.instructions && account.support_type === 'bank_transfer' && (
            <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.6, marginTop: '10px', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>{account.instructions}</p>
          )}
        </div>
      </div>

      {/* Acknowledgement Modal */}
      {showAckModal && (
        <AcknowledgementModal
          capsuleId={capsuleId}
          accountId={account.id}
          honourName={honourName}
          supabase={supabase}
          t={t}
          onClose={() => setShowAckModal(false)}
        />
      )}
    </>
  )
}

// ── Acknowledgement Modal ─────────────────────────────────
function AcknowledgementModal({ capsuleId, accountId, honourName, supabase, t, onClose }: {
  capsuleId: string; accountId: string; honourName: string
  supabase: SupabaseClient; t: ThemeConfig; onClose: () => void
}) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(226,195,107,0.18)',
    color: t.textHeading, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('support_acknowledgements').insert({
      capsule_id: capsuleId,
      support_account_id: accountId,
      contributor_name: name.trim(),
      relationship: relationship.trim() || null,
      amount: amount.trim() || null,
      note: note.trim() || null,
    })
    setSaving(false)
    setDone(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(8,2,20,0.92)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '340px', borderRadius: '20px', background: 'linear-gradient(145deg, #1e0d4e, #2a1060)', border: `1px solid rgba(226,195,107,0.2)`, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ height: '2px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.7), transparent)` }} />
        <div style={{ padding: '24px 20px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✦</div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: t.accentPrimary, fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>Thank You</p>
              <p style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.7 }}>Your acknowledgement has been received. The family will be notified of your kind gesture.</p>
              <button onClick={onClose} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '20px', background: `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: t.textHeading, fontFamily: "'Playfair Display', serif", marginBottom: '4px' }}>Acknowledgement</p>
                <p style={{ fontSize: '12px', color: t.textFaint, lineHeight: 1.6 }}>Let the family know you have sent your support for {honourName}.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input style={inp} placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} />
                <input style={inp} placeholder="Your relationship (e.g. Former student)" value={relationship} onChange={e => setRelationship(e.target.value)} />
                <input style={inp} placeholder="Amount sent (optional)" value={amount} onChange={e => setAmount(e.target.value)} />
                <textarea style={{ ...inp, resize: 'none', lineHeight: 1.6 }} placeholder="A short note (optional)" rows={3} value={note} onChange={e => setNote(e.target.value)} />
                <button onClick={handleSubmit} disabled={saving || !name.trim()} style={{ padding: '12px', borderRadius: '12px', background: `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.6 : 1 }}>
                  {saving ? 'Sending…' : 'Confirm Acknowledgement'}
                </button>
                <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', color: t.textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Section Component ────────────────────────────────
export default function WaysToHonourSection({ accounts, capsuleId, honourName, eventType, supabase, t, isRepView = false }: Props) {
  const visible = accounts.filter(a => a.is_visible)
  if (visible.length === 0) return null

  const { heading, subtext } = getSectionTitle(eventType, honourName)

  return (
    <div style={{ marginTop: '32px', marginBottom: '32px' }}>
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)`, marginBottom: '20px' }} />
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: t.accentMuted, marginBottom: '8px' }}>{heading}</p>
        <p style={{ fontSize: '13px', color: t.textFaint, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto', fontStyle: 'italic' }}>{subtext}</p>
      </div>

      {/* Support cards */}
      {visible.map(account => (
        <SupportCard
          key={account.id}
          account={account}
          capsuleId={capsuleId}
          honourName={honourName}
          supabase={supabase}
          t={t}
        />
      ))}

      {isRepView && (
        <p style={{ fontSize: '11px', color: t.textFaint, textAlign: 'center', marginTop: '8px', fontStyle: 'italic' }}>
          Acknowledgements are visible to you and the organiser.
        </p>
      )}
    </div>
  )
}
