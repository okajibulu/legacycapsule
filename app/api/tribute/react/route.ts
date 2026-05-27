/* =========================================================
   app/api/tribute/react/route.ts
   Add or remove emoji reaction on a tribute
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
    const { contributionId, capsuleId, emoji } = await request.json()
    if (!contributionId || !capsuleId || !emoji) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Hash IP for deduplication — never store raw IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip + capsuleId).digest('hex').slice(0, 16)

    // Check if already reacted
    const { data: existing } = await supabase
      .from('tribute_reactions')
      .select('id')
      .eq('contribution_id', contributionId)
      .eq('emoji', emoji)
      .eq('ip_hash', ipHash)
      .single()

    if (existing) {
      // Toggle off — remove reaction
      await supabase.from('tribute_reactions').delete().eq('id', existing.id)
      return NextResponse.json({ action: 'removed' })
    }

    // Add reaction
    await supabase.from('tribute_reactions').insert({
      contribution_id: contributionId,
      capsule_id: capsuleId,
      emoji,
      ip_hash: ipHash,
    })

    return NextResponse.json({ action: 'added' })

  } catch (err) {
    console.error('Reaction error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
