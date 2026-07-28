// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/utils/getParticipationLanguage.ts
// PURPOSE: Participation Language Engine — Layer 1 event type router.
//          Maps real-world event_type strings (from the database) to
//          clean internal category keys, then looks up language from config.
//
// WHY TWO LAYERS:
//   The database stores human-readable event types like 'Memorial & Funeral',
//   'Milestone Birthday', 'Thanksgiving Service'. These do not match the
//   clean category keys in PARTICIPATION_LANGUAGE directly.
//   This file is the only place that knows about those messy strings.
//
// ADDING NEW EVENT TYPES:
//   1. Add a mapping in EVENT_TYPE_TO_CATEGORY below
//   2. If a new category key is needed, add it to participationLanguage.ts
//   Otherwise, reuse an existing category key.
//
// BUILT BY: AI12 · Claude Sonnet 4.6 · 22 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { PARTICIPATION_LANGUAGE, ParticipationLanguage } from '@/lib/config/participationLanguage'

// ═══ SECTION 1 — Event type router ═══
// Maps normalised event_type strings → category keys.
// All keys are lowercase after normalisation (trim + toLowerCase).
// Partial matches are intentional — e.g. 'birthday' catches both
// 'Birthday' and 'Milestone Birthday'.

const EVENT_TYPE_TO_CATEGORY: Record<string, keyof typeof PARTICIPATION_LANGUAGE> = {
  // Memorial
  'memorial & funeral':    'memorial',
  'memorial':              'memorial',
  'funeral':               'memorial',

  // Retirement
  'retirement':            'retirement',

  // Birthday (all milestone levels share the same language)
  'milestone birthday':    'birthday',
  'birthday':              'birthday',

  // Wedding
  'wedding':               'wedding',

  // Graduation
  'graduation':            'graduation',

  // Anniversary
  'anniversary':           'anniversary',

  // Award
  'award ceremony':        'award',
  'award':                 'award',

  // Ordination
  'ordination':            'ordination',

  // Chieftaincy
  'chieftaincy':           'chieftaincy',

  // Thanksgiving
  'thanksgiving service':  'thanksgiving',
  'thanksgiving':          'thanksgiving',

  // Conference / Other — fall to default
  'conference':            'default',
  'other event':           'default',
}

// ═══ SECTION 2 — Resolver ═══

export function getParticipationLanguage(eventType?: string | null): ParticipationLanguage {
  if (!eventType) return PARTICIPATION_LANGUAGE.default

  const normalised = eventType.trim().toLowerCase()

  // Direct match first (most specific)
  const directKey = EVENT_TYPE_TO_CATEGORY[normalised]
  if (directKey) return PARTICIPATION_LANGUAGE[directKey]

  // Partial match fallback — handles custom event types that contain
  // a known keyword (e.g. "Bishop's Ordination" contains "ordination")
  for (const [pattern, categoryKey] of Object.entries(EVENT_TYPE_TO_CATEGORY)) {
    if (normalised.includes(pattern)) {
      return PARTICIPATION_LANGUAGE[categoryKey]
    }
  }

  // Final fallback
  return PARTICIPATION_LANGUAGE.default
}

// ═══ SECTION 3 — Count display helper ═══
// Handles the singular === plural case (Congratulations, Gratitude).
// Always use plural when singular === plural to avoid "1 Congratulations".

export function formatParticipationCount(
  count: number,
  language: ParticipationLanguage
): string {
  if (language.singular === language.plural) return language.plural
  return count === 1 ? language.singular : language.plural
}
