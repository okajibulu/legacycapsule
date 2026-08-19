// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/credential/generate/route.ts
// PURPOSE:    Gift Collection System — credential generation
//             POST /api/gift/credential/generate
//             Creates gift_credentials row with numeric code + HMAC QR payload.
//             Does NOT send delivery — delivery is a separate step.
// SPEC:       GCS-SPEC-001 Parts Three, Nine + AMD-001 Rules 26–27
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
//
// RULES:
//   • numeric_code unique per capsule — retry up to 10× if collision (rare).
//   • qr_payload = HMAC-signed with GCS_QR_SECRET. Not stored in plaintext.
//   • QR payload is NOT cached — resolves dynamically at scan time.
//   • guest_phone stored as normalised last-10-digits (normalisePhone()).
//   • guest_phone_raw stored as entered for display only — never compared.
//   • Coordinator may only generate within their assigned block range.
//   • Writes CODE_GENERATED ledger event on success.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse }          from 'next/server'
import { createClient }                        from '@supabase/supabase-js'
import { createHmac, randomBytes }             from 'crypto'
import { normalisePhone }                      from '@/lib/gift/verificationUtils'
import { writeLedgerEvent }                    from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — QR payload builder ════════════════════════════════════════════
//
// Builds the initial stored qr_payload for a new credential.
// At credential page load time, buildQrPayload() from verificationUtils.ts
// generates the live time-windowed payload — this stored value is the
// credential's canonical identifier, not the live QR string.
//
// Stored format: `credential_id:capsule_id:creation_nonce`
// This is used as the URL token for /gift/collect/[token].

function buildCredentialToken(credentialId: string, capsuleId: string): string {
  const nonce  = randomBytes(16).toString('hex')
  const secret = process.env.GCS_QR_SECRET ?? ''
  const message = `${credentialId}:${capsuleId}:${nonce}`
  const sig    = createHmac('sha256', secret).update(message).digest('hex')
  return `${credentialId}.${nonce}.${sig}`
}


// ═══ SECTION 3 — Numeric code generator ════════════════════════════════════════
//
// Generates a unique 3-digit code within the coordinator's block range.
// If no block assigned, generates from the full 001–999 range.
// Retries up to 10× on collision.

async function generateNumericCode(
  db:         ReturnType<typeof getDb>,
  capsuleId:  string,
  rangeStart: number,
  rangeEnd:   number
): Promise<string | null> {
  const span = rangeEnd - rangeStart + 1

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(rangeStart + Math.floor(Math.random() * span)).padStart(3, '0')

    // Check uniqueness across gift_credentials AND gift_pools
    const { data: existCred } = await db
      .from('gift_credentials')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('numeric_code', code)
      .maybeSingle()

    if (existCred) continue

    const { data: existPool } = await db
      .from('gift_pools')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('pool_code', code)
      .maybeSingle()

    if (existPool) continue

    return code
  }

  return null  // All 10 attempts collided — range may be exhausted
}


// ═══ SECTION 4 — Auth helper ════════════════════════════════════════════════════

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


// ═══ SECTION 5 — POST /api/gift/credential/generate ════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, accountName, role } = await resolveSession(req, capsuleId)
    const db = getDb()

    // ── Required fields ──────────────────────────────────────────────────────
    const guestName  = (body.guest_name  ?? '').trim()
    const guestEmail = (body.guest_email ?? '').trim() || null
    const guestPhone = (body.guest_phone ?? '').trim()
    const blockId    = body.block_id     ?? null
    const codeType   = (body.code_type   ?? 'personalised') as 'personalised' | 'group' | 'coordinator'

    if (!guestName) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 })
    }

    // ── Phone normalisation (AMD-001 Rule 23 — phone required) ───────────────
    const guestPhoneRaw        = guestPhone || null
    const guestPhoneNormalised = guestPhone ? normalisePhone(guestPhone) : ''

    // ── Coordinator block scope check ─────────────────────────────────────────
    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)

    let rangeStart = 1
    let rangeEnd   = 999
    let resolvedBlockId = blockId

    if (blockId) {
      const { data: block } = await db
        .from('gift_blocks')
        .select('id, range_start, range_end, coordinator_id, is_locked')
        .eq('id', blockId)
        .eq('capsule_id', capsuleId)
        .maybeSingle()

      if (!block) {
        return NextResponse.json({ error: 'Block not found' }, { status: 404 })
      }
      if (block.is_locked) {
        return NextResponse.json({ error: 'This block is locked — codes cannot be generated after event start.' }, { status: 422 })
      }
      if (isCoordinator && block.coordinator_id !== accountId) {
        return NextResponse.json({ error: 'You may only generate codes within your assigned block.' }, { status: 403 })
      }

      rangeStart = block.range_start
      rangeEnd   = block.range_end
    } else if (isCoordinator) {
      // Coordinator must always specify their block
      return NextResponse.json({ error: 'Coordinator must specify a block_id.' }, { status: 400 })
    }

    // ── Generate unique numeric code ─────────────────────────────────────────
    const numericCode = await generateNumericCode(db, capsuleId, rangeStart, rangeEnd)

    if (!numericCode) {
      return NextResponse.json(
        {
          error:
            'No available codes remain in this range. The block may be exhausted. ' +
            'Contact the event organiser to expand the range.',
        },
        { status: 422 }
      )
    }

    // ── Build credential token (URL token for /gift/collect/[token]) ─────────
    // We generate a placeholder ID first by inserting, then update qr_payload.
    // Supabase does not support RETURNING before insert resolves in all cases,
    // so we generate the credential ID client-side using crypto.
    const credentialId = randomBytes(16).toString('hex').replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/,
      '$1-$2-$3-$4-$5'
    )

    const token = buildCredentialToken(credentialId, capsuleId)

    // ── Insert credential ────────────────────────────────────────────────────
    const { data: credential, error: insertErr } = await db
      .from('gift_credentials')
      .insert({
        id:               credentialId,
        capsule_id:       capsuleId,
        block_id:         resolvedBlockId,
        coordinator_id:   isCoordinator ? accountId : (body.coordinator_id ?? null),
        code_type:        codeType,
        guest_name:       guestName,
        guest_email:      guestEmail,
        guest_phone:      guestPhoneNormalised,
        guest_phone_raw:  guestPhoneRaw,
        guest_category:   (body.guest_category ?? '').trim() || null,
        numeric_code:     numericCode,
        qr_payload:       token,
        is_group_code:    Boolean(body.is_group_code),
        group_size:       parseInt(body.group_size ?? '1', 10),
        party_size:       parseInt(body.party_size ?? '1', 10),
        collection_status: 'uncollected',
        delivery_method:  body.delivery_method ?? 'email',
        is_active:        true,
        is_blocked:       false,
        created_by:       accountId,
      })
      .select()
      .single()

    if (insertErr || !credential) {
      console.error('[GCS Credential Generate] Insert error:', insertErr?.message)
      return NextResponse.json({ error: 'Failed to generate credential' }, { status: 500 })
    }

    // ── Ledger — fire and forget ─────────────────────────────────────────────
    writeLedgerEvent({
      capsule_id:    capsuleId,
      event_type:    'CODE_GENERATED',
      actor_type:    isCoordinator ? 'coordinator' : 'organiser',
      actor_id:      accountId,
      actor_name:    accountName,
      credential_id: credential.id,
      block_id:      resolvedBlockId,
      payload: {
        guest_name:   guestName,
        numeric_code: numericCode,
        code_type:    codeType,
      },
    })

    return NextResponse.json({ credential }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Credential Generate] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}