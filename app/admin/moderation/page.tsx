'use client'
/* =========================================================
   app/admin/moderation/page.tsx — Platform Moderation Queue
   Client component for inline approve/remove actions
========================================================= */
'use client'
import { useState, useEffect } from 'react'

const gold = '#E2C36B'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'
const cardBg = 'rgba(255,255,255,0.03)'

interface Contribution {
  id: string; capsule_id: string; contributor_name: string
  city: string; country: string; tribute_text: string
  email: string | null; status: string; created_at: string
  thumbnail_url: string | null
}

export default function ModerationPage() {
  const [items, setItems] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/moderation')
    const data = await res.json()
    setItems(data.items ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    await fetch('/api/admin/moderation/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const remove = async (id: string) => {
    await fetch('/api/admin/moderation/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, reason: 'Admin removal' }) })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Moderation</h1>
          <p style={{ fontSize: '12px', color: textFaint }}>{items.length} pending platform-wide</p>
        </div>
        <button onClick={load} style={{ fontSize: '12px', color: gold, background: 'none', border: 'none', cursor: 'pointer' }}>Refresh</button>
      </div>

      {loading ? (
        <p style={{ color: textFaint, fontSize: '13px', textAlign: 'center', padding: '48px' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', borderRadius: '12px', background: cardBg, border: '1px solid rgba(74,222,128,0.15)' }}>
          <p style={{ fontSize: '24px', marginBottom: '12px' }}>✦</p>
          <p style={{ fontSize: '14px', color: 'rgba(74,222,128,0.8)', fontWeight: 600 }}>Queue is clear</p>
          <p style={{ fontSize: '12px', color: textFaint, marginTop: '4px' }}>No pending tributes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(item => (
            <div key={item.id} style={{ padding: '14px 16px', borderRadius: '12px', background: cardBg, border: '1px solid rgba(226,195,107,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: gold }}>{item.contributor_name}</span>
                <span style={{ fontSize: '10px', color: textFaint }}>{[item.city, item.country].filter(Boolean).join(' · ')}</span>
                <span style={{ fontSize: '10px', color: textFaint, marginLeft: 'auto', whiteSpace: 'nowrap' as const }}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
              <p style={{ fontSize: '13px', color: textPrimary, lineHeight: 1.7, marginBottom: '12px', fontStyle: 'italic' }}>"{item.tribute_text}"</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => approve(item.id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: 'rgba(134,239,172,0.9)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
                <button onClick={() => remove(item.id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: 'rgba(248,113,113,0.8)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
