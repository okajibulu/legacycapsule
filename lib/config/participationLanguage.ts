// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/config/participationLanguage.ts
// PURPOSE: Participation Language Engine — maps event categories to UI strings.
//          This is a presentation-layer config only.
//          Backend data model (Contribution, Contributor) is never renamed.
//
// ARCHITECTURE NOTES:
//   Layer 1 — Event type routing lives in lib/utils/getParticipationLanguage.ts
//   Layer 2 — This file: clean category keys → language strings
//   Layer 3 — Future: lib/config/globalExpressions.ts uses expressionCategory
//             to select rotating multilingual expression pools
//
// GLOBAL EXPRESSIONS (future):
//   The `expressionCategory` field is a stable hook for the future engine.
//   It maps each event category to a curated expression pool.
//   Do not remove this field. The rotating display will consume it.
//   The CTA never rotates — only the expressions strip does.
//
// DISPLAY RULE for singular === plural (Congratulations, Gratitude):
//   Always render the plural form regardless of count.
//   e.g. "1 Congratulations shared" — handled in the component, not here.
//
// BUILT BY: AI12 · Claude Sonnet 4.6 · 22 July 2026
// UPDATED:  AI21 · Claude Opus 4.6 · 16 August 2026 (v2.12.08)
//           — submitLabel added to ParticipationLanguage interface
//           — submitLabel populated for all 11 event categories
//           — First-person, shorter register than cta — used on form submit button
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Interface ═══

export interface ParticipationLanguage {
  // Wall display
  wallTitle:          string   // e.g. "Tribute Wall", "Appreciation Wall"
  // Call to action
  cta:                string   // e.g. "Leave a Tribute" — always stable, never rotates
  // Submit button label — first-person, shorter than cta, appears on the form submit button
  submitLabel:        string   // e.g. "Add my tribute", "Share my blessing"
  // Count display
  singular:           string   // e.g. "Tribute", "Wish"
  plural:             string   // e.g. "Tributes", "Wishes"
  // Future Global Expressions hook — do not remove
  expressionCategory: string   // e.g. "memorial", "celebration" — consumed by future engine
}

// ═══ SECTION 2 — Language Map ═══
// Keys are clean internal category identifiers.
// Real-world event_type strings are mapped to these keys in getParticipationLanguage.ts.

export const PARTICIPATION_LANGUAGE: Record<string, ParticipationLanguage> = {

  // ── Memorial & Funeral ──────────────────────────────────────────────────────
  // "Tribute" is reserved exclusively for memorial experiences.
  memorial: {
    wallTitle:          'Tribute Wall',
    cta:                'Leave a Tribute',
    submitLabel:        'Add my tribute',
    singular:           'Tribute',
    plural:             'Tributes',
    expressionCategory: 'memorial',
  },

  // ── Retirement ──────────────────────────────────────────────────────────────
  retirement: {
    wallTitle:          'Appreciation Wall',
    cta:                'Share Your Appreciation',
    submitLabel:        'Share my appreciation',
    singular:           'Appreciation',
    plural:             'Appreciations',
    expressionCategory: 'appreciation',
  },

  // ── Birthday (all milestone levels) ────────────────────────────────────────
  birthday: {
    wallTitle:          'Encomium Wall',
    cta:                'Share Your Encomium',
    submitLabel:        'Share my encomium',
    singular:           'Encomium',
    plural:             'Encomiums',
    expressionCategory: 'birthday',
  },

  // ── Wedding ─────────────────────────────────────────────────────────────────
  wedding: {
    wallTitle:          'Blessings Wall',
    cta:                'Share Your Blessing',
    submitLabel:        'Share my blessing',
    singular:           'Blessing',
    plural:             'Blessings',
    expressionCategory: 'celebration',
  },

  // ── Graduation ──────────────────────────────────────────────────────────────
  // singular === plural by design. Component applies display rule.
  graduation: {
    wallTitle:          'Congratulations Wall',
    cta:                'Send Your Congratulations',
    submitLabel:        'Send my congratulations',
    singular:           'Congratulations',
    plural:             'Congratulations',
    expressionCategory: 'achievement',
  },

  // ── Anniversary ─────────────────────────────────────────────────────────────
  // singular === plural by design. Component applies display rule.
  anniversary: {
    wallTitle:          'Congratulation Wall',
    cta:                'Share Your Congratulations',
    submitLabel:        'Share my congratulations',
    singular:           'Congratulation',
    plural:             'Congratulations',
    expressionCategory: 'celebration',
  },

  // ── Award Ceremony ──────────────────────────────────────────────────────────
  award: {
    wallTitle:          'Encomium Wall',
    cta:                'Share Your Encomium',
    submitLabel:        'Share my encomium',
    singular:           'Encomium',
    plural:             'Encomiums',
    expressionCategory: 'achievement',
  },

  // ── Ordination ──────────────────────────────────────────────────────────────
  ordination: {
    wallTitle:          'Blessings Wall',
    cta:                'Offer Your Blessing',
    submitLabel:        'Offer my blessing',
    singular:           'Blessing',
    plural:             'Blessings',
    expressionCategory: 'celebration',
  },

  // ── Chieftaincy ─────────────────────────────────────────────────────────────
  chieftaincy: {
    wallTitle:          'Encomium Wall',
    cta:                'Share Your Encomium',
    submitLabel:        'Share my encomium',
    singular:           'Encomium',
    plural:             'Encomiums',
    expressionCategory: 'chieftaincy',
  },

  // ── Thanksgiving Service ────────────────────────────────────────────────────
  // singular === plural by design. Component applies display rule.
  thanksgiving: {
    wallTitle:          'Gratitude Wall',
    cta:                'Share Your Gratitude',
    submitLabel:        'Share my gratitude',
    singular:           'Gratitude',
    plural:             'Gratitude',
    expressionCategory: 'appreciation',
  },

  // ── Default (Conference, Other Event, unknown) ──────────────────────────────
  default: {
    wallTitle:          'Celebration Wall',
    cta:                'Leave a Message',
    submitLabel:        'Add my message',
    singular:           'Message',
    plural:             'Messages',
    expressionCategory: 'celebration',
  },

} as const