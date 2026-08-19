'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/gift/GiftStandScanner.tsx
// PURPOSE:    Stand-facing gift collection scanner — complete collection flow
//             State machine: idle → verifying → verified → dispatching → complete
//             Three entry paths: QR scan | code+name | code+phone
//             Per-item ✓/✗ dispatch interface — Confirm Dispatch gated on all items marked
//             Unable to collect flow
// SPEC:       GCS-SPEC-001-AMD-001 Sections 2.5, 2.11 + AMD-002 Rules 41–42
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.22
// DATE:       19 August 2026
//
// IMPORT RULE (AMD-002 Phase 5 Step 21):
//   This component MUST be dynamically imported with ssr: false.
//   Never import directly in a server component.
//   Example: dynamic(() => import('@/components/gift/GiftStandScanner'), { ssr: false })
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react'


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface StandSession {
  id:               string
  capsule_id:       string
  stand_name:       string
  staff_name:       string
  status:           string
  dispatched_count: number
  failed_count:     number
}

interface EntitlementResult {
  id:                 string
  quantity_entitled:  number
  quantity_collected: number
  item: {
    id:                 string
    item_name:          string
    category:           string | null
    donor_name:         string | null
    donor_name_visible: boolean
  }
}

interface VerifiedCredential {
  id:                string
  guest_name:        string
  guest_category:    string | null
  numeric_code:      string
  collection_status: string
  is_group_code:     boolean
  group_size:        number
}

type ScannerState = 'idle' | 'verifying' | 'verified' | 'dispatching' | 'complete' | 'unable'
type EntryPath    = 'name' | 'phone'
type ItemOutcome  = 'dispatched' | 'unavailable' | null

interface GiftStandScannerProps {
  session:   StandSession
  eventName: string
}


// ═══ SECTION 2 — Session header bar ════════════════════════════════════════════

function SessionHeader({
  session,
  eventName,
  dispatchedCount,
}: {
  session:         StandSession
  eventName:       string
  dispatchedCount: number
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
      <div>
        <p className="text-white font-semibold text-sm">{session.stand_name}</p>
        <p className="text-white/40 text-xs">{eventName} · {session.staff_name}</p>
      </div>
      <div className="text-right">
        <p className="text-[#E2C36B] font-bold text-lg leading-none">{dispatchedCount}</p>
        <p className="text-white/30 text-xs">dispatched</p>
      </div>
    </div>
  )
}


// ═══ SECTION 3 — Idle entry form ═══════════════════════════════════════════════
//
// Three paths presented equally per AMD-001 Section 2.2.
// Tab switcher: Name | Phone. Code always required.

function IdleForm({
  onVerify,
  verifying,
}: {
  onVerify: (path: 'manual', code: string, name?: string, phone?: string) => void
  verifying: boolean
}) {
  const [code,  setCode]  = useState('')
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [path,  setPath]  = useState<EntryPath>('name')

  function handleSubmit() {
    if (!code.trim()) return
    onVerify('manual', code.trim(), path === 'name' ? name.trim() : undefined, path === 'phone' ? phone.trim() : undefined)
  }

  const canSubmit = code.trim() && (path === 'name' ? name.trim() : phone.trim())

  return (
    <div className="flex-1 flex flex-col p-5 space-y-5">

      {/* Guidance tip */}
      <div className="bg-white/5 rounded-xl px-4 py-3 text-white/40 text-xs leading-relaxed">
        Ask the guest for their <strong className="text-white/60">collection code</strong> and
        either their <strong className="text-white/60">name</strong> or{' '}
        <strong className="text-white/60">phone number</strong>. Enter both below to verify.
      </div>

      {/* Code field */}
      <div>
        <label className="block text-white/50 text-xs mb-1.5 tracking-wide uppercase">
          Collection Code
        </label>
        <input
          type="tel"
          inputMode="numeric"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="e.g. 214"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-white
                     text-3xl text-center font-bold tracking-widest placeholder-white/15
                     focus:outline-none focus:border-[#E2C36B]/50"
        />
      </div>

      {/* Second factor tab */}
      <div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-3">
          {(['name', 'phone'] as EntryPath[]).map(p => (
            <button
              key={p}
              onClick={() => setPath(p)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors font-medium ${
                path === p ? 'bg-[#E2C36B] text-[#0a061a]' : 'text-white/50'
              }`}
            >
              {p === 'name' ? 'Name' : 'Phone number'}
            </button>
          ))}
        </div>

        {path === 'name' ? (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Guest name as registered"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       text-lg placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50"
          />
        ) : (
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       text-lg placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50"
          />
        )}
      </div>

      {/* Verify button */}
      <button
        onClick={handleSubmit}
        disabled={verifying || !canSubmit}
        className="w-full py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg rounded-xl
                   hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        {verifying ? 'Checking…' : 'Verify Guest'}
      </button>

    </div>
  )
}


// ═══ SECTION 4 — Verification result + dispatch interface ══════════════════════
//
// AMD-001 Section 2.11: every item ✓ or ✗ before Confirm Dispatch activates.
// AMD-002 Rule 41: operator confirmation is primary — guest tap is optional.
// AMD-002 Rule 42: never block physical handover.

function DispatchInterface({
  credential,
  entitlements,
  onDispatch,
  onUnableToCollect,
  onReset,
  dispatching,
}: {
  credential:        VerifiedCredential
  entitlements:      EntitlementResult[]
  onDispatch:        (outcomes: { entitlement_id: string; outcome: 'dispatched' | 'unavailable' }[]) => void
  onUnableToCollect: () => void
  onReset:           () => void
  dispatching:       boolean
}) {
  const [outcomes, setOutcomes] = useState<Record<string, ItemOutcome>>({})

  function mark(entitlementId: string, outcome: ItemOutcome) {
    setOutcomes(prev => ({ ...prev, [entitlementId]: outcome }))
  }

  const allMarked  = entitlements.length > 0 && entitlements.every(e => outcomes[e.id] !== undefined && outcomes[e.id] !== null)
  const markedCount = Object.values(outcomes).filter(v => v !== null).length

  function handleConfirm() {
    const itemOutcomes = entitlements.map(e => ({
      entitlement_id: e.id,
      outcome:        (outcomes[e.id] ?? 'unavailable') as 'dispatched' | 'unavailable',
    }))
    onDispatch(itemOutcomes)
  }

  return (
    <div className="flex-1 flex flex-col">

      {/* Guest identity */}
      <div className="px-5 py-4 bg-white/5 border-b border-white/10">
        <p className="text-white font-bold text-2xl">{credential.guest_name}</p>
        {credential.guest_category && (
          <span className="inline-block mt-1 text-xs text-[#E2C36B]/70 bg-[#E2C36B]/10
                           border border-[#E2C36B]/20 rounded-full px-2.5 py-0.5">
            {credential.guest_category}
          </span>
        )}
        <p className="text-white/30 text-sm mt-1">Code {credential.numeric_code}</p>
        {credential.is_group_code && (
          <p className="text-amber-400/70 text-xs mt-1">
            Group code — {credential.group_size} recipients
          </p>
        )}
      </div>

      {/* Item list with ✓/✗ */}
      <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
        <p className="text-white/40 text-xs tracking-wider uppercase mb-1">
          Mark each item before confirming
        </p>

        {entitlements.map(ent => {
          const outcome = outcomes[ent.id]

          return (
            <div key={ent.id} className={`rounded-xl border p-3.5 transition-colors ${
              outcome === 'dispatched'  ? 'border-emerald-500/30 bg-emerald-500/5' :
              outcome === 'unavailable' ? 'border-red-500/20    bg-red-500/5' :
              'border-white/10 bg-white/5'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{ent.item.item_name}</p>
                  <p className="text-white/40 text-sm">×{ent.quantity_entitled}</p>
                </div>

                {/* ✓ / ✗ buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => mark(ent.id, outcome === 'dispatched' ? null : 'dispatched')}
                    className={`w-11 h-11 rounded-xl border-2 font-bold text-lg transition-colors ${
                      outcome === 'dispatched'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-emerald-500/30 text-emerald-500/50 hover:border-emerald-500/60'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => mark(ent.id, outcome === 'unavailable' ? null : 'unavailable')}
                    className={`w-11 h-11 rounded-xl border-2 font-bold text-lg transition-colors ${
                      outcome === 'unavailable'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-red-500/30 text-red-500/50 hover:border-red-500/60'
                    }`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirm dispatch + unable */}
      <div className="px-5 py-4 border-t border-white/10 space-y-2">
        <p className="text-white/30 text-xs text-center">
          {markedCount} of {entitlements.length} items marked
        </p>

        <button
          onClick={handleConfirm}
          disabled={dispatching || !allMarked}
          className="w-full py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg rounded-xl
                     hover:bg-[#E2C36B]/90 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          {dispatching ? 'Confirming…' : 'Confirm Dispatch'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={onUnableToCollect}
            disabled={dispatching}
            className="flex-1 py-2.5 border border-amber-500/20 text-amber-500/70 text-sm
                       rounded-xl hover:border-amber-500/40 transition-colors"
          >
            Unable to collect
          </button>
          <button
            onClick={onReset}
            disabled={dispatching}
            className="flex-1 py-2.5 border border-white/10 text-white/40 text-sm
                       rounded-xl hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}


// ═══ SECTION 5 — Unable to collect form ════════════════════════════════════════

const UNABLE_REASONS = [
  { key: 'not_attending',  label: 'I am not attending the event' },
  { key: 'already_left',  label: 'I have already left the venue' },
  { key: 'on_behalf',     label: 'Someone is collecting on my behalf' },
  { key: 'health',        label: 'Health / mobility reason' },
  { key: 'later',         label: 'I will collect at a later time' },
  { key: 'other',         label: 'Other reason' },
]

function UnableForm({
  credential,
  onSubmit,
  onCancel,
  submitting,
}: {
  credential:  VerifiedCredential
  onSubmit:    (reason: string, reasonText: string | null) => void
  onCancel:    () => void
  submitting:  boolean
}) {
  const [reason,     setReason]     = useState('')
  const [reasonText, setReasonText] = useState('')

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4">
      <div>
        <p className="text-white font-semibold">{credential.guest_name}</p>
        <p className="text-white/40 text-sm mt-0.5">Mark as unable to collect</p>
      </div>

      <div className="space-y-2">
        {UNABLE_REASONS.map(r => (
          <button
            key={r.key}
            onClick={() => setReason(r.key)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
              reason === r.key
                ? 'border-[#E2C36B]/50 bg-[#E2C36B]/10 text-white'
                : 'border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {reason === 'other' && (
        <textarea
          value={reasonText}
          onChange={e => setReasonText(e.target.value.slice(0, 200))}
          placeholder="Please describe the reason (max 200 characters)…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50 resize-none"
        />
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSubmit(reason, reason === 'other' ? reasonText : null)}
          disabled={submitting || !reason || (reason === 'other' && !reasonText.trim())}
          className="flex-1 py-3 bg-amber-500/80 text-white font-semibold rounded-xl
                     hover:bg-amber-500 disabled:opacity-40 transition-colors"
        >
          {submitting ? 'Recording…' : 'Confirm Unable to Collect'}
        </button>
        <button onClick={onCancel} className="px-4 border border-white/10 text-white/40 rounded-xl hover:text-white/60">
          Back
        </button>
      </div>
    </div>
  )
}


// ═══ SECTION 6 — Complete state ═════════════════════════════════════════════════

function CompleteScreen({
  message,
  onNext,
}: {
  message: string
  onNext:  () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20
                      flex items-center justify-center">
        <span className="text-4xl text-emerald-400">✓</span>
      </div>
      <p className="text-white font-semibold text-xl">{message}</p>
      <button
        onClick={onNext}
        className="w-full max-w-xs py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg
                   rounded-xl hover:bg-[#E2C36B]/90 transition-colors"
      >
        Next Guest
      </button>
    </div>
  )
}


// ═══ SECTION 7 — Main scanner component ════════════════════════════════════════

export default function GiftStandScanner({ session, eventName }: GiftStandScannerProps) {
  const [state,            setState]            = useState<ScannerState>('idle')
  const [verifying,        setVerifying]        = useState(false)
  const [dispatching,      setDispatching]      = useState(false)
  const [credential,       setCredential]       = useState<VerifiedCredential | null>(null)
  const [entitlements,     setEntitlements]     = useState<EntitlementResult[]>([])
  const [completeMessage,  setCompleteMessage]  = useState('')
  const [errorMessage,     setErrorMessage]     = useState<string | null>(null)
  const [localDispatch,    setLocalDispatch]    = useState(session.dispatched_count)


  // ── Reset to idle ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState('idle')
    setCredential(null)
    setEntitlements([])
    setErrorMessage(null)
    setCompleteMessage('')
  }, [])


  // ── Verify guest ────────────────────────────────────────────────────────────
  async function handleVerify(path: 'manual', code: string, name?: string, phone?: string) {
    try {
      setVerifying(true)
      setErrorMessage(null)

      const res  = await fetch('/api/gift/stand/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:  session.capsule_id,
          session_id:  session.id,
          path:        'manual',
          code,
          name:        name ?? undefined,
          phone:       phone ?? undefined,
        }),
      })
      const data = await res.json()

      if (!data.verified) {
        setErrorMessage(data.message ?? 'Details not recognised — please check and try again.')
        return
      }

      setCredential(data.credential)
      setEntitlements(data.entitlements ?? [])
      setState('verified')
    } catch {
      setErrorMessage('Connection error — please try again.')
    } finally {
      setVerifying(false)
    }
  }


  // ── Confirm dispatch ────────────────────────────────────────────────────────
  async function handleDispatch(outcomes: { entitlement_id: string; outcome: 'dispatched' | 'unavailable' }[]) {
    if (!credential) return
    try {
      setDispatching(true)

      const res  = await fetch('/api/gift/stand/dispatch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    session.capsule_id,
          credential_id: credential.id,
          session_id:    session.id,
          actor_type:    'staff',
          actor_name:    session.staff_name,
          items:         outcomes,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setErrorMessage(data.error ?? 'Failed to confirm dispatch.')
        return
      }

      setCompleteMessage(data.message)
      setLocalDispatch(prev => prev + 1)
      setState('complete')
    } catch {
      setErrorMessage('Connection error — please try again.')
    } finally {
      setDispatching(false)
    }
  }


  // ── Unable to collect ───────────────────────────────────────────────────────
  async function handleUnableSubmit(reason: string, reasonText: string | null) {
    if (!credential) return
    try {
      setDispatching(true)

      const res = await fetch('/api/gift/stand/dispatch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:        session.capsule_id,
          credential_id:     credential.id,
          session_id:        session.id,
          actor_type:        'staff',
          actor_name:        session.staff_name,
          unable_to_collect: true,
          unable_reason:     reason,
          unable_reason_text: reasonText,
          items:             [],
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setErrorMessage(data.error ?? 'Failed to record.')
        return
      }

      setCompleteMessage('Unable to collect recorded.')
      setState('complete')
    } catch {
      setErrorMessage('Connection error — please try again.')
    } finally {
      setDispatching(false)
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a061a] flex flex-col max-w-md mx-auto">

      <SessionHeader
        session={session}
        eventName={eventName}
        dispatchedCount={localDispatch}
      />

      {/* Error banner */}
      {errorMessage && state === 'idle' && (
        <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl
                        px-4 py-3 text-red-300 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {state === 'idle' && (
        <IdleForm onVerify={handleVerify} verifying={verifying} />
      )}

      {state === 'verified' && credential && (
        <DispatchInterface
          credential={credential}
          entitlements={entitlements}
          onDispatch={handleDispatch}
          onUnableToCollect={() => setState('unable')}
          onReset={reset}
          dispatching={dispatching}
        />
      )}

      {state === 'unable' && credential && (
        <UnableForm
          credential={credential}
          onSubmit={handleUnableSubmit}
          onCancel={() => setState('verified')}
          submitting={dispatching}
        />
      )}

      {state === 'complete' && (
        <CompleteScreen message={completeMessage} onNext={reset} />
      )}

    </div>
  )
}
