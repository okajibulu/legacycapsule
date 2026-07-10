// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/community-topics/[topicId]/approve/route.ts
// PURPOSE: Approve a community-proposed story topic
// Auth: Organiser email verified against capsule
// Built by: AI10 · Claude Sonnet 4.6 · June 2026
// Updated: Claude Sonnet 4.6 · July 2026 — split from sprint file, imports added
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params

  try {
    const { organiser_email } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: topic } = await supabase
      .from('community_story_topics')
      .select('id, capsule_id, status')
      .eq('id', topicId)
      .single()

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const { data: capsule } = await supabase
      .from('capsules')
      .select('organiser_email')
      .eq('id', topic.capsule_id)
      .single()

    if (!capsule || capsule.organiser_email !== organiser_email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const { error } = await supabase
      .from('community_story_topics')
      .update({ status: 'active', approved_at: new Date().toISOString() })
      .eq('id', topicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[topic approve]', e)
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 })
  }
}
