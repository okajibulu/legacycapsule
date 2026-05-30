/* =========================================================
   app/api/gallery/comment/route.ts
   → POST: add comment to gallery photo
   → GET:  fetch comments for a photo
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const photoId = request.nextUrl.searchParams.get('photoId')
  if (!photoId) return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })

  const { data, error } = await supabase
    .from('gallery_photo_comments')
    .select('id, commenter_name, comment_text, created_at')
    .eq('photo_id', photoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(request: NextRequest) {
  try {
    const { photoId, capsuleId, commenterName, commentText } = await request.json()

    if (!photoId || !capsuleId || !commenterName?.trim() || !commentText?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('gallery_photo_comments')
      .insert({
        photo_id: photoId,
        capsule_id: capsuleId,
        commenter_name: commenterName.trim(),
        comment_text: commentText.trim(),
      })
      .select('id, commenter_name, comment_text, created_at')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    return NextResponse.json({ comment: data })

  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
