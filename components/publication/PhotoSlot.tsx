'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — PhotoSlot.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * A single photo tile within the photo grid.
 * Used by PhotoSection for feature, double, and triple slots.
 *
 * Visual states:
 *   default    — photo displayed, hover shows action buttons
 *   selected   — organiser has clicked this photo (first click in a swap)
 *                gold ring, checkmark badge. A second click on any other
 *                photo will trigger a swap.
 *   swapTarget — a different photo is selected, this photo is eligible
 *                to be swapped with it. Subtle gold ring on hover.
 *   feature    — photo occupies a feature (full-width) slot.
 *                Promote action is hidden (already at feature level).
 *
 * Hover actions (appear as overlay buttons):
 *   Replace  — opens the ExcludedTray to pick a replacement
 *   Feature  — promotes this photo to a full-width feature slot
 *              (only shown on double/triple slot photos)
 *   Remove   — moves this photo to the excluded tray
 *
 * Props:
 *   photoId     — ID of the photo this tile represents
 *   caption     — current caption string
 *   imageUrl    — resolved URL for the <img> src (pre-fetched by parent)
 *   isSelected  — this photo is the first-click swap selection
 *   isSwapTarget — a different photo is selected; this is a potential swap target
 *   isFeature   — this photo is in a feature (full-width) slot
 *   onClick     — swap interaction handler
 *   onReplace   — opens the tray for replacement
 *   onPromote   — promotes to feature slot
 *   onRemove    — removes to excluded tray
 */


// ============================================================
// SECTION 1 — Props
// ============================================================

interface PhotoSlotProps {
  photoId: string;
  caption: string;
  imageUrl: string | null;
  isSelected: boolean;
  isSwapTarget: boolean;
  isFeature: boolean;
  onClick: (photoId: string) => void;
  onReplace: (photoId: string) => void;
  onPromote: (photoId: string) => void;
  onRemove: (photoId: string) => void;
}


// ============================================================
// SECTION 2 — Component
// ============================================================

export default function PhotoSlot({
  photoId,
  caption,
  imageUrl,
  isSelected,
  isSwapTarget,
  isFeature,
  onClick,
  onReplace,
  onPromote,
  onRemove,
}: PhotoSlotProps) {

  // ── 2.1  Ring / border style based on state ───────────────

  const ringClass =
    isSelected
      ? 'ring-2 ring-yellow-400 border-yellow-400/60'
      : isSwapTarget
        ? 'ring-1 ring-yellow-400/30 border-yellow-400/20 hover:ring-2 hover:ring-yellow-400/60'
        : 'border-white/10 hover:border-yellow-400/20';

  // Feature slots use a wider aspect ratio; double/triple use square
  const aspectClass = isFeature ? 'aspect-video' : 'aspect-square';


  // ── 2.2  Render ───────────────────────────────────────────

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Photo${caption ? `: ${caption}` : ''}${isSelected ? ' — selected, click another to swap' : ''}`}
      aria-pressed={isSelected}
      onClick={() => onClick(photoId)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(photoId); }}
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden
        ${aspectClass}
        border transition-all duration-150
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400
        ${ringClass}
      `}
    >

      {/* ── Photo image ───────────────────────────────────── */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={caption || ''}
          loading="lazy"
          draggable={false}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-full h-full bg-white/5 flex items-center justify-center"
        >
          <span className="text-white/20 text-2xl">▦</span>
        </div>
      )}


      {/* ── Hover action overlay ──────────────────────────── */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0
          bg-gradient-to-t from-black/80 via-black/40 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          flex flex-col justify-end p-2 gap-1.5
        "
        onClick={e => e.stopPropagation()} // prevent tile click when using action buttons
      >
        {/* Caption line */}
        {caption && (
          <p className="text-white/60 text-[9px] leading-tight truncate mb-0.5">
            {caption}
          </p>
        )}

        {/* Action buttons row */}
        <div className="flex gap-1 flex-wrap">
          <button
            type="button"
            aria-label={`Replace this photo`}
            onClick={e => { e.stopPropagation(); onReplace(photoId); }}
            className="
              text-[10px] px-2 py-0.5 rounded
              bg-white/20 hover:bg-white/35
              text-white transition-colors
            "
          >
            Replace
          </button>

          {!isFeature && (
            <button
              type="button"
              aria-label="Make this photo full-width (feature)"
              onClick={e => { e.stopPropagation(); onPromote(photoId); }}
              className="
                text-[10px] px-2 py-0.5 rounded
                bg-yellow-400/20 hover:bg-yellow-400/35
                text-yellow-200 transition-colors
              "
            >
              Feature
            </button>
          )}

          <button
            type="button"
            aria-label="Remove this photo from the layout"
            onClick={e => { e.stopPropagation(); onRemove(photoId); }}
            className="
              text-[10px] px-2 py-0.5 rounded
              bg-red-500/20 hover:bg-red-500/35
              text-red-300 transition-colors
            "
          >
            Remove
          </button>
        </div>
      </div>


      {/* ── Selected state badge ──────────────────────────── */}
      {isSelected && (
        <div
          aria-hidden="true"
          className="
            absolute top-1.5 right-1.5
            w-5 h-5 rounded-full
            bg-yellow-400 flex items-center justify-center
            shadow-md
          "
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="#1a0035" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}


      {/* ── Manual position indicator ─────────────────────── */}
      {/* Small dot in top-left corner if this photo was manually positioned */}
      {/* Populated by parent when slot.manually_positioned === true */}

    </div>
  );
}
