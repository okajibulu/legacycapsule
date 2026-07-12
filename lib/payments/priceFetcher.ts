// lib/payments/priceFetcher.ts
// ─── IMPORTS ─────────────────────────────────────────────────────────────────
import { ecosystemClient } from '@/lib/supabase-ecosystem'

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface PriceRecord {
  key:          string
  label:        string
  eur_price:    number
  ngn_price:    number
  safe_min_eur: number
  safe_max_eur: number
}

// ─── CONFIG KEY MAPPING ───────────────────────────────────────────────────────
// Maps LC lc_pricing keys to RW-Ecosystem platform_config keys
const KEY_MAP: Record<string, { eur: string; ngn: string }> = {
  full_platform_base:      { eur: 'lc.pricing.full_platform.price_eur',    ngn: 'lc.pricing.full_platform.price_ngn' },
  capture_and_preserve:    { eur: 'lc.pricing.capture.price_eur',           ngn: 'lc.pricing.capture.price_ngn' },
  capture_preserve_base:   { eur: 'lc.pricing.capture.price_eur',           ngn: 'lc.pricing.capture.price_ngn' },
  guest_extension_block:   { eur: 'lc.pricing.guest_extension.price_eur',   ngn: 'lc.pricing.guest_extension.price_ngn' },
  fabric_attire:           { eur: 'lc.addon.fabric_attire.price_eur',       ngn: 'lc.addon.fabric_attire.price_ngn' },
  table_management:        { eur: 'lc.addon.table_management.price_eur',    ngn: 'lc.addon.table_management.price_ngn' },
  access_code:             { eur: 'lc.addon.access_code.price_eur',         ngn: 'lc.addon.access_code.price_ngn' },
  save_the_date:           { eur: 'lc.addon.save_the_date.price_eur',       ngn: 'lc.addon.save_the_date.price_ngn' },
  table_card_generation:   { eur: 'lc.addon.table_card_qr.price_eur',       ngn: 'lc.addon.table_card_qr.price_ngn' },
  additional_phase:        { eur: 'lc.addon.extra_phase.price_eur',         ngn: 'lc.addon.extra_phase.price_ngn' },
  contracted_planner_seat: { eur: 'lc.addon.planner_seat.price_eur',        ngn: 'lc.addon.planner_seat.price_ngn' },
  voice_tribute:           { eur: 'lc.addon.voice_tribute.price_eur',       ngn: 'lc.addon.voice_tribute.price_ngn' },
  video_30s:               { eur: 'lc.addon.video_30s.price_eur',           ngn: 'lc.addon.video_30s.price_ngn' },
  video_60s:               { eur: 'lc.addon.video_60s.price_eur',           ngn: 'lc.addon.video_60s.price_ngn' },
  permanent_archive:       { eur: 'lc.addon.permanent_archive.price_eur',   ngn: 'lc.addon.permanent_archive.price_ngn' },
  white_label:             { eur: 'lc.addon.white_label.price_eur',         ngn: 'lc.addon.white_label.price_ngn' },
  custom_domain:           { eur: 'lc.addon.custom_domain.price_eur',       ngn: 'lc.addon.custom_domain.price_ngn' },
  planner_monthly:         { eur: 'lc.addon.planner_monthly.price_eur',     ngn: 'lc.addon.planner_monthly.price_ngn' },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function extractValue(raw: any): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') return parseFloat(raw)
  if (raw && typeof raw === 'object' && 'value' in raw) return parseFloat(raw.value)
  return 0
}

// ─── FETCH SINGLE PRICE ───────────────────────────────────────────────────────
export async function getPrice(key: string): Promise<PriceRecord | null> {
  const mapping = KEY_MAP[key]
  if (!mapping) return null

  const configKeys = [mapping.eur, mapping.ngn]

  const { data, error } = await ecosystemClient
    .from('platform_config')
    .select('config_key, value, label, min_value, max_value')
    .in('config_key', configKeys)

  if (error || !data || data.length < 2) return null

  const eurRow = data.find(r => r.config_key === mapping.eur)
  const ngnRow = data.find(r => r.config_key === mapping.ngn)

  if (!eurRow || !ngnRow) return null

  return {
    key,
    label:        eurRow.label.replace(' — EUR', '').replace(' — NGN', ''),
    eur_price:    extractValue(eurRow.value),
    ngn_price:    extractValue(ngnRow.value),
    safe_min_eur: extractValue(eurRow.min_value),
    safe_max_eur: extractValue(eurRow.max_value),
  }
}

// ─── FETCH MULTIPLE PRICES ────────────────────────────────────────────────────
export async function getPrices(keys: string[]): Promise<PriceRecord[]> {
  const results = await Promise.all(keys.map(getPrice))
  return results.filter((r): r is PriceRecord => r !== null)
}

// ─── REGIONAL CONVERSION ──────────────────────────────────────────────────────
// Multipliers match the EcoControl Spec Regional Pricing Engine
export function convertToRegionalAmount(
  price: PriceRecord,
  region: string
): number {
  switch (region) {
    case 'UK':     return Math.round(price.eur_price * 0.90 * 100) / 100
    case 'US':     return Math.round(price.eur_price * 1.10 * 100) / 100
    case 'CA':     return Math.round(price.eur_price * 1.45 * 100) / 100
    case 'NG':     return price.ngn_price
    case 'GH':     return Math.round(price.ngn_price * 0.025)
    case 'KE':     return Math.round(price.eur_price * 130)
    case 'AFRICA': return Math.round(price.eur_price * 0.60 * 100) / 100
    default:       return price.eur_price
  }
}
// ─── GET REGIONAL PRICE (used by /api/regional-prices route) ─────────────────
export interface RegionalPrice {
  amount:   number
  currency: string
  symbol:   string
  region:   string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', GBP: '£', USD: '$', CAD: 'CA$',
  NGN: '₦', GHS: '₵', KES: 'KSh', AFRICA: '€',
}

export async function getRegionalPrice(
  key: string,
  region: string
): Promise<RegionalPrice | null> {
  const price = await getPrice(key)
  if (!price) return null

  const amount   = convertToRegionalAmount(price, region)
  const currency = getCurrencyForRegion(region)
  const symbol   = CURRENCY_SYMBOLS[currency] ?? currency

  return { amount, currency, symbol, region }
}

function getCurrencyForRegion(region: string): string {
  switch (region) {
    case 'UK':  return 'GBP'
    case 'US':  return 'USD'
    case 'CA':  return 'CAD'
    case 'NG':  return 'NGN'
    case 'GH':  return 'GHS'
    case 'KE':  return 'KES'
    default:    return 'EUR'
  }
}