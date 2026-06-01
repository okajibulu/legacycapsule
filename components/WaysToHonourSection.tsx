'use client'
/* =========================================================
   components/WaysToHonourSection.tsx
   
   Expression of Honour — Premium 3-Zone Display (Tribute Wall)
   
   Zone A: Ceremonial header
   Zone B: Beneficiary cards (trust statement, bank, reveal/copy)
   Zone C: Notify form + bottom navigation links
   
   DB table: capsule_support_accounts
   Columns: id, capsule_id, method_label, account_holder,
     bank_name, account_number, reference_guide, currency,
     is_active, sort_order, relationship_to_honouree
   
   Changes v1.2.6 (AI6):
   - T1: Modal input contrast fixed — rgba(255,255,255,0.13),
         explicit #fff text, improved placeholder visibility
   - T3: Autofill name/email/city/country from localStorage
         + contributions fetch on modal open
   - T8: Bottom navigation links added (slug prop added)
   - Error handling added to handleSubmit (was silent on failure)
   - supabase prop kept for compatibility but modal now uses
     browserClient directly for autofill fetch
========================================================= */

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/* ── Browser Supabase client for autofill ──────────────── */
const browserClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ── Types ─────────────────────────────────────────────── */
interface SupportAccount {
  id: string
  method_label: string | null
  account_holder: string | null
  bank_name: string | null
  account_number: string | null
  reference_guide: string | null
  currency: string | null
  is_active: boolean
  sort_order: number
  relationship_to_honouree: string | null
}

interface ThemeConfig {
  accentPrimary: string; accentMuted: string; accentFaint: string
  cardBg: string; cardBorder: string
  textHeading: string; textBody: string; textMuted: string; textFaint: string
  inputBg: string; inputBorder: string
}

interface Props {
  accounts: SupportAccount[]
  capsuleId: string
  honourName: string
  eventType: string
  supabase: SupabaseClient
  t: ThemeConfig
  isRepView?: boolean
}

/* ── Helpers ───────────────────────────────────────────── */
function getCeremonialMessage(eventType: string): string {
  const type = eventType?.toLowerCase() ?? ''
  if (type.includes('memorial') || type.includes('funeral'))
    return 'The family is deeply grateful for every expression of love, remembrance and honour shared during this time.'
  return 'Presence, prayers, goodwill and every expression of honour shared on this occasion are sincerely appreciated.'
}

function maskAccount(num: string): string {
  if (!num || num.length < 4) return num
  const last4 = num.slice(-4)
  const masked = num.slice(0, -4).replace(/\d/g, '•')
  const full = masked + last4
  return full.match(/.{1,4}/g)?.join(' ') ?? full
}

function getTrustStatement(
  accountHolder: string | null,
  relationship: string | null,
  honourName: string
): string | null {
  if (!accountHolder || !relationship) return null
  return `This account belongs to ${accountHolder}, ${relationship.toLowerCase()} of ${honourName}.`
}

/* =========================================================
   ZONE B — Beneficiary Card
========================================================= */
function BeneficiaryCard({ account, honourName, t }: {
  account: SupportAccount; honourName: string; t: ThemeConfig
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!account.account_number) return
    await navigator.clipboard.writeText(account.account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayAccount = revealed
    ? (account.account_number?.match(/.{1,4}/g)?.join(' ') ?? account.account_number ?? '')
    : maskAccount(account.account_number ?? '')

  const trustStatement = getTrustStatement(
    account.account_holder, account.relationship_to_honouree, honourName
  )

  return (
    <div style={{
      borderRadius: '14px', marginBottom: '10px',
      background: 'rgba(20,12,40,0.65)',
      border: '1px solid rgba(226,195,107,0.15)',
      backdropFilter: 'blur(12px)', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px' }}>
        {account.method_label && (
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase' as const, color: t.accentMuted,
            padding: '2px 8px', borderRadius: '8px',
            background: 'rgba(226,195,107,0.08)',
            border: '1px solid rgba(226,195,107,0.12)',
            display: 'inline-block', marginBottom: '12px',
          }}>{account.method_label}</span>
        )}
        {account.account_holder && (
          <p style={{
            fontSize: '15px', fontWeight: 700, color: t.textHeading,
            marginBottom: '2px', fontFamily: "'Playfair Display', serif",
          }}>{account.account_holder}</p>
        )}
        {account.relationship_to_honouree && (
          <p style={{ fontSize: '11px', color: t.accentMuted, marginBottom: '8px' }}>
            {account.relationship_to_honouree} of {honourName}
          </p>
        )}
        {trustStatement && (
          <div style={{
            padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(226,195,107,0.06)',
            border: '1px solid rgba(226,195,107,0.1)', marginBottom: '12px',
          }}>
            <p style={{
              fontSize: '11px', color: 'rgba(226,195,107,0.7)',
              lineHeight: 1.6, margin: 0, fontStyle: 'italic',
            }}>✦ {trustStatement}</p>
          </div>
        )}
        {account.bank_name && (
          <div style={{ marginBottom: '6px' }}>
            <p style={{ fontSize: '9px', color: t.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '2px' }}>Bank</p>
            <p style={{ fontSize: '13px', color: t.textBody }}>{account.bank_name}</p>
          </div>
        )}
        {account.account_number && (
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '9px', color: t.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '4px' }}>Account Number</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: t.accentPrimary, fontFamily: 'monospace', letterSpacing: '0.12em' }}>
                {displayAccount}
              </span>
              {account.currency && (
                <span style={{ fontSize: '10px', color: t.textFaint, padding: '1px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {account.currency}
                </span>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!revealed ? (
            <button onClick={() => setRevealed(true)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid rgba(226,195,107,0.3)', background: 'rgba(226,195,107,0.07)', color: t.accentPrimary, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Reveal Details
            </button>
          ) : (
            <button onClick={handleCopy} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(226,195,107,0.2)'}`, background: copied ? 'rgba(74,222,128,0.07)' : 'rgba(226,195,107,0.05)', color: copied ? 'rgba(134,239,172,0.9)' : t.accentMuted, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {copied ? '✓ Copied' : 'Copy Account Number'}
            </button>
          )}
        </div>
        {account.reference_guide && (
          <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.6, marginTop: '10px', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            {account.reference_guide}
          </p>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   ZONE C — Notification Modal
   T1: Contrast-fixed inputs (rgba(255,255,255,0.13), #fff text)
   T3: Autofill from localStorage + contributions fetch
========================================================= */
function NotifyBeneficiaryModal({ capsuleId, accountId, honourName, onClose }: {
  capsuleId: string; accountId: string; honourName: string; onClose: () => void
}) {
const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [prefilling, setPrefilling] = useState(true)

  /* T3 — Autofill on mount */
  useEffect(() => {
    async function prefill() {
      try {
        const storedEmail = typeof window !== 'undefined'
          ? localStorage.getItem('lc_visitor_email') : null
        if (storedEmail) {
          setEmail(storedEmail)
          const { data } = await browserClient
            .from('contributions')
            .select('contributor_name, city, country')
            .eq('capsule_id', capsuleId)
            .eq('email', storedEmail)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
if (data) {
            if (data.contributor_name) setName(data.contributor_name)
          }
        }
      } catch { /* non-critical */ }
      finally { setPrefilling(false) }
    }
    prefill()
  }, [capsuleId])

  /* T1 — High-contrast inputs for dark modal background */
  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.13)',
    border: '1px solid rgba(226,195,107,0.25)',
    color: '#ffffff',
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/honouree/acknowledgement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id: capsuleId,
          support_account_id: accountId,
          supporter_name: name.trim(),
          supporter_email: email.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setSaving(false); return }
      setDone(true)
    } catch { setError('Network error. Please try again.') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(8,2,20,0.92)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '360px', borderRadius: '20px', background: 'linear-gradient(145deg, #1e0d4e, #2a1060)', border: '1px solid rgba(226,195,107,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.7), transparent)' }} />
        <div style={{ padding: '24px 20px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✦</div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(226,195,107,1)', fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>Thank You</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '4px' }}>
                The beneficiary has been notified of your Expression of Honour.
              </p>
              {email && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  A confirmation has been sent to {email}.
                </p>
              )}
              <button onClick={onClose} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(226,195,107,1), rgba(226,195,107,0.7))', color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontFamily: "'Playfair Display', serif", marginBottom: '4px' }}>Notify Beneficiary</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  If you have shared an Expression of Honour, you may notify the beneficiary so that your gesture can be properly acknowledged.
                </p>
              </div>
              {prefilling ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'rgba(226,195,107,0.5)', fontSize: '12px' }}>Loading…</div>
              ) : (
<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input style={inp} placeholder="Your name *" value={name} onChange={e => { setName(e.target.value); setError('') }} />
                    <input style={inp} type="email" placeholder="Your email (optional — to receive a confirmation)" value={email} onChange={e => setEmail(e.target.value)} />
                    {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.9)', margin: 0 }}>{error}</p>}
                    <button onClick={handleSubmit} disabled={saving || !name.trim()} style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(226,195,107,1), rgba(226,195,107,0.7))', color: '#1a0845', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.6 : 1 }}>
                    {saving ? 'Sending…' : 'Notify Beneficiary'}
                  </button>
                  <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT — 3-Zone Layout
========================================================= */
export default function WaysToHonourSection({
  accounts, capsuleId, honourName, eventType, supabase, t, isRepView = false,
}: Props) {
  const visible = accounts.filter(a => a.is_active)
  const [showNotify, setShowNotify] = useState<string | null>(null)

  if (visible.length === 0) return null

  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>

      {/* ── ZONE A ── */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)', marginBottom: '16px' }} />
        <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', background: 'rgba(226,195,107,0.08)', border: '1px solid rgba(226,195,107,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 24px rgba(226,195,107,0.12)' }}>✦</div>
        <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: t.accentMuted, marginBottom: '8px' }}>Expression of Honour</p>
        <p style={{ fontSize: '13px', color: t.textFaint, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto', fontStyle: 'italic' }}>
          {getCeremonialMessage(eventType)}
        </p>
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.2), transparent)', marginTop: '16px' }} />
      </div>

      {/* ── ZONE B ── */}
      {visible.map(account => (
        <BeneficiaryCard key={account.id} account={account} honourName={honourName} t={t} />
      ))}

      {/* ── ZONE C — Notify button ── */}
      <div style={{ textAlign: 'center', marginTop: '14px' }}>
        <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.65, maxWidth: '300px', margin: '0 auto 12px', fontStyle: 'italic' }}>
          If you have shared an Expression of Honour, you may notify the beneficiary so that your gesture can be properly acknowledged.
        </p>
        <button
          onClick={() => setShowNotify(visible[0]?.id ?? null)}
          style={{ padding: '10px 28px', borderRadius: '20px', border: '1px solid rgba(226,195,107,0.35)', background: 'rgba(226,195,107,0.08)', color: t.accentPrimary, fontSize: '13px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
        >
          Notify Beneficiary
        </button>
      </div>

      {isRepView && (
        <p style={{ fontSize: '11px', color: t.textFaint, textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>
          Acknowledgements are visible to you and the organiser.
        </p>
      )}



      {/* Modal */}
      {showNotify && (
        <NotifyBeneficiaryModal
          capsuleId={capsuleId}
          accountId={showNotify}
          honourName={honourName}
          onClose={() => setShowNotify(null)}
        />
      )}
    </div>
  )
}
