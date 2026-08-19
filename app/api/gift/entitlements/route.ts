// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/entitlements/route.ts
// PURPOSE:    Gift Collection System — entitlement list and creation
//             GET  /api/gift/entitlements?credential_id=&capsule_id=
//             POST /api/gift/entitlements — calls gcs_create_entitlement() RPC
// SPEC:       GCS-SPEC-001-AMD-002 + Founder Amendment 19 August 2026
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.24
// DATE:       19 August 2026
//
// TRANSACTION MODEL:
//   POST delegates to gcs_create_entitlement() PostgreSQL function.
//   Availability check + inventory allocation + entitlement INSERT +
//   critical ledger events all execute in one atomic DB transaction.
//   If any step fails, everything rolls back. No partial state possible.
//
// ACTOR TYPE:
//   Derived server-side from manage_session. Never accepted from client body.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth helper ═══════════════════════════════════════════════════

async function resolveSession(req: NextRequest, capsuleId: string) {
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


// ═══ SECTION 3 — RPC error parser ══════════════════════════════════════════════
//
// PostgreSQL function raises EXCEPTION with structured messages.
// Parse the exception message to return a user-facing error.

function parseRpcError(message: string): { userMessage: string; status: number } {
  if (message.includes('INSUFFICIENT_STOCK')) {
    const parts = message.split(':')
    const qty   = parts[1]?.trim()
    const item  = parts[2]?.trim()
    return {
      userMessage: item && qty
        ? `Only ${qty} unallocated unit${parseInt(qty) !== 1 ? 's' : ''} of "${item}" available. Cannot assign more than ${qty} to this guest.`
        : 'Insufficient stock available for this entitlement.',
      status: 422,
    }
  }
  if (message.includes('DUPLICATE_ENTITLEMENT')) {
    return { userMessage: 'An entitlement for this item already exists on this credential. Use the edit action to change the quantity.', status: 409 }
  }
  if (message.includes('ITEM_NOT_FOUND')) {
    return { userMessage: 'Gift item not found or is no longer active.', status: 404 }
  }
  if (message.includes('ENTITLEMENT_NOT_FOUND')) {
    return { userMessage: 'Entitlement not found.', status: 404 }
  }
  if (message.includes('BELOW_COLLECTED')) {
    const qty = message.split(':')[1]?.trim()
    return {
      userMessage: `Cannot reduce below ${qty ?? '?'} — that quantity has already been collected.`,
      status: 422,
    }
  }
  if (message.includes('ALREADY_COLLECTED')) {
    const qty = message.split(':')[1]?.trim()
    return {
      userMessage: `Cannot revoke — ${qty ?? 'some'} unit(s) have already been collected. Use an override or reconciliation action instead.`,
      status: 422,
    }
  }
  if (message.includes('INVALID_QUANTITY')) {
    return { userMessage: 'Quantity must be 1 or more.', status: 400 }
  }
  return { userMessage: 'Operation failed — please try again.', status: 500 }
}


// ═══ SECTION 4 — GET /api/gift/entitlements ════════════════════════════════════

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
          id, item_name, category,
          donor_name, donor_name_visible,
          qty_in_stock, qty_allocated, qty_collected, qty_exceptions
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


// ═══ SECTION 5 — POST /api/gift/entitlements ═══════════════════════════════════
//
// Delegates to gcs_create_entitlement() RPC — fully atomic.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    // Actor type derived server-side from session — never from client body
    const { accountId, accountName, role } = await resolveSession(req, capsuleId)
    const db = getDb()

    const credentialId   = (body.credential_id    ?? '').trim()
    const manifestItemId = (body.manifest_item_id ?? '').trim()
    const qtyEntitled    = parseInt(body.quantity_entitled ?? '1', 10)

    if (!credentialId)   return NextResponse.json({ error: 'credential_id required' },    { status: 400 })
    if (!manifestItemId) return NextResponse.json({ error: 'manifest_item_id required' }, { status: 400 })
    if (isNaN(qtyEntitled) || qtyEntitled < 1) {
      return NextResponse.json({ error: 'Quantity must be 1 or more' }, { status: 400 })
    }

    // Coordinator scope check (server-enforced — actor_type derived here)
    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)
    const actorType     = isCoordinator ? 'coordinator' : 'organiser'

    if (isCoordinator) {
      const { data: cred } = await db
        .from('gift_credentials')
        .select('coordinator_id')
        .eq('id', credentialId)
        .eq('capsule_id', capsuleId)
        .maybeSingle()

      if (!cred || cred.coordinator_id !== accountId) {
        return NextResponse.json(
          { error: 'You may only assign entitlements to guests within your own block.' },
          { status: 403 }
        )
      }
    }

    // Call atomic RPC — all or nothing
    const { data: result, error: rpcError } = await db.rpc('gcs_create_entitlement', {
      p_capsule_id:        capsuleId,
      p_credential_id:     credentialId,
      p_manifest_item_id:  manifestItemId,
      p_quantity_entitled: qtyEntitled,
      p_created_by:        accountId,
      p_actor_name:        accountName,
      p_actor_type:        actorType,
    })

    if (rpcError) {
      const { userMessage, status } = parseRpcError(rpcError.message)
      return NextResponse.json({ error: userMessage }, { status })
    }

    return NextResponse.json({ entitlement: result }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Entitlements POST] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}