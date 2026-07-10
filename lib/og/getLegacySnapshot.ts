// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/og/getLegacySnapshot.ts
// PURPOSE: Fetch participation metrics for cover Legacy Snapshot (OG02 Section 6)
// Outputs: contributions count + countries count
// Reads from capsule_participation_summary (pre-computed, fast)
// Falls back to live count if summary row missing (BUG-LEGACYROOM-001 safety)
// SERVER-SIDE ONLY — used in Edge runtime via og route
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LegacySnapshot {
  /** Total approved contributions — tributes, stories, all types */
  contributions: number
  /** Distinct countries represented */
  countries: number
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Fetch
// OG02 Section 6: preferred metrics are Contributions + Countries
// Avoids photo/video counts which become misleading as platform evolves
// ─────────────────────────────────────────────────────────────────────────────

export async function getLegacySnapshot(capsuleId: string): Promise<LegacySnapshot> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Try pre-computed summary first (D9: Legacy Room reads summary only) ────
  try {
    const { data: summary } = await supabase
      .from('capsule_participation_summary')
      .select('contributor_count, country_count')
      .eq('capsule_id', capsuleId)
      .single()

    if (summary && summary.contributor_count > 0) {
      return {
        contributions: summary.contributor_count,
        countries: summary.country_count ?? 0,
      }
    }
  } catch {
    // Summary not available — fall through to live count
  }

  // ── Fallback: live count from contributions (handles BUG-LEGACYROOM-001) ──
  try {
    const { data: contribs } = await supabase
      .from('contributions')
      .select('country')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)

    if (!contribs || contribs.length === 0) {
      return { contributions: 0, countries: 0 }
    }

    const distinctCountries = new Set(
      contribs.map(c => c.country).filter(Boolean)
    ).size

    return {
      contributions: contribs.length,
      countries: distinctCountries,
    }
  } catch {
    return { contributions: 0, countries: 0 }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Format helpers for cover display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format contribution count for display on cover.
 * Returns null when zero — covers omit the snapshot entirely when no contributions.
 */
export function formatContributions(count: number): string | null {
  if (count === 0) return null
  if (count === 1) return '1 Voice'
  if (count < 1000) return `${count} Voices`
  return `${(count / 1000).toFixed(1)}k Voices`
}

/**
 * Format country count for display on cover.
 */
export function formatCountries(count: number): string | null {
  if (count === 0) return null
  if (count === 1) return '1 Country'
  return `${count} Countries`
}
