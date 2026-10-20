// FILE PATH: app/api/contributions/submit/route.ts
// PURPOSE: Submit a public tribute through the server so the pending row's ID can
//          be returned without granting anonymous users SELECT access to pending rows.
// OWNER: LegacyCapsule Engineering
// STATUS: Proposed implementation
// VERSION: 1.0
// DEPENDS ON: public.contributions, public.capsules, public.capsule_phases
// DOCUMENT PURPOSE: Narrow server-side submission path for the public tribute composer.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SECTION 1 — Server-side database client
// The service-role key must remain server-side and must never be exposed to the browser.
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const MAX_TEXT_LENGTH = 2000
const MAX_NAME_LENGTH = 160
const MAX_LOCATION_LENGTH = 120
const ALLOWED_STATUS = 'pending_review'

// SECTION 2 — Request validation and submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      capsuleId, phaseId, contributorName, city, country, relationship,
      tributeText, email, thumbnailUrl, audioUrl, videoUrl, lat, lng,
      ipCountry, legacyBuilderConsent,
    } = body ?? {}

    if (
      typeof capsuleId !== 'string' ||
      typeof contributorName !== 'string' ||
      !contributorName.trim() ||
      typeof tributeText !== 'string' ||
      tributeText.trim().length < 20 ||
      tributeText.trim().length > MAX_TEXT_LENGTH ||
      (email != null && typeof email !== 'string') ||
      (typeof email === 'string' && email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    ) {
      return NextResponse.json({ error: 'Please check your name, email and tribute, then try again.' }, { status: 400 })
    }

    if (phaseId != null && typeof phaseId !== 'string') {
      return NextResponse.json({ error: 'Invalid event phase.' }, { status: 400 })
    }

    // SECTION 3 — Confirm capsule and optional phase belong together
    const { data: capsule, error: capsuleError } = await db
      .from('capsules')
      .select('id, community_id, deleted_at, lifecycle_state')
      .eq('id', capsuleId)
      .maybeSingle()

    if (capsuleError) {
      console.error('[contributions/submit] Capsule lookup failed:', capsuleError)
      return NextResponse.json({ error: 'We could not verify this capsule. Please try again.' }, { status: 500 })
    }
    if (!capsule || capsule.deleted_at || capsule.lifecycle_state === 'deleted') {
      return NextResponse.json({ error: 'This capsule is not available for submissions.' }, { status: 404 })
    }

    if (phaseId) {
      const { data: phase, error: phaseError } = await db
        .from('capsule_phases')
        .select('id')
        .eq('id', phaseId)
        .eq('capsule_id', capsuleId)
        .maybeSingle()
      if (phaseError) {
        console.error('[contributions/submit] Phase lookup failed:', phaseError)
        return NextResponse.json({ error: 'We could not verify this event phase. Please try again.' }, { status: 500 })
      }
      if (!phase) return NextResponse.json({ error: 'That event phase does not belong to this capsule.' }, { status: 400 })
    }

    // SECTION 4 — Insert a pending contribution
    // Never accept status, community_id, or other privileged fields from the client.
    const { data: contribution, error: insertError } = await db
      .from('contributions')
      .insert({
        capsule_id: capsule.id,
        community_id: capsule.community_id ?? null,
        phase_id: phaseId || null,
        contribution_type: 'tribute',
        contributor_name: contributorName.trim().slice(0, MAX_NAME_LENGTH),
        city: typeof city === 'string' ? city.trim().slice(0, MAX_LOCATION_LENGTH) || null : null,
        country: typeof country === 'string' ? country.trim().slice(0, MAX_LOCATION_LENGTH) || null : null,
        relationship: typeof relationship === 'string' ? relationship.trim().slice(0, 240) || null : null,
        tribute_text: tributeText.trim(),
        email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase().slice(0, 254) : null,
        thumbnail_url: typeof thumbnailUrl === 'string' ? thumbnailUrl.slice(0, 2048) : null,
        audio_url: typeof audioUrl === 'string' ? audioUrl.slice(0, 2048) : null,
        video_url: typeof videoUrl === 'string' ? videoUrl.slice(0, 2048) : null,
        lat: typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : null,
        lng: typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : null,
        ip_country: typeof ipCountry === 'string' ? ipCountry.slice(0, 120) : null,
        legacy_builder_consent: legacyBuilderConsent === true,
        status: ALLOWED_STATUS,
        story_topic_id: null,
        deleted_at: null,
      })
      .select('id')
      .single()

    if (insertError || !contribution) {
      console.error('[contributions/submit] Insert failed:', insertError)
      return NextResponse.json({ error: 'Your submission could not be saved. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, contributionId: contribution.id }, { status: 201 })
  } catch (error) {
    console.error('[contributions/submit] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
