/**
 * ============================================================
 * LEGACYCAPSULE — lib/eventLabels.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Single source of truth for all event-type-aware language.
 *
 * Rules:
 *   - "Honouree" is INTERNAL language only (D24). Never returned
 *     by any function here for public-facing use.
 *   - All public-facing references use the subject's name or
 *     an event-type-appropriate phrase.
 *   - Import this file in both server and client components —
 *     it contains no server-only imports.
 */

// ============================================================
// SECTION 1 — Event type union
// Matches all 12 supported event types exactly as stored
// in capsules.event_type
// ============================================================

export type EventType =
  | 'retirement'
  | 'memorial'
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'ordination'
  | 'chieftaincy'
  | 'award_ceremony'
  | 'religious_service'
  | 'conference'
  | 'other';


// ============================================================
// SECTION 2 — Subject role labels
//
// How the subject is referred to in public-facing UI.
// Never use "honouree" in any of these.
// ============================================================

const SUBJECT_ROLE: Record<EventType, string> = {
  retirement:        'the retiree',
  memorial:          'the one being remembered',
  wedding:           'the couple',
  birthday:          'the celebrant',
  anniversary:       'the couple',
  graduation:        'the graduate',
  ordination:        'the ordinand',
  chieftaincy:       'the new chief',
  award_ceremony:    'the awardee',
  religious_service: 'the family',
  conference:        'the organisers',
  other:             'the subject',
};

/**
 * Returns how the subject is referred to in public UI.
 * e.g. "the retiree", "the couple", "the graduate"
 */
export function getSubjectRole(eventType: EventType | string): string {
  return SUBJECT_ROLE[eventType as EventType] ?? 'the subject';
}


// ============================================================
// SECTION 3 — Ways to Honour section labels (D18)
//
// getWaysToHonourLabel(eventType, name) — never "Donate" or
// "Gift Fund". Event-type-specific, name-inclusive phrasing.
// ============================================================

/**
 * Returns the section heading for the Ways to Honour section
 * on the public profile page.
 *
 * @param eventType  The capsule event type
 * @param name       The subject's name (honouree_name from capsules)
 */
export function getWaysToHonourLabel(
  eventType: EventType | string,
  name: string
): string {
  const firstName = name.split(' ')[0];

  const labels: Record<EventType, string> = {
    retirement:        `Ways to honour ${firstName}`,
    memorial:          `Ways to remember ${firstName}`,
    wedding:           `Ways to celebrate the couple`,
    birthday:          `Ways to celebrate ${firstName}`,
    anniversary:       `Ways to celebrate this milestone`,
    graduation:        `Ways to support ${firstName}`,
    ordination:        `Ways to support ${firstName}'s ministry`,
    chieftaincy:       `Ways to honour ${firstName}`,
    award_ceremony:    `Ways to celebrate ${firstName}`,
    religious_service: `Ways to support the family`,
    conference:        `Ways to support this event`,
    other:             `Ways to honour ${firstName}`,
  };

  return labels[eventType as EventType] ?? `Ways to honour ${firstName}`;
}

/**
 * Returns the button label for the "I've sent a gift" action.
 * Contextually appropriate per event type.
   */
export function getGiftAcknowledgeLabel(eventType: EventType | string): string {
  const labels: Record<EventType, string> = {
    retirement:        "I've sent a retirement gift",
    memorial:          "I've made a contribution in their memory",
    wedding:           "I've sent a wedding gift",
    birthday:          "I've sent a birthday gift",
    anniversary:       "I've sent a celebration gift",
    graduation:        "I've sent a graduation gift",
    ordination:        "I've made a contribution",
    chieftaincy:       "I've sent a gift",
    award_ceremony:    "I've sent a congratulatory gift",
    religious_service: "I've made a contribution",
    conference:        "I've made a contribution",
    other:             "I've sent a gift",
  };
  return labels[eventType as EventType] ?? "I've sent a gift";
}


// ============================================================
// SECTION 4 — Appreciation email FROM name (D59)
//
// Event-type-aware FROM display name for appreciation emails.
// memorial/funeral: family rep leads — deceased cannot appear as sender.
// conference: rep name leads — institutional event.
// All others: honouree name + "via LegacyCapsule".
// ============================================================

/**
 * Returns the FROM display name for appreciation emails.
 *
 * @param eventType     capsule event type
 * @param honoureeName  value from capsules.honouree_name
 * @param familyRepName value from capsules.family_rep_name (may be null)
 */
export function getAppreciationFromName(
  eventType: EventType | string,
  honoureeName: string,
  familyRepName: string | null
): string {
  const rep = familyRepName ?? honoureeName;

  switch (eventType as EventType) {
    case 'memorial': {
      // Extract surname as last word of honouree name
      const parts   = honoureeName.trim().split(/\s+/);
      const surname  = parts.length > 1 ? parts[parts.length - 1] : honoureeName;
      return `${rep}, on behalf of the ${surname} family via LegacyCapsule`;
    }

    case 'conference':
      // Rep leads; honoureeName is the conference/event name
      return `${rep}, ${honoureeName} via LegacyCapsule`;

    default:
      return `${honoureeName} via LegacyCapsule`;
  }
}

/**
 * Returns the appreciation email subject line.
 * References the honouree by name in all event types —
 * even for memorial, the subject line names the person being honoured.
 * Only the FROM sender field changes for memorial (D59).
 */
export function getAppreciationSubject(honoureeName: string): string {
  return `A personal note from ${honoureeName}`;
}


// ============================================================
// SECTION 5 — Profile page section labels
//
// Human-readable labels for capsule_profile_sections.section_type
// ============================================================

export const PROFILE_SECTION_LABELS: Record<string, string> = {
  about:                'About',
  career_legacy:        'Career & Legacy',
  years_of_service:     'Years of Service',
  the_journey:          'The Journey',
  in_their_own_words:   'In Their Own Words',
  family_roots:         'Family & Roots',
  faith_values:         'Faith & Values',
  congregation_tribute: 'Congregation Tribute',
  custom:               'Custom Section',
};

export function getProfileSectionLabel(sectionType: string, customTitle?: string | null): string {
  if (sectionType === 'custom' && customTitle) return customTitle;
  return PROFILE_SECTION_LABELS[sectionType] ?? sectionType;
}


// ============================================================
// SECTION 6 — Event type display labels and emoji
// ============================================================

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  retirement:        'Retirement',
  memorial:          'Memorial',
  wedding:           'Wedding',
  birthday:          'Milestone Birthday',
  anniversary:       'Anniversary',
  graduation:        'Graduation',
  ordination:        'Ordination',
  chieftaincy:       'Chieftaincy Ceremony',
  award_ceremony:    'Award Ceremony',
  religious_service: 'Thanksgiving Service',
  conference:        'Conference',
  other:             'Special Event',
};

export const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  retirement:        '🎖️',
  memorial:          '🕊️',
  wedding:           '💍',
  birthday:          '🎂',
  anniversary:       '✨',
  graduation:        '🎓',
  ordination:        '✝️',
  chieftaincy:       '👑',
  award_ceremony:    '🏆',
  religious_service: '🙏',
  conference:        '🎙️',
  other:             '⭐',
};

export function getEventTypeLabel(eventType: EventType | string): string {
  return EVENT_TYPE_LABELS[eventType as EventType] ?? 'Special Event';
}

export function getEventTypeEmoji(eventType: EventType | string): string {
  return EVENT_TYPE_EMOJI[eventType as EventType] ?? '⭐';

}

/**
 * Returns the opening line of a collective appreciation email.
 *
 * @param eventType       capsule event type
 * @param honoureeName    subject name
 * @param totalCount      total contributors
 * @param countryCount    number of countries represented
 * @param reachableCount  contributors with email (can receive)
 */
export function getCollectiveOpeningLine(
  eventType: EventType | string,
  honoureeName: string,
  totalCount: number,
  countryCount: number,
  reachableCount: number
): string {
  const firstName    = honoureeName.split(' ')[0];
  const countryPhrase = countryCount === 1
    ? 'one country'
    : `${countryCount} countries`;

  const unreachable = totalCount - reachableCount;
  const allPhrase   = unreachable > 0
    ? `all ${totalCount} of you — including ${unreachable} who contributed anonymously`
    : `all ${totalCount} of you`;

  switch (eventType as EventType) {
    case 'memorial':
      return `To ${allPhrase} who sent words of remembrance for ${firstName} from ${countryPhrase} — this means more than you know.`;
    case 'wedding':
      return `To ${allPhrase} who celebrated with us from ${countryPhrase} — your words will stay with us always.`;
    case 'religious_service':
      return `To ${allPhrase} who lifted their voices for this occasion from ${countryPhrase} — we are deeply grateful.`;
    default:
      return `To ${allPhrase} who sent words from ${countryPhrase} — ${firstName} is deeply moved by every single one.`;
  }
}


// ============================================================
// BACKWARDS-COMPATIBILITY HELPERS
// Some older modules import a set of helper names that
// expect human-readable event type strings (e.g. 'Memorial & Funeral',
// 'Wedding'). Provide small wrappers that are tolerant of both
// internal keys and human-readable labels.
// ============================================================

function norm(ev: string | undefined): string {
  return (ev || '').toLowerCase()
}

export function getTributePageTitle(eventType: string, name: string): string {
  const e = norm(eventType)
  if (e.includes('memorial')) return `In Memory of ${name}`
  return name
}

export function getEventTagDisplay(eventTag: string | null): string {
  if (!eventTag) return ''
  return eventTag.toUpperCase().split('').join('\u2009')
}

export function getSubmitPageHeading(eventType: string, name: string): string {
  const e = norm(eventType)
  if (e.includes('memorial')) return `Share your voice for ${name}`
  if (e.includes('wedding')) return `Leave a message for the couple`
  if (e.includes('conference')) return `Leave a message for ${name}`
  return `Share your voice for ${name}`
}

export function getConfirmationMessage(eventType: string, name: string): string {
  const e = norm(eventType)
  if (e.includes('wedding')) return `Your message for the couple has been received`
  return `Your voice for ${name} has been received`
}

export function getRelationshipLabel(eventType: string, name: string): string {
  const e = norm(eventType)
  if (e.includes('wedding')) return `Your connection to the couple`
  return `Your connection to ${name}`
}

export function getProfileLinkLabel(eventType: string, name: string): string {
  const e = norm(eventType)
  if (e.includes('memorial')) return `Learn more about ${name}`
  if (e.includes('wedding')) return `About the Couple`
  if (e.includes('conference')) return `About ${name}`
  return `Learn more about ${name}`
}

export function getKeepsakeLabel(eventType: string, name: string): string {
  const e = norm(eventType)
  if (e.includes('memorial')) return `A tribute in memory of ${name}`
  if (e.includes('wedding')) return `A message for ${name}`
  return `A voice for ${name}`
}
