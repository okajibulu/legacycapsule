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
import { generateAutoArrangement } from '@/lib/publication/autoArrange';
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
    // Layout already exists — return it immediately, no algorithm needed.
    const response: PublicationInitResponse = {
      layout_config: existing.layout_config as LayoutConfig,
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
