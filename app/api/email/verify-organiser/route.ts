// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/email/verify-organiser/route.ts
// PURPOSE:   Sends an organiser verification email — used during capsule setup
//            to verify the organiser's email address before granting manage
//            dashboard access.
// ARCHITECTURE: Thin route wrapper — all email logic in lib/verification.ts
//               → sendOrganiserVerification. ECS copy audit must be done
//               on lib/verification.ts (requires separate upload session).
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.91
// DATE:      11 August 2026
// POST body: { email, capsuleId, capsuleSlug, honoreeName }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { sendOrganiserVerification } from '@/lib/verification'

// ═══ SECTION 1 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { email, capsuleId, capsuleSlug, honoreeName } = await req.json()

    if (!email || !capsuleId || !capsuleSlug || !honoreeName) {
      return NextResponse.json(
        { error: 'email, capsuleId, capsuleSlug and honoreeName are required.' },
        { status: 400 }
      )
    }

    await sendOrganiserVerification({
      email,
      capsuleId,
      capsuleSlug,
      honoreeName,
    })

    return NextResponse.json({ ok: true })

  } catch (err: unknown) {
    console.error('[verify-organiser] Error:', err)
    return NextResponse.json(
      { error: 'Something went wrong sending the verification. Please try again.' },
      { status: 500 }
    )
  }
}