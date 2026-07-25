// FILE: lib/payments/regionDetector.ts
// Maps a client IP address to zone key matching lc_pricing_zones table.
// Zone keys: EU - UK - US - CA - NG - GH - KE - ROW
// This file is the single source of country-to-zone mapping.
// To add a new country: add it to the COUNTRY_ZONE_MAP below.
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
//   -- File re-encoded (was corrupted with garbled box-drawing bytes)
//   -- Logic unchanged

// ============================================================
// SECTION 1 -- Zone map
// Key: ISO 3166-1 alpha-2 country code
// Value: zone_key in lc_pricing_zones table
// ============================================================

const COUNTRY_ZONE_MAP: Record<string, string> = {
  // United Kingdom
  GB: 'UK',

  // North America
  US: 'US',
  CA: 'CA',

  // Nigeria -- independent NGN pricing
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

const FALLBACK_ZONE    = 'ROW'
const IP_API_TIMEOUT_MS = 5000

// ============================================================
// SECTION 2 -- detectRegionFromHeaders (preferred)
// Reads Cloudflare cf-ipcountry header directly.
// No external API call. Instant and reliable.
// Also reads x-vercel-ip-country as fallback.
// Call this from any route handler with access to the Request.
// ============================================================

export function detectRegionFromHeaders(req: Request): string {
  const headers    = req.headers as any
  const cfCountry  = headers.get?.('cf-ipcountry')
  const vCountry   = headers.get?.('x-vercel-ip-country')
  const country    = (cfCountry ?? vCountry ?? '').trim().toUpperCase()

  if (country && country !== 'XX' && country !== 'T1') {
    return mapCountryToZone(country)
  }
  return FALLBACK_ZONE
}

// ============================================================
// SECTION 3 -- detectRegion (legacy, kept for compatibility)
// Uses ipapi.co which is rate-limited. Prefer detectRegionFromHeaders.
// ============================================================

export async function detectRegion(ip: string): Promise<string> {
  // Skip detection for localhost / private IPs
  if (!ip || ip === '0.0.0.0' || ip.startsWith('192.168') || ip.startsWith('127.')) {
    return 'EU'
  }

  try {
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), IP_API_TIMEOUT_MS)

    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return FALLBACK_ZONE

    const country = (await res.text()).trim().toUpperCase()
    return mapCountryToZone(country)
  } catch {
    return FALLBACK_ZONE
  }
}

// ============================================================
// SECTION 4 -- mapCountryToZone
// Exported for direct use when country code is already known.
// ============================================================

export function mapCountryToZone(countryCode: string): string {
  return COUNTRY_ZONE_MAP[countryCode.toUpperCase()] ?? FALLBACK_ZONE
}