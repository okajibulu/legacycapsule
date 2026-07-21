// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL PRICES API ROUTE
// Route: GET /api/regional-prices
// Detects visitor zone from IP, returns regional prices for both paid tiers.
// Called by booking page on mount — replaces hardcoded EUR display.
// D12: Single currency per user. Never returns dual currency.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { detectRegionFromHeaders, detectRegion } from '@/lib/payments/regionDetector'
import { getRegionalPrice } from '@/lib/payments/priceFetcher'

export async function GET(req: NextRequest) {
  try {
    // ── Detect region — Cloudflare/Vercel header first ───────────────────
    // cf-ipcountry set by Cloudflare: free, instant, no rate limits.
    // x-vercel-ip-country set by Vercel: works in local dev too.
    // No external API call needed for production traffic.
    let zone = detectRegionFromHeaders(req)

    // Fallback to IP lookup only when headers give no signal
    if (zone === 'ROW') {
      const ip =
        req.headers.get('cf-connecting-ip') ??
        req.headers.get('x-real-ip') ??
        (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
      if (ip && ip !== '0.0.0.0' && !ip.startsWith('127.') && !ip.startsWith('::1')) {
        zone = await detectRegion(ip).catch(() => 'ROW')
      }
    }

    // ── Feature prices request (ServicesTab) ──────────────────────────────
    const featuresParam = req.nextUrl.searchParams.get('features')

    if (featuresParam) {
      const keys = featuresParam.split(',').map(k => k.trim()).filter(Boolean)
      const featurePrices: Record<string, { amount: number; symbol: string; currency: string } | null> = {}

      await Promise.all(keys.map(async key => {
        try {
          const p = await getRegionalPrice(key, zone)
          featurePrices[key] = p ? { amount: p.amount, symbol: p.symbol, currency: p.currency } : null
        } catch {
          featurePrices[key] = null // unpublished or not found — show nothing
        }
      }))

      return NextResponse.json({ zone, features: featurePrices })
    }

    // ── Tier prices (booking page — kept for backward compat) ─────────────
    const [honour, premier] = await Promise.all([
      getRegionalPrice('capture_preserve_base', zone),
      getRegionalPrice('full_platform_base', zone),
    ])

return NextResponse.json({
      zone,
      currency:    honour?.currency  ?? 'EUR',
      symbol:      honour?.symbol    ?? '€',
      honourPrice: honour?.amount    ?? null,
      premierPrice: premier?.amount  ?? null,
    })

  } catch (err) {
    console.error('Regional prices route error:', err)

    // ── Safe fallback — EUR base prices ───────────────────────────────────
    return NextResponse.json({
      zone: 'ROW',
      currency: 'EUR',
      symbol: '€',
      honourPrice: 50,
      premierPrice: 80,
    })
  }
}