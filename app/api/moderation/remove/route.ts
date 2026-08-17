// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/moderation/remove/route.ts
// PURPOSE:   Admin-gated endpoint to remove a contribution.
//            Called from LCAdmin moderation panel only.
//            Uses isAdminAuthenticated — not organiser auth.
// BUILT BY:  Pre-AI21 (legacy)
// UPDATED:   AI21 · Claude Opus 4.6 · 16 August 2026 — header added
// VERSION:   AI21v2.12.09
// ─────────────────────────────────────────────────────────────────────────────
// 
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { adminRemoveContribution } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, reason } = await req.json()
  await adminRemoveContribution(id, reason)
  return NextResponse.json({ ok: true })
}
