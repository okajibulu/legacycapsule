/**
 * ============================================================
 * LEGACYCAPSULE — /api/publication/init
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * POST — Initialise a publication record for a capsule.
 *
 * Called by the Publication Editor when the organiser first opens it.
 * Idempotent — calling it multiple times for the same capsule is safe.
 *
 * Decision tree:
 *   → Publication row with layout_config exists  → return it unchanged
 *   → Publication row exists but layout_config is null → run algorithm, save, return
 *   → No publication row at all → create row, run algorithm, save, return
 *
 * Authentication:
 *   Uses SUPABASE_SERVICE_ROLE_KEY (admin client — server-side only).
 *   In Phase 1: open, consistent with permissive RLS policy.
 *   In Phase 2: validate organiser session token before proceeding.
 *
 * Request body:  { capsule_id: string }
 * Success (200): { layout_config: LayoutConfig, source: 'existing', pub_id: string }
 * Success (201): { layout_config: LayoutConfig, source: 'generated', pub_id: string }
 * Error (400):   { error: string }
 * Error (404):   { error: string }
 * Error (500):   { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAutoArrangement, buildPhaseSection } from '@/lib/publication/autoArrange';
import type {
  PublicationInitRequest,
  PublicationInitResponse,
  LayoutConfig,
  PublicationTheme,
  CoverStyle,
} from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Supabase admin client
// Service role key required — this route writes to publications
// and reads from capsules, phases, and contributions server-side.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// SECTION 1B — Layout reconciliation
// Called every time init runs against an existing layout_config.
// Adds missing sections without disturbing organiser customisations.
// ============================================================

async function reconcileLayoutConfig(
  existing: LayoutConfig,
  capsule_id: string
): Promise<LayoutConfig> {
  let sections = [...existing.sections];
  const typeSet = new Set(sections.map((s: { type: string }) => s.type));

  // ── 0. Remove retired section types ───────────────────────
  // official_photography and guest_captures are auto-included
  // by the render page — they must not appear as stored sections
  sections = sections.filter(
    (s: { type: string }) => 
      s.type !== 'who_attended' &&
      s.type !== 'official_photography' &&
      s.type !== 'guest_captures'
  );

  // ── 1. Add world_map if missing ───────────────────────────
  if (!typeSet.has('world_map')) {
    const profileIdx = sections.findIndex((s: { type: string }) => s.type === 'honouree_profile');
    const insertAt = profileIdx >= 0 ? profileIdx + 1 : 1;
    sections.splice(insertAt, 0, {
      id:      'section_world_map',
      type:    'world_map',
      enabled: true,
    });
  }

  // ── 2. Fetch current phases and gallery items ──────────────
  const [phasesResult, photosResult] = await Promise.all([
    adminClient
      .from('capsule_phases')
      .select('id, name, event_date')
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
    adminClient
      .from('gallery_items')
      .select('id, phase_id, image_url, caption, width_px, height_px, aspect_ratio, created_at, approved')
      .eq('capsule_id', capsule_id)
      .eq('approved', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ]);

  const phases = phasesResult.data ?? [];
  const allPhotos = photosResult.data ?? [];

  if (phases.length > 0) {
    const existingPhaseIds = new Set(
      (sections as Array<{ type: string; phase_id?: string }>)
        .filter(s => s.type === 'phase_photos')
        .map(s => s.phase_id)
    );

    // ── 2a. Rebuild slots for existing AUTO phase sections ────
    // This ensures new photos added since last generation appear
    sections = sections.map(s => {
      if (s.type !== 'phase_photos') return s;
      const phaseSection = s as unknown as { phase_id: string; arrangement_source?: string };
      // Only rebuild auto-arranged sections — never touch manual ones
      if (phaseSection.arrangement_source === 'manual') return s;
      const phase = phases.find((p: { id: string }) => p.id === phaseSection.phase_id);
      if (!phase) return s;
      // Rebuild with current gallery_items
      return buildPhaseSection(phase, allPhotos) as unknown as typeof s;
    });

    // ── 2b. Add sections for brand new phases ────────────────
    const missingPhases = (phases as Array<{ id: string; name: string; event_date: string | null }>)
      .filter(p => !existingPhaseIds.has(p.id));

    if (missingPhases.length > 0) {
      const lastPhaseIdx = sections.reduce(
        (last: number, s: { type: string }, i: number) =>
          s.type === 'phase_photos' ? i : last,
        -1
      );
      const tributesIdx = sections.findIndex(
        (s: { type: string }) => s.type === 'tributes'
      );
      const insertAt =
        lastPhaseIdx >= 0
          ? lastPhaseIdx + 1
          : tributesIdx >= 0
          ? tributesIdx + 1
          : sections.length - 1;

      missingPhases.forEach(
        (phase: { id: string; name: string; event_date: string | null }, i: number) => {
          const built = buildPhaseSection(phase, allPhotos);
          sections.splice(insertAt + i, 0, built as unknown as typeof sections[number]);
        }
      );
    }
  }

  // ── 3. Ensure closing_message is always last ──────────────
  const closingIdx = sections.findIndex(
    (s: { type: string }) => s.type === 'closing_message'
  );
  if (closingIdx >= 0 && closingIdx !== sections.length - 1) {
    const [closing] = sections.splice(closingIdx, 1);
    sections.push(closing);
  }

  return { ...existing, sections };
}
// ============================================================
// SECTION 2 — Route handler
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {

  // ── 2.1  Parse and validate request body ──────────────────

  let body: PublicationInitRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 }
    );
  }

  const { capsule_id } = body;

  if (!capsule_id || typeof capsule_id !== 'string' || capsule_id.trim() === '') {
    return NextResponse.json(
      { error: 'capsule_id is required and must be a non-empty string.' },
      { status: 400 }
    );
  }


  // ── 2.2  Check for existing publication with layout_config ─
  //
  // maybeSingle() returns null (not an error) if no row exists.
  // This is the fast path — most calls after first open hit this branch.

  const { data: existing, error: fetchError } = await adminClient
    .from('publications')
    .select('id, layout_config, generation_status')
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[publication/init] fetch existing:', fetchError.message);
    return NextResponse.json(
      { error: 'Failed to check existing publication.' },
      { status: 500 }
    );
  }

  if (existing?.layout_config) {
    // Layout exists — run reconciliation to pick up new content
    // (new phases, world_map section, appreciation reposition, etc.)
    // This is safe to call on every editor open — it only adds missing
    // sections and never removes or reorders organiser-customised ones.
    const existingConfig = existing.layout_config as LayoutConfig;
    const reconciledConfig = await reconcileLayoutConfig(
      existingConfig,
      capsule_id
    );

    // Only write back if something actually changed
    const changed = JSON.stringify(reconciledConfig) !== JSON.stringify(existingConfig);
    if (changed) {
      await adminClient
        .from('publications')
        .update({
          layout_config: reconciledConfig,
          updated_at:    new Date().toISOString(),
        })
        .eq('id', existing.id);
    }

    const response: PublicationInitResponse = {
      layout_config: reconciledConfig,
      source: 'existing',
      pub_id: existing.id,
    };
    return NextResponse.json(response, { status: 200 });
  }


  // ── 2.3  Fetch capsule, phases, and contributions in parallel ─
  //
  // All three are needed by generateAutoArrangement().
  // Parallel fetch minimises latency before the algorithm runs.

  const [capsuleRes, phasesRes, contribsRes] = await Promise.all([
    adminClient
      .from('capsules')
      .select('theme, cover_style, event_type, community_id')
      .eq('id', capsule_id)
      .single(),

    adminClient
      .from('capsule_phases')
      .select('id, name, event_date')
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),

    adminClient
      .from('contributions')
      .select('id, created_at')
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ]);

  if (capsuleRes.error) {
    console.error('[publication/init] capsule fetch:', capsuleRes.error.message);
    return NextResponse.json(
      { error: 'Capsule not found.' },
      { status: 404 }
    );
  }

  const capsule  = capsuleRes.data;
  const phases   = phasesRes.data   ?? [];
  const contribs = contribsRes.data ?? [];


  // ── 2.4  Run the auto-arrangement algorithm ────────────────
  //
  // generateAutoArrangement() fetches approved gallery photos from
  // Supabase internally (it needs aspect_ratio for slot decisions).
  // It returns a complete, ready-to-save LayoutConfig.

  let layoutConfig: LayoutConfig;
  try {
    layoutConfig = await generateAutoArrangement(capsule_id, {
      phases,
      contributions: contribs,
      theme:        (capsule.theme       as PublicationTheme) ?? 'classic',
      cover_style:  (capsule.cover_style as CoverStyle)       ?? 'full_bleed',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[publication/init] auto-arrangement:', msg);
    return NextResponse.json(
      { error: `Auto-arrangement failed: ${msg}` },
      { status: 500 }
    );
  }


  // ── 2.5  Upsert publication record ────────────────────────
  //
  // Upsert on capsule_id handles two edge cases cleanly:
  //   a) No row yet → INSERT
  //   b) Row exists but layout_config is null → UPDATE
  //   c) Race condition (two editor tabs open simultaneously) →
  //      last write wins; both calls return the same layout anyway
  //      because the algorithm is deterministic.
  //
  // The `theme` and `cover_style` columns are denormalised from
  // layout_config for easier LCAdmin querying without parsing JSONB.

  const now = new Date().toISOString();

  const { data: pub, error: upsertError } = await adminClient
    .from('publications')
    .upsert(
      {
        capsule_id,
        community_id:        capsule.community_id ?? null,
        layout_config:       layoutConfig,
        arrangement_source:  'auto',
        generation_status:   'idle',
        theme:               layoutConfig.theme,
        cover_style:         layoutConfig.cover_style,
        version:             1,
        created_at:          now,
        updated_at:          now,
      },
      { onConflict: 'capsule_id' }
    )
    .select('id, layout_config')
    .single();

  if (upsertError) {
    console.error('[publication/init] upsert:', upsertError.message);
    return NextResponse.json(
      { error: `Failed to save publication: ${upsertError.message}` },
      { status: 500 }
    );
  }


  // ── 2.6  Return generated layout ──────────────────────────

  const response: PublicationInitResponse = {
    layout_config: (pub.layout_config as LayoutConfig) ?? layoutConfig,
    source: 'generated',
    pub_id: pub.id,
  };

  return NextResponse.json(response, { status: 201 });
}


// ============================================================
// SECTION 3 — Block non-POST methods
// ============================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
