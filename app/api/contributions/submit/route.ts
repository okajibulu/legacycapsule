// FILE PATH: app/api/contributions/submit/route.ts
// DOCUMENT OWNER: LegacyCapsule Contribution Submission
// STATUS: Proposed implementation — awaiting pull-request review
// VERSION: v1.0
// PURPOSE: Validate and persist public tribute submissions server-side so
//          pending rows can be confirmed without exposing them via public SELECT.
// SECURITY: Service-role credential is server-only; public reads remain approved-only.

// SECTION 1 — IMPORTS AND SERVER CLIENT
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

// SECTION 2 — REQUEST VALIDATION AND CAPSULE ELIGIBILITY
export async function POST(request: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[contributions/submit] Missing server Supabase configuration')
    return jsonError('Submission service is temporarily unavailable. Please try again later.', 503)
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonError('Invalid submission payload.', 400)
    }
    body = parsed as Record<string, unknown>
  } catch {
    return jsonError('Invalid JSON request.', 400)
  }

  const capsuleId = body.capsuleId
  const phaseId = body.phaseId ?? null
  if (!isUuid(capsuleId)) return jsonError('Invalid capsule reference.', 400)
  if (phaseId !== null && !isUuid(phaseId)) return jsonError('Invalid event phase.', 400)

  const contributorName = cleanText(body.contributorName, 160)
  const tributeText = cleanText(body.tributeText, 10000)
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 320) : ''
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 120) : ''
  const country = typeof body.country === 'string' ? body.country.trim().slice(0, 120) : ''
  const relationship = typeof body.relationship === 'string' ? body.relationship.trim().slice(0, 240) : null
  const thumbnailUrl = typeof body.thumbnailUrl === 'string' ? body.thumbnailUrl.slice(0, 2048) : null
  const audioUrl = typeof body.audioUrl === 'string' ? body.audioUrl.slice(0, 2048) : null
  const videoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.slice(0, 2048) : null
  const lat = typeof body.lat === 'number' && Number.isFinite(body.lat) && body.lat >= -90 && body.lat <= 90 ? body.lat : null
  const lng = typeof body.lng === 'number' && Number.isFinite(body.lng) && body.lng >= -180 && body.lng <= 180 ? body.lng : null
  const ipCountry = typeof body.ipCountry === 'string' ? body.ipCountry.trim().slice(0, 120) : null
  const legacyBuilderConsent = body.legacyBuilderConsent === true

  if (!contributorName) return jsonError('Please provide a valid contributor name.', 400)
  if (!tributeText) return jsonError('Please provide a tribute message.', 400)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Please provide a valid email address.', 400)
  }
  for (const [label, value] of [['Thumbnail', thumbnailUrl], ['Audio', audioUrl], ['Video', videoUrl]] as const) {
    if (value && !/^https:\/\//i.test(value)) return jsonError(`${label} URL must use HTTPS.`, 400)
  }

  // SECTION 3 — SERVER-SIDE ELIGIBILITY CHECKS
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: capsule, error: capsuleError } = await admin
    .from('capsules')
    .select('id, slug, page_state, deleted_at, free_tier_expires_at, submission_deadline')
    .eq('id', capsuleId)
    .maybeSingle()

  if (capsuleError) {
    console.error('[contributions/submit] Capsule lookup failed:', capsuleError.message)
    return jsonError('Unable to verify this tribute wall. Please try again.', 500)
  }
  if (!capsule || capsule.deleted_at || capsule.page_state !== 'active') {
    return jsonError('This tribute wall is not accepting contributions.', 403)
  }

  const now = Date.now()
  if (capsule.free_tier_expires_at && Date.parse(capsule.free_tier_expires_at) < now) {
    return jsonError('The contribution window for this tribute wall has closed.', 403)
  }
  if (capsule.submission_deadline && Date.parse(capsule.submission_deadline) < now) {
    return jsonError('The contribution window for this tribute wall has closed.', 403)
  }

  if (phaseId) {
    const { data: phase, error: phaseError } = await admin
      .from('capsule_phases')
      .select('id, deleted_at, capture_window_closes_at')
      .eq('id', phaseId)
      .eq('capsule_id', capsuleId)
      .maybeSingle()
    if (phaseError) {
      console.error('[contributions/submit] Phase lookup failed:', phaseError.message)
      return jsonError('Unable to verify this event phase. Please try again.', 500)
    }
    if (!phase || phase.deleted_at) return jsonError('The selected event phase is not available for contributions.', 400)
    if (phase.capture_window_closes_at && Date.parse(phase.capture_window_closes_at) < now) {
      return jsonError('The contribution window for this event phase has closed.', 403)
    }
  }

  // SECTION 4 — PERSIST PENDING CONTRIBUTION
  // Explicitly use pending_review. Never auto-approve public submissions.
  const { data: contribution, error: insertError } = await admin
    .from('contributions')
    .insert({
      capsule_id: capsuleId,
      phase_id: phaseId,
      contributor_name: contributorName,
      city,
      country,
      relationship: relationship || null,
      tribute_text: tributeText,
      email,
      thumbnail_url: thumbnailUrl,
      audio_url: audioUrl,
      video_url: videoUrl,
      lat,
      lng,
      ip_country: ipCountry,
      status: 'pending_review',
      legacy_builder_consent: legacyBuilderConsent,
      story_topic_id: null,
    })
    .select('id')
    .single()

  if (insertError || !contribution) {
    console.error('[contributions/submit] Insert failed:', insertError?.message ?? 'No row returned')
    return jsonError('Your contribution could not be submitted. Please try again.', 500)
  }

  // SECTION 5 — MINIMAL RESPONSE
  // Return only the ID needed for confirmation and existing attribution handling.
  return NextResponse.json({ id: contribution.id }, { status: 201 })
}
