// lib/payments/promoResolver.ts
// LegacyCapsule — Promo-Aware Price Resolver
// AI29 · 25 September 2026
//
// ─── PURPOSE ───────────────────────────────────────────────────────────────
// Fetches the active promo (if any) and applies its discount to a given
// base price. Called by checkout routes and the regional-prices API so
// organisers see promo prices at every pricing touchpoint.
//
// Design rules:
//   - Never mutates lc_pricing base prices
//   - All arithmetic in minor units (kobo / cents) — convert before passing in
//   - Returns both original and promo price so UI can show strikethrough
//   - Promo applies only to published, non-free products
//   - If promo is sold out or inactive, returns base price unchanged
//
// ─── SECTIONS ──────────────────────────────────────────────────────────────
//   1. Types
//   2. Active promo cache (60s in-memory, prevents per-request DB call)
//   3. resolvePromoPrice()  — single price resolution
//   4. resolvePromoPrices() — batch resolution for ServicesTab / booking flow
//   5. getActivePromo()     — raw promo row fetch (used by counter + claim)
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// ── 1. Types ──────────────────────────────────────────────────────────────

export type SupportedCurrency = 'EUR' | 'NGN' | 'GBP' | 'USD' | 'CAD'

export interface ActivePromo {
  id:            string
  label:         string
  discount_type: 'percentage' | 'flat_override'
  discount_pct:  number | null
  pricing_keys:  string[] | null  // null = all published products
  applies_to_currencies: string[]
  customer_limit: number | null
  orders_claimed: number
}

export interface ResolvedPrice {
  pricing_key:    string
  currency:       SupportedCurrency
  base_price:     number   // original price in minor units
  promo_price:    number   // discounted price in minor units (= base if no promo)
  has_promo:      boolean
  discount_pct:   number | null
  promo_label:    string | null
  sold_out:       boolean  // promo exists but limit reached
}

// ── 2. Active promo cache ─────────────────────────────────────────────────

// Server-side in-memory cache — 60s TTL
// Fine for Vercel serverless: each instance caches independently
// (avoids one DB query per price fetch during high traffic)
let _cachedPromo:     ActivePromo | null | undefined = undefined
let _cacheExpiry:     number = 0
const CACHE_TTL_MS =  60_000 // 60 seconds

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── 3. resolvePromoPrice() ────────────────────────────────────────────────

/**
 * Applies active promo discount to a single base price.
 *
 * @param pricingKey  - lc_pricing.key e.g. 'publication'
 * @param currency    - 'EUR' | 'NGN' | 'GBP' | 'USD' | 'CAD'
 * @param basePrice   - price in minor units (kobo / cents)
 * @param isFree      - if true, promo never applies
 */
export async function resolvePromoPrice(
  pricingKey: string,
  currency:   SupportedCurrency,
  basePrice:  number,
  isFree:     boolean = false
): Promise<ResolvedPrice> {
  const base: ResolvedPrice = {
    pricing_key:  pricingKey,
    currency,
    base_price:   basePrice,
    promo_price:  basePrice,
    has_promo:    false,
    discount_pct: null,
    promo_label:  null,
    sold_out:     false,
  }

  // Free products never get promos
  if (isFree || basePrice === 0) return base

  const promo = await getActivePromo()

  if (!promo) return base

  // Check currency eligibility
  if (!promo.applies_to_currencies.includes(currency)) return base

  // Check if this key is in scope (null pricing_keys = all products)
  if (promo.pricing_keys !== null && !promo.pricing_keys.includes(pricingKey)) {
    return base
  }

  // Check if sold out
  const soldOut =
    promo.customer_limit !== null && promo.orders_claimed >= promo.customer_limit
  if (soldOut) {
    return { ...base, sold_out: true }
  }

  // Apply discount
  if (promo.discount_type === 'percentage' && promo.discount_pct !== null) {
    const promoPrice = Math.round(basePrice * (1 - promo.discount_pct / 100))
    return {
      ...base,
      promo_price:  promoPrice,
      has_promo:    true,
      discount_pct: promo.discount_pct,
      promo_label:  promo.label,
      sold_out:     false,
    }
  }

  // flat_override would be handled here when implemented
  return base
}

// ── 4. resolvePromoPrices() — batch ──────────────────────────────────────

/**
 * Batch version — used by regional-prices API and ServicesTab
 * to resolve all visible prices in one promo fetch.
 */
export async function resolvePromoPrices(
  items: Array<{
    pricing_key: string
    currency:    SupportedCurrency
    base_price:  number
    is_free?:    boolean
  }>
): Promise<ResolvedPrice[]> {
  // Fetch promo once for the whole batch
  const promo = await getActivePromo()

  return items.map(item => {
    if (!promo || item.is_free || item.base_price === 0) {
      return {
        pricing_key:  item.pricing_key,
        currency:     item.currency,
        base_price:   item.base_price,
        promo_price:  item.base_price,
        has_promo:    false,
        discount_pct: null,
        promo_label:  null,
        sold_out:     false,
      }
    }

    const soldOut =
      promo.customer_limit !== null && promo.orders_claimed >= promo.customer_limit
    const currencyEligible = promo.applies_to_currencies.includes(item.currency)
    const keyEligible =
      promo.pricing_keys === null || promo.pricing_keys.includes(item.pricing_key)

    if (!currencyEligible || !keyEligible || soldOut) {
      return {
        pricing_key:  item.pricing_key,
        currency:     item.currency,
        base_price:   item.base_price,
        promo_price:  item.base_price,
        has_promo:    false,
        discount_pct: null,
        promo_label:  null,
        sold_out:     soldOut && currencyEligible && keyEligible,
      }
    }

    if (promo.discount_type === 'percentage' && promo.discount_pct !== null) {
      const promoPrice = Math.round(item.base_price * (1 - promo.discount_pct / 100))
      return {
        pricing_key:  item.pricing_key,
        currency:     item.currency,
        base_price:   item.base_price,
        promo_price:  promoPrice,
        has_promo:    true,
        discount_pct: promo.discount_pct,
        promo_label:  promo.label,
        sold_out:     false,
      }
    }

    return {
      pricing_key:  item.pricing_key,
      currency:     item.currency,
      base_price:   item.base_price,
      promo_price:  item.base_price,
      has_promo:    false,
      discount_pct: null,
      promo_label:  null,
      sold_out:     false,
    }
  })
}

// ── 5. getActivePromo() ───────────────────────────────────────────────────

/**
 * Fetches the active promo from DB with 60s in-memory cache.
 * Returns null if no promo is currently active.
 */
export async function getActivePromo(): Promise<ActivePromo | null> {
  const now = Date.now()

  // Return cached value if still fresh
  if (_cachedPromo !== undefined && now < _cacheExpiry) {
    return _cachedPromo
  }

  try {
    const { data, error } = await supabaseService
      .from('lc_pricing_promotions')
      .select(
        'id, label, discount_type, discount_pct, pricing_keys, applies_to_currencies, customer_limit, orders_claimed'
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    _cachedPromo = data as ActivePromo | null
    _cacheExpiry = now + CACHE_TTL_MS
    return _cachedPromo
  } catch (err) {
    console.error('[promoResolver] getActivePromo error:', err)
    // On error: return null (no promo) without caching — retry next request
    return null
  }
}

/**
 * Invalidate the in-memory cache.
 * Call after webhook claim or admin promo changes.
 */
export function invalidatePromoCache() {
  _cachedPromo = undefined
  _cacheExpiry = 0
}
