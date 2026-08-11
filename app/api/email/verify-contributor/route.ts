// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/email/verify-contributor/route.ts
// PURPOSE:   Sends a contributor verification email — used when a contributor
//            submits their voice and an email verification step is required
//            before the contribution enters the review queue.
// ARCHITECTURE: Thin route wrapper — all email logic in lib/verification.ts
//               → sendContributorVerification. ECS copy audit must be done
//               on lib/verification.ts (requires separate upload session).
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.91
// DATE:      11 August 2026
// POST body: { email, contributorName, contributionId, honoreeName, capsuleSlug, eventType? }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { sendContributorVerification } from '@/lib/verification'

// ═══ SECTION 1 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { email, contributorName, contributionId, honoreeName, capsuleSlug, eventType } =
      await req.json()

    if (!email || !contributorName || !contributionId || !honoreeName || !capsuleSlug) {
      return NextResponse.json(
        { error: 'email, contributorName, contributionId, honoreeName and capsuleSlug are required.' },
        { status: 400 }
      )
    }

    await sendContributorVerification({
      email,
      contributorName,
      contributionId,
      honoreeName,
      capsuleSlug,
      eventType: eventType ?? undefined, // optional — enables event-aware copy in verification email
    })

    return NextResponse.json({ ok: true })

  } catch (err: unknown) {
    console.error('[verify-contributor] Error:', err)
    return NextResponse.json(
      { error: 'Something went wrong sending the verification. Please try again.' },
      { status: 500 }
    )
  }
}