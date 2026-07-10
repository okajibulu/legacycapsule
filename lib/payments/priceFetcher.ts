// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// priceFetcher.ts
// Fetches regional prices from Supabase. All prices are database-driven.
// No price is ever hardcoded here or anywhere in the application.
// Called by PaymentService only â€” do not call directly from API routes.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { createClient } from '@supabase/supabase-js'

// â”€â”€ DB CLIENT (server-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Stripe zero-decimal currencies — amount sent as-is (no × 100)
// NGN is NOT zero-decimal on Stripe — it uses kobo (× 100)
// Reference: https://stripe.com/docs/currencies#zero-decimal
const ZERO_DECIMAL_CURRENCIES = new Set(['jpy', 'krw', 'vnd', 'gnf', 'mga'])

// â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface RegionalPrice {
  pricing_key:      string
  amount:           number   // human-readable (e.g. 50 for â‚¬50, 40000 for â‚¦40,000)
  currency:         string   // ISO 4217 uppercase (EUR, GBP, NGN)
  symbol:           string   // display symbol (â‚¬, Â£, â‚¦)
  zone_key:         string
  stripe_currency:  string   // lowercase for Stripe API
  amount_for_stripe: number  // pre-calculated integer for Stripe (cents or base)
  is_zero_decimal:  boolean
}

// â”€â”€ SINGLE PRICE FETCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getRegionalPrice(
  pricing_key: string,
  zone_key: string
): Promise<RegionalPrice> {
  // Fetch base price row
  const { data: pricing, error: pricingError } = await db
    .from('lc_pricing')
    .select('eur_price, ngn_price, label, is_published')
    .eq('key', pricing_key)
    .single()

  if (pricingError || !pricing) {
    throw new Error(`Price key not found: ${pricing_key}`)
  }

  if (!pricing.is_published) {
    throw new Error(`Price not yet available: ${pricing_key}`)
  }

  // Fetch zone configuration
  const { data: zone, error: zoneError } = await db
    .from('lc_pricing_zones')
    .select('currency_code, currency_symbol, multiplier, is_independent')
    .eq('zone_key', zone_key)
    .single()

  if (zoneError || !zone) {
    throw new Error(`Pricing zone not found: ${zone_key}`)
  }

  // â”€â”€ AMOUNT CALCULATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let amount: number

  if (zone.is_independent) {
    // NG and any future independent zones use their own base price (NGN column)
    amount = pricing.ngn_price
  } else {
    // All other zones: EUR base Ã— zone multiplier, rounded to nearest integer
    amount = Math.round(pricing.eur_price * (zone.multiplier ?? 1))
  }

  const currency       = zone.currency_code as string
  const stripe_currency = currency.toLowerCase()
  const is_zero_decimal = ZERO_DECIMAL_CURRENCIES.has(stripe_currency)

 // Stripe amount: zero-decimal currencies send amount as-is, all others × 100
  // NGN uses kobo as smallest unit (like EUR uses cents) — so × 100 is correct for NGN
  const amount_for_stripe = is_zero_decimal ? amount : amount * 100
  
  return {
    pricing_key,
    amount,
    currency,
    symbol:          zone.currency_symbol,
    zone_key,
    stripe_currency,
    amount_for_stripe,
    is_zero_decimal,
  }
}

// â”€â”€ MULTI-PRICE FETCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// For bundles or multi-item checkouts (add-ons, Phase 2+)
export async function getRegionalPrices(
  pricing_keys: string[],
  zone_key: string
): Promise<RegionalPrice[]> {
  return Promise.all(pricing_keys.map(key => getRegionalPrice(key, zone_key)))
}
