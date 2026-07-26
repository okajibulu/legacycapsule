// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/circles/route.ts
// PURPOSE: CRUD for event_circles — social groupings of guests managed by
//          a designated Circle Leader. Every mutation writes to event_action_log
//          so the organiser has a full audit trail of circle changes.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — Circles Layer
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { randomBytes }               from 'crypto'

// ═══ SECTION 1 — Supabase client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Audit log helper ═══

async function logAction(params: {
  capsule_id:  string
  actor_type:  string
  actor_name:  string
  actor_ref:   string
  action:      string
  target_type: string
  target_id?:  string
  target_name: string
  metadata?:   Record<string, any>
}) {
  try {
    await db.from('event_action_log').insert({
      capsule_id:  params.capsule_id,
      actor_type:  params.actor_type,
      actor_name:  params.actor_name,
      actor_ref:   params.actor_ref,
      action:      params.action,
      target_type: params.target_type,
      target_id:   params.target_id ?? null,
      target_name: params.target_name,
      metadata:    params.metadata ?? null,
    })
  } catch (e) {
    // Non-blocking — log failure should never break the main operation
    console.warn('[circles] Audit log write failed:', e)
  }
}

// ═══ SECTION 3 — GET: List circles for a capsule ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  try {
    // Fetch circles with aggregated guest counts
    const { data: circles, error } = await db
      .from('event_circles')
      .select('*')
      .eq('capsule_id', capsule_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error

    // For each circle, get RSVP breakdown counts
    const circleIds = (circles ?? []).map(c => c.id)
    let guestCounts: Record<string, {
      total: number
      confirmed: number
      declined: number
      pending: number
      no_response: number
    }> = {}

    if (circleIds.length > 0) {
      const { data: guests } = await db
        .from('guests')
        .select('circle_id, rsvp_status')
        .eq('capsule_id', capsule_id)
        .is('deleted_at', null)
        .in('circle_id', circleIds)

      for (const g of guests ?? []) {
        if (!g.circle_id) continue
        if (!guestCounts[g.circle_id]) {
          guestCounts[g.circle_id] = { total: 0, confirmed: 0, declined: 0, pending: 0, no_response: 0 }
        }
        guestCounts[g.circle_id].total++
        const s = g.rsvp_status as string
        if (s === 'confirmed')   guestCounts[g.circle_id].confirmed++
        if (s === 'declined')    guestCounts[g.circle_id].declined++
        if (s === 'pending')     guestCounts[g.circle_id].pending++
        if (s === 'no_response') guestCounts[g.circle_id].no_response++
      }
    }

    const enriched = (circles ?? []).map(c => ({
      ...c,
      counts: guestCounts[c.id] ?? { total: 0, confirmed: 0, declined: 0, pending: 0, no_response: 0 },
    }))

    return NextResponse.json({ circles: enriched })
  } catch (e: any) {
    console.error('[circles GET]', e)
    return NextResponse.json({ error: 'Failed to fetch circles.' }, { status: 500 })
  }
}

// ═══ SECTION 4 — POST: Create a circle ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id, name, description,
      leader_name, leader_email, leader_phone,
      sort_order,
      organiser_email,
    } = body

    if (!capsule_id || !name?.trim()) {
      return NextResponse.json(
        { error: 'capsule_id and name are required.' },
        { status: 400 }
      )
    }

    // Generate a unique portal token for this circle's leader
    const portal_token = randomBytes(24).toString('hex')

    const { data: circle, error } = await db
      .from('event_circles')
      .insert({
        capsule_id,
        name:          name.trim(),
        description:   description?.trim() ?? null,
        leader_name:   leader_name?.trim()  ?? null,
        leader_email:  leader_email?.trim()?.toLowerCase() ?? null,
        leader_phone:  leader_phone?.trim() ?? null,
        portal_token,
        is_active:     true,
        sort_order:    sort_order ?? 0,
      })
      .select('*')
      .single()

    if (error) throw error

    await logAction({
      capsule_id,
      actor_type:  'organiser',
      actor_name:  organiser_email ?? 'Organiser',
      actor_ref:   organiser_email ?? '',
      action:      'circle_created',
      target_type: 'circle',
      target_id:   circle.id,
      target_name: circle.name,
      metadata:    { leader_name, leader_email },
    })

    return NextResponse.json({ ok: true, circle }, { status: 201 })
  } catch (e: any) {
    console.error('[circles POST]', e)
    return NextResponse.json({ error: 'Failed to create circle.' }, { status: 500 })
  }
}

// ═══ SECTION 5 — PUT: Update a circle ═══

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, capsule_id, organiser_email, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    // Sanitise — only allow known fields through
    const allowed = [
      'name', 'description', 'leader_name',
      'leader_email', 'leader_phone', 'sort_order',
    ]
    const clean: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (updates[key] !== undefined) clean[key] = updates[key]
    }

    const { data: circle, error } = await db
      .from('event_circles')
      .update(clean)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    await logAction({
      capsule_id:  capsule_id ?? circle.capsule_id,
      actor_type:  'organiser',
      actor_name:  organiser_email ?? 'Organiser',
      actor_ref:   organiser_email ?? '',
      action:      'circle_updated',
      target_type: 'circle',
      target_id:   id,
      target_name: circle.name,
      metadata:    clean,
    })

    return NextResponse.json({ ok: true, circle })
  } catch (e: any) {
    console.error('[circles PUT]', e)
    return NextResponse.json({ error: 'Failed to update circle.' }, { status: 500 })
  }
}

// ═══ SECTION 6 — DELETE: Soft-delete (deactivate) a circle ═══

export async function DELETE(req: NextRequest) {
  try {
    const id             = req.nextUrl.searchParams.get('id')
    const capsule_id     = req.nextUrl.searchParams.get('capsule_id')
    const organiser_email = req.nextUrl.searchParams.get('organiser_email')

    if (!id) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    // Deactivate — preserve data and guest assignments
    const { data: circle, error } = await db
      .from('event_circles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('name, capsule_id')
      .single()

    if (error) throw error

    await logAction({
      capsule_id:  capsule_id ?? circle.capsule_id,
      actor_type:  'organiser',
      actor_name:  organiser_email ?? 'Organiser',
      actor_ref:   organiser_email ?? '',
      action:      'circle_deactivated',
      target_type: 'circle',
      target_id:   id,
      target_name: circle.name,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[circles DELETE]', e)
    return NextResponse.json({ error: 'Failed to deactivate circle.' }, { status: 500 })
  }
}
