/**
 * ============================================================
 * FILE PATH: app/manage/[slug]/attire/page.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Attire Coordination — Organiser Management Dashboard
 * Manages the full attire lifecycle: showcase → orders → payments → dispatch
 *
 * Sub-sections:
 *   1. Imports & types
 *   2. Style constants
 *   3. VariantCard — display/edit attire items
 *   4. OrderRow — individual order with status controls
 *   5. AddVariantForm — create new attire variant
 *   6. PaymentRow — payment record display
 *   7. SummaryStats — top-level dashboard stats
 *   8. Main page component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Imports & types
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

interface Variant {
  id: string; name: string; description: string | null
  price_per_unit: number; unit_type: string; image_url: string | null
  sort_order: number; cutoff_date: string | null; created_at: string
}

interface Order {
  id: string; variant_id: string; guest_name: string
  phone: string | null; email: string | null
  quantity: number; total_due: number; amount_paid: number
  custodian_name: string | null; custodian_address: string | null
  custodian_phone: string | null; delivery_type: string
  dispatch_cost: number; status: string; created_at: string
}

interface Payment {
  id: string; order_id: string; amount: number
  payment_date: string; reported_by: string
  proof_url: string | null; verified: boolean
  verified_at: string | null; created_at: string
}

type View = 'variants' | 'orders' | 'payments'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================
// SECTION 2 — Style constants (matches manage page aesthetic)
// ============================================================

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
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ordered:            { label: 'Ordered',   color: 'rgba(226,195,107,0.9)', bg: 'rgba(226,195,107,0.08)' },
  payment_confirmed:  { label: 'Paid',      color: 'rgba(134,239,172,0.9)', bg: 'rgba(74,222,128,0.08)' },
  ready:              { label: 'Ready',     color: 'rgba(139,159,212,0.9)', bg: 'rgba(139,159,212,0.08)' },
  dispatched:         { label: 'Sent',      color: 'rgba(180,160,216,0.9)', bg: 'rgba(180,160,216,0.08)' },
  collected:          { label: 'Collected', color: 'rgba(134,239,172,0.7)', bg: 'rgba(74,222,128,0.05)' },
  cancelled:          { label: 'Cancelled', color: 'rgba(248,113,113,0.7)', bg: 'rgba(248,113,113,0.05)' },
}

const NEXT_STATUS: Record<string, string> = {
  ordered: 'payment_confirmed',
  payment_confirmed: 'ready',
  ready: 'dispatched',
  dispatched: 'collected',
}

// ============================================================
// SECTION 3 — VariantCard
// ============================================================

function VariantCard({ v, onEdit, onDelete }: {
  v: Variant; onEdit: () => void; onDelete: () => void
}) {
  const isPastCutoff = v.cutoff_date && new Date(v.cutoff_date) < new Date()

  return (
    <div style={{ padding: '14px 16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: gold, margin: '0 0 4px' }}>{v.name}</p>
          {v.description && <p style={{ fontSize: '12px', color: textSecondary, margin: '0 0 6px', lineHeight: 1.6 }}>{v.description}</p>}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '12px', color: textPrimary, fontWeight: 600 }}>
              {v.price_per_unit.toLocaleString()} per {v.unit_type || 'piece'}
            </span>
            {v.cutoff_date && (
              <span style={{ fontSize: '11px', color: isPastCutoff ? 'rgba(248,113,113,0.7)' : textFaint }}>
                {isPastCutoff ? '🔒 Orders closed' : `Cutoff: ${new Date(v.cutoff_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </span>
            )}
          </div>
        </div>
        {v.image_url && (
          <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: `1px solid ${goldFaint}` }}>
            <img src={v.image_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        <button onClick={onEdit} style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${goldFaint}`, background: 'rgba(226,195,107,0.06)', color: goldMuted, cursor: 'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>Remove</button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 4 — OrderRow
// ============================================================

function OrderRow({ o, variants, onAdvance }: {
  o: Order; variants: Variant[]; onAdvance: (id: string, status: string) => void
}) {
  const variant = variants.find(v => v.id === o.variant_id)
  const statusDef = STATUS_LABELS[o.status] ?? STATUS_LABELS.ordered
  const nextStatus = NEXT_STATUS[o.status]
  const paidPct = o.total_due > 0 ? Math.round((o.amount_paid / o.total_due) * 100) : 0

  return (
    <div style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0 }}>{o.guest_name}</p>
          <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>
            {variant?.name ?? 'Unknown'} × {o.quantity}
            {o.email && <span> · {o.email}</span>}
          </p>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '6px', background: statusDef.bg, color: statusDef.color, flexShrink: 0 }}>
          {statusDef.label}
        </span>
      </div>

      {/* Payment progress bar */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', color: textFaint }}>Payment</span>
          <span style={{ fontSize: '10px', color: paidPct >= 100 ? 'rgba(134,239,172,0.8)' : goldMuted }}>
            {o.amount_paid.toLocaleString()} / {o.total_due.toLocaleString()} ({paidPct}%)
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)' }}>
          <div style={{ height: '100%', width: `${Math.min(100, paidPct)}%`, background: paidPct >= 100 ? 'rgba(74,222,128,0.6)' : `linear-gradient(to right, ${goldMuted}, ${gold})`, borderRadius: '2px' }} />
        </div>
      </div>

      {/* Delivery info */}
      {o.delivery_type === 'custodian' && o.custodian_name && (
        <p style={{ fontSize: '10px', color: textFaint, margin: '0 0 6px' }}>
          📦 Custodian: {o.custodian_name} · {o.custodian_address}
        </p>
      )}
      {o.delivery_type === 'pickup' && (
        <p style={{ fontSize: '10px', color: textFaint, margin: '0 0 6px' }}>📍 Collection at venue</p>
      )}

      {/* Advance status button */}
      {nextStatus && (
        <button onClick={() => onAdvance(o.id, nextStatus)} style={{ fontSize: '10px', padding: '5px 14px', borderRadius: '6px', border: `1px solid ${goldFaint}`, background: 'rgba(226,195,107,0.06)', color: goldMuted, cursor: 'pointer' }}>
          → Mark as {STATUS_LABELS[nextStatus]?.label ?? nextStatus}
        </button>
      )}
    </div>
  )
}

// ============================================================
// SECTION 5 — AddVariantForm
// ============================================================

function AddVariantForm({ capsuleId, onAdded }: { capsuleId: string; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('piece')
  const [cutoff, setCutoff] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !price) return
    setSaving(true)
    await fetch('/api/attire/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id: capsuleId,
        name: name.trim(),
        description: desc.trim() || undefined,
        price_per_unit: parseFloat(price),
        unit_type: unit,
        cutoff_date: cutoff || undefined,
      }),
    })
    setName(''); setDesc(''); setPrice(''); setCutoff('')
    setSaving(false)
    onAdded()
  }

  return (
    <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg }}>
      <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>New Attire Item</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp} placeholder="Item name (e.g. Aso-Oke — Gold & Burgundy) *" value={name} onChange={e => setName(e.target.value)} />
        <textarea style={{ ...inp, resize: 'none' as const, lineHeight: 1.6 }} rows={2} placeholder="Description (styling suggestions, available sizes…)" value={desc} onChange={e => setDesc(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={{ ...inp, flex: 1 }} type="number" placeholder="Price per unit *" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" />
          <select style={{ ...inp, flex: 1 }} value={unit} onChange={e => setUnit(e.target.value)}>
            <option value="piece">Per piece</option>
            <option value="yard">Per yard</option>
            <option value="set">Per set</option>
            <option value="bundle">Per bundle</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>Order cutoff date (optional)</label>
          <input type="date" style={inp} value={cutoff} onChange={e => setCutoff(e.target.value)} />
        </div>
        <button onClick={handleSave} disabled={saving || !name.trim() || !price} style={{ padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() || !price ? 0.6 : 1 }}>
          {saving ? 'Adding…' : 'Add Item'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 6 — PaymentRow
// ============================================================

function PaymentRow({ p, onVerify }: { p: Payment; onVerify: (id: string) => void }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: '12px', color: textPrimary, fontWeight: 600, margin: 0 }}>
          {p.amount.toLocaleString()} — {p.reported_by}
        </p>
        <p style={{ fontSize: '10px', color: textFaint, margin: '2px 0 0' }}>
          {new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          {p.proof_url && <span> · <a href={p.proof_url} target="_blank" rel="noopener noreferrer" style={{ color: goldMuted, textDecoration: 'underline' }}>View proof</a></span>}
        </p>
      </div>
      {p.verified ? (
        <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(74,222,128,0.08)', color: 'rgba(134,239,172,0.8)' }}>✓ Verified</span>
      ) : (
        <button onClick={() => onVerify(p.id)} style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${goldFaint}`, background: 'rgba(226,195,107,0.06)', color: goldMuted, cursor: 'pointer' }}>Verify</button>
      )}
    </div>
  )
}

// ============================================================
// SECTION 7 — SummaryStats
// ============================================================

function SummaryStats({ orders, variants }: { orders: Order[]; variants: Variant[] }) {
  const totalOrders = orders.length
  const totalQty = orders.reduce((s, o) => s + o.quantity, 0)
  const totalRevenue = orders.reduce((s, o) => s + o.total_due, 0)
  const totalPaid = orders.reduce((s, o) => s + o.amount_paid, 0)
  const fullyPaid = orders.filter(o => o.amount_paid >= o.total_due).length

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
      {[
        { label: 'Orders', value: totalOrders },
        { label: 'Qty', value: totalQty },
        { label: 'Expected', value: totalRevenue.toLocaleString(), accent: true },
        { label: 'Paid', value: totalPaid.toLocaleString() },
        { label: 'Fully Paid', value: fullyPaid },
      ].map(s => (
        <div key={s.label} style={{ flex: 1, minWidth: '60px', padding: '10px 8px', borderRadius: '10px', background: s.accent ? 'rgba(226,195,107,0.07)' : cardBg, border: `1px solid ${s.accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: s.accent ? gold : textPrimary, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
          <div style={{ fontSize: '8px', color: textFaint, marginTop: '2px', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// SECTION 8 — Main page component
// ============================================================

export default function AttireManagePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [capsuleId, setCapsuleId] = useState<string | null>(null)
  const [capsuleName, setCapsuleName] = useState('')
  const [variants, setVariants] = useState<Variant[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [view, setView] = useState<View>('variants')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')

  // ── Fetch capsule ────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('capsules')
        .select('id, honouree_name')
        .eq('slug', slug)
        .single()
      if (data) {
        setCapsuleId(data.id)
        setCapsuleName(data.honouree_name)
        setPublicUrl(`${window.location.origin}/for/${slug}/attire`)
      }
      setLoading(false)
    }
    if (slug) load()
  }, [slug])

  // ── Fetch data ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!capsuleId) return

    const [vRes, oRes] = await Promise.all([
      fetch(`/api/attire/variants?capsule_id=${capsuleId}`).then(r => r.json()),
      fetch(`/api/attire/orders?capsule_id=${capsuleId}`).then(r => r.json()),
    ])
    setVariants(vRes.variants ?? [])
    setOrders(oRes.orders ?? [])

    // Fetch payments for all orders
    const pRes = await fetch(`/api/attire/payments?capsule_id=${capsuleId}`).then(r => r.json())
    setPayments(pRes.payments ?? [])
  }, [capsuleId])

  useEffect(() => { if (capsuleId) fetchData() }, [capsuleId, fetchData])

  // ── Handlers ─────────────────────────────────────────
  const handleDeleteVariant = async (id: string) => {
    if (!window.confirm('Remove this attire item?')) return
    await fetch(`/api/attire/variants?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAdvanceOrder = async (id: string, newStatus: string) => {
    await fetch('/api/attire/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    fetchData()
  }

  const handleVerifyPayment = async (id: string) => {
    await fetch('/api/attire/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verified: true }),
    })
    fetchData()
  }

  // ── Loading state ────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '11px', color: textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Loading attire dashboard…</p>
    </div>
  )

  // ── Main render ──────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: textPrimary }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(226,195,107,0.08)`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/manage/${slug}`} style={{ fontSize: '12px', color: goldMuted, textDecoration: 'none' }}>← Dashboard</Link>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", margin: 0 }}>Fabric & Attire</p>
            <p style={{ fontSize: '10px', color: textFaint, margin: '1px 0 0' }}>{capsuleName}</p>
          </div>
          <Link href={publicUrl} target="_blank" style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: 'rgba(134,239,172,0.9)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            Guest View ↗
          </Link>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px' }}>

        {/* Summary stats */}
        <SummaryStats orders={orders} variants={variants} />

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', padding: '4px', border: `1px solid ${cardBorder}` }}>
          {[
            { id: 'variants' as View, label: `Items (${variants.length})` },
            { id: 'orders' as View, label: `Orders (${orders.length})` },
            { id: 'payments' as View, label: `Payments (${payments.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: view === tab.id ? 700 : 400, background: view === tab.id ? goldFaint : 'transparent', color: view === tab.id ? gold : textFaint, border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── VARIANTS VIEW ── */}
        {view === 'variants' && (
          <div>
            {variants.map(v => (
              <VariantCard key={v.id} v={v} onEdit={() => {/* TODO: inline edit */}} onDelete={() => handleDeleteVariant(v.id)} />
            ))}

            {adding ? (
              <div style={{ marginBottom: '10px' }}>
                <AddVariantForm capsuleId={capsuleId!} onAdded={() => { setAdding(false); fetchData() }} />
                <button onClick={() => setAdding(false)} style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'transparent', border: 'none', color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                + Add Attire Item
              </button>
            )}

            {variants.length === 0 && !adding && (
              <p style={{ fontSize: '13px', color: textFaint, textAlign: 'center', padding: '32px 0', lineHeight: 1.7 }}>
                No attire items yet. Add your first item to open the showcase for guests.
              </p>
            )}
          </div>
        )}

        {/* ── ORDERS VIEW ── */}
        {view === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <p style={{ fontSize: '13px', color: textFaint, textAlign: 'center', padding: '32px 0' }}>
                No orders yet. Share the attire page with your guests to start receiving orders.
              </p>
            ) : (
              orders.map(o => (
                <OrderRow key={o.id} o={o} variants={variants} onAdvance={handleAdvanceOrder} />
              ))
            )}
          </div>
        )}

        {/* ── PAYMENTS VIEW ── */}
        {view === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <p style={{ fontSize: '13px', color: textFaint, textAlign: 'center', padding: '32px 0' }}>
                No payments recorded yet. Guests can report payments after placing an order.
              </p>
            ) : (
              payments.map(p => (
                <PaymentRow key={p.id} p={p} onVerify={handleVerifyPayment} />
              ))
            )}
          </div>
        )}

        {/* ── SHARE SECTION ── */}
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '8px' }}>Guest Attire Page</p>
          <p style={{ fontSize: '12px', color: textFaint, marginBottom: '12px', lineHeight: 1.6 }}>
            Share this link with guests. They can view items, place orders, and report payments.
          </p>
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: goldFaint, border: `1px solid rgba(226,195,107,0.15)`, fontSize: '11px', color: goldMuted, wordBreak: 'break-all' as const }}>
            {publicUrl}
          </div>
        </div>
      </div>
    </div>
  )
}
