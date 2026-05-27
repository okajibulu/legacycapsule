/* =========================================================
   app/api/section/react/route.ts
   Emoji reactions on profile sections
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { sectionId, capsuleId, emoji } = await request.json()
    if (!sectionId || !capsuleId || !emoji) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip + capsuleId).digest('hex').slice(0, 16)

    const { data: existing } = await supabase
      .from('section_reactions')
      .select('id')
      .eq('section_id', sectionId)
      .eq('emoji', emoji)
      .eq('ip_hash', ipHash)
      .single()

    if (existing) {
      await supabase.from('section_reactions').delete().eq('id', existing.id)
      return NextResponse.json({ action: 'removed' })
    }

    await supabase.from('section_reactions').insert({
      section_id: sectionId, capsule_id: capsuleId, emoji, ip_hash: ipHash,
    })
    return NextResponse.json({ action: 'added' })

  } catch (err) {
    console.error('Section reaction error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
