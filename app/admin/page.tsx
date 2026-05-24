'use client'

/* =========================================================
   app/admin/page.tsx — LCAdmin Login
========================================================= */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.12)'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!password.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0618 0%, #14083a 50%, #0a0618 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '340px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${goldFaint}`,
        borderRadius: '20px', padding: '36px 28px',
        textAlign: 'center',
      }}>
        <div style={{ height: '1px', marginBottom: '28px', background: `linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)` }} />

        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.14em', color: gold }}>LC</span>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)' }}>ADMIN</span>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', letterSpacing: '0.08em' }}>LegacyCapsule Administration</p>
        </div>

        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          autoFocus
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid rgba(226,195,107,0.2)`,
            color: 'rgba(255,255,255,0.92)', fontSize: '14px',
            outline: 'none', fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box' as const, textAlign: 'center' as const,
            marginBottom: '12px',
          }}
        />

        {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '10px' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={!password.trim() || loading}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            background: !password.trim() || loading ? 'rgba(226,195,107,0.1)' : `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
            color: !password.trim() || loading ? 'rgba(226,195,107,0.35)' : '#1a0845',
            fontSize: '14px', fontWeight: 700, border: 'none',
            cursor: !password.trim() || loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em', transition: 'all 0.2s',
          }}
        >{loading ? 'Verifying…' : 'Enter'}</button>

        <div style={{ height: '1px', margin: '24px 0', background: `linear-gradient(to right, transparent, ${goldFaint}, transparent)` }} />
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          VALNEX, UNIPESSOAL LDA · RevoWorldTech
        </p>
      </div>
    </div>
  )
}
