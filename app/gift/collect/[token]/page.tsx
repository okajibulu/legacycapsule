// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/gift/collect/[token]/page.tsx
// PURPOSE:    Guest-facing gift collection credential page
//             — Resolves token → credential + entitlements
//             — Renders dynamic time-windowed QR (auto-refreshes every 5 minutes)
//             — Shows numeric code, gift list, collection status
//             — Logs server-side visit on every load (no cookies)
//             — No login required — token in URL authenticates guest
// SPEC:       GCS-SPEC-001-AMD-001 Part Three Section 3.2 + Rules 26, 27, 32
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
//
// ARCHITECTURE:
//   Server component fetches credential data + logs visit.
//   Client component (GiftCredentialDisplay) renders QR and handles refresh.
//   QR is rendered via qrcode.react (dynamically imported, ssr: false).
//   QR payload built by buildQrPayload() from verificationUtils — time-windowed.
// ═══════════════════════════════════════════════════════════════════════════════

import { notFound }                from 'next/navigation'
import { createClient }            from '@supabase/supabase-js'
import { buildQrPayload }          from '@/lib/gift/verificationUtils'
import GiftCredentialDisplay       from '@/components/gift/GiftCredentialDisplay'


// ═══ SECTION 1 — Supabase admin client (server-side) ═══════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Types ═════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ token: string }>
}


// ═══ SECTION 3 — Server component — data fetch + visit log ═════════════════════

export default async function GiftCollectPage({ params }: PageProps) {
  const { token } = await params
  const db        = getDb()

  // ── Resolve credential by token ────────────────────────────────────────────
  const { data: credential } = await db
    .from('gift_credentials')
    .select(`
      id,
      capsule_id,
      guest_name,
      guest_category,
      numeric_code,
      code_type,
      is_group_code,
      group_size,
      collection_status,
      collected_at,
      unable_to_collect,
      unable_reason,
      unable_reason_text,
      is_active,
      is_blocked,
      block_reason
    `)
    .eq('qr_payload', token)
    .maybeSingle()

  if (!credential) {
    notFound()
  }

  // ── Fetch capsule display info ─────────────────────────────────────────────
  const { data: capsule } = await db
    .from('capsules')
    .select('event_name, honouree_name, event_date, event_location')
    .eq('id', credential.capsule_id)
    .maybeSingle()

  // ── Fetch live entitlements (AMD-001 Rule 26 — resolved at load time) ──────
  const { data: entitlements } = await db
    .from('gift_entitlements')
    .select(`
      id,
      quantity_entitled,
      quantity_collected,
      gift_manifest_items (
        item_name,
        donor_name,
        donor_name_visible
      )
    `)
    .eq('credential_id', credential.id)
    .eq('capsule_id', credential.capsule_id)

  // ── Log visit — server-side, no cookies (AMD-001 Rule 32) ─────────────────
  // Fire and forget — never block render on visit log
  void db.from('gift_credential_visits')
    .insert({ credential_id: credential.id, capsule_id: credential.capsule_id })

  // ── Build initial QR payload (time-windowed) ────────────────────────────────
  // Client will rebuild this every 5 minutes automatically.
  const initialQrPayload = buildQrPayload(credential.id)

  // ── Blocked / inactive state ───────────────────────────────────────────────
  if (!credential.is_active || credential.is_blocked) {
    return (
      <div className="min-h-screen bg-[#0a061a] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20
                          flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-white font-semibold text-xl">Collection Temporarily Paused</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            {credential.block_reason
              ? credential.block_reason
              : 'This gift collection code is currently inactive. Please speak to your event coordinator.'}
          </p>
          <p className="text-white/25 text-xs">{capsule?.event_name}</p>
        </div>
      </div>
    )
  }

  return (
    <GiftCredentialDisplay
      credential={{
        id:               credential.id,
        guest_name:       credential.guest_name,
        guest_category:   credential.guest_category,
        numeric_code:     credential.numeric_code,
        collection_status: credential.collection_status,
        collected_at:     credential.collected_at,
        unable_to_collect: credential.unable_to_collect,
        unable_reason:    credential.unable_reason,
        unable_reason_text: credential.unable_reason_text,
        is_group_code:    credential.is_group_code,
        group_size:       credential.group_size,
      }}
      capsule={{
        event_name:    capsule?.event_name    ?? 'Your Event',
        event_date:    capsule?.event_date    ?? null,
        event_location: capsule?.event_location ?? null,
      }}
      entitlements={(entitlements ?? []).map(e => {
        const mItem = e.gift_manifest_items as unknown as {
          item_name: string
          donor_name: string | null
          donor_name_visible: boolean
        }
        return {
          id:                 e.id,
          quantity_entitled:  e.quantity_entitled,
          quantity_collected: e.quantity_collected,
          item_name:          mItem.item_name,
          donor_name:         mItem.donor_name,
          donor_name_visible: mItem.donor_name_visible,
        }
      })}
      initialQrPayload={initialQrPayload}
      credentialId={credential.id}
    />
  )
}


// ═══ SECTION 4 — Metadata ═════════════════════════════════════════════════════

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params
  const db = getDb()

  const { data: credential } = await db
    .from('gift_credentials')
    .select('guest_name, capsule_id')
    .eq('qr_payload', token)
    .maybeSingle()

  if (!credential) return { title: 'Gift Collection · LegacyCapsule' }

  const { data: capsule } = await db
    .from('capsules')
    .select('event_name')
    .eq('id', credential.capsule_id)
    .maybeSingle()

  return {
    title: `Gift Collection — ${capsule?.event_name ?? 'Your Event'} · LegacyCapsule`,
    description: `${credential.guest_name}'s gift collection credential.`,
  }
}
