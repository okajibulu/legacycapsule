'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/publication/PublicationEditor.tsx
// PURPOSE:   Top-level shell for the Publication Editor.
//            Responsibilities:
//              1. Initialise — POST to /api/publication/init on mount.
//              2. Pre-fetch — load all photo metadata and contribution data.
//              3. State — hold the live layout_config in React state.
//              4. Autosave — debounced POST to /api/publication/save.
//              5. Composition — SectionNavigator (left), active editor (main),
//                 Generation + Distribution controls (right sidebar).
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY:  AI7 (original) · AI18 · AI20 · Claude Opus 4.6
// UPDATED:   AI20 · 11 August 2026
//            — Full Distribution section redesigned with clean state machine.
//              Previous implementation had 7 interdependent state variables
//              that fell out of sync, blocking the send button.
//              Replaced with: distPhase | distData | distResult | distError.
//            — existingPdfUrl dependency removed from handleDistribute
//              (was never set; render_token is the correct existence check).
//            — All other sections untouched: init, autosave, photos,
//              tributes, generation, family preview, named send.
// VERSION:   AI20v2.11.96
// DATE:      11 August 2026
// ─────────────────────────────────────────────────────────────────────────────

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

// ═══ SECTION 1 — Supabase anon client ═══

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AUTOSAVE_DELAY_MS = 800;

// ═══ SECTION 2 — Props ═══

interface PublicationEditorProps {
  capsuleId:   string;
  capsuleSlug: string;
}

// ═══ SECTION 3 — Save status indicator ═══

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

// ═══ SECTION 4 — Non-editable section placeholder ═══

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
    world_map: {
      title:  'World Voices Map — shows where contributors joined from.',
      detail: 'A dot map of every country represented across all voices. Toggle off to exclude it from the publication.',
    },
    official_photography: {
      title:  'Official Photography is included automatically.',
      detail: 'All photos uploaded by your official photographer appear here. Toggle off to exclude this section.',
    },
    guest_captures: {
      title:  'In The Room — guest photos captured on the day.',
      detail: 'Photos uploaded by guests via the D-Day portal appear here. Toggle off to exclude this section.',
    },
    memories: {
      title:  'Memories are included automatically.',
      detail: 'All entries shared in the Memories room are grouped by era and included as a chapter. Toggle off to exclude.',
    },
    community_stories: {
      title:  'Community Memories & Stories are included automatically.',
      detail: 'All approved stories from the Stories room are organised by topic and included as a chapter. Toggle off to exclude.',
    },
    collection_intelligence: {
      title:  'Capsule Highlights — analytics and insights from this collection.',
      detail: 'Automatically rendered before the voices section. Includes character stats, distribution, and country breakdown.',
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

// ═══ SECTION 5 — Distribution summary sub-component ═══
// Persistent email stats shown in the sidebar when a publication exists.

function DistributionSummary({ capsuleId }: { capsuleId: string }) {
  const [stats, setStats] = useState<{
    total: number; contributors: number; dday: number;
    subscribers: number; no_email: number;
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!capsuleId) return
    setLoading(true)
    fetch(`/api/publication/distribute?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capsuleId])

  if (loading) return (
    <div className="mb-3 p-2.5 rounded-lg border border-white/8 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-[9px] text-white/20">Loading email stats…</p>
    </div>
  )

  if (!stats) return null

  return (
    <div className="mb-3 p-2.5 rounded-lg border border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-[9px] text-yellow-400/50 uppercase tracking-wider font-bold mb-2">
        Email Recipients
      </p>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-white/40">Total unique emails</span>
          <span className="text-[10px] text-white/70 font-bold">{stats.total}</span>
        </div>
        {stats.contributors > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-white/30">Contributors</span>
            <span className="text-[10px] text-white/40">{stats.contributors}</span>
          </div>
        )}
        {stats.dday > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-white/30">D-Day guests</span>
            <span className="text-[10px] text-white/40">{stats.dday}</span>
          </div>
        )}
        {stats.subscribers > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-white/30">Subscribers</span>
            <span className="text-[10px] text-white/40">{stats.subscribers}</span>
          </div>
        )}
        {stats.no_email > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-white/20">No email on file</span>
            <span className="text-[10px] text-white/20">{stats.no_email}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ SECTION 6 — Main component ═══

export default function PublicationEditor({
  capsuleId,
  capsuleSlug,
}: PublicationEditorProps) {

  // ── 6.1  Core editor state ────────────────────────────────

  const [layout,        setLayout]        = useState<LayoutConfig | null>(null);
  const [autoLayout,    setAutoLayout]    = useState<LayoutConfig | null>(null);
  const [activeSection, setActiveSection] = useState<string>('section_cover');
  const [pubId,         setPubId]         = useState<string | null>(null);
  const [saveState,     setSaveState]     = useState<EditorSaveState>('saved');
  const [initialising,  setInitialising]  = useState(true);
  const [initError,     setInitError]     = useState<string | null>(null);

  // ── 6.2  Generation state ─────────────────────────────────

  const [currentToken,       setCurrentToken]       = useState<string | null>(null);
  const [currentGeneratedAt, setCurrentGeneratedAt] = useState<string | null>(null);
  const [pubVersion,         setPubVersion]         = useState<number | null>(null);
  const [regenerating,       setRegenerating]       = useState(false);
  const [regenError,         setRegenError]         = useState<string | null>(null);
  const [copiedPublicLink,   setCopiedPublicLink]   = useState(false);

  // ── 6.3  Family preview state ─────────────────────────────

  const [familyPreviewSending, setFamilyPreviewSending] = useState(false);
  const [familyPreviewSent,    setFamilyPreviewSent]    = useState(false);
  const [familyPreviewError,   setFamilyPreviewError]   = useState<string | null>(null);
  const [familyPreviewVersion, setFamilyPreviewVersion] = useState<number | null>(null);
  const [familyPreviewAt,      setFamilyPreviewAt]      = useState<string | null>(null);

  // ── 6.4  Named send state ─────────────────────────────────

  const [namedSendEmail,  setNamedSendEmail]  = useState('');
  const [namedSendName,   setNamedSendName]   = useState('');
  const [namedSending,    setNamedSending]    = useState(false);
  const [namedSendError,  setNamedSendError]  = useState<string | null>(null);
  const [namedRecipients, setNamedRecipients] = useState<Array<{ name: string; email: string }>>([]);
  const [namedSends,      setNamedSends]      = useState<Array<{
    id: string; recipient_name: string; recipient_email: string;
    version_sent: number; sent_at: string;
  }>>([]);

  // ── 6.5  Full distribution state machine ──────────────────
  // Single state object replaces 7 interdependent vars that fell out of sync.
  // Phase transitions: idle → previewing → confirming → sending → done | error
  // Never reads existingPdfUrl — currentToken is the correct existence check.

  type DistPhase = 'idle' | 'previewing' | 'confirming' | 'sending' | 'done' | 'error'

  const [distPhase,   setDistPhase]   = useState<DistPhase>('idle')
  const [distData,    setDistData]    = useState<{
    total: number; contributors: number; dday: number;
    subscribers: number; no_email: number;
  } | null>(null)
  const [distResult,  setDistResult]  = useState<{ sent: number; skipped: number } | null>(null)
  const [distError,   setDistError]   = useState<string | null>(null)
  const [includePrev, setIncludePrev] = useState(false)

  const hasUnsavedChanges = saveState === 'unsaved' || saveState === 'saving';

  // ── 6.6  Pre-fetched content maps ─────────────────────────

  const [photos, setPhotos] = useState<
    Record<string, GalleryItemForArrangement & { image_url: string }>
  >({});

  const [contributions, setContributions] = useState<
    Record<string, ContributionDisplay>
  >({});

  // ── 6.7  Autosave infrastructure ──────────────────────────

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

  // ── 6.8  Initialisation ───────────────────────────────────

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
          .select('version, generation_status, render_token, generated_at')
          .eq('id', pub_id)
          .maybeSingle();

        if (pubRow?.render_token) setCurrentToken(pubRow.render_token);
        if (pubRow?.generated_at) setCurrentGeneratedAt(pubRow.generated_at);
        if (pubRow?.version)      setPubVersion(pubRow.version);

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

  // ── 6.9  Layout mutation helper ───────────────────────────

  const mutate = useCallback((fn: (l: LayoutConfig) => LayoutConfig) => {
    setLayout(prev => {
      if (!prev) return prev;
      const next = fn(prev);
      saveLayout(next);
      return next;
    });
  }, [saveLayout]);

  // ── 6.10  Section-specific mutation handlers ──────────────

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

  // ── 6.11  Regenerate publication ──────────────────────────

  const handleRegenerate = useCallback(async () => {
    if (!capsuleId) return
    setRegenerating(true)
    setRegenError(null)
    try {
      const initRes = await fetch('/api/publication/init', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId }),
      })
      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error ?? 'Failed to refresh content')
      if (initData.layout_config) {
        setLayout(initData.layout_config)
        setAutoLayout(initData.layout_config)
      }
      const res = await fetch('/api/publication/preview-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsuleId }),
      })
      const data = await res.json()
      if (!res.ok || !data.token) throw new Error(data.error ?? 'Failed to generate publication')
      setCurrentToken(data.token)
      setCurrentGeneratedAt(new Date().toISOString())
      if (data.version) setPubVersion(data.version)
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setRegenerating(false)
    }
  }, [capsuleId])

  // ── 6.12  Family preview ──────────────────────────────────

  const handleFamilyPreview = useCallback(async () => {
    if (!capsuleId) return
    setFamilyPreviewSending(true)
    setFamilyPreviewError(null)
    try {
      const res  = await fetch('/api/publication/family-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsuleId, capsule_slug: capsuleSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send preview')
      setFamilyPreviewSent(true)
      setFamilyPreviewVersion(data.version)
      setFamilyPreviewAt(new Date().toISOString())
    } catch (err) {
      setFamilyPreviewError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setFamilyPreviewSending(false)
    }
  }, [capsuleId, capsuleSlug])

  // ── 6.13  Named send ──────────────────────────────────────

  const handleAddRecipient = useCallback(() => {
    if (!namedSendEmail.trim()) return
    setNamedRecipients(prev => [
      ...prev,
      { name: namedSendName.trim() || 'Guest', email: namedSendEmail.trim() }
    ])
    setNamedSendEmail('')
    setNamedSendName('')
  }, [namedSendEmail, namedSendName])

  const handleRemoveRecipient = useCallback((email: string) => {
    setNamedRecipients(prev => prev.filter(r => r.email !== email))
  }, [])

  const handleNamedSend = useCallback(async () => {
    if (!capsuleId) return
    const allRecipients = [
      ...namedRecipients,
      ...(namedSendEmail.trim()
        ? [{ name: namedSendName.trim() || 'Guest', email: namedSendEmail.trim() }]
        : [])
    ]
    if (allRecipients.length === 0) return
    setNamedSending(true)
    setNamedSendError(null)
    try {
      const res = await fetch('/api/publication/named-send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:   capsuleId,
          capsule_slug: capsuleSlug,
          recipients:   allRecipients,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      const newSends = allRecipients.map((r, i) => ({
        id:              `${Date.now()}-${i}`,
        recipient_name:  r.name,
        recipient_email: r.email,
        version_sent:    data.version ?? 1,
        sent_at:         new Date().toISOString(),
      }))
      setNamedSends(prev => [...newSends, ...prev])
      setNamedRecipients([])
      setNamedSendEmail('')
      setNamedSendName('')
    } catch (err) {
      setNamedSendError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setNamedSending(false)
    }
  }, [capsuleId, capsuleSlug, namedSendEmail, namedSendName, namedRecipients])

  // ── 6.14  Full distribution — clean state machine ─────────
  // Phase 1: Load recipients → confirms counts are real before showing UI.
  // Phase 2: Organiser reviews and confirms.
  // Phase 3: Send fires — no guards other than capsuleId + currentToken.
  // No existingPdfUrl anywhere — was never set, caused all prior failures.

  const handleDistPreview = useCallback(async () => {
    if (!capsuleId) return
    setDistPhase('previewing')
    setDistError(null)
    setDistData(null)
    try {
      const res  = await fetch(`/api/publication/distribute?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load recipients')
      setDistData(data)
      setDistPhase('confirming')
    } catch (err) {
      setDistError(err instanceof Error ? err.message : 'Failed to load recipients')
      setDistPhase('error')
    }
  }, [capsuleId])

  const handleDistSend = useCallback(async () => {
    if (!capsuleId || !currentToken) return
    setDistPhase('sending')
    setDistError(null)
    try {
      const res  = await fetch('/api/publication/distribute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:   capsuleId,
          capsule_slug: capsuleSlug,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Distribution failed')
      setDistResult(data)
      setDistPhase('done')
    } catch (err) {
      setDistError(err instanceof Error ? err.message : 'Distribution failed')
      setDistPhase('error')
    }
  }, [capsuleId, capsuleSlug, currentToken])

  const handleDistReset = useCallback(() => {
    setDistPhase('idle')
    setDistData(null)
    setDistResult(null)
    setDistError(null)
    setIncludePrev(false)
  }, [])

  // ── 6.15  Loading and error states ───────────────────────

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

  // ── 6.16  Active section data ─────────────────────────────

  const activeSecData = layout.sections.find(s => s.id === activeSection);
  const activeSectionLabel = activeSecData?.type === 'phase_photos'
    ? (activeSecData as PhasePhotosSection).phase_name ?? 'Phase Photos'
    : activeSecData?.type?.replace(/_/g, ' ') ?? '';

  // ── 6.17  Render ──────────────────────────────────────────

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 bg-[#0a0010] text-white overflow-hidden" aria-label="Publication Editor">

      {/* ═══ LEFT — Section Navigator ═══ */}
      <SectionNavigator
        sections={layout.sections}
        activeSection={activeSection}
        onSelect={setActiveSection}
        onToggle={handleToggleSection}
        pubId={pubId ?? undefined}
      />

      {/* ═══ MAIN — Active section editor ═══ */}
      <main className="flex-1 overflow-y-auto min-w-0" aria-label={`Editing: ${activeSectionLabel}`}>
        <div className="px-4 md:px-6 py-4 md:py-5 space-y-5 max-w-3xl">
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
              capsuleId={capsuleId}
              onSwap={handleSwapPhotos}
              onReplace={handleReplacePhoto}
              onRemove={handleRemovePhoto}
              onPromote={handlePromotePhoto}
              onReset={handleResetSection}
              onPurged={(newLayout) => {
                setLayout(newLayout);
                setAutoLayout(newLayout);
                setSaveState('saved');
              }}
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

          {activeSecData && [
            'cover', 'honouree_profile', 'world_map',
            'official_photography', 'guest_captures',
            'memories', 'community_stories',
          ].includes(activeSecData.type) && (
            <AutoSectionPlaceholder type={activeSecData.type} />
          )}
        </div>
      </main>

      {/* ═══ RIGHT — Generation & Distribution panel ═══ */}
      <aside
        className="
          flex-shrink-0 flex flex-col
          border-t border-yellow-400/10 md:border-t-0 md:border-l border-yellow-400/10
          bg-gradient-to-b from-[#100018] to-[#0a000e]
          w-full md:w-64 md:min-w-[256px]
          sticky bottom-0 md:static md:bottom-auto
          z-10 md:z-auto overflow-hidden
        "
        aria-label="Publication panel"
      >
        {/* Panel header */}
        <div className="hidden md:block border-b border-yellow-400/10 flex-shrink-0" style={{ padding: '16px 20px' }}>
          <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-0.5">Publication</p>
          <p className="text-sm font-bold text-yellow-100 leading-tight">Generate & Distribute</p>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden max-h-[55vh] md:max-h-none" style={{ padding: '12px 20px' }}>

          {/* ══ TIER 0 — Generation ══ */}
          <div className="pb-4 mb-4 border-b border-yellow-400/10">
            <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-2">Publication</p>

            {currentToken && (
              <div className="mb-3 p-2.5 rounded-lg border border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-yellow-400/50 uppercase tracking-wider font-bold">Current Version</span>
                  {pubVersion && <span className="text-[11px] text-yellow-300 font-bold font-mono">v{pubVersion}</span>}
                </div>
                {currentGeneratedAt && (
                  <p className="text-[10px] text-white/40 mb-2">
                    Generated {new Date(currentGeneratedAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => window.open(`/publication-render/${currentToken}`, '_blank')}
                  className="w-full py-2 rounded-lg text-[12px] font-bold bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 transition-colors mb-1.5"
                >
                  Open Publication ↗
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/publication/${capsuleSlug}`
                    navigator.clipboard.writeText(url)
                    setCopiedPublicLink(true)
                    setTimeout(() => setCopiedPublicLink(false), 2500)
                  }}
                  className="w-full py-1.5 rounded-lg text-[11px] border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
                >
                  {copiedPublicLink ? '✓ Link copied' : '⌘ Copy permanent link'}
                </button>
              </div>
            )}

            {currentToken && <DistributionSummary capsuleId={capsuleId} />}

            {hasUnsavedChanges && (
              <p className="text-[10px] text-white/30 mb-2 text-center">Save changes before regenerating</p>
            )}

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating || hasUnsavedChanges}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                currentToken
                  ? 'border border-yellow-400/25 text-yellow-300/70 hover:bg-yellow-400/8'
                  : 'bg-yellow-400 text-[#0a0010] hover:bg-yellow-300'
              }`}
            >
              {regenerating ? 'Generating…' : currentToken ? '↻ Regenerate Publication' : 'Generate Publication'}
            </button>

            {regenError && <p className="text-[10px] text-red-400/70 mt-1.5 text-center">{regenError}</p>}
            <p className="text-[9px] text-white/15 mt-1.5 leading-relaxed text-center">
              {currentToken ? 'Creates a fresh version with all current content.' : 'Generate to create the publication for the first time.'}
            </p>
          </div>

          {/* ══ TIER 1 — Family Preview ══ */}
          {currentToken && (
            <div className="pb-4 mb-4 border-b border-yellow-400/10">
              <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-2">Family Preview</p>
              {(familyPreviewSent || familyPreviewAt) && (
                <div className="rounded-lg border border-green-400/20 p-2.5 mb-2" style={{ background: 'rgba(74,222,128,0.05)' }}>
                  <p className="text-[10px] text-green-400/80 font-bold">✓ Preview sent</p>
                  {familyPreviewVersion && (
                    <p className="text-[9px] text-white/30 mt-0.5">v{familyPreviewVersion} · Family Representative</p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleFamilyPreview}
                disabled={familyPreviewSending || hasUnsavedChanges}
                className="w-full py-2 px-3 rounded-lg text-[11px] font-bold border border-yellow-400/25 text-yellow-300 hover:bg-yellow-400/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {familyPreviewSending ? 'Sending…' : familyPreviewAt ? 'Resend Family Preview' : 'Send to Family Rep →'}
              </button>
              {familyPreviewError && <p className="text-[10px] text-red-400/70 mt-1.5">{familyPreviewError}</p>}
              <p className="text-[9px] text-white/20 mt-1.5 leading-relaxed">Family Representative receives it before anyone else.</p>
            </div>
          )}

          {/* ══ TIER 2 — Named Send ══ */}
          {currentToken && (
            <div className="pb-4 mb-4 border-b border-yellow-400/10">
              <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-2">Named Send</p>
              <div className="space-y-1.5 mb-2">
                <input
                  type="text"
                  placeholder="Recipient name"
                  value={namedSendName}
                  onChange={e => setNamedSendName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md text-[11px] bg-white/5 border border-white/10 text-white/70 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/30"
                />
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={namedSendEmail}
                    onChange={e => setNamedSendEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddRecipient() }}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md text-[11px] bg-white/5 border border-white/10 text-white/70 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    disabled={!namedSendEmail.trim()}
                    className="px-2.5 py-1.5 rounded-md text-[11px] border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 transition-colors disabled:opacity-30 flex-shrink-0"
                    title="Add to recipient list"
                  >+</button>
                </div>
              </div>

              {namedRecipients.length > 0 && (
                <div className="mb-2 space-y-1">
                  {namedRecipients.map(r => (
                    <div key={r.email} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/4 border border-white/8">
                      <span className="text-[10px] text-white/60 flex-1 truncate">{r.name} · {r.email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(r.email)}
                        className="text-[9px] text-white/25 hover:text-red-400/60 flex-shrink-0 transition-colors"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleNamedSend}
                disabled={namedSending || (namedRecipients.length === 0 && !namedSendEmail.trim()) || hasUnsavedChanges}
                className="w-full py-1.5 rounded-md text-[11px] font-bold border border-yellow-400/20 text-yellow-400/70 hover:bg-yellow-400/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {namedSending
                  ? 'Sending…'
                  : namedRecipients.length > 1
                  ? `Send to ${namedRecipients.length} recipients →`
                  : 'Send →'}
              </button>

              {namedSendError && <p className="text-[10px] text-red-400/70 mt-1.5">{namedSendError}</p>}

              {namedSends.length > 0 && (
                <div className="space-y-1 mt-2">
                  {namedSends.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-1">
                      <span className="text-[9px] text-white/40 truncate flex-1">{s.recipient_name || s.recipient_email}</span>
                      <span className="text-[9px] text-white/20 flex-shrink-0">v{s.version_sent}</span>
                    </div>
                  ))}
                  {namedSends.length > 4 && <p className="text-[9px] text-white/20">+{namedSends.length - 4} more</p>}
                </div>
              )}
            </div>
          )}

          {/* ══ TIER 3 — Full Distribution (clean state machine) ══ */}
          {currentToken && (
            <div className="pb-2">
              <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-2">Full Distribution</p>

              {/* DONE */}
              {distPhase === 'done' && distResult && (
                <div className="rounded-lg border border-green-400/20 p-2.5 mb-2" style={{ background: 'rgba(74,222,128,0.05)' }}>
                  <p className="text-[10px] text-green-400/80 font-bold mb-0.5">✓ Publication sent</p>
                  <p className="text-[9px] text-white/30">
                    {distResult.sent} sent{distResult.skipped > 0 ? ` · ${distResult.skipped} skipped` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={handleDistReset}
                    className="mt-2 text-[9px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    Send again
                  </button>
                </div>
              )}

              {/* CONFIRMING */}
              {distPhase === 'confirming' && distData && (
                <div className="rounded-lg border border-yellow-400/20 p-3 mb-2" style={{ background: 'rgba(226,195,107,0.04)' }}>
                  <p className="text-[9px] text-yellow-400/60 uppercase tracking-wider mb-2">
                    Confirm send{pubVersion ? ` — v${pubVersion}` : ''}
                  </p>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-white/50 font-bold">Will receive</span>
                      <span className="text-[9px] text-yellow-400 font-bold">{distData.total}</span>
                    </div>
                    {distData.contributors > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[9px] text-white/30">Contributors</span>
                        <span className="text-[9px] text-white/40">{distData.contributors}</span>
                      </div>
                    )}
                    {distData.dday > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[9px] text-white/30">D-Day guests</span>
                        <span className="text-[9px] text-white/40">{distData.dday}</span>
                      </div>
                    )}
                    {distData.subscribers > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[9px] text-white/30">Subscribers</span>
                        <span className="text-[9px] text-white/40">{distData.subscribers}</span>
                      </div>
                    )}
                    {distData.no_email > 0 && (
                      <p className="text-[9px] text-white/20 mt-1">
                        {distData.no_email} excluded — no email on file
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDistSend}
                      disabled={distData.total === 0}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-400 text-[#0a0010] hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Send to {distData.total}
                    </button>
                    <button
                      type="button"
                      onClick={handleDistReset}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] border border-white/10 text-white/40 hover:text-white/60 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SENDING */}
              {distPhase === 'sending' && (
                <div className="rounded-lg border border-yellow-400/15 p-3 mb-2 text-center" style={{ background: 'rgba(226,195,107,0.03)' }}>
                  <div className="w-5 h-5 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto mb-2" />
                  <p className="text-[10px] text-yellow-300/60">Sending publication…</p>
                  <p className="text-[9px] text-white/20 mt-1">This may take a moment for large lists.</p>
                </div>
              )}

              {/* ERROR */}
              {distPhase === 'error' && (
                <div className="rounded-lg border border-red-400/20 p-2.5 mb-2" style={{ background: 'rgba(248,113,113,0.05)' }}>
                  <p className="text-[10px] text-red-400/80 font-bold mb-1">Something went wrong</p>
                  <p className="text-[9px] text-white/30 mb-2">{distError}</p>
                  <button
                    type="button"
                    onClick={handleDistReset}
                    className="text-[9px] text-yellow-400/50 hover:text-yellow-300 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* IDLE + PREVIEWING */}
              {(distPhase === 'idle' || distPhase === 'previewing') && (
                <button
                  type="button"
                  onClick={handleDistPreview}
                  disabled={distPhase === 'previewing' || hasUnsavedChanges}
                  className="w-full py-2 px-3 rounded-lg text-[11px] font-bold border border-yellow-400/25 text-yellow-300/70 hover:bg-yellow-400/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {distPhase === 'previewing' ? 'Loading recipients…' : '✉ Review & Send to All'}
                </button>
              )}

              {distPhase === 'idle' && (
                <p className="text-[9px] text-white/15 mt-1.5 leading-relaxed">
                  Sends to all contributors, D-Day guests and subscribers.
                </p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="hidden md:block border-t border-yellow-400/10 flex-shrink-0" style={{ padding: '12px 20px' }}>
          <a
            href={'/manage/' + capsuleSlug}
            className="text-[11px] flex items-center gap-1 no-underline"
            style={{ color: 'rgba(226,195,107,0.4)' }}
          >
            ← Back to Capsule
          </a>
        </div>
      </aside>

    </div>
  );
}
