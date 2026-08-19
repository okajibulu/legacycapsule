// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/manifest/[itemId]/route.ts
// PURPOSE:    Gift Collection System — manifest item update and soft-delete
//             PATCH  /api/gift/manifest/[itemId]  — edit item fields or reorder
//             DELETE /api/gift/manifest/[itemId]  — soft-delete (sets deleted_at)
// SPEC:       GCS-SPEC-001 v1.1 + AMD-002 v1.0 Phase 2 Step 4
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// RULES:
//   • qty_in_stock increases write INVENTORY_ADDED ledger event.
//   • qty_in_stock decreases write INVENTORY_REMOVED ledger event.
//   • Inventory cannot decrease below qty_allocated (active reservations).
//   • Soft-delete is blocked if any active entitlements reference this item.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { writeLedgerEvent }          from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth + ownership helper ═══════════════════════════════════════

async function resolveSessionAndItem(
  req:    NextRequest,
  itemId: string
): Promise<{
  accountId:   string
  accountName: string
  role:        string
  item:        Record<string, unknown>
}> {
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

  // Load item + confirm it belongs to the session capsule
  const { data: item, error: itemErr } = await db
    .from('gift_manifest_items')
    .select('*')
    .eq('id', itemId)
    .eq('capsule_id', session.capsule_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (itemErr || !item) {
    throw NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Check GCS active
  const { data: capsule } = await db
    .from('capsules')
    .select('components')
    .eq('id', session.capsule_id)
    .maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  const { data: account } = await db
    .from('capsule_accounts')
    .select('id, display_name, role')
    .eq('id', session.account_id)
    .maybeSingle()

  if (!account) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  return {
    accountId:   account.id,
    accountName: account.display_name,
    role:        account.role,
    item,
  }
}


// ═══ SECTION 3 — PATCH /api/gift/manifest/[itemId] ════════════════════════════
//
// Updates one or more editable fields.
// qty_in_stock changes are inventory events — validated and ledgered.

export async function PATCH(
  req:     NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId }                         = await params
    const { accountId, accountName, item }   = await resolveSessionAndItem(req, itemId)
    const db                                 = getDb()
    const body                               = await req.json()

    const updates: Record<string, unknown> = {}
    let inventoryDelta = 0

    // ── Editable text fields ─────────────────────────────────────────────────
    if (body.item_name !== undefined) {
      const name = (body.item_name ?? '').trim()
      if (!name) return NextResponse.json({ error: 'Item name cannot be empty' }, { status: 400 })
      updates.item_name = name
    }
    if (body.category    !== undefined) updates.category    = body.category?.trim() || null
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.donor_name  !== undefined) updates.donor_name  = body.donor_name?.trim() || null
    if (body.donor_name_visible !== undefined) updates.donor_name_visible = Boolean(body.donor_name_visible)
    if (body.is_active   !== undefined) updates.is_active   = Boolean(body.is_active)
    if (body.sort_order  !== undefined) updates.sort_order  = parseInt(body.sort_order, 10)

    // ── qty_in_stock change (inventory event) ────────────────────────────────
    if (body.qty_in_stock !== undefined) {
      const newQty = parseInt(body.qty_in_stock, 10)
      if (isNaN(newQty) || newQty < 0) {
        return NextResponse.json(
          { error: 'Stock quantity must be zero or greater' },
          { status: 400 }
        )
      }

      const currentQty   = item.qty_in_stock  as number
      const qtyAllocated = item.qty_allocated as number

      // Cannot reduce below allocated — would orphan reservations
      if (newQty < qtyAllocated) {
        return NextResponse.json(
          {
            error: `Cannot reduce stock to ${newQty} — ${qtyAllocated} units are already allocated to guest entitlements. Reduce allocations first.`,
          },
          { status: 422 }
        )
      }

      inventoryDelta        = newQty - currentQty
      updates.qty_in_stock  = newQty
      updates.quantity_total = newQty  // keep legacy counter in sync
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    // ── Apply update ─────────────────────────────────────────────────────────
    const { data: updated, error: updateErr } = await db
      .from('gift_manifest_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (updateErr || !updated) {
      console.error('[GCS Manifest PATCH] Update error:', updateErr?.message)
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }

    // ── Ledger — inventory change events ────────────────────────────────────
    if (inventoryDelta !== 0) {
      writeLedgerEvent({
        capsule_id:       updated.capsule_id,
        event_type:       inventoryDelta > 0 ? 'INVENTORY_ADDED' : 'INVENTORY_REMOVED',
        actor_type:       'organiser',
        actor_id:         accountId,
        actor_name:       accountName,
        manifest_item_id: updated.id,
        quantity:         Math.abs(inventoryDelta),
        payload: {
          item_name:     updated.item_name,
          previous_qty:  item.qty_in_stock,
          new_qty:       updated.qty_in_stock,
          delta:         inventoryDelta,
        },
      })
    }

    return NextResponse.json({
      item: {
        ...updated,
        qty_unallocated: updated.qty_in_stock  - updated.qty_allocated,
        qty_outstanding:  updated.qty_allocated - updated.qty_collected,
      },
    })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Manifest PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 4 — DELETE /api/gift/manifest/[itemId] ═══════════════════════════
//
// Soft-deletes a manifest item (sets deleted_at).
// Blocked if the item has active entitlements (quantity_allocated > 0).
// Writes INVENTORY_REMOVED ledger event for the remaining stock quantity.

export async function DELETE(
  req:     NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId }                       = await params
    const { accountId, accountName, item } = await resolveSessionAndItem(req, itemId)
    const db                               = getDb()

    // Block delete if inventory is allocated against live entitlements
    if ((item.qty_allocated as number) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete — ${item.qty_allocated} units are allocated to guest entitlements. Remove all entitlements for this item before deleting.`,
        },
        { status: 422 }
      )
    }

    const { error: deleteErr } = await db
      .from('gift_manifest_items')
      .update({
        deleted_at: new Date().toISOString(),
        is_active:  false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)

    if (deleteErr) {
      console.error('[GCS Manifest DELETE] Error:', deleteErr.message)
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
    }

    // Ledger — fire and forget
    writeLedgerEvent({
      capsule_id:       item.capsule_id as string,
      event_type:       'INVENTORY_REMOVED',
      actor_type:       'organiser',
      actor_id:         accountId,
      actor_name:       accountName,
      manifest_item_id: itemId,
      quantity:         item.qty_in_stock as number,
      payload: {
        item_name: item.item_name,
        action:    'item_deleted',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Manifest DELETE] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}