// ─────────────────────────────────────────────────────────────
// eventLabels.ts
// All public-facing dynamic labels derived from event type.
// "Honouree" is internal language — never appears publicly.
// ─────────────────────────────────────────────────────────────

export function getSubjectLabel(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `In Memory of ${name}`
    case 'Wedding':            return `Celebrating the Couple`
    case 'Conference':         return `About ${name}`
    default:                   return `About ${name}`
  }
}

export function getProfileLinkLabel(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `Learn more about ${name}`
    case 'Wedding':            return `About the Couple`
    case 'Conference':         return `About ${name}`
    default:                   return `Learn more about ${name}`
  }
}

export function getRelationshipLabel(eventType: string, name: string): string {
  switch (eventType) {
    case 'Wedding':            return `Your connection to the couple`
    case 'Memorial & Funeral': return `Your connection to ${name}`
    default:                   return `Your connection to ${name}`
  }
}

export function getWaysToHonourLabel(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `Ways to Support the Family`
    case 'Wedding':            return `Ways to Celebrate the Couple`
    case 'Retirement':         return `Ways to Celebrate ${name}`
    case 'Milestone Birthday': return `Ways to Celebrate ${name}`
    default:                   return `Ways to Celebrate ${name}`
  }
}

export function getTributePageTitle(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `In Memory of ${name}`
    case 'Wedding':            return name
    case 'Conference':         return name
    default:                   return name
  }
}

export function getEventTagDisplay(eventTag: string | null): string {
  if (!eventTag) return ''
  return eventTag.toUpperCase().split('').join('\u2009')
}

export function getSubmitPageHeading(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `Leave a tribute for ${name}`
    case 'Wedding':            return `Leave a message for the couple`
    case 'Conference':         return `Leave a message for ${name}`
    default:                   return `Leave a tribute for ${name}`
  }
}

export function getConfirmationMessage(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `Your tribute for ${name} has been received`
    case 'Wedding':            return `Your message for the couple has been received`
    default:                   return `Your tribute for ${name} has been received`
  }
}

export function getKeepsakeLabel(eventType: string, name: string): string {
  switch (eventType) {
    case 'Memorial & Funeral': return `A tribute in memory of ${name}`
    case 'Wedding':            return `A message for ${name}`
    default:                   return `A tribute for ${name}`
  }
}