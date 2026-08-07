// ============================================================
// FILE PATH: app/api/og/generate/route.ts
// PURPOSE:   Generates a static OG image for a capsule and
//            stores it in Supabase Storage (tribute-photos bucket).
//            Saves the public URL to capsules.og_image_url.
//            Called after hero upload and from manage dashboard.
//            Uses same ImageResponse logic as the dynamic route
//            but outputs PNG to storage instead of streaming.
// ARCHITECTURE: OG02
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.40
// DATE:      3 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

export const dynamic     = 'force-dynamic'
export const maxDuration = 30

// Required by Next.js 15 route validator for dynamic segments
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, slug } = await req.json()

    if (!capsule_id && !slug) {
      return NextResponse.json({ error: 'capsule_id or slug required' }, { status: 400 })
    }

    // ── Fetch capsule ──────────────────────────────────────────
    const query = db.from('capsules')
      .select('id, slug, honouree_name, honouree_title, event_type, event_tag, hero_image_url')

    const { data: capsule } = capsule_id
      ? await query.eq('id', capsule_id).maybeSingle()
      : await query.eq('slug', slug).maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Fetch OG image from dynamic route ─────────────────────
    // The dynamic route already generates the perfect image —
    // we fetch it and store the result as a static file
    const appUrl  = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
    const ogRoute = `${appUrl}/api/og/${capsule.slug}`

    const imageRes = await fetch(ogRoute, { cache: 'no-store' })

    if (!imageRes.ok) {
      return NextResponse.json({ error: 'OG image generation failed' }, { status: 500 })
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
    const contentType = imageRes.headers.get('content-type') ?? 'image/png'
    const ext         = contentType.includes('jpeg') ? 'jpg' : 'png'

    // ── Upload to storage ──────────────────────────────────────
    const storagePath = `og/${capsule.id}.${ext}`
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Use REST API directly (avoids SharedArrayBuffer issues)
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/tribute-photos/${storagePath}`,
      {
        method:  'POST',
        headers: {
          'Authorization':  `Bearer ${serviceKey}`,
          'Content-Type':   contentType,
          'x-upsert':       'true',
        },
        body: imageBuffer,
      }
    )

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('[og/generate] Storage upload failed:', err)
      return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
    }

    // ── Build public URL ───────────────────────────────────────
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/tribute-photos/${storagePath}`

    // ── Save to capsules.og_image_url ────────────────────────
    const { error: updateError } = await db
      .from('capsules')
      .update({ og_image_url: publicUrl })
      .eq('id', capsule.id)

    if (updateError) {
      console.error('[og/generate] DB update failed:', updateError)
      return NextResponse.json({ error: 'Failed to save OG image URL' }, { status: 500 })
    }

    return NextResponse.json({
      ok:          true,
      og_image_url: publicUrl,
      capsule_id:  capsule.id,
      slug:        capsule.slug,
    })

  } catch (e: any) {
    console.error('[og/generate]', e)
    return NextResponse.json({ error: e.message ?? 'Failed' }, { status: 500 })
  }
}