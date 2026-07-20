// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/publication/subscribe/route.ts
// PURPOSE: Register an email address to receive the capsule publication.
//          Inserts into publication_subscribers.
//          Deduplication: unique index on (capsule_id, LOWER(email)) returns 409.
//          Called by: PublicationSubscribePanel, D-Day page, tribute submission,
//                     Community Stories submission, organiser manual add.
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, name, email, source } = await req.json()

    if (!capsule_id || !email?.trim()) {
      return NextResponse.json(
        { error: 'capsule_id and email are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailClean = email.trim().toLowerCase()
    if (!emailClean.includes('@') || !emailClean.includes('.')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    const validSources = ['self', 'organiser', 'tribute', 'dday', 'stories']
    const resolvedSource = validSources.includes(source) ? source : 'self'

    const { error: insertError } = await db
      .from('publication_subscribers')
      .insert({
        capsule_id,
        name:   name?.trim() || 'Guest',
        email:  emailClean,
        source: resolvedSource,
      })

    if (insertError) {
      // Unique constraint violation = already subscribed
      if (insertError.code === '23505') {
        return NextResponse.json(
          { ok: true, already_subscribed: true },
          { status: 409 }
        )
      }
      throw insertError
    }

    return NextResponse.json({ ok: true, subscribed: true })

  } catch (e: any) {
    console.error('[publication/subscribe]', e)
    return NextResponse.json(
      { error: e.message ?? 'Subscription failed' },
      { status: 500 }
    )
  }
}

// ═══ SECTION 3 — GET handler ═══
// Returns subscriber list for a capsule — organiser use only (service role).

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  try {
    const { data, error } = await db
      .from('publication_subscribers')
      .select('id, name, email, source, subscribed_at, sent_at')
      .eq('capsule_id', capsule_id)
      .order('subscribed_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ subscribers: data ?? [], total: data?.length ?? 0 })

  } catch (e: any) {
    console.error('[publication/subscribe GET]', e)
    return NextResponse.json(
      { error: e.message ?? 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}
