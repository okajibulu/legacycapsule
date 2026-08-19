'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/gift/GiftCredentialDisplay.tsx
// PURPOSE:    Client-side credential page renderer
//             — Dynamic time-windowed QR (auto-refreshes every 5 minutes)
//             — Numeric code display
//             — Live gift list with donor attribution
//             — Collection status banner
// SPEC:       GCS-SPEC-001-AMD-001 Rules 26, 27, 32
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
//
// QR refresh: interval fires at windowMinutes * 60 * 1000ms.
//             Client calls /api/gift/credential/qr?credential_id= to get fresh payload.
//             QRCode rendered via qrcode.react — dynamically imported ssr:false.
//             Poor signal fallback: numeric code always visible — QR is supplementary.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import dynamic                               from 'next/dynamic'

// Dynamic import — QR camera / canvas requires browser environment
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(m => m.QRCodeSVG),
  { ssr: false, loading: () => <QrPlaceholder /> }
)


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface Entitlement {
  id:                 string
  quantity_entitled:  number
  quantity_collected: number
  item_name:          string
  donor_name:         string | null
  donor_name_visible: boolean
}

interface GiftCredentialDisplayProps {
  credential: {
    id:               string
    guest_name:       string
    guest_category:   string | null
    numeric_code:     string
    collection_status: string
    collected_at:     string | null
    unable_to_collect: boolean
    unable_reason:    string | null
    unable_reason_text: string | null
    is_group_code:    boolean
    group_size:       number
  }
  capsule: {
    event_name:    string
    event_date:    string | null
    event_location: string | null
  }
  entitlements:      Entitlement[]
  initialQrPayload:  string
  credentialId:      string
}

const QR_WINDOW_MINUTES = 5


// ═══ SECTION 2 — QR placeholder ════════════════════════════════════════════════

function QrPlaceholder() {
  return (
    <div className="w-48 h-48 bg-white/5 rounded-xl border border-white/10 flex items-center
                    justify-center">
      <div className="w-8 h-8 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
    </div>
  )
}


// ═══ SECTION 3 — Collection status banner ══════════════════════════════════════

function StatusBanner({ status, collectedAt, unableReason }: {
  status:      string
  collectedAt: string | null
  unableReason: string | null
}) {
  if (status === 'collected') {
    const dateStr = collectedAt
      ? new Date(collectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 text-center">
        <div className="text-emerald-400 text-2xl mb-1">✓</div>
        <p className="text-emerald-300 font-semibold">Gifts Collected</p>
        {dateStr && <p className="text-emerald-400/60 text-sm mt-1">{dateStr}</p>}
      </div>
    )
  }

  if (status === 'partial') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 text-center">
        <p className="text-amber-300 font-semibold">Partial Collection</p>
        <p className="text-amber-400/70 text-sm mt-1">
          Some items are still outstanding. Please return to the collection stand.
        </p>
      </div>
    )
  }

  if (status === 'unavailable_flagged' || unableReason) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-center">
        <p className="text-white/60 font-medium">Unable to Collect</p>
        <p className="text-white/40 text-sm mt-1">
          Your request has been noted. Please contact your event coordinator if you need assistance.
        </p>
      </div>
    )
  }

  return null  // 'uncollected' — no banner, QR is the primary action
}


// ═══ SECTION 4 — Gift item row ══════════════════════════════════════════════════

function GiftRow({ ent }: { ent: Entitlement }) {
  const isCollected = ent.quantity_collected >= ent.quantity_entitled
  const isPartial   = ent.quantity_collected > 0 && !isCollected

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-white/5 last:border-0">
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        isCollected ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : 'bg-[#E2C36B]/40'
      }`} />

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium">{ent.item_name}</p>
        {ent.donor_name_visible && ent.donor_name && (
          <p className="text-white/35 text-xs mt-0.5">Donated by {ent.donor_name}</p>
        )}
        {isPartial && (
          <p className="text-amber-400/70 text-xs mt-0.5">
            {ent.quantity_collected} of {ent.quantity_entitled} collected
          </p>
        )}
        {isCollected && (
          <p className="text-emerald-400/60 text-xs mt-0.5">Collected</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[#E2C36B] font-semibold">×{ent.quantity_entitled}</p>
      </div>
    </div>
  )
}


// ═══ SECTION 5 — QR refresh logic ══════════════════════════════════════════════
//
// Fetches fresh time-windowed QR payload from the server every 5 minutes.
// Falls back silently — numeric code always visible.

function useQrPayload(credentialId: string, initialPayload: string) {
  const [qrPayload, setQrPayload] = useState(initialPayload)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true)
      const res  = await fetch(`/api/gift/credential/qr?credential_id=${credentialId}`)
      const data = await res.json()
      if (res.ok && data.qr_payload) {
        setQrPayload(data.qr_payload)
      }
    } catch {
      // Silent — numeric code remains functional
    } finally {
      setRefreshing(false)
    }
  }, [credentialId])

  useEffect(() => {
    const interval = setInterval(refresh, QR_WINDOW_MINUTES * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  return { qrPayload, refreshing }
}


// ═══ SECTION 6 — Date formatter ════════════════════════════════════════════════

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}


// ═══ SECTION 7 — Main component ════════════════════════════════════════════════

export default function GiftCredentialDisplay({
  credential,
  capsule,
  entitlements,
  initialQrPayload,
  credentialId,
}: GiftCredentialDisplayProps) {
  const { qrPayload, refreshing } = useQrPayload(credentialId, initialQrPayload)
  const isCollected = credential.collection_status === 'collected'

  return (
    <div className="min-h-screen bg-[#0a061a] flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-sm space-y-5">

        {/* ── Event header ─────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-[#E2C36B] text-xs tracking-widest uppercase mb-2">
            Gift Collection
          </p>
          <h1 className="text-white font-bold text-xl leading-tight">{capsule.event_name}</h1>
          {capsule.event_date && (
            <p className="text-white/40 text-sm mt-1">{formatDate(capsule.event_date)}</p>
          )}
        </div>

        {/* ── Guest name + category ─────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-1">Prepared for</p>
          <p className="text-white font-semibold text-xl">{credential.guest_name}</p>
          {credential.guest_category && (
            <span className="inline-block mt-2 text-xs text-[#E2C36B]/70 bg-[#E2C36B]/10
                             border border-[#E2C36B]/20 rounded-full px-3 py-0.5">
              {credential.guest_category}
            </span>
          )}
        </div>

        {/* ── Collection status ─────────────────────────────────────────── */}
        <StatusBanner
          status={credential.collection_status}
          collectedAt={credential.collected_at}
          unableReason={credential.unable_reason}
        />

        {/* ── QR code ──────────────────────────────────────────────────── */}
        {!isCollected && (
          <div className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3">
            <p className="text-[#0a061a]/50 text-xs tracking-wider uppercase">Scan at stand</p>
            <div className="relative">
              <QRCodeSVG
                value={qrPayload}
                size={192}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0a061a"
              />
              {refreshing && (
                <div className="absolute inset-0 bg-white/80 rounded flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#0a061a]/20 border-t-[#0a061a] rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-[#0a061a]/30 text-xs">Updates automatically every 5 minutes</p>
          </div>
        )}

        {/* ── Numeric code ──────────────────────────────────────────────── */}
        <div className="bg-[#1a0c40] border border-[#E2C36B]/20 rounded-2xl px-5 py-5 text-center">
          <p className="text-[#E2C36B]/50 text-xs tracking-widest uppercase mb-2">
            {isCollected ? 'Your Code (Used)' : 'Your Code — say this at the stand'}
          </p>
          <p className={`text-[#E2C36B] font-bold tracking-widest ${
            isCollected ? 'text-4xl opacity-50' : 'text-5xl'
          }`}>
            {credential.numeric_code}
          </p>
          {!isCollected && (
            <p className="text-white/25 text-xs mt-2">
              No phone? Just say your name and this code.
            </p>
          )}
        </div>

        {/* ── Gift list ──────────────────────────────────────────────────── */}
        {entitlements.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/5">
              <p className="text-white/40 text-xs tracking-wider uppercase">Your Gifts</p>
            </div>
            <div className="px-5">
              {entitlements.map(ent => <GiftRow key={ent.id} ent={ent} />)}
            </div>
          </div>
        )}

        {/* ── Location tip ──────────────────────────────────────────────── */}
        {capsule.event_location && !isCollected && (
          <div className="text-center">
            <p className="text-white/25 text-xs leading-relaxed">
              Collection stand at: <span className="text-white/40">{capsule.event_location}</span>
            </p>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="text-center pb-4">
          <p className="text-white/15 text-xs">
            LegacyCapsule · itslegacycapsule.com
          </p>
        </div>

      </div>
    </div>
  )
}
