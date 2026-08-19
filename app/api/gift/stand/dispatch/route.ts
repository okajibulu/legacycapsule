// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/stand/dispatch/route.ts
// PURPOSE:    Gift Collection System — collection dispatch confirmation
//             POST /api/gift/stand/dispatch
//             Accepts per-item outcomes (dispatched ✓ / unavailable ✗) and
//             confirms the complete dispatch event.
//             Also handles: unable_to_collect flag from guest or coordinator.
// SPEC:       GCS-SPEC-001-AMD-001 Rule 33 + AMD-002 Parts Four, Five
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.22
// DATE:       19 August 2026
//
// RULES:
//   AMD-002 Rule 41: Operator confirmation (staff Confirm Dispatch) is primary path.
//   AMD-002 Rule 42: Never block physical handover waiting for guest to tap.
//   AMD-001 Rule 33: Every item must be marked ✓ or ✗ before Confirm Dispatch.
//                    System enforces — rejects if any item unmarked.
//   Writes: COLLECTION_STARTED, ITEM_DISPATCHED × N, ITEM_UNAVAILABLE × N,
//           COLLECTION_COMPLETED or PARTIAL_COLLECTION — all in one batch.
//   Updates: gift_entitlements.quantity_collected, gift_manifest_items.qty_collected,
//            gift_credentials.collection_status.
//   Increments dispatched_count on stand session.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse }          from 'next/server'
import { createClient }                        from '@supabase/supabase-js'
import { writeLedgerEvents, LedgerEventParams } from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Types ═════════════════════════════════════════════════════════

interface ItemOutcome {
  entitlement_id: string
  outcome:        'dispatched' | 'unavailable'
}


// ═══ SECTION 3 — POST /api/gift/stand/dispatch ═════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body           = await req.json()
    const capsuleId      = (body.capsule_id   ?? '').trim()
    const credentialId   = (body.credential_id ?? '').trim()
    const standSessionId = (body.session_id    ?? '').trim()
    const items: ItemOutcome[] = body.items ?? []
    const actorType      = (body.actor_type ?? 'staff') as 'staff' | 'organiser' | 'frfa'
    const actorName      = (body.actor_name ?? '').trim()
    const isUnableToCollect = Boolean(body.unable_to_collect)
    const unableReason   = body.unable_reason   ?? null
    const unableReasonText = body.unable_reason_text ?? null

    if (!capsuleId)      return NextResponse.json({ error: 'capsule_id required' },   { status: 400 })
    if (!credentialId)   return NextResponse.json({ error: 'credential_id required' }, { status: 400 })
    if (!standSessionId) return NextResponse.json({ error: 'session_id required' },    { status: 400 })

    const db = getDb()

    // ── Validate stand session ────────────────────────────────────────────────
    const { data: standSession } = await db
      .from('gift_stand_sessions')
      .select('id, status, staff_name, stand_name, dispatched_count, capsule_id')
      .eq('id', standSessionId)
      .maybeSingle()

    if (!standSession || standSession.capsule_id !== capsuleId) {
      return NextResponse.json({ error: 'Stand session not found' }, { status: 404 })
    }
    if (standSession.status !== 'active') {
      return NextResponse.json({ error: 'Stand session is not active' }, { status: 403 })
    }

    // ── Load credential ───────────────────────────────────────────────────────
    const { data: credential } = await db
      .from('gift_credentials')
      .select('id, guest_name, collection_status, block_id, is_active, is_blocked')
      .eq('id', credentialId)
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    if (!credential) return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    if (credential.collection_status === 'collected') {
      return NextResponse.json({ error: 'This gift has already been fully collected.' }, { status: 409 })
    }

    // ── Unable to collect flow ────────────────────────────────────────────────
    if (isUnableToCollect) {
      if (!unableReason) {
        return NextResponse.json({ error: 'A reason is required when marking unable to collect.' }, { status: 400 })
      }

      await db.from('gift_credentials').update({
        unable_to_collect:  true,
        unable_reason:      unableReason,
        unable_reason_text: unableReasonText,
        unable_flagged_at:  new Date().toISOString(),
        collection_status:  'unavailable_flagged',
        updated_at:         new Date().toISOString(),
      }).eq('id', credentialId)

      writeLedgerEvents([{
        capsule_id:       capsuleId,
        event_type:       'UNABLE_TO_COLLECT',
        actor_type:       actorType,
        actor_name:       actorName || standSession.staff_name,
        credential_id:    credentialId,
        stand_session_id: standSessionId,
        block_id:         credential.block_id,
        payload: {
          guest_name:          credential.guest_name,
          unable_reason:       unableReason,
          unable_reason_text:  unableReasonText,
          stand_name:          standSession.stand_name,
        },
      }])

      return NextResponse.json({ success: true, status: 'unavailable_flagged' })
    }

    // ── Standard dispatch flow ────────────────────────────────────────────────

    // AMD-001 Rule 33: every item must be marked before Confirm Dispatch
    if (!items.length) {
      return NextResponse.json(
        { error: 'Item outcomes are required. Mark each item ✓ or ✗ before confirming.' },
        { status: 400 }
      )
    }

    // Load all entitlements for this credential to validate completeness
    const { data: entitlements } = await db
      .from('gift_entitlements')
      .select('id, manifest_item_id, quantity_entitled, quantity_collected')
      .eq('credential_id', credentialId)
      .eq('capsule_id', capsuleId)

    const expectedIds  = new Set((entitlements ?? []).map((e: { id: string }) => e.id))
    const submittedIds = new Set(items.map(i => i.entitlement_id))

    // Check all entitlements are accounted for
    for (const id of expectedIds) {
      if (!submittedIds.has(id)) {
        return NextResponse.json(
          {
            error:
              'All items must be marked before confirming dispatch. ' +
              'At least one item has not been marked ✓ or ✗.',
          },
          { status: 422 }
        )
      }
    }

    // ── Process each item outcome ─────────────────────────────────────────────
    const ledgerEvents: LedgerEventParams[] = []
    let dispatchedCount = 0
    let unavailableCount = 0

    for (const outcome of items) {
      const ent = (entitlements ?? []).find((e: { id: string }) => e.id === outcome.entitlement_id) as {
        id: string; manifest_item_id: string; quantity_entitled: number; quantity_collected: number
      } | undefined
      if (!ent) continue

      if (outcome.outcome === 'dispatched') {
        dispatchedCount++

        // Update entitlement collected counter
        await db.from('gift_entitlements').update({
          quantity_collected: ent.quantity_entitled,
          updated_at:         new Date().toISOString(),
        }).eq('id', ent.id)

        // Update manifest qty_collected
        const { data: mItem } = await db
          .from('gift_manifest_items')
          .select('qty_collected, quantity_collected_legacy')
          .eq('id', ent.manifest_item_id)
          .maybeSingle()

        if (mItem) {
          await db.from('gift_manifest_items').update({
            qty_collected:             (mItem.qty_collected ?? 0) + ent.quantity_entitled,
            quantity_collected_legacy: (mItem.quantity_collected_legacy ?? 0) + ent.quantity_entitled,
            updated_at:                new Date().toISOString(),
          }).eq('id', ent.manifest_item_id)
        }

        ledgerEvents.push({
          capsule_id:       capsuleId,
          event_type:       'ITEM_DISPATCHED',
          actor_type:       actorType,
          actor_name:       actorName || standSession.staff_name,
          credential_id:    credentialId,
          manifest_item_id: ent.manifest_item_id,
          stand_session_id: standSessionId,
          block_id:         credential.block_id,
          quantity:         ent.quantity_entitled,
          payload: { guest_name: credential.guest_name, stand_name: standSession.stand_name },
        })
      } else {
        // unavailable
        unavailableCount++

        // Update manifest qty_exceptions
        const { data: mItem } = await db
          .from('gift_manifest_items')
          .select('qty_exceptions')
          .eq('id', ent.manifest_item_id)
          .maybeSingle()

        if (mItem) {
          await db.from('gift_manifest_items').update({
            qty_exceptions: (mItem.qty_exceptions ?? 0) + ent.quantity_entitled,
            updated_at:     new Date().toISOString(),
          }).eq('id', ent.manifest_item_id)
        }

        ledgerEvents.push({
          capsule_id:       capsuleId,
          event_type:       'ITEM_UNAVAILABLE',
          actor_type:       actorType,
          actor_name:       actorName || standSession.staff_name,
          credential_id:    credentialId,
          manifest_item_id: ent.manifest_item_id,
          stand_session_id: standSessionId,
          block_id:         credential.block_id,
          quantity:         ent.quantity_entitled,
          payload: { guest_name: credential.guest_name, stand_name: standSession.stand_name },
        })
      }
    }

    // ── Determine final collection status ─────────────────────────────────────
    const finalStatus = unavailableCount === 0
      ? 'collected'
      : dispatchedCount === 0
        ? 'unavailable_flagged'
        : 'partial'

    // Update credential status
    await db.from('gift_credentials').update({
      collection_status:       finalStatus,
      collected_at:            finalStatus !== 'unavailable_flagged' ? new Date().toISOString() : null,
      collection_confirmed_by: actorType === 'staff' ? 'staff' : 'organiser_override',
      updated_at:              new Date().toISOString(),
    }).eq('id', credentialId)

    // Summary ledger event
    ledgerEvents.push({
      capsule_id:       capsuleId,
      event_type:       finalStatus === 'collected' ? 'COLLECTION_COMPLETED' : 'PARTIAL_COLLECTION',
      actor_type:       actorType,
      actor_name:       actorName || standSession.staff_name,
      credential_id:    credentialId,
      stand_session_id: standSessionId,
      block_id:         credential.block_id,
      quantity:         dispatchedCount,
      payload: {
        guest_name:       credential.guest_name,
        dispatched_count: dispatchedCount,
        unavailable_count: unavailableCount,
        stand_name:       standSession.stand_name,
      },
    })

    // Write all ledger events in one batch
    writeLedgerEvents(ledgerEvents)

    // Increment dispatched_count on session
    await db.from('gift_stand_sessions').update({
      dispatched_count: standSession.dispatched_count + 1,
    }).eq('id', standSessionId)

    return NextResponse.json({
      success:          true,
      status:           finalStatus,
      dispatched_count: dispatchedCount,
      unavailable_count: unavailableCount,
      message:
        finalStatus === 'collected'
          ? 'Collection complete — enjoy the celebration.'
          : finalStatus === 'partial'
            ? `Partial collection recorded — ${unavailableCount} item${unavailableCount !== 1 ? 's' : ''} still outstanding.`
            : 'Unable to collect recorded.',
    })
  } catch (err) {
    console.error('[GCS Stand Dispatch] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}