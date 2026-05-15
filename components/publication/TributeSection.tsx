'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — TributeSection.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * The main area component for the 'tributes' section.
 *
 * Shows the ordered list of approved tribute contributions
 * and lets the organiser control how they are ordered in the PDF.
 *
 * Order modes (set via the order mode selector at the top):
 *   by_date         — chronological by submission time (default, auto)
 *   by_relationship — grouped by relationship field value
 *   manual          — organiser has dragged tributes into custom order
 *                     (manual drag-and-drop activates when this is selected)
 *
 * Each tribute row shows:
 *   - Contributor name (anonymous if is_anonymous)
 *   - Location (city, country)
 *   - Relationship label
 *   - Tribute text preview (first 120 chars)
 *   - Page number badge if page_map has been populated (after PDF generation)
 *   - Drag handle when in manual mode
 *
 * Drag and drop:
 *   Uses the HTML5 drag API (no external library).
 *   Only active when order_mode is 'manual'.
 *   Calls onReorder with the full updated TributeItem array on drop.
 *
 * Props:
 *   section       — TributesSection from layout_config
 *   contributions — map of contribution_id → contribution data (from parent fetch)
 *   onReorder     — called with updated TributeItem[] when order changes
 *   onSetOrderMode — called when organiser changes the order mode selector
 */

import { useState, useRef } from 'react';
import type {
  TributesSection,
  TributeItem,
  TributeOrderMode,
} from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Data types for contribution display
// ============================================================

/** Shape of contribution data as fetched by the parent (PublicationEditor). */
export interface ContributionDisplay {
  id: string;
  contributor_name: string;
  city: string | null;
  country: string | null;
  relationship: string | null;
  tribute_text: string | null;
  is_anonymous: boolean;
  created_at: string;
}


// ============================================================
// SECTION 2 — Props
// ============================================================

interface TributeSectionProps {
  section: TributesSection;
  contributions: Record<string, ContributionDisplay>;
  onReorder:     (items: TributeItem[]) => void;
  onSetOrderMode: (mode: TributeOrderMode) => void;
}


// ============================================================
// SECTION 3 — Order mode selector
// ============================================================

const ORDER_MODE_OPTIONS: { value: TributeOrderMode; label: string; description: string }[] = [
  {
    value:       'by_date',
    label:       'By date submitted',
    description: 'First tribute received appears first',
  },
  {
    value:       'by_relationship',
    label:       'By relationship',
    description: 'Grouped by relationship type (family, colleague, friend…)',
  },
  {
    value:       'manual',
    label:       'Custom order',
    description: 'Drag tributes into any order you prefer',
  },
];

function OrderModeSelector({
  current,
  onChange,
}: {
  current: TributeOrderMode;
  onChange: (mode: TributeOrderMode) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="Tribute order">
      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Order in PDF</p>
      <div className="flex gap-2 flex-wrap">
        {ORDER_MODE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={current === opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            className={`
              text-xs px-3 py-1.5 rounded-lg border transition-all duration-150
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400
              ${current === opt.value
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-200'
                : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// SECTION 4 — Individual tribute row
// ============================================================

function TributeRow({
  item,
  contribution,
  isDragging,
  isDragOver,
  isManualMode,
  dragHandleProps,
}: {
  item: TributeItem;
  contribution: ContributionDisplay | undefined;
  isDragging: boolean;
  isDragOver: boolean;
  isManualMode: boolean;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
}) {
  if (!contribution) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 opacity-40">
        <p className="text-xs text-white/30">Tribute data unavailable</p>
      </div>
    );
  }

  const displayName   = contribution.is_anonymous ? 'Anonymous' : contribution.contributor_name;
  const locationParts = [contribution.city, contribution.country].filter(Boolean);
  const location      = locationParts.join(', ');
  const preview       = contribution.tribute_text?.slice(0, 120) ?? '';
  const hasMore       = (contribution.tribute_text?.length ?? 0) > 120;

  return (
    <div
      aria-label={`Tribute from ${displayName}`}
      className={`
        rounded-lg border px-4 py-3 transition-all duration-150
        ${isDragging  ? 'opacity-40 scale-[0.99]' : ''}
        ${isDragOver  ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-white/10 bg-white/[0.02]'}
        ${isManualMode ? 'cursor-grab' : ''}
      `}
    >
      <div className="flex items-start gap-3">

        {/* Drag handle — only shown in manual mode */}
        {isManualMode && (
          <div
            {...dragHandleProps}
            aria-label="Drag to reorder"
            className="
              mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing
              text-white/20 hover:text-white/50 transition-colors
              select-none
            "
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2.5" cy="2.5" r="1.5"/>
              <circle cx="7.5" cy="2.5" r="1.5"/>
              <circle cx="2.5" cy="8"   r="1.5"/>
              <circle cx="7.5" cy="8"   r="1.5"/>
              <circle cx="2.5" cy="13.5" r="1.5"/>
              <circle cx="7.5" cy="13.5" r="1.5"/>
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-medium text-white/80 truncate">
              {displayName}
            </span>
            {location && (
              <span className="text-[10px] text-white/30 truncate">
                {location}
              </span>
            )}
            {contribution.relationship && (
              <span className="text-[10px] text-yellow-400/50 italic">
                {contribution.relationship}
              </span>
            )}
          </div>

          {preview && (
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
              {preview}{hasMore ? '…' : ''}
            </p>
          )}
        </div>

        {/* Page number badge — shown after PDF has been generated */}
        {item.page_number !== null && (
          <div
            aria-label={`Page ${item.page_number} in the PDF`}
            title={`Appears on page ${item.page_number}`}
            className="
              flex-shrink-0 px-2 py-0.5 rounded
              bg-white/5 border border-white/10
              text-[9px] text-white/30 tabular-nums
            "
          >
            p. {item.page_number}
          </div>
        )}

      </div>
    </div>
  );
}


// ============================================================
// SECTION 5 — Main component
// ============================================================

export default function TributeSection({
  section,
  contributions,
  onReorder,
  onSetOrderMode,
}: TributeSectionProps) {

  // ── 5.1  Drag state ───────────────────────────────────────

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const isManualMode = section.order_mode === 'manual';


  // ── 5.2  Drag handlers (HTML5 drag API) ──────────────────

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // required to allow drop
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      setDraggingIndex(null);
      return;
    }

    // Reorder the items array
    const newItems = [...section.items];
    const [dragged] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, {
      ...dragged,
      manually_positioned: true,
    });

    onReorder(newItems);
    dragIndexRef.current = null;
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
    setDraggingIndex(null);
  };


  // ── 5.3  Empty state ──────────────────────────────────────

  if (section.items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-white/40 text-sm">No approved tributes yet.</p>
        <p className="text-white/25 text-xs mt-2">
          Tributes appear here once they have been approved in the moderation queue.
        </p>
      </div>
    );
  }


  // ── 5.4  Render ───────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Order mode selector */}
      <OrderModeSelector current={section.order_mode} onChange={onSetOrderMode} />

      {/* Manual mode instruction */}
      {isManualMode && (
        <div
          role="note"
          aria-live="polite"
          className="
            rounded-lg border border-yellow-400/15 bg-yellow-400/5
            px-4 py-2.5 text-center
          "
        >
          <p className="text-xs text-yellow-300/70">
            Drag the handles on the left to reorder tributes.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          <span className="text-white/50 font-medium">{section.items.length}</span> tributes
          {section.order_mode !== 'by_date' && (
            <span className="ml-2 text-yellow-400/50">
              · {ORDER_MODE_OPTIONS.find(o => o.value === section.order_mode)?.label}
            </span>
          )}
        </p>
        {section.items.some(i => i.page_number !== null) && (
          <p className="text-[10px] text-white/25">
            Page numbers from last generated PDF
          </p>
        )}
      </div>

      {/* Tribute list */}
      <div className="space-y-2" role={isManualMode ? 'list' : undefined}>
        {section.items.map((item, index) => {
          const contribution = contributions[item.contribution_id];

          const dragHandleProps: React.HTMLAttributes<HTMLDivElement> = isManualMode
            ? {
                draggable: true,
                onDragStart: () => handleDragStart(index),
                onDragEnd:   handleDragEnd,
              }
            : {};

          return (
            <div
              key={item.contribution_id}
              role={isManualMode ? 'listitem' : undefined}
              draggable={isManualMode}
              onDragStart={isManualMode ? () => handleDragStart(index) : undefined}
              onDragOver={isManualMode ? e => handleDragOver(e, index) : undefined}
              onDrop={isManualMode ? e => handleDrop(e, index) : undefined}
              onDragEnd={isManualMode ? handleDragEnd : undefined}
            >
              <TributeRow
                item={item}
                contribution={contribution}
                isDragging={draggingIndex === index}
                isDragOver={dragOverIndex === index && draggingIndex !== index}
                isManualMode={isManualMode}
                dragHandleProps={dragHandleProps}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}
