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
 *   2. Pre-fetch — load all photo metadata and contribution data.
 *   3. State — hold the live layout_config in React state.
 *   4. Autosave — debounced POST to /api/publication/save.
 *   5. Composition — SectionNavigator (left), active editor (main),
 *      GenerateButton + Preview button (right sidebar).
 *
 * Changes AI7:
 *   - Added "Preview & Save as PDF" button (browser print approach)
 *     works on Vercel Hobby plan without Puppeteer.
 *   - handlePreviewPrint: calls /api/publication/preview-token,
 *     opens /publication-render/[token]?autoPrint=1 in new tab.
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
// SECTION 1 — Supabase anon client
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    community_stories: {
      title:  'Community Memories & Stories are included automatically.',
      detail: 'All approved stories from the Stories room are organised by topic and included as a chapter.',
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

  const [layout,          setLayout]          = useState<LayoutConfig | null>(null);
  const [autoLayout,      setAutoLayout]       = useState<LayoutConfig | null>(null);
  const [activeSection,   setActiveSection]    = useState<string>('section_cover');
  const [pubId,           setPubId]            = useState<string | null>(null);
  const [existingPdfUrl,  setExistingPdfUrl]   = useState<string | null>(null);
  const [existingVersion, setExistingVersion]  = useState<number | null>(null);
  const [saveState,       setSaveState]        = useState<EditorSaveState>('saved');
  const [previewing,      setPreviewing]       = useState(false);
  const [previewError,    setPreviewError]     = useState<string | null>(null);
  const [distributing,    setDistributing]     = useState(false);
  const [distributeError, setDistributeError]  = useState<string | null>(null);
  const [distributeResult, setDistributeResult] = useState<{ sent: number; skipped: number } | null>(null);
  const [initialising,    setInitialising]     = useState(true);
  const [initError,       setInitError]        = useState<string | null>(null);

  const hasUnsavedChanges = saveState === 'unsaved' || saveState === 'saving';


  // ── 5.2  Pre-fetched content maps ─────────────────────────

  const [photos, setPhotos] = useState<
    Record<string, GalleryItemForArrangement & { image_url: string }>
  >({});

  const [contributions, setContributions] = useState<
    Record<string, ContributionDisplay>
  >({});


  // ── 5.3  Autosave infrastructure ──────────────────────────

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveLayout = useCallback(async (newLayout: LayoutConfig) => {
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
        setAutoLayout(layout_config);
        setPubId(pub_id);

        const { data: pubRow } = await supabase
          .from('publications')
          .select('pdf_url, version, generation_status')
          .eq('id', pub_id)
          .maybeSingle();
        if (pubRow?.pdf_url) {
          setExistingPdfUrl(pubRow.pdf_url);
          setExistingVersion(pubRow.version);
        }

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

  const mutate = useCallback((fn: (l: LayoutConfig) => LayoutConfig) => {
    setLayout(prev => {
      if (!prev) return prev;
      const next = fn(prev);
      saveLayout(next);
      return next;
    });
  }, [saveLayout]);


  // ── 5.6  Section-specific mutation handlers ───────────────

  const handleToggleSection    = useCallback((sectionId: string) => {
    mutate(l => toggleSection(l, sectionId));
  }, [mutate]);

  const handleSwapPhotos       = useCallback((idA: string, idB: string) => {
    mutate(l => swapPhotos(l, activeSection, idA, idB));
  }, [mutate, activeSection]);

  const handleReplacePhoto     = useCallback((outgoing: string, incoming: string) => {
    mutate(l => replacePhoto(l, activeSection, outgoing, incoming));
  }, [mutate, activeSection]);

  const handleRemovePhoto      = useCallback((id: string) => {
    mutate(l => removePhoto(l, activeSection, id));
  }, [mutate, activeSection]);

  const handlePromotePhoto     = useCallback((id: string) => {
    mutate(l => promoteToFeature(l, activeSection, id));
  }, [mutate, activeSection]);

  const handleResetSection     = useCallback(() => {
    if (!autoLayout) return;
    mutate(l => resetSectionToAuto(l, autoLayout, activeSection));
  }, [mutate, autoLayout, activeSection]);

  const handleSetTributeOrderMode = useCallback((mode: TributeOrderMode) => {
    mutate(l => setTributeOrderMode(l, mode));
  }, [mutate]);

  const handleReorderTributes  = useCallback((items: TributeItem[]) => {
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
      mutate(l => ({ ...l, page_map: pageMap }));
      setExistingPdfUrl(pdfUrl);
      setExistingVersion(prev => (prev ?? 1) + 1);
    },
    [mutate]
  );

  // ── 5.7  Preview & print handler (AI7 — Hobby plan PDF) ──
  // Generates a short-lived render token, opens the publication
  // render page in a new tab with autoPrint=1 so the browser
  // print dialog fires automatically. User saves as PDF.

const handlePreviewPrint = useCallback(async () => {
    if (!capsuleId) return;
    setPreviewing(true);
    setPreviewError(null);
    // Open window immediately before async call — prevents popup blocker
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      setPreviewError('Please allow popups for this site and try again');
      setPreviewing(false);
      return;
    }
    try {
      const res = await fetch('/api/publication/preview-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error ?? 'Failed to generate preview');
      previewWindow.location.href = `/publication-render/${data.token}?autoPrint=1`;
    } catch (err) {
      previewWindow.close();
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  }, [capsuleId]);

  // ── 5.7b  Distribute — Collective Belonging Email ─────────
  const handleDistribute = useCallback(async () => {
    if (!capsuleId || !existingPdfUrl) return
    setDistributing(true)
    setDistributeError(null)
    setDistributeResult(null)
    try {
      const res = await fetch('/api/publication/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId, capsule_slug: capsuleSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Distribution failed')
      setDistributeResult(data)
    } catch (err) {
      setDistributeError(err instanceof Error ? err.message : 'Distribution failed')
    } finally {
      setDistributing(false)
    }
  }, [capsuleId, capsuleSlug, existingPdfUrl]);


  // ── 5.8  Loading and error states ─────────────────────────

  if (initialising) {
    return (
      <div aria-label="Loading publication editor" className="flex items-center justify-center h-96 bg-[#0a0010]">
        <div className="text-center space-y-3">
          <div aria-hidden="true" className="w-8 h-8 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto" />
          <p className="text-white/40 text-sm animate-pulse">Arranging your publication…</p>
        </div>
      </div>
    );
  }

  if (initError || !layout) {
    return (
      <div role="alert" className="flex items-center justify-center h-96 bg-[#0a0010]">
        <div className="text-center space-y-3 max-w-sm px-6">
          <p className="text-red-400/80 text-sm font-medium">Could not load the Publication Editor.</p>
          <p className="text-white/30 text-xs leading-relaxed">{initError ?? 'No layout configuration was returned.'}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 text-xs px-4 py-2 rounded-lg border border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }


  // ── 5.9  Active section data ──────────────────────────────

  const activeSecData = layout.sections.find(s => s.id === activeSection);
  const activeSectionLabel = activeSecData?.type === 'phase_photos'
    ? (activeSecData as PhasePhotosSection).phase_name ?? 'Phase Photos'
    : activeSecData?.type?.replace(/_/g, ' ') ?? '';


  // ── 5.10  Render ──────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 bg-[#0a0010] text-white overflow-hidden" aria-label="Publication Editor">

      {/* ═══ LEFT PANEL — Section Navigator ═══ */}
      <SectionNavigator
        sections={layout.sections}
        activeSection={activeSection}
        onSelect={setActiveSection}
        onToggle={handleToggleSection}
        pubId={pubId ?? undefined}
      />

      {/* ═══ MAIN PANEL — Active section editor ═══ */}
      <main className="flex-1 overflow-y-auto min-w-0" aria-label={`Editing: ${activeSectionLabel}`}>
        <div className="px-6 py-5 space-y-5 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">Editing section</p>
              <h2 className="text-base font-semibold text-white/80 capitalize leading-tight">{activeSectionLabel}</h2>
            </div>
            <SaveStatusBadge state={saveState} />
          </div>

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

          {activeSecData?.type === 'tributes' && (
            <TributeSection
              section={activeSecData as TributesSection}
              contributions={contributions}
              onReorder={handleReorderTributes}
              onSetOrderMode={handleSetTributeOrderMode}
            />
          )}

          {activeSecData && ['cover', 'honouree_profile', 'who_attended', 'closing_message', 'community_stories'].includes(activeSecData.type) && (
            <AutoSectionPlaceholder type={activeSecData.type} />
          )}
        </div>
      </main>

      {/* ═══ RIGHT PANEL — Generate panel ═══ */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-l border-yellow-400/10 bg-gradient-to-b from-[#100018] to-[#0a000e] overflow-hidden"
        aria-label="PDF generation panel"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-yellow-400/10">
          <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">Publication</p>
          <p className="text-sm font-bold text-yellow-100 leading-tight">Generate PDF</p>
        </div>

        {/* Generate button area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* ── Preview & Download — works on Hobby plan ── */}
          <div className="mb-5 pb-5 border-b border-yellow-400/10">
            <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-3">
              Download Now
            </p>
            <button
              type="button"
              onClick={handlePreviewPrint}
              disabled={previewing || hasUnsavedChanges}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-yellow-400 text-[#0a0010] hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewing ? 'Opening preview…' : '⬇ Preview & Save as PDF'}
            </button>
            {hasUnsavedChanges && (
              <p className="text-[10px] text-white/30 mt-2 text-center">Save changes first</p>
            )}
            {previewError && (
              <p className="text-[10px] text-red-400/70 mt-2 text-center">{previewError}</p>
            )}
            <p className="text-[9px] text-white/20 mt-2 leading-relaxed text-center">
              Opens in a new tab · Use browser Print → Save as PDF
            </p>
          </div>

          {/* ── Distribute — Collective Belonging Email ── */}
          {existingPdfUrl && (
            <div className="mb-5 pb-5 border-b border-yellow-400/10">
              <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-3">
                Distribute
              </p>
              <button
                type="button"
                onClick={handleDistribute}
                disabled={distributing || hasUnsavedChanges}
                className="w-full py-2.5 px-3 rounded-lg text-xs font-bold border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {distributing ? 'Sending…' : '✉ Send to All Contributors'}
              </button>
              {distributeResult && (
                <p className="text-[10px] text-green-400/70 mt-2 text-center">
                  ✓ Sent to {distributeResult.sent} contributor{distributeResult.sent !== 1 ? 's' : ''}
                  {distributeResult.skipped > 0 ? ` · ${distributeResult.skipped} skipped` : ''}
                </p>
              )}
              {distributeError && (
                <p className="text-[10px] text-red-400/70 mt-2 text-center">{distributeError}</p>
              )}
              <p className="text-[9px] text-white/20 mt-2 leading-relaxed text-center">
                Sends the publication to every contributor who left an email
              </p>
            </div>
          )}

          {/* ── Auto-generate (Puppeteer — Vercel Pro) ── */}
          <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-3">
            Auto-generate
          </p>
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
            href={`/manage/${capsuleSlug}`}
            style={{ fontSize: '11px', color: 'rgba(226,195,107,0.4)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            ← Back to Capsule
          </a>
        </div>
      </aside>

    </div>
  );
}
