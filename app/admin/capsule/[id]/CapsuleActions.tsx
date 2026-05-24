'use client'
/* app/admin/capsules/[id]/CapsuleActions.tsx */
import { useState } from 'react'

const gold = '#E2C36B'
const cardBg = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(226,195,107,0.1)'
const textFaint = 'rgba(255,255,255,0.30)'

export default function CapsuleActions({ capsuleId, currentState }: { capsuleId: string; currentState: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [reason, setReason] = useState('')
  const [days, setDays] = useState('30')

  const act = async (action: string, body: object) => {
    setLoading(true); setMsg('')
    const res = await fetch(`/api/admin/capsules/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capsuleId, ...body }) })
    setMsg(res.ok ? '✓ Done' : '✗ Failed')
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '13px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const, marginBottom: '8px' }
  const btn = (col: string): React.CSSProperties => ({ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${col}33`, background: `${col}10`, color: col, fontSize: '12px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 })

  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}` }}>
      <p style={{ fontSize: '11px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Admin Actions</p>
      <input placeholder="Reason (required for all actions)" value={reason} onChange={e => setReason(e.target.value)} style={inp} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {currentState !== 'active' && <button style={btn('rgba(74,222,128,0.9)')} onClick={() => act('activate', { reason })}>Activate</button>}
        {currentState !== 'suspended' && <button style={btn('rgba(248,113,113,0.9)')} onClick={() => act('suspend', { reason })}>Suspend</button>}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="number" placeholder="Days" value={days} onChange={e => setDays(e.target.value)} style={{ ...inp, width: '80px', marginBottom: 0 }} />
        <button style={btn(gold)} onClick={() => act('extend', { days: Number(days), reason })}>Extend {days}d</button>
      </div>
      {msg && <p style={{ fontSize: '12px', color: msg.startsWith('✓') ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)', marginTop: '10px' }}>{msg}</p>}
    </div>
  )
}
