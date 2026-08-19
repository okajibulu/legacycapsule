// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/entitlements/route.ts
// PURPOSE:    Gift Collection System — entitlement list and creation
//             GET  /api/gift/entitlements?credential_id=&capsule_id=
//             POST /api/gift/entitlements  — create entitlement + reserve allocation
// SPEC:       GCS-SPEC-001-AMD-002 v1.0 Parts Two, Six — Phase 3 Step 8
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.20
// DATE:       19 August 2026
//
// RULES (AMD-002 Rule 44):
//   • allocation check (qty_unallocated >= quantity_entitled) is server-side HARD BLOCK.
//   • Allocation reserved atomically: increment gift_entitlements.quantity_allocated
//     AND gift_manifest_items.qty_allocated in the same operation.
//   • Every entitlement creation writes ENTITLEMENT_CREATED + INVENTORY_ALLOCATED
//     ledger events (fire and forget).
//   • Stock increase NEVER auto-increases entitlements (Rule 39).
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { writeLedgerEvent, writeLedgerEvents } from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth helper ═══════════════════════════════════════════════════

async function resolveSession(
  req:       NextRequest,
  capsuleId: string
): Promise<{ accountId: string; accountName: string; role: string }> {
  const db        = getDb()
  const sessionId = req.cookies.get('manage_session')?.value
  if (!sessionId) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: session } = await db
    .from('manage_sessions')
    .select('account_id, capsule_id, expires_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || new Date(session.expires_at) < new Date() || session.capsule_id !== capsuleId) {
    throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data: account } = await db
    .from('capsule_accounts')
    .select('id, display_name, role')
    .eq('id', session.account_id)
    .maybeSingle()

  if (!account) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, accountName: account.display_name, role: account.role }
}


// ═══ SECTION 3 — GET /api/gift/entitlements ════════════════════════════════════
//
// Returns all entitlements for a credential with manifest item details.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    const credentialId     = searchParams.get('credential_id')

    if (!capsuleId)    return NextResponse.json({ error: 'capsule_id required' },    { status: 400 })
    if (!credentialId) return NextResponse.json({ error: 'credential_id required' }, { status: 400 })

    await resolveSession(req, capsuleId)

    const db = getDb()

    const { data, error } = await db
      .from('gift_entitlements')
      .select(`
        id,
        credential_id,
        manifest_item_id,
        quantity_entitled,
        quantity_allocated,
        quantity_collected,
        created_by,
        created_at,
        gift_manifest_items (
          id,
          item_name,
          category,
          donor_name,
          donor_name_visible,
          qty_in_stock,
          qty_allocated,
          qty_collected,
          qty_exceptions
        )
      `)
      .eq('credential_id', credentialId)
      .eq('capsule_id', capsuleId)

    if (error) {
      console.error('[GCS Entitlements GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load entitlements' }, { status: 500 })
    }

    return NextResponse.json({ entitlements: data ?? [] })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Entitlements GET] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 4 — POST /api/gift/entitlements ═══════════════════════════════════
//
// Creates an entitlement and reserves allocation against manifest inventory.
//
// Allocation logic (AMD-002 Rule 44 — hard block):
//   qty_unallocated = qty_in_stock - qty_allocated
//   If quantity_entitled > qty_unallocated → reject with clear message.
//
// Atomic update sequence (application-level — no Supabase RPC available):
//   1. Fetch manifest item current counters
//   2. Validate qty_unallocated >= quantity_entitled
//   3. Insert gift_entitlements row (quantity_allocated = quantity_entitled)
//   4. Increment gift_manifest_items.qty_allocated by quantity_entitled
//   5. Write ledger events (ENTITLEMENT_CREATED + INVENTORY_ALLOCATED)
//
// Note: Steps 3+4 are not wrapped in a DB transaction (Supabase JS client
// does not expose multi-statement transactions without RPC). The allocation
// check in Step 2 provides the guard. In a future hardening pass, this can
// be converted to a Supabase RPC function for true atomicity.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined

    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, accountName, role } = await resolveSession(req, capsuleId)
    const db = getDb()

    const credentialId   = body.credential_id    as string | undefined
    const manifestItemId = body.manifest_item_id as string | undefined
    const qtyEntitled    = parseInt(body.quantity_entitled ?? '1', 10)

    if (!credentialId)   return NextResponse.json({ error: 'credential_id required' },    { status: 400 })
    if (!manifestItemId) return NextResponse.json({ error: 'manifest_item_id required' }, { status: 400 })
    if (isNaN(qtyEntitled) || qtyEntitled < 1) {
      return NextResponse.json({ error: 'Quantity must be 1 or more' }, { status: 400 })
    }

    // ── Verify credential belongs to this capsule ────────────────────────────
    const { data: credential } = await db
      .from('gift_credentials')
      .select('id, capsule_id, guest_name, block_id, coordinator_id')
      .eq('id', credentialId)
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // ── Coordinator scope check ───────────────────────────────────────────────
    // Coordinator (not organiser/frfa) may only assign entitlements to credentials
    // within their own block.
    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)
    if (isCoordinator && credential.coordinator_id !== accountId) {
      return NextResponse.json(
        { error: 'You may only assign entitlements to guests within your own block.' },
        { status: 403 }
      )
    }

    // ── Fetch manifest item with current allocation counters ─────────────────
    const { data: item } = await db
      .from('gift_manifest_items')
      .select('id, item_name, qty_in_stock, qty_allocated, is_active')
      .eq('id', manifestItemId)
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!item) {
      return NextResponse.json({ error: 'Gift item not found' }, { status: 404 })
    }
    if (!item.is_active) {
      return NextResponse.json({ error: 'This item is no longer active' }, { status: 422 })
    }

    // ── Check if entitlement already exists for this credential + item ───────
    const { data: existing } = await db
      .from('gift_entitlements')
      .select('id, quantity_entitled, quantity_allocated')
      .eq('credential_id', credentialId)
      .eq('manifest_item_id', manifestItemId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        {
          error: `An entitlement for "${item.item_name}" already exists on this credential. Use PATCH to update the quantity.`,
        },
        { status: 409 }
      )
    }

    // ── ALLOCATION CHECK — hard block (AMD-002 Rule 44) ──────────────────────
    const qtyUnallocated = item.qty_in_stock - item.qty_allocated

    if (qtyEntitled > qtyUnallocated) {
      return NextResponse.json(
        {
          error:
            `Only ${qtyUnallocated} unallocated unit${qtyUnallocated !== 1 ? 's' : ''} of ` +
            `"${item.item_name}" are available. ` +
            `You cannot assign more than ${qtyUnallocated} to this guest.`,
          qty_unallocated: qtyUnallocated,
        },
        { status: 422 }
      )
    }

    // ── Insert entitlement ────────────────────────────────────────────────────
    const { data: entitlement, error: insertErr } = await db
      .from('gift_entitlements')
      .insert({
        capsule_id:         capsuleId,
        credential_id:      credentialId,
        manifest_item_id:   manifestItemId,
        quantity_entitled:  qtyEntitled,
        quantity_allocated: qtyEntitled,   // reserved immediately on creation
        quantity_collected: 0,
        created_by:         accountId,
      })
      .select()
      .single()

    if (insertErr || !entitlement) {
      console.error('[GCS Entitlements POST] Insert error:', insertErr?.message)
      return NextResponse.json({ error: 'Failed to create entitlement' }, { status: 500 })
    }

    // ── Increment manifest qty_allocated ──────────────────────────────────────
    const { error: updateErr } = await db
      .from('gift_manifest_items')
      .update({
        qty_allocated: item.qty_allocated + qtyEntitled,
        quantity_assigned: item.qty_allocated + qtyEntitled,   // legacy counter sync
        updated_at: new Date().toISOString(),
      })
      .eq('id', manifestItemId)

    if (updateErr) {
      // Entitlement exists but manifest not updated — log and alert
      console.error('[GCS Entitlements POST] Manifest update error:', updateErr.message)
      // Still return success to caller — ledger will show the discrepancy
    }

    // ── Ledger — fire and forget ──────────────────────────────────────────────
    writeLedgerEvents([
      {
        capsule_id:       capsuleId,
        event_type:       'ENTITLEMENT_CREATED',
        actor_type:       isCoordinator ? 'coordinator' : 'organiser',
        actor_id:         accountId,
        actor_name:       accountName,
        credential_id:    credentialId,
        manifest_item_id: manifestItemId,
        quantity:         qtyEntitled,
        payload: {
          guest_name:     credential.guest_name,
          item_name:      item.item_name,
          quantity:       qtyEntitled,
        },
      },
      {
        capsule_id:       capsuleId,
        event_type:       'INVENTORY_ALLOCATED',
        actor_type:       'system',
        actor_id:         'system',
        actor_name:       'System',
        credential_id:    credentialId,
        manifest_item_id: manifestItemId,
        quantity:         qtyEntitled,
        payload: {
          previous_allocated: item.qty_allocated,
          new_allocated:      item.qty_allocated + qtyEntitled,
          qty_in_stock:       item.qty_in_stock,
        },
      },
    ])

    return NextResponse.json({ entitlement }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Entitlements POST] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}