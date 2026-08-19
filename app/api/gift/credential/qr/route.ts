// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/credential/qr/route.ts
// PURPOSE:    Gift Collection System — live QR payload refresh endpoint
//             GET /api/gift/credential/qr?credential_id=
//             Returns fresh time-windowed HMAC-signed QR payload.
//             Called by GiftCredentialDisplay every 5 minutes.
//             No auth — credential_id is non-guessable UUID.
// SPEC:       GCS-SPEC-001-AMD-001 Rule 27 — dynamic QR, never static
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { buildQrPayload }            from '@/lib/gift/verificationUtils'


function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 1 — GET /api/gift/credential/qr ═══════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const credentialId     = searchParams.get('credential_id')

    if (!credentialId) {
      return NextResponse.json({ error: 'credential_id required' }, { status: 400 })
    }

    const db = getDb()

    // Verify credential exists and is active
    const { data: credential } = await db
      .from('gift_credentials')
      .select('id, is_active, is_blocked')
      .eq('id', credentialId)
      .maybeSingle()

    if (!credential || !credential.is_active || credential.is_blocked) {
      return NextResponse.json({ error: 'Credential not available' }, { status: 404 })
    }

    // Build fresh time-windowed payload
    const qrPayload = buildQrPayload(credentialId)

    return NextResponse.json({ qr_payload: qrPayload })
  } catch (err) {
    console.error('[GCS QR Refresh] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}