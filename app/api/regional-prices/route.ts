// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL PRICES API ROUTE
// Route: GET /api/regional-prices
// Detects visitor zone from IP, returns regional prices for both paid tiers.
// Called by booking page on mount — replaces hardcoded EUR display.
// D12: Single currency per user. Never returns dual currency.
// UPDATED:   AI31 · Claude Sonnet 4.6 · 27 September 2026
//            — Promo price wiring: features path enriched with resolvePromoPrices()
//            — Unit conversion: getRegionalPrice() → ×100 → resolvePromoPrices() → ÷100
//            — Tier path (honourPrice/premierPrice) untouched — legacy/outdated
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { detectRegionFromHeaders, detectRegion } from '@/lib/payments/regionDetector'
import { getRegionalPrice } from '@/lib/payments/priceFetcher'
import { resolvePromoPrices, type SupportedCurrency } from '@/lib/payments/promoResolver'

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

    // ── Feature prices request (ServicesTab / booking flow) ──────────────
    const featuresParam = req.nextUrl.searchParams.get('features')

    if (featuresParam) {
      const keys = featuresParam.split(',').map(k => k.trim()).filter(Boolean)

      // Step 1: resolve regional base prices for all keys in parallel
      const regionalResults = await Promise.all(
        keys.map(async key => {
          try {
            const p = await getRegionalPrice(key, zone)
            return { key, price: p }
          } catch {
            return { key, price: null }
          }
        })
      )

      // Step 2: build batch input for resolvePromoPrices()
      // getRegionalPrice() returns whole units (e.g. 50 for €50).
      // resolvePromoPrices() expects minor units (kobo/cents) — multiply ×100.
      const batchInput = regionalResults
        .filter(r => r.price !== null)
        .map(r => ({
          pricing_key: r.key,
          currency:    r.price!.currency as SupportedCurrency,
          base_price:  Math.round(r.price!.amount * 100),
        }))

      // Step 3: resolve promo for the whole batch in one DB fetch
      const promoResults = batchInput.length > 0
        ? await resolvePromoPrices(batchInput)
        : []

      // Build a lookup map: pricing_key → ResolvedPrice
      const promoMap = new Map(promoResults.map(r => [r.pricing_key, r]))

      // Step 4: merge into featurePrices response
      // Divide minor-unit prices back to whole units for display.
      const featurePrices: Record<string, {
        amount:       number
        symbol:       string
        currency:     string
        promo_amount: number
        has_promo:    boolean
        discount_pct: number | null
        promo_label:  string | null
        sold_out:     boolean
      } | null> = {}

      for (const { key, price } of regionalResults) {
        if (!price) {
          featurePrices[key] = null
          continue
        }

        const resolved = promoMap.get(key)

        featurePrices[key] = {
          amount:       price.amount,
          symbol:       price.symbol,
          currency:     price.currency,
          promo_amount: resolved
            ? Math.round(resolved.promo_price / 100 * 100) / 100
            : price.amount,
          has_promo:    resolved?.has_promo    ?? false,
          discount_pct: resolved?.discount_pct ?? null,
          promo_label:  resolved?.promo_label  ?? null,
          sold_out:     resolved?.sold_out      ?? false,
        }
      }

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
