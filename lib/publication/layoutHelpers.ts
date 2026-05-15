/**
 * LEGACYCAPSULE — Publication Layout Helpers
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 *
 * Pure functions that transform a LayoutConfig in response to organiser
 * actions in the Publication Editor. All functions are:
 *   - Pure: no side effects, no async, no Supabase calls
 *   - Immutable: always return a new LayoutConfig, never mutate the input
 *   - Typed: strict TypeScript throughout
 *   - Safe: never throw — return the original config unchanged on bad input
 *
 * The editor calls these functions, then passes the result to the
 * /api/publication/save route which writes it to Supabase.
 *
 * Importable by both server and client components (no server-only imports).
 */

import type {
  LayoutConfig,
  Section,
  PhasePhotosSection,
  TributesSection,
  PhotoSlot,
  FeatureSlot,
  DoubleSlot,
  TripleSlot,
  SlotPhoto,
  TributeOrderMode,
  ArrangementSource,
} from './types';


// ────────────────────────────────────────────────────────────
// INTERNAL UTILITIES
// ────────────────────────────────────────────────────────────

/** Extract all photo IDs currently in slots (included photos) for a phase section. */
function extractIncludedPhotoIds(section: PhasePhotosSection): string[] {
  const ids: string[] = [];
  for (const slot of section.slots) {
    if (slot.slot_type === 'feature') {
      ids.push(slot.photo_id);
    } else {
      for (const p of slot.photos) {
        ids.push(p.photo_id);
      }
    }
  }
  return ids;
}

/**
 * Extract ALL photo IDs for a phase section — both included and excluded.
 * Used by the editor's photo picker to know what photos exist for this phase.
 */
export function extractAllPhotoIds(section: PhasePhotosSection): string[] {
  return [...extractIncludedPhotoIds(section), ...section.excluded_photos];
}

/** Replace a photo_id within a slot, preserving caption and marking as manually positioned. */
function replacePhotoInSlot(
  slot: PhotoSlot,
  outgoingId: string,
  incomingId: string
): PhotoSlot {
  if (slot.slot_type === 'feature') {
    if (slot.photo_id !== outgoingId) return slot;
    return { ...slot, photo_id: incomingId, manually_positioned: true };
  }

  const updatedPhotos = slot.photos.map(p =>
    p.photo_id === outgoingId
      ? { ...p, photo_id: incomingId, manually_positioned: true }
      : p
  );

  if (slot.slot_type === 'double') {
    return { ...slot, photos: updatedPhotos as DoubleSlot['photos'] };
  }
  return { ...slot, photos: updatedPhotos as TripleSlot['photos'] };
}

/** Swap two photo IDs within slots, marking both as manually positioned. */
function swapPhotoIdsInSlots(
  slots: PhotoSlot[],
  idA: string,
  idB: string
): PhotoSlot[] {
  // First pass: build a map of current positions
  return slots.map(slot => {
    if (slot.slot_type === 'feature') {
      if (slot.photo_id === idA) return { ...slot, photo_id: idB, manually_positioned: true };
      if (slot.photo_id === idB) return { ...slot, photo_id: idA, manually_positioned: true };
      return slot;
    }

    let changed = false;
    const updatedPhotos = slot.photos.map(p => {
      if (p.photo_id === idA) { changed = true; return { ...p, photo_id: idB, manually_positioned: true }; }
      if (p.photo_id === idB) { changed = true; return { ...p, photo_id: idA, manually_positioned: true }; }
      return p;
    });

    if (!changed) return slot;

    if (slot.slot_type === 'double') {
      return { ...slot, photos: updatedPhotos as DoubleSlot['photos'] };
    }
    return { ...slot, photos: updatedPhotos as TripleSlot['photos'] };
  });
}

/** Find the PhasePhotosSection for a given section ID. Returns null if not found. */
function findPhaseSection(config: LayoutConfig, sectionId: string): PhasePhotosSection | null {
  const section = config.sections.find(s => s.id === sectionId);
  if (!section || section.type !== 'phase_photos') return null;
  return section as PhasePhotosSection;
}

/** Replace a section in the sections array, returning a new array. */
function replaceSectionInConfig(config: LayoutConfig, updated: Section): LayoutConfig {
  return {
    ...config,
    arrangement_source: 'manual',
    sections: config.sections.map(s => s.id === updated.id ? updated : s),
  };
}


// ────────────────────────────────────────────────────────────
// PHOTO OPERATIONS
// ────────────────────────────────────────────────────────────

/**
 * Swap two photos within a phase section.
 *
 * Both photos must exist within the section's slots (not in excluded_photos).
 * This is an in-section swap — for cross-section moves, use replacePhoto twice.
 * Both photos are marked manually_positioned: true after the swap.
 *
 * Returns config unchanged if either photo is not found in the section.
 *
 * @param config     Current LayoutConfig
 * @param sectionId  ID of the PhasePhotosSection containing both photos
 * @param photoIdA   First photo ID
 * @param photoIdB   Second photo ID
 */
export function swapPhotos(
  config: LayoutConfig,
  sectionId: string,
  photoIdA: string,
  photoIdB: string
): LayoutConfig {
  const section = findPhaseSection(config, sectionId);
  if (!section) return config;

  const includedIds = extractIncludedPhotoIds(section);
  if (!includedIds.includes(photoIdA) || !includedIds.includes(photoIdB)) return config;
  if (photoIdA === photoIdB) return config;

  const updatedSlots = swapPhotoIdsInSlots(section.slots, photoIdA, photoIdB);
  const updatedSection: PhasePhotosSection = {
    ...section,
    arrangement_source: 'manual',
    slots: updatedSlots,
  };

  return replaceSectionInConfig(config, updatedSection);
}

/**
 * Replace an included photo with one from excluded_photos.
 *
 * The outgoing photo moves to excluded_photos.
 * The incoming photo takes its slot position with manually_positioned: true.
 *
 * Returns config unchanged if:
 *   - outgoingPhotoId is not in any slot
 *   - incomingPhotoId is not in excluded_photos
 *
 * @param config           Current LayoutConfig
 * @param sectionId        ID of the PhasePhotosSection
 * @param outgoingPhotoId  Photo currently in a slot (being removed)
 * @param incomingPhotoId  Photo in excluded_photos (being added)
 */
export function replacePhoto(
  config: LayoutConfig,
  sectionId: string,
  outgoingPhotoId: string,
  incomingPhotoId: string
): LayoutConfig {
  const section = findPhaseSection(config, sectionId);
  if (!section) return config;

  const includedIds = extractIncludedPhotoIds(section);
  if (!includedIds.includes(outgoingPhotoId)) return config;
  if (!section.excluded_photos.includes(incomingPhotoId)) return config;

  const updatedSlots = section.slots.map(slot =>
    replacePhotoInSlot(slot, outgoingPhotoId, incomingPhotoId)
  );

  const updatedExcluded = [
    ...section.excluded_photos.filter(id => id !== incomingPhotoId),
    outgoingPhotoId,
  ];

  const updatedSection: PhasePhotosSection = {
    ...section,
    arrangement_source: 'manual',
    slots: updatedSlots,
    excluded_photos: updatedExcluded,
  };

  return replaceSectionInConfig(config, updatedSection);
}

/**
 * Remove a photo from a section entirely (move to excluded_photos).
 *
 * The slot containing the photo is removed. If removing the photo
 * leaves a double or triple slot with only 1 or 2 photos respectively,
 * the slot is downgraded (double → feature if only 1 remains, etc.).
 *
 * Returns config unchanged if photoId is not found.
 *
 * @param config    Current LayoutConfig
 * @param sectionId ID of the PhasePhotosSection
 * @param photoId   Photo to remove
 */
export function removePhoto(
  config: LayoutConfig,
  sectionId: string,
  photoId: string
): LayoutConfig {
  const section = findPhaseSection(config, sectionId);
  if (!section) return config;

  const includedIds = extractIncludedPhotoIds(section);
  if (!includedIds.includes(photoId)) return config;

  const updatedSlots: PhotoSlot[] = [];

  for (const slot of section.slots) {
    if (slot.slot_type === 'feature') {
      if (slot.photo_id === photoId) {
        // Remove this slot entirely — photo goes to excluded
        continue;
      }
      updatedSlots.push(slot);
      continue;
    }

    const remainingPhotos = slot.photos.filter(p => p.photo_id !== photoId);

    if (remainingPhotos.length === slot.photos.length) {
      // Photo not in this slot
      updatedSlots.push(slot);
      continue;
    }

    // Photo was in this slot — downgrade the slot if needed
    if (remainingPhotos.length === 0) {
      // Slot is now empty — drop it
      continue;
    }

    if (remainingPhotos.length === 1) {
      // Downgrade to feature slot
      const featureSlot: FeatureSlot = {
        slot_type: 'feature',
        photo_id: remainingPhotos[0].photo_id,
        caption: remainingPhotos[0].caption,
        manually_positioned: true,
      };
      updatedSlots.push(featureSlot);
      continue;
    }

    if (remainingPhotos.length === 2) {
      // Downgrade triple → double
      const doubleSlot: DoubleSlot = {
        slot_type: 'double',
        photos: [remainingPhotos[0], remainingPhotos[1]] as DoubleSlot['photos'],
      };
      updatedSlots.push(doubleSlot);
      continue;
    }

    // 3 remaining — keep as triple (shouldn't happen but safety net)
    updatedSlots.push(slot);
  }

  const updatedSection: PhasePhotosSection = {
    ...section,
    arrangement_source: 'manual',
    slots: updatedSlots,
    excluded_photos: [...section.excluded_photos, photoId],
  };

  return replaceSectionInConfig(config, updatedSection);
}

/**
 * Promote a photo to a feature (full-width) slot.
 *
 * The photo is extracted from its current double or triple slot
 * and inserted as a new feature slot immediately before the slot
 * it came from. The original slot is downgraded.
 *
 * If the photo is already in a feature slot, returns config unchanged.
 *
 * @param config    Current LayoutConfig
 * @param sectionId ID of the PhasePhotosSection
 * @param photoId   Photo to promote
 */
export function promoteToFeature(
  config: LayoutConfig,
  sectionId: string,
  photoId: string
): LayoutConfig {
  const section = findPhaseSection(config, sectionId);
  if (!section) return config;

  // Find which slot contains this photo
  let targetSlotIndex = -1;
  for (let i = 0; i < section.slots.length; i++) {
    const slot = section.slots[i];
    if (slot.slot_type === 'feature' && slot.photo_id === photoId) {
      // Already a feature — nothing to do
      return config;
    }
    if (slot.slot_type !== 'feature') {
      if (slot.photos.some(p => p.photo_id === photoId)) {
        targetSlotIndex = i;
        break;
      }
    }
  }

  if (targetSlotIndex === -1) return config;

  const targetSlot = section.slots[targetSlotIndex];

  // Build the new feature slot
  const featureSlot: FeatureSlot = {
    slot_type: 'feature',
    photo_id: photoId,
    caption: (targetSlot as DoubleSlot | TripleSlot).photos.find(p => p.photo_id === photoId)?.caption ?? '',
    manually_positioned: true,
  };

  // Downgrade the original slot (remove this photo from it)
  const remainingPhotos = (targetSlot as DoubleSlot | TripleSlot).photos.filter(
    p => p.photo_id !== photoId
  );

  const updatedSlots: PhotoSlot[] = [];

  for (let i = 0; i < section.slots.length; i++) {
    if (i !== targetSlotIndex) {
      updatedSlots.push(section.slots[i]);
      continue;
    }

    // Insert new feature slot first
    updatedSlots.push(featureSlot);

    // Then insert the downgraded original slot (if photos remain)
    if (remainingPhotos.length === 1) {
      const downgraded: FeatureSlot = {
        slot_type: 'feature',
        photo_id: remainingPhotos[0].photo_id,
        caption: remainingPhotos[0].caption,
        manually_positioned: true,
      };
      updatedSlots.push(downgraded);
    } else if (remainingPhotos.length === 2) {
      const downgraded: DoubleSlot = {
        slot_type: 'double',
        photos: [remainingPhotos[0], remainingPhotos[1]] as DoubleSlot['photos'],
      };
      updatedSlots.push(downgraded);
    }
    // If remainingPhotos.length === 0 — slot vanishes (photo was sole occupant, shouldn't happen)
  }

  const updatedSection: PhasePhotosSection = {
    ...section,
    arrangement_source: 'manual',
    slots: updatedSlots,
  };

  return replaceSectionInConfig(config, updatedSection);
}

/**
 * Update the caption for a specific photo.
 *
 * Searches all phase sections for the photo and updates its caption.
 * Works across feature, double, and triple slots.
 *
 * @param config    Current LayoutConfig
 * @param photoId   Photo whose caption to update
 * @param caption   New caption text (empty string = no caption)
 */
export function updatePhotoCaption(
  config: LayoutConfig,
  photoId: string,
  caption: string
): LayoutConfig {
  const sections = config.sections.map(section => {
    if (section.type !== 'phase_photos') return section;

    const phaseSection = section as PhasePhotosSection;
    let changed = false;

    const updatedSlots = phaseSection.slots.map(slot => {
      if (slot.slot_type === 'feature') {
        if (slot.photo_id !== photoId) return slot;
        changed = true;
        return { ...slot, caption };
      }
      const updatedPhotos = slot.photos.map(p => {
        if (p.photo_id !== photoId) return p;
        changed = true;
        return { ...p, caption };
      });
      if (!changed) return slot;
      if (slot.slot_type === 'double') {
        return { ...slot, photos: updatedPhotos as DoubleSlot['photos'] };
      }
      return { ...slot, photos: updatedPhotos as TripleSlot['photos'] };
    });

    if (!changed) return section;

    return { ...phaseSection, slots: updatedSlots } as PhasePhotosSection;
  });

  return { ...config, sections };
}


// ────────────────────────────────────────────────────────────
// SECTION OPERATIONS
// ────────────────────────────────────────────────────────────

/**
 * Toggle a section's enabled state (show/hide in PDF).
 *
 * All sections can be toggled except 'cover' — the cover page is always present.
 * Returns config unchanged if sectionId is not found or is the cover.
 *
 * @param config    Current LayoutConfig
 * @param sectionId ID of the section to toggle
 */
export function toggleSection(config: LayoutConfig, sectionId: string): LayoutConfig {
  const section = config.sections.find(s => s.id === sectionId);
  if (!section) return config;
  if (section.type === 'cover') return config; // cover is never disabled

  const sections = config.sections.map(s =>
    s.id === sectionId ? { ...s, enabled: !s.enabled } : s
  );

  return { ...config, arrangement_source: 'manual', sections };
}

/**
 * Update the tribute order mode for the tributes section.
 *
 * @param config    Current LayoutConfig
 * @param orderMode New order mode
 */
export function setTributeOrderMode(
  config: LayoutConfig,
  orderMode: TributeOrderMode
): LayoutConfig {
  const sections = config.sections.map(s => {
    if (s.type !== 'tributes') return s;
    return { ...s, order_mode: orderMode } as TributesSection;
  });

  return { ...config, arrangement_source: 'manual', sections };
}

/**
 * Reset a specific phase section back to its auto-arranged state.
 *
 * Requires the original auto layout_config (stored separately in component state
 * when the editor first loads). This function replaces the current section
 * with the corresponding section from the auto config.
 *
 * Note: Does NOT re-run the arrangement algorithm. The original auto layout
 * must have been stored on initial load. See PublicationEditor.tsx.
 *
 * @param currentConfig  The current (possibly modified) LayoutConfig
 * @param autoConfig     The original auto-generated LayoutConfig (from first load)
 * @param sectionId      ID of the phase section to reset
 */
export function resetSectionToAuto(
  currentConfig: LayoutConfig,
  autoConfig: LayoutConfig,
  sectionId: string
): LayoutConfig {
  const autoSection = autoConfig.sections.find(s => s.id === sectionId);
  if (!autoSection) return currentConfig;

  const sections = currentConfig.sections.map(s =>
    s.id === sectionId ? { ...autoSection } : s
  );

  // Re-evaluate arrangement_source:
  // If all sections now match auto, revert to 'auto', otherwise keep 'manual'
  const allMatchAuto = sections.every(s => {
    const autoEquiv = autoConfig.sections.find(a => a.id === s.id);
    if (!autoEquiv) return false;
    // Shallow check — if any phase section still has manual arrangement, we're still manual
    if (s.type === 'phase_photos') {
      return (s as PhasePhotosSection).arrangement_source === 'auto';
    }
    return true;
  });

  return {
    ...currentConfig,
    arrangement_source: allMatchAuto ? 'auto' : 'manual',
    sections,
  };
}

/**
 * Reorder sections in the layout.
 * Allows the organiser to drag sections into a different order.
 * The cover section is always kept first regardless of the provided order.
 *
 * @param config      Current LayoutConfig
 * @param orderedIds  Section IDs in the new desired order
 */
export function reorderSections(
  config: LayoutConfig,
  orderedIds: string[]
): LayoutConfig {
  const sectionMap = new Map(config.sections.map(s => [s.id, s]));

  const reordered: Section[] = [];

  // Cover always first
  const cover = config.sections.find(s => s.type === 'cover');
  if (cover) reordered.push(cover);

  // Remaining sections in provided order, excluding cover
  for (const id of orderedIds) {
    if (!sectionMap.has(id)) continue;
    const section = sectionMap.get(id)!;
    if (section.type === 'cover') continue; // already added
    reordered.push(section);
  }

  // Append any sections not in orderedIds (safety net)
  for (const section of config.sections) {
    if (!reordered.find(s => s.id === section.id)) {
      reordered.push(section);
    }
  }

  return { ...config, arrangement_source: 'manual', sections: reordered };
}


// ────────────────────────────────────────────────────────────
// LAYOUT QUERY HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Get all photo IDs referenced in the entire layout_config.
 * Used by the editor to pre-load all photo URLs for display.
 * Includes both included and excluded photos across all phase sections.
 */
export function getAllPhotoIds(config: LayoutConfig): string[] {
  const ids: string[] = [];
  for (const section of config.sections) {
    if (section.type !== 'phase_photos') continue;
    const phaseSection = section as PhasePhotosSection;
    ids.push(...extractAllPhotoIds(phaseSection));
  }
  return [...new Set(ids)]; // deduplicate
}

/**
 * Count total photos included in the layout (across all phase sections).
 * Used by the editor status bar.
 */
export function countIncludedPhotos(config: LayoutConfig): number {
  let count = 0;
  for (const section of config.sections) {
    if (section.type !== 'phase_photos') continue;
    count += extractIncludedPhotoIds(section as PhasePhotosSection).length;
  }
  return count;
}

/**
 * Count total tributes in the layout.
 * Used by the editor status bar.
 */
export function countTributes(config: LayoutConfig): number {
  const tributesSection = config.sections.find(s => s.type === 'tributes');
  if (!tributesSection) return 0;
  return (tributesSection as TributesSection).items.length;
}

/**
 * Check if the layout has been modified from auto-arrangement.
 * Used by the editor to show the "Reset to auto" option.
 */
export function isModifiedFromAuto(config: LayoutConfig): boolean {
  return config.arrangement_source === 'manual';
}
