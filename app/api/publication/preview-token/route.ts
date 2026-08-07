// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/publication/preview-token/route.ts
// ROUTE: POST /api/publication/preview-token
// PURPOSE: Generates a short-lived render token for browser print preview.
//          Replaces Puppeteer PDF generation on Hobby plan.
//          Token expires after 10 minutes — single use for preview session.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { capsuleId } = await req.json()
    if (!capsuleId) return NextResponse.json({ error: 'capsuleId required' }, { status: 400 })

    // Verify publication exists for this capsule
    const { data: pub } = await adminClient
      .from('publications')
      .select('id, version')
      .eq('capsule_id', capsuleId)
      .single()

    if (!pub) return NextResponse.json({ error: 'Publication not found' }, { status: 404 })

    // Generate a fresh render token
    const token = crypto.randomBytes(32).toString('hex')

    const nextVersion = (pub.version ?? 1) + 1

    await adminClient
      .from('publications')
      .update({
        render_token: token,
        version:      nextVersion,
        generated_at: new Date().toISOString(),
      })
      .eq('capsule_id', capsuleId)

    return NextResponse.json({ token, version: nextVersion })

  } catch (err) {
    console.error('[preview-token] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}