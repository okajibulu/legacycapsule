'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!password.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0010]">
      <div className="w-full max-w-sm space-y-5 p-8 rounded-2xl border border-yellow-400/20 bg-white/5 backdrop-blur-sm">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-yellow-400/50 tracking-widest uppercase">
            RevoWorldTech
          </p>
          <h1 className="text-xl font-bold text-yellow-100 tracking-widest uppercase">
            LCAdmin
          </h1>
          <p className="text-xs text-white/30">LegacyCapsule Administration Console</p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-yellow-400/30
              text-white placeholder:text-white/25 text-sm
              focus:outline-none focus:border-yellow-300
              focus:shadow-[0_0_12px_rgba(212,174,42,0.3)]
              transition-all duration-200"
          />

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-lg
              bg-gradient-to-b from-yellow-400 to-yellow-500
              text-purple-950 font-bold text-sm
              hover:from-yellow-300 hover:to-yellow-400
              disabled:opacity-60
              transition-all duration-150"
          >
            {loading ? 'Verifying…' : 'Enter Console'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-[9px] text-white/15 text-center tracking-widest uppercase">
          VALNEX, UNIPESSOAL LDA · NIPC 519 379 276
        </p>
      </div>
    </main>
  )
}