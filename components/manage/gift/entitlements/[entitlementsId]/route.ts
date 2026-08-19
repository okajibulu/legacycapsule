// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/entitlements/[entitlementId]/route.ts
// PURPOSE:    Gift Collection System — entitlement update and revocation
//             PATCH  /api/gift/entitlements/[id] — change quantity, reallocate delta
//             DELETE /api/gift/entitlements/[id] — revoke entitlement, release allocation
// SPEC:       GCS-SPEC-001-AMD-002 v1.0 Parts Two, Six — Phase 3 Step 8
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.20
// DATE:       19 August 2026
//
// RULES:
//   • PATCH — only quantity_entitled is editable.
//     Increase: check qty_unallocated >= delta. Reserve additional allocation.
//     Decrease: cannot go below quantity_collected (already handed over).
//     Decrease: releases the delta back to unallocated.
//   • DELETE — blocked if quantity_collected > 0 (partial or full collection done).
//     Releases quantity_allocated back to manifest inventory.
//   • Both ops write ledger events.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { writeLedgerEvents }         from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth + ownership helper ═══════════════════════════════════════

async function resolveSessionAndEntitlement(
  req:           NextRequest,
  entitlementId: string
) {
  const db        = getDb()
  const sessionId = req.cookies.get('manage_session')?.value
  if (!sessionId) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: session } = await db
    .from('manage_sessions')
    .select('account_id, capsule_id, expires_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || new Date(session.expires_at) < new Date()) {
    throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data: entitlement } = await db
    .from('gift_entitlements')
    .select('*, gift_manifest_items (id, item_name, qty_in_stock, qty_allocated)')
    .eq('id', entitlementId)
    .eq('capsule_id', session.capsule_id)
    .maybeSingle()

  if (!entitlement) {
    throw NextResponse.json({ error: 'Entitlement not found' }, { status: 404 })
  }

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', session.capsule_id).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  const { data: account } = await db
    .from('capsule_accounts')
    .select('id, display_name, role')
    .eq('id', session.account_id)
    .maybeSingle()

  if (!account) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  return { entitlement, accountId: account.id, accountName: account.display_name, role: account.role, capsuleId: session.capsule_id }
}


// ═══ SECTION 3 — PATCH /api/gift/entitlements/[entitlementId] ══════════════════
//
// Updates quantity_entitled. Calculates allocation delta and validates / applies.

export async function PATCH(
  req:     NextRequest,
  { params }: { params: Promise<{ entitlementId: string }> }
) {
  try {
    const { entitlementId }                                     = await params
    const { entitlement, accountId, accountName, role, capsuleId } = await resolveSessionAndEntitlement(req, entitlementId)
    const db   = getDb()
    const body = await req.json()

    const newQtyEntitled = parseInt(body.quantity_entitled, 10)
    if (isNaN(newQtyEntitled) || newQtyEntitled < 1) {
      return NextResponse.json({ error: 'Quantity must be 1 or more' }, { status: 400 })
    }

    const oldQtyEntitled  = entitlement.quantity_entitled  as number
    const qtyCollected    = entitlement.quantity_collected as number
    const delta           = newQtyEntitled - oldQtyEntitled
    const item            = entitlement.gift_manifest_items as {
      id: string; item_name: string; qty_in_stock: number; qty_allocated: number
    }

    if (delta === 0) {
      return NextResponse.json({ entitlement }, { status: 200 })
    }

    // Cannot reduce below what has already been collected
    if (newQtyEntitled < qtyCollected) {
      return NextResponse.json(
        {
          error:
            `Cannot reduce entitlement below ${qtyCollected} — that quantity has already been ` +
            `collected. Minimum is ${qtyCollected}.`,
        },
        { status: 422 }
      )
    }

    // Increasing — check unallocated capacity
    if (delta > 0) {
      const qtyUnallocated = item.qty_in_stock - item.qty_allocated
      if (delta > qtyUnallocated) {
        return NextResponse.json(
          {
            error:
              `Only ${qtyUnallocated} unallocated unit${qtyUnallocated !== 1 ? 's' : ''} of ` +
              `"${item.item_name}" available. Cannot increase by ${delta}.`,
            qty_unallocated: qtyUnallocated,
          },
          { status: 422 }
        )
      }
    }

    // Update entitlement
    const { data: updated, error: updateErr } = await db
      .from('gift_entitlements')
      .update({
        quantity_entitled:  newQtyEntitled,
        quantity_allocated: entitlement.quantity_allocated + delta,
        updated_at:         new Date().toISOString(),
      })
      .eq('id', entitlementId)
      .select()
      .single()

    if (updateErr) {
      console.error('[GCS Entitlements PATCH] Update error:', updateErr.message)
      return NextResponse.json({ error: 'Failed to update entitlement' }, { status: 500 })
    }

    // Update manifest allocation counter
    await db
      .from('gift_manifest_items')
      .update({
        qty_allocated:    item.qty_allocated + delta,
        quantity_assigned: item.qty_allocated + delta,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', item.id)

    // Ledger — fire and forget
    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)
    writeLedgerEvents([
      {
        capsule_id:       capsuleId,
        event_type:       'ENTITLEMENT_CHANGED',
        actor_type:       isCoordinator ? 'coordinator' : 'organiser',
        actor_id:         accountId,
        actor_name:       accountName,
        credential_id:    entitlement.credential_id,
        manifest_item_id: item.id,
        quantity:         newQtyEntitled,
        payload: {
          previous_quantity: oldQtyEntitled,
          new_quantity:      newQtyEntitled,
          delta,
        },
      },
      {
        capsule_id:       capsuleId,
        event_type:       delta > 0 ? 'INVENTORY_ALLOCATED' : 'INVENTORY_RELEASED',
        actor_type:       'system',
        actor_id:         'system',
        actor_name:       'System',
        manifest_item_id: item.id,
        quantity:         Math.abs(delta),
        payload: {
          previous_allocated: item.qty_allocated,
          new_allocated:      item.qty_allocated + delta,
        },
      },
    ])

    return NextResponse.json({ entitlement: updated })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Entitlements PATCH] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 4 — DELETE /api/gift/entitlements/[entitlementId] ════════════════
//
// Revokes an entitlement and releases its allocation back to unallocated inventory.
// Blocked if any quantity has already been collected.

export async function DELETE(
  req:     NextRequest,
  { params }: { params: Promise<{ entitlementId: string }> }
) {
  try {
    const { entitlementId }                                     = await params
    const { entitlement, accountId, accountName, role, capsuleId } = await resolveSessionAndEntitlement(req, entitlementId)
    const db = getDb()

    if ((entitlement.quantity_collected as number) > 0) {
      return NextResponse.json(
        {
          error:
            `Cannot revoke — ${entitlement.quantity_collected} unit(s) have already been ` +
            `collected. Use an override or reconciliation action instead.`,
        },
        { status: 422 }
      )
    }

    const item = entitlement.gift_manifest_items as {
      id: string; item_name: string; qty_in_stock: number; qty_allocated: number
    }

    // Delete entitlement
    const { error: deleteErr } = await db
      .from('gift_entitlements')
      .delete()
      .eq('id', entitlementId)

    if (deleteErr) {
      console.error('[GCS Entitlements DELETE] Error:', deleteErr.message)
      return NextResponse.json({ error: 'Failed to revoke entitlement' }, { status: 500 })
    }

    // Release allocation from manifest
    const releaseQty = entitlement.quantity_allocated as number
    await db
      .from('gift_manifest_items')
      .update({
        qty_allocated:    Math.max(0, item.qty_allocated - releaseQty),
        quantity_assigned: Math.max(0, item.qty_allocated - releaseQty),
        updated_at:       new Date().toISOString(),
      })
      .eq('id', item.id)

    // Ledger — fire and forget
    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)
    writeLedgerEvents([
      {
        capsule_id:       capsuleId,
        event_type:       'ENTITLEMENT_REVOKED',
        actor_type:       isCoordinator ? 'coordinator' : 'organiser',
        actor_id:         accountId,
        actor_name:       accountName,
        credential_id:    entitlement.credential_id,
        manifest_item_id: item.id,
        quantity:         entitlement.quantity_entitled,
        payload: { item_name: item.item_name },
      },
      {
        capsule_id:       capsuleId,
        event_type:       'INVENTORY_RELEASED',
        actor_type:       'system',
        actor_id:         'system',
        actor_name:       'System',
        manifest_item_id: item.id,
        quantity:         releaseQty,
        payload: {
          previous_allocated: item.qty_allocated,
          new_allocated:      Math.max(0, item.qty_allocated - releaseQty),
        },
      },
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Entitlements DELETE] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}