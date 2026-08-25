// FILE: app/api/community-topics/submit/route.ts
// Purpose: Submit a community story — extends existing contribution flow
// Handles: story_topic_id assignment, new topic creation, photo upload
// AI10 · June 2026
// UPDATED: AI25 · Claude Sonnet 4.6 · 25 August 2026
//   — sendContributorThankYou wired in (CG-SPEC-001)

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendContributorThankYou } from '@/lib/email/sendContributorThankYou'

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
    // Accept both FormData (with photo) and JSON (text-only)
    let capsule_id: string
    let capsule_slug: string
    let contributor_name: string
    let email: string
    let relationship: string
    let city: string
    let country: string
    let tribute_text: string
    let story_topic_id: string | null
    let new_topic_name: string
    let photoFile: File | null = null

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const fd = await req.formData()
      capsule_id       = fd.get('capsule_id') as string
      capsule_slug     = fd.get('capsule_slug') as string
      contributor_name = (fd.get('contributor_name') as string)?.trim()
      email            = (fd.get('email') as string)?.trim() ?? ''
      relationship     = (fd.get('relationship') as string)?.trim() ?? ''
      city             = (fd.get('city') as string)?.trim() ?? ''
      country          = (fd.get('country') as string)?.trim() ?? ''
      tribute_text     = (fd.get('tribute_text') as string)?.trim()
      const story_topic_id_raw = fd.get('story_topic_id') as string | null
      story_topic_id   = (story_topic_id_raw && story_topic_id_raw !== 'null' && story_topic_id_raw.trim() !== '') ? story_topic_id_raw : null
      new_topic_name   = (fd.get('new_topic_name') as string)?.trim() ?? ''
      photoFile        = fd.get('photo') as File | null
    } else {
      const body       = await req.json()
      capsule_id       = body.capsule_id
      capsule_slug     = body.capsule_slug
      contributor_name = body.contributor_name?.trim()
      email            = body.email?.trim() ?? ''
      relationship     = body.relationship?.trim() ?? ''
      city             = body.city?.trim() ?? ''
      country          = body.country?.trim() ?? ''
      tribute_text     = body.tribute_text?.trim()
      const raw        = body.story_topic_id
      story_topic_id   = (raw && raw !== 'null' && String(raw).trim() !== '') ? raw : null
      new_topic_name   = body.new_topic_name?.trim() ?? ''
    }

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
      .select('id, components')
      .eq('id', capsule_id)
      .single()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
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

      // ── CG-SPEC-001: Thank-you email — encourage more contributions ──
      ;(async () => {
        try {
          const { data: cap } = await supabase
            .from('capsules')
            .select('honouree_name, slug')
            .eq('id', capsule_id)
            .maybeSingle()
          if (!cap) return
          await sendContributorThankYou({
            recipientEmail: email,
            recipientName:  contributor_name,
            honoureeName:   cap.honouree_name,
            capsuleSlug:    cap.slug,
            contentType:    'story',
          })
        } catch (err: unknown) {
          console.error('[community-topics/submit] Thank-you email error:', err)
        }
      })()
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