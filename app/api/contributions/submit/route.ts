// FILE PATH: app/api/contributions/submit/route.ts
// PURPOSE: Submit a public tribute server-side and return its ID without exposing pending rows to anonymous SELECT.
// OWNER: LegacyCapsule Engineering
// STATUS: Proposed implementation
// VERSION: 1.1
// DEPENDS ON: public.contributions, public.capsules, public.capsule_phases, public.free_tier_limits
// DOCUMENT PURPOSE: Validate public tribute submissions and enforce capsule limits on the server.
// COMPONENT MAP: Update the API route entry for app/api/contributions/submit/route.ts after approval.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SECTION 1 — Server-side database client
// The service-role key must remain server-side and must never be exposed to the browser.
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const MAX_BODY_BYTES = 24 * 1024
const MAX_TEXT_LENGTH = 2000
const MAX_NAME_LENGTH = 160
const MAX_LOCATION_LENGTH = 120
const ALLOWED_STATUS = 'pending_review'
const EXCLUDED_LIMIT_STATUSES = '("declined","removed")'

const FREE_TIER_DEFAULTS = {
  tributes: 30,
  stories: 15,
  audio_tributes: 3,
  video_tributes: 3,
  voice_ceiling_free: 30,
}

async function getFreeTierLimits() {
  try {
    const { data, error } = await db.from('free_tier_limits').select('key, value')
    if (error || !data?.length) return FREE_TIER_DEFAULTS
    const limits = { ...FREE_TIER_DEFAULTS }
    for (const row of data) {
      if (row.key in limits) {
        ;(limits as Record<string, number>)[row.key] = Number(row.value)
      }
    }
    return limits
  } catch {
    return FREE_TIER_DEFAULTS
  }
}

// SECTION 2 — Request validation
export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Your submission is too large. Please reduce the attached media details and try again.' }, { status: 413 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 })
    }

    const {
      capsuleId, phaseId, contributorName, city, country, relationship,
      tributeText, email, thumbnailUrl, audioUrl, videoUrl, lat, lng,
      ipCountry, legacyBuilderConsent,
    } = body

    if (
      typeof capsuleId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(capsuleId) ||
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

    if (phaseId != null && (typeof phaseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(phaseId))) {
      return NextResponse.json({ error: 'Invalid event phase.' }, { status: 400 })
    }

    // SECTION 3 — Verify capsule and optional phase
    const { data: capsule, error: capsuleError } = await db
      .from('capsules')
      .select('id, community_id, deleted_at, lifecycle_state, components, submission_deadline, contribution_tier, voice_ceiling')
      .eq('id', capsuleId)
      .maybeSingle()

    if (capsuleError) {
      console.error('[contributions/submit] Capsule lookup failed:', capsuleError)
      return NextResponse.json({ error: 'We could not verify this capsule. Please try again.' }, { status: 500 })
    }
    if (!capsule || capsule.deleted_at || capsule.lifecycle_state === 'deleted') {
      return NextResponse.json({ error: 'This capsule is not available for submissions.' }, { status: 404 })
    }
    if (capsule.submission_deadline && new Date(capsule.submission_deadline).getTime() < Date.now()) {
      return NextResponse.json({ error: 'The contribution period for this capsule has ended.' }, { status: 403 })
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

    // SECTION 4 — Enforce contribution ceilings server-side
    // Count pending as well as approved submissions so direct API calls cannot bypass UI limits.
    const limits = await getFreeTierLimits()
    const components: string[] = capsule.components ?? []
    const tier = capsule.contribution_tier ?? 'free'
    const isFreeTier = tier === 'free'
    const voiceCeiling = tier === 'estate_v'
      ? null
      : (!isFreeTier && capsule.voice_ceiling
        ? capsule.voice_ceiling
        : limits.voice_ceiling_free)

    const countActive = async (column: 'story_topic_id' | 'audio_url' | 'video_url' | null, notNull = false) => {
      let query = db.from('contributions')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsuleId)
        .is('deleted_at', null)
        .not('status', 'in', EXCLUDED_LIMIT_STATUSES)
      if (column === 'story_topic_id') query = notNull ? query.not(column, 'is', null) : query.is(column, null)
      if (column === 'audio_url' || column === 'video_url') query = query.not(column, 'is', null)
      return query
    }

    const [voiceCountResult, tributeCountResult, storyCountResult] = await Promise.all([
      countActive(null),
      countActive('story_topic_id', false),
      countActive('story_topic_id', true),
    ])
    if (voiceCountResult.error || tributeCountResult.error || storyCountResult.error) {
      console.error('[contributions/submit] Limit count failed:', voiceCountResult.error || tributeCountResult.error || storyCountResult.error)
      return NextResponse.json({ error: 'We could not check this capsule’s contribution limit. Please try again.' }, { status: 500 })
    }

    if (voiceCeiling !== null && (voiceCountResult.count ?? 0) >= voiceCeiling) {
      return NextResponse.json({ error: 'This capsule has reached its current contribution limit.' }, { status: 409 })
    }
    if (isFreeTier && (tributeCountResult.count ?? 0) >= limits.tributes) {
      return NextResponse.json({ error: 'This capsule has reached its tribute limit.' }, { status: 409 })
    }
    if (isFreeTier && (storyCountResult.count ?? 0) >= limits.stories) {
      return NextResponse.json({ error: 'This capsule has reached its story limit.' }, { status: 409 })
    }

    const mediaChecks: Array<{ field: 'audio_url' | 'video_url'; limit: number; label: string }> = []
    if (typeof audioUrl === 'string' && audioUrl.trim() && !components.includes('audio_tributes')) {
      mediaChecks.push({ field: 'audio_url', limit: limits.audio_tributes, label: 'audio tribute' })
    }
    if (typeof videoUrl === 'string' && videoUrl.trim() && !components.includes('video_tributes')) {
      mediaChecks.push({ field: 'video_url', limit: limits.video_tributes, label: 'video tribute' })
    }
    for (const check of mediaChecks) {
      const { count, error } = await db.from('contributions')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsuleId)
        .is('deleted_at', null)
        .not('status', 'in', EXCLUDED_LIMIT_STATUSES)
        .not(check.field, 'is', null)
      if (error) {
        console.error('[contributions/submit] Media limit count failed:', error)
        return NextResponse.json({ error: 'We could not check this capsule’s media limit. Please try again.' }, { status: 500 })
      }
      if ((count ?? 0) >= check.limit) {
        return NextResponse.json({ error: `This capsule has reached its ${check.label} limit.` }, { status: 409 })
      }
    }

    // SECTION 5 — Insert a pending contribution
    // Privileged fields and moderation status are server-owned, never client-supplied.
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
        ip_country: typeof ipCountry === 'string' ? ipCountry.slice(0, MAX_LOCATION_LENGTH) : null,
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
