import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/?error=invalid_token`)
  }

  // Find verification record
  const { data: verification } = await db
    .from("email_verifications")
    .select("*")
    .eq("token", token)
    .single()

  if (!verification) {
    return NextResponse.redirect(`${APP_URL}/?error=token_not_found`)
  }

  // Check expiry
  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.redirect(`${APP_URL}/?error=token_expired`)
  }

  // Already verified
  if (verification.verified_at) {
    if (verification.type === "organiser") {
      const { data: capsule } = await db
        .from("capsules")
        .select("slug")
        .eq("id", verification.record_id)
        .single()
      return NextResponse.redirect(
        `${APP_URL}/for/${capsule?.slug}?verified=already`
      )
    }
  }

  // Mark as verified
  await db.from("email_verifications")
    .update({ verified_at: new Date().toISOString() })
    .eq("token", token)

  // Handle by type
  if (verification.type === "organiser") {
    // Activate capsule
    await db.from("capsules")
      .update({
        page_state:  "active",
        verified_at: new Date().toISOString(),
      })
      .eq("id", verification.record_id)

    // Get capsule slug for redirect
    const { data: capsule } = await db
      .from("capsules")
      .select("slug")
      .eq("id", verification.record_id)
      .single()

    return NextResponse.redirect(
      `${APP_URL}/for/${capsule?.slug}/manage?activated=true&email=${encodeURIComponent(verification.email)}`
    )
  }

  if (verification.type === "contributor") {
    // Mark contribution as email verified
    await db.from("contributions")
      .update({ email_verified: true })
      .eq("id", verification.record_id)

    // Get capsule slug for redirect
    const { data: contribution } = await db
      .from("contributions")
      .select("capsule_id")
      .eq("id", verification.record_id)
      .single()

    const { data: capsule } = await db
      .from("capsules")
      .select("slug")
      .eq("id", contribution?.capsule_id)
      .single()

    return NextResponse.redirect(
      `${APP_URL}/for/${capsule?.slug}?confirmed=true`
    )
  }

  return NextResponse.redirect(`${APP_URL}/`)
}



