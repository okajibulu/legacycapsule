'use client'
/* =========================================================
   app/admin/flags/page.tsx — Feature Flag Toggles
========================================================= */
import { useState, useEffect } from 'react'

const gold = '#E2C36B'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'
const cardBg = 'rgba(255,255,255,0.03)'

interface Flag { key: string; label: string; enabled: boolean; emergency: boolean; updated_at: string }

export default function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/flags')
    const data = await res.json()
    setFlags(data.flags ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggle = async (flag: Flag) => {
    if (flag.emergency && !confirm(`"${flag.label}" is an emergency flag. Are you sure?`)) return
    const reason = prompt(`Reason for ${flag.enabled ? 'disabling' : 'enabling'} "${flag.label}"?`)
    if (!reason?.trim()) return
    setToggling(flag.key)
    await fetch('/api/admin/flags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: flag.key, enabled: !flag.enabled, reason }) })
    await load()
    setToggling(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Feature Flags</h1>
        <p style={{ fontSize: '12px', color: textFaint }}>Toggle platform features without code deployment</p>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', lineHeight: 1.65 }}>🔴 Emergency flags (Stripe, Paystack, Registration) disable core platform functions. L1 confirmation required. All changes are audit logged.</p>
      </div>

      {loading ? <p style={{ color: textFaint, textAlign: 'center', padding: '40px' }}>Loading…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {flags.map(flag => (
            <div key={flag.key} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '10px', background: cardBg, border: `1px solid ${flag.emergency ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{flag.label}</p>
                  {flag.emergency && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '6px', background: 'rgba(248,113,113,0.1)', color: 'rgba(248,113,113,0.8)', border: '1px solid rgba(248,113,113,0.2)', fontWeight: 700 }}>EMERGENCY</span>}
                </div>
                <p style={{ fontSize: '10px', color: textFaint }}>{flag.key} · Updated {new Date(flag.updated_at).toLocaleDateString('en-GB')}</p>
              </div>
              <button
                onClick={() => toggle(flag)}
                disabled={toggling === flag.key}
                style={{
                  width: '48px', height: '26px', borderRadius: '13px',
                  background: flag.enabled ? (flag.emergency ? 'rgba(248,113,113,0.7)' : 'rgba(74,222,128,0.7)') : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: flag.enabled ? '25px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
