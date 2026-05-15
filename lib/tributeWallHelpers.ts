// ─────────────────────────────────────────────────────────────
// tributeWallHelpers.ts
// Shared helpers for tribute wall and submit page.
// ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  'Nigeria', 'United Kingdom', 'United States', 'Canada', 'Germany',
  'France', 'Italy', 'Spain', 'Netherlands', 'Portugal', 'Ireland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Belgium', 'Switzerland',
  'Austria', 'Ghana', 'Kenya', 'South Africa', 'Tanzania', 'Uganda',
  'Rwanda', 'Cameroon', 'Ivory Coast', 'Senegal', 'Sierra Leone',
  'Zimbabwe', 'Zambia', 'Ethiopia', 'Egypt', 'Morocco', 'Algeria',
  'Australia', 'New Zealand', 'India', 'China', 'Japan', 'Brazil',
  'Mexico', 'Jamaica', 'Trinidad and Tobago', 'Barbados', 'Guyana',
  'Not Listed',
]

export function formatTributeDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const EVENT_TYPE_ORNAMENT: Record<string, string> = {
  'Wedding':            '💍',
  'Memorial & Funeral': '🕊️',
  'Retirement':         '🏆',
  'Milestone Birthday': '🎂',
  'Anniversary':        '💞',
  'Graduation':         '🎓',
  'Ordination':         '✝️',
  'Chieftaincy':        '👑',
  'Award Ceremony':     '🏅',
  'Thanksgiving Service': '🙏',
  'Conference':         '🎤',
  'Other Event':        '✨',
}
