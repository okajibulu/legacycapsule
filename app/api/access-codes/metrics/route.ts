// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/metrics/route.ts
// PURPOSE: Live event metrics — total arrivals, tier breakdown, arrival trend.
//          Auto-polled every 15 seconds from AccessMetricsDashboard component.
//          Step 8 of LC-ACCESS-001 build sequence.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Client
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — GET handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  try {
    // ── All codes (expected counts) ───────────────────────────────────────────
    const { data: codes } = await db
      .from('event_access_codes')
      .select('participant_type, use_count, max_uses, guest_name, special_note')
      .eq('capsule_id', capsule_id)
      .neq('status', 'revoked')

    // ── All admitted log entries ──────────────────────────────────────────────
    const { data: admitted } = await db
      .from('event_checkin_log')
      .select('participant_type, checked_in_at, guest_name')
      .eq('capsule_id', capsule_id)
      .eq('outcome', 'admitted')
      .order('checked_in_at', { ascending: false })

    // ── Invalid attempts count ────────────────────────────────────────────────
    const { count: invalidCount } = await db
      .from('event_checkin_log')
      .select('*', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('outcome', 'invalid')

    // ── Manual overrides count ────────────────────────────────────────────────
    const { count: manualCount } = await db
      .from('event_checkin_log')
      .select('*', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('outcome', 'manual_override')

    // ── Capacity from config ──────────────────────────────────────────────────
    const { data: config } = await db
      .from('event_access_config')
      .select('capacity')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    const allCodes = codes ?? []
    const allAdmit = admitted ?? []

    const byType        = (type: string) => allCodes.filter(c => c.participant_type === type)
    const arrivedByType = (type: string) => allAdmit.filter(a => a.participant_type === type)

    // ── Outstanding VVIPs (not yet arrived) ───────────────────────────────────
    const outstandingVvip = allCodes
      .filter(c => c.participant_type === 'vvip' && c.use_count === 0)
      .map(c => ({ name: c.guest_name, special_note: c.special_note ?? null }))

    // ── Arrival trend in 15-minute windows over last 3 hours ─────────────────
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const recentAdmit   = allAdmit.filter(a => a.checked_in_at > threeHoursAgo)
    const trendMap: Record<string, number> = {}

    recentAdmit.forEach(a => {
      const d    = new Date(a.checked_in_at)
      const mins = d.getMinutes()
      const win  = new Date(d)
      win.setMinutes(mins - (mins % 15), 0, 0)
      const key     = win.toISOString()
      trendMap[key] = (trendMap[key] ?? 0) + 1
    })

    const arrival_trend = Object.entries(trendMap)
      .map(([window_start, count]) => ({ window_start, count }))
      .sort((a, b) => a.window_start.localeCompare(b.window_start))

    const total_arrived  = allAdmit.length
    const total_expected = allCodes.filter(c => c.participant_type !== 'vendor').length
    const capacity       = config?.capacity ?? null

    return NextResponse.json({
      total_expected,
      total_arrived,
      arrival_percentage:  total_expected > 0 ? Math.round((total_arrived / total_expected) * 100) : 0,
      vvip_expected:       byType('vvip').length,
      vvip_arrived:        arrivedByType('vvip').length,
      vip_expected:        byType('vip').length,
      vip_arrived:         arrivedByType('vip').length,
      general_expected:    byType('general').length,
      general_arrived:     arrivedByType('general').length,
      vendor_expected:     byType('vendor').length,
      vendor_arrived:      arrivedByType('vendor').length,
      capacity,
      fill_percentage:     capacity ? Math.round((total_arrived / capacity) * 100) : null,
      outstanding_vvip:    outstandingVvip,
      arrival_trend,
      recent_arrivals:     allAdmit.slice(0, 10).map(a => ({
        name:       a.guest_name,
        tier:       a.participant_type,
        arrived_at: a.checked_in_at,
      })),
      invalid_attempts: invalidCount ?? 0,
      manual_overrides: manualCount ?? 0,
    })

  } catch (e) {
    console.error('[access-codes/metrics]', e)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
