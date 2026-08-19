// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/stand/verify/route.ts
// PURPOSE:    Gift Collection System — stand verification endpoint
//             POST /api/gift/stand/verify
//             Handles both verification paths:
//               path: 'qr'     — HMAC-signed time-windowed QR payload
//               path: 'manual' — code + name and/or phone dual-factor
//             Returns verified credential + entitlements on success.
//             Logs every attempt to gift_fulfilment_ledger (VERIFICATION_ATTEMPTED /
//             VERIFICATION_FAILED). Increments failed_count on session on failure.
//             Fires alert check after 3 unresolved failures on same code.
// SPEC:       GCS-SPEC-001-AMD-001 Part Two Sections 2.1–2.7 + AMD-002 Rule 42
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.22
// DATE:       19 August 2026
//
// RULES (AMD-001):
//   Rule 20: verifyCredential() is the single source of truth — never inline.
//   Rule 21: normalisePhone() on both stored and entered before comparison.
//   Rule 22: normaliseGuestName() on both stored and entered before comparison.
//   AMD-002 Rule 42: Never block physical collection waiting for digital confirmation.
//   Info asymmetry: failure response is always neutral — never reveals which factor failed.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse }                from 'next/server'
import { createClient }                              from '@supabase/supabase-js'
import {
  verifyCredential,
  verifyQrPayload,
  normaliseGuestName,
  normalisePhone,
}                                                    from '@/lib/gift/verificationUtils'
import { writeLedgerEvent, writeLedgerEvents }       from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Neutral failure response ══════════════════════════════════════
//
// AMD-001 Section 2.5: failure response is ALWAYS neutral.
// Staff and guest never learn which element was wrong.

const NEUTRAL_FAILURE = {
  verified: false,
  message:  'Details not recognised — please check and try again.',
}


// ═══ SECTION 3 — Load credential with entitlements ═════════════════════════════

async function loadCredential(db: ReturnType<typeof getDb>, credentialId: string, capsuleId: string) {
  const { data } = await db
    .from('gift_credentials')
    .select(`
      id,
      capsule_id,
      guest_name,
      guest_category,
      guest_phone,
      numeric_code,
      collection_status,
      is_active,
      is_blocked,
      block_reason,
      block_id,
      coordinator_id,
      is_group_code,
      group_size,
      gift_entitlements (
        id,
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
      )
    `)
    .eq('id', credentialId)
    .eq('capsule_id', capsuleId)
    .maybeSingle()

  return data
}


// ═══ SECTION 4 — Fetch capsule excluded words ════════════════════════════════════

async function getExcludedWords(db: ReturnType<typeof getDb>, capsuleId: string): Promise<string[]> {
  const { data } = await db
    .from('gift_excluded_words')
    .select('word')
    .eq('capsule_id', capsuleId)
  return (data ?? []).map((r: { word: string }) => r.word)
}


// ═══ SECTION 5 — Attempt counter for alert logic ═══════════════════════════════
//
// AMD-001 Section 2.7: alert fires after 3 unresolved failures on same code
// within 5 minutes. This counts recent VERIFICATION_FAILED events.

async function getRecentFailCount(
  db:           ReturnType<typeof getDb>,
  credentialId: string,
  windowMins:   number = 5
): Promise<number> {
  const since = new Date(Date.now() - windowMins * 60 * 1000).toISOString()
  const { count } = await db
    .from('gift_fulfilment_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('credential_id', credentialId)
    .eq('event_type', 'VERIFICATION_FAILED')
    .gte('created_at', since)

  return count ?? 0
}


// ═══ SECTION 6 — POST /api/gift/stand/verify ═══════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body            = await req.json()
    const capsuleId       = (body.capsule_id   ?? '').trim()
    const standSessionId  = (body.session_id   ?? '').trim()
    const verifyPath      = body.path as 'qr' | 'manual'

    if (!capsuleId)      return NextResponse.json({ error: 'capsule_id required' },  { status: 400 })
    if (!standSessionId) return NextResponse.json({ error: 'session_id required' },  { status: 400 })
    if (!verifyPath)     return NextResponse.json({ error: 'path required (qr|manual)' }, { status: 400 })

    const db = getDb()

    // ── Validate stand session is active ─────────────────────────────────────
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
        {
          verified: false,
          message:  'This stand is currently suspended. Please contact the event coordinator.',
        },
        { status: 403 }
      )
    }
    if (standSession.status === 'closed') {
      return NextResponse.json(
        { verified: false, message: 'This stand session has been closed.' },
        { status: 403 }
      )
    }

    // ── QR verification path ──────────────────────────────────────────────────
    if (verifyPath === 'qr') {
      const qrPayload = (body.qr_payload ?? '').trim()
      if (!qrPayload) return NextResponse.json({ error: 'qr_payload required' }, { status: 400 })

      const credentialId = verifyQrPayload(qrPayload)

      if (!credentialId) {
        // QR expired or invalid
        await db.from('gift_fulfilment_ledger').insert({
          capsule_id:       capsuleId,
          event_type:       'VERIFICATION_FAILED',
          actor_type:       'staff',
          actor_name:       standSession.staff_name,
          stand_session_id: standSessionId,
          payload: {
            path:         'qr',
            fail_reason:  'qr_expired_or_invalid',
            stand_name:   standSession.stand_name,
          },
        })
        await db
          .from('gift_stand_sessions')
          const { data: sess } = await db.from('gift_stand_sessions').select('failed_count').eq('id', standSessionId).maybeSingle()
await db.from('gift_stand_sessions').update({ failed_count: (sess?.failed_count ?? 0) + 1 }).eq('id', standSessionId)
          .eq('id', standSessionId)

        return NextResponse.json(
          { verified: false, message: 'QR code has expired. Ask the guest to refresh their credential page.' },
          { status: 401 }
        )
      }

      const credential = await loadCredential(db, credentialId, capsuleId)

      if (!credential) return NextResponse.json(NEUTRAL_FAILURE, { status: 401 })
      if (!credential.is_active || credential.is_blocked) {
        return NextResponse.json(
          {
            verified: false,
            message: credential.block_reason ?? 'This code is currently inactive — please see the event coordinator.',
          },
          { status: 403 }
        )
      }
      if (credential.collection_status === 'collected') {
        return NextResponse.json(
          { verified: false, message: 'This gift has already been collected.' },
          { status: 409 }
        )
      }

      // QR success — log and return
      writeLedgerEvent({
        capsule_id:       capsuleId,
        event_type:       'VERIFICATION_ATTEMPTED',
        actor_type:       'staff',
        actor_name:       standSession.staff_name,
        credential_id:    credential.id,
        stand_session_id: standSessionId,
        payload: { path: 'qr', result: 'success', stand_name: standSession.stand_name },
      })

      return NextResponse.json({
        verified:    true,
        path:        'qr',
        credential: {
          id:               credential.id,
          guest_name:       credential.guest_name,
          guest_category:   credential.guest_category,
          numeric_code:     credential.numeric_code,
          collection_status: credential.collection_status,
          is_group_code:    credential.is_group_code,
          group_size:       credential.group_size,
        },
        entitlements: (credential.gift_entitlements ?? []).map((e: Record<string, unknown>) => ({
          id:                 e.id,
          quantity_entitled:  e.quantity_entitled,
          quantity_collected: e.quantity_collected,
          item:               e.gift_manifest_items,
        })),
      })
    }

    // ── Manual verification path ──────────────────────────────────────────────
    if (verifyPath === 'manual') {
      const enteredCode  = (body.code  ?? '').trim()
      const enteredName  = (body.name  ?? '').trim() || undefined
      const enteredPhone = (body.phone ?? '').trim() || undefined

      if (!enteredCode) return NextResponse.json({ error: 'code required' }, { status: 400 })

      // Look up credential by code
      const { data: credByCode } = await db
        .from('gift_credentials')
        .select('id, guest_name, guest_phone, numeric_code, collection_status, is_active, is_blocked, block_reason, capsule_id')
        .eq('capsule_id', capsuleId)
        .eq('numeric_code', enteredCode)
        .is('deleted_at', null)
        .maybeSingle()

      // Code not found
      if (!credByCode) {
        await writeLedgerEvents([
          {
            capsule_id:       capsuleId,
            event_type:       'VERIFICATION_FAILED',
            actor_type:       'staff',
            actor_name:       standSession.staff_name,
            stand_session_id: standSessionId,
            payload: {
              path:          'manual',
              fail_reason:   'code_not_found',
              code_entered:  enteredCode,
              name_entered:  enteredName,
              phone_entered: enteredPhone,
              stand_name:    standSession.stand_name,
            },
          },
        ])

        // Increment failed_count
        const { data: sess } = await db.from('gift_stand_sessions').select('failed_count').eq('id', standSessionId).maybeSingle()
        await db.from('gift_stand_sessions').update({ failed_count: (sess?.failed_count ?? 0) + 1 }).eq('id', standSessionId)

        return NextResponse.json(NEUTRAL_FAILURE, { status: 401 })
      }

      // Blocked check
      if (!credByCode.is_active || credByCode.is_blocked) {
        return NextResponse.json(
          {
            verified: false,
            message: credByCode.block_reason ?? 'This code is currently inactive — please see the event coordinator.',
          },
          { status: 403 }
        )
      }

      // Already collected
      if (credByCode.collection_status === 'collected') {
        return NextResponse.json(
          { verified: false, message: 'This gift has already been collected.' },
          { status: 409 }
        )
      }

      // Fetch excluded words for name normalisation
      const excludedWords = await getExcludedWords(db, capsuleId)

      // Run dual-factor verification
      const verifyResult = verifyCredential({
        storedCode:           credByCode.numeric_code,
        storedName:           credByCode.guest_name ?? '',
        storedPhone:          credByCode.guest_phone ?? '',
        capsuleExcludedWords: excludedWords,
        enteredCode,
        enteredName,
        enteredPhone,
      })

      if (!verifyResult.valid) {
        // Log failure with full detail (Co-admin / FRFA visibility only — never shown to guest)
        const recentFails = await getRecentFailCount(db, credByCode.id)
        const alertThreshold = recentFails + 1 >= 3  // this failure will push to 3+

        await writeLedgerEvents([
          {
            capsule_id:       capsuleId,
            event_type:       'VERIFICATION_FAILED',
            actor_type:       'staff',
            actor_name:       standSession.staff_name,
            credential_id:    credByCode.id,
            stand_session_id: standSessionId,
            payload: {
              path:             'manual',
              fail_reason:      verifyResult.failReason,
              code_entered:     enteredCode,
              name_entered:     enteredName ?? null,
              name_normalised:  enteredName ? normaliseGuestName(enteredName, excludedWords).join(' ') : null,
              phone_entered:    enteredPhone ?? null,
              phone_normalised: enteredPhone ? normalisePhone(enteredPhone) : null,
              factors_used:     verifyResult.factorsUsed,
              attempt_number:   recentFails + 1,
              alert_threshold:  alertThreshold,
              stand_name:       standSession.stand_name,
            },
          },
        ])

        // Increment failed_count on session
        const { data: sess } = await db.from('gift_stand_sessions').select('failed_count').eq('id', standSessionId).maybeSingle()
        await db.from('gift_stand_sessions').update({ failed_count: (sess?.failed_count ?? 0) + 1 }).eq('id', standSessionId)

        // Return neutral failure — never reveal which factor failed
        return NextResponse.json(NEUTRAL_FAILURE, { status: 401 })
      }

      // ── Verification passed ───────────────────────────────────────────────
      const credential = await loadCredential(db, credByCode.id, capsuleId)

      writeLedgerEvent({
        capsule_id:       capsuleId,
        event_type:       'VERIFICATION_ATTEMPTED',
        actor_type:       'staff',
        actor_name:       standSession.staff_name,
        credential_id:    credByCode.id,
        stand_session_id: standSessionId,
        payload: {
          path:         'manual',
          result:       'success',
          factors_used: verifyResult.factorsUsed,
          stand_name:   standSession.stand_name,
        },
      })

      return NextResponse.json({
        verified:    true,
        path:        'manual',
        factors_used: verifyResult.factorsUsed,
        credential: {
          id:               credential!.id,
          guest_name:       credential!.guest_name,
          guest_category:   credential!.guest_category,
          numeric_code:     credential!.numeric_code,
          collection_status: credential!.collection_status,
          is_group_code:    credential!.is_group_code,
          group_size:       credential!.group_size,
        },
        entitlements: (credential?.gift_entitlements ?? []).map((e: Record<string, unknown>) => ({
          id:                 e.id,
          quantity_entitled:  e.quantity_entitled,
          quantity_collected: e.quantity_collected,
          item:               e.gift_manifest_items,
        })),
      })
    }

    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  } catch (err) {
    console.error('[GCS Stand Verify] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}