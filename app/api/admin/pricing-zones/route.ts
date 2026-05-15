// ─────────────────────────────────────────────────────────────────────────────
// LCAdmin — Pricing Zones API Route
// Updates multiplier and currency_symbol for a given zone.
// Country arrays are read-only via this route — engineering change only.
// All changes audit-logged.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { updatePricingZone } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse and validate body ────────────────────────────────────────────────
  const { id, multiplier, currency_symbol, reason } = await req.json()

  if (!id || multiplier === undefined || !currency_symbol || !reason) {
    return NextResponse.json(
      { error: 'id, multiplier, currency_symbol, and reason are all required' },
      { status: 400 }
    )
  }

  if (typeof multiplier !== 'number' || multiplier <= 0) {
    return NextResponse.json(
      { error: 'multiplier must be a positive number' },
      { status: 400 }
    )
  }

  // ── Execute update + audit log ─────────────────────────────────────────────
  try {
    await updatePricingZone(id, multiplier, currency_symbol, reason)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Pricing zones API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
