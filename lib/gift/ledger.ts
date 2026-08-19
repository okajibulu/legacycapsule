// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  lib/gift/ledger.ts
// PURPOSE:    GCS Fulfilment Ledger write utilities
//             THREE-TIER WRITE CONTRACT:
//
//             TIER 1 — Transactional (inside PostgreSQL RPC functions)
//               Written inside gcs_create_entitlement(), gcs_update_entitlement(),
//               gcs_revoke_entitlement(), gcs_create_pool(), gcs_confirm_dispatch().
//               Events: ENTITLEMENT_CREATED/CHANGED/REVOKED, INVENTORY_ALLOCATED/RELEASED,
//                       COLLECTION_COMPLETED, PARTIAL_COLLECTION, ITEM_DISPATCHED,
//                       ITEM_UNAVAILABLE.
//               If the RPC fails, the ledger write rolls back with the state mutation.
//               These events are NEVER written from JS — only from PostgreSQL functions.
//
//             TIER 2 — Awaited (writeAuditLedgerEvent)
//               Written from JS after the main operation succeeds.
//               Events: STAND_SESSION_STARTED/CLOSED, STAND_SUSPENDED, LOCKDOWN,
//                       RECONCILIATION_GENERATED, VERIFICATION_FAILED, VERIFICATION_ATTEMPTED.
//               Always awaited. On failure: logged prominently, operation is not rolled back
//               (stand operations must not block guests), but failure is surfaced.
//
//             TIER 3 — Fire-and-forget (writeLedgerEvent)
//               Analytics-level events. Not critical for operational integrity.
//               Events: CODE_VIEWED, CODE_DELIVERED, CODE_GENERATED.
//               Failure is silent.
//
// SPEC:       GCS-SPEC-001-AMD-002 Part Five + Founder Amendment 19 August 2026
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.24
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'


// ═══ SECTION 1 — Named event types ═════════════════════════════════════════════

export type GiftLedgerEventType =
  // Tier 1 — written inside PostgreSQL RPC functions (never call from JS for these)
  | 'ENTITLEMENT_CREATED'
  | 'ENTITLEMENT_CHANGED'
  | 'ENTITLEMENT_REVOKED'
  | 'INVENTORY_ALLOCATED'
  | 'INVENTORY_RELEASED'
  | 'INVENTORY_ADDED'
  | 'INVENTORY_REMOVED'
  | 'COLLECTION_COMPLETED'
  | 'PARTIAL_COLLECTION'
  | 'COLLECTION_REVERSED'
  | 'ITEM_DISPATCHED'
  | 'ITEM_UNAVAILABLE'
  | 'POOL_COLLECTION'
  | 'ORGANISER_OVERRIDE'
  // Tier 2 — written from JS, always awaited
  | 'STAND_SESSION_STARTED'
  | 'STAND_SESSION_CLOSED'
  | 'STAND_SUSPENDED'
  | 'LOCKDOWN'
  | 'RECONCILIATION_GENERATED'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_ATTEMPTED'
  | 'UNABLE_TO_COLLECT'
  // Tier 3 — fire and forget
  | 'CODE_GENERATED'
  | 'CODE_DELIVERED'
  | 'CODE_VIEWED'
  | 'CODE_BLOCKED'
  | 'CODE_UNBLOCKED'

export type GiftLedgerActorType =
  | 'organiser'
  | 'frfa'
  | 'coordinator'
  | 'coadmin'
  | 'staff'
  | 'recipient'
  | 'system'


// ═══ SECTION 2 — Ledger event params ═══════════════════════════════════════════

export interface LedgerEventParams {
  capsule_id:        string
  event_type:        GiftLedgerEventType
  actor_type:        GiftLedgerActorType
  actor_id?:         string
  actor_name?:       string
  credential_id?:    string
  manifest_item_id?: string
  block_id?:         string
  stand_session_id?: string
  pool_id?:          string
  quantity?:         number
  payload?:          Record<string, unknown>
  reason?:           string
}


// ═══ SECTION 3 — Supabase admin client ═════════════════════════════════════════

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 4 — Shared insert helper ══════════════════════════════════════════

async function insertLedgerRow(params: LedgerEventParams): Promise<boolean> {
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
      })
    if (error) throw error
    return true
  } catch (err) {
    return false
  }
}


// ═══ SECTION 5 — Tier 3: writeLedgerEvent (fire-and-forget) ════════════════════
//
// Use for: CODE_GENERATED, CODE_DELIVERED, CODE_VIEWED, CODE_BLOCKED, CODE_UNBLOCKED.
// Never use for critical fulfilment events — those are written inside RPC functions.

export async function writeLedgerEvent(params: LedgerEventParams): Promise<boolean> {
  try {
    const result = await insertLedgerRow(params)
    if (!result) {
      console.error('[GCS Ledger Tier3] writeLedgerEvent failed silently:', params.event_type, params.capsule_id)
    }
    return result
  } catch (err) {
    console.error('[GCS Ledger Tier3] Unexpected error:', err)
    return false
  }
}


// ═══ SECTION 6 — Tier 2: writeAuditLedgerEvent (awaited, flagged on failure) ══
//
// Use for: STAND_SESSION_STARTED/CLOSED, STAND_SUSPENDED, LOCKDOWN,
//          RECONCILIATION_GENERATED, VERIFICATION_FAILED, VERIFICATION_ATTEMPTED,
//          UNABLE_TO_COLLECT.
//
// Always awaited by the caller. On failure:
//   - Operation is NOT rolled back (stand operations must not block guests)
//   - Error is logged prominently (console.error with AUDIT_FAILURE prefix)
//   - Caller receives false — may surface a non-blocking warning to the UI
//
// This is distinct from Tier 1 (RPC-transactional) because these events occur
// after the main operation commits. The physical action has already happened.
// The audit failure is real and should be investigated, but blocking is not safe
// for stand operations at a live event.

export async function writeAuditLedgerEvent(params: LedgerEventParams): Promise<boolean> {
  const result = await insertLedgerRow(params)
  if (!result) {
    console.error(
      '[GCS Ledger AUDIT_FAILURE] writeAuditLedgerEvent failed — requires investigation:',
      {
        event_type:    params.event_type,
        capsule_id:    params.capsule_id,
        credential_id: params.credential_id,
        actor_type:    params.actor_type,
        actor_id:      params.actor_id,
      }
    )
  }
  return result
}


// ═══ SECTION 7 — Batch Tier 3 writer ═══════════════════════════════════════════
//
// For analytics-style batches. Same fire-and-forget contract as writeLedgerEvent.

export async function writeLedgerEvents(events: LedgerEventParams[]): Promise<boolean> {
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
    const { error } = await db.from('gift_fulfilment_ledger').insert(rows)
    if (error) {
      console.error('[GCS Ledger Tier3 Batch] writeLedgerEvents failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[GCS Ledger Tier3 Batch] Unexpected error:', err)
    return false
  }
}