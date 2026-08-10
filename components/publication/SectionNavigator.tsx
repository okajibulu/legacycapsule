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
  cover:                'Cover Page',
  honouree_profile:     'Honouree Profile',
  world_map:            'World Voices Map',
  tributes:             'Tributes',
  phase_photos:         'Phase Photos',
  official_photography: 'Official Photography',
  guest_captures:       'In The Room',
  memories:             'Memories',
  community_stories:    'Community Stories',
   
  collection_intelligence: 'Capsule Highlights',
  closing_message:         'Closing Message',
  appreciation:            'Family Vote of Thanks',
};

/** Icon character for each section type — rendered at small size in the row. */
const SECTION_ICONS: Record<string, string> = {
  cover:                '◈',
  honouree_profile:     '◎',
  world_map:            '⊕',
  tributes:             '❝',
  phase_photos:         '▦',
  official_photography: '◼',
  guest_captures:       '◻',
  memories:             '◌',
  community_stories:    '◍',
  collection_intelligence: '◈',
  closing_message:         '◇',
  appreciation:            '♡',
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

  // Sections that are auto-included when content exists — not user-toggleable
  const AUTO_ONLY = new Set(['official_photography', 'guest_captures', 'memories', 'community_stories']);

  return (
    <>
      {/* ══════════════════════════════════════════════════
          DESKTOP: fixed left sidebar (hidden on mobile)
      ══════════════════════════════════════════════════ */}
      <aside
        aria-label="Publication sections"
        className="
          hidden md:flex
          w-56 flex-shrink-0 flex-col
          border-r border-yellow-400/10
          bg-gradient-to-b from-[#100018] to-[#0a000e]
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-yellow-400/10 flex-shrink-0">
          <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">Publication</p>
          <p className="text-sm font-bold text-yellow-100 leading-tight">Sections</p>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" aria-label="Section list">
          {sections.map(section => {
            const isActive = section.id === activeSection;
            const isCover  = section.type === 'cover';
            const isAuto   = AUTO_ONLY.has(section.type);
            const isManual = 'arrangement_source' in section &&
                             (section as PhasePhotosSection).arrangement_source === 'manual';
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
                  ${!section.enabled && !isAuto ? 'opacity-40' : ''}
                `}
              >
                {/* Toggle — disabled for cover and auto sections */}
                {isAuto ? (
                  <span
                    title="Auto-included when content exists"
                    className="w-7 h-4 flex-shrink-0 flex items-center justify-center text-[9px] text-white/20"
                  >
                    ∞
                  </span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={section.enabled}
                    aria-label={`${section.enabled ? 'Hide' : 'Show'} ${label} in PDF`}
                    disabled={isCover}
                    onClick={e => { e.stopPropagation(); if (!isCover) onToggle(section.id); }}
                    className={`
                      relative w-7 h-4 rounded-full flex-shrink-0 transition-colors duration-200
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
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200 ${section.enabled ? 'left-3.5' : 'left-0.5'}`}
                    />
                  </button>
                )}

                {/* Icon */}
                <span
                  aria-hidden="true"
                  className={`text-[11px] flex-shrink-0 transition-colors ${isActive ? 'text-yellow-400' : 'text-white/20 group-hover:text-white/40'}`}
                >
                  {icon}
                </span>

                {/* Label */}
                <span className="text-xs truncate flex-1 leading-tight">{label}</span>

                {/* Auto badge */}
                {isAuto && (
                  <span className="text-[8px] text-white/20 flex-shrink-0 italic">auto</span>
                )}

                {/* Manual edit indicator */}
                {isManual && (
                  <span aria-label="Manually edited" title="You have made manual changes to this section" className="text-[9px] text-yellow-400/50 flex-shrink-0">✎</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
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

      {/* ══════════════════════════════════════════════════
          MOBILE: horizontal scroll strip (visible below md)
      ══════════════════════════════════════════════════ */}
      <div
        className="md:hidden flex-shrink-0 border-b border-yellow-400/10 bg-gradient-to-r from-[#100018] to-[#0a000e]"
        aria-label="Publication sections (mobile)"
      >
        <div className="flex overflow-x-auto px-3 py-2 gap-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {sections.map(section => {
            const isActive = section.id === activeSection;
            const isAuto   = AUTO_ONLY.has(section.type);
            const label = section.type === 'phase_photos'
              ? (section as PhasePhotosSection).phase_name ?? 'Photos'
              : SECTION_LABELS[section.type] ?? section.type;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`
                  flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-[11px] font-medium whitespace-nowrap transition-all duration-150
                  border
                  ${isActive
                    ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-200'
                    : 'bg-white/5 border-white/10 text-white/40 active:bg-white/10'
                  }
                  ${!section.enabled && !isAuto ? 'opacity-40' : ''}
                `}
              >
                {/* Mobile toggle — tap the dot to toggle (not available for cover/auto) */}
                {!isAuto && section.type !== 'cover' && (
                  <span
                    role="switch"
                    aria-checked={section.enabled}
                    onClick={e => { e.stopPropagation(); onToggle(section.id); }}
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${section.enabled ? 'bg-yellow-400' : 'bg-white/20'}`}
                  />
                )}
                {label}
                {isAuto && <span className="text-[8px] text-white/20 italic">auto</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
