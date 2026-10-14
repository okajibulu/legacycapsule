/*
FILE PATH: app/api/capsules/check-slug/route.ts
COMPONENT: Public Capsule URL Availability API
PURPOSE: Check whether a proposed capsule URL is currently available before
submission. The registration endpoint and database uniqueness remain the
authoritative protection against simultaneous claims.
*/

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  const slug = (request.nextUrl.searchParams.get('slug') ?? '').trim().toLowerCase()

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 40) {
    return NextResponse.json(
      { available: false, error: 'Please use 3–40 lowercase letters, numbers, and single hyphens.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Capsule URL availability API is missing server-side Supabase configuration')
    return NextResponse.json(
      { available: false, error: 'Availability checking is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await supabase
      .from('capsules')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (error) {
      console.error('Capsule URL availability query failed:', error.code)
      return NextResponse.json(
        { available: false, error: 'Availability checking is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { available: !data || data.length === 0 },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Capsule URL availability API failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { available: false, error: 'Availability checking is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
