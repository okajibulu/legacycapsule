// ─────────────────────────────────────────────────────────────────────────────
// LCAdmin — Pricing Zones API Route
// Updates multiplier and currency_symbol for a given zone.
// Country arrays are read-only via this route — engineering change only.
// All changes audit-logged.
// ─────────────────────────────────────────────────────────────────────────────
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { updatePricingZone } from '@/lib/admin/actions'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export async function POST(req: Request) {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!isAdminAuthenticated()) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // ── Parse and validate body ────────────────────────────────────────────────
  const { id, multiplier, currency_symbol, reason } = await req.json()

  if (!id || multiplier === undefined || !currency_symbol || !reason) {
    return jsonResponse(
      { error: 'id, multiplier, currency_symbol, and reason are all required' },
      400
    )
  }

  if (typeof multiplier !== 'number' || multiplier <= 0) {
    return jsonResponse(
      { error: 'multiplier must be a positive number' },
      400
    )
  }

  // ── Execute update + audit log ─────────────────────────────────────────────
  try {
    await updatePricingZone(id, multiplier, currency_symbol, reason)
    return jsonResponse({ ok: true })
  } catch (err) {
    console.error('Pricing zones API error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
}
