// FILE: app/api/community-topics/submit/route.ts
// Purpose: Submit a community story — extends existing contribution flow
// Handles: story_topic_id assignment, new topic creation, photo upload
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

// ── SECTION: POST — Submit story ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()

    const capsule_id = fd.get('capsule_id') as string
    const capsule_slug = fd.get('capsule_slug') as string
    const contributor_name = (fd.get('contributor_name') as string)?.trim()
    const email = (fd.get('email') as string)?.trim() ?? ''
    const relationship = (fd.get('relationship') as string)?.trim() ?? ''
    const city = (fd.get('city') as string)?.trim() ?? ''
    const country = (fd.get('country') as string)?.trim() ?? ''
    const tribute_text = (fd.get('tribute_text') as string)?.trim()
    const story_topic_id = (fd.get('story_topic_id') as string) ?? null
    const new_topic_name = (fd.get('new_topic_name') as string)?.trim() ?? ''
    const photoFile = fd.get('photo') as File | null

    // ── SECTION: Validation ──────────────────────────────────

    if (!capsule_id || !contributor_name || !tribute_text) {
      return NextResponse.json({ error: 'Name and story are required' }, { status: 400 })
    }

    if (!story_topic_id && !new_topic_name) {
      return NextResponse.json({ error: 'Topic selection is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // ── SECTION: Verify capsule is active ────────────────────

    const { data: capsule } = await supabase
      .from('capsules')
      .select('id, page_state, components')
      .eq('id', capsule_id)
      .single()

    if (!capsule || capsule.page_state !== 'active') {
      return NextResponse.json({ error: 'Capsule not found or inactive' }, { status: 404 })
    }

    const components: string[] = capsule.components ?? []
    if (!components.includes('community_stories')) {
      return NextResponse.json({ error: 'Community Stories not active on this capsule' }, { status: 403 })
    }

    // ── SECTION: Resolve topic ID ─────────────────────────────

    let resolvedTopicId = story_topic_id

    if (!resolvedTopicId && new_topic_name) {
      // Create the topic (community-proposed = pending, organiser/system = active)
      const { data: newTopic, error: topicError } = await supabase
        .from('community_story_topics')
        .insert({
          capsule_id,
          topic_name: new_topic_name,
          topic_source: 'community',
          status: 'pending', // requires organiser approval
        })
        .select('id')
        .single()

      if (topicError && topicError.code !== '23505') throw topicError

      // If duplicate, fetch the existing one
      if (topicError?.code === '23505') {
        const { data: existing } = await supabase
          .from('community_story_topics')
          .select('id')
          .eq('capsule_id', capsule_id)
          .eq('topic_name', new_topic_name)
          .single()
        resolvedTopicId = existing?.id ?? null
      } else {
        resolvedTopicId = newTopic?.id ?? null
      }
    }

    // ── SECTION: Handle photo upload ──────────────────────────

    let thumbnail_url: string | null = null

    if (photoFile && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer())
      const ext = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `stories/${capsule_id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('tribute-photos')
        .upload(path, buffer, { contentType: photoFile.type, upsert: false })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('tribute-photos')
          .getPublicUrl(path)
        thumbnail_url = urlData.publicUrl
      }
    }

    // ── SECTION: Geocode city/country ─────────────────────────

    let lat: number | null = null
    let lng: number | null = null

    if (city || country) {
      try {
        const geoRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, country }),
        })
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          lat = geoData.lat ?? null
          lng = geoData.lng ?? null
        }
      } catch {
        // Geocoding is non-critical — proceed without coords
      }
    }

    // ── SECTION: Insert contribution ──────────────────────────

    const { data: contribution, error: contribError } = await supabase
      .from('contributions')
      .insert({
        capsule_id,
        contributor_name,
        email: email || null,
        relationship: relationship || null,
        city: city || null,
        country: country || null,
        tribute_text,
        lat,
        lng,
        thumbnail_url,
        story_topic_id: resolvedTopicId,
        status: 'pending_review',
      })
      .select('id')
      .single()

    if (contribError) throw contribError

    // ── SECTION: Send submission confirmation email ───────────

    if (email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/submission-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributor_name,
            email,
            capsule_slug,
            contribution_type: 'story',
          }),
        })
      } catch {
        // Email failure is non-critical
      }
    }

    return NextResponse.json({
      success: true,
      contribution_id: contribution.id,
      topic_id: resolvedTopicId,
    })
  } catch (e: unknown) {
    console.error('[community-topics/submit POST]', e)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
}