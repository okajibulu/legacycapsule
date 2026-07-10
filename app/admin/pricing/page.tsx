'use client'
/* =========================================================
   app/admin/pricing/page.tsx — Component Pricing Editor
   EUR + NGN editable. Audit logged. Reason required.
========================================================= */
import { useState, useEffect } from 'react'

const gold = '#E2C36B'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'
const cardBg = 'rgba(255,255,255,0.03)'
const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(226,195,107,0.2)', color: textPrimary, fontSize: '13px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const }

interface PricingRow { key: string; label: string; eur_price: number; ngn_price: number; safe_min_eur: number; safe_max_eur: number; is_published: boolean }

export default function PricingPage() {
  const [rows, setRows] = useState<PricingRow[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [eurVal, setEurVal] = useState('')
  const [ngnVal, setNgnVal] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')

  useEffect(() => { if (authed) fetch('/api/admin/pricing').then(r => r.json()).then(d => setRows(d.rows ?? [])) }, [authed])

  const save = async (row: PricingRow) => {
    if (!reason.trim()) { setMsg('Reason required'); return }
    const eur = parseFloat(eurVal); const ngn = parseFloat(ngnVal)
    if (isNaN(eur) || isNaN(ngn)) { setMsg('Invalid numbers'); return }
    if (eur < row.safe_min_eur || eur > row.safe_max_eur) {
      if (!confirm(`€${eur} is outside safe range €${row.safe_min_eur}–€${row.safe_max_eur}. Continue?`)) return
    }
    setSaving(true)
    await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: row.key, eur_price: eur, ngn_price: ngn, reason }) })
    const d = await fetch('/api/admin/pricing').then(r => r.json())
    setRows(d.rows ?? []); setSaving(false); setEditing(null)
    setMsg(`✓ ${row.label} updated`); setTimeout(() => setMsg(''), 3000)
  }

  if (!authed) return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '20px' }}>Pricing Configuration</h1>
      <div style={{ maxWidth: '320px', padding: '24px', borderRadius: '12px', background: cardBg, border: '1px solid rgba(226,195,107,0.12)' }}>
        <p style={{ fontSize: '13px', color: textFaint, marginBottom: '14px' }}>Enter admin password to edit prices</p>
        <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }).then(r => { if (r.ok) setAuthed(true) })} style={{ ...inp, marginBottom: '10px' }} />
        <button onClick={() => fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }).then(r => { if (r.ok) setAuthed(true) })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Unlock Pricing</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Pricing Configuration</h1>
        <p style={{ fontSize: '12px', color: textFaint }}>All changes are audit logged. Reason required.</p>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(226,195,107,0.07)', border: '1px solid rgba(226,195,107,0.2)', color: gold, fontSize: '12px', marginBottom: '14px' }}>{msg}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map(row => (
          <div key={row.key} style={{ padding: '12px 16px', borderRadius: '10px', background: cardBg, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{row.label}</p>
                <p style={{ fontSize: '10px', color: textFaint }}>Safe range: €{row.safe_min_eur}–€{row.safe_max_eur}</p>
              </div>
              {editing !== row.key && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: gold }}>€{row.eur_price}</p>
                    <p style={{ fontSize: '10px', color: textFaint }}>₦{row.ngn_price.toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', letterSpacing: '0.08em', background: row.is_published ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${row.is_published ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`, color: row.is_published ? 'rgba(134,239,172,0.8)' : textFaint }}>
                      {row.is_published ? 'Live' : 'Draft'}
                    </span>
                    <button onClick={() => { setEditing(row.key); setEurVal(String(row.eur_price)); setNgnVal(String(row.ngn_price)); setReason('') }} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(226,195,107,0.2)', background: 'transparent', color: 'rgba(226,195,107,0.7)', cursor: 'pointer' }}>Edit</button>
                    <button onClick={async () => { const r = prompt(row.is_published ? 'Reason for unpublishing?' : 'Reason for publishing?'); if (!r) return; await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: row.key, action: row.is_published ? 'unpublish' : 'publish', reason: r }) }); const d = await fetch('/api/admin/pricing').then(x => x.json()); setRows(d.rows ?? []); setMsg(`✓ ${row.label} ${row.is_published ? 'unpublished' : 'published'}`); setTimeout(() => setMsg(''), 3000) }} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${row.is_published ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.25)'}`, background: 'transparent', color: row.is_published ? 'rgba(248,113,113,0.6)' : 'rgba(134,239,172,0.7)', cursor: 'pointer' }}>
                      {row.is_published ? 'Unpublish' : 'Go Live'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {editing === row.key && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div><label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>EUR (€)</label><input type="number" value={eurVal} onChange={e => setEurVal(e.target.value)} style={inp} /></div>
                  <div><label style={{ fontSize: '10px', color: textFaint, display: 'block', marginBottom: '4px' }}>NGN (₦)</label><input type="number" value={ngnVal} onChange={e => setNgnVal(e.target.value)} style={inp} /></div>
                </div>
                <input placeholder="Reason for change (required)" value={reason} onChange={e => setReason(e.target.value)} style={{ ...inp, marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => save(row)} disabled={saving} style={{ padding: '8px 18px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setEditing(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
