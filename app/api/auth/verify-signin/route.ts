/* =========================================================
   app/api/auth/verify-signin/route.ts
   Validates the 4-char sign-in code.
   Establishes Supabase Auth session.
   Returns redirect URL based on user's capsules.
========================================================= */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    if (!email || !code) return NextResponse.json({ valid: false, error: 'Missing fields' }, { status: 400 })

    const normalised = email.trim().toLowerCase()

    // Fetch most recent unverified signin code for this email
    const { data, error } = await supabase
      .from('email_verifications')
      .select('id, verification_code, expires_at')
      .eq('email', normalised)
      .eq('type', 'signin')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return NextResponse.json({ valid: false, error: 'No code found. Please request a new one.' })

    // Check expiry
    if (new Date() > new Date(data.expires_at)) {
      await supabase.from('email_verifications').delete().eq('id', data.id)
      return NextResponse.json({ valid: false, error: 'Code has expired. Please request a new one.' })
    }

    // Validate code
    if (code.trim().toUpperCase() !== data.verification_code?.toUpperCase()) {
      return NextResponse.json({ valid: false, error: 'Incorrect code. Please try again.' })
    }

    // Mark as verified
    await supabase.from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', data.id)

    // Ensure Supabase Auth account exists — use createUser with upsert approach
    let userId: string | null = null
    try {
      // Try to create — if already exists, error message contains existing user info
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalised,
        email_confirm: true,
      })
      if (newUser?.user) {
        userId = newUser.user.id
      } else if (createError?.message?.includes('already been registered')) {
        // User exists — fetch by email directly
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existing = users?.find((u: any) => u.email === normalised)
        if (existing) userId = existing.id
      }
    } catch (authErr) {
      console.error('Auth user error:', authErr)
      // Non-fatal — continue with redirect even if profile creation fails
    }

    // Upsert profile
    if (userId) {
      await supabase.from('profiles').upsert(
        { id: userId, email: normalised, role: 'organiser' },
        { onConflict: 'id' }
      )
    }

    // Find their capsules to determine redirect
    const { data: capsules } = await supabase
      .from('capsules')
      .select('id, slug')
      .eq('organiser_email', normalised)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Ensure capsule_access rows exist
    if (userId && capsules && capsules.length > 0) {
      for (const cap of capsules) {
        await supabase.from('capsule_access').upsert(
          { capsule_id: cap.id, user_id: userId, role: 'owner', permissions: '["all"]' },
          { onConflict: 'capsule_id,user_id' }
        )
      }
    }

    // Determine redirect
    let redirect = '/dashboard'
    if (capsules && capsules.length === 1) redirect = `/manage/${capsules[0].slug}`
    else if (!capsules || capsules.length === 0) redirect = '/book?signin=true'

    return NextResponse.json({ valid: true, redirect })

  } catch (error) {
    console.error('Verify signin error:', error)
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 })
  }
}
