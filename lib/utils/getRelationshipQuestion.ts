// ============================================================
// FILE PATH: lib/utils/getRelationshipQuestion.ts
// PURPOSE:   Event-aware relationship question and options.
//            Returns the correct question phrasing per event type
//            and a filtered options list with gated entries.
//            Prevents cultural missteps ("Who is His to you?")
//            and inappropriate options per event context.
// ARCHITECTURE: Participation Language Engine — layer 2 extension
// BUILT BY:  AI16 · Claude Sonnet 4.6
// VERSION:   v2.11.54
// DATE:      9 August 2026
// ============================================================

// ═══ SECTION 1 — Honorific prefix list ═══
// Used to skip titles when extracting a familiar name from full honouree name.

const HONORIFIC_PREFIXES = new Set([
  'his', 'her', 'their', 'hm', 'hrh', 'hhh',
  'prof', 'prof.', 'dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.',
  'rev', 'rev.', 'pastor', 'bishop', 'deacon', 'elder',
  'chief', 'oba', 'alhaji', 'alhaja', 'otunba',
  'engineer', 'engr', 'engr.',
  'barrister', 'barr', 'barr.',
  'justice', 'judge', 'hon', 'hon.',
  'royal', 'highness', 'excellency', 'majesty',
  'sir', 'dame', 'lord', 'lady',
])

// ═══ SECTION 2 — Familiar name extractor ═══
// Returns first non-honorific word from a full name.
// "His Royal Highness Shadamoro" → "Shadamoro"
// "Prof. Adewale Adesina" → "Adewale"
// "Julius Ajibulu" → "Julius"

export function getFamiliarName(fullName: string): string {
  const words = fullName.trim().split(/\s+/)
  for (const word of words) {
    if (!HONORIFIC_PREFIXES.has(word.toLowerCase().replace(/\.$/, ''))) {
      return word
    }
  }
  // Fallback: last word if all words are honorifics
  return words[words.length - 1] ?? fullName
}

// ═══ SECTION 3 — Event-aware relationship question ═══
// Returns the correct question for the relationship selector
// based on event type and honouree name.

export function getRelationshipQuestion(
  eventType: string,
  honoureeName: string
): string {
  const e = (eventType ?? '').toLowerCase()

  // Memorial — full name, past tense, dignified
  if (e.includes('memorial') || e.includes('funeral')) {
    return `Who was ${honoureeName} to you?`
  }

  // Retirement — role-based, respectful
  if (e.includes('retirement')) {
    return 'Who is the retiree to you?'
  }

  // Birthday / Thanksgiving — "celebrant" avoids using name for elders
  if (e.includes('birthday') || e.includes('thanksgiving')) {
    return 'Who is the celebrant to you?'
  }

  // Wedding / Anniversary — couple framing, question inverted
  if (e.includes('wedding') || e.includes('anniversary')) {
    return 'Who are you to the couple?'
  }

  // Chieftaincy / Ordination / Award — formal honouree framing
  if (
    e.includes('chieftaincy') ||
    e.includes('ordination') ||
    e.includes('award')
  ) {
    return 'Who is the honouree to you?'
  }

  // Graduation — role-based
  if (e.includes('graduation')) {
    return 'Who is the graduate to you?'
  }

  // Default — familiar name extraction (skips honorifics)
  return `Who is ${getFamiliarName(honoureeName)} to you?`
}

// ═══ SECTION 4 — Relationship options lists ═══

// General options — shown for all non-wedding event types
const GENERAL_RELATIONSHIP_OPTIONS = [
  'Son/Daughter',
  'Parent (Mother/Father)',
  'Sibling (Brother/Sister)',
  'Grandchild',
  'Grandparent',
  'Spouse/Partner',
  'Former Spouse/Partner',
  'Extended Family',
  'In-Law',
  'Father/Mother Figure',
  'Friend',
  'Close Friend',
  'Acquaintance',
  'Neighbour',
  'Classmate/Alumni',
  'Community Member',
  'Team/Club Member',
  'Faith/Spiritual Connection',
  'Colleague/Work Connection',
  'Mentor/Teacher',
  'Student/Mentee',
  'Community Leader',
  'Supporter/Well-wisher',
  'Other',
]

// Gated options — only shown for specific event types
const GATED_OPTIONS: Record<string, string[]> = {
  'Legacy Beneficiary':       ['memorial', 'retirement', 'chieftaincy'],
  'Caregiver/Healthcare Worker': ['memorial', 'retirement'],
}

// Wedding / Anniversary options — couple-aware
const WEDDING_RELATIONSHIP_OPTIONS = [
  'Friend of the Couple',
  'Friend of the Bride',
  'Friend of the Groom',
  'Parent of the Bride',
  'Parent of the Groom',
  'Sibling of the Bride',
  'Sibling of the Groom',
  'Grandparent',
  'Extended Family',
  'In-Law',
  'Best Man / Maid of Honour',
  'Groomsman / Bridesmaid',
  'Colleague/Work Connection',
  'Classmate/Alumni',
  'Community Member',
  'Faith/Spiritual Connection',
  'Mentor/Teacher',
  'Supporter/Well-wisher',
  'Other',
]

// ═══ SECTION 5 — Options resolver ═══
// Returns the correct options list for the event type,
// including gated options where applicable.

export function getRelationshipOptions(eventType: string): string[] {
  const e = (eventType ?? '').toLowerCase()

  // Wedding and anniversary use couple-specific list
  if (e.includes('wedding') || e.includes('anniversary')) {
    return WEDDING_RELATIONSHIP_OPTIONS
  }

  // All other event types: general list + applicable gated options
  const gated = Object.entries(GATED_OPTIONS)
    .filter(([, types]) => types.some(t => e.includes(t)))
    .map(([option]) => option)

  // Insert gated options before 'Supporter/Well-wisher'
  const base = [...GENERAL_RELATIONSHIP_OPTIONS]
  const insertAt = base.indexOf('Supporter/Well-wisher')
  if (insertAt !== -1 && gated.length > 0) {
    base.splice(insertAt, 0, ...gated)
  }

  return base
}
