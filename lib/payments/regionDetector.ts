// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// regionDetector.ts
// Maps a client IP address â†’ zone key matching lc_pricing_zones table.
// Zone keys: EU Â· UK Â· US Â· CA Â· NG Â· GH Â· KE Â· ROW
// This file is the single source of countryâ†’zone mapping.
// To add a new country: add it to the COUNTRY_ZONE_MAP below.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ ZONE MAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Key: ISO 3166-1 alpha-2 country code
// Value: zone_key in lc_pricing_zones table
const COUNTRY_ZONE_MAP: Record<string, string> = {
  // United Kingdom
  GB: 'UK',

  // North America
  US: 'US',
  CA: 'CA',

  // Nigeria â€” independent NGN pricing
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
const IP_API_TIMEOUT_MS = 5000

// â”€â”€ IP â†’ COUNTRY LOOKUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Uses ipapi.co free tier. Replace with ipinfo.io or MaxMind for higher volume.
// detectRegionFromHeaders — preferred method.
// Reads Cloudflare cf-ipcountry header directly. No external API call.
// Falls back to x-vercel-ip-country (Vercel injects this too).
// Call this from route handlers that have access to the Request object.
export function detectRegionFromHeaders(req: Request): string {
  const cfCountry     = (req.headers as any).get?.('cf-ipcountry')
  const vercelCountry = (req.headers as any).get?.('x-vercel-ip-country')
  const country       = (cfCountry ?? vercelCountry ?? '').trim().toUpperCase()
  if (country && country !== 'XX' && country !== 'T1') {
    // XX = unknown, T1 = Tor exit node — treat both as ROW
    return mapCountryToZone(country)
  }
  return FALLBACK_ZONE
}

// detectRegion(ip) — legacy method kept for backward compatibility.
// Uses ipapi.co which has rate limits. Prefer detectRegionFromHeaders.
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
    // Timeout or network error â€” fail silently to fallback
    return FALLBACK_ZONE
  }
}

// â”€â”€ COUNTRY â†’ ZONE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Exported separately so it can be called directly when country is already known
// (e.g. from user profile or billing address)
export function mapCountryToZone(countryCode: string): string {
  return COUNTRY_ZONE_MAP[countryCode.toUpperCase()] ?? FALLBACK_ZONE
}
