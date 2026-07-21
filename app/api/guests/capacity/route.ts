// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/guests/capacity/route.ts
// PURPOSE: Returns guest capacity usage for a capsule.
//          Counts only participant_category = 'guest' against allocation.
//          Allocation = base (from platform_config by tier) + purchased packs.
//          Alert thresholds read from platform_config.
// ARCHITECTURE: LC Guest Capacity System · RW02 Guest Management
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const rwDb = createClient(
  process.env.NEXT_PUBLIC_RW_ECOSYSTEM_URL!,
  process.env.RW_ECOSYSTEM_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Config reader ═══

async function getCapacityConfig() {
  try {
    const { data } = await rwDb
      .from('platform_config')
      .select('config_key, value')
      .in('config_key', [
        'lc.capacity.free_base',
        'lc.capacity.paid_base',
        'lc.capacity.pack_growth',
        'lc.capacity.pack_celebration',
        'lc.capacity.pack_grand',
        'lc.capacity.grace_pct',
        'lc.capacity.alert_pct_1',
        'lc.capacity.alert_pct_2',
        'lc.capacity.alert_pct_3',
      ])

    const cfg: Record<string, number> = {}
    for (const row of data ?? []) {
      cfg[row.config_key] = parseInt(row.value, 10)
    }

    return {
      freeBase:    cfg['lc.capacity.free_base']    ?? 150,
      paidBase:    cfg['lc.capacity.paid_base']    ?? 300,
      packGrowth:  cfg['lc.capacity.pack_growth']  ?? 250,
      packCelebr:  cfg['lc.capacity.pack_celebration'] ?? 750,
      packGrand:   cfg['lc.capacity.pack_grand']   ?? 2000,
      gracePct:    cfg['lc.capacity.grace_pct']    ?? 10,
      alertPct1:   cfg['lc.capacity.alert_pct_1']  ?? 70,
      alertPct2:   cfg['lc.capacity.alert_pct_2']  ?? 85,
      alertPct3:   cfg['lc.capacity.alert_pct_3']  ?? 95,
    }
  } catch {
    return {
      freeBase: 150, paidBase: 300,
      packGrowth: 250, packCelebr: 750, packGrand: 2000,
      gracePct: 10,
      alertPct1: 70, alertPct2: 85, alertPct3: 95,
    }
  }
}

// ═══ SECTION 3 — GET handler ═══

export async function GET(req: NextRequest) {
  try {
    const capsule_id = req.nextUrl.searchParams.get('capsule_id')
    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    // ── Fetch capsule tier and components ─────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('tier, components')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Fetch config ──────────────────────────────────────────────────────
    const cfg = await getCapacityConfig()

    // ── Calculate base allocation ─────────────────────────────────────────
    const isPaid   = capsule.tier && capsule.tier !== 'free'
    const base     = isPaid ? cfg.paidBase : cfg.freeBase
    const components: string[] = capsule.components ?? []

    // ── Calculate purchased pack additions ────────────────────────────────
    const packAdditions = components.reduce((total, key) => {
      if (key === 'capacity_pack_growth')      return total + cfg.packGrowth
      if (key === 'capacity_pack_celebration') return total + cfg.packCelebr
      if (key === 'capacity_pack_grand')       return total + cfg.packGrand
      return total
    }, 0)

    const allocation  = base + packAdditions
    const graceLimit  = Math.floor(allocation * (1 + cfg.gracePct / 100))

    // ── Count guests by participant_category ──────────────────────────────
    const { data: categoryCounts } = await db
      .from('guests')
      .select('participant_category')
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)

    let guestCount     = 0
    let eventTeamCount = 0
    let organiserCount = 0

    for (const row of categoryCounts ?? []) {
      if (row.participant_category === 'guest')       guestCount++
      else if (row.participant_category === 'event_team') eventTeamCount++
      else if (row.participant_category === 'organiser')  organiserCount++
      else guestCount++ // default: counts as guest
    }

    const pct = allocation > 0 ? Math.round((guestCount / allocation) * 100) : 0

    // ── Determine alert level ─────────────────────────────────────────────
    let alertLevel: 'none' | 'friendly' | 'recommend' | 'strong' | 'grace' = 'none'
    if (guestCount > allocation)         alertLevel = 'grace'
    else if (pct >= cfg.alertPct3)       alertLevel = 'strong'
    else if (pct >= cfg.alertPct2)       alertLevel = 'recommend'
    else if (pct >= cfg.alertPct1)       alertLevel = 'friendly'

    // ── Pack purchase recommendations ─────────────────────────────────────
    const needed      = Math.max(0, guestCount - allocation)
    const recommended = needed > cfg.packGrand
      ? 'capacity_pack_grand'
      : needed > cfg.packCelebr
      ? 'capacity_pack_grand'
      : needed > cfg.packGrowth
      ? 'capacity_pack_celebration'
      : 'capacity_pack_growth'

    return NextResponse.json({
      guest_count:     guestCount,
      event_team_count: eventTeamCount,
      organiser_count: organiserCount,
      allocation,
      base,
      pack_additions:  packAdditions,
      grace_limit:     graceLimit,
      pct,
      alert_level:     alertLevel,
      alert_pct_1:     cfg.alertPct1,
      alert_pct_2:     cfg.alertPct2,
      alert_pct_3:     cfg.alertPct3,
      recommended_pack: alertLevel !== 'none' ? recommended : null,
    })

  } catch (e: any) {
    console.error('[guests/capacity]', e)
    return NextResponse.json({ error: 'Failed to load capacity data' }, { status: 500 })
  }
}
