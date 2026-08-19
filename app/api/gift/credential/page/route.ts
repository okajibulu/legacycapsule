// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/credential/page/route.ts
// PURPOSE:    Gift Collection System — credential page data resolver
//             GET /api/gift/credential/page?token=
//             Resolves token → full credential + entitlements for /gift/collect/[token]
//             Also logs visit to gift_credential_visits (server-side, no cookies).
// SPEC:       GCS-SPEC-001-AMD-001 Rules 26, 32 + Part Three Section 3.2
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
//
// RULES (AMD-001):
//   Rule 26: Entitlements resolved dynamically at load time — never cached in token.
//   Rule 32: Visit tracking server-side only. No cookies, no localStorage.
//   The token in /gift/collect/[token] IS the qr_payload stored in gift_credentials.
//   Token lookup: exact match on gift_credentials.qr_payload.
//   No auth required — token authenticates the guest.
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


// ═══ SECTION 2 — GET /api/gift/credential/page ═════════════════════════════════
//
// Called on every load of /gift/collect/[token].
// Returns everything the guest page needs in one query.
// Logs visit as side effect (fire and forget).

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token            = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const db = getDb()

    // ── Resolve credential by token ──────────────────────────────────────────
    const { data: credential, error: credErr } = await db
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
        party_size,
        collection_status,
        collected_at,
        unable_to_collect,
        unable_reason,
        unable_reason_text,
        is_active,
        is_blocked,
        block_reason,
        delivery_sent_at,
        created_at
      `)
      .eq('qr_payload', token)
      .maybeSingle()

    if (credErr) {
      console.error('[GCS Credential Page] Lookup error:', credErr.message)
      return NextResponse.json({ error: 'Failed to load credential' }, { status: 500 })
    }

    if (!credential) {
      return NextResponse.json(
        { error: 'This link is not valid. Please check with your event coordinator.' },
        { status: 404 }
      )
    }

    // ── Fetch capsule display info ────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('event_name, honouree_name, event_date, event_location, slug')
      .eq('id', credential.capsule_id)
      .maybeSingle()

    // ── Fetch entitlements (live — AMD-001 Rule 26) ───────────────────────────
    const { data: entitlements } = await db
      .from('gift_entitlements')
      .select(`
        id,
        manifest_item_id,
        quantity_entitled,
        quantity_allocated,
        quantity_collected,
        gift_manifest_items (
          id,
          item_name,
          category,
          donor_name,
          donor_name_visible
        )
      `)
      .eq('credential_id', credential.id)
      .eq('capsule_id', credential.capsule_id)

  // ── Log visit — server-side, fire and forget (AMD-001 Rule 32) ────────────
  void (async () => {
    try {
      const { error: visitErr } = await db.from('gift_credential_visits').insert({
        credential_id: credential.id,
        capsule_id:    credential.capsule_id,
      })
      if (!visitErr) {
        writeLedgerEvent({
          capsule_id:    credential.capsule_id,
          event_type:    'CODE_VIEWED',
          actor_type:    'recipient',
          actor_id:      undefined,
          credential_id: credential.id,
          payload:       { visit_logged: true },
        })
      }
    } catch {
      // Visit logging failure never surfaces to guest
    }
  })()

    // ── Build response ────────────────────────────────────────────────────────
    return NextResponse.json({
      credential: {
        id:               credential.id,
        guest_name:       credential.guest_name,
        guest_category:   credential.guest_category,
        numeric_code:     credential.numeric_code,
        code_type:        credential.code_type,
        is_group_code:    credential.is_group_code,
        group_size:       credential.group_size,
        collection_status: credential.collection_status,
        collected_at:     credential.collected_at,
        unable_to_collect: credential.unable_to_collect,
        unable_reason:    credential.unable_reason,
        unable_reason_text: credential.unable_reason_text,
        is_active:        credential.is_active,
        is_blocked:       credential.is_blocked,
        block_reason:     credential.block_reason,
      },
      capsule: capsule ?? null,
      entitlements: (entitlements ?? []).map(e => ({
        id:                 e.id,
        quantity_entitled:  e.quantity_entitled,
        quantity_collected: e.quantity_collected,
        item:               e.gift_manifest_items,
      })),
    })
  } catch (err) {
    console.error('[GCS Credential Page] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}