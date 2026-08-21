// ============================================================
// FILE PATH: app/api/display/audio/[id]/route.ts
// PURPOSE:   DELETE a single audio track — removes from
//            storage bucket and marks deleted in DB.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.28
// DATE:      21 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'eds-audio-assets'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const slug = req.headers.get('x-capsule-slug') || req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db.from('capsules').select('id').eq('slug', slug).maybeSingle()
      if (!capsuleRow) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      capsuleId = capsuleRow.id
    }

    // Fetch track to get storage_path
    const { data: track } = await db
      .from('eds_display_audio')
      .select('id, storage_path')
      .eq('id', id)
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 })

    // Delete from storage
    const deleteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + track.storage_path
    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY },
    }).catch(() => {})

    // Mark deleted in DB
    await db.from('eds_display_audio').update({ status: 'deleted' }).eq('id', id)

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[EDS audio/delete] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}