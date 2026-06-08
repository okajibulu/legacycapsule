/**
 * ============================================================
 * FILE PATH: app/for/[slug]/attire/AttireClientIsland.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Client island for public attire page. Handles:
 * - Variant showcase display
 * - Order form (guest submits order)
 * - Payment report form (guest reports payment after ordering)
 * - Order confirmation state
 *
 * Sub-sections:
 *   1. Types & imports
 *   2. VariantShowcaseCard
 *   3. OrderForm — guest order submission
 *   4. PaymentReportForm — guest payment self-report
 *   5. Main component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types & imports
// ============================================================

import { useState } from 'react'
import { getThemeConfig } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'

interface Variant {
  id: string; name: string; description: string | null
  price_per_unit: number; unit_type: string
  image_url: string | null; cutoff_date: string | null
}

interface Props {
  capsuleId: string
  capsuleSlug: string
  honoureeName: string
  variants: Variant[]
  themeKey: ThemeKey
}

// ============================================================
// SECTION 2 — VariantShowcaseCard
// ============================================================

function VariantShowcaseCard({ v, onOrder, t }: {
  v: Variant; onOrder: (v: Variant) => void; t: any
}) {
  const isPastCutoff = v.cutoff_date && new Date(v.cutoff_date) < new Date()

  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      border: `1px solid ${t.accentFaint}`,
      background: t.cardBg,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      marginBottom: '16px',
    }}>
      {/* Image */}
      {v.image_url && (
        <div style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
          <img src={v.image_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '18px', fontWeight: 700, color: '#ffffff',
          margin: '0 0 8px',
        }}>
          {v.name}
        </h3>

        {v.description && (
          <p style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.75, margin: '0 0 12px' }}>
            {v.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '8px' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: t.accentPrimary, margin: 0 }}>
            {v.price_per_unit.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 400, color: t.textFaint }}>per {v.unit_type || 'piece'}</span>
          </p>

          {v.cutoff_date && (
            <p style={{ fontSize: '11px', color: isPastCutoff ? 'rgba(248,113,113,0.7)' : t.textFaint, margin: 0 }}>
              {isPastCutoff
                ? '🔒 Orders closed'
                : `Order by ${new Date(v.cutoff_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
              }
            </p>
          )}
        </div>

        {/* Order button */}
        {!isPastCutoff && (
          <button
            onClick={() => onOrder(v)}
            style={{
              width: '100%', marginTop: '16px', padding: '12px',
              borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
              color: '#1a0845', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            Place Order
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SECTION 3 — OrderForm
// ============================================================

function OrderForm({ variant, capsuleId, onSuccess, onCancel, t }: {
  variant: Variant; capsuleId: string
  onSuccess: (orderId: string, totalDue: number) => void
  onCancel: () => void; t: any
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [qty, setQty] = useState(1)
  const [delivery, setDelivery] = useState<'pickup' | 'custodian'>('pickup')
  const [custName, setCustName] = useState('')
  const [custAddr, setCustAddr] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalDue = variant.price_per_unit * qty

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '11px 14px', borderRadius: '10px',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    color: t.textBody, outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Your name is required.'); return }
    setSubmitting(true); setError('')

    const res = await fetch('/api/attire/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id: capsuleId,
        variant_id: variant.id,
        guest_name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        quantity: qty,
        delivery_type: delivery,
        custodian_name: delivery === 'custodian' ? custName.trim() : undefined,
        custodian_address: delivery === 'custodian' ? custAddr.trim() : undefined,
        custodian_phone: delivery === 'custodian' ? custPhone.trim() : undefined,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    onSuccess(data.id, data.total_due)
  }

  return (
    <div style={{ padding: '20px', borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: t.accentPrimary, margin: 0 }}>Order: {variant.name}</p>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: t.textFaint, fontSize: '18px', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input style={inp} placeholder="Your full name *" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={{ ...inp, flex: 1 }} placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <input style={{ ...inp, flex: 1 }} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        {/* Quantity */}
        <div>
          <label style={{ fontSize: '10px', color: t.accentMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>
            Quantity
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, color: t.textPrimary, fontSize: '16px', cursor: 'pointer' }}>−</button>
            <span style={{ fontSize: '18px', fontWeight: 700, color: t.textPrimary, minWidth: '30px', textAlign: 'center' }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(100, q + 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, color: t.textPrimary, fontSize: '16px', cursor: 'pointer' }}>+</button>
            <span style={{ fontSize: '14px', color: t.accentPrimary, fontWeight: 600, marginLeft: 'auto' }}>
              Total: {totalDue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Delivery type */}
        <div>
          <label style={{ fontSize: '10px', color: t.accentMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
            How will you receive your fabric?
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setDelivery('pickup')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${delivery === 'pickup' ? t.accentPrimary : t.accentFaint}`, background: delivery === 'pickup' ? `${t.accentFaint}` : 'transparent', color: delivery === 'pickup' ? t.accentPrimary : t.textFaint, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              📍 Collect at venue
            </button>
            <button onClick={() => setDelivery('custodian')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${delivery === 'custodian' ? t.accentPrimary : t.accentFaint}`, background: delivery === 'custodian' ? `${t.accentFaint}` : 'transparent', color: delivery === 'custodian' ? t.accentPrimary : t.textFaint, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              📦 Send to custodian
            </button>
          </div>
        </div>

        {/* Custodian fields */}
        {delivery === 'custodian' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px', border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '11px', color: t.textFaint, margin: '0 0 4px', lineHeight: 1.6 }}>
              A custodian is someone at a local address in the event country who will receive the fabric on your behalf.
            </p>
            <input style={inp} placeholder="Custodian name *" value={custName} onChange={e => setCustName(e.target.value)} />
            <textarea style={{ ...inp, resize: 'none' as const, lineHeight: 1.6 }} rows={2} placeholder="Custodian address *" value={custAddr} onChange={e => setCustAddr(e.target.value)} />
            <input style={inp} placeholder="Custodian phone" value={custPhone} onChange={e => setCustPhone(e.target.value)} />
          </div>
        )}

        {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim()}
          style={{
            width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
            background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
            color: '#1a0845', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            opacity: submitting || !name.trim() ? 0.6 : 1,
          }}
        >
          {submitting ? 'Placing order…' : `Place Order — ${totalDue.toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 4 — PaymentReportForm
// ============================================================

function PaymentReportForm({ orderId, totalDue, guestName, onDone, t }: {
  orderId: string; totalDue: number; guestName: string
  onDone: () => void; t: any
}) {
  const [amount, setAmount] = useState(String(totalDue))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const inp: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '11px 14px', borderRadius: '10px',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    color: t.textBody, outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await fetch('/api/attire/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        amount: parseFloat(amount),
        payment_date: date,
        reported_by: guestName,
      }),
    })
    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', border: `1px solid rgba(74,222,128,0.2)`, background: 'rgba(74,222,128,0.05)', textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>✓</p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(134,239,172,0.9)' }}>Payment reported</p>
        <p style={{ fontSize: '12px', color: t.textFaint, marginTop: '4px' }}>The organiser will verify your payment shortly.</p>
        <button onClick={onDone} style={{ marginTop: '12px', fontSize: '12px', color: t.accentMuted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Continue browsing</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', borderRadius: '16px', border: `1px solid ${t.accentFaint}`, background: t.cardBg, marginBottom: '16px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: t.accentPrimary, marginBottom: '12px' }}>Report Payment</p>
      <p style={{ fontSize: '12px', color: t.textFaint, marginBottom: '12px', lineHeight: 1.6 }}>
        After making your payment to the organiser, report it here so they can track and confirm it.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input type="number" style={inp} placeholder="Amount paid" value={amount} onChange={e => setAmount(e.target.value)} />
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={handleSubmit} disabled={submitting || !amount} style={{ padding: '11px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`, color: '#1a0845', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Reporting…' : 'Report Payment'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 5 — Main component
// ============================================================

export default function AttireClientIsland({ capsuleId, capsuleSlug, honoureeName, variants, themeKey }: Props) {
  const t = getThemeConfig(themeKey)
  const [orderingVariant, setOrderingVariant] = useState<Variant | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; totalDue: number; guestName: string } | null>(null)

  // Order success — show payment report form
  const handleOrderSuccess = (orderId: string, totalDue: number) => {
    setConfirmedOrder({ id: orderId, totalDue, guestName: '' })
    setOrderingVariant(null)
  }

  return (
    <div>
      {/* Confirmed order → payment report */}
      {confirmedOrder && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.05)', textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '16px', marginBottom: '6px' }}>✦</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(134,239,172,0.9)' }}>Order placed successfully</p>
            <p style={{ fontSize: '12px', color: t.textFaint, marginTop: '4px' }}>Amount due: {confirmedOrder.totalDue.toLocaleString()}</p>
          </div>

          <PaymentReportForm
            orderId={confirmedOrder.id}
            totalDue={confirmedOrder.totalDue}
            guestName={confirmedOrder.guestName}
            onDone={() => setConfirmedOrder(null)}
            t={t}
          />
        </div>
      )}

      {/* Active order form */}
      {orderingVariant && !confirmedOrder && (
        <OrderForm
          variant={orderingVariant}
          capsuleId={capsuleId}
          onSuccess={handleOrderSuccess}
          onCancel={() => setOrderingVariant(null)}
          t={t}
        />
      )}

      {/* Variant showcase cards */}
      {!orderingVariant && !confirmedOrder && variants.map(v => (
        <VariantShowcaseCard
          key={v.id}
          v={v}
          onOrder={setOrderingVariant}
          t={t}
        />
      ))}
    </div>
  )
}
