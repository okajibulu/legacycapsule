/* =========================================================
   app/api/ip-geocode/route.ts
   Resolves the real sender IP to lat/lng for map pins.
   Called server-side on tribute submit — not client-side.
   Uses ip-api.com free tier (no key required, 45 req/min).
   Returns: { lat, lng, city, country } or null on failure.
========================================================= */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Read real IP — Vercel sets x-forwarded-for
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : null

    // Skip private/loopback IPs (local dev)
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return NextResponse.json({ lat: null, lng: null, city: null, country: null })
    }

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`,
      { next: { revalidate: 0 } }
    )

    if (!res.ok) {
      return NextResponse.json({ lat: null, lng: null, city: null, country: null })
    }

    const data = await res.json()

    if (data.status !== 'success') {
      return NextResponse.json({ lat: null, lng: null, city: null, country: null })
    }

    return NextResponse.json({
      lat: data.lat ?? null,
      lng: data.lon ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
    })
  } catch {
    return NextResponse.json({ lat: null, lng: null, city: null, country: null })
  }
}
