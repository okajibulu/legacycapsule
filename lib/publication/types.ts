/**
 * LEGACYCAPSULE — Publication Engine Types
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 *
 * Shared type definitions for the entire Publication Engine.
 * Imported by: autoArrange.ts, layoutHelpers.ts, PublicationEditor.tsx,
 *              /api/publication/init, /api/publication/save,
 *              /api/publication/generate, /publication-render/[token]/page.tsx
 *
 * Rule: Never import this file into 'use client' components directly —
 * only import the types, not any runtime logic.
 *
 * DO NOT add business logic to this file. Types only.
 */

// ────────────────────────────────────────────────────────────
// THEME AND COVER
// ────────────────────────────────────────────────────────────

/**
 * Five publication themes mapping to event categories.
 * classic    → Retirement, Ordination, Award, Memorial
 * soft       → Milestone Birthday, Anniversary
 * romantic   → Wedding
 * vibrant    → Graduation, Chieftaincy, Conference
 * spiritual  → Thanksgiving Service, Ordination (alt)
 */
export type PublicationTheme =
  | 'classic'
  | 'soft'
  | 'romantic'
  | 'vibrant'
  | 'spiritual';

/**
 * Cover page layout style.
 * full_bleed   → Hero image fills entire cover page edge to edge
 * split        → Image on one half, typographic treatment on other
 * typographic  → Text-only cover, large typeset honouree name, no image
 */
export type CoverStyle = 'full_bleed' | 'split' | 'typographic';

/**
 * Whether the layout was produced by the algorithm untouched,
 * or has been modified by the organiser in the editor.
 */
export type ArrangementSource = 'auto' | 'manual';


// ────────────────────────────────────────────────────────────
// GENERATION STATUS
// ────────────────────────────────────────────────────────────

/**
 * Lifecycle of a PDF generation request.
 *
 * idle      → No generation has been requested. Initial state.
 * queued    → Request received, waiting for Puppeteer slot.
 *             (Used if a queue system is added in future — harmless to include now.)
 * rendering → Puppeteer has launched and is printing the page.
 * complete  → PDF written to Supabase Storage. pdf_url is populated.
 * failed    → Puppeteer or upload failed. generation_error contains the reason.
 *
 * Note: The spec document used 'pending'/'generating'/'ready'/'failed'.
 * These are replaced with the above union per founder direction (14 May 2026).
 * The database column generation_status stores one of these string values.
 */
export type GenerationStatus =
  | 'idle'
  | 'queued'
  | 'rendering'
  | 'complete'
  | 'failed';


// ────────────────────────────────────────────────────────────
// PHOTO SLOTS
// ────────────────────────────────────────────────────────────

/**
 * A photo within any multi-photo slot (double or triple).
 * manually_positioned: true means the organiser moved this photo
 * from its auto-assigned position. The reset-to-auto function
 * only restores slots where manually_positioned = false.
 */
export interface SlotPhoto {
  photo_id: string;
  caption: string;
  manually_positioned: boolean;
}

/**
 * Feature slot — single full-width photo.
 * Used for: opening photo of each phase section,
 * and every ~12 photos for visual rhythm.
 */
export interface FeatureSlot {
  slot_type: 'feature';
  photo_id: string;
  caption: string;
  manually_positioned: boolean;
}

/**
 * Double slot — two photos side by side.
 * Preferred for landscape photos (aspect_ratio > 1.2).
 * Always has exactly 2 photos. If only 1 photo remains at end of
 * a phase and it would form an incomplete double, it gets a feature slot instead.
 */
export interface DoubleSlot {
  slot_type: 'double';
  photos: [SlotPhoto, SlotPhoto];
}

/**
 * Triple slot — three photos in a row.
 * Preferred for portrait photos (aspect_ratio < 0.85).
 * Always has exactly 3 photos. Incomplete triples fall back to double or feature.
 */
export interface TripleSlot {
  slot_type: 'triple';
  photos: [SlotPhoto, SlotPhoto, SlotPhoto];
}

/** Union of all slot types assigned by the algorithm or organiser. */
export type PhotoSlot = FeatureSlot | DoubleSlot | TripleSlot;


// ────────────────────────────────────────────────────────────
// SECTIONS
// ────────────────────────────────────────────────────────────

/**
 * All section type identifiers.
 * Each type maps to a distinct rendered section in the PDF
 * and a distinct editor panel in the Publication Editor UI.
 */
export type SectionType =
  | 'cover'
  | 'honouree_profile'
  | 'world_map'
  | 'tributes'
  | 'phase_photos'
  | 'official_photography'
  | 'guest_captures'
  | 'memories'
  | 'community_stories'
  | 'closing_message';

/** Base fields present on every section. */
export interface SectionBase {
  id: string;
  type: SectionType;
  enabled: boolean;
}

/** Cover page — always first. Contains honouree name, event tag, hero image. */
export interface CoverSection extends SectionBase {
  type: 'cover';
}

/** Honouree profile — biography, timeline entries, profile photo. */
export interface HonoureeProfileSection extends SectionBase {
  type: 'honouree_profile';
}

/**
 * Order mode for tributes section.
 * by_date        → chronological by submission timestamp (default)
 * by_relationship → grouped by relationship field value
 * manual         → organiser has dragged tributes into custom order
 */
export type TributeOrderMode = 'by_date' | 'by_relationship' | 'manual';

/** A single tribute item within the tributes section. */
export interface TributeItem {
  contribution_id: string;
  /** true = organiser has dragged this to a specific position */
  manually_positioned: boolean;
  /** null until PDF has been generated. Populated from page_map after render. */
  page_number: number | null;
}

/** Tributes section — all approved contributions from all contributors. */
export interface TributesSection extends SectionBase {
  type: 'tributes';
  order_mode: TributeOrderMode;
  items: TributeItem[];
}

/**
 * Photo section for a single event phase.
 * One PhasePhotosSection is generated per phase.
 * Section ID format: `section_phase_photos_${phase.id}`
 */
export interface PhasePhotosSection extends SectionBase {
  type: 'phase_photos';
  phase_id: string;
  phase_name: string;
  /** 'auto' = algorithm untouched | 'manual' = organiser has swapped/replaced photos */
  arrangement_source: ArrangementSource;
  /** Ordered array of photo slots to render. Max 100 photos per section. */
  slots: PhotoSlot[];
  /** Photo IDs excluded by the algorithm (score too low) or removed by organiser. */
  excluded_photos: string[];
}

/**
 * World map — SVG dot map of contributor countries.
 * Rendered server-side from ip_country data on contributions.
 * Positioned between Honouree Profile and Tributes.
 */
export interface WorldMapSection extends SectionBase {
  type: 'world_map';
}

/** Official Photography — organiser-uploaded event photos. */
export interface OfficialPhotographySection extends SectionBase {
  type: 'official_photography';
}

/** Guest Captures — D-Day photos uploaded by guests (In The Room). */
export interface GuestCapturesSection extends SectionBase {
  type: 'guest_captures';
}

/** Memories — entries from capsule_memories table, grouped by era. */
export interface MemoriesSection extends SectionBase {
  type: 'memories';
}

/** Community Stories — approved stories grouped by topic. */
export interface CommunityStoriesSection extends SectionBase {
  type: 'community_stories';
}

/** Closing message — final page of the publication. */
export interface ClosingMessageSection extends SectionBase {
  type: 'closing_message';
}

/** Discriminated union of all section types. */
export type Section =
  | CoverSection
  | HonoureeProfileSection
  | WorldMapSection
  | TributesSection
  | PhasePhotosSection
  | OfficialPhotographySection
  | GuestCapturesSection
  | MemoriesSection
  | CommunityStoriesSection
  | ClosingMessageSection;


// ────────────────────────────────────────────────────────────
// LAYOUT CONFIG
// ────────────────────────────────────────────────────────────

/**
 * The complete layout configuration for a publication.
 * Stored as JSONB in publications.layout_config.
 * This is the single source of truth for:
 *   - What appears in the publication
 *   - In what order
 *   - With what arrangement
 *   - Which theme and cover style
 *
 * The auto-arrangement algorithm produces this on first open.
 * The Publication Editor reads and modifies it.
 * The PDF generation pipeline reads it to render the HTML.
 */
export interface LayoutConfig {
  theme: PublicationTheme;
  cover_style: CoverStyle;
  arrangement_source: ArrangementSource;
  /** ISO timestamp of when auto-arrangement last ran. */
  generated_at: string;
  sections: Section[];
  /**
   * Maps contribution_id → page number in the rendered PDF.
   * Empty object `{}` until first successful PDF generation.
   * Populated by the Puppeteer page position extraction step.
   * Used by the Collective Belonging distribution email.
   */
  page_map: Record<string, number>;
}


// ────────────────────────────────────────────────────────────
// PUBLICATIONS TABLE ROW
// ────────────────────────────────────────────────────────────

/**
 * Full row type for the publications table.
 * Matches the database schema after 001_publication_engine_schema.sql is applied.
 */
export interface PublicationRow {
  id: string;
  capsule_id: string;
  community_id: string | null;
  layout_config: LayoutConfig | null;
  theme: PublicationTheme | null;
  cover_style: CoverStyle | null;
  generated_at: string | null;
  pdf_url: string | null;
  pdf_size_bytes: number | null;
  page_map: Record<string, number>;
  arrangement_source: ArrangementSource;
  generation_status: GenerationStatus;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  generation_error: string | null;
  /**
   * One-time UUID token written immediately before Puppeteer launches.
   * Puppeteer presents this token to the hidden render route for authentication.
   * Set to null immediately after PDF is written. Never reused.
   */
  render_token: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}


// ────────────────────────────────────────────────────────────
// GALLERY ITEMS — algorithm input type
// ────────────────────────────────────────────────────────────

/**
 * Gallery item as fetched by the auto-arrangement algorithm.
 * Matches gallery_items table after schema additions.
 */
export interface GalleryItemForArrangement {
  id: string;
  phase_id: string | null;
  image_url: string;
  caption: string | null;
  width_px: number | null;
  height_px: number | null;
  /** Computed generated column. null if dimensions not recorded. */
  aspect_ratio: number | null;
  created_at: string;
  approved: boolean;
}


// ────────────────────────────────────────────────────────────
// AUTO-ARRANGEMENT INPUT
// ────────────────────────────────────────────────────────────

/** A capsule phase as passed to the auto-arrangement algorithm. */
export interface PhaseForArrangement {
  id: string;
  name: string;
  event_date: string | null;
}

/** A contribution (tribute) as passed to the auto-arrangement algorithm. */
export interface ContributionForArrangement {
  id: string;
  created_at: string;
}

/**
 * Full input payload for generateAutoArrangement().
 * Fetched by the /api/publication/init route and passed to the algorithm.
 */
export interface AutoArrangementInput {
  phases: PhaseForArrangement[];
  contributions: ContributionForArrangement[];
  theme?: PublicationTheme;
  cover_style?: CoverStyle;
}


// ────────────────────────────────────────────────────────────
// API ROUTE PAYLOADS
// ────────────────────────────────────────────────────────────

/** POST body for /api/publication/init */
export interface PublicationInitRequest {
  capsule_id: string;
}

/** Response from /api/publication/init */
export interface PublicationInitResponse {
  layout_config: LayoutConfig;
  source: 'existing' | 'generated';
  pub_id: string;
}

/** POST body for /api/publication/save */
export interface PublicationSaveRequest {
  capsule_id: string;
  layout_config: LayoutConfig;
}

/** Response from /api/publication/save */
export interface PublicationSaveResponse {
  ok: boolean;
}

/** POST body for /api/publication/generate */
export interface PublicationGenerateRequest {
  capsule_id: string;
}

/** Response from /api/publication/generate */
export interface PublicationGenerateResponse {
  pdf_url: string;
  page_map: Record<string, number>;
}


// ────────────────────────────────────────────────────────────
// EDITOR STATE
// ────────────────────────────────────────────────────────────

/**
 * Save state shown in the Publication Editor UI.
 * Used to give the organiser feedback on autosave status.
 */
export type EditorSaveState = 'saved' | 'saving' | 'unsaved' | 'error';

/**
 * Photo swap operation — the editor passes this when two photos are clicked.
 * layoutHelpers.swapPhotos() consumes this to update the layout_config.
 */
export interface PhotoSwapOperation {
  /** ID of the first photo being swapped. */
  photo_id_a: string;
  /** ID of the second photo being swapped. */
  photo_id_b: string;
  /** Phase section the swap occurs within (null if cross-section swap). */
  section_id: string | null;
}

/**
 * Photo replace operation — swap an included photo with one from excluded_photos.
 */
export interface PhotoReplaceOperation {
  /** Photo currently in a slot — being removed. */
  outgoing_photo_id: string;
  /** Photo currently in excluded_photos — being added to the slot. */
  incoming_photo_id: string;
  section_id: string;
}
