'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/OrderHistoryPanel.tsx
// PURPOSE: Shows payment order history in the manage dashboard Settings tab.
//          Displays each order: services purchased, amount, date, status, processor.
//          Reads from /api/capsule/orders.
// BUILT BY: AI12 · Claude Opus 4.6 · 21 July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Types & tokens ═══

import { useState, useEffect } from 'react'

interface Order {
  id:         string
  processor:  string
  amount:     number
  symbol:     string
  currency:   string
  status:     string
  paid_at:    string | null
  created_at: string
  features:   string[]
  region:     string | null
}

interface Summary {
  total_orders: number
  total_paid:   number
  currency:     string
  symbol:       string
}

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.08)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'

// ═══ SECTION 2 — Helpers ═══

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function StatusBadge({ status }: { status: string }) {
  const isPaid    = status === 'paid' || status === 'succeeded'
  const isPending = status === 'pending'
  const color     = isPaid ? 'rgba(134,239,172,0.8)' : isPending ? 'rgba(226,195,107,0.7)' : 'rgba(248,113,113,0.7)'
  const bg        = isPaid ? 'rgba(74,222,128,0.08)' : isPending ? 'rgba(226,195,107,0.08)' : 'rgba(248,113,113,0.08)'
  const border    = isPaid ? 'rgba(74,222,128,0.2)' : isPending ? 'rgba(226,195,107,0.2)' : 'rgba(248,113,113,0.2)'
  const label     = isPaid ? 'Paid' : isPending ? 'Pending' : status

  return (
    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '20px', background: bg, border: `1px solid ${border}`, color, flexShrink: 0 }}>
      {label}
    </span>
  )
}

// ═══ SECTION 3 — Main component ═══

export default function OrderHistoryPanel({ capsuleId }: { capsuleId: string }) {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch(`/api/capsule/orders?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setOrders(d.orders ?? [])
        setSummary(d.summary ?? null)
      })
      .catch(() => setError('Failed to load order history'))
      .finally(() => setLoading(false))
  }, [capsuleId])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' as const }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid rgba(226,195,107,0.2)`, borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ fontSize: '11px', color: textFaint }}>Loading order history…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.7)', padding: '12px 0' }}>{error}</p>
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '20px', borderRadius: '12px', border: '1px dashed rgba(226,195,107,0.15)', textAlign: 'center' as const }}>
        <p style={{ fontSize: '13px', color: textFaint, margin: '0 0 4px' }}>No orders yet</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.6 }}>
          Services you add to your capsule will appear here with their payment details.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Summary strip ── */}
      {summary && summary.total_paid > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', background: goldFaint, border: `1px solid ${cardBorder}`, textAlign: 'center' as const }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: gold, margin: '0 0 2px', fontFamily: "'Playfair Display', serif" }}>
              {summary.symbol}{summary.total_paid.toLocaleString()}
            </p>
            <p style={{ fontSize: '9px', color: textFaint, margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Total Spent</p>
          </div>
          <div style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', background: cardBg, border: `1px solid rgba(255,255,255,0.06)`, textAlign: 'center' as const }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, margin: '0 0 2px', fontFamily: "'Playfair Display', serif" }}>
              {summary.total_orders}
            </p>
            <p style={{ fontSize: '9px', color: textFaint, margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Order{summary.total_orders !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* ── Order list ── */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {orders.map(order => (
          <div key={order.id} style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, overflow: 'hidden' }}>
            {/* Order header */}
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Features */}
                {order.features.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '6px' }}>
                    {order.features.map(f => (
                      <span key={f} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(226,195,107,0.08)', border: `1px solid rgba(226,195,107,0.15)`, color: goldMuted }}>
                        {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: textFaint, margin: '0 0 6px' }}>Capsule setup</p>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: textFaint }}>
                    {order.paid_at ? `Paid ${formatDate(order.paid_at)}` : `Created ${formatDate(order.created_at)}`}
                  </span>
                  <span style={{ fontSize: '10px', color: textFaint, textTransform: 'capitalize' as const }}>
                    {order.processor === 'stripe' ? '💳 Card' : order.processor === 'paystack' ? '🏦 Paystack' : order.processor}
                  </span>
                  {order.region && (
                    <span style={{ fontSize: '10px', color: textFaint }}>{order.region}</span>
                  )}
                </div>
              </div>

              {/* Amount + status */}
              <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: '0 0 4px', fontFamily: "'Playfair Display', serif" }}>
                  {order.symbol}{order.amount.toLocaleString()}
                </p>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
