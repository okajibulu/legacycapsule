'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — PublicationEditor.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Top-level shell for the Publication Editor.
 *
 * Responsibilities:
 *   1. Initialise — POST to /api/publication/init on mount.
 *      Returns existing layout_config or triggers auto-arrangement.
 *   2. Pre-fetch — load all photo metadata and contribution data
 *      referenced in the layout_config, so child components never
 *      individually query Supabase.
 *   3. State — hold the live layout_config in React state.
 *      All mutations flow through the mutate() helper.
 *   4. Autosave — debounced POST to /api/publication/save on
 *      every layout change (800ms after last mutation).
 *   5. Composition — render SectionNavigator (left), the active
 *      section editor (main), and GenerateButton (right sidebar).
 *
 * Three-panel layout:
 *   ┌────────────┬──────────────────────┬──────────────┐
 *   │ Section    │  Active section      │  Generate    │
 *   │ Navigator  │  editor              │  panel       │
 *   │  (left)    │  (main, scrollable)  │  (right)     │
 *   └────────────┴──────────────────────┴──────────────┘
 *
 * Props:
 *   capsuleId   — UUID of the capsule (from page params)
 *   capsuleSlug — slug (used for back-navigation link)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  LayoutConfig,
  PhasePhotosSection,
  TributesSection,
  TributeItem,
  TributeOrderMode,
  GalleryItemForArrangement,
  EditorSaveState,
} from '@/lib/publication/types';
import {
  swapPhotos,
  replacePhoto,
  removePhoto,
  promoteToFeature,
  toggleSection,
  resetSectionToAuto,
  setTributeOrderMode,
  getAllPhotoIds,
} from '@/lib/publication/layoutHelpers';
import SectionNavigator from './SectionNavigator';
import PhotoSection     from './PhotoSection';
import TributeSection, { type ContributionDisplay } from './TributeSection';
import GenerateButton   from './GenerateButton';


// ============================================================
// SECTION 1 — Supabase anon client (client-side reads only)
// Data writes go through server-side API routes, never directly
// from the client. This client is for read-only pre-fetching.
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Autosave debounce delay in milliseconds. */
const AUTOSAVE_DELAY_MS = 800;


// ============================================================
// SECTION 2 — Props
// ============================================================

interface PublicationEditorProps {
  capsuleId:   string;
  capsuleSlug: string;
}


// ============================================================
// SECTION 3 — Save status indicator
// ============================================================

function SaveStatusBadge({ state }: { state: EditorSaveState }) {
  const copy: Record<EditorSaveState, string> = {
    saved:   'All changes saved',
    saving:  'Saving…',
    unsaved: 'Unsaved changes',
    error:   'Save failed — retrying',
  };
  const colour: Record<EditorSaveState, string> = {
    saved:   'text-white/25',
    saving:  'text-yellow-400/50',
    unsaved: 'text-white/40',
    error:   'text-red-400/60',
  };
  return (
    <span
      aria-live="polite"
      aria-label={copy[state]}
      className={`text-[10px] transition-colors duration-300 ${colour[state]}`}
    >
      {copy[state]}
    </span>
  );
}


// ============================================================
// SECTION 4 — Non-editable section placeholder
// Shown for cover, honouree_profile, who_attended, closing_message
// ============================================================

function AutoSectionPlaceholder({ type }: { type: string }) {
  const messages: Record<string, { title: string; detail: string }> = {
    cover: {
      title:  'Cover page is generated automatically.',
      detail: 'It uses your honouree name, event date, cover style, and hero image from the Capsule settings.',
    },
    honouree_profile: {
      title:  'Honouree profile is generated from your Capsule content.',
      detail: 'Edit the profile sections in the Capsule Content panel to update what appears here.',
    },
    who_attended: {
      title:  'Who Attended is generated from your guest check-in list.',
      detail: 'Guests marked as checked in will appear in this section.',
    },
    closing_message: {
      title:  'The closing message is a fixed LegacyCapsule colophon.',
      detail: 'It appears at the end of every publication.',
    },
  };

  const msg = messages[type] ?? {
    title:  'This section is generated automatically.',
    detail: 'Edit the source content in your Capsule to change what appears here.',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
      <p className="text-white/50 text-sm font-medium mb-2">{msg.title}</p>
      <p className="text-white/30 text-xs leading-relaxed max-w-sm mx-auto">{msg.detail}</p>
    </div>
  );
}


// ============================================================
// SECTION 5 — Main component
// ============================================================

export default function PublicationEditor({
  capsuleId,
  capsuleSlug,
}: PublicationEditorProps) {

  // ── 5.1  Core state ───────────────────────────────────────

  /** Live layout config — mutations applied here trigger autosave. */
  const [layout,        setLayout]        = useState<LayoutConfig | null>(null);

  /**
   * The original auto-generated layout — stored on first load.
   * Never mutated. Used by resetSectionToAuto() as the reference state.
   */
  const [autoLayout,    setAutoLayout]    = useState<LayoutConfig | null>(null);

  /** ID of the section currently shown in the main area. */
  const [activeSection, setActiveSection] = useState<string>('section_cover');

  /** Publication record ID — passed to GenerateButton. */
  const [pubId,         setPubId]         = useState<string | null>(null);

  /** Existing PDF URL from a previous successful generation, if any. */
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  /** Version number from a previous successful generation. */
  const [existingVersion, setExistingVersion] = useState<number | null>(null);

  /** Autosave state indicator. */
  const [saveState,     setSaveState]     = useState<EditorSaveState>('saved');

  /** Whether the layout has any changes not yet saved. */
  const hasUnsavedChanges = saveState === 'unsaved' || saveState === 'saving';

  /** Loading state during init. */
  const [initialising,  setInitialising]  = useState(true);

  /** Init error message if /api/publication/init failed. */
  const [initError,     setInitError]     = useState<string | null>(null);


  // ── 5.2  Pre-fetched content maps ─────────────────────────

  /**
   * Map of photo_id → gallery item metadata.
   * Pre-fetched on init. Passed to PhotoSection / ExcludedTray.
   * Includes image_url so child components render without querying Supabase.
   */
  const [photos, setPhotos] = useState<
    Record<string, GalleryItemForArrangement & { image_url: string }>
  >({});

  /**
   * Map of contribution_id → contribution display data.
   * Pre-fetched on init. Passed to TributeSection.
   */
  const [contributions, setContributions] = useState<
    Record<string, ContributionDisplay>
  >({});


  // ── 5.3  Autosave infrastructure ──────────────────────────

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveLayout = useCallback(async (newLayout: LayoutConfig) => {
    // Clear any pending autosave
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setSaveState('unsaved');

    saveTimerRef.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        const res = await fetch('/api/publication/save', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ capsule_id: capsuleId, layout_config: newLayout }),
        });
        setSaveState(res.ok ? 'saved' : 'error');
      } catch {
        setSaveState('error');
      }
    }, AUTOSAVE_DELAY_MS);
  }, [capsuleId]);


  // ── 5.4  Initialisation ───────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setInitialising(true);
      setInitError(null);

      try {
        // ── Step 1: Call /api/publication/init ──────────────
        const initRes = await fetch('/api/publication/init', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ capsule_id: capsuleId }),
        });

        if (!initRes.ok) {
          const data = await initRes.json().catch(() => ({}));
          throw new Error(data.error ?? `Init failed with status ${initRes.status}`);
        }

        const { layout_config, pub_id } = await initRes.json();

        setLayout(layout_config);
        setAutoLayout(layout_config); // frozen reference for reset
        setPubId(pub_id);

        // ── Step 2: Fetch existing PDF metadata ─────────────
        const { data: pubRow } = await supabase
          .from('publications')
          .select('pdf_url, version, generation_status')
          .eq('id', pub_id)
          .maybeSingle();

        if (pubRow?.pdf_url) {
          setExistingPdfUrl(pubRow.pdf_url);
          setExistingVersion(pubRow.version);
        }

        // ── Step 3: Pre-fetch all photo metadata ─────────────
        const allPhotoIds = getAllPhotoIds(layout_config);

        if (allPhotoIds.length > 0) {
          const { data: photoRows } = await supabase
            .from('gallery_items')
            .select('id, image_url, caption, width_px, height_px, aspect_ratio, phase_id, approved, created_at')
            .in('id', allPhotoIds);

          if (photoRows) {
            const map: typeof photos = {};
            photoRows.forEach(p => { map[p.id] = p; });
            setPhotos(map);
          }
        }

        // ── Step 4: Pre-fetch all contribution display data ───
        const tributeSection = layout_config.sections.find(
          (s: { type: string }) => s.type === 'tributes'
        ) as TributesSection | undefined;

        if (tributeSection && tributeSection.items.length > 0) {
          const contribIds = tributeSection.items.map((i: TributeItem) => i.contribution_id);
          const { data: contribRows } = await supabase
            .from('contributions')
            .select('id, contributor_name, city, country, relationship, tribute_text, is_anonymous, created_at')
            .in('id', contribIds);

          if (contribRows) {
            const map: typeof contributions = {};
            contribRows.forEach(c => { map[c.id] = c; });
            setContributions(map);
          }
        }

        // ── Step 5: Set active section to first enabled section
        const firstEnabled = layout_config.sections.find(
          (s: { enabled: boolean }) => s.enabled
        );
        if (firstEnabled) setActiveSection(firstEnabled.id);

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to initialise editor.';
        setInitError(msg);
      } finally {
        setInitialising(false);
      }
    };

    init();
  }, [capsuleId]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── 5.5  Layout mutation helper ───────────────────────────

  /**
   * Central mutation handler. All changes to layout_config flow through here.
   * Applies the given transform function and triggers autosave.
   */
  const mutate = useCallback((fn: (l: LayoutConfig) => LayoutConfig) => {
    setLayout(prev => {
      if (!prev) return prev;
      const next = fn(prev);
      saveLayout(next);
      return next;
    });
  }, [saveLayout]);


  // ── 5.6  Section-specific mutation handlers ───────────────

  const handleToggleSection = useCallback((sectionId: string) => {
    mutate(l => toggleSection(l, sectionId));
  }, [mutate]);

  const handleSwapPhotos = useCallback((idA: string, idB: string) => {
    mutate(l => swapPhotos(l, activeSection, idA, idB));
  }, [mutate, activeSection]);

  const handleReplacePhoto = useCallback((outgoing: string, incoming: string) => {
    mutate(l => replacePhoto(l, activeSection, outgoing, incoming));
  }, [mutate, activeSection]);

  const handleRemovePhoto = useCallback((id: string) => {
    mutate(l => removePhoto(l, activeSection, id));
  }, [mutate, activeSection]);

  const handlePromotePhoto = useCallback((id: string) => {
    mutate(l => promoteToFeature(l, activeSection, id));
  }, [mutate, activeSection]);

  const handleResetSection = useCallback(() => {
    if (!autoLayout) return;
    mutate(l => resetSectionToAuto(l, autoLayout, activeSection));
  }, [mutate, autoLayout, activeSection]);

  const handleSetTributeOrderMode = useCallback((mode: TributeOrderMode) => {
    mutate(l => setTributeOrderMode(l, mode));
  }, [mutate]);

  const handleReorderTributes = useCallback((items: TributeItem[]) => {
    mutate(l => ({
      ...l,
      arrangement_source: 'manual',
      sections: l.sections.map(s =>
        s.id === activeSection && s.type === 'tributes'
          ? { ...s, items, order_mode: 'manual' as const }
          : s
      ),
    }));
  }, [mutate, activeSection]);

  const handleGenerateComplete = useCallback(
    ({ pdfUrl, pageMap }: { pdfUrl: string; pageMap: Record<string, number> }) => {
      // Sync page_map back into the live layout so tribute rows show page numbers
      mutate(l => ({ ...l, page_map: pageMap }));
      setExistingPdfUrl(pdfUrl);
      setExistingVersion(prev => (prev ?? 1) + 1);
    },
    [mutate]
  );


  // ── 5.7  Loading and error states ─────────────────────────

  if (initialising) {
    return (
      <div
        aria-label="Loading publication editor"
        className="flex items-center justify-center h-96 bg-[#0a0010]"
      >
        <div className="text-center space-y-3">
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto"
          />
          <p className="text-white/40 text-sm animate-pulse">
            Arranging your publication…
          </p>
        </div>
      </div>
    );
  }

  if (initError || !layout) {
    return (
      <div
        role="alert"
        className="flex items-center justify-center h-96 bg-[#0a0010]"
      >
        <div className="text-center space-y-3 max-w-sm px-6">
          <p className="text-red-400/80 text-sm font-medium">
            Could not load the Publication Editor.
          </p>
          <p className="text-white/30 text-xs leading-relaxed">
            {initError ?? 'No layout configuration was returned.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="
              mt-2 text-xs px-4 py-2 rounded-lg
              border border-white/15 text-white/50
              hover:text-white/80 hover:border-white/30
              transition-colors
            "
          >
            Try again
          </button>
        </div>
      </div>
    );
  }


  // ── 5.8  Active section data ──────────────────────────────

  const activeSecData = layout.sections.find(s => s.id === activeSection);
  const activeSectionLabel = activeSecData?.type === 'phase_photos'
    ? (activeSecData as PhasePhotosSection).phase_name ?? 'Phase Photos'
    : activeSecData?.type?.replace(/_/g, ' ') ?? '';


  // ── 5.9  Render ───────────────────────────────────────────

  return (
    <div
      className="flex h-full min-h-0 bg-[#0a0010] text-white overflow-hidden"
      aria-label="Publication Editor"
    >

      {/* ═══════════════════════════════════════════════════
          LEFT PANEL — Section Navigator
      ═══════════════════════════════════════════════════ */}
      <SectionNavigator
        sections={layout.sections}
        activeSection={activeSection}
        onSelect={setActiveSection}
        onToggle={handleToggleSection}
        pubId={pubId ?? undefined}
      />


      {/* ═══════════════════════════════════════════════════
          MAIN PANEL — Active section editor
      ═══════════════════════════════════════════════════ */}
      <main
        className="flex-1 overflow-y-auto min-w-0"
        aria-label={`Editing: ${activeSectionLabel}`}
      >
        <div className="px-6 py-5 space-y-5 max-w-3xl">

          {/* Section header row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">
                Editing section
              </p>
              <h2 className="text-base font-semibold text-white/80 capitalize leading-tight">
                {activeSectionLabel}
              </h2>
            </div>
            <SaveStatusBadge state={saveState} />
          </div>

          {/* ── Phase photos editor ───────────────────────── */}
          {activeSecData?.type === 'phase_photos' && (
            <PhotoSection
              section={activeSecData as PhasePhotosSection}
              photos={photos}
              onSwap={handleSwapPhotos}
              onReplace={handleReplacePhoto}
              onRemove={handleRemovePhoto}
              onPromote={handlePromotePhoto}
              onReset={handleResetSection}
            />
          )}

          {/* ── Tributes editor ───────────────────────────── */}
          {activeSecData?.type === 'tributes' && (
            <TributeSection
              section={activeSecData as TributesSection}
              contributions={contributions}
              onReorder={handleReorderTributes}
              onSetOrderMode={handleSetTributeOrderMode}
            />
          )}

          {/* ── Auto-generated section placeholder ───────── */}
          {activeSecData && ['cover', 'honouree_profile', 'who_attended', 'closing_message']
            .includes(activeSecData.type) && (
            <AutoSectionPlaceholder type={activeSecData.type} />
          )}

        </div>
      </main>


      {/* ═══════════════════════════════════════════════════
          RIGHT PANEL — Generate panel
          Fixed width, non-scrolling, always visible.
      ═══════════════════════════════════════════════════ */}
      <aside
        className="
          w-64 flex-shrink-0 flex flex-col
          border-l border-yellow-400/10
          bg-gradient-to-b from-[#100018] to-[#0a000e]
          overflow-hidden
        "
        aria-label="PDF generation panel"
      >

        {/* Header */}
        <div className="px-4 py-4 border-b border-yellow-400/10">
          <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">
            Publication
          </p>
          <p className="text-sm font-bold text-yellow-100 leading-tight">
            Generate PDF
          </p>
        </div>

        {/* Generate button area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <GenerateButton
            capsuleId={capsuleId}
            hasUnsavedChanges={hasUnsavedChanges}
            existingPdfUrl={existingPdfUrl}
            existingVersion={existingVersion}
            onGenerateStart={() => setSaveState('saved')}
            onGenerateComplete={handleGenerateComplete}
          />
        </div>

        {/* Footer — back link */}
        <div className="px-4 py-3 border-t border-yellow-400/10 flex-shrink-0">
          <a
            href={`/capsule/${capsuleSlug}/manage`}
            className="
              text-[10px] text-white/25 hover:text-white/50
              transition-colors flex items-center gap-1
            "
          >
            <span aria-hidden="true">←</span>
            Back to Capsule
          </a>
        </div>

      </aside>

    </div>
  );
}
