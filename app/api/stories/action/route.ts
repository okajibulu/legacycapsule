// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/stories/action/route.ts
// PURPOSE:   Handles all story moderation actions from the organiser dashboard:
//            approve, decline (delete), soft-delete, and edit text.
//            Stories are contributions with story_topic_id IS NOT NULL.
//            community_stories table does not exist — all operations on
//            the contributions table.
//            Logs every action to capsule_activity_log via logAction.
// ARCHITECTURE: CA-SPEC-001 — Step 14.
//               contributions table, story_topic_id IS NOT NULL filter.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.14
// DATE:      16 August 2026
//
// POST body: {
//   action: 'approve' | 'decline' | 'delete' | 'edit'
//   story_id: string
//   capsule_id: string
//   text?: string       (required for 'edit' action only)
//   actor_name?: string
//   actor_email?: string
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { action, story_id, capsule_id, text, actor_name, actor_email } = await req.json()

    // ── Validation ────────────────────────────────────────────────────────
    if (!action || !story_id || !capsule_id) {
      return NextResponse.json(
        { error: 'action, story_id and capsule_id are required.' },
        { status: 400 }
      )
    }

    if (!['approve', 'decline', 'delete', 'edit'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, decline, delete, or edit.' },
        { status: 400 }
      )
    }

    if (action === 'edit' && !text?.trim()) {
      return NextResponse.json(
        { error: 'text is required for edit action.' },
        { status: 400 }
      )
    }

    // ── Fetch story for log label ─────────────────────────────────────────
    // Verify it belongs to this capsule and is actually a story
    const { data: story } = await db
      .from('contributions')
      .select('id, contributor_name, status')
      .eq('id', story_id)
      .eq('capsule_id', capsule_id)
      .not('story_topic_id', 'is', null)
      .maybeSingle()

    if (!story) {
      return NextResponse.json({ error: 'Story not found.' }, { status: 404 })
    }

    // ── Execute action ────────────────────────────────────────────────────

    if (action === 'approve') {
      const { error } = await db
        .from('contributions')
        .update({ status: 'approved' })
        .eq('id', story_id)
      if (error) throw error

      await logAction({
        capsule_id,
        actor_type:   'organiser',
        actor_name:   actor_name  ?? 'Organiser',
        actor_email:  actor_email ?? '',
        action_key:   ACTION_KEYS.STORY_APPROVED,
        action_label: `Published a story from ${story.contributor_name}`,
        entity_type:  'story',
        entity_id:    story_id,
      })
    }

    else if (action === 'decline') {
      // Hard delete — story rejected entirely
      const { error } = await db
        .from('contributions')
        .delete()
        .eq('id', story_id)
      if (error) throw error

      await logAction({
        capsule_id,
        actor_type:   'organiser',
        actor_name:   actor_name  ?? 'Organiser',
        actor_email:  actor_email ?? '',
        action_key:   ACTION_KEYS.STORY_REJECTED,
        action_label: `Declined a story from ${story.contributor_name}`,
        entity_type:  'story',
        entity_id:    story_id,
      })
    }

    else if (action === 'delete') {
      // Soft delete — preserves record, removes from public display
      const { error } = await db
        .from('contributions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', story_id)
      if (error) throw error

      await logAction({
        capsule_id,
        actor_type:   'organiser',
        actor_name:   actor_name  ?? 'Organiser',
        actor_email:  actor_email ?? '',
        action_key:   ACTION_KEYS.STORY_DELETED,
        action_label: `Removed a story from ${story.contributor_name} from public view`,
        entity_type:  'story',
        entity_id:    story_id,
      })
    }

    else if (action === 'edit') {
      const { error } = await db
        .from('contributions')
        .update({ tribute_text: text!.trim() })
        .eq('id', story_id)
      if (error) throw error

      await logAction({
        capsule_id,
        actor_type:   'organiser',
        actor_name:   actor_name  ?? 'Organiser',
        actor_email:  actor_email ?? '',
        action_key:   ACTION_KEYS.STORY_EDITED,
        action_label: `Edited a story from ${story.contributor_name}`,
        entity_type:  'story',
        entity_id:    story_id,
      })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[stories/action]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}