// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/moderation/route.ts
// PURPOSE:   Admin-gated endpoint returning all pending contributions
//            for review in the LCAdmin moderation panel.
//            Uses isAdminAuthenticated — not organiser auth.
// BUILT BY:  Pre-AI21 (legacy)
// UPDATED:   AI21 · Claude Opus 4.6 · 16 August 2026 — header added
// VERSION:   AI21v2.12.10
// ─────────────────────────────────────────────────────────────────────────────
// 
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getPendingContributions } from '@/lib/admin/actions'

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await getPendingContributions()
  return NextResponse.json({ items })
}
