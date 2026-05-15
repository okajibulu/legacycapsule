'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — SectionNavigator.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Left sidebar of the Publication Editor.
 *
 * Renders the ordered list of all sections in the publication.
 * Each row has:
 *   - A toggle switch — enable/disable this section in the PDF
 *   - A section label — click to make this section active in the main area
 *   - An edit indicator — pencil mark if section has been manually modified
 *
 * The cover section cannot be toggled off (always enabled).
 *
 * Props:
 *   sections      — ordered Section array from layout_config
 *   activeSection — id of the section currently shown in the main area
 *   onSelect      — called when organiser clicks a section row
 *   onToggle      — called when organiser clicks a section's toggle switch
 *   pubId         — publication id, shown in the footer for debugging
 */

import type { Section, PhasePhotosSection } from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Constants
// ============================================================

/** Human-readable labels for each section type. */
const SECTION_LABELS: Record<string, string> = {
  cover:            'Cover Page',
  honouree_profile: 'Honouree Profile',
  tributes:         'Tributes',
  phase_photos:     'Phase Photos',
  who_attended:     'Who Attended',
  closing_message:  'Closing Message',
};

/** Icon character for each section type — rendered at small size in the row. */
const SECTION_ICONS: Record<string, string> = {
  cover:            '◈',
  honouree_profile: '◎',
  tributes:         '❝',
  phase_photos:     '▦',
  who_attended:     '◉',
  closing_message:  '◇',
};


// ============================================================
// SECTION 2 — Props
// ============================================================

interface SectionNavigatorProps {
  sections: Section[];
  activeSection: string;
  onSelect: (sectionId: string) => void;
  onToggle: (sectionId: string) => void;
  pubId?: string;
}


// ============================================================
// SECTION 3 — Component
// ============================================================

export default function SectionNavigator({
  sections,
  activeSection,
  onSelect,
  onToggle,
  pubId,
}: SectionNavigatorProps) {

  return (
    <aside
      aria-label="Publication sections"
      className="
        w-56 flex-shrink-0 flex flex-col
        border-r border-yellow-400/10
        bg-gradient-to-b from-[#100018] to-[#0a000e]
        overflow-hidden
      "
    >

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-yellow-400/10 flex-shrink-0">
        <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">
          Publication
        </p>
        <p className="text-sm font-bold text-yellow-100 leading-tight">
          Sections
        </p>
      </div>


      {/* ── Section list ────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        aria-label="Section list"
      >
        {sections.map(section => {
          const isActive  = section.id === activeSection;
          const isCover   = section.type === 'cover';
          const isManual  = 'arrangement_source' in section &&
                            (section as PhasePhotosSection).arrangement_source === 'manual';

          // For phase sections, use the phase name; for all others, use the type label
          const label = section.type === 'phase_photos'
            ? (section as PhasePhotosSection).phase_name ?? SECTION_LABELS.phase_photos
            : SECTION_LABELS[section.type] ?? section.type;

          const icon = SECTION_ICONS[section.type] ?? '·';

          return (
            <div
              key={section.id}
              role="button"
              tabIndex={0}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`${label}${!section.enabled ? ' (hidden)' : ''}`}
              onClick={() => onSelect(section.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(section.id); }}
              className={`
                flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer
                transition-all duration-150 group select-none
                focus-visible:outline focus-visible:outline-1 focus-visible:outline-yellow-400/50
                ${isActive
                  ? 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-200'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                }
                ${!section.enabled ? 'opacity-40' : ''}
              `}
            >

              {/* ── Toggle switch ──────────────────────── */}
              <button
                type="button"
                role="switch"
                aria-checked={section.enabled}
                aria-label={`${section.enabled ? 'Hide' : 'Show'} ${label} in PDF`}
                disabled={isCover}
                onClick={e => {
                  e.stopPropagation();
                  if (!isCover) onToggle(section.id);
                }}
                className={`
                  relative w-7 h-4 rounded-full flex-shrink-0
                  transition-colors duration-200
                  focus-visible:outline focus-visible:outline-1 focus-visible:outline-yellow-400
                  ${isCover
                    ? 'bg-yellow-400/30 cursor-not-allowed'
                    : section.enabled
                      ? 'bg-yellow-400 cursor-pointer'
                      : 'bg-white/15 cursor-pointer hover:bg-white/25'
                  }
                `}
              >
                <span
                  aria-hidden="true"
                  className={`
                    absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm
                    transition-all duration-200
                    ${section.enabled ? 'left-3.5' : 'left-0.5'}
                  `}
                />
              </button>


              {/* ── Icon ──────────────────────────────── */}
              <span
                aria-hidden="true"
                className={`
                  text-[11px] flex-shrink-0 transition-colors
                  ${isActive ? 'text-yellow-400' : 'text-white/20 group-hover:text-white/40'}
                `}
              >
                {icon}
              </span>


              {/* ── Label ─────────────────────────────── */}
              <span className="text-xs truncate flex-1 leading-tight">
                {label}
              </span>


              {/* ── Manual edit indicator ─────────────── */}
              {isManual && (
                <span
                  aria-label="Manually edited"
                  title="You have made manual changes to this section"
                  className="text-[9px] text-yellow-400/50 flex-shrink-0"
                >
                  ✎
                </span>
              )}

            </div>
          );
        })}
      </nav>


      {/* ── Footer — counts + pub id ─────────────────────── */}
      <div className="px-4 py-3 border-t border-yellow-400/10 flex-shrink-0">
        <p className="text-[9px] text-white/20 leading-relaxed">
          {sections.filter(s => s.enabled).length} of {sections.length} sections enabled
        </p>
        {pubId && (
          <p className="text-[8px] text-white/10 mt-0.5 font-mono truncate" title={pubId}>
            {pubId.slice(0, 8)}…
          </p>
        )}
      </div>

    </aside>
  );
}
