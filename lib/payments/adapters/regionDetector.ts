// ─────────────────────────────────────────────────────────────────────────────
// regionDetector.ts
// Maps a client IP address → zone key matching lc_pricing_zones table.
// Zone keys: EU · UK · US · CA · NG · GH · KE · ROW
// This file is the single source of country→zone mapping.
// To add a new country: add it to the COUNTRY_ZONE_MAP below.
// ─────────────────────────────────────────────────────────────────────────────

// ── ZONE MAP ─────────────────────────────────────────────────────────────────
// Key: ISO 3166-1 alpha-2 country code
// Value: zone_key in lc_pricing_zones table
const COUNTRY_ZONE_MAP: Record<string, string> = {
  // United Kingdom
  GB: 'UK',

  // North America
  US: 'US',
  CA: 'CA',

  // Nigeria — independent NGN pricing
  NG: 'NG',

  // West Africa zone (GH pricing band)
  GH: 'GH', SL: 'GH', LR: 'GH', SN: 'GH',
  CI: 'GH', GM: 'GH', GN: 'GH', BF: 'GH',
  ML: 'GH', NE: 'GH', TG: 'GH', BJ: 'GH',

  // East Africa zone (KE pricing band)
  KE: 'KE', UG: 'KE', TZ: 'KE', RW: 'KE', ET: 'KE',

  // Eurozone
  PT: 'EU', DE: 'EU', FR: 'EU', ES: 'EU', IT: 'EU',
  NL: 'EU', BE: 'EU', AT: 'EU', IE: 'EU', GR: 'EU',
  FI: 'EU', SE: 'EU', DK: 'EU', PL: 'EU', CZ: 'EU',
  RO: 'EU', HU: 'EU', SK: 'EU', SI: 'EU', HR: 'EU',
  LU: 'EU', MT: 'EU', CY: 'EU', EE: 'EU', LV: 'EU', LT: 'EU',
}

const FALLBACK_ZONE = 'ROW'
const IP_API_TIMEOUT_MS = 2000

// ── IP → COUNTRY LOOKUP ───────────────────────────────────────────────────────
// Uses ipapi.co free tier. Replace with ipinfo.io or MaxMind for higher volume.
export async function detectRegion(ip: string): Promise<string> {
  // Skip detection for localhost / private IPs
  if (!ip || ip === '0.0.0.0' || ip.startsWith('192.168') || ip.startsWith('127.')) {
    return 'EU' // Default to EU for local development
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), IP_API_TIMEOUT_MS)

    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return FALLBACK_ZONE

    const country = (await res.text()).trim().toUpperCase()
    return mapCountryToZone(country)
  } catch {
    // Timeout or network error — fail silently to fallback
    return FALLBACK_ZONE
  }
}

// ── COUNTRY → ZONE ────────────────────────────────────────────────────────────
// Exported separately so it can be called directly when country is already known
// (e.g. from user profile or billing address)
export function mapCountryToZone(countryCode: string): string {
  return COUNTRY_ZONE_MAP[countryCode.toUpperCase()] ?? FALLBACK_ZONE
}