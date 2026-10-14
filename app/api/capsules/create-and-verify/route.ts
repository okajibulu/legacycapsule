/*
FILE PATH: app/api/capsules/create-and-verify/route.ts
COMPONENT: Public Capsule Registration API
PURPOSE: Create a capsule through a trusted server-side Supabase client, then
request the existing email verification API. This avoids public browser INSERTs
being rejected by the capsules table's Row Level Security policy.
*/

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Capsule creation API is missing server-side Supabase configuration')
    return jsonError('Capsule creation is temporarily unavailable. Please try again later.', 503)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError('Please check the information entered and try again.', 400)
  }

  const honoureeName = typeof body.honoureeName === 'string' ? body.honoureeName.trim() : ''
  const eventTag = typeof body.eventTag === 'string' ? body.eventTag.trim() : ''
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim() : ''
  const organiserEmail = typeof body.organiserEmail === 'string' ? body.organiserEmail.trim().toLowerCase() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
  const path = body.path === 'book' ? 'book' : body.path === 'free' ? 'free' : ''
  const bookMode = body.bookMode === 'gift' ? 'gift' : body.bookMode === 'own' ? 'own' : ''

  if (!honoureeName || honoureeName.length > 200 || !eventType || eventType.length > 100) {
    return jsonError('Please provide the name and event type.', 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organiserEmail) || organiserEmail.length > 254) {
    return jsonError('Please enter a valid email address.', 400)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    return jsonError('Please choose a valid capsule URL.', 400)
  }
  if (!path || !bookMode) {
    return jsonError('Please select a booking option and continue again.', 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let capsuleId: string | null = null

  try {
    const { data: capsule, error: insertError } = await supabase
      .from('capsules')
      .insert({
        honouree_name: honoureeName,
        event_tag: eventTag || null,
        event_type: eventType,
        organiser_email: organiserEmail,
        slug,
        tier: 'free',
        pricing_key: '',
        visitor_type: bookMode === 'gift' ? 'gift' : 'personal',
        page_state: path === 'book' ? 'pending_payment' : 'pending_verification',
        theme: 'classic',
        components: ['community_stories'],
        free_tier_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, slug')
      .single()

    if (insertError || !capsule) {
      if (insertError?.code === '23505') {
        return jsonError('That capsule URL is already taken. Please choose a different one.', 409)
      }
      console.error('Capsule creation insert failed:', insertError?.code, insertError?.message)
      return jsonError('We could not create your capsule. Please try again.', 500)
    }

    capsuleId = capsule.id

    // Reuse the established verification endpoint and email template.
    const verificationResponse = await fetch(`${appUrl}/api/email/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        capsuleId: capsule.id,
        capsuleSlug: capsule.slug,
        organiserEmail,
        honoureeName,
      }),
      signal: AbortSignal.timeout(15000),
    })

    const verificationResult = await verificationResponse.json().catch(() => ({}))

    if (!verificationResponse.ok || verificationResult?.success !== true) {
      console.error('Capsule verification request failed:', verificationResponse.status)
      // Avoid leaving a newly-created, unverified capsule that the customer cannot
      // continue with. This only targets the capsule created by this request.
      const { error: cleanupError } = await supabase
        .from('capsules')
        .delete()
        .eq('id', capsule.id)
        .is('verified_at', null)

      if (cleanupError) {
        console.error('Failed to clean up unverified capsule after email failure:', cleanupError.code)
      }
      return jsonError('Your capsule could not be verified by email just now. Please try again in a few minutes.', 502)
    }

    return NextResponse.json({
      success: true,
      capsuleId: capsule.id,
      capsuleSlug: capsule.slug,
    })
  } catch (error) {
    console.error('Capsule creation API failed:', error instanceof Error ? error.message : 'Unknown error')

    if (capsuleId) {
      const { error: cleanupError } = await supabase
        .from('capsules')
        .delete()
        .eq('id', capsuleId)
        .is('verified_at', null)
      if (cleanupError) console.error('Capsule cleanup failed:', cleanupError.code)
    }

    return jsonError('We could not complete capsule registration. Please try again.', 500)
  }
}
