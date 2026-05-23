/* =========================================================
   app/auth/callback/route.ts
   Handles the Supabase magic link redirect.

   Flow:
   1. User clicks magic link in email
   2. Supabase redirects to /auth/callback?code=...
   3. This route exchanges the code for a session
   4. Creates/updates profile row
   5. Creates capsule_access row for any capsules they own
   6. Redirects to manage page (or capsule selector if multiple)
========================================================= */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/signin?error=no_code', request.url))
  }

  // Create a Supabase client with the service role for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create a client-side Supabase to exchange the code
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Exchange the code for a session
    const { data: sessionData, error: sessionError } =
      await supabaseAuth.auth.exchangeCodeForSession(code)

    if (sessionError || !sessionData?.user) {
      console.error('Session exchange error:', sessionError)
      return NextResponse.redirect(new URL('/signin?error=invalid_code', request.url))
    }

    const user = sessionData.user
    const email = user.email?.toLowerCase()

    if (!email) {
      return NextResponse.redirect(new URL('/signin?error=no_email', request.url))
    }

    // Upsert profile — create if not exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let profileId: string

    if (existingProfile) {
      profileId = existingProfile.id
    } else {
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: email,
          full_name: user.user_metadata?.full_name ?? null,
          role: 'organiser',
        })
        .select('id')
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Try to continue — profile might already exist with different id
        profileId = user.id
      } else {
        profileId = newProfile.id
      }
    }

    // Find all capsules this email organises
    const { data: capsules } = await supabaseAdmin
      .from('capsules')
      .select('id, slug')
      .eq('organiser_email', email)
      .is('deleted_at', null)

    // Create capsule_access rows for any capsules they own
    if (capsules && capsules.length > 0) {
      for (const capsule of capsules) {
        await supabaseAdmin
          .from('capsule_access')
          .upsert(
            {
              capsule_id: capsule.id,
              user_id: profileId,
              role: 'owner',
              permissions: '["all"]',
            },
            { onConflict: 'capsule_id,user_id' }
          )
      }

      // Redirect — if one capsule, go straight to manage
      if (capsules.length === 1) {
        return NextResponse.redirect(
          new URL(`/manage/${capsules[0].slug}`, request.url)
        )
      }

      // Multiple capsules — go to capsule selector
      return NextResponse.redirect(
        new URL('/dashboard', request.url)
      )
    }

    // No capsules found — redirect to booking
    return NextResponse.redirect(
      new URL('/book?signin=true', request.url)
    )

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/signin?error=unknown', request.url))
  }
}
