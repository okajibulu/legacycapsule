// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/og/CoverThemeResolver.ts
// PURPOSE: Map event categories to OG cover theme tokens (OG02 Section 7)
// Used by: app/api/og/[slug]/route.tsx, components/og/*
// SERVER-SIDE ONLY — used in Edge runtime, no client imports
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Cover theme type
// ─────────────────────────────────────────────────────────────────────────────

export interface CoverTheme {
  /** Background gradient — CSS linear-gradient string for Satori */
  bgGradient: string
  /** Top accent colour — used for spine and decorative rules */
  accent: string
  /** Secondary / muted accent — used for subtitle, context line */
  accentMuted: string
  /** Primary text colour — honouree name */
  textPrimary: string
  /** Secondary text colour — event context, stats */
  textSecondary: string
  /** Faint text — footer, masthead */
  textFaint: string
  /** Spine left strip colour */
  spineColor: string
  /** Ornament character for event type */
  ornament: string
  /** Mood descriptor (for internal documentation) */
  mood: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Theme definitions per event category
// OG02 Section 7: "consistency without uniformity"
// Each feels distinctly different while belonging to the same family
// ─────────────────────────────────────────────────────────────────────────────

const COVER_THEMES: Record<string, CoverTheme> = {
  // ── Memorial & Funeral — Elegant, Reflective, Charcoal / Gold ──────────────
  'Memorial & Funeral': {
    bgGradient: 'linear-gradient(160deg, #1C1C1E 0%, #2A2A2E 40%, #1A1A1C 100%)',
    accent: '#C8A96E',
    accentMuted: '#9A8060',
    textPrimary: '#F5F0E8',
    textSecondary: '#B8B0A0',
    textFaint: '#706860',
    spineColor: '#C8A96E',
    ornament: '🕊',
    mood: 'Reflective · Charcoal · Gold',
  },

  // ── Wedding — Warm, Celebratory, Champagne / Ivory ────────────────────────
  'Wedding': {
    bgGradient: 'linear-gradient(160deg, #2A1F18 0%, #1E1510 40%, #241C14 100%)',
    accent: '#D4AE6A',
    accentMuted: '#A08050',
    textPrimary: '#FAF5EE',
    textSecondary: '#C8B898',
    textFaint: '#806850',
    spineColor: '#D4AE6A',
    ornament: '💍',
    mood: 'Warm · Champagne · Ivory',
  },

  // ── Retirement — Distinguished, Accomplishment-focused, Navy / Gold ────────
  'Retirement': {
    bgGradient: 'linear-gradient(160deg, #0D1B3E 0%, #162240 40%, #0A1530 100%)',
    accent: '#E2C36B',
    accentMuted: '#A89050',
    textPrimary: '#F0EAD8',
    textSecondary: '#B8A880',
    textFaint: '#607090',
    spineColor: '#E2C36B',
    ornament: '🏅',
    mood: 'Distinguished · Navy · Gold',
  },

  // ── Milestone Birthday — Premium Celebration, Deep Plum / Gold ────────────
  'Milestone Birthday': {
    bgGradient: 'linear-gradient(160deg, #1E0A3C 0%, #2A1050 40%, #18083A 100%)',
    accent: '#E8C870',
    accentMuted: '#A88C50',
    textPrimary: '#F8F0FF',
    textSecondary: '#C0A8E0',
    textFaint: '#806890',
    spineColor: '#E8C870',
    ornament: '🎂',
    mood: 'Celebratory · Deep Plum · Gold',
  },

  // ── Anniversary — Warm, Romantic, Burgundy / Rose Gold ────────────────────
  'Anniversary': {
    bgGradient: 'linear-gradient(160deg, #1A0810 0%, #280C18 40%, #160810 100%)',
    accent: '#E0A08A',
    accentMuted: '#A87060',
    textPrimary: '#FAF0EC',
    textSecondary: '#C09080',
    textFaint: '#806870',
    spineColor: '#E0A08A',
    ornament: '💛',
    mood: 'Romantic · Burgundy · Rose Gold',
  },

  // ── Graduation — Accomplished, Forward-looking, Midnight / Gold ───────────
  'Graduation': {
    bgGradient: 'linear-gradient(160deg, #0A1A2E 0%, #12233A 40%, #081525 100%)',
    accent: '#F0C84A',
    accentMuted: '#B09030',
    textPrimary: '#F5F0E0',
    textSecondary: '#B8A870',
    textFaint: '#587090',
    spineColor: '#F0C84A',
    ornament: '🎓',
    mood: 'Accomplished · Midnight · Gold',
  },

  // ── Ordination — Reverent, Spiritual, Forest / Sacred Gold ───────────────
  'Ordination': {
    bgGradient: 'linear-gradient(160deg, #0C1E14 0%, #122018 40%, #0A1810 100%)',
    accent: '#C8A850',
    accentMuted: '#907830',
    textPrimary: '#F0EEE0',
    textSecondary: '#A0A880',
    textFaint: '#607060',
    spineColor: '#C8A850',
    ornament: '✝',
    mood: 'Reverent · Forest · Sacred Gold',
  },

  // ── Chieftaincy Ceremony — Regal, Cultural, Deep Royal / Gold ─────────────
  'Chieftaincy Ceremony': {
    bgGradient: 'linear-gradient(160deg, #1A0C0A 0%, #281408 40%, #180E06 100%)',
    accent: '#F0C030',
    accentMuted: '#B08020',
    textPrimary: '#FFF8E8',
    textSecondary: '#D4A840',
    textFaint: '#806040',
    spineColor: '#F0C030',
    ornament: '👑',
    mood: 'Regal · Deep Royal · Gold',
  },

  // ── Award Ceremony — Executive, Editorial, Graphite / Bronze ─────────────
  'Award Ceremony': {
    bgGradient: 'linear-gradient(160deg, #181818 0%, #222222 40%, #141414 100%)',
    accent: '#C88840',
    accentMuted: '#907030',
    textPrimary: '#F0EAE0',
    textSecondary: '#A09080',
    textFaint: '#686060',
    spineColor: '#C88840',
    ornament: '🏆',
    mood: 'Executive · Graphite · Bronze',
  },

  // ── Thanksgiving Service — Warm, Family-Oriented, Warm Brown / Gold ────────
  'Thanksgiving Service': {
    bgGradient: 'linear-gradient(160deg, #1A1008 0%, #241808 40%, #180E06 100%)',
    accent: '#D4A050',
    accentMuted: '#987030',
    textPrimary: '#FAF0E0',
    textSecondary: '#C0A070',
    textFaint: '#806840',
    spineColor: '#D4A050',
    ornament: '🙏',
    mood: 'Warm · Family · Gold',
  },

  // ── Conference — Corporate, Editorial, Steel / Bright Gold ────────────────
  'Conference': {
    bgGradient: 'linear-gradient(160deg, #101828 0%, #162030 40%, #0C1422 100%)',
    accent: '#E8CC50',
    accentMuted: '#A89030',
    textPrimary: '#F0EEF8',
    textSecondary: '#A0A8C0',
    textFaint: '#5868A0',
    spineColor: '#E8CC50',
    ornament: '🎙',
    mood: 'Corporate · Steel · Bright Gold',
  },

  // ── Other / Default — Universal, Premium, Deep Purple / Antique Gold ───────
  'Other': {
    bgGradient: 'linear-gradient(160deg, #110824 0%, #1A0F3A 40%, #0E0820 100%)',
    accent: '#E2C36B',
    accentMuted: '#A88C48',
    textPrimary: '#F4F0FA',
    textSecondary: '#B8A8D0',
    textFaint: '#706888',
    spineColor: '#E2C36B',
    ornament: '✦',
    mood: 'Universal · Deep Purple · Antique Gold',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a CoverTheme for a given event type string.
 * Falls back to 'Other' theme for unknown event types.
 */
export function resolveCoverTheme(eventType: string | null | undefined): CoverTheme {
  if (!eventType) return COVER_THEMES['Other']
  return COVER_THEMES[eventType] ?? COVER_THEMES['Other']
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Participation prompt system (OG02 Section 5A)
// Context-aware CTAs — never sales-oriented
// ─────────────────────────────────────────────────────────────────────────────

const PARTICIPATION_PROMPTS: Record<string, string> = {
  'Memorial & Funeral': 'Share a Memory',
  'Wedding': 'Join the Celebration',
  'Retirement': 'Leave a Tribute',
  'Milestone Birthday': 'Add Your Voice',
  'Anniversary': 'Share a Memory',
  'Graduation': 'Add Your Voice',
  'Ordination': 'Leave a Tribute',
  'Chieftaincy Ceremony': 'Honour the Occasion',
  'Award Ceremony': 'Add Your Voice',
  'Thanksgiving Service': 'Share a Memory',
  'Conference': 'Leave a Contribution',
  'Other': 'Add Your Voice',
}

/**
 * Returns a context-aware participation CTA for the cover.
 * Event-aware, never sales-oriented (OG02 Section 5A).
 */
export function getParticipationPrompt(eventType: string | null | undefined): string {
  if (!eventType) return 'Add Your Voice'
  return PARTICIPATION_PROMPTS[eventType] ?? 'Add Your Voice'
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Legacy statement pool (OG02 Level 6)
// ─────────────────────────────────────────────────────────────────────────────

const LEGACY_STATEMENTS: Record<string, string> = {
  'Memorial & Funeral': 'Voices gathered from around the world.',
  'Wedding': 'A collection of love, memories and well-wishes.',
  'Retirement': 'Stories and tributes spanning a lifetime of service.',
  'Milestone Birthday': 'A growing record of voices and memories.',
  'Anniversary': 'Memories preserved across the years.',
  'Graduation': 'A legacy of achievement, told by those who know it best.',
  'Ordination': 'A community gathered to bear witness.',
  'Chieftaincy Ceremony': 'An occasion honoured by many voices.',
  'Award Ceremony': 'Recognition preserved for generations.',
  'Thanksgiving Service': 'Gratitude expressed from every corner.',
  'Conference': 'Contributions and perspectives, brought together.',
  'Other': 'A growing collection of voices.',
}

export function getLegacyStatement(eventType: string | null | undefined): string {
  if (!eventType) return 'A growing collection of voices.'
  return LEGACY_STATEMENTS[eventType] ?? 'A growing collection of voices.'
}
