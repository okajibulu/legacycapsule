// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/stand/dispatch/route.ts
// PURPOSE:    Gift Collection System — collection dispatch confirmation
//             POST /api/gift/stand/dispatch
//             Delegates to gcs_confirm_dispatch() PostgreSQL RPC.
//             Handles unable_to_collect separately (not inside the RPC —
//             unable is a status flag, not a fulfilment event).
// SPEC:       GCS-SPEC-001-AMD-002 + Founder Amendment 19 August 2026
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.24
// DATE:       19 August 2026
//
// TRANSACTION MODEL:
//   Standard dispatch: gcs_confirm_dispatch() RPC — fully atomic.
//   Pool consumption is inside the RPC when p_pool_id is provided.
//   Unable-to-collect: simple status update — not inside RPC (no fulfilment).
//
// ACTOR TYPE: ALWAYS server-derived. Stand routes always produce 'staff'.
//   actor_type is NEVER accepted from the client request body.
//   Removing actor_type from client body is a security correction (Founder Amendment).
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse }   from 'next/server'
import { createClient }                from '@supabase/supabase-js'
import { writeAuditLedgerEvent }       from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — RPC error parser ══════════════════════════════════════════════

function parseRpcError(message: string): { userMessage: string; status: number } {
  if (message.includes('POOL_EXHAUSTED')) {
    const parts = message.split(':')
    return {
      userMessage: `This pool has reached its maximum of ${parts[2]?.trim() ?? '?'} collections and is no longer available.`,
      status: 409,
    }
  }
  if (message.includes('OVER_COLLECTION')) {
    return { userMessage: 'Cannot dispatch more than the entitled quantity. Check item quantities.', status: 422 }
  }
  if (message.includes('INVALID_DISPATCH_QTY')) {
    return { userMessage: 'Dispatched quantity must be 1 or more for each item marked ✓.', status: 400 }
  }
  if (message.includes('CREDENTIAL_NOT_FOUND')) {
    return { userMessage: 'Credential not found.', status: 404 }
  }
  if (message.includes('ENTITLEMENT_NOT_FOUND')) {
    return { userMessage: 'One or more entitlements not found.', status: 404 }
  }
  if (message.includes('POOL_NOT_FOUND')) {
    return { userMessage: 'Pool not found or is no longer active.', status: 404 }
  }
  return { userMessage: 'Dispatch failed — please try again.', status: 500 }
}


// ═══ SECTION 3 — POST /api/gift/stand/dispatch ═════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body           = await req.json()
    const capsuleId      = (body.capsule_id    ?? '').trim()
    const credentialId   = (body.credential_id  ?? '').trim()
    const standSessionId = (body.session_id     ?? '').trim()
    const poolId         = body.pool_id          ?? null   // optional — pool collections only
    const items: { entitlement_id: string; outcome: 'dispatched' | 'unavailable'; quantity?: number }[]
                         = body.items            ?? []
    const isUnableToCollect = Boolean(body.unable_to_collect)
    const unableReason      = body.unable_reason     ?? null
    const unableReasonText  = body.unable_reason_text ?? null
    // NOTE: actor_type and actor_name are NEVER accepted from client body.
    // Stand routes always produce actor_type = 'staff'.
    // actor_name is taken from the stand session record.

    if (!capsuleId)      return NextResponse.json({ error: 'capsule_id required' },   { status: 400 })
    if (!credentialId)   return NextResponse.json({ error: 'credential_id required' }, { status: 400 })
    if (!standSessionId) return NextResponse.json({ error: 'session_id required' },    { status: 400 })

    const db = getDb()

    // Validate stand session — derive actor_name from session (not from client)
    const { data: standSession } = await db
      .from('gift_stand_sessions')
      .select('id, status, staff_name, stand_name, capsule_id')
      .eq('id', standSessionId)
      .maybeSingle()

    if (!standSession || standSession.capsule_id !== capsuleId) {
      return NextResponse.json({ error: 'Stand session not found' }, { status: 404 })
    }
    if (standSession.status !== 'active') {
      return NextResponse.json({ error: 'Stand session is not active' }, { status: 403 })
    }

    // Server-derived actor identity — ALWAYS 'staff' for stand routes
    const actorType = 'staff'
    const actorName = standSession.staff_name  // from session record, not client

    // ── Unable to collect path ────────────────────────────────────────────────
    // Not inside the dispatch RPC — unable is a status flag, not a fulfilment event.
    // No inventory movement occurs.
    if (isUnableToCollect) {
      if (!unableReason) {
        return NextResponse.json({ error: 'A reason is required when marking unable to collect.' }, { status: 400 })
      }

      const { error: updateErr } = await db
        .from('gift_credentials')
        .update({
          unable_to_collect:  true,
          unable_reason:      unableReason,
          unable_reason_text: unableReasonText,
          unable_flagged_at:  new Date().toISOString(),
          collection_status:  'unavailable_flagged',
          updated_at:         new Date().toISOString(),
        })
        .eq('id', credentialId)
        .eq('capsule_id', capsuleId)

      if (updateErr) {
        console.error('[GCS Dispatch] Unable-to-collect update error:', updateErr.message)
        return NextResponse.json({ error: 'Failed to record unable to collect.' }, { status: 500 })
      }

      // Tier 2 ledger — awaited, flagged on failure but not blocking
      await writeAuditLedgerEvent({
        capsule_id:    capsuleId,
        event_type:    'UNABLE_TO_COLLECT',
        actor_type:    actorType,
        actor_name:    actorName,
        credential_id: credentialId,
        stand_session_id: standSessionId,
        payload: {
          unable_reason:     unableReason,
          unable_reason_text: unableReasonText,
          stand_name:        standSession.stand_name,
        },
      })

      return NextResponse.json({ success: true, status: 'unavailable_flagged' })
    }

    // ── Standard dispatch path — delegate to RPC ─────────────────────────────
    if (!items.length) {
      return NextResponse.json(
        { error: 'Item outcomes are required. Mark each item ✓ or ✗ before confirming.' },
        { status: 400 }
      )
    }

    // Build items payload for RPC — include actual quantity per dispatched item
    const rpcItems = items.map(item => ({
      entitlement_id: item.entitlement_id,
      outcome:        item.outcome,
      // Correction B: actual quantity handed over. Default to 0 for unavailable.
      quantity:       item.outcome === 'dispatched' ? (item.quantity ?? 1) : 0,
    }))

    // Verify all submitted item outcomes and alert if any missing
    // (verification route enforces all items must be marked)

    // Call fully atomic RPC — pool + items + status + ledger in one transaction
    const { data: result, error: rpcError } = await db.rpc('gcs_confirm_dispatch', {
      p_capsule_id:       capsuleId,
      p_credential_id:    credentialId,
      p_stand_session_id: standSessionId,
      p_actor_name:       actorName,    // from session record
      p_actor_type:       actorType,    // always 'staff' — never from client
      p_pool_id:          poolId,
      p_items:            JSON.stringify(rpcItems),
    })

    if (rpcError) {
      const { userMessage, status } = parseRpcError(rpcError.message)
      return NextResponse.json({ error: userMessage }, { status })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[GCS Dispatch] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}