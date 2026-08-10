'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — PhotoSection.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * The main area component for a phase_photos section.
 *
 * Renders all photo slots for a single event phase and
 * coordinates the organiser's interactions:
 *
 *   Swap (click-click):
 *     First click selects a photo (isSelected ring).
 *     Second click on any other included photo triggers onSwap.
 *     Clicking the selected photo again deselects it.
 *
 *   Replace (via overlay button → ExcludedTray):
 *     Clicking Replace on a photo opens the ExcludedTray.
 *     Clicking a tray photo calls onReplace.
 *
 *   Promote (via overlay button):
 *     Extracts the photo into its own full-width feature slot.
 *     Calls onPromote.
 *
 *   Remove (via overlay button):
 *     Moves the photo to the excluded tray.
 *     Calls onRemove.
 *
 *   Reset to suggested:
 *     Two-step confirm button. Calls onReset.
 *     Only shown when section.arrangement_source === 'manual'.
 *
 * Layout rendering:
 *   feature slots  → full-width PhotoSlot
 *   double slots   → two-column grid of PhotoSlot
 *   triple slots   → three-column grid of PhotoSlot
 *
 * Props:
 *   section   — the PhasePhotosSection from layout_config
 *   photos    — map of photo_id → { image_url, caption, ... }
 *   onSwap    — (idA, idB) → swap two included photos
 *   onReplace — (outgoing, incoming) → replace included with tray photo
 *   onRemove  — (id) → move included to tray
 *   onPromote — (id) → promote to feature slot
 *   onReset   — reset this section to auto-arrangement
 */

import { useState } from 'react';
import type {
  PhasePhotosSection,
  PhotoSlot as PhotoSlotType,
  GalleryItemForArrangement,
} from '@/lib/publication/types';
import PhotoSlotComponent from './PhotoSlot';
import ExcludedTray from './ExcludedTray';


// ============================================================
// SECTION 1 — Props
// ============================================================

interface PhotoSectionProps {
  section:    PhasePhotosSection;
  photos:     Record<string, GalleryItemForArrangement & { image_url: string }>;
  capsuleId:  string;
  onSwap:     (idA: string, idB: string) => void;
  onReplace:  (outgoing: string, incoming: string) => void;
  onRemove:   (id: string) => void;
  onPromote:  (id: string) => void;
  onReset:    () => void;
  onPurged:   (newLayout: import('@/lib/publication/types').LayoutConfig) => void;
}


// ============================================================
// SECTION 2 — Internal utilities
// ============================================================

/** Count all photo IDs present in slots (not excluded). */
function countIncluded(slots: PhotoSlotType[]): number {
  return slots.reduce((n, slot) => {
    if (slot.slot_type === 'feature') return n + 1;
    return n + slot.photos.length;
  }, 0);
}

/** Extract all photo IDs from included slots. */
function includedIds(slots: PhotoSlotType[]): string[] {
  const ids: string[] = [];
  for (const slot of slots) {
    if (slot.slot_type === 'feature') { ids.push(slot.photo_id); continue; }
    slot.photos.forEach(p => ids.push(p.photo_id));
  }
  return ids;
}


// ============================================================
// SECTION 3 — Slot layout renderers
// ============================================================

/**
 * Renders a feature (full-width) slot.
 * Takes the full width of the main area.
 */
function FeatureSlotRow({
  photoId, caption, photos, selectedId,
  onClick, onReplace, onPromote, onRemove,
}: {
  photoId: string;
  caption: string;
  photos: PhotoSectionProps['photos'];
  selectedId: string | null;
  onClick:    (id: string) => void;
  onReplace:  (id: string) => void;
  onPromote:  (id: string) => void;
  onRemove:   (id: string) => void;
}) {
  const photo = photos[photoId];
  return (
    <PhotoSlotComponent
      photoId={photoId}
      caption={caption}
      imageUrl={photo?.image_url ?? null}
      isSelected={selectedId === photoId}
      isSwapTarget={selectedId !== null && selectedId !== photoId}
      isFeature={true}
      onClick={onClick}
      onReplace={onReplace}
      onPromote={onPromote}
      onRemove={onRemove}
    />
  );
}

/**
 * Renders a double slot — two photos side by side.
 */
function DoubleSlotRow({
  photos: photoPairs, photoMap, selectedId,
  onClick, onReplace, onPromote, onRemove,
}: {
  photos: Array<{ photo_id: string; caption: string }>;
  photoMap: PhotoSectionProps['photos'];
  selectedId: string | null;
  onClick:    (id: string) => void;
  onReplace:  (id: string) => void;
  onPromote:  (id: string) => void;
  onRemove:   (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {photoPairs.map(p => (
        <PhotoSlotComponent
          key={p.photo_id}
          photoId={p.photo_id}
          caption={p.caption}
          imageUrl={photoMap[p.photo_id]?.image_url ?? null}
          isSelected={selectedId === p.photo_id}
          isSwapTarget={selectedId !== null && selectedId !== p.photo_id}
          isFeature={false}
          onClick={onClick}
          onReplace={onReplace}
          onPromote={onPromote}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

/**
 * Renders a triple slot — three photos in a row.
 */
function TripleSlotRow({
  photos: photoTriple, photoMap, selectedId,
  onClick, onReplace, onPromote, onRemove,
}: {
  photos: Array<{ photo_id: string; caption: string }>;
  photoMap: PhotoSectionProps['photos'];
  selectedId: string | null;
  onClick:    (id: string) => void;
  onReplace:  (id: string) => void;
  onPromote:  (id: string) => void;
  onRemove:   (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photoTriple.map(p => (
        <PhotoSlotComponent
          key={p.photo_id}
          photoId={p.photo_id}
          caption={p.caption}
          imageUrl={photoMap[p.photo_id]?.image_url ?? null}
          isSelected={selectedId === p.photo_id}
          isSwapTarget={selectedId !== null && selectedId !== p.photo_id}
          isFeature={false}
          onClick={onClick}
          onReplace={onReplace}
          onPromote={onPromote}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}


// ============================================================
// SECTION 4 — Main component
// ============================================================

export default function PhotoSection({
  section,
  photos,
  capsuleId,
  onSwap,
  onReplace,
  onRemove,
  onPromote,
  onReset,
  onPurged,
}: PhotoSectionProps) {

  // ── 4.1  Local interaction state ─────────────────────────

  /** ID of the photo selected for swapping (first click). null = no selection. */
  const [selectedId,    setSelectedId]    = useState<string | null>(null);

  /** Whether the ExcludedTray is open. */
  const [showTray,      setShowTray]      = useState(false);

  /** Two-step confirmation for reset-to-auto. */
  const [confirmReset,  setConfirmReset]  = useState(false);
  const [purging,       setPurging]       = useState(false);
  const [confirmPurge,  setConfirmPurge]  = useState(false);
  const [purgeResult,   setPurgeResult]   = useState<{ photo_count: number; slot_count: number } | null>(null);
  const [purgeError,    setPurgeError]    = useState<string | null>(null);


  // ── 4.2  Interaction handlers ─────────────────────────────

  const handlePhotoClick = (photoId: string) => {
    if (!selectedId) {
      // First click — select
      setSelectedId(photoId);
      return;
    }
    if (selectedId === photoId) {
      // Click same photo — deselect
      setSelectedId(null);
      return;
    }
    // Second click on different photo — swap
    onSwap(selectedId, photoId);
    setSelectedId(null);
  };

  const handleReplace = (photoId: string) => {
    setSelectedId(photoId);
    setShowTray(true);
  };

  const handleTraySelect = (newPhotoId: string) => {
    if (selectedId) {
      onReplace(selectedId, newPhotoId);
      setSelectedId(null);
      setShowTray(false);
    }
  };

  const handleReset = () => {
    onReset();
    setConfirmReset(false);
    setSelectedId(null);
    setShowTray(false);
  };


  
  const handlePurge = async () => {
    setPurging(true);
    setPurgeError(null);
    try {
      console.log('[purge-section] sending:', { capsule_id: capsuleId, section_id: section.id });
      const res = await fetch('/api/publication/purge-section', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          section_id: section.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Purge failed');
      setPurgeResult({ photo_count: data.photo_count, slot_count: data.slot_count });
      onPurged(data.layout_config);
      setConfirmPurge(false);
      setSelectedId(null);
      setShowTray(false);
    } catch (err) {
      setPurgeError(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setPurging(false);
    }
  };

  // Dismiss selection when clicking anywhere on the section container
  const handleContainerClick = () => {
    // Only dismiss if clicking the container background, not a child
    // (child clicks are stopped separately — this handles gaps between slots)
  };


  // ── 4.3  Derived counts ───────────────────────────────────

  const totalIncluded = countIncluded(section.slots);
  const totalExcluded = section.excluded_photos.length;
  const isManual      = section.arrangement_source === 'manual';


  // ── 4.4  Empty state ──────────────────────────────────────

  if (section.slots.length === 0 && section.excluded_photos.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-white/40 text-sm">No photos uploaded for this phase yet.</p>
        <p className="text-white/25 text-xs mt-2">
          Photos uploaded during D-day for this phase will appear here once approved.
        </p>
      </div>
    );
  }


  // ── 4.5  Render ───────────────────────────────────────────

  return (
    <div className="space-y-4" onClick={handleContainerClick}>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">

        {/* Stats */}
        <p className="text-xs text-white/40">
          <span className="text-white/60 font-medium">{totalIncluded}</span> photos in layout
          {totalExcluded > 0 && (
            <> · <span className="text-white/40">{totalExcluded}</span> in tray</>
          )}
          {isManual && (
            <span className="ml-2 text-yellow-400/60">· Edited</span>
          )}
        </p>

        {/* Toolbar buttons */}
        <div className="flex gap-2 items-center flex-wrap">

          {/* Tray toggle */}
          {totalExcluded > 0 && (
            <button
              type="button"
              onClick={() => setShowTray(v => !v)}
              aria-expanded={showTray}
              aria-controls="excluded-tray"
              className="
                text-xs px-3 py-1 rounded-lg
                border border-white/15 text-white/50
                hover:text-white/70 hover:border-white/25
                transition-colors
              "
            >
              {showTray ? 'Hide tray' : `Show tray (${totalExcluded})`}
            </button>
          )}

          {/* Reset to auto — two-step */}
          {isManual && !confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="
                text-xs px-3 py-1 rounded-lg
                border border-yellow-400/20 text-yellow-400/60
                hover:text-yellow-300 hover:border-yellow-400/40
                transition-colors
              "
            >
              Reset to suggested
            </button>
          )}

{/* Purge & Rebuild — two-step */}
          {!confirmPurge && !purging && (
            <button
              type="button"
              onClick={() => { setConfirmPurge(true); setConfirmReset(false); setPurgeResult(null); }}
              className="
                text-xs px-3 py-1 rounded-lg
                border border-red-400/20 text-red-400/50
                hover:text-red-300 hover:border-red-400/40
                transition-colors
              "
            >
              Purge & Rebuild
            </button>
          )}

          {confirmPurge && (
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-white/40 mr-1">
                Clear all slots and rebuild from current photos?
              </span>
              <button
                type="button"
                onClick={handlePurge}
                disabled={purging}
                className="
                  text-xs px-3 py-1 rounded-lg
                  bg-red-400/10 border border-red-400/30 text-red-300
                  hover:bg-red-400/20 transition-colors disabled:opacity-50
                "
              >
                {purging ? 'Rebuilding…' : 'Yes, purge'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmPurge(false)}
                className="
                  text-xs px-3 py-1 rounded-lg
                  border border-white/10 text-white/30
                  hover:text-white/50 transition-colors
                "
              >
                Cancel
              </button>
            </div>
          )}

          {purging && (
            <span className="text-xs text-red-300/60 animate-pulse">Rebuilding from current photos…</span>
          )}

          {purgeResult && !confirmPurge && (
            <span className="text-[10px] text-green-400/60">
              ✓ Rebuilt — {purgeResult.photo_count} photos, {purgeResult.slot_count} slots
            </span>
          )}

          {purgeError && (
            <span className="text-[10px] text-red-400/60">{purgeError}</span>
          )}
          
          {confirmReset && (
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-white/40 mr-1">
                Reset this section?
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="
                  text-xs px-3 py-1 rounded-lg
                  bg-yellow-400/10 border border-yellow-400/30 text-yellow-300
                  hover:bg-yellow-400/20 transition-colors
                "
              >
                Yes, reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="
                  text-xs px-3 py-1 rounded-lg
                  border border-white/10 text-white/30
                  hover:text-white/50 transition-colors
                "
              >
                Cancel
              </button>
            </div>
          )}

        </div>
      </div>


      {/* ── Swap instruction banner ───────────────────────── */}
      {selectedId && (
        <div
          role="status"
          aria-live="polite"
          className="
            rounded-lg border border-yellow-400/20 bg-yellow-400/5
            px-4 py-2.5 text-center
          "
        >
          <p className="text-xs text-yellow-300/80">
            Photo selected — click another photo to swap positions,
            or use <strong>Replace</strong> to pick from the tray.
          </p>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-[10px] text-yellow-400/50 hover:text-yellow-300 mt-1 transition-colors"
          >
            Cancel selection
          </button>
        </div>
      )}


      {/* ── Photo slot grid ───────────────────────────────── */}
      <div className="space-y-2.5" aria-label={`Photos for ${section.phase_name}`}>
        {section.slots.map((slot, i) => {

          if (slot.slot_type === 'feature') {
            return (
              <FeatureSlotRow
                key={`feature-${slot.photo_id}-${i}`}
                photoId={slot.photo_id}
                caption={slot.caption}
                photos={photos}
                selectedId={selectedId}
                onClick={handlePhotoClick}
                onReplace={handleReplace}
                onPromote={onPromote}
                onRemove={onRemove}
              />
            );
          }

          if (slot.slot_type === 'double') {
            return (
              <DoubleSlotRow
                key={`double-${slot.photos[0].photo_id}-${i}`}
                photos={slot.photos}
                photoMap={photos}
                selectedId={selectedId}
                onClick={handlePhotoClick}
                onReplace={handleReplace}
                onPromote={onPromote}
                onRemove={onRemove}
              />
            );
          }

          // triple
          return (
            <TripleSlotRow
              key={`triple-${slot.photos[0].photo_id}-${i}`}
              photos={slot.photos}
              photoMap={photos}
              selectedId={selectedId}
              onClick={handlePhotoClick}
              onReplace={handleReplace}
              onPromote={onPromote}
              onRemove={onRemove}
            />
          );
        })}
      </div>


      {/* ── Excluded tray ─────────────────────────────────── */}
      {showTray && (
        <div id="excluded-tray">
          <ExcludedTray
            excludedIds={section.excluded_photos}
            photos={photos}
            onSelect={handleTraySelect}
            selectedInLayout={selectedId}
          />
        </div>
      )}

    </div>
  );
}
