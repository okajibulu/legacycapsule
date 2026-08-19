// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/credential/deliver/route.ts
// PURPOSE:    Gift Collection System — credential delivery via email (Resend)
//             POST /api/gift/credential/deliver
//             Sends credential email to guest. Enforces resend protection.
//             Batch send: array of credential_ids — skips already-sent silently.
// SPEC:       GCS-SPEC-001-AMD-001 Part Three Sections 3.3–3.5
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
//
// RULES (AMD-001):
//   Rule 31: gift_credential_delivery is append-only. Never update original send record.
//   Resend requires is_resend: true + optional resend_reason.
//   Already-sent guests skipped silently in batch mode.
//   Writes CODE_DELIVERED ledger event per send.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'
import { writeLedgerEvent }          from '@/lib/gift/ledger'
import { buildGiftCredentialEmail }  from '@/lib/gift/emailTemplates'


// ═══ SECTION 1 — Clients ═══════════════════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}


// ═══ SECTION 2 — Auth helper ════════════════════════════════════════════════════

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


// ═══ SECTION 3 — Send single credential ════════════════════════════════════════
//
// Returns: { sent: boolean, skipped: boolean, reason?: string }

async function sendCredential({
  db,
  resend,
  capsuleId,
  credentialId,
  isResend,
  resendReason,
  sentBy,
  sentByName,
  capsuleData,
}: {
  db:           ReturnType<typeof getDb>
  resend:       ReturnType<typeof getResend>
  capsuleId:    string
  credentialId: string
  isResend:     boolean
  resendReason: string | null
  sentBy:       string
  sentByName:   string
  capsuleData:  Record<string, unknown>
}): Promise<{ sent: boolean; skipped: boolean; error?: string }> {

  // Load credential with entitlements
  const { data: credential } = await db
    .from('gift_credentials')
    .select(`
      id, guest_name, guest_email, numeric_code, qr_payload,
      delivery_sent_at, is_active, is_blocked,
      gift_entitlements (
        quantity_entitled,
        gift_manifest_items (
          item_name,
          donor_name,
          donor_name_visible
        )
      )
    `)
    .eq('id', credentialId)
    .eq('capsule_id', capsuleId)
    .maybeSingle()

  if (!credential) return { sent: false, skipped: true, error: 'Credential not found' }
  if (!credential.guest_email) return { sent: false, skipped: true, error: 'No email address on file' }
  if (!credential.is_active || credential.is_blocked) {
    return { sent: false, skipped: true, error: 'Credential is blocked or inactive' }
  }

  // Skip if already sent and this is not a resend
  if (credential.delivery_sent_at && !isResend) {
    return { sent: false, skipped: true }
  }

  // Build credential page URL
  const credentialUrl = `${process.env.NEXT_PUBLIC_APP_URL}/gift/collect/${credential.qr_payload}`

  // Build email HTML
  const emailHtml = buildGiftCredentialEmail({
    guestName:      credential.guest_name,
    numericCode:    credential.numeric_code,
    credentialUrl,
    entitlements:   (credential.gift_entitlements ?? []) as {
      quantity_entitled: number
      gift_manifest_items: { item_name: string; donor_name: string | null; donor_name_visible: boolean }
    }[],
    eventName:      capsuleData.event_name as string,
    eventDate:      capsuleData.event_date as string | null,
    eventLocation:  capsuleData.event_location as string | null,
  })

  // Send via Resend
  try {
    await resend.emails.send({
      from:    'LegacyCapsule Gift Collection <gifts@itslegacycapsule.com>',
      to:      credential.guest_email,
      subject: `Your Gift Collection Details — ${capsuleData.event_name}`,
      html:    emailHtml,
    })
  } catch (emailErr) {
    console.error('[GCS Deliver] Resend error:', emailErr)
    return { sent: false, skipped: false, error: 'Email delivery failed' }
  }

  // Record delivery event (append-only — Rule 31)
  await db.from('gift_credential_delivery').insert({
    credential_id:   credentialId,
    capsule_id:      capsuleId,
    delivery_method: 'email',
    recipient_email: credential.guest_email,
    sent_by:         sentBy,
    is_resend:       isResend,
    resend_reason:   resendReason ?? null,
    resend_by:       isResend ? sentBy : null,
  })

  // Update delivery_sent_at on credential if first send
  if (!credential.delivery_sent_at) {
    await db
      .from('gift_credentials')
      .update({ delivery_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', credentialId)
  }

  // Ledger — fire and forget
  writeLedgerEvent({
    capsule_id:    capsuleId,
    event_type:    'CODE_DELIVERED',
    actor_type:    'coordinator',
    actor_id:      sentBy,
    actor_name:    sentByName,
    credential_id: credentialId,
    payload: {
      delivery_method: 'email',
      is_resend:       isResend,
      resend_reason:   resendReason,
    },
  })

  return { sent: true, skipped: false }
}


// ═══ SECTION 4 — POST /api/gift/credential/deliver ═════════════════════════════
//
// Body options:
//   Single:  { capsule_id, credential_id, is_resend?, resend_reason? }
//   Batch:   { capsule_id, credential_ids: string[], is_resend?: false }
//            Batch mode never resends — is_resend always false in batch.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, accountName } = await resolveSession(req, capsuleId)
    const db     = getDb()
    const resend = getResend()

    // Load capsule display info once
    const { data: capsule } = await db
      .from('capsules')
      .select('event_name, event_date, event_location')
      .eq('id', capsuleId)
      .maybeSingle()

    const capsuleData = capsule ?? { event_name: 'Your Event', event_date: null, event_location: null }

    // ── Batch mode ────────────────────────────────────────────────────────────
    if (Array.isArray(body.credential_ids)) {
      const ids: string[] = body.credential_ids
      let sentCount    = 0
      let skippedCount = 0
      const errors: string[] = []

      for (const credId of ids) {
        const result = await sendCredential({
          db, resend, capsuleId,
          credentialId: credId,
          isResend:     false,
          resendReason: null,
          sentBy:       accountId,
          sentByName:   accountName,
          capsuleData:  capsuleData as Record<string, unknown>,
        })

        if (result.sent)    sentCount++
        if (result.skipped) skippedCount++
        if (result.error && !result.skipped) errors.push(`${credId}: ${result.error}`)
      }

      return NextResponse.json({ sent: sentCount, skipped: skippedCount, errors })
    }

    // ── Single send ───────────────────────────────────────────────────────────
    const credentialId = body.credential_id as string | undefined
    if (!credentialId) return NextResponse.json({ error: 'credential_id required' }, { status: 400 })

    const isResend    = Boolean(body.is_resend)
    const resendReason = body.resend_reason ?? null

    const result = await sendCredential({
      db, resend, capsuleId,
      credentialId,
      isResend,
      resendReason,
      sentBy:     accountId,
      sentByName: accountName,
      capsuleData: capsuleData as Record<string, unknown>,
    })

    if (result.error && !result.skipped) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ sent: result.sent, skipped: result.skipped })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Deliver] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}