// FILE: app/api/community-topics/route.ts
// Purpose: Community story topics — GET active topics / POST organiser topic
// Auth: GET = public, POST = organiser session
// AI10 · June 2026

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ── SECTION: Helpers ─────────────────────────────────────────

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── SECTION: GET — Fetch active topics with story counts ─────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const capsuleId = searchParams.get('capsule_id')
  const includePool = searchParams.get('include_pool') === 'true'

  if (!capsuleId) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  try {
    const statusFilter = includePool ? ['active', 'hidden'] : ['active']

    const { data: topics, error } = await supabase
      .from('community_story_topics')
      .select('id, topic_name, topic_source, status, display_order')
      .eq('capsule_id', capsuleId)
      .in('status', statusFilter)
      .order('display_order', { ascending: true })

    if (error) throw error

    // Count approved stories per topic
    const topicIds = (topics ?? []).map(t => t.id)
    const { data: counts } = await supabase
      .from('contributions')
      .select('story_topic_id')
      .in('story_topic_id', topicIds)
      .eq('status', 'approved')

    const countMap: Record<string, number> = {}
    ;(counts ?? []).forEach(c => {
      countMap[c.story_topic_id] = (countMap[c.story_topic_id] ?? 0) + 1
    })

    const enriched = (topics ?? []).map(t => ({
      ...t,
      story_count: countMap[t.id] ?? 0,
    }))

    return NextResponse.json({ topics: enriched })
  } catch (e: unknown) {
    console.error('[community-topics GET]', e)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}

// ── SECTION: POST — Create organiser topic ───────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, topic_name, capsule_slug, organiser_email } = body

    if (!capsule_id || !topic_name?.trim()) {
      return NextResponse.json({ error: 'capsule_id and topic_name required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Verify organiser access (capsule must exist and email must match)
    const { data: capsule } = await supabase
      .from('capsules')
      .select('id, organiser_email')
      .eq('id', capsule_id)
      .single()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    if (organiser_email && capsule.organiser_email !== organiser_email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const { data: topic, error } = await supabase
      .from('community_story_topics')
      .insert({
        capsule_id,
        topic_name: topic_name.trim(),
        topic_source: 'organiser',
        status: 'active',
        display_order: 0,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A topic with this name already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ topic })
  } catch (e: unknown) {
    console.error('[community-topics POST]', e)
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
