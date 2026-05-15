import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { contributionId } = await req.json()

  if (!contributionId) {
    return NextResponse.json({ ok: false, reason: "missing contributionId" })
  }

  // Get real IP from request headers
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers.get("x-real-ip") ?? "8.8.8.8"

  console.log("GEOCODE IP:", ip)

  // Skip private/local IPs during development
  const isLocal =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168") ||
    ip.startsWith("10.") ||
    ip === "8.8.8.8"

  if (isLocal) {
    console.log("Local IP detected — skipping geocode in dev")
    return NextResponse.json({ ok: false, reason: "local ip" })
  }

  try {
    const res  = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,city,country,status`)
    const data = await res.json()

    console.log("IP-API RESPONSE:", data)

    if (data.status !== "success") {
      return NextResponse.json({ ok: false, reason: "ip lookup failed" })
    }

    const lat = data.lat
    const lng = data.lon

    // Update contribution with real coordinates
    await db.from("contributions")
      .update({ lat, lng })
      .eq("id", contributionId)

    return NextResponse.json({ ok: true, lat, lng, city: data.city, country: data.country })

  } catch (err: any) {
    console.error("Geocode error:", err)
    return NextResponse.json({ ok: false, reason: err.message }, { status: 500 })
  }
}
