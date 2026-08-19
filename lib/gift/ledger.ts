// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  lib/gift/ledger.ts
// PURPOSE:    Immutable Fulfilment Ledger write utility for Gift Collection System
//             writeLedgerEvent() — single write path for all GCS ledger events
//             Non-blocking, never throws, same pattern as lib/activity/logAction.ts
// SPEC:       GCS-SPEC-001-AMD-002 v1.0 — Part Five
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// RULES (non-negotiable — AMD-002 Rule 37-38):
//   • gift_fulfilment_ledger is append-only. NEVER update or delete rows.
//   • writeLedgerEvent() NEVER throws. Wrap all DB calls in try/catch.
//   • Ledger write failure must NEVER fail the parent operation.
//   • All inventory counter updates must have a corresponding ledger event.
//   • To reverse a collection: write COLLECTION_REVERSED — never edit the original.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'


// ═══ SECTION 1 — Named event types ═════════════════════════════════════════════
//
// All valid event types for gift_fulfilment_ledger.event_type.
// AMD-002 Part Five authoritative list.

export type GiftLedgerEventType =
  // Entitlement lifecycle
  | 'ENTITLEMENT_CREATED'
  | 'ENTITLEMENT_CHANGED'
  | 'ENTITLEMENT_REVOKED'
  // Inventory
  | 'INVENTORY_ALLOCATED'
  | 'INVENTORY_RELEASED'
  | 'INVENTORY_ADDED'
  | 'INVENTORY_REMOVED'
  // Credential lifecycle
  | 'CODE_GENERATED'
  | 'CODE_DELIVERED'
  | 'CODE_VIEWED'
  | 'CODE_BLOCKED'
  | 'CODE_UNBLOCKED'
  // Verification
  | 'VERIFICATION_ATTEMPTED'
  | 'VERIFICATION_FAILED'
  // Collection flow
  | 'COLLECTION_STARTED'
  | 'ITEM_DISPATCHED'
  | 'ITEM_UNAVAILABLE'
  | 'COLLECTION_COMPLETED'
  | 'PARTIAL_COLLECTION'
  | 'COLLECTION_REVERSED'
  | 'UNABLE_TO_COLLECT'
  | 'ORGANISER_OVERRIDE'
  | 'POOL_COLLECTION'
  // Stand session
  | 'STAND_SESSION_STARTED'
  | 'STAND_SESSION_CLOSED'
  | 'STAND_SUSPENDED'
  // Event-level
  | 'LOCKDOWN'
  | 'RECONCILIATION_GENERATED'

export type GiftLedgerActorType =
  | 'organiser'
  | 'frfa'
  | 'coordinator'
  | 'coadmin'
  | 'staff'
  | 'recipient'
  | 'system'


// ═══ SECTION 2 — Ledger event params interface ══════════════════════════════════

export interface LedgerEventParams {
  capsule_id:       string
  event_type:       GiftLedgerEventType
  actor_type:       GiftLedgerActorType
  actor_id?:        string       // capsule_accounts UUID or 'system'
  actor_name?:      string
  credential_id?:   string
  manifest_item_id?: string
  block_id?:        string
  stand_session_id?: string
  pool_id?:         string
  quantity?:        number
  payload?:         Record<string, unknown>
  reason?:          string
}


// ═══ SECTION 3 — Supabase admin client ════════════════════════════════════════
//
// Uses service_role key — ledger writes bypass RLS.
// Service key must NEVER be exposed to the client.

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 4 — writeLedgerEvent ══════════════════════════════════════════════
//
// The single write path for all GCS ledger events.
// Call this from every API route that changes GCS state.
//
// Design contract (same as logAction.ts):
//   • Always call without await on the happy path (fire and forget).
//   • If caller needs to confirm write (e.g. ECC routes), await it — it resolves
//     to true (success) or false (failure), never throws.
//   • Never let a ledger failure surface to the caller as an error.
//
// Usage examples:
//   // Fire and forget (standard — do not await)
//   writeLedgerEvent({ capsule_id, event_type: 'CODE_GENERATED', actor_type: 'coordinator', ... })
//
//   // Awaited (when caller cares — rare)
//   const ok = await writeLedgerEvent({ ... })

export async function writeLedgerEvent(params: LedgerEventParams): Promise<boolean> {
  try {
    const db = getAdminClient()

    const { error } = await db
      .from('gift_fulfilment_ledger')
      .insert({
        capsule_id:       params.capsule_id,
        event_type:       params.event_type,
        actor_type:       params.actor_type,
        actor_id:         params.actor_id         ?? null,
        actor_name:       params.actor_name        ?? null,
        credential_id:    params.credential_id     ?? null,
        manifest_item_id: params.manifest_item_id  ?? null,
        block_id:         params.block_id          ?? null,
        stand_session_id: params.stand_session_id  ?? null,
        pool_id:          params.pool_id           ?? null,
        quantity:         params.quantity          ?? null,
        payload:          params.payload           ?? null,
        reason:           params.reason            ?? null,
        // created_at: DB default (now())
      })

    if (error) {
      // Log to console but never throw — ledger failure must not fail parent operation
      console.error('[GCS Ledger] writeLedgerEvent error:', error.message, {
        event_type: params.event_type,
        capsule_id: params.capsule_id,
      })
      return false
    }

    return true
  } catch (err) {
    // Catch all unexpected errors — never propagate
    console.error('[GCS Ledger] writeLedgerEvent unexpected error:', err)
    return false
  }
}


// ═══ SECTION 5 — Convenience batch writer ══════════════════════════════════════
//
// Writes multiple ledger events in a single DB round-trip.
// Used for collection completion (ITEM_DISPATCHED × N + COLLECTION_COMPLETED).
// Same non-blocking, never-throws contract as writeLedgerEvent.

export async function writeLedgerEvents(
  events: LedgerEventParams[]
): Promise<boolean> {
  if (!events.length) return true

  try {
    const db = getAdminClient()

    const rows = events.map(params => ({
      capsule_id:       params.capsule_id,
      event_type:       params.event_type,
      actor_type:       params.actor_type,
      actor_id:         params.actor_id         ?? null,
      actor_name:       params.actor_name        ?? null,
      credential_id:    params.credential_id     ?? null,
      manifest_item_id: params.manifest_item_id  ?? null,
      block_id:         params.block_id          ?? null,
      stand_session_id: params.stand_session_id  ?? null,
      pool_id:          params.pool_id           ?? null,
      quantity:         params.quantity          ?? null,
      payload:          params.payload           ?? null,
      reason:           params.reason            ?? null,
    }))

    const { error } = await db
      .from('gift_fulfilment_ledger')
      .insert(rows)

    if (error) {
      console.error('[GCS Ledger] writeLedgerEvents batch error:', error.message, {
        count:      events.length,
        capsule_id: events[0]?.capsule_id,
      })
      return false
    }

    return true
  } catch (err) {
    console.error('[GCS Ledger] writeLedgerEvents unexpected error:', err)
    return false
  }
}