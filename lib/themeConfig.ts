/* =========================================================
   lib/themeConfig.ts — LegacyCapsule Theme Engine
   
   Four ceremonial palettes:
   - celebration  → warm gold, champagne, cinematic glow
   - honour       → royal navy, prestige gold, institutional
   - preservation → archival, documentary, textured warmth
   - memorial     → restrained, spiritual, midnight depth
   
   Auto-detection: event type maps to default theme.
   Manual override: organiser picks from control dash.
   Resolution: capsule.theme === 'classic' → auto from event type.
   
   Usage:
     import { resolveTheme, getThemeConfig } from '@/lib/themeConfig'
     const themeKey = resolveTheme(capsule.theme, capsule.event_type)
     const theme = getThemeConfig(themeKey)
========================================================= */

/* =========================================================
   SECTION 1 — THEME KEY TYPE
========================================================= */
export type ThemeKey = 'celebration' | 'honour' | 'preservation' | 'memorial'

/* =========================================================
   SECTION 2 — THEME CONFIG INTERFACE
========================================================= */
export interface ThemeConfig {
  key: ThemeKey
  label: string
  description: string

  // Page background
  pageBg: string

  // Hero overlays
  heroOverlay: string
  heroGlow: string

  // Card surfaces
  cardBg: string
  cardBorder: string
  cardShadow: string

  // Gold accent — varies by mood
  accentPrimary: string
  accentMuted: string
  accentFaint: string

  // Text
  textHeading: string
  textBody: string
  textMuted: string
  textFaint: string

  // Map
  mapBg: string
  mapPinFill: string
  mapPinGlow: string

  // Tribute card left accent
  cardAccentApproved: string
  cardAccentPending: string

  // Input field
  inputBg: string
  inputBorder: string
  inputFocusBorder: string
  inputFocusGlow: string
}

/* =========================================================
   SECTION 3 — FOUR PALETTES
========================================================= */
const THEMES: Record<ThemeKey, ThemeConfig> = {

  /* ─── LIFE CELEBRATION ─── */
  celebration: {
    key: 'celebration',
    label: 'Life Celebration',
    description: 'Warm gold, champagne, soft cinematic glow — for joyful occasions',

    pageBg: 'linear-gradient(160deg, #1a0d3a 0%, #2a1260 35%, #1e0c4a 65%, #150838 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(20,10,50,0.55) 0%, rgba(20,10,50,0.30) 40%, rgba(20,10,50,0.85) 100%)',
    heroGlow: 'radial-gradient(ellipse at 50% 0%, rgba(226,195,107,0.12) 0%, transparent 55%)',

    cardBg: 'rgba(255,255,255,0.055)',
    cardBorder: 'rgba(255,255,255,0.07)',
    cardShadow: '0 6px 22px rgba(0,0,0,0.24)',

    accentPrimary: '#E2C36B',
    accentMuted: 'rgba(226,195,107,0.60)',
    accentFaint: 'rgba(226,195,107,0.15)',

    textHeading: '#f3d36b',
    textBody: 'rgba(255,255,255,0.90)',
    textMuted: 'rgba(255,255,255,0.50)',
    textFaint: 'rgba(255,255,255,0.28)',

    mapBg: '#0a0218',
    mapPinFill: '#FFE27A',
    mapPinGlow: 'rgba(255,226,122,0.3)',

    cardAccentApproved: 'rgba(226,195,107,0.5)',
    cardAccentPending: 'rgba(234,179,8,0.4)',

    inputBg: 'rgba(255,255,255,0.07)',
    inputBorder: 'rgba(255,255,255,0.08)',
    inputFocusBorder: 'rgba(226,195,107,0.35)',
    inputFocusGlow: '0 0 0 1px rgba(226,195,107,0.12), 0 0 20px rgba(226,195,107,0.12)',
  },

  /* ─── HONOUR & RECOGNITION ─── */
  honour: {
    key: 'honour',
    label: 'Honour & Recognition',
    description: 'Royal navy, prestige gold, institutional luxury — for dignified occasions',

    pageBg: 'linear-gradient(160deg, #0a0e24 0%, #121a3e 35%, #0e1230 65%, #080c1e 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(8,10,30,0.60) 0%, rgba(8,10,30,0.35) 40%, rgba(8,10,30,0.88) 100%)',
    heroGlow: 'radial-gradient(ellipse at 50% 0%, rgba(184,150,12,0.10) 0%, transparent 55%)',

    cardBg: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(184,150,12,0.10)',
    cardShadow: '0 6px 22px rgba(0,0,0,0.30)',

    accentPrimary: '#C9A84E',
    accentMuted: 'rgba(184,150,12,0.55)',
    accentFaint: 'rgba(184,150,12,0.12)',

    textHeading: '#D4AE2A',
    textBody: 'rgba(255,255,255,0.88)',
    textMuted: 'rgba(255,255,255,0.48)',
    textFaint: 'rgba(255,255,255,0.25)',

    mapBg: '#060a18',
    mapPinFill: '#D4AE2A',
    mapPinGlow: 'rgba(212,174,42,0.3)',

    cardAccentApproved: 'rgba(184,150,12,0.5)',
    cardAccentPending: 'rgba(212,174,42,0.4)',

    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(184,150,12,0.12)',
    inputFocusBorder: 'rgba(184,150,12,0.35)',
    inputFocusGlow: '0 0 0 1px rgba(184,150,12,0.10), 0 0 18px rgba(184,150,12,0.10)',
  },

  /* ─── LEGACY PRESERVATION ─── */
  preservation: {
    key: 'preservation',
    label: 'Legacy Preservation',
    description: 'Archival, documentary, textured warmth — for storytelling and heritage',

    pageBg: 'linear-gradient(160deg, #12100a 0%, #1e1a10 35%, #16130c 65%, #0e0c08 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(14,12,8,0.55) 0%, rgba(14,12,8,0.30) 40%, rgba(14,12,8,0.85) 100%)',
    heroGlow: 'radial-gradient(ellipse at 50% 0%, rgba(196,149,106,0.10) 0%, transparent 55%)',

    cardBg: 'rgba(255,248,235,0.04)',
    cardBorder: 'rgba(196,149,106,0.10)',
    cardShadow: '0 6px 22px rgba(0,0,0,0.28)',

    accentPrimary: '#C4956A',
    accentMuted: 'rgba(196,149,106,0.55)',
    accentFaint: 'rgba(196,149,106,0.12)',

    textHeading: '#D4A87A',
    textBody: 'rgba(255,248,235,0.88)',
    textMuted: 'rgba(255,248,235,0.48)',
    textFaint: 'rgba(255,248,235,0.25)',

    mapBg: '#0a0806',
    mapPinFill: '#D4A87A',
    mapPinGlow: 'rgba(212,168,122,0.3)',

    cardAccentApproved: 'rgba(196,149,106,0.5)',
    cardAccentPending: 'rgba(212,168,122,0.4)',

    inputBg: 'rgba(255,248,235,0.05)',
    inputBorder: 'rgba(196,149,106,0.10)',
    inputFocusBorder: 'rgba(196,149,106,0.30)',
    inputFocusGlow: '0 0 0 1px rgba(196,149,106,0.10), 0 0 18px rgba(196,149,106,0.10)',
  },

  /* ─── MEMORIALIZATION ─── */
  memorial: {
    key: 'memorial',
    label: 'Memorialization',
    description: 'Restrained, spiritual, midnight depth — for remembrance and honour',

    pageBg: 'linear-gradient(160deg, #08060e 0%, #100d1e 35%, #0c0a16 65%, #060510 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(6,5,14,0.60) 0%, rgba(6,5,14,0.35) 40%, rgba(6,5,14,0.90) 100%)',
    heroGlow: 'radial-gradient(ellipse at 50% 0%, rgba(200,190,220,0.06) 0%, transparent 55%)',

    cardBg: 'rgba(255,255,255,0.035)',
    cardBorder: 'rgba(200,190,220,0.08)',
    cardShadow: '0 6px 22px rgba(0,0,0,0.35)',

    accentPrimary: '#B8A8D4',
    accentMuted: 'rgba(200,190,220,0.50)',
    accentFaint: 'rgba(200,190,220,0.10)',

    textHeading: '#C8BEE0',
    textBody: 'rgba(255,255,255,0.85)',
    textMuted: 'rgba(255,255,255,0.45)',
    textFaint: 'rgba(255,255,255,0.22)',

    mapBg: '#04030a',
    mapPinFill: '#C8BEE0',
    mapPinGlow: 'rgba(200,190,220,0.25)',

    cardAccentApproved: 'rgba(200,190,220,0.4)',
    cardAccentPending: 'rgba(180,170,210,0.3)',

    inputBg: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(200,190,220,0.08)',
    inputFocusBorder: 'rgba(200,190,220,0.25)',
    inputFocusGlow: '0 0 0 1px rgba(200,190,220,0.08), 0 0 16px rgba(200,190,220,0.08)',
  },
}

/* =========================================================
   SECTION 4 — EVENT TYPE → DEFAULT THEME MAPPING
========================================================= */
const EVENT_TYPE_THEME: Record<string, ThemeKey> = {
  'Wedding':              'celebration',
  'Milestone Birthday':   'celebration',
  'Anniversary':          'celebration',
  'Graduation':           'celebration',
  'Retirement':           'honour',
  'Award Ceremony':       'honour',
  'Chieftaincy Ceremony': 'honour',
  'Ordination':           'honour',
  'Conference':           'honour',
  'Thanksgiving Service': 'honour',
  'Memorial & Funeral':   'memorial',
  'Other':                'preservation',
}

/* =========================================================
   SECTION 5 — RESOLVER + GETTER
========================================================= */

/**
 * Resolve which theme to use.
 * - If capsule.theme is a valid ThemeKey → use it (manual override)
 * - If capsule.theme is 'classic' or null → auto-detect from event type
 */
export function resolveTheme(
  capsuleTheme: string | null | undefined,
  eventType: string
): ThemeKey {
  // Manual override — organiser selected a specific theme
  if (capsuleTheme && capsuleTheme in THEMES) {
    return capsuleTheme as ThemeKey
  }
  // Auto-detect from event type
  return EVENT_TYPE_THEME[eventType] ?? 'celebration'
}

/**
 * Get the full theme config for a resolved key.
 */
export function getThemeConfig(key: ThemeKey): ThemeConfig {
  return THEMES[key]
}

/**
 * Get all available themes — for the control dash picker.
 */
export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES)
}

/**
 * Get the default theme key for an event type — for display in control dash.
 */
export function getDefaultThemeForEvent(eventType: string): ThemeKey {
  return EVENT_TYPE_THEME[eventType] ?? 'celebration'
}
