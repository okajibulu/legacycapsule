'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/gift/StandSessionClaim.tsx
// PURPOSE:    Staff stand session claim form
//             Staff enters stand name, their name, and sets a session PIN.
//             On success, redirects to /gift/stand/[sessionId].
//             Rendered at /gift/stand (the stand entry page — separate from scanner).
// SPEC:       GCS-SPEC-001-AMD-001 Section 2.9
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.22
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'


// ═══ SECTION 1 — Props ═════════════════════════════════════════════════════════

interface StandSessionClaimProps {
  capsuleId:  string
  eventName:  string
  capsuleSlug: string
}


// ═══ SECTION 2 — Main component ════════════════════════════════════════════════

export default function StandSessionClaim({
  capsuleId,
  eventName,
  capsuleSlug,
}: StandSessionClaimProps) {
  const router = useRouter()

  const [standName,    setStandName]    = useState('')
  const [staffName,    setStaffName]    = useState('')
  const [pin,          setPin]          = useState('')
  const [pinConfirm,   setPinConfirm]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const pinMismatch = pin && pinConfirm && pin !== pinConfirm
  const canSubmit   = standName.trim() && staffName.trim() && pin.length >= 4 && pin === pinConfirm

  async function handleClaim() {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      setError(null)

      const res  = await fetch('/api/gift/stand/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:  capsuleId,
          stand_name:  standName.trim(),
          staff_name:  staffName.trim(),
          session_pin: pin,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to start session')
        return
      }

      // Redirect to scanner with session ID
      router.push(`/gift/stand/${data.session.id}`)
    } catch {
      setError('Connection error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a061a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-[#E2C36B] text-xs tracking-widest uppercase mb-2">Gift Collection</p>
          <h1 className="text-white font-bold text-xl">{eventName}</h1>
          <p className="text-white/40 text-sm mt-1">Open a collection stand session</p>
        </div>

        {/* Guidance */}
        <div className="bg-white/5 rounded-xl px-4 py-3 text-white/40 text-xs leading-relaxed">
          Enter the name of your stand (e.g. "Main Exit") and your name, then set a PIN for this
          session. You will need the PIN if the scanner is handed to another staff member.
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3
                          text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Stand name */}
        <div>
          <label className="block text-white/50 text-xs mb-1.5 tracking-wide uppercase">Stand Name</label>
          <input
            type="text"
            value={standName}
            onChange={e => setStandName(e.target.value)}
            placeholder="e.g. Main Exit, VIP Stand, Gate B"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50"
          />
        </div>

        {/* Staff name */}
        <div>
          <label className="block text-white/50 text-xs mb-1.5 tracking-wide uppercase">Your Name</label>
          <input
            type="text"
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
            placeholder="e.g. Segun"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50"
          />
        </div>

        {/* Session PIN */}
        <div>
          <label className="block text-white/50 text-xs mb-1.5 tracking-wide uppercase">
            Session PIN (4+ digits)
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Choose a PIN"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50
                       text-center text-2xl tracking-widest"
          />
        </div>

        <div>
          <label className="block text-white/50 text-xs mb-1.5 tracking-wide uppercase">
            Confirm PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pinConfirm}
            onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Repeat PIN"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white
                        placeholder-white/15 focus:outline-none text-center text-2xl tracking-widest
                        ${pinMismatch ? 'border-red-500/50' : 'border-white/15 focus:border-[#E2C36B]/50'}`}
          />
          {pinMismatch && (
            <p className="text-red-400 text-xs mt-1.5 text-center">PINs do not match</p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleClaim}
          disabled={submitting || !canSubmit}
          className="w-full py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg rounded-xl
                     hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {submitting ? 'Opening stand…' : 'Open Collection Stand'}
        </button>

        <p className="text-white/20 text-xs text-center">
          Only open a session when you are ready to begin accepting guests.
        </p>

      </div>
    </div>
  )
}
