// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL PRICES API ROUTE
// Route: GET /api/regional-prices
// Detects visitor zone from IP, returns regional prices for both paid tiers.
// Called by booking page on mount — replaces hardcoded EUR display.
// D12: Single currency per user. Never returns dual currency.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { detectRegion } from '@/lib/payments/regionDetector'
import { getRegionalPrice } from '@/lib/payments/priceFetcher'

export async function GET(req: NextRequest) {
  try {
    // ── Detect IP from request headers ────────────────────────────────────
    // Vercel sets x-forwarded-for. Fallback to 0.0.0.0 → detectRegion
    // returns EU for local dev.
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'

    // ── Detect zone ───────────────────────────────────────────────────────
    const zone = await detectRegion(ip) ?? 'ROW'

    // ── Fetch both tier prices for this zone ──────────────────────────────
    const [honour, premier] = await Promise.all([
      getRegionalPrice('capture_preserve_base', zone),
      getRegionalPrice('full_platform_base', zone),
    ])

    // ── Return single-currency response — D12 ─────────────────────────────
    return NextResponse.json({
      zone,
      currency: honour.currency,
      symbol: honour.symbol,
      honourPrice: honour.amount,
      premierPrice: premier.amount,
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