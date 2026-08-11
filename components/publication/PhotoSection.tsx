'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/publication/PhotoSection.tsx
// PURPOSE:   Main area component for a phase_photos section in the publication
//            editor. Renders all photo slots for a single event phase and
//            coordinates organiser interactions: swap, replace, promote, remove,
//            reset-to-auto, and purge & rebuild.
// ARCHITECTURE: Publication Editor — organiser-facing manage tool only.
//               Purge & Rebuild calls /api/publication/purge-section (POST).
//               All slot rendering delegated to PhotoSlot + ExcludedTray.
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.91
// DATE:      11 August 2026
//
// INTERACTION MODEL:
//   Swap       — click-click: first click selects, second click swaps
//   Replace    — click Replace on slot → ExcludedTray opens → click tray photo
//   Promote    — extracts photo into its own full-width feature slot
//   Remove     — moves photo to excluded tray
//   Reset      — two-step confirm → resets section to auto-arrangement
//   Purge      — two-step confirm → clears all slots, rebuilds from current
//                gallery_items. Moved below photo grid (destructive action
//                intentionally separated from non-destructive toolbar controls).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type {
  PhasePhotosSection,
  PhotoSlot as PhotoSlotType,
  GalleryItemForArrangement,
} from '@/lib/publication/types'
import PhotoSlotComponent from './PhotoSlot'
import ExcludedTray from './ExcludedTray'

// ═══ SECTION 1 — Props ═══

interface PhotoSectionProps {
  section:   PhasePhotosSection
  photos:    Record<string, GalleryItemForArrangement & { image_url: string }>
  capsuleId: string
  onSwap:    (idA: string, idB: string) => void
  onReplace: (outgoing: string, incoming: string) => void
  onRemove:  (id: string) => void
  onPromote: (id: string) => void
  onReset:   () => void
  onPurged:  (newLayout: import('@/lib/publication/types').LayoutConfig) => void
}

// ═══ SECTION 2 — Internal utilities ═══

/** Count all photo IDs present in slots (not excluded). */
function countIncluded(slots: PhotoSlotType[]): number {
  return slots.reduce((n, slot) => {
    if (slot.slot_type === 'feature') return n + 1
    return n + slot.photos.length
  }, 0)
}

// ═══ SECTION 3 — Slot layout renderers ═══

/**
 * Renders a feature (full-width) slot.
 */
function FeatureSlotRow({
  photoId, caption, photos, selectedId,
  onClick, onReplace, onPromote, onRemove,
}: {
  photoId:    string
  caption:    string
  photos:     PhotoSectionProps['photos']
  selectedId: string | null
  onClick:    (id: string) => void
  onReplace:  (id: string) => void
  onPromote:  (id: string) => void
  onRemove:   (id: string) => void
}) {
  const photo = photos[photoId]
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
  )
}

/**
 * Renders a double slot — two photos side by side.
 */
function DoubleSlotRow({
  photos: photoPairs, photoMap, selectedId,
  onClick, onReplace, onPromote, onRemove,
}: {
  photos:     Array<{ photo_id: string; caption: string }>
  photoMap:   PhotoSectionProps['photos']
  selectedId: string | null
  onClick:    (id: string) => void
  onReplace:  (id: string) => void
  onPromote:  (id: string) => void
  onRemove:   (id: string) => void
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
  )
}

/**
 * Renders a triple slot — three photos in a row.
 */
function TripleSlotRow({
  photos: photoTriple, photoMap, selectedId,
  onClick, onReplace, onPromote, onRemove,
}: {
  photos:     Array<{ photo_id: string; caption: string }>
  photoMap:   PhotoSectionProps['photos']
  selectedId: string | null
  onClick:    (id: string) => void
  onReplace:  (id: string) => void
  onPromote:  (id: string) => void
  onRemove:   (id: string) => void
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
  )
}

// ═══ SECTION 4 — Main component ═══

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

  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [showTray,     setShowTray]     = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [purging,      setPurging]      = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [purgeResult,  setPurgeResult]  = useState<{ photo_count: number; slot_count: number } | null>(null)
  const [purgeError,   setPurgeError]   = useState<string | null>(null)

  // ── 4.2  Interaction handlers ─────────────────────────────

  const handlePhotoClick = (photoId: string) => {
    if (!selectedId) { setSelectedId(photoId); return }
    if (selectedId === photoId) { setSelectedId(null); return }
    onSwap(selectedId, photoId)
    setSelectedId(null)
  }

  const handleReplace = (photoId: string) => {
    setSelectedId(photoId)
    setShowTray(true)
  }

  const handleTraySelect = (newPhotoId: string) => {
    if (selectedId) {
      onReplace(selectedId, newPhotoId)
      setSelectedId(null)
      setShowTray(false)
    }
  }

  const handleReset = () => {
    onReset()
    setConfirmReset(false)
    setSelectedId(null)
    setShowTray(false)
  }

  const handlePurge = async () => {
    setPurging(true)
    setPurgeError(null)
    try {
      const res = await fetch('/api/publication/purge-section', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          section_id: section.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Purge failed')
      setPurgeResult({ photo_count: data.photo_count, slot_count: data.slot_count })
      onPurged(data.layout_config)
      setConfirmPurge(false)
      setSelectedId(null)
      setShowTray(false)
    } catch (err) {
      setPurgeError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPurging(false)
    }
  }

  // ── 4.3  Derived counts ───────────────────────────────────

  const totalIncluded = countIncluded(section.slots)
  const totalExcluded = section.excluded_photos.length
  const isManual      = section.arrangement_source === 'manual'

  // ── 4.4  Empty state ──────────────────────────────────────

  if (section.slots.length === 0 && section.excluded_photos.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-white/40 text-sm">No photos in this phase yet.</p>
        <p className="text-white/25 text-xs mt-2">
          Photos uploaded during the event for this phase will appear here once approved.
        </p>
      </div>
    )
  }

  // ── 4.5  Render ───────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ═══ SECTION 4A — Toolbar (non-destructive controls only) ═══ */}
      {/* Purge & Rebuild intentionally excluded from this toolbar —     */}
      {/* it lives below the photo grid as a separated destructive zone. */}
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

        {/* Non-destructive toolbar buttons */}
        <div className="flex gap-2 items-center flex-wrap">

          {/* Tray toggle */}
          {totalExcluded > 0 && (
            <button
              type="button"
              onClick={() => setShowTray(v => !v)}
              aria-expanded={showTray}
              aria-controls="excluded-tray"
              className="text-xs px-3 py-1 rounded-lg border border-white/15 text-white/50 hover:text-white/70 hover:border-white/25 transition-colors"
            >
              {showTray ? 'Hide tray' : `Show tray (${totalExcluded})`}
            </button>
          )}

          {/* Reset to auto — two-step */}
          {isManual && !confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs px-3 py-1 rounded-lg border border-yellow-400/20 text-yellow-400/60 hover:text-yellow-300 hover:border-yellow-400/40 transition-colors"
            >
              Reset to suggested
            </button>
          )}

          {confirmReset && (
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-white/40 mr-1">Reset this section?</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs px-3 py-1 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 transition-colors"
              >
                Yes, reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs px-3 py-1 rounded-lg border border-white/10 text-white/30 hover:text-white/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Swap instruction banner ─────────────────────────── */}
      {selectedId && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-2.5 text-center"
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

      {/* ═══ SECTION 4B — Photo slot grid ═══ */}
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
            )
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
            )
          }
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
          )
        })}
      </div>

      {/* ── Excluded tray ──────────────────────────────────── */}
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

      {/* ═══ SECTION 4C — Purge & Rebuild zone ═══ */}
      {/* Deliberately separated below the photo grid.                       */}
      {/* Destructive actions should never live in the same toolbar row as   */}
      {/* non-destructive controls — visual separation prevents misclicks.  */}
      <div className="mt-6 pt-5 border-t border-white/[0.07]">
        <div className="rounded-xl border border-red-400/15 bg-red-400/[0.03] p-4">

          {/* Zone header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-semibold text-red-400/70 uppercase tracking-widest mb-1">
                Purge &amp; Rebuild
              </p>
              <p className="text-[11px] text-white/30 leading-relaxed">
                Clears all current slots and rebuilds this section from scratch using the
                photos currently in the gallery. Use this if the layout is out of sync
                with recently added or removed photos.
              </p>
            </div>

            {/* Trigger button — only shown when not in confirm or purging state */}
            {!confirmPurge && !purging && (
              <button
                type="button"
                onClick={() => {
                  setConfirmPurge(true)
                  setConfirmReset(false)
                  setPurgeResult(null)
                  setPurgeError(null)
                }}
                className="flex-shrink-0 text-xs px-4 py-2 rounded-lg border border-red-400/25 text-red-400/60 hover:text-red-300 hover:border-red-400/40 hover:bg-red-400/5 transition-colors"
              >
                Purge &amp; Rebuild
              </button>
            )}
          </div>

          {/* Success state */}
          {purgeResult && !confirmPurge && !purging && (
            <div className="flex items-center gap-2 text-[11px] text-green-400/70 bg-green-400/5 border border-green-400/15 rounded-lg px-3 py-2">
              <span>✓</span>
              <span>
                Rebuilt successfully — {purgeResult.photo_count} photo{purgeResult.photo_count !== 1 ? 's' : ''} across {purgeResult.slot_count} slot{purgeResult.slot_count !== 1 ? 's' : ''}.
                Regenerate the publication to see the updated layout.
              </span>
            </div>
          )}

          {/* Error state */}
          {purgeError && !purging && (
            <div className="flex items-center gap-2 text-[11px] text-red-400/70 bg-red-400/5 border border-red-400/15 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>{purgeError}</span>
            </div>
          )}

          {/* In-progress state */}
          {purging && (
            <div className="flex items-center gap-2 text-[11px] text-white/40 animate-pulse">
              <span>⟳</span>
              <span>Rebuilding from current photos… this may take a moment.</span>
            </div>
          )}

          {/* Two-step confirm panel */}
          {confirmPurge && !purging && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
              <p className="text-xs text-red-300/80 mb-3 leading-relaxed">
                This will permanently clear all current slot arrangements for this phase
                and rebuild from the photos currently in the gallery. Manual edits will
                be lost. Continue?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePurge}
                  className="text-xs px-4 py-2 rounded-lg bg-red-400/15 border border-red-400/35 text-red-300 hover:bg-red-400/25 transition-colors font-medium"
                >
                  Yes, purge and rebuild
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPurge(false)}
                  className="text-xs px-4 py-2 rounded-lg border border-white/10 text-white/30 hover:text-white/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
