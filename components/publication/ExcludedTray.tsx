'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — ExcludedTray.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * The excluded photos tray — right side of the PhotoSection.
 *
 * Shows all photos that exist for this phase but were either:
 *   a) Scored out of the top-100 by the auto-arrangement algorithm, or
 *   b) Manually removed by the organiser using the Remove action.
 *
 * Two modes depending on whether a photo is selected in the layout:
 *
 *   Replace mode (selectedInLayout is set):
 *     Organiser has clicked a photo in the grid to select it.
 *     Clicking a tray photo calls onSelect — replaces the selected
 *     layout photo with this tray photo.
 *     Tray photos glow to signal they are selectable.
 *
 *   Browse mode (selectedInLayout is null):
 *     Organiser is viewing the tray without a selection pending.
 *     Clicking a tray photo has no effect — a helper prompt explains
 *     they need to click a layout photo first.
 *
 * Props:
 *   excludedIds       — photo IDs in excluded_photos for this section
 *   photos            — map of photo_id → gallery_item metadata (from parent fetch)
 *   onSelect          — called with photo_id when organiser picks a replacement
 *   selectedInLayout  — photo_id currently selected in the layout grid, or null
 */

import type { GalleryItemForArrangement } from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Props
// ============================================================

interface ExcludedTrayProps {
  excludedIds: string[];
  photos: Record<string, GalleryItemForArrangement & { image_url: string }>;
  onSelect: (photoId: string) => void;
  selectedInLayout: string | null;
}


// ============================================================
// SECTION 2 — Component
// ============================================================

export default function ExcludedTray({
  excludedIds,
  photos,
  onSelect,
  selectedInLayout,
}: ExcludedTrayProps) {

  const isReplaceMode = selectedInLayout !== null;

  // ── 2.1  Empty state ──────────────────────────────────────

  if (excludedIds.length === 0) {
    return (
      <div
        aria-label="Excluded photos tray"
        className="
          mt-4 rounded-xl border border-white/10
          bg-white/[0.02] p-6 text-center
        "
      >
        <p className="text-xs text-white/30">
          All photos for this phase are included in the layout.
        </p>
        <p className="text-[10px] text-white/20 mt-1">
          Remove photos from the grid above to add them here.
        </p>
      </div>
    );
  }


  // ── 2.2  Replace mode prompt ───────────────────────────────

  return (
    <div
      aria-label="Excluded photos tray"
      className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/60">
            Photo Tray
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">
            {excludedIds.length} photo{excludedIds.length !== 1 ? 's' : ''} not currently in layout
          </p>
        </div>

        {isReplaceMode && (
          <span
            aria-live="polite"
            className="
              text-[10px] px-2 py-1 rounded-full
              bg-yellow-400/10 border border-yellow-400/20
              text-yellow-300
            "
          >
            Select to replace
          </span>
        )}
      </div>

      {/* Instruction when in browse mode */}
      {!isReplaceMode && (
        <div
          aria-live="polite"
          className="px-4 py-2.5 bg-white/[0.02] border-b border-white/5"
        >
          <p className="text-[10px] text-white/30 leading-relaxed">
            Click a photo in the grid above to select it, then click a tray photo to swap it in.
          </p>
        </div>
      )}

      {/* Photo grid */}
      <div className="p-3 grid grid-cols-3 gap-2">
        {excludedIds.map(photoId => {
          const photo   = photos[photoId];
          const imgUrl  = photo?.image_url ?? null;
          const caption = photo?.caption   ?? null;

          return (
            <button
              key={photoId}
              type="button"
              disabled={!isReplaceMode}
              aria-label={
                isReplaceMode
                  ? `Use this photo as replacement${caption ? `: ${caption}` : ''}`
                  : `Excluded photo${caption ? `: ${caption}` : ''} — select a grid photo first to replace`
              }
              onClick={() => {
                if (isReplaceMode) onSelect(photoId);
              }}
              className={`
                relative rounded-lg overflow-hidden aspect-square
                border transition-all duration-150
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400
                ${isReplaceMode
                  ? 'border-yellow-400/30 hover:border-yellow-400 hover:scale-[1.03] cursor-pointer ring-0 hover:ring-2 hover:ring-yellow-400/40'
                  : 'border-white/10 cursor-not-allowed opacity-60'
                }
              `}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={caption ?? ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span aria-hidden="true" className="text-white/20 text-lg">▦</span>
                </div>
              )}

              {/* Replace mode overlay */}
              {isReplaceMode && (
                <div
                  aria-hidden="true"
                  className="
                    absolute inset-0 bg-yellow-400/0 hover:bg-yellow-400/10
                    transition-colors duration-150
                    flex items-center justify-center
                    opacity-0 hover:opacity-100
                  "
                >
                  <span className="text-yellow-200 text-[10px] font-bold bg-black/50 px-2 py-1 rounded">
                    Use this
                  </span>
                </div>
              )}

              {/* Caption tooltip */}
              {caption && (
                <div
                  aria-hidden="true"
                  className="
                    absolute bottom-0 inset-x-0 px-1 py-0.5
                    bg-black/60 text-[8px] text-white/70
                    truncate text-center
                  "
                >
                  {caption}
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
