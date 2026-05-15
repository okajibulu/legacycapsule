/**
 * LEGACYCAPSULE — Auto-Arrangement Algorithm
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 *
 * SERVER-SIDE ONLY. Never imported by client components.
 * Called exclusively from /api/publication/init.
 *
 * Responsibility: Given a capsule's approved gallery photos, phases, and
 * contributions, produce a LayoutConfig JSON that looks good immediately
 * without any organiser input. The organiser can then leave it as-is or
 * make targeted edits in the Publication Editor.
 *
 * The algorithm makes four decisions in sequence:
 *   1. Selection  — which photos to include (scored, capped at 100 per phase)
 *   2. Slots      — which layout slot type each photo gets
 *   3. Sequence   — order within a section (chronological by upload time)
 *   4. Sections   — which non-photo sections are enabled by default
 */

import { createClient } from '@supabase/supabase-js';
import type {
  LayoutConfig,
  PublicationTheme,
  CoverStyle,
  PhotoSlot,
  FeatureSlot,
  DoubleSlot,
  TripleSlot,
  PhasePhotosSection,
  TributesSection,
  TributeItem,
  Section,
  GalleryItemForArrangement,
  AutoArrangementInput,
  PhaseForArrangement,
} from './types';

// Admin client — required for server-side data fetch.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────

/** Maximum photos included per phase section. Spec cap. PDF performance limit. */
const MAX_PHOTOS_PER_PHASE = 100;

/**
 * How many photos between forced feature (full-width) slots.
 * Creates visual rhythm — every N photos, one gets the full-width treatment.
 * First photo of each section is always a feature slot regardless.
 */
const FEATURE_SLOT_INTERVAL = 12;

/**
 * Aspect ratio thresholds for slot type preference.
 * landscape: ratio > 1.2  → prefers double slot (two per row)
 * portrait:  ratio < 0.85 → prefers triple slot (three per row)
 * square:    0.85–1.2     → treated as landscape for slot purposes
 */
const LANDSCAPE_THRESHOLD = 1.2;
const PORTRAIT_THRESHOLD = 0.85;


// ────────────────────────────────────────────────────────────
// PHOTO SCORING
// ────────────────────────────────────────────────────────────

/**
 * Score a single photo 0–100. Higher score = more likely to be included
 * when trimming to the 100-photo cap. The algorithm is deterministic
 * per capsule — same photos always produce the same layout.
 *
 * Scoring factors:
 *   - Timeline distribution: favour photos from spread across the event
 *   - Orientation: slight preference for landscape (fills slots better)
 *   - Dimension data present: prefer photos where dimensions were recorded
 *   - Tie-breaking: seeded from photo ID first character (deterministic)
 */
function scorePhoto(
  photo: GalleryItemForArrangement,
  index: number,
  totalInPhase: number
): number {
  let score = 50; // base

  // Timeline distribution — reward photos from start, middle, and end
  const position = totalInPhase > 1 ? index / (totalInPhase - 1) : 0.5;
  if (position <= 0.15 || position >= 0.85) score += 12; // first and last 15%
  else if (position >= 0.42 && position <= 0.58) score += 6; // middle 16%
  else score += 3; // transitions

  // Orientation preference
  const ratio = photo.aspect_ratio ?? 1.0;
  if (ratio > LANDSCAPE_THRESHOLD) score += 8; // landscape — fills double slots cleanly
  else if (ratio < PORTRAIT_THRESHOLD) score += 4; // portrait — good but more constrained
  else score += 6; // square — versatile

  // Dimension data present (uploaded via proper upload handler)
  if (photo.width_px !== null && photo.height_px !== null) score += 5;

  // Deterministic tie-breaking from photo ID
  // Avoids the algorithm picking the same photos every time for similar events
  const idByte = photo.id.charCodeAt(0) + photo.id.charCodeAt(photo.id.length - 1);
  score += idByte % 8;

  return score;
}


// ────────────────────────────────────────────────────────────
// SLOT ASSIGNMENT
// ────────────────────────────────────────────────────────────

/**
 * Assign an ordered array of photos to layout slots.
 *
 * Slot type decision rules (in priority order):
 *   1. First photo of the section → feature slot (always)
 *   2. Every FEATURE_SLOT_INTERVAL photos → feature slot (rhythm)
 *   3. Landscape photo (ratio > 1.2) → double slot
 *   4. Portrait photo (ratio < 0.85) → triple slot (if 3 available)
 *   5. Square / fallback → double slot
 *   6. End-of-section remainder:
 *      - 1 remaining → feature slot
 *      - 2 remaining → double slot
 *      - 3 remaining → triple slot
 *      - >3 remaining → handled by main loop before reaching here
 */
function assignSlots(photos: GalleryItemForArrangement[]): PhotoSlot[] {
  const slots: PhotoSlot[] = [];
  let i = 0;
  let photosSinceLastFeature = 0;

  while (i < photos.length) {
    const remaining = photos.length - i;
    const photo = photos[i];
    const ratio = photo.aspect_ratio ?? 1.0;

    // Force feature slot at start and at rhythm intervals
    const forceFeature =
      i === 0 || photosSinceLastFeature >= FEATURE_SLOT_INTERVAL;

    if (forceFeature || remaining === 1) {
      // Feature slot — single full-width photo
      const slot: FeatureSlot = {
        slot_type: 'feature',
        photo_id: photo.id,
        caption: formatCaption(photo),
        manually_positioned: false,
      };
      slots.push(slot);
      i++;
      photosSinceLastFeature = 0;
      continue;
    }

    if (remaining === 2) {
      // Only 2 left — always a double slot
      const slot: DoubleSlot = {
        slot_type: 'double',
        photos: [
          { photo_id: photos[i].id, caption: formatCaption(photos[i]), manually_positioned: false },
          { photo_id: photos[i + 1].id, caption: formatCaption(photos[i + 1]), manually_positioned: false },
        ],
      };
      slots.push(slot);
      i += 2;
      photosSinceLastFeature += 2;
      continue;
    }

    // Portrait photos prefer triple slots (3 narrow photos work well in a row)
    if (ratio < PORTRAIT_THRESHOLD && remaining >= 3) {
      const slot: TripleSlot = {
        slot_type: 'triple',
        photos: [
          { photo_id: photos[i].id, caption: formatCaption(photos[i]), manually_positioned: false },
          { photo_id: photos[i + 1].id, caption: formatCaption(photos[i + 1]), manually_positioned: false },
          { photo_id: photos[i + 2].id, caption: formatCaption(photos[i + 2]), manually_positioned: false },
        ],
      };
      slots.push(slot);
      i += 3;
      photosSinceLastFeature += 3;
      continue;
    }

    // Landscape and square → double slot
    if (remaining >= 2) {
      const slot: DoubleSlot = {
        slot_type: 'double',
        photos: [
          { photo_id: photos[i].id, caption: formatCaption(photos[i]), manually_positioned: false },
          { photo_id: photos[i + 1].id, caption: formatCaption(photos[i + 1]), manually_positioned: false },
        ],
      };
      slots.push(slot);
      i += 2;
      photosSinceLastFeature += 2;
      continue;
    }

    // Fallback: 1 remaining (should be caught above, but safety net)
    const slot: FeatureSlot = {
      slot_type: 'feature',
      photo_id: photo.id,
      caption: formatCaption(photo),
      manually_positioned: false,
    };
    slots.push(slot);
    i++;
    photosSinceLastFeature = 0;
  }

  return slots;
}

/**
 * Default caption for a photo slot.
 * Uses the existing caption if present, otherwise empty string.
 * Timestamp captions are intentionally NOT auto-generated here —
 * the organiser adds meaningful captions in the editor.
 */
function formatCaption(photo: GalleryItemForArrangement): string {
  return photo.caption?.trim() ?? '';
}


// ────────────────────────────────────────────────────────────
// PHASE SECTION BUILDER
// ────────────────────────────────────────────────────────────

/**
 * Build the PhasePhotosSection for a single event phase.
 * Scores, selects, and slots all approved photos for this phase.
 */
function buildPhaseSection(
  phase: PhaseForArrangement,
  allPhotos: GalleryItemForArrangement[]
): PhasePhotosSection {
  // Filter to this phase's photos
  const phasePhotos = allPhotos.filter(p => p.phase_id === phase.id);

  if (phasePhotos.length === 0) {
    // Phase has no photos — return enabled section with empty slots
    // Organiser can add photos later; section stays enabled so they see it in editor
    return {
      id: `section_phase_photos_${phase.id}`,
      type: 'phase_photos',
      phase_id: phase.id,
      phase_name: phase.name,
      enabled: true,
      arrangement_source: 'auto',
      slots: [],
      excluded_photos: [],
    };
  }

  // Score all photos
  const scored = phasePhotos.map((photo, index) => ({
    photo,
    score: scorePhoto(photo, index, phasePhotos.length),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Select top MAX_PHOTOS_PER_PHASE, capture excluded IDs
  const selected = scored.slice(0, MAX_PHOTOS_PER_PHASE).map(s => s.photo);
  const excluded = scored.slice(MAX_PHOTOS_PER_PHASE).map(s => s.photo.id);

  // Re-sort selected photos chronologically for narrative order
  // (Score determines inclusion; chronological order determines display sequence)
  selected.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const slots = assignSlots(selected);

  return {
    id: `section_phase_photos_${phase.id}`,
    type: 'phase_photos',
    phase_id: phase.id,
    phase_name: phase.name,
    enabled: true,
    arrangement_source: 'auto',
    slots,
    excluded_photos: excluded,
  };
}


// ────────────────────────────────────────────────────────────
// TRIBUTES SECTION BUILDER
// ────────────────────────────────────────────────────────────

/**
 * Build the TributesSection from all approved contributions.
 * Default order: chronological by submission time.
 * Organiser can change order_mode in the editor.
 */
function buildTributesSection(
  contributions: { id: string; created_at: string }[]
): TributesSection {
  // Sort chronologically — first tribute submitted appears first
  const sorted = [...contributions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const items: TributeItem[] = sorted.map(c => ({
    contribution_id: c.id,
    manually_positioned: false,
    page_number: null, // populated after PDF render
  }));

  return {
    id: 'section_tributes',
    type: 'tributes',
    enabled: true,
    order_mode: 'by_date',
    items,
  };
}


// ────────────────────────────────────────────────────────────
// MAIN EXPORT — generateAutoArrangement
// ────────────────────────────────────────────────────────────

/**
 * Generate a complete LayoutConfig for a capsule.
 *
 * Called by /api/publication/init when no layout_config exists yet.
 * Fetches all approved gallery photos from Supabase, then applies
 * the selection and slotting algorithm.
 *
 * @param capsuleId  UUID of the capsule being arranged
 * @param input      Phases, contributions, theme, cover_style from API route
 * @returns          Complete LayoutConfig ready to save to publications table
 */
export async function generateAutoArrangement(
  capsuleId: string,
  input: AutoArrangementInput
): Promise<LayoutConfig> {
  const { phases, contributions, theme, cover_style } = input;

  // Fetch all approved gallery photos for this capsule
  const { data: photos, error } = await adminClient
    .from('gallery_items')
    .select('id, phase_id, image_url, caption, width_px, height_px, aspect_ratio, created_at, approved')
    .eq('capsule_id', capsuleId)
    .eq('approved', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Auto-arrangement: failed to fetch gallery photos: ${error.message}`);
  }

  const allPhotos: GalleryItemForArrangement[] = photos ?? [];

  // Build fixed sections (always present)
  const coverSection: Section = {
    id: 'section_cover',
    type: 'cover',
    enabled: true,
  };

  const profileSection: Section = {
    id: 'section_profile',
    type: 'honouree_profile',
    enabled: true,
  };

  const tributesSection = buildTributesSection(contributions);

  // Build one phase photos section per phase (ordered by sort_order from API)
  const phaseSections: PhasePhotosSection[] = phases.map(phase =>
    buildPhaseSection(phase, allPhotos)
  );

  // Filter to phases that actually have photos or are the only phase
  // (Always include at least one phase section so organiser sees the structure)
  const includedPhaseSections: Section[] = phaseSections.length > 0
    ? phaseSections
    : [];

  const whoAttendedSection: Section = {
    id: 'section_who_attended',
    type: 'who_attended',
    enabled: true,
  };

  const closingSection: Section = {
    id: 'section_closing',
    type: 'closing_message',
    enabled: true,
  };

  // Assemble in canonical section order:
  // Cover → Profile → Tributes → [Phase Photos...] → Who Attended → Closing
  const sections: Section[] = [
    coverSection,
    profileSection,
    tributesSection,
    ...includedPhaseSections,
    whoAttendedSection,
    closingSection,
  ];

  const layoutConfig: LayoutConfig = {
    theme: theme ?? 'classic',
    cover_style: cover_style ?? 'full_bleed',
    arrangement_source: 'auto',
    generated_at: new Date().toISOString(),
    sections,
    page_map: {}, // populated after first PDF render
  };

  return layoutConfig;
}
