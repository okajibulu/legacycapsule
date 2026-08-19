'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/gift/GiftStandScanner.tsx
// PURPOSE:    Stand-facing gift collection scanner — complete collection flow
//             AMENDMENTS (Founder Amendment 19 August 2026):
//               1. actor_type REMOVED from dispatch request body — server-derived
//               2. actor_name REMOVED from dispatch request body — server-derived
//               3. Partial re-entry state added: scanner handles is_partial_re_entry
//               4. is_complete flag on entitlements: already-collected shown read-only
//               5. Actual quantity field per dispatched item (Correction B)
// SPEC:       GCS-SPEC-001-AMD-001 + AMD-002 + Founder Amendment 19 August 2026
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.24
// DATE:       19 August 2026
//
// IMPORT RULE: Must be dynamically imported with ssr: false
//   Use: import('@/components/gift/GiftStandScannerWrapper') — not this file directly.
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
  id:                   string
  quantity_entitled:    number
  quantity_collected:   number
  quantity_outstanding: number
  is_complete:          boolean    // Amendment: true = already collected, show read-only
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

// Amendment: outcome now includes actual_quantity for dispatched items
interface ItemOutcomeState {
  outcome:         'dispatched' | 'unavailable' | null
  actual_quantity: number   // actual units handed over — defaults to quantity_outstanding
}

interface GiftStandScannerProps {
  session:   StandSession
  eventName: string
}


// ═══ SECTION 2 — Session header bar ════════════════════════════════════════════

function SessionHeader({ session, eventName, dispatchedCount }: {
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

function IdleForm({ onVerify, verifying }: {
  onVerify:  (path: 'manual', code: string, name?: string, phone?: string) => void
  verifying: boolean
}) {
  const [code,  setCode]  = useState('')
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [path,  setPath]  = useState<EntryPath>('name')

  const canSubmit = code.trim() && (path === 'name' ? name.trim() : phone.trim())

  return (
    <div className="flex-1 flex flex-col p-5 space-y-5">
      <div className="bg-white/5 rounded-xl px-4 py-3 text-white/40 text-xs leading-relaxed">
        Ask the guest for their <strong className="text-white/60">collection code</strong> and
        either their <strong className="text-white/60">name</strong> or{' '}
        <strong className="text-white/60">phone number</strong>.
      </div>

      <div>
        <label className="block text-white/50 text-xs mb-1.5 tracking-wide uppercase">Collection Code</label>
        <input
          type="tel" inputMode="numeric"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="e.g. 214"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-white
                     text-3xl text-center font-bold tracking-widest placeholder-white/15
                     focus:outline-none focus:border-[#E2C36B]/50"
        />
      </div>

      <div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-3">
          {(['name', 'phone'] as EntryPath[]).map(p => (
            <button key={p} onClick={() => setPath(p)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors font-medium ${
                path === p ? 'bg-[#E2C36B] text-[#0a061a]' : 'text-white/50'
              }`}>
              {p === 'name' ? 'Name' : 'Phone number'}
            </button>
          ))}
        </div>
        {path === 'name' ? (
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Guest name as registered"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       text-lg placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50" />
        ) : (
          <input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white
                       text-lg placeholder-white/15 focus:outline-none focus:border-[#E2C36B]/50" />
        )}
      </div>

      <button onClick={() => onVerify('manual', code.trim(), path === 'name' ? name.trim() : undefined, path === 'phone' ? phone.trim() : undefined)}
        disabled={verifying || !canSubmit}
        className="w-full py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg rounded-xl
                   hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        {verifying ? 'Checking…' : 'Verify Guest'}
      </button>
    </div>
  )
}


// ═══ SECTION 4 — Dispatch interface ════════════════════════════════════════════
//
// Amendment: is_complete entitlements shown read-only.
// Amendment: actual_quantity field per dispatched item.
// Amendment: actor_type/actor_name removed — server-derived.

function DispatchInterface({ credential, entitlements, isPartialReEntry, onDispatch, onUnableToCollect, onReset, dispatching }: {
  credential:         VerifiedCredential
  entitlements:       EntitlementResult[]
  isPartialReEntry:   boolean
  onDispatch:         (outcomes: { entitlement_id: string; outcome: 'dispatched' | 'unavailable'; quantity: number }[]) => void
  onUnableToCollect:  () => void
  onReset:            () => void
  dispatching:        boolean
}) {
  // Only outstanding items need marking — complete items are read-only
  const outstanding = entitlements.filter(e => !e.is_complete)
  const completed   = entitlements.filter(e => e.is_complete)

  const [outcomes, setOutcomes] = useState<Record<string, ItemOutcomeState>>(() =>
    Object.fromEntries(outstanding.map(e => [e.id, {
      outcome:         null,
      actual_quantity: e.quantity_outstanding,
    }]))
  )

  function mark(entitlementId: string, outcome: 'dispatched' | 'unavailable' | null) {
    setOutcomes(prev => ({
      ...prev,
      [entitlementId]: { ...prev[entitlementId], outcome },
    }))
  }

  function setQty(entitlementId: string, qty: number) {
    setOutcomes(prev => ({
      ...prev,
      [entitlementId]: { ...prev[entitlementId], actual_quantity: qty },
    }))
  }

  const allMarked  = outstanding.length > 0 && outstanding.every(e => outcomes[e.id]?.outcome !== null)
  const markedCount = Object.values(outcomes).filter(v => v.outcome !== null).length

  function handleConfirm() {
    const itemOutcomes = outstanding.map(e => ({
      entitlement_id: e.id,
      outcome:        outcomes[e.id]?.outcome ?? 'unavailable',
      // Correction B: actual quantity handed over
      quantity:       outcomes[e.id]?.outcome === 'dispatched'
                        ? Math.max(1, outcomes[e.id]?.actual_quantity ?? e.quantity_outstanding)
                        : 0,
    }))
    onDispatch(itemOutcomes)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-5 py-4 bg-white/5 border-b border-white/10">
        <p className="text-white font-bold text-2xl">{credential.guest_name}</p>
        {credential.guest_category && (
          <span className="inline-block mt-1 text-xs text-[#E2C36B]/70 bg-[#E2C36B]/10
                           border border-[#E2C36B]/20 rounded-full px-2.5 py-0.5">
            {credential.guest_category}
          </span>
        )}
        <p className="text-white/30 text-sm mt-1">Code {credential.numeric_code}</p>
        {isPartialReEntry && (
          <p className="text-amber-400/80 text-xs mt-1 bg-amber-400/10 rounded px-2 py-0.5 inline-block">
            Partial re-collection — outstanding items only
          </p>
        )}
      </div>

      <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
        {/* Already collected — read-only */}
        {completed.map(ent => (
          <div key={ent.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 font-medium text-sm">{(ent.item as { item_name: string }).item_name}</p>
                <p className="text-emerald-400 text-xs mt-0.5">Already collected ✓</p>
              </div>
              <p className="text-white/40 text-sm">×{ent.quantity_collected}</p>
            </div>
          </div>
        ))}

        {/* Outstanding — need marking */}
        {outstanding.length === 0 && (
          <p className="text-center text-white/30 text-sm py-4">All items have already been collected.</p>
        )}

        {outstanding.map(ent => {
          const state   = outcomes[ent.id]
          const outcome = state?.outcome

          return (
            <div key={ent.id} className={`rounded-xl border p-3.5 transition-colors ${
              outcome === 'dispatched'  ? 'border-emerald-500/30 bg-emerald-500/5' :
              outcome === 'unavailable' ? 'border-red-500/20    bg-red-500/5' :
              'border-white/10 bg-white/5'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{(ent.item as { item_name: string }).item_name}</p>
                  <p className="text-white/40 text-sm">{ent.quantity_outstanding} outstanding</p>

                  {/* Correction B: actual quantity input when dispatched */}
                  {outcome === 'dispatched' && ent.quantity_outstanding > 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-white/40 text-xs">Qty handed over:</label>
                      <input
                        type="number"
                        min={1}
                        max={ent.quantity_outstanding}
                        value={state?.actual_quantity ?? ent.quantity_outstanding}
                        onChange={e => setQty(ent.id, Math.min(ent.quantity_outstanding, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1
                                   text-white text-sm text-center focus:outline-none focus:border-[#E2C36B]/50"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => mark(ent.id, outcome === 'dispatched' ? null : 'dispatched')}
                    className={`w-11 h-11 rounded-xl border-2 font-bold text-lg transition-colors ${
                      outcome === 'dispatched'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-emerald-500/30 text-emerald-500/50 hover:border-emerald-500/60'
                    }`}
                  >✓</button>
                  <button
                    onClick={() => mark(ent.id, outcome === 'unavailable' ? null : 'unavailable')}
                    className={`w-11 h-11 rounded-xl border-2 font-bold text-lg transition-colors ${
                      outcome === 'unavailable'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-red-500/30 text-red-500/50 hover:border-red-500/60'
                    }`}
                  >✗</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-4 border-t border-white/10 space-y-2">
        {outstanding.length > 0 && (
          <p className="text-white/30 text-xs text-center">{markedCount} of {outstanding.length} items marked</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={dispatching || (outstanding.length > 0 && !allMarked)}
          className="w-full py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg rounded-xl
                     hover:bg-[#E2C36B]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {dispatching ? 'Confirming…' : 'Confirm Dispatch'}
        </button>

        <div className="flex gap-2">
          <button onClick={onUnableToCollect} disabled={dispatching}
            className="flex-1 py-2.5 border border-amber-500/20 text-amber-500/70 text-sm
                       rounded-xl hover:border-amber-500/40 transition-colors">
            Unable to collect
          </button>
          <button onClick={onReset} disabled={dispatching}
            className="flex-1 py-2.5 border border-white/10 text-white/40 text-sm
                       rounded-xl hover:text-white/60 transition-colors">
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

function UnableForm({ credential, onSubmit, onCancel, submitting }: {
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
          <button key={r.key} onClick={() => setReason(r.key)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
              reason === r.key
                ? 'border-[#E2C36B]/50 bg-[#E2C36B]/10 text-white'
                : 'border-white/10 text-white/60 hover:border-white/20'
            }`}>
            {r.label}
          </button>
        ))}
      </div>
      {reason === 'other' && (
        <textarea value={reasonText} onChange={e => setReasonText(e.target.value.slice(0, 200))}
          placeholder="Please describe (max 200 characters)…" rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50 resize-none" />
      )}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSubmit(reason, reason === 'other' ? reasonText : null)}
          disabled={submitting || !reason || (reason === 'other' && !reasonText.trim())}
          className="flex-1 py-3 bg-amber-500/80 text-white font-semibold rounded-xl
                     hover:bg-amber-500 disabled:opacity-40 transition-colors">
          {submitting ? 'Recording…' : 'Confirm Unable to Collect'}
        </button>
        <button onClick={onCancel} className="px-4 border border-white/10 text-white/40 rounded-xl">Back</button>
      </div>
    </div>
  )
}


// ═══ SECTION 6 — Complete state ═════════════════════════════════════════════════

function CompleteScreen({ message, onNext }: { message: string; onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20
                      flex items-center justify-center">
        <span className="text-4xl text-emerald-400">✓</span>
      </div>
      <p className="text-white font-semibold text-xl">{message}</p>
      <button onClick={onNext}
        className="w-full max-w-xs py-4 bg-[#E2C36B] text-[#0a061a] font-bold text-lg
                   rounded-xl hover:bg-[#E2C36B]/90 transition-colors">
        Next Guest
      </button>
    </div>
  )
}


// ═══ SECTION 7 — Main scanner component ════════════════════════════════════════

export default function GiftStandScanner({ session, eventName }: GiftStandScannerProps) {
  const [state,           setState]           = useState<ScannerState>('idle')
  const [verifying,       setVerifying]       = useState(false)
  const [dispatching,     setDispatching]     = useState(false)
  const [credential,      setCredential]      = useState<VerifiedCredential | null>(null)
  const [entitlements,    setEntitlements]    = useState<EntitlementResult[]>([])
  const [isPartialReEntry, setIsPartialReEntry] = useState(false)
  const [completeMessage, setCompleteMessage] = useState('')
  const [errorMessage,    setErrorMessage]    = useState<string | null>(null)
  const [localDispatch,   setLocalDispatch]   = useState(session.dispatched_count)

  const reset = useCallback(() => {
    setState('idle')
    setCredential(null)
    setEntitlements([])
    setIsPartialReEntry(false)
    setErrorMessage(null)
    setCompleteMessage('')
  }, [])

  async function handleVerify(path: 'manual', code: string, name?: string, phone?: string) {
    try {
      setVerifying(true)
      setErrorMessage(null)

      const res  = await fetch('/api/gift/stand/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: session.capsule_id,
          session_id: session.id,
          path:       'manual',
          code,
          name:       name ?? undefined,
          phone:      phone ?? undefined,
        }),
      })
      const data = await res.json()

      if (!data.verified) {
        setErrorMessage(data.message ?? 'Details not recognised — please check and try again.')
        return
      }

      setCredential(data.credential)
      setEntitlements(data.entitlements ?? [])
      setIsPartialReEntry(Boolean(data.is_partial_re_entry))
      setState('verified')
    } catch {
      setErrorMessage('Connection error — please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDispatch(outcomes: { entitlement_id: string; outcome: 'dispatched' | 'unavailable'; quantity: number }[]) {
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
          // Amendment: actor_type and actor_name REMOVED — always server-derived
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

  return (
    <div className="min-h-screen bg-[#0a061a] flex flex-col max-w-md mx-auto">
      <SessionHeader session={session} eventName={eventName} dispatchedCount={localDispatch} />

      {errorMessage && state === 'idle' && (
        <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl
                        px-4 py-3 text-red-300 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {state === 'idle' && <IdleForm onVerify={handleVerify} verifying={verifying} />}

      {state === 'verified' && credential && (
        <DispatchInterface
          credential={credential}
          entitlements={entitlements}
          isPartialReEntry={isPartialReEntry}
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

      {state === 'complete' && <CompleteScreen message={completeMessage} onNext={reset} />}
    </div>
  )
}
