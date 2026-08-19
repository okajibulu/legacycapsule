// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/stand/verify/route.ts
// PURPOSE:    Gift Collection System — stand verification endpoint
//             POST /api/gift/stand/verify
//             QR path + manual dual-factor (any-2-of-3).
//             AMENDMENT: Allows re-entry when collection_status = 'partial'.
//             Returns only outstanding entitlements for partial re-collection.
// SPEC:       GCS-SPEC-001-AMD-001 + Founder Amendment 19 August 2026
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.24
// DATE:       19 August 2026
//
// PARTIAL RE-COLLECTION:
//   When collection_status = 'partial', verification passes.
//   Only entitlements where quantity_collected < quantity_entitled are returned.
//   Already-collected entitlements are returned with is_complete: true flag
//   so the scanner UI can show them as read-only "Collected" rows.
//
// ACTOR TYPE: Never accepted from client. Always derived from session.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse }          from 'next/server'
import { createClient }                        from '@supabase/supabase-js'
import {
  verifyCredential,
  verifyQrPayload,
  normaliseGuestName,
  normalisePhone,
}                                              from '@/lib/gift/verificationUtils'
import { writeAuditLedgerEvent }               from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Neutral failure response ══════════════════════════════════════

const NEUTRAL_FAILURE = {
  verified: false,
  message:  'Details not recognised — please check and try again.',
}


// ═══ SECTION 3 — Load credential with all entitlements ═════════════════════════

async function loadCredential(db: ReturnType<typeof getDb>, credentialId: string, capsuleId: string) {
  const { data } = await db
    .from('gift_credentials')
    .select(`
      id, capsule_id, guest_name, guest_category, guest_phone,
      numeric_code, collection_status, is_active, is_blocked, block_reason,
      block_id, coordinator_id, is_group_code, group_size,
      gift_entitlements (
        id, quantity_entitled, quantity_allocated, quantity_collected,
        gift_manifest_items (
          id, item_name, category, donor_name, donor_name_visible
        )
      )
    `)
    .eq('id', credentialId)
    .eq('capsule_id', capsuleId)
    .maybeSingle()

  return data
}


// ═══ SECTION 4 — Excluded words helper ═════════════════════════════════════════

async function getExcludedWords(db: ReturnType<typeof getDb>, capsuleId: string): Promise<string[]> {
  const { data } = await db
    .from('gift_excluded_words')
    .select('word')
    .eq('capsule_id', capsuleId)
  return (data ?? []).map((r: { word: string }) => r.word)
}


// ═══ SECTION 5 — Build entitlement response ═════════════════════════════════════
//
// For partial re-collection: marks each entitlement as outstanding or complete.
// Scanner UI shows complete items as read-only "Collected" rows.

function buildEntitlementResponse(entitlements: Record<string, unknown>[], isPartialReEntry: boolean) {
  return entitlements.map((e: Record<string, unknown>) => ({
    id:                  e.id,
    quantity_entitled:   e.quantity_entitled,
    quantity_collected:  e.quantity_collected,
    quantity_outstanding: (e.quantity_entitled as number) - (e.quantity_collected as number),
    is_complete:         (e.quantity_collected as number) >= (e.quantity_entitled as number),
    item:                e.gift_manifest_items,
  }))
}


// ═══ SECTION 6 — Fail counter increment ════════════════════════════════════════

async function incrementFailCount(db: ReturnType<typeof getDb>, standSessionId: string) {
  const { data: sess } = await db
    .from('gift_stand_sessions')
    .select('failed_count')
    .eq('id', standSessionId)
    .maybeSingle()
  await db
    .from('gift_stand_sessions')
    .update({ failed_count: (sess?.failed_count ?? 0) + 1 })
    .eq('id', standSessionId)
}


// ═══ SECTION 7 — POST /api/gift/stand/verify ═══════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body           = await req.json()
    const capsuleId      = (body.capsule_id  ?? '').trim()
    const standSessionId = (body.session_id  ?? '').trim()
    const verifyPath     = body.path as 'qr' | 'manual'

    if (!capsuleId)      return NextResponse.json({ error: 'capsule_id required' },       { status: 400 })
    if (!standSessionId) return NextResponse.json({ error: 'session_id required' },       { status: 400 })
    if (!verifyPath)     return NextResponse.json({ error: 'path required (qr|manual)' }, { status: 400 })

    const db = getDb()

    // Validate stand session
    const { data: standSession } = await db
      .from('gift_stand_sessions')
      .select('id, status, stand_name, staff_name, capsule_id')
      .eq('id', standSessionId)
      .maybeSingle()

    if (!standSession || standSession.capsule_id !== capsuleId) {
      return NextResponse.json({ error: 'Stand session not found' }, { status: 404 })
    }
    if (standSession.status === 'suspended') {
      return NextResponse.json(
        { verified: false, message: 'This stand is currently suspended. Please contact the event coordinator.' },
        { status: 403 }
      )
    }
    if (standSession.status === 'closed') {
      return NextResponse.json({ verified: false, message: 'This stand session has been closed.' }, { status: 403 })
    }

    // ── QR path ───────────────────────────────────────────────────────────────
    if (verifyPath === 'qr') {
      const qrPayload    = (body.qr_payload ?? '').trim()
      if (!qrPayload) return NextResponse.json({ error: 'qr_payload required' }, { status: 400 })

      const credentialId = verifyQrPayload(qrPayload)

      if (!credentialId) {
        await incrementFailCount(db, standSessionId)
        await writeAuditLedgerEvent({
          capsule_id:       capsuleId,
          event_type:       'VERIFICATION_FAILED',
          actor_type:       'staff',
          actor_name:       standSession.staff_name,
          stand_session_id: standSessionId,
          payload:          { path: 'qr', fail_reason: 'qr_expired_or_invalid', stand_name: standSession.stand_name },
        })
        return NextResponse.json(
          { verified: false, message: 'QR code has expired. Ask the guest to refresh their credential page.' },
          { status: 401 }
        )
      }

      const credential = await loadCredential(db, credentialId, capsuleId)
      if (!credential) return NextResponse.json(NEUTRAL_FAILURE, { status: 401 })

      if (!credential.is_active || credential.is_blocked) {
        return NextResponse.json(
          { verified: false, message: (credential.block_reason as string | null) ?? 'This code is currently inactive — please see the event coordinator.' },
          { status: 403 }
        )
      }

      // Already fully collected — not a partial re-entry
      if ((credential.collection_status as string) === 'collected') {
        return NextResponse.json(
          { verified: false, message: 'This gift has already been fully collected.' },
          { status: 409 }
        )
      }

      // AMENDMENT: partial status allowed through for re-collection
      const isPartialReEntry = (credential.collection_status as string) === 'partial'

      await writeAuditLedgerEvent({
        capsule_id:       capsuleId,
        event_type:       'VERIFICATION_ATTEMPTED',
        actor_type:       'staff',
        actor_name:       standSession.staff_name,
        credential_id:    credential.id as string,
        stand_session_id: standSessionId,
        payload:          { path: 'qr', result: 'success', is_partial_re_entry: isPartialReEntry, stand_name: standSession.stand_name },
      })

      return NextResponse.json({
        verified:          true,
        path:              'qr',
        is_partial_re_entry: isPartialReEntry,
        credential: {
          id:               credential.id,
          guest_name:       credential.guest_name,
          guest_category:   credential.guest_category,
          numeric_code:     credential.numeric_code,
          collection_status: credential.collection_status,
          is_group_code:    credential.is_group_code,
          group_size:       credential.group_size,
        },
        entitlements: buildEntitlementResponse(
          (credential.gift_entitlements ?? []) as Record<string, unknown>[],
          isPartialReEntry
        ),
      })
    }

    // ── Manual path ───────────────────────────────────────────────────────────
    if (verifyPath === 'manual') {
      const enteredCode  = (body.code  ?? '').trim()
      const enteredName  = (body.name  ?? '').trim() || undefined
      const enteredPhone = (body.phone ?? '').trim() || undefined

      if (!enteredCode) return NextResponse.json({ error: 'code required' }, { status: 400 })

      const { data: credByCode } = await db
        .from('gift_credentials')
        .select('id, guest_name, guest_phone, numeric_code, collection_status, is_active, is_blocked, block_reason, capsule_id')
        .eq('capsule_id', capsuleId)
        .eq('numeric_code', enteredCode)
        .is('deleted_at', null)
        .maybeSingle()

      if (!credByCode) {
        await incrementFailCount(db, standSessionId)
        await writeAuditLedgerEvent({
          capsule_id:       capsuleId,
          event_type:       'VERIFICATION_FAILED',
          actor_type:       'staff',
          actor_name:       standSession.staff_name,
          stand_session_id: standSessionId,
          payload:          { path: 'manual', fail_reason: 'code_not_found', code_entered: enteredCode, stand_name: standSession.stand_name },
        })
        return NextResponse.json(NEUTRAL_FAILURE, { status: 401 })
      }

      if (!credByCode.is_active || credByCode.is_blocked) {
        return NextResponse.json(
          { verified: false, message: (credByCode.block_reason as string | null) ?? 'This code is currently inactive — please see the event coordinator.' },
          { status: 403 }
        )
      }

      if ((credByCode.collection_status as string) === 'collected') {
        return NextResponse.json(
          { verified: false, message: 'This gift has already been fully collected.' },
          { status: 409 }
        )
      }

      const excludedWords = await getExcludedWords(db, capsuleId)

      const verifyResult = verifyCredential({
        storedCode:           credByCode.numeric_code as string,
        storedName:           (credByCode.guest_name as string) ?? '',
        storedPhone:          (credByCode.guest_phone as string) ?? '',
        capsuleExcludedWords: excludedWords,
        enteredCode,
        enteredName,
        enteredPhone,
      })

      if (!verifyResult.valid) {
        await incrementFailCount(db, standSessionId)

        // Count recent failures for alert threshold
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { count: recentFails } = await db
          .from('gift_fulfilment_ledger')
          .select('id', { count: 'exact', head: true })
          .eq('credential_id', credByCode.id)
          .eq('event_type', 'VERIFICATION_FAILED')
          .gte('created_at', since)

        await writeAuditLedgerEvent({
          capsule_id:       capsuleId,
          event_type:       'VERIFICATION_FAILED',
          actor_type:       'staff',
          actor_name:       standSession.staff_name,
          credential_id:    credByCode.id as string,
          stand_session_id: standSessionId,
          payload: {
            path:            'manual',
            fail_reason:     verifyResult.failReason,
            code_entered:    enteredCode,
            name_entered:    enteredName ?? null,
            phone_entered:   enteredPhone ?? null,
            factors_used:    verifyResult.factorsUsed,
            attempt_number:  (recentFails ?? 0) + 1,
            alert_threshold: ((recentFails ?? 0) + 1) >= 3,
            stand_name:      standSession.stand_name,
          },
        })

        return NextResponse.json(NEUTRAL_FAILURE, { status: 401 })
      }

      const credential       = await loadCredential(db, credByCode.id as string, capsuleId)
      const isPartialReEntry = (credByCode.collection_status as string) === 'partial'

      await writeAuditLedgerEvent({
        capsule_id:       capsuleId,
        event_type:       'VERIFICATION_ATTEMPTED',
        actor_type:       'staff',
        actor_name:       standSession.staff_name,
        credential_id:    credByCode.id as string,
        stand_session_id: standSessionId,
        payload:          { path: 'manual', result: 'success', factors_used: verifyResult.factorsUsed, is_partial_re_entry: isPartialReEntry, stand_name: standSession.stand_name },
      })

      return NextResponse.json({
        verified:           true,
        path:               'manual',
        factors_used:       verifyResult.factorsUsed,
        is_partial_re_entry: isPartialReEntry,
        credential: {
          id:               credential!.id,
          guest_name:       credential!.guest_name,
          guest_category:   credential!.guest_category,
          numeric_code:     credential!.numeric_code,
          collection_status: credential!.collection_status,
          is_group_code:    credential!.is_group_code,
          group_size:       credential!.group_size,
        },
        entitlements: buildEntitlementResponse(
          (credential?.gift_entitlements ?? []) as Record<string, unknown>[],
          isPartialReEntry
        ),
      })
    }

    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  } catch (err) {
    console.error('[GCS Stand Verify] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}